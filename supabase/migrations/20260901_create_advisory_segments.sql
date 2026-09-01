-- ==============================================================================
-- Migration: 20260901_create_advisory_segments.sql
-- Description: Creates the advisory_segments table, adds dynamic content fields (use_cases,
--              audience, advisor_types, icon, accent), seeds initial segments, maps advisor relationships,
--              and configures Row Level Security (RLS) for public read & admin write.
-- ==============================================================================

-- 1. Enable UUID extension if not present
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create advisory_segments table
CREATE TABLE IF NOT EXISTS public.advisory_segments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    short_description TEXT,
    description TEXT,
    tagline TEXT,
    icon TEXT DEFAULT 'Sparkles',
    accent TEXT DEFAULT '#8052ff',
    badge TEXT DEFAULT 'Audited Specialists',
    use_cases JSONB DEFAULT '[]'::jsonb,
    audience TEXT,
    advisor_types JSONB DEFAULT '[]'::jsonb,
    what_to_expect JSONB DEFAULT '[]'::jsonb,
    responsible_note TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Indexes for fast seeker queries and ordering
CREATE INDEX IF NOT EXISTS idx_advisory_segments_active_order 
    ON public.advisory_segments (is_active, display_order ASC);
CREATE INDEX IF NOT EXISTS idx_advisory_segments_slug 
    ON public.advisory_segments (slug);

-- 4. Automatic updated_at timestamp trigger
CREATE OR REPLACE FUNCTION public.handle_advisory_segments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_advisory_segments_updated_at ON public.advisory_segments;
CREATE TRIGGER trigger_advisory_segments_updated_at
    BEFORE UPDATE ON public.advisory_segments
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_advisory_segments_updated_at();

-- 5. Seed Initial 3 Core Segments (Safe Upsert)
INSERT INTO public.advisory_segments (
    id,
    name,
    slug,
    short_description,
    tagline,
    description,
    icon,
    accent,
    badge,
    use_cases,
    audience,
    advisor_types,
    what_to_expect,
    responsible_note,
    is_active,
    display_order
) VALUES
(
    '00000000-0000-0000-0000-000000000001',
    'Relationship Advisory',
    'relationship',
    'Structured guidance for interpersonal communication, conflict resolution, and healthy partnership dynamics.',
    'Build healthier, clearer and more meaningful relationships with structured guidance from experienced relationship professionals.',
    'Whether you are navigating communication challenges, recurring conflict, changing relationship dynamics or family concerns, the right advisor can help you understand the situation and work toward clearer next steps.',
    'Heart',
    '#ffb829',
    'LMFT & Certified Mediators',
    '["Struggling with recurring conflict patterns or communication breakdowns", "Navigating a key relationship transition or pre-commitment decision", "Setting healthy boundaries and seeking neutral, objective perspective"]'::jsonb,
    'Individuals • Couples • Families',
    '["Licensed Marriage & Family Therapists (LMFT)", "Certified Gottman Method Practitioners", "Systemic Family & Interpersonal Mediators"]'::jsonb,
    '["45-minute confidential video consultation", "Objective analysis of relationship loops and communication triggers", "Practical conversation frameworks and boundary templates"]'::jsonb,
    NULL,
    true,
    1
),
(
    '00000000-0000-0000-0000-000000000002',
    'Career Advisory',
    'career',
    'High-leverage perspective on professional direction, promotion roadmap, executive leadership, and negotiations.',
    'Make clearer decisions about your professional direction, growth, leadership, and next career move.',
    'From choosing your next career move to navigating leadership, interviews or professional transitions, career advisors provide structured perspective to help you move forward with confidence.',
    'Briefcase',
    '#8052ff',
    'Executive Leaders & Directors',
    '["Deciding between career paths or evaluating high-stakes job offers", "Aiming for promotion, executive leadership, or team scaling", "Preparing for strategic interviews and negotiating compensation"]'::jsonb,
    'Professionals • Leaders • Founders',
    '["VP & C-Suite Tech Operators (Ex-Meta, Uber, Stripe)", "Group Product Managers & Engineering Directors", "Certified Executive Coaches & Compensation Strategists"]'::jsonb,
    '["1:1 diagnostic on career trajectory and positioning", "Executive resume, dossier, and promotion narrative review", "Live mock interviews and executive stakeholder pitching practice"]'::jsonb,
    NULL,
    true,
    2
),
(
    '00000000-0000-0000-0000-000000000003',
    'Mental Health Advisory',
    'mental-health',
    'Confidential conversations for stress management, emotional regulation, cognitive resilience, and life transitions.',
    'Find a trusted, confidential space for structured conversations around emotional wellbeing, stress, and resilience.',
    'Some challenges are easier to navigate with the right support. Connect with appropriately qualified professionals for conversations around stress, emotional wellbeing and personal challenges.',
    'Brain',
    '#15846e',
    'Licensed Clinical Psychologists',
    '["Dealing with persistent stress, cognitive fatigue, or burnout", "Navigating a difficult personal or professional life transition", "Looking for structured emotional grounding and reflection tools"]'::jsonb,
    'Individuals • High-Stress Roles',
    '["Licensed Clinical Psychologists (Ph.D. / Psy.D.)", "Certified Cognitive Behavioral Therapy (CBT) Practitioners", "Neuro-Resilience & Somatic Stress Regulation Specialists"]'::jsonb,
    '["Empathetic, confidential 1:1 exploratory consultations", "Evidence-based cognitive reframing and grounding protocols", "Actionable daily stress de-escalation routines"]'::jsonb,
    'Advisory sessions provide structured guidance and reflective conversations. For medical emergencies or crisis care, please contact local emergency services immediately.',
    true,
    3
)
ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    short_description = EXCLUDED.short_description,
    tagline = EXCLUDED.tagline,
    description = EXCLUDED.description,
    icon = EXCLUDED.icon,
    accent = EXCLUDED.accent,
    badge = EXCLUDED.badge,
    use_cases = EXCLUDED.use_cases,
    audience = EXCLUDED.audience,
    advisor_types = EXCLUDED.advisor_types,
    what_to_expect = EXCLUDED.what_to_expect,
    responsible_note = EXCLUDED.responsible_note,
    display_order = EXCLUDED.display_order,
    updated_at = timezone('utc'::text, now());

-- 6. Add segment_id column to advisors table if missing & backfill from categories
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'advisors' 
        AND column_name = 'segment_id'
    ) THEN
        ALTER TABLE public.advisors ADD COLUMN segment_id UUID REFERENCES public.advisory_segments(id) ON DELETE SET NULL;
        CREATE INDEX IF NOT EXISTS idx_advisors_segment_id ON public.advisors(segment_id);
    END IF;
END $$;

-- 7. Safe backfill for existing advisors pointing to categories
UPDATE public.advisors a
SET segment_id = s.id
FROM public.categories c
JOIN public.advisory_segments s ON s.slug = c.slug
WHERE a.category_id = c.id AND a.segment_id IS NULL;

-- 8. Add segment_id to bookings table for historical preservation if missing
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'bookings' 
        AND column_name = 'segment_id'
    ) THEN
        ALTER TABLE public.bookings ADD COLUMN segment_id UUID REFERENCES public.advisory_segments(id) ON DELETE SET NULL;
        CREATE INDEX IF NOT EXISTS idx_bookings_segment_id ON public.bookings(segment_id);
    END IF;
END $$;

-- 9. Enable Row Level Security (RLS)
ALTER TABLE public.advisory_segments ENABLE ROW LEVEL SECURITY;

-- 10. Public / Seeker Read Policy (Active segments readable by anyone)
DROP POLICY IF EXISTS "Public can view active advisory segments" ON public.advisory_segments;
CREATE POLICY "Public can view active advisory segments"
    ON public.advisory_segments
    FOR SELECT
    USING (is_active = true OR auth.role() = 'authenticated');

-- 11. Admin Full Access Policy
DROP POLICY IF EXISTS "Admins can manage advisory segments" ON public.advisory_segments;
CREATE POLICY "Admins can manage advisory segments"
    ON public.advisory_segments
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- ==============================================================================
-- Migration: 20260903_create_mentor_segments_discovery.sql
-- Purpose: Creates the mentor_segments many-to-many join table (Mentor <-> Segment)
--          as the authoritative source of truth for which advisory domain(s) a
--          mentor is approved to serve. Required by the Seeker Discovery Experience.
--          This is a minimal, discovery-scoped slice of the intended
--          20260903_mentor_profile_architecture.sql migration, intentionally
--          avoiding the offerings/booking_requests/booking_audit_log tables so that
--          booking/payment/messaging architecture is left untouched.
-- ==============================================================================

-- 1. ENUM (idempotent)
DO $$ BEGIN
  CREATE TYPE mentor_segment_status AS ENUM ('active', 'inactive', 'archived');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. JOIN TABLE (idempotent)
CREATE TABLE IF NOT EXISTS public.mentor_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id UUID NOT NULL REFERENCES public.mentors(id) ON DELETE CASCADE,
  segment_id UUID NOT NULL REFERENCES public.advisory_segments(id) ON DELETE CASCADE,
  status mentor_segment_status NOT NULL DEFAULT 'active',
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE (mentor_id, segment_id)
);

CREATE INDEX IF NOT EXISTS idx_mentor_segments_mentor ON public.mentor_segments(mentor_id);
CREATE INDEX IF NOT EXISTS idx_mentor_segments_segment ON public.mentor_segments(segment_id);
CREATE INDEX IF NOT EXISTS idx_mentor_segments_status ON public.mentor_segments(status);

-- 3. updated_at trigger
DROP TRIGGER IF EXISTS trigger_mentor_segments_updated_at ON public.mentor_segments;
CREATE TRIGGER trigger_mentor_segments_updated_at BEFORE UPDATE ON public.mentor_segments FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 4. ROW LEVEL SECURITY
ALTER TABLE public.mentor_segments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Active mentor segments are viewable by everyone" ON public.mentor_segments;
CREATE POLICY "Active mentor segments are viewable by everyone" ON public.mentor_segments
  FOR SELECT USING (status = 'active');

DROP POLICY IF EXISTS "Mentors can manage own mentor_segments" ON public.mentor_segments;
CREATE POLICY "Mentors can manage own mentor_segments" ON public.mentor_segments
  FOR ALL USING (auth.uid() = mentor_id);

DROP POLICY IF EXISTS "Admins can manage all mentor_segments" ON public.mentor_segments;
CREATE POLICY "Admins can manage all mentor_segments" ON public.mentor_segments
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

-- 5. SEED: backfill mentor_segments from the legacy mentor segment columns.
--    These columns are now deprecated as the source of truth, but their existing
--    values are used one-time to populate the join table.

-- 5a. Primary segment via mentors.segment_id (display_order 0)
INSERT INTO public.mentor_segments (mentor_id, segment_id, status, display_order)
SELECT m.id, m.segment_id, 'active', 0
FROM public.mentors m
WHERE m.segment_id IS NOT NULL
ON CONFLICT (mentor_id, segment_id) DO NOTHING;

-- 5b. primary_segment_id when it differs from segment_id (display_order 1)
INSERT INTO public.mentor_segments (mentor_id, segment_id, status, display_order)
SELECT m.id, m.primary_segment_id, 'active', 1
FROM public.mentors m
WHERE m.primary_segment_id IS NOT NULL
  AND m.primary_segment_id <> m.segment_id
ON CONFLICT (mentor_id, segment_id) DO NOTHING;

-- 5c. verified_categories slugs resolve to advisory_segments ids
INSERT INTO public.mentor_segments (mentor_id, segment_id, status, display_order)
SELECT m.id, s.id, 'active', 1
FROM public.mentors m
CROSS JOIN LATERAL unnest(m.verified_categories) AS vc(slug)
JOIN public.advisory_segments s ON s.slug = vc.slug
ON CONFLICT (mentor_id, segment_id) DO NOTHING;

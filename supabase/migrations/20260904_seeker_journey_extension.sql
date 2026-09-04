-- ==============================================================================
-- Migration: 20260904_seeker_journey_extension.sql
-- Description: Adds seeker goal model, action items, and session outcome
--              architecture to support the post-booking journey:
--              PROBLEM → ADVISOR → SESSION → OUTCOME → ACTION PLAN → GOAL PROGRESS
-- ==============================================================================

-- 1. GOALS TABLE
CREATE TABLE IF NOT EXISTS public.goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seeker_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    domain TEXT NOT NULL DEFAULT 'general',
    description TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    target_checkpoint TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_goals_seeker ON public.goals(seeker_id);
CREATE INDEX IF NOT EXISTS idx_goals_status ON public.goals(status);
CREATE INDEX IF NOT EXISTS idx_goals_domain ON public.goals(domain);

-- 2. ACTION ITEMS TABLE
CREATE TABLE IF NOT EXISTS public.action_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seeker_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    goal_id UUID REFERENCES public.goals(id) ON DELETE SET NULL,
    booking_id TEXT REFERENCES public.bookings(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    due_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_action_items_seeker ON public.action_items(seeker_id);
CREATE INDEX IF NOT EXISTS idx_action_items_goal ON public.action_items(goal_id);
CREATE INDEX IF NOT EXISTS idx_action_items_booking ON public.action_items(booking_id);
CREATE INDEX IF NOT EXISTS idx_action_items_status ON public.action_items(status);

-- 3. SESSION OUTCOMES TABLE
CREATE TABLE IF NOT EXISTS public.session_outcomes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE UNIQUE,
    seeker_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    mentor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    summary TEXT,
    key_observations TEXT[] NOT NULL DEFAULT '{}',
    recommended_actions TEXT[] NOT NULL DEFAULT '{}',
    next_checkpoint DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_session_outcomes_booking ON public.session_outcomes(booking_id);
CREATE INDEX IF NOT EXISTS idx_session_outcomes_seeker ON public.session_outcomes(seeker_id);
CREATE INDEX IF NOT EXISTS idx_session_outcomes_mentor ON public.session_outcomes(mentor_id);

-- 4. TRIGGERS FOR updated_at
DROP TRIGGER IF EXISTS trigger_goals_updated_at ON public.goals;
CREATE TRIGGER trigger_goals_updated_at BEFORE UPDATE ON public.goals FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_action_items_updated_at ON public.action_items;
CREATE TRIGGER trigger_action_items_updated_at BEFORE UPDATE ON public.action_items FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_session_outcomes_updated_at ON public.session_outcomes;
CREATE TRIGGER trigger_session_outcomes_updated_at BEFORE UPDATE ON public.session_outcomes FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 5. ROW LEVEL SECURITY (RLS) POLICIES

-- goals
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Seekers can manage own goals" ON public.goals;
CREATE POLICY "Seekers can manage own goals" ON public.goals
FOR ALL USING (auth.uid() = seeker_id);

DROP POLICY IF EXISTS "Admins can view all goals" ON public.goals;
CREATE POLICY "Admins can view all goals" ON public.goals
FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- action_items
ALTER TABLE public.action_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Seekers can manage own action items" ON public.action_items;
CREATE POLICY "Seekers can manage own action items" ON public.action_items
FOR ALL USING (auth.uid() = seeker_id);

DROP POLICY IF EXISTS "Admins can view all action items" ON public.action_items;
CREATE POLICY "Admins can view all action items" ON public.action_items
FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- session_outcomes
ALTER TABLE public.session_outcomes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Session outcome participants can view" ON public.session_outcomes;
CREATE POLICY "Session outcome participants can view" ON public.session_outcomes
FOR SELECT USING (
    auth.uid() = seeker_id
    OR auth.uid() = mentor_id
    OR EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

DROP POLICY IF EXISTS "Mentors can create session outcomes" ON public.session_outcomes;
CREATE POLICY "Mentors can create session outcomes" ON public.session_outcomes
FOR INSERT WITH CHECK (
    auth.uid() = mentor_id
    AND EXISTS (
        SELECT 1 FROM public.bookings
        WHERE bookings.id = session_outcomes.booking_id
        AND bookings.mentor_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Mentors can update own session outcomes" ON public.session_outcomes;
CREATE POLICY "Mentors can update own session outcomes" ON public.session_outcomes
FOR UPDATE USING (auth.uid() = mentor_id);

DROP POLICY IF EXISTS "Admins can manage all session outcomes" ON public.session_outcomes;
CREATE POLICY "Admins can manage all session outcomes" ON public.session_outcomes
FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

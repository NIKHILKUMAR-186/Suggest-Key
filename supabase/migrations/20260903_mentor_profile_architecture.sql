-- ==============================================================================
-- Migration: 20260903_mentor_profile_architecture.sql
-- Description: Implements Mentor Profile, Multi-Segment Mentor, Offering, and
--              Booking Request architecture. Adds many-to-many mentor_segments,
--              offerings table (replaces gigs for new bookings), booking_requests
--              with lifecycle states, and audit logging.
-- ==============================================================================

-- 1. NEW ENUMS
DO $$ BEGIN
    CREATE TYPE mentor_segment_status AS ENUM ('active', 'inactive', 'archived');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE booking_request_status AS ENUM ('pending', 'accepted', 'declined', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE offering_duration AS ENUM (15, 30, 45, 60);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. MENTOR_SEGMENTS JOIN TABLE (Many-to-Many: Mentor ↔ Segment)
CREATE TABLE IF NOT EXISTS public.mentor_segments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mentor_id UUID NOT NULL REFERENCES public.mentors(id) ON DELETE CASCADE,
    segment_id UUID NOT NULL REFERENCES public.advisory_segments(id) ON DELETE CASCADE,
    status mentor_segment_status NOT NULL DEFAULT 'active',
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(mentor_id, segment_id)
);

CREATE INDEX IF NOT EXISTS idx_mentor_segments_mentor ON public.mentor_segments(mentor_id);
CREATE INDEX IF NOT EXISTS idx_mentor_segments_segment ON public.mentor_segments(segment_id);
CREATE INDEX IF NOT EXISTS idx_mentor_segments_status ON public.mentor_segments(status);

-- 3. OFFERINGS TABLE (Replaces gigs for new bookings — explicit offerings per segment)
CREATE TABLE IF NOT EXISTS public.offerings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mentor_segment_id UUID NOT NULL REFERENCES public.mentor_segments(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT NOT NULL,
    duration_minutes INT NOT NULL CHECK (duration_minutes IN (15, 30, 45, 60)),
    price_inr INT NOT NULL DEFAULT 0 CHECK (price_inr >= 0),
    deliverables TEXT[] NOT NULL DEFAULT '{}',
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_offerings_mentor_segment ON public.offerings(mentor_segment_id);
CREATE INDEX IF NOT EXISTS idx_offerings_available ON public.offerings(is_available);
CREATE INDEX IF NOT EXISTS idx_offerings_price ON public.offerings(price_inr);

-- 4. BOOKING_REQUESTS TABLE (Lifecycle: pending → accepted/declined/cancelled)
CREATE TABLE IF NOT EXISTS public.booking_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    offering_id UUID NOT NULL REFERENCES public.offerings(id) ON DELETE CASCADE,
    mentor_id UUID NOT NULL REFERENCES public.mentors(id) ON DELETE CASCADE,
    seeker_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status booking_request_status NOT NULL DEFAULT 'pending',
    proposed_start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    proposed_end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    confirmed_start_time TIMESTAMP WITH TIME ZONE,
    confirmed_end_time TIMESTAMP WITH TIME ZONE,
    meeting_url TEXT,
    message TEXT,
    notes TEXT,
    amount_inr INT NOT NULL DEFAULT 0,
    platform_fee_inr INT DEFAULT 0,
    mentor_payout_inr INT DEFAULT 0,
    is_anonymous BOOLEAN DEFAULT FALSE,
    is_demo BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_booking_requests_seeker ON public.booking_requests(seeker_id);
CREATE INDEX IF NOT EXISTS idx_booking_requests_mentor ON public.booking_requests(mentor_id);
CREATE INDEX IF NOT EXISTS idx_booking_requests_status ON public.booking_requests(status);
CREATE INDEX IF NOT EXISTS idx_booking_requests_offering ON public.booking_requests(offering_id);
CREATE INDEX IF NOT EXISTS idx_booking_requests_proposed_start ON public.booking_requests(proposed_start_time);

-- Exclusion constraint to prevent mentor double-booking on confirmed requests
ALTER TABLE public.booking_requests
ADD CONSTRAINT no_overlap_mentor_booking_request
EXCLUDE USING gist (
    mentor_id WITH =,
    tstzrange(proposed_start_time, proposed_end_time) WITH &&
) WHERE (status IN ('pending', 'accepted'));

-- 5. BOOKING_AUDIT_LOG TABLE
CREATE TABLE IF NOT EXISTS public.booking_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_request_id UUID NOT NULL REFERENCES public.booking_requests(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    actor_id UUID NOT NULL REFERENCES public.profiles(id),
    from_status booking_request_status,
    to_status booking_request_status,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_booking_audit_request ON public.booking_audit_log(booking_request_id);
CREATE INDEX IF NOT EXISTS idx_booking_audit_actor ON public.booking_audit_log(actor_id);
CREATE INDEX IF NOT EXISTS idx_booking_audit_action ON public.booking_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_booking_audit_created ON public.booking_audit_log(created_at);

-- 6. TRIGGERS FOR updated_at
DROP TRIGGER IF EXISTS trigger_mentor_segments_updated_at ON public.mentor_segments;
CREATE TRIGGER trigger_mentor_segments_updated_at BEFORE UPDATE ON public.mentor_segments FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_offerings_updated_at ON public.offerings;
CREATE TRIGGER trigger_offerings_updated_at BEFORE UPDATE ON public.offerings FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_booking_requests_updated_at ON public.booking_requests;
CREATE TRIGGER trigger_booking_requests_updated_at BEFORE UPDATE ON public.booking_requests FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 7. ROW LEVEL SECURITY (RLS) POLICIES FOR NEW TABLES

-- mentor_segments
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

-- offerings
ALTER TABLE public.offerings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Available offerings are viewable by everyone" ON public.offerings;
CREATE POLICY "Available offerings are viewable by everyone" ON public.offerings
FOR SELECT USING (is_available = true);

DROP POLICY IF EXISTS "Mentors can manage own offerings" ON public.offerings;
CREATE POLICY "Mentors can manage own offerings" ON public.offerings
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.mentor_segments ms
        WHERE ms.id = offerings.mentor_segment_id
        AND ms.mentor_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Admins can manage all offerings" ON public.offerings;
CREATE POLICY "Admins can manage all offerings" ON public.offerings
FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- booking_requests
ALTER TABLE public.booking_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Booking request participants can view" ON public.booking_requests;
CREATE POLICY "Booking request participants can view" ON public.booking_requests
FOR SELECT USING (
    auth.uid() = seeker_id
    OR auth.uid() = mentor_id
    OR EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

DROP POLICY IF EXISTS "Seekers can create booking requests" ON public.booking_requests;
CREATE POLICY "Seekers can create booking requests" ON public.booking_requests
FOR INSERT WITH CHECK (auth.uid() = seeker_id);

DROP POLICY IF EXISTS "Booking request participants can update" ON public.booking_requests;
CREATE POLICY "Booking request participants can update" ON public.booking_requests
FOR UPDATE USING (
    auth.uid() = seeker_id
    OR auth.uid() = mentor_id
    OR EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

DROP POLICY IF EXISTS "Booking status transitions enforce authorization" ON public.booking_requests;
CREATE POLICY "Booking status transitions enforce authorization" ON public.booking_requests
FOR UPDATE USING (
    CASE
        WHEN NEW.status = 'accepted' THEN auth.uid() = mentor_id
        WHEN NEW.status = 'declined' THEN auth.uid() = mentor_id
        WHEN NEW.status = 'cancelled' THEN auth.uid() = seeker_id OR auth.uid() = mentor_id
        ELSE FALSE
    END
);

-- booking_audit_log
ALTER TABLE public.booking_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Booking audit log viewers can access" ON public.booking_audit_log;
CREATE POLICY "Booking audit log viewers can access" ON public.booking_audit_log
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.booking_requests br
        WHERE br.id = booking_audit_log.booking_request_id
        AND (
            br.seeker_id = auth.uid()
            OR br.mentor_id = auth.uid()
            OR EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
        )
    )
);

DROP POLICY IF EXISTS "Authorized actors can create audit log" ON public.booking_audit_log;
CREATE POLICY "Authorized actors can create audit log" ON public.booking_audit_log
FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.booking_requests br
        WHERE br.id = booking_audit_log.booking_request_id
        AND (
            br.seeker_id = auth.uid()
            OR br.mentor_id = auth.uid()
            OR EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
        )
    )
);

-- 8. FUNCTION: Create booking request with audit logging
CREATE OR REPLACE FUNCTION public.create_booking_request(
    p_offering_id UUID,
    p_proposed_start_time TIMESTAMP WITH TIME ZONE,
    p_proposed_end_time TIMESTAMP WITH TIME ZONE,
    p_message TEXT DEFAULT NULL,
    p_is_anonymous BOOLEAN DEFAULT FALSE
) RETURNS JSON LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
    v_offering offerings%ROWTYPE;
    v_mentor_segment mentor_segments%ROWTYPE;
    v_booking_request_id UUID;
    v_amount_inr INT;
    v_platform_fee_inr INT;
    v_mentor_payout_inr INT;
BEGIN
    -- SECURITY: Validate that the caller is an authenticated seeker
    IF auth.uid() IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'NOT_AUTHENTICATED', 'message', 'Authentication required.');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid() AND profiles.role = 'seeker'
    ) THEN
        RETURN json_build_object('success', false, 'error', 'NOT_SEEKER', 'message', 'Only seekers can create booking requests.');
    END IF;

    -- Fetch offering with mentor info
    SELECT o.* INTO v_offering
    FROM offerings o
    WHERE o.id = p_offering_id AND o.is_available = true;

    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'OFFERING_NOT_FOUND', 'message', 'The selected offering was not found or is unavailable.');
    END IF;

    -- Fetch mentor_segment to get mentor_id
    SELECT ms.* INTO v_mentor_segment
    FROM mentor_segments ms
    WHERE ms.id = v_offering.mentor_segment_id AND ms.status = 'active';

    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'SEGMENT_INACTIVE', 'message', 'The mentor segment is not currently active.');
    END IF;

    -- Check mentor is approved
    IF NOT EXISTS (
        SELECT 1 FROM public.mentors WHERE id = v_mentor_segment.mentor_id AND verification_status = 'approved'
    ) THEN
        RETURN json_build_object('success', false, 'error', 'MENTOR_NOT_APPROVED', 'message', 'Mentor is not currently approved for bookings.');
    END IF;

    -- Calculate fees (15% platform fee)
    v_amount_inr := v_offering.price_inr;
    v_platform_fee_inr := ROUND(v_offering.price_inr * 0.15);
    v_mentor_payout_inr := v_amount_inr - v_platform_fee_inr;

    -- Insert booking request — seeker_id comes from auth.uid(), not a parameter
    INSERT INTO public.booking_requests (
        offering_id,
        mentor_id,
        seeker_id,
        proposed_start_time,
        proposed_end_time,
        message,
        is_anonymous,
        amount_inr,
        platform_fee_inr,
        mentor_payout_inr
    ) VALUES (
        p_offering_id,
        v_mentor_segment.mentor_id,
        auth.uid(),
        p_proposed_start_time,
        p_proposed_end_time,
        p_message,
        p_is_anonymous,
        v_amount_inr,
        v_platform_fee_inr,
        v_mentor_payout_inr
    )
    RETURNING id INTO v_booking_request_id;

    -- Log creation
    INSERT INTO public.booking_audit_log (
        booking_request_id,
        action,
        actor_id,
        from_status,
        to_status
    ) VALUES (
        v_booking_request_id,
        'created',
        auth.uid(),
        NULL,
        'pending'
    );

    RETURN json_build_object(
        'success', true,
        'booking_request_id', v_booking_request_id,
        'seeker_id', auth.uid()
    );
EXCEPTION
    WHEN exclusion_violation THEN
        RETURN json_build_object(
            'success', false,
            'error', 'SLOT_CONFLICT',
            'message', 'This time slot conflicts with another booking request or confirmed booking.'
        );
END;
$$;

-- 9. FUNCTION: Update booking request status with audit logging
CREATE OR REPLACE FUNCTION public.update_booking_request_status(
    p_booking_request_id UUID,
    p_new_status booking_request_status,
    p_confirmed_start_time TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    p_confirmed_end_time TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    p_meeting_url TEXT DEFAULT NULL,
    p_notes TEXT DEFAULT NULL
) RETURNS JSON LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
    v_old_status booking_request_status;
    v_allowed BOOLEAN;
    v_caller_role TEXT;
BEGIN
    -- SECURITY: Validate authentication
    IF auth.uid() IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'NOT_AUTHENTICATED', 'message', 'Authentication required.');
    END IF;

    -- Get caller's role
    SELECT role INTO v_caller_role
    FROM public.profiles
    WHERE id = auth.uid();

    -- Get current status
    SELECT status INTO v_old_status
    FROM booking_requests
    WHERE id = p_booking_request_id;

    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'NOT_FOUND', 'message', 'Booking request not found.');
    END IF;

    -- Check authorization and enforce valid state transitions based on actor role
    v_allowed := FALSE;

    IF p_new_status = 'accepted' THEN
        -- Only mentor can accept a pending request
        IF v_old_status = 'pending' AND auth.uid() = (SELECT mentor_id FROM booking_requests WHERE id = p_booking_request_id) THEN
            v_allowed := TRUE;
        END IF;
    ELSIF p_new_status = 'declined' THEN
        -- Only mentor can decline a pending request
        IF v_old_status = 'pending' AND auth.uid() = (SELECT mentor_id FROM booking_requests WHERE id = p_booking_request_id) THEN
            v_allowed := TRUE;
        END IF;
    ELSIF p_new_status = 'cancelled' THEN
        -- Seeker can cancel a pending request; mentor can cancel an accepted request
        IF v_old_status = 'pending' AND auth.uid() = (SELECT seeker_id FROM booking_requests WHERE id = p_booking_request_id) THEN
            v_allowed := TRUE;
        ELSIF v_old_status = 'accepted' AND auth.uid() = (SELECT mentor_id FROM booking_requests WHERE id = p_booking_request_id) THEN
            v_allowed := TRUE;
        END IF;
    END IF;

    -- Admin can cancel any non-terminal request
    IF NOT v_allowed AND v_caller_role = 'admin' THEN
        IF v_old_status IN ('pending', 'accepted') AND p_new_status = 'cancelled' THEN
            v_allowed := TRUE;
        END IF;
    END IF;

    IF NOT v_allowed THEN
        RETURN json_build_object('success', false, 'error', 'NOT_AUTHORIZED', 'message', 'You are not authorized to perform this action.');
    END IF;

    -- If accepting, set confirmed times and meeting URL
    IF p_new_status = 'accepted' THEN
        UPDATE booking_requests
        SET status = p_new_status,
            confirmed_start_time = COALESCE(p_confirmed_start_time, proposed_start_time),
            confirmed_end_time = COALESCE(p_confirmed_end_time, proposed_end_time),
            meeting_url = COALESCE(p_meeting_url, meeting_url),
            notes = COALESCE(p_notes, notes),
            updated_at = timezone('utc'::text, now())
        WHERE id = p_booking_request_id;
    ELSE
        -- For non-accept transitions, just update status
        UPDATE booking_requests
        SET status = p_new_status,
            notes = COALESCE(p_notes, notes),
            updated_at = timezone('utc'::text, now())
        WHERE id = p_booking_request_id;
    END IF;

    -- Log the transition
    INSERT INTO public.booking_audit_log (
        booking_request_id,
        action,
        actor_id,
        from_status,
        to_status,
        metadata
    ) VALUES (
        p_booking_request_id,
        CASE p_new_status
            WHEN 'accepted' THEN 'accepted'
            WHEN 'declined' THEN 'declined'
            WHEN 'cancelled' THEN 'cancelled'
            ELSE p_new_status::TEXT
        END,
        auth.uid(),
        v_old_status,
        p_new_status
    );

    RETURN json_build_object(
        'success', true,
        'booking_request_id', p_booking_request_id,
        'new_status', p_new_status,
        'old_status', v_old_status
    );
END;
$$;

-- 10. GRANT / REVOKE ON RPC FUNCTIONS
REVOKE ALL ON FUNCTION public.create_booking_request FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_booking_request TO authenticated;

REVOKE ALL ON FUNCTION public.update_booking_request_status FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_booking_request_status TO authenticated;

-- 11. MIGRATE EXISTING DATA FROM mentors.segment_id TO mentor_segments
INSERT INTO public.mentor_segments (mentor_id, segment_id, status, display_order)
SELECT
    m.id AS mentor_id,
    m.segment_id AS segment_id,
    'active'::mentor_segment_status AS status,
    0 AS display_order
FROM public.mentors m
WHERE m.segment_id IS NOT NULL
ON CONFLICT (mentor_id, segment_id) DO NOTHING;

-- Also migrate primary_segment_id if different
INSERT INTO public.mentor_segments (mentor_id, segment_id, status, display_order)
SELECT
    m.id AS mentor_id,
    m.primary_segment_id AS segment_id,
    'active'::mentor_segment_status AS status,
    1 AS display_order
FROM public.mentors m
WHERE m.primary_segment_id IS NOT NULL AND m.primary_segment_id != m.segment_id
ON CONFLICT (mentor_id, segment_id) DO NOTHING;

-- Migrate existing gigs to offerings
INSERT INTO public.offerings (
    mentor_segment_id,
    title,
    slug,
    description,
    duration_minutes,
    price_inr,
    deliverables,
    is_available
)
SELECT
    ms.id AS mentor_segment_id,
    g.title,
    g.slug,
    g.description,
    g.duration_minutes,
    g.price_inr,
    g.deliverables,
    g.is_published AS is_available
FROM public.gigs g
JOIN public.mentor_segments ms ON ms.mentor_id = g.mentor_id AND ms.segment_id = g.segment_id
WHERE g.is_published = true;

-- Note: Gigs without a matching mentor_segment are skipped (will need manual migration)

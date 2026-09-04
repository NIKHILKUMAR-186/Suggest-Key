-- ==============================================================================
-- Migration: seeker_booking_flow
-- Adds seeker transaction flow: offerings, booking_requests, slot locks, RPCs.
-- Idempotent: safe to apply if any predecessor partially applied.
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Mentor segment status enum
DO $$ BEGIN
    CREATE TYPE mentor_segment_status AS ENUM ('active', 'inactive', 'archived');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Booking request status enum
DO $$ BEGIN
    CREATE TYPE booking_request_status AS ENUM ('pending', 'accepted', 'declined', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Mentor segments join table
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

-- Offerings table
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

-- Booking requests table
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

-- DB-level exclusion constraint — last line of defense
DO $$ BEGIN
    ALTER TABLE public.booking_requests
        ADD CONSTRAINT no_overlap_mentor_booking_request
        EXCLUDE USING gist (mentor_id WITH =, tstzrange(proposed_start_time, proposed_end_time) WITH &&)
        WHERE (status IN ('pending', 'accepted'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Audit log
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

-- Slot locks
CREATE TABLE IF NOT EXISTS public.booking_slot_locks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mentor_id UUID NOT NULL REFERENCES public.mentors(id) ON DELETE CASCADE,
    seeker_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    range tstzrange NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (timezone('utc'::text, now()) + INTERVAL '5 minutes'),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_booking_slot_locks_mentor
    ON public.booking_slot_locks USING gist (mentor_id, range);
CREATE INDEX IF NOT EXISTS idx_booking_slot_locks_expiry
    ON public.booking_slot_locks(expires_at);

CREATE INDEX IF NOT EXISTS idx_mentor_segments_mentor ON public.mentor_segments(mentor_id);
CREATE INDEX IF NOT EXISTS idx_mentor_segments_segment ON public.mentor_segments(segment_id);
CREATE INDEX IF NOT EXISTS idx_offerings_mentor_segment ON public.offerings(mentor_segment_id);
CREATE INDEX IF NOT EXISTS idx_booking_requests_seeker ON public.booking_requests(seeker_id);
CREATE INDEX IF NOT EXISTS idx_booking_requests_mentor ON public.booking_requests(mentor_id);
CREATE INDEX IF NOT EXISTS idx_booking_requests_status ON public.booking_requests(status);
CREATE INDEX IF NOT EXISTS idx_booking_requests_offering ON public.booking_requests(offering_id);
CREATE INDEX IF NOT EXISTS idx_booking_audit_request ON public.booking_audit_log(booking_request_id);

-- Trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at() RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_mentor_segments_updated_at ON public.mentor_segments;
CREATE TRIGGER trigger_mentor_segments_updated_at BEFORE UPDATE ON public.mentor_segments
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_offerings_updated_at ON public.offerings;
CREATE TRIGGER trigger_offerings_updated_at BEFORE UPDATE ON public.offerings
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_booking_requests_updated_at ON public.booking_requests;
CREATE TRIGGER trigger_booking_requests_updated_at BEFORE UPDATE ON public.booking_requests
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Seed mentor_segments from mentors.segment_id / primary_segment_id
INSERT INTO public.mentor_segments (mentor_id, segment_id, status, display_order)
SELECT m.id, m.segment_id, 'active', 0
FROM public.mentors m
WHERE m.segment_id IS NOT NULL
ON CONFLICT (mentor_id, segment_id) DO NOTHING;

INSERT INTO public.mentor_segments (mentor_id, segment_id, status, display_order)
SELECT m.id, m.primary_segment_id, 'active', 1
FROM public.mentors m
WHERE m.primary_segment_id IS NOT NULL AND m.primary_segment_id <> m.segment_id
ON CONFLICT (mentor_id, segment_id) DO NOTHING;

-- Seed offerings from gigs
INSERT INTO public.offerings (mentor_segment_id, title, slug, description, duration_minutes, price_inr, deliverables, is_available)
SELECT ms.id, g.title, g.slug, g.description, g.duration_minutes, g.price_inr, g.deliverables, g.is_published
FROM public.gigs g
JOIN public.mentor_segments ms ON ms.mentor_id = g.mentor_id AND ms.segment_id = g.segment_id
WHERE g.is_published = true
ON CONFLICT DO NOTHING;

-- RLS
ALTER TABLE public.mentor_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offerings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_slot_locks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Active mentor segments are viewable by everyone" ON public.mentor_segments;
CREATE POLICY "Active mentor segments are viewable by everyone" ON public.mentor_segments
    FOR SELECT USING (status = 'active');

DROP POLICY IF EXISTS "Mentors can manage own mentor_segments" ON public.mentor_segments;
CREATE POLICY "Mentors can manage own mentor_segments" ON public.mentor_segments
    FOR ALL USING (auth.uid() = mentor_id);

DROP POLICY IF EXISTS "Admins can manage all mentor_segments" ON public.mentor_segments;
CREATE POLICY "Admins can manage all mentor_segments" ON public.mentor_segments
    FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

DROP POLICY IF EXISTS "Available offerings are viewable by everyone" ON public.offerings;
CREATE POLICY "Available offerings are viewable by everyone" ON public.offerings
    FOR SELECT USING (is_available = true);

DROP POLICY IF EXISTS "Mentors can manage own offerings" ON public.offerings;
CREATE POLICY "Mentors can manage own offerings" ON public.offerings
    FOR ALL USING (EXISTS (SELECT 1 FROM public.mentor_segments ms WHERE ms.id = offerings.mentor_segment_id AND ms.mentor_id = auth.uid()));

DROP POLICY IF EXISTS "Admins can manage all offerings" ON public.offerings;
CREATE POLICY "Admins can manage all offerings" ON public.offerings
    FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

DROP POLICY IF EXISTS "Booking request participants can view" ON public.booking_requests;
CREATE POLICY "Booking request participants can view" ON public.booking_requests
    FOR SELECT USING (auth.uid() = seeker_id OR auth.uid() = mentor_id
        OR EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

DROP POLICY IF EXISTS "Seekers can create booking requests" ON public.booking_requests;
CREATE POLICY "Seekers can create booking requests" ON public.booking_requests
    FOR INSERT WITH CHECK (auth.uid() = seeker_id);

DROP POLICY IF EXISTS "Booking request participants can update" ON public.booking_requests;
CREATE POLICY "Booking request participants can update" ON public.booking_requests
    FOR UPDATE USING (auth.uid() = seeker_id OR auth.uid() = mentor_id
        OR EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

DROP POLICY IF EXISTS "Booking audit log viewers can access" ON public.booking_audit_log;
CREATE POLICY "Booking audit log viewers can access" ON public.booking_audit_log
    FOR SELECT USING (EXISTS (SELECT 1 FROM public.booking_requests br WHERE br.id = booking_audit_log.booking_request_id
        AND (br.seeker_id = auth.uid() OR br.mentor_id = auth.uid()
            OR EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'))));

DROP POLICY IF EXISTS "Slot lock participants can view" ON public.booking_slot_locks;
CREATE POLICY "Slot lock participants can view" ON public.booking_slot_locks
    FOR SELECT USING (auth.uid() = seeker_id OR auth.uid() = mentor_id);

DROP POLICY IF EXISTS "Seekers can create slot locks" ON public.booking_slot_locks;
CREATE POLICY "Seekers can create slot locks" ON public.booking_slot_locks
    FOR INSERT WITH CHECK (auth.uid() = seeker_id);

DROP POLICY IF EXISTS "Seekers can release own slot locks" ON public.booking_slot_locks;
CREATE POLICY "Seekers can release own slot locks" ON public.booking_slot_locks
    FOR DELETE USING (auth.uid() = seeker_id);

-- RPCs
CREATE OR REPLACE FUNCTION public.purge_expired_slot_locks()
RETURNS void LANGUAGE sql AS $$
DELETE FROM public.booking_slot_locks WHERE expires_at < timezone('utc'::text, now());
$$;

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
    v_mentor members;
    v_booking_request_id UUID;
    v_amount_inr INT;
    v_platform_fee_inr INT;
    v_mentor_payout_inr INT;
    v_caller_role TEXT;
BEGIN
    IF auth.uid() IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'NOT_AUTHENTICATED', 'message', 'Please sign in to request a session.');
    END IF;

    SELECT role INTO v_caller_role FROM public.profiles WHERE id = auth.uid();
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'PROFILE_NOT_FOUND', 'message', 'Your account profile could not be located.');
    END IF;

    IF v_caller_role <> 'seeker' THEN
        RETURN json_build_object('success', false, 'error', 'NOT_SEEKER',
            'message', CASE
                WHEN v_caller_role = 'mentor' THEN 'Mentors cannot book advisory sessions.'
                WHEN v_caller_role = 'admin' THEN 'Administrators cannot book advisory sessions.'
                ELSE 'Only seekers can create booking requests.'
            END);
    END IF;

    IF p_proposed_end_time <= p_proposed_start_time THEN
        RETURN json_build_object('success', false, 'error', 'INVALID_TIME_WINDOW',
            'message', 'The session end time must be after the start time.');
    END IF;

    IF p_proposed_start_time < timezone('utc'::text, now()) THEN
        RETURN json_build_object('success', false, 'error', 'TIME_IN_PAST',
            'message', 'Sessions cannot be booked in the past.');
    END IF;

    PERFORM public.purge_expired_slot_locks();

    SELECT o.* INTO v_offering FROM offerings o WHERE o.id = p_offering_id AND o.is_available = true;
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'OFFERING_NOT_FOUND',
            'message', 'The selected offering was not found or is unavailable.');
    END IF;

    SELECT ms.* INTO v_mentor_segment FROM mentor_segments ms WHERE ms.id = v_offering.mentor_segment_id AND ms.status = 'active';
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'SEGMENT_INACTIVE',
            'message', 'The mentor segment is not currently active.');
    END IF;

    SELECT * INTO v_mentor FROM mentors WHERE id = v_mentor_segment.mentor_id;
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'MENTOR_NOT_FOUND',
            'message', 'The selected mentor no longer exists.');
    END IF;

    PERFORM pg_advisory_xact_lock(hashtext('mentor_booking:' || v_mentor.id::text));

    IF EXISTS (
        SELECT 1 FROM booking_requests br
        WHERE br.mentor_id = v_mentor.id
          AND br.status IN ('pending', 'accepted')
          AND br.proposed_start_time < p_proposed_end_time
          AND br.proposed_end_time   > p_proposed_start_time
    ) THEN
        RETURN json_build_object('success', false, 'error', 'SLOT_CONFLICT',
            'message', 'This time slot was just booked by another seeker.');
    END IF;

    IF v_mentor.verification_status <> 'approved' THEN
        RETURN json_build_object('success', false, 'error', 'MENTOR_NOT_APPROVED',
            'message', 'Mentor is not currently approved for bookings.');
    END IF;

    IF v_mentor.id = auth.uid() THEN
        RETURN json_build_object('success', false, 'error', 'SELF_BOOKING',
            'message', 'You cannot book a session with yourself.');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM advisory_segments s WHERE s.id = v_mentor_segment.segment_id AND s.is_active = true) THEN
        RETURN json_build_object('success', false, 'error', 'ADVISORY_SEGMENT_INACTIVE',
            'message', 'This advisory segment is currently paused.');
    END IF;

    v_amount_inr := v_offering.price_inr;
    v_platform_fee_inr := ROUND(v_offering.price_inr * 0.15);
    v_mentor_payout_inr := v_amount_inr - v_platform_fee_inr;

    INSERT INTO public.booking_requests (
        offering_id, mentor_id, seeker_id,
        proposed_start_time, proposed_end_time,
        message, is_anonymous,
        amount_inr, platform_fee_inr, mentor_payout_inr
    ) VALUES (
        p_offering_id, v_mentor.id, auth.uid(),
        p_proposed_start_time, p_proposed_end_time,
        p_message, p_is_anonymous,
        v_amount_inr, v_platform_fee_inr, v_mentor_payout_inr
    )
    RETURNING id INTO v_booking_request_id;

    INSERT INTO public.booking_audit_log (booking_request_id, action, actor_id, from_status, to_status, metadata)
    VALUES (v_booking_request_id, 'created', auth.uid(), NULL, 'pending',
            jsonb_build_object('offering_id', p_offering_id, 'amount_inr', v_amount_inr));

    RETURN json_build_object(
        'success', true,
        'booking_request_id', v_booking_request_id,
        'seeker_id', auth.uid(),
        'status', 'pending'
    );
EXCEPTION
    WHEN exclusion_violation THEN
        RETURN json_build_object('success', false, 'error', 'SLOT_CONFLICT',
            'message', 'This time slot has just been confirmed by another client. Please pick another time.');
END;
$$;

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
    v_seeker_id UUID;
    v_mentor_id UUID;
    v_caller_role TEXT;
    v_allowed BOOLEAN := FALSE;
BEGIN
    IF auth.uid() IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'NOT_AUTHENTICATED', 'message', 'Authentication required.');
    END IF;

    SELECT role INTO v_caller_role FROM public.profiles WHERE id = auth.uid();
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'PROFILE_NOT_FOUND', 'message', 'Account profile missing.');
    END IF;

    SELECT status, seeker_id, mentor_id INTO v_old_status, v_seeker_id, v_mentor_id
    FROM booking_requests WHERE id = p_booking_request_id;

    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'NOT_FOUND', 'message', 'Booking request not found.');
    END IF;

    IF v_old_status IN ('declined', 'cancelled') THEN
        RETURN json_build_object('success', false, 'error', 'TERMINAL_STATE',
            'message', 'This booking request is already ' || v_old_status::text || ' and cannot be modified.');
    END IF;

    IF p_new_status = 'accepted' THEN
        IF v_old_status = 'pending' AND auth.uid() = v_mentor_id THEN v_allowed := TRUE; END IF;
    ELSIF p_new_status = 'declined' THEN
        IF v_old_status = 'pending' AND auth.uid() = v_mentor_id THEN v_allowed := TRUE; END IF;
    ELSIF p_new_status = 'cancelled' THEN
        IF v_old_status = 'pending' AND auth.uid() = v_seeker_id THEN v_allowed := TRUE;
        ELSIF v_old_status = 'accepted' AND (auth.uid() = v_seeker_id OR auth.uid() = v_mentor_id) THEN v_allowed := TRUE; END IF;
    END IF;

    IF NOT v_allowed AND v_caller_role = 'admin' THEN
        IF v_old_status IN ('pending', 'accepted') AND p_new_status = 'cancelled' THEN v_allowed := TRUE; END IF;
    END IF;

    IF NOT v_allowed THEN
        RETURN json_build_object('success', false, 'error', 'NOT_AUTHORIZED',
            'message', 'You are not authorized to perform this transition.');
    END IF;

    IF p_new_status = 'accepted' THEN
        UPDATE booking_requests
        SET status = p_new_status,
            confirmed_start_time = COALESCE(p_confirmed_start_time, proposed_start_time),
            confirmed_end_time   = COALESCE(p_confirmed_end_time,   proposed_end_time),
            meeting_url = COALESCE(p_meeting_url, meeting_url),
            notes = COALESCE(p_notes, notes),
            updated_at = timezone('utc'::text, now())
        WHERE id = p_booking_request_id;
    ELSE
        UPDATE booking_requests
        SET status = p_new_status,
            notes = COALESCE(p_notes, notes),
            updated_at = timezone('utc'::text, now())
        WHERE id = p_booking_request_id;
    END IF;

    INSERT INTO public.booking_audit_log (booking_request_id, action, actor_id, from_status, to_status, metadata)
    VALUES (p_booking_request_id, p_new_status::text, auth.uid(), v_old_status, p_new_status, '{}'::jsonb);

    RETURN json_build_object('success', true, 'booking_request_id', p_booking_request_id,
        'new_status', p_new_status, 'old_status', v_old_status);
EXCEPTION
    WHEN exclusion_violation THEN
        RETURN json_build_object('success', false, 'error', 'SLOT_CONFLICT',
            'message', 'This transition would overlap an existing booking.');
END;
$$;

CREATE OR REPLACE FUNCTION public.cancel_booking_request(p_booking_request_id UUID)
RETURNS JSON LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
    v_old_status booking_request_status;
    v_seeker_id UUID;
    v_mentor_id UUID;
BEGIN
    IF auth.uid() IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'NOT_AUTHENTICATED', 'message', 'Authentication required.');
    END IF;

    SELECT status, seeker_id, mentor_id INTO v_old_status, v_seeker_id, v_mentor_id
    FROM booking_requests WHERE id = p_booking_request_id;

    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'NOT_FOUND', 'message', 'Booking request not found.');
    END IF;

    IF auth.uid() <> v_seeker_id AND NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') THEN
        RETURN json_build_object('success', false, 'error', 'NOT_AUTHORIZED',
            'message', 'You can only cancel your own booking requests.');
    END IF;

    IF v_old_status IN ('declined', 'cancelled') THEN
        RETURN json_build_object('success', false, 'error', 'TERMINAL_STATE',
            'message', 'Booking request is already ' || v_old_status::text || '.');
    END IF;

    UPDATE booking_requests
    SET status = 'cancelled', updated_at = timezone('utc'::text, now())
    WHERE id = p_booking_request_id;

    INSERT INTO public.booking_audit_log (booking_request_id, action, actor_id, from_status, to_status, metadata)
    VALUES (p_booking_request_id, 'cancelled', auth.uid(), v_old_status, 'cancelled',
            jsonb_build_object('reason', 'seeker_cancelled'));

    RETURN json_build_object('success', true, 'booking_request_id', p_booking_request_id,
        'new_status', 'cancelled', 'old_status', v_old_status);
END;
$$;

CREATE OR REPLACE FUNCTION public.acquire_slot_lock(
    p_mentor_id UUID,
    p_start_time TIMESTAMP WITH TIME ZONE,
    p_end_time TIMESTAMP WITH TIME ZONE
) RETURNS JSON LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE v_lock_id UUID;
BEGIN
    IF auth.uid() IS NULL THEN RETURN json_build_object('success', false, 'error', 'NOT_AUTHENTICATED'); END IF;
    IF p_end_time <= p_start_time THEN RETURN json_build_object('success', false, 'error', 'INVALID_TIME_WINDOW'); END IF;

    PERFORM public.purge_expired_slot_locks();
    PERFORM pg_advisory_xact_lock(hashtext('mentor_booking:' || p_mentor_id::text));

    IF EXISTS (
        SELECT 1 FROM booking_requests br
        WHERE br.mentor_id = p_mentor_id AND br.status IN ('pending', 'accepted')
          AND br.proposed_start_time < p_end_time AND br.proposed_end_time > p_start_time
    ) THEN
        RETURN json_build_object('success', false, 'error', 'SLOT_CONFLICT',
            'message', 'This time slot has just been booked by another client.');
    END IF;

    INSERT INTO booking_slot_locks (mentor_id, seeker_id, range)
    VALUES (p_mentor_id, auth.uid(), tstzrange(p_start_time, p_end_time, '[)'))
    RETURNING id INTO v_lock_id;

    RETURN json_build_object('success', true, 'lock_id', v_lock_id,
        'expires_at', (timezone('utc'::text, now()) + INTERVAL '5 minutes'));
EXCEPTION WHEN exclusion_violation THEN
    RETURN json_build_object('success', false, 'error', 'SLOT_CONFLICT',
        'message', 'This time slot was just locked by another client.');
END;
$$;

CREATE OR REPLACE FUNCTION public.release_slot_lock(p_lock_id UUID)
RETURNS JSON LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
BEGIN
    DELETE FROM booking_slot_locks WHERE id = p_lock_id AND seeker_id = auth.uid();
    RETURN json_build_object('success', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.list_mentor_slots(
    p_mentor_id UUID,
    p_day DATE,
    p_duration_minutes INT DEFAULT 45
) RETURNS TABLE(
    slot_start TIMESTAMP WITH TIME ZONE,
    slot_end   TIMESTAMP WITH TIME ZONE,
    is_available BOOLEAN,
    reason TEXT
) LANGUAGE plpgsql
SECURITY INVOKER
STABLE
SET search_path = public
AS $$
DECLARE
    v_has_rules BOOLEAN;
    v_rule RECORD;
    v_dow INT := EXTRACT(DOW FROM p_day);
    v_cursor TIMESTAMP WITH TIME ZONE;
    v_end_of_day TIMESTAMP WITH TIME ZONE;
BEGIN
    SELECT EXISTS (SELECT 1 FROM availability_rules WHERE mentor_id = p_mentor_id AND is_active = true)
        INTO v_has_rules;

    IF v_has_rules THEN
        FOR v_rule IN
            SELECT start_time, end_time FROM availability_rules
            WHERE mentor_id = p_mentor_id AND is_active = true AND day_of_week = v_dow
            ORDER BY start_time
        LOOP
            v_cursor := (p_day::timestamp + v_rule.start_time) AT TIME ZONE 'UTC';
            v_end_of_day := (p_day::timestamp + v_rule.end_time) AT TIME ZONE 'UTC';
            WHILE v_cursor + (p_duration_minutes || ' minutes')::interval <= v_end_of_day LOOP
                slot_start := v_cursor;
                slot_end   := v_cursor + (p_duration_minutes || ' minutes')::interval;
                is_available := NOT EXISTS (
                    SELECT 1 FROM booking_requests br
                    WHERE br.mentor_id = p_mentor_id AND br.status IN ('pending', 'accepted')
                      AND br.proposed_start_time < slot_end AND br.proposed_end_time > slot_start
                ) AND NOT EXISTS (
                    SELECT 1 FROM booking_slot_locks l
                    WHERE l.mentor_id = p_mentor_id AND l.expires_at > timezone('utc'::text, now())
                      AND l.range && tstzrange(slot_start, slot_end, '[)')
                ) AND slot_start > timezone('utc'::text, now());
                reason := CASE WHEN NOT is_available AND slot_start <= timezone('utc'::text, now()) THEN 'passed'
                              WHEN NOT is_available THEN 'booked' ELSE 'available' END;
                RETURN NEXT;
                v_cursor := v_cursor + (p_duration_minutes || ' minutes')::interval;
            END LOOP;
        END LOOP;
    ELSE
        IF v_dow IN (0, 6) THEN
            v_cursor := (p_day::timestamp + time '10:00') AT TIME ZONE 'UTC';
            v_end_of_day := (p_day::timestamp + time '16:00') AT TIME ZONE 'UTC';
        ELSE
            v_cursor := (p_day::timestamp + time '09:00') AT TIME ZONE 'UTC';
            v_end_of_day := (p_day::timestamp + time '18:00') AT TIME ZONE 'UTC';
        END IF;
        WHILE v_cursor + (p_duration_minutes || ' minutes')::interval <= v_end_of_day LOOP
            slot_start := v_cursor;
            slot_end   := v_cursor + (p_duration_minutes || ' minutes')::interval;
            is_available := NOT EXISTS (
                SELECT 1 FROM booking_requests br
                WHERE br.mentor_id = p_mentor_id AND br.status IN ('pending', 'accepted')
                  AND br.proposed_start_time < slot_end AND br.proposed_end_time > slot_start
            ) AND slot_start > timezone('utc'::text, now());
            reason := CASE WHEN NOT is_available AND slot_start <= timezone('utc'::text, now()) THEN 'passed'
                          WHEN NOT is_available THEN 'booked' ELSE 'available' END;
            RETURN NEXT;
            v_cursor := v_cursor + (p_duration_minutes || ' minutes')::interval;
        END LOOP;
    END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.create_booking_request FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_booking_request TO authenticated;

REVOKE ALL ON FUNCTION public.update_booking_request_status FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_booking_request_status TO authenticated;

REVOKE ALL ON FUNCTION public.cancel_booking_request FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cancel_booking_request TO authenticated;

REVOKE ALL ON FUNCTION public.acquire_slot_lock FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.acquire_slot_lock TO authenticated;

REVOKE ALL ON FUNCTION public.release_slot_lock FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.release_slot_lock TO authenticated;

REVOKE ALL ON FUNCTION public.list_mentor_slots FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_mentor_slots TO authenticated;
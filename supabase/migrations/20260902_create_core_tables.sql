-- ==============================================================================
-- Migration: 20260902_create_core_tables.sql
-- Description: Creates all core application tables for Suggest Key platform.
--              This includes profiles, categories, mentors, gigs, availability_rules,
--              bookings, conversations, messages, and reviews tables.
--              Includes RLS policies for secure data access.
-- ==============================================================================

-- 1. ENUMS
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('seeker', 'mentor', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE mentor_status AS ENUM ('pending', 'review', 'approved', 'rejected', 'suspended');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'failed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- 3. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    role user_role NOT NULL DEFAULT 'seeker',
    is_anonymous_enabled BOOLEAN DEFAULT false,
    anonymous_name TEXT,
    is_demo BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- 4. CATEGORIES TABLE (Legacy support)
CREATE TABLE IF NOT EXISTS public.categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    icon_name TEXT,
    requires_credential_verification BOOLEAN DEFAULT false,
    display_order INT DEFAULT 0
);

-- 5. ADVISORY SEGMENTS TABLE (if not exists from previous migration)
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

CREATE INDEX IF NOT EXISTS idx_advisory_segments_active_order ON public.advisory_segments (is_active, display_order ASC);
CREATE INDEX IF NOT EXISTS idx_advisory_segments_slug ON public.advisory_segments (slug);

-- 6. MENTOR PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.mentors (
    id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    headline TEXT NOT NULL,
    bio TEXT NOT NULL,
    experience_years INT DEFAULT 1,
    rating NUMERIC(3,2) DEFAULT 5.00,
    review_count INT DEFAULT 0,
    verification_status mentor_status DEFAULT 'pending',
    verified_categories TEXT[] DEFAULT '{}',
    segment_id UUID REFERENCES public.advisory_segments(id) ON DELETE SET NULL,
    primary_segment_id UUID REFERENCES public.advisory_segments(id) ON DELETE SET NULL,
    credentials_url TEXT,
    credentials_verified_at TIMESTAMP WITH TIME ZONE,
    specialties TEXT[] DEFAULT '{}',
    is_demo BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_mentors_verification ON public.mentors(verification_status);
CREATE INDEX IF NOT EXISTS idx_mentors_segment_id ON public.mentors(segment_id);
CREATE INDEX IF NOT EXISTS idx_mentors_rating ON public.mentors(rating DESC, review_count DESC);

-- 7. GIGS / OFFERINGS TABLE
CREATE TABLE IF NOT EXISTS public.gigs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mentor_id UUID REFERENCES public.mentors(id) ON DELETE CASCADE NOT NULL,
    category_id TEXT REFERENCES public.categories(id),
    segment_id UUID REFERENCES public.advisory_segments(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT NOT NULL,
    duration_minutes INT NOT NULL CHECK (duration_minutes IN (15, 30, 45, 60)),
    price_inr INT NOT NULL DEFAULT 0,
    deliverables TEXT[] NOT NULL DEFAULT '{}',
    is_published BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_gigs_mentor_id ON public.gigs(mentor_id);
CREATE INDEX IF NOT EXISTS idx_gigs_segment_id ON public.gigs(segment_id);
CREATE INDEX IF NOT EXISTS idx_gigs_published ON public.gigs(is_published);

-- 8. AVAILABILITY RULES TABLE
CREATE TABLE IF NOT EXISTS public.availability_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mentor_id UUID REFERENCES public.mentors(id) ON DELETE CASCADE NOT NULL,
    day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_availability_mentor ON public.availability_rules(mentor_id);

-- 9. BOOKINGS TABLE (with atomic exclusion constraint for double-booking prevention)
CREATE TABLE IF NOT EXISTS public.bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gig_id UUID REFERENCES public.gigs(id) ON DELETE CASCADE NOT NULL,
    mentor_id UUID REFERENCES public.mentors(id) ON DELETE CASCADE NOT NULL,
    seeker_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    segment_id UUID REFERENCES public.advisory_segments(id) ON DELETE SET NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    status booking_status NOT NULL DEFAULT 'confirmed',
    amount_inr INT NOT NULL DEFAULT 0,
    platform_fee_inr INT DEFAULT 0,
    mentor_payout_inr INT DEFAULT 0,
    meeting_url TEXT,
    notes TEXT,
    is_anonymous BOOLEAN DEFAULT false,
    is_demo BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT no_overlap_mentor_booking EXCLUDE USING gist (
        mentor_id WITH =,
        tstzrange(start_time, end_time) WITH &&
    ) WHERE (status IN ('pending', 'confirmed', 'in_progress'))
);

CREATE INDEX IF NOT EXISTS idx_bookings_seeker ON public.bookings(seeker_id);
CREATE INDEX IF NOT EXISTS idx_bookings_mentor ON public.bookings(mentor_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_segment ON public.bookings(segment_id);
CREATE INDEX IF NOT EXISTS idx_bookings_start_time ON public.bookings(start_time);

-- 10. CONVERSATIONS TABLE
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE UNIQUE,
    seeker_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    mentor_id UUID REFERENCES public.mentors(id) ON DELETE CASCADE NOT NULL,
    segment_id UUID REFERENCES public.advisory_segments(id) ON DELETE SET NULL,
    last_message_at TIMESTAMP WITH TIME ZONE,
    is_demo BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_conversations_seeker ON public.conversations(seeker_id);
CREATE INDEX IF NOT EXISTS idx_conversations_mentor ON public.conversations(mentor_id);
CREATE INDEX IF NOT EXISTS idx_conversations_booking ON public.conversations(booking_id);

-- 11. MESSAGES TABLE
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
    sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    attachments JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON public.messages(created_at);

-- 12. REVIEWS TABLE
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE UNIQUE NOT NULL,
    seeker_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    mentor_id UUID REFERENCES public.mentors(id) ON DELETE CASCADE NOT NULL,
    gig_id UUID REFERENCES public.gigs(id) ON DELETE SET NULL,
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    rating_expertise INT CHECK (rating_expertise BETWEEN 1 AND 5),
    rating_communication INT CHECK (rating_communication BETWEEN 1 AND 5),
    rating_actionability INT CHECK (rating_actionability BETWEEN 1 AND 5),
    comment TEXT,
    mentor_response TEXT,
    mentor_response_at TIMESTAMP WITH TIME ZONE,
    is_anonymous BOOLEAN DEFAULT false,
    is_demo BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_reviews_mentor ON public.reviews(mentor_id);
CREATE INDEX IF NOT EXISTS idx_reviews_seeker ON public.reviews(seeker_id);
CREATE INDEX IF NOT EXISTS idx_reviews_booking ON public.reviews(booking_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON public.reviews(rating);

-- 13. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT,
    is_read BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications(user_id, is_read);

-- ==============================================================================
-- UPDATED_AT TRIGGER FUNCTION
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to all tables with updated_at
DROP TRIGGER IF EXISTS trigger_profiles_updated_at ON public.profiles;
CREATE TRIGGER trigger_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_mentors_updated_at ON public.mentors;
CREATE TRIGGER trigger_mentors_updated_at BEFORE UPDATE ON public.mentors FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_gigs_updated_at ON public.gigs;
CREATE TRIGGER trigger_gigs_updated_at BEFORE UPDATE ON public.gigs FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_bookings_updated_at ON public.bookings;
CREATE TRIGGER trigger_bookings_updated_at BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_advisory_segments_updated_at ON public.advisory_segments;
CREATE TRIGGER trigger_advisory_segments_updated_at BEFORE UPDATE ON public.advisory_segments FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gigs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availability_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advisory_segments ENABLE ROW LEVEL SECURITY;

-- PROFILES POLICIES
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- CATEGORIES POLICIES
DROP POLICY IF EXISTS "Categories are viewable by everyone" ON public.categories;
CREATE POLICY "Categories are viewable by everyone" ON public.categories FOR SELECT USING (true);

-- ADVISORY SEGMENTS POLICIES
DROP POLICY IF EXISTS "Active segments are viewable by everyone" ON public.advisory_segments;
CREATE POLICY "Active segments are viewable by everyone" ON public.advisory_segments FOR SELECT USING (is_active = true OR auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admins can manage segments" ON public.advisory_segments;
CREATE POLICY "Admins can manage segments" ON public.advisory_segments FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- MENTORS POLICIES
DROP POLICY IF EXISTS "Approved mentors are viewable by everyone" ON public.mentors;
CREATE POLICY "Approved mentors are viewable by everyone" ON public.mentors FOR SELECT USING (verification_status = 'approved');

DROP POLICY IF EXISTS "Mentors can manage own record" ON public.mentors;
CREATE POLICY "Mentors can manage own record" ON public.mentors FOR ALL USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can manage all mentors" ON public.mentors;
CREATE POLICY "Admins can manage all mentors" ON public.mentors FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- GIGS POLICIES
DROP POLICY IF EXISTS "Published gigs are viewable by everyone" ON public.gigs;
CREATE POLICY "Published gigs are viewable by everyone" ON public.gigs FOR SELECT USING (is_published = true);

DROP POLICY IF EXISTS "Mentors can manage own gigs" ON public.gigs;
CREATE POLICY "Mentors can manage own gigs" ON public.gigs FOR ALL USING (auth.uid() = mentor_id);

DROP POLICY IF EXISTS "Admins can manage all gigs" ON public.gigs;
CREATE POLICY "Admins can manage all gigs" ON public.gigs FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- AVAILABILITY RULES POLICIES
DROP POLICY IF EXISTS "Mentors can view own availability" ON public.availability_rules;
CREATE POLICY "Mentors can view own availability" ON public.availability_rules FOR SELECT USING (auth.uid() = mentor_id);

DROP POLICY IF EXISTS "Mentors can manage own availability" ON public.availability_rules;
CREATE POLICY "Mentors can manage own availability" ON public.availability_rules FOR ALL USING (auth.uid() = mentor_id);

-- BOOKINGS POLICIES
DROP POLICY IF EXISTS "Booking participants can view" ON public.bookings;
CREATE POLICY "Booking participants can view" ON public.bookings FOR SELECT USING (
    auth.uid() = seeker_id OR auth.uid() = mentor_id OR EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

DROP POLICY IF EXISTS "Seekers can create bookings" ON public.bookings;
CREATE POLICY "Seekers can create bookings" ON public.bookings FOR INSERT WITH CHECK (auth.uid() = seeker_id);

DROP POLICY IF EXISTS "Booking participants can update" ON public.bookings;
CREATE POLICY "Booking participants can update" ON public.bookings FOR UPDATE USING (
    auth.uid() = seeker_id OR auth.uid() = mentor_id OR EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- CONVERSATIONS POLICIES
DROP POLICY IF EXISTS "Conversation participants can view" ON public.conversations;
CREATE POLICY "Conversation participants can view" ON public.conversations FOR SELECT USING (
    auth.uid() = seeker_id OR auth.uid() = mentor_id OR EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

DROP POLICY IF EXISTS "Conversation participants can create" ON public.conversations;
CREATE POLICY "Conversation participants can create" ON public.conversations FOR INSERT WITH CHECK (
    auth.uid() = seeker_id OR auth.uid() = mentor_id
);

-- MESSAGES POLICIES
DROP POLICY IF EXISTS "Conversation participants can view messages" ON public.messages;
CREATE POLICY "Conversation participants can view messages" ON public.messages FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = messages.conversation_id AND (c.seeker_id = auth.uid() OR c.mentor_id = auth.uid()))
);

DROP POLICY IF EXISTS "Conversation participants can send messages" ON public.messages;
CREATE POLICY "Conversation participants can send messages" ON public.messages FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = messages.conversation_id AND (c.seeker_id = auth.uid() OR c.mentor_id = auth.uid()))
);

-- REVIEWS POLICIES
DROP POLICY IF EXISTS "Reviews are viewable by everyone" ON public.reviews;
CREATE POLICY "Reviews are viewable by everyone" ON public.reviews FOR SELECT USING (true);

DROP POLICY IF EXISTS "Seekers can create reviews" ON public.reviews;
CREATE POLICY "Seekers can create reviews" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = seeker_id);

DROP POLICY IF EXISTS "Mentors can respond to reviews" ON public.reviews;
CREATE POLICY "Mentors can respond to reviews" ON public.reviews FOR UPDATE USING (auth.uid() = mentor_id);

-- NOTIFICATIONS POLICIES
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

-- ==============================================================================
-- ATOMIC BOOKING FUNCTION
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.book_session_atomic(
    p_gig_id UUID,
    p_mentor_id UUID,
    p_seeker_id UUID,
    p_start_time TIMESTAMP WITH TIME ZONE,
    p_end_time TIMESTAMP WITH TIME ZONE,
    p_amount_inr INT
) RETURNS JSON LANGUAGE plpgsql AS $$
DECLARE
    v_booking_id UUID;
    v_conv_id UUID;
BEGIN
    -- Check mentor is approved
    IF NOT EXISTS (
        SELECT 1 FROM public.mentors WHERE id = p_mentor_id AND verification_status = 'approved'
    ) THEN
        RETURN json_build_object('success', false, 'error', 'MENTOR_NOT_APPROVED', 'message', 'Mentor is not currently approved for bookings.');
    END IF;

    -- Insert booking
    INSERT INTO public.bookings (gig_id, mentor_id, seeker_id, start_time, end_time, amount_inr, status)
    VALUES (p_gig_id, p_mentor_id, p_seeker_id, p_start_time, p_end_time, p_amount_inr, 'confirmed')
    RETURNING id INTO v_booking_id;

    -- Create conversation for this booking
    INSERT INTO public.conversations (booking_id, seeker_id, mentor_id)
    VALUES (v_booking_id, p_seeker_id, p_mentor_id)
    RETURNING id INTO v_conv_id;

    RETURN json_build_object(
        'success', true,
        'booking_id', v_booking_id,
        'conversation_id', v_conv_id
    );
EXCEPTION
    WHEN exclusion_violation THEN
        RETURN json_build_object(
            'success', false,
            'error', 'SLOT_CONFLICT',
            'message', 'This slot was just booked by another seeker.'
        );
END;
$$;

-- ==============================================================================
-- HELPER FUNCTION: Calculate mentor rating from reviews
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.update_mentor_rating(p_mentor_id UUID)
RETURNS VOID LANGUAGE plpgsql AS $$
DECLARE
    v_avg_rating NUMERIC;
    v_review_count INT;
BEGIN
    SELECT AVG(rating), COUNT(*)
    INTO v_avg_rating, v_review_count
    FROM public.reviews
    WHERE mentor_id = p_mentor_id;

    UPDATE public.mentors
    SET rating = COALESCE(v_avg_rating, 5.00),
        review_count = COALESCE(v_review_count, 0)
    WHERE id = p_mentor_id;
END;
$$;

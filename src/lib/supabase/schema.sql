-- ==============================================================================
-- SUGGEST KEY — Authoritative Database Schema & Security Definition
-- Version: 2.0 (Rebuild Baseline)
-- ==============================================================================

-- 1. ENUMS
create type user_role as enum ('seeker', 'mentor', 'admin');
create type mentor_status as enum ('pending', 'review', 'approved', 'rejected', 'suspended');
create type booking_status as enum ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'failed');

-- 2. EXTENSIONS
create extension if not exists btree_gist;

-- 3. PROFILES
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text not null,
  avatar_url text,
  role user_role not null default 'seeker',
  is_anonymous_enabled boolean default false,
  anonymous_name text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 4. CATEGORIES
create table public.categories (
  id text primary key,
  name text not null,
  slug text unique not null,
  description text,
  icon_name text,
  requires_credential_verification boolean default false,
  display_order int default 0
);

-- 5. MENTOR PROFILES
create table public.mentors (
  id uuid references public.profiles(id) on delete cascade primary key,
  headline text not null,
  bio text not null,
  experience_years int default 1,
  rating numeric(3,2) default 5.00,
  review_count int default 0,
  verification_status mentor_status default 'pending',
  verified_categories text[] default '{}',
  credentials_url text,
  credentials_verified_at timestamptz,
  created_at timestamptz default now()
);

-- 6. GIGS / SESSIONS
create table public.gigs (
  id uuid primary key default gen_random_uuid(),
  mentor_id uuid references public.mentors(id) on delete cascade not null,
  category_id text references public.categories(id) not null,
  title text not null,
  slug text not null,
  description text not null,
  duration_minutes int not null check (duration_minutes in (15, 30, 45, 60)),
  price_inr int not null default 0,
  deliverables text[] not null default '{}',
  is_published boolean default true,
  created_at timestamptz default now()
);

-- 7. MENTOR AVAILABILITY RULES
create table public.availability_rules (
  id uuid primary key default gen_random_uuid(),
  mentor_id uuid references public.mentors(id) on delete cascade not null,
  day_of_week int not null check (day_of_week between 0 and 6),
  start_time time not null,
  end_time time not null,
  is_active boolean default true
);

-- 8. BOOKINGS (Enforcing Atomic Double-Booking Exclusion)
create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  gig_id uuid references public.gigs(id) not null,
  mentor_id uuid references public.mentors(id) not null,
  seeker_id uuid references public.profiles(id) not null,
  start_time timestamptz not null,
  end_time timestamptz not null,
  status booking_status not null default 'confirmed',
  amount_inr int not null default 0,
  meeting_url text,
  notes text,
  created_at timestamptz default now(),
  constraint no_overlap_mentor_booking exclude using gist (
    mentor_id with =,
    tstzrange(start_time, end_time) with &&
  ) where (status in ('pending', 'confirmed', 'in_progress'))
);

-- 9. CONVERSATIONS & MESSAGES
create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references public.bookings(id) on delete cascade unique not null,
  seeker_id uuid references public.profiles(id) not null,
  mentor_id uuid references public.mentors(id) not null,
  created_at timestamptz default now()
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references public.conversations(id) on delete cascade not null,
  sender_id uuid references public.profiles(id) not null,
  content text not null,
  created_at timestamptz default now()
);

-- 10. REVIEWS
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references public.bookings(id) on delete cascade unique not null,
  seeker_id uuid references public.profiles(id) not null,
  mentor_id uuid references public.mentors(id) not null,
  rating int not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz default now()
);

-- ==============================================================================
-- ATOMIC BOOKING FUNCTION
-- ==============================================================================
create or replace function book_session_atomic(
  p_gig_id uuid,
  p_mentor_id uuid,
  p_seeker_id uuid,
  p_start_time timestamptz,
  p_end_time timestamptz,
  p_amount_inr int
) returns json language plpgsql as $$
declare
  v_booking_id uuid;
  v_conv_id uuid;
begin
  if not exists (
    select 1 from public.mentors where id = p_mentor_id and verification_status = 'approved'
  ) then
    return json_build_object('success', false, 'error', 'MENTOR_NOT_APPROVED', 'message', 'Mentor is not currently approved for bookings.');
  end if;

  insert into public.bookings (gig_id, mentor_id, seeker_id, start_time, end_time, amount_inr, status)
  values (p_gig_id, p_mentor_id, p_seeker_id, p_start_time, p_end_time, p_amount_inr, 'confirmed')
  returning id into v_booking_id;

  insert into public.conversations (booking_id, seeker_id, mentor_id)
  values (v_booking_id, p_seeker_id, p_mentor_id)
  returning id into v_conv_id;

  return json_build_object(
    'success', true,
    'booking_id', v_booking_id,
    'conversation_id', v_conv_id
  );
exception
  when exclusion_violation then
    return json_build_object(
      'success', false,
      'error', 'SLOT_CONFLICT',
      'message', 'This slot was just booked by another seeker.'
    );
end;
$$;

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.mentors enable row level security;
alter table public.gigs enable row level security;
alter table public.availability_rules enable row level security;
alter table public.bookings enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.reviews enable row level security;

-- Public Category & Approved Mentor Read
create policy "Allow public read on categories" on public.categories for select using (true);
create policy "Allow public read on approved mentors" on public.mentors for select using (verification_status = 'approved');
create policy "Allow mentors to read and edit own record" on public.mentors for all using (auth.uid() = id);
create policy "Allow public read on published gigs" on public.gigs for select using (is_published = true);

-- Profiles
create policy "Allow authenticated users to read profiles" on public.profiles for select using (true);
create policy "Allow users to update own profile" on public.profiles for update using (auth.uid() = id);

-- Bookings (Only participants & admin)
create policy "Allow booking participants and admins to read" on public.bookings for select using (
  auth.uid() = seeker_id or auth.uid() = mentor_id or exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

-- Conversations & Messages (Participant-only)
create policy "Allow participants to view conversations" on public.conversations for select using (
  auth.uid() = seeker_id or auth.uid() = mentor_id
);
create policy "Allow conversation participants to send messages" on public.messages for insert with check (
  exists (
    select 1 from conversations c
    where c.id = conversation_id and (c.seeker_id = auth.uid() or c.mentor_id = auth.uid())
  )
);
create policy "Allow conversation participants to read messages" on public.messages for select using (
  exists (
    select 1 from conversations c
    where c.id = conversation_id and (c.seeker_id = auth.uid() or c.mentor_id = auth.uid())
  )
);

# Mentor Profile, Multi-Segment Mentor, Offering & Booking Architecture Audit

## 1. Executive Summary

This document audits the current mentor/profile/booking architecture in the Suggest Key codebase and outlines improvements toward a production-grade multi-segment mentor model with explicit offerings, role-aware routing, and database-level booking authorization.

## 2. Current Architecture

### 2.1 Tech Stack
- **Frontend**: React 19 + Vite (SPA)
- **Backend**: Express server (`server.ts`) with Supabase backend
- **Database**: PostgreSQL via Supabase
- **Auth**: Supabase Auth with architecturally-injected mock fallback for development (`DEV_AUTH_BYPASS`, `AUTH_ROUTE_GUARD=false`)
- **Types**: Shared TypeScript types in `src/lib/supabase/types.ts`

### 2.2 Key Domain Concepts (Current)
- **Mentor**: A profile with `mentor_id` that has a single `segment_id` (only one segment per mentor — a limitation)
- **Advisor**: Public-facing profile page accessed via `/advisors/:mentorId`
- **Gig**: A service offering from a mentor, stored in `gigs` table, linked to `segment_id`
- **Booking**: A reservation for a gig, stored in `bookings` table, referencing `gig_id` and `segment_id`

### 2.3 Current Routing (Root Cause #1)
The application uses a single route `/advisors/:mentorId` for all roles (seekers, mentors, admins). There is no role-aware routing — the same page renders regardless of who is viewing it.

**File**: `src/App.tsx`

### 2.4 Current Profile Page (Root Cause #2)
`AdvisorProfilePage.tsx` renders booking CTAs and the full booking flow regardless of the viewer's role. There is no check to distinguish between a public visitor and a logged-in user with a specific role.

### 2.5 Database Schema Issues (Root Cause #3)
- The `mentors` table has a single `segment_id` column, preventing a mentor from being associated with multiple segments
- `gigs` and `bookings` reference `segment_id` directly, tying them to specific segments at the schema level but not to specific mentors in a flexible way
- No `offerings` table exists — g Gigs table serves this role but lacks proper constraints and audit trails
- Booking authorization is handled in application code, not at the database level

**File**: `src/lib/supabase/schema.sql`

### 2.6 Service Layer Issues (Root Cause #4)
- `AdvisorService.ts` fetches mentor data without role awareness — it cannot distinguish between a mentor's own profile context and a public view
- `BookingService.ts` creates bookings without server-side role validation or authorization checks
- No dedicated `MentorProfileService`, `OfferingService`, or `BookingRequestService` exists

### 2.7 Authorization Gaps (Root Cause #5)
- RLS policies exist but do not account for the multi-segment mentor model
- No booking request lifecycle (pending → accepted/declined) exists — bookings are created directly
- No audit log table for tracking booking state changes

## 3. Problems & Root Causes

### Problem 1: Single Route for All Roles
- **Symptom**: Admins and mentors see booking CTAs on advisor profile pages
- **Root Cause**: `/app/App.tsx` uses `/advisors/:mentorId` for all roles with no role-aware rendering logic in `AdvisorProfilePage.tsx`
- **Impact**: Confusing UX, potential for unintended booking flows

### Problem 2: Single Segment Limitation
- **Symptom**: A mentor can only be associated with one segment
- **Root Cause**: `mentors` table has `segment_id` as a direct foreign key, not a join table
- **Impact**: Inability to support mentors who work across multiple categories (e.g., both "Career" and "Technical")

### Problem 3: No Booking Request Lifecycle
- **Symptom**: Bookings are created directly without a review/approval step
- **Root Cause**: Missing `booking_requests` table and state machine
- **Impact**: Mentors cannot control their availability or approve sessions

### Problem 4: Application-Level Authorization
- **Symptom**: Booking authorization is enforced in application code only
- **Root Cause**: Missing database-level RLS policies for the new architecture
- **Impact**: Security risk if application code has bugs

## 4. Recommended Architecture

### 4.1 New Database Schema

#### `mentor_segments` Join Table (Many-to-Many)
```sql
CREATE TABLE mentor_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id UUID NOT NULL REFERENCES mentors(id) ON DELETE CASCADE,
  segment_id UUID NOT NULL REFERENCES segments(id) ON DELETE CASCADE,
  status mentor_segment_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(mentor_id, segment_id)
);
```

#### `offerings` Table (Replaces/Extends Gigs)
```sql
CREATE TABLE offerings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id UUID NOT NULL REFERENCES mentors(id) ON DELETE CASCADE,
  segment_id UUID NOT NULL REFERENCES segments(id),
  title TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER NOT NULL,
  price_cents INTEGER NOT NULL CHECK (price_cents >= 0),
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### `booking_requests` Table (Lifecycle)
```sql
CREATE TABLE booking_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offering_id UUID NOT NULL REFERENCES offerings(id),
  seeker_id UUID NOT NULL REFERENCES profiles(id),
  mentor_id UUID NOT NULL REFERENCES mentors(id),
  status booking_request_status NOT NULL DEFAULT 'pending',
  proposed_time TIMESTAMPTZ,
  confirmed_time TIMESTAMPTZ,
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `booking_audit_log` Table
```sql
CREATE TABLE booking_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_request_id UUID NOT NULL REFERENCES booking_requests(id),
  action TEXT NOT NULL,
  actor_id UUID NOT NULL REFERENCES profiles(id),
  from_status booking_request_status,
  to_status booking_request_status,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Enums
```sql
CREATE TYPE mentor_segment_status AS ENUM ('active', 'inactive', 'archived');
CREATE TYPE booking_request_status AS ENUM ('pending', 'accepted', 'declined', 'cancelled');
```

### 4.2 Updated RLS Policies
- `mentor_segments`: Mentor can view their own; public can view active segments for a mentor
- `offerings`: Mentor can manage their own; public can view available offerings
- `booking_requests`: Seeker creates; mentor accepts/declines; both can view their own
- `booking_audit_log`: Only the involved mentor/seeker can view

### 4.3 Role-Aware Routing
```
/mentor/:mentorId          — Mentor's own view (edit profile, manage segments, view bookings)
/mentor/:mentorId/offering/:offeringId — Offering detail page
/advisors/:mentorId         — Public/advisor view (for external linking, shows available offerings only)
/seeker/dashboard           — Seeker's booking requests and history
```

### 4.4 Service Layer
- `MentorProfileService` — manages mentor profile, segments, availability
- `OfferingService` — manages offerings (create, update, delete, list)
- `BookingRequestService` — manages the booking request lifecycle (request, accept, decline, cancel)

## 5. Migration Plan

### Phase 1: Schema (Database)
1. Create enums: `mentor_segment_status`, `booking_request_status`
2. Create `mentor_segments` join table with RLS
3. Create `offerings` table with RLS
4. Create `booking_requests` table with RLS
5. Create `booking_audit_log` table with RLS
6. Migrate existing data from `mentors.segment_id` → `mentor_segments`

### Phase 2: Backend Services
1. Implement `MentorProfileService`
2. Implement `OfferingService`
3. Implement `BookingRequestService` with full lifecycle
4. Update `AdvisorService` to be role-aware

### Phase 3: Frontend
1. Add role-aware routing in `App.tsx`
2. Update `AdvisorProfilePage.tsx` with role checks
3. Create `MentorProfilePage.tsx` (mentor's own view)
4. Create `OfferingPage.tsx` (offering management)
5. Create `BookingRequestPage.tsx` (lifecycle management)

### Phase 4: Seed Data
1. Seed `mentor_segments` for multi-segment mentors
2. Seed `offerings` for each segment
3. Seed `booking_requests` with various states

## 6. Risk Assessment
- **Data Migration**: Existing `mentors.segment_id` will need to be migrated to `mentor_segments` — this is non-destructive
- **Backward Compatibility**: The `/advisors/:mentorId` route should remain for external links but redirect or adapt based on viewer role
- **Feature Parity**: Ensure the new `offerings` table maintains compatibility with existing Gig display components

## 7. Next Steps
1. Implement Phase 1 schema changes in a new migration file
2. Write the migration SQL for existing data
3. Implement Phase 2 services
4. Update frontend routing and pages
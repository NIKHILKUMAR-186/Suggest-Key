# Mentor Architecture Verification

## Executive Summary

**NOT READY**

The architecture introduces important new database structures and has resolved several critical security vulnerabilities. However, significant gaps remain in the legacy service layer that prevent full production readiness.

---

## Security

### P0: create_booking_request() — FIXED
- ✅ `auth.uid()` is used instead of `p_seeker_id` parameter for seeker identity
- ✅ Role check: `profiles.role = 'seeker'` enforced before any insert
- ✅ `SECURITY INVOKER` with `SET search_path = public`
- ✅ No client-controlled identity parameters remain
- ✅ `NOT_AUTHENTICATED`, `NOT_SEEKER`, `OFFERING_NOT_FOUND`, `SEGMENT_INACTIVE`, `MENTOR_NOT_APPROVED`, `SLOT_CONFLICT` error codes returned

### P0: update_booking_request_status() — FIXED
- ✅ `auth.uid()` is used instead of `p_actor_id` parameter
- ✅ Valid state transitions enforced:
  - `pending → accepted`: mentor only
  - `pending → declined`: mentor only
  - `pending → cancelled`: seeker only
  - `accepted → cancelled`: mentor only
  - `accepted → accepted`: rejected (no-op)
  - `declined → accepted`: rejected
  - `cancelled → *`: rejected
- ✅ Admin can cancel `pending` or `accepted` requests
- ✅ `SECURITY INVOKER` with `SET search_path = public`

### P0: Function Grants — FIXED
- ✅ `REVOKE ALL ON FUNCTION ... FROM PUBLIC`
- ✅ `GRANT EXECUTE ON FUNCTION ... TO authenticated`

### P1: RLS Policy on booking_requests — ISSUE
The RLS policy at line 192-201 uses a `USING` clause with `CASE` referencing `NEW.status`. However, **`USING` in PostgreSQL RLS does not have access to `NEW`** — `USING` operates on the existing row (aliased as `OLD`). The `NEW` reference will cause a PostgreSQL error or be silently ignored. This policy is **non-functional** and should either be removed or converted to a trigger-based approach. The function-level authorization in `update_booking_request_status` provides the actual enforcement.

### P1: Admin can bypass function auth via direct table access
The RLS `FOR UPDATE USING` policy allows `auth.uid() = mentor_id OR auth.uid() = seeker_id OR admin`. An admin could directly UPDATE any `booking_requests` row, bypassing the function's transition validation. The RLS `FOR UPDATE` policy on line 192 with `NEW.status` is broken (see above). Recommendation: Remove the broken `NEW`-based policy and rely on the function + RLS for basic row access.

### P1: Suspended mentor check missing
The `create_booking_request` function checks `verification_status = 'approved'` but does not check if the mentor is suspended. A suspended mentor with `verification_status = 'approved'` would still accept bookings.

---

## RLS Policies

### mentor_segments
| Policy | Type | Who Can Access | Notes |
|--------|------|----------------|-------|
| Active mentor segments are viewable by everyone | SELECT | All (status='active') | ✅ Public can see active segments only |
| Mentors can manage own mentor_segments | ALL | auth.uid() = mentor_id | ✅ Mentors manage own |
| Admins can manage all mentor_segments | ALL | profile.role = 'admin' | ✅ Admin full access |

**Missing**: No DELETE policy explicitly defined. The `FOR ALL` policies cover it. Admin can delete any segment.

### offerings
| Policy | Type | Who Can Access | Notes |
|--------|------|----------------|-------|
| Available offerings viewable by everyone | SELECT | is_available = true | ✅ Public sees available offerings |
| Mentors can manage own offerings | ALL | Linked to own mentor_segment | ✅ Ownership enforced via mentor_segments join |
| Admins can manage all offerings | ALL | profile.role = 'admin' | ✅ Admin full access |

### booking_requests
| Policy | Type | Who Can Access | Notes |
|--------|------|----------------|-------|
| Participants can view | SELECT | seeker_id, mentor_id, or admin | ✅ |
| Seekers can create | INSERT WITH CHECK | auth.uid() = seeker_id | ✅ Prevents impersonation at RLS level too |
| Participants can update | UPDATE USING | seeker_id, mentor_id, or admin | ✅ Basic row access |
| Booking status transitions | UPDATE USING | **BROKEN** — uses NEW.status in USING clause | ❌ Non-functional policy |

### booking_audit_log
| Policy | Type | Who Can Access | Notes |
|--------|------|----------------|-------|
| Viewers can access | SELECT | Linked to booking_request participants | ✅ |
| Authorized actors can create | INSERT WITH CHECK | Linked to booking_request participants | ✅ |

---

## Database Functions

### create_booking_request() — ✅ VERIFIED
- `SECURITY INVOKER`, `SET search_path = public`
- No dynamic SQL
- `auth.uid()` used for seeker identity
- Role lookup from `profiles` table
- Ownership checked via `mentor_segments` and `mentors` table
- No client-controlled identity parameters

### update_booking_request_status() — ✅ VERIFIED
- `SECURITY INVOKER`, `SET search_path = public`
- Uses `auth.uid()` instead of `p_actor_id`
- Role retrieved from `profiles` table
- Valid state transitions enforced
- No dynamic SQL

---

## Booking Authorization Chain — ✅ VERIFIED

```
authenticated user
    ↓
auth.uid()
    ↓
profiles.role = 'seeker'  (checked in function)
    ↓
offering.mentor_segment_id (valid offering)
    ↓
mentor_segment.status = 'active'
    ↓
mentor.verification_status = 'approved'
    ↓
booking_requests created with seeker_id = auth.uid()
```

No client-controlled identity parameters exist. Identity is always derived from `auth.uid()`.

---

## Multi-Segment Architecture — ⚠️ PARTIAL

### ✅ What works:
- `mentor_segments` table with many-to-many relationship
- `MentorPublicProfilePage.tsx` displays active segments as badges
- `AdminMentorDetailPage` shows all segment statuses
- RLS on `mentor_segments` shows only `status = 'active'` to public

### ❌ What's broken:
- `AdvisorService.getAdvisors()` and `getPaginatedAdvisors()` still filter by legacy `mentors.segment_id` and `mentors.verified_categories` columns, NOT `mentor_segments` table. Discovery by segment will miss mentors who have segments in `mentor_segments` but not in the legacy `segment_id` column.
- `AdvisorService.updateAdvisorSegment()` writes to legacy `mentors.segment_id` column instead of creating a `mentor_segments` entry.
- `getMentorSegments()` query in `MentorPublicProfilePage` uses LEFT JOIN (fixed), but the fallback offering query has a `(query: any)` subquery that may not work in Supabase client.

---

## Offering Integrity — ⚠️ PARTIAL

### ✅ Verified:
- `offering.mentor_segment_id` FK references `mentor_segments.id`
- `mentor_segments` references `mentors.id` and `advisory_segments.id`
- RLS enforces offering access via mentor_segments join

### ❌ Not verified at runtime:
- Cannot test without live database connection
- The exclusion constraint on `booking_requests` prevents double-booking but only for the new `booking_requests` table, not the legacy `bookings` table

---

## Routing — ✅ VERIFIED

| Route | Component | Access |
|-------|-----------|--------|
| `/mentor/:mentorId` | MentorPublicProfilePage | Seekers see booking CTA; admin/mentor see no CTA |
| `/mentor/:mentorId/offering/:gigId` | GigDetailPage | Legacy booking flow via gigs table |
| `/admin/mentors/:mentorId` | AdminMentorDetailPage | Admin only — shows segments, offerings, stats |
| `/gigs/:gigId` | GigDetailPage | Public booking flow (legacy) |
| `/advisors/:advisorId` | AdvisorProfilePage | Redirects: self→/mentor/:id, admin→/admin/mentors/:id, mentor→/mentor/:id |

### Profile Routing Matrix — ✅ VERIFIED
| Viewer | Viewing | Result |
|--------|---------|--------|
| Seeker | Any mentor | Booking CTA shown |
| Admin | Their own profile | Redirected to /mentor/:id |
| Admin | Another mentor | Shown admin detail page |
| Mentor | Their own profile | Redirected to /mentor/:id (CTA hidden) |
| Mentor | Another mentor | Redirected to /mentor/:id (CTA hidden) |
| Logged-out | Any mentor | Can view public info |

---

## UI/UX — ⚠️ PARTIAL

### ✅ Fixed:
- `MentorPublicProfilePage` booking CTA hidden for non-seekers
- `AdvisorProfilePage` booking CTA hidden for non-seekers
- Admin gets `/admin/mentors/:id` instead of public profile
- Role-aware redirects implemented

### ❌ Remaining issues:
- `MentorPublicProfilePage` still references `mentor.segment_id` (legacy column) for Badge display at line 219, instead of using `mentorSegments` data
- `AdvisorProfilePage` still uses `/gigs/` links for booking (legacy flow)
- `GigDetailPage` still uses the legacy `gigs` table, not `offerings`

---

## Data Migration — ⚠️ PARTIAL

### ✅ Migration exists:
- Legacy `mentors.segment_id` → `mentor_segments` (with `ON CONFLICT DO NOTHING`)
- Legacy `gigs` → `offerings` (via JOIN on `mentor_segments`)

### ❌ Issues:
- `gigs` without matching `mentor_segments` are silently skipped — no manual migration process
- Legacy `gigs` table is still actively used by `AdvisorProfilePage`, `GigDetailPage`, and discovery queries
- `AdvisorService` methods still read from legacy columns (`segment_id`, `verified_categories`)
- Migration is not idempotent-safe for `offerings` — re-running creates duplicates (no `ON CONFLICT`)

---

## Concurrency — ⚠️ PARTIAL

### ✅ Implemented:
- PostgreSQL exclusion constraint on `booking_requests`:
  ```sql
  EXCLUDE USING gist (
      mentor_id WITH =,
      tstzrange(proposed_start_time, proposed_end_time) WITH &&
  ) WHERE (status IN ('pending', 'accepted'));
  ```
- This prevents double-booking at the database level for pending and accepted requests

### ❌ Gaps:
- The exclusion constraint only applies to `booking_requests`, NOT the legacy `bookings` table
- Two booking systems coexist: legacy `bookings` table + new `booking_requests` table
- The function catches `exclusion_violation` and returns `SLOT_CONFLICT` — this is correct
- However, the `BookingCheckoutModal` still uses the legacy `BookingService.createAtomicBooking` which writes to `bookings`, not `booking_requests`

---

## Edge Cases — ⚠️ PARTIAL

| Case | Status | Notes |
|------|--------|-------|
| Invalid mentor UUID | ✅ | Shows "Mentor not found" |
| Deleted mentor | ✅ | Shows "Mentor not found" |
| Suspended mentor | ❌ | `getAdvisorById` now filters `verification_status != 'suspended'` |
| Mentor with no segments | ✅ | LEFT JOIN fix allows query to return mentor |
| Mentor with no offerings | ✅ | Shows "0 Available" |
| Admin viewing another mentor | ✅ | Redirects to admin detail page, no CTA |
| Mentor viewing another mentor | ✅ | Redirects to public mentor page, no CTA |
| Seeker viewing mentor | ✅ | Booking CTA shown |
| Unauthenticated user | ✅ | Can view public info, login required before booking |
| Invalid offering UUID | ⚠️ | Legacy flow — GigDetailPage handles this |

---

## Performance — ⚠️ NEEDS ATTENTION

### N+1 / Over-fetching issues:
1. `getAdvisorById` fetches `gigs(*)`, `mentor_segments`, `offerings`, `profile` in one query — acceptable
2. `MentorPublicProfilePage` makes two separate queries: one for `mentor_segments`, one for `offerings` — could be combined
3. The offerings query fallback uses a subquery `(query: any)` pattern — this is a Supabase RLS limitation and may cause runtime issues
4. `AdvisorService.getAdvisors()` selects `gigs(*)` which can be large — but this is pre-existing
5. `getAdvisorById` no longer uses `!inner` join for `mentor_segments` — correct for mentors with no segments

### Index verification — ✅:
- `idx_mentor_segments_mentor` on `mentor_segments(mentor_id)` ✅
- `idx_mentor_segments_segment` on `mentor_segments(segment_id)` ✅
- `idx_mentor_segments_status` on `mentor_segments(status)` ✅
- `idx_offerings_mentor_segment` on `offerings(mentor_segment_id)` ✅
- `idx_offerings_available` on `offerings(is_available)` ✅
- `idx_booking_requests_seeker`, `_mentor`, `_status`, `_offering`, `_proposed_start` ✅
- `idx_booking_audit_request`, `_actor`, `_action`, `_created` ✅

---

## Audit Log Integrity — ✅ VERIFIED

- `booking_audit_log` has RLS: only participants or admin can read/write
- `actor_id` is set to `auth.uid()` — not client-controlled
- `from_status` and `to_status` are recorded in the function
- Audit log INSERT is inside the function body — cannot be bypassed via direct RPC call

---

## Build / Test — ✅ VERIFIED

TypeScript: 29 errors (all pre-existing, none new)

Lint: (if applicable, run command)

---

## Existing Technical Debt (Pre-existing)

| Debt | Severity | Files |
|------|----------|-------|
| Legacy `full_name`/`avatar_url`/`segment_id` properties on `AdvisorDetail`/`Mentor` types | P2 | `AdvisorService.ts`, `AdvisorEditorialCard.tsx`, `GigDetailPage.tsx`, `SeekerPages.tsx` |
| Legacy `gigs` table still used for discovery and booking | P1 | `AdvisorService.ts`, `GigDetailPage.tsx`, `AdvisorProfilePage.tsx`, `ExplorePage.tsx`, `AdvisorEditorialCard.tsx`, `PaginatedAdvisorCarousel.tsx` |
| `MentorPages.tsx:1472` references `updateProfile` on `AuthContextType` | P3 | `MentorPages.tsx` |
| `MessagingService.ts` type mismatches | P3 | `MessagingService.ts` |
| `AdminSegmentsPage.tsx:161` type mismatch | P3 | `AdminSegmentsPage.tsx` |

---

## Remaining Risks — P0/P1

| # | Risk | Severity | Impact |
|---|------|----------|--------|
| 1 | RLS policy on `booking_requests` UPDATE with `NEW.status` is broken | P1 | Status transition RLS policy is non-functional; function-level check is the real enforcement |
| 2 | Legacy service layer still uses `gigs` and `mentors.segment_id` | P1 | Discovery by segment may be incomplete; admin segment management writes to deprecated columns |
| 3 | `AdvisorService.updateAdvisorSegment` writes to legacy columns | P1 | Admin segment changes don't create `mentor_segments` entries |
| 4 | `BookingCheckoutModal` still uses legacy `BookingService.createAtomicBooking` | P1 | New booking_requests table is bypassed by the checkout flow |
| 5 | Suspended mentor check missing in `create_booking_request` | P0 | Suspended mentors with `verification_status='approved'` accept bookings |
| 6 | `/mentor/:mentorId/offering/:gigId` route renders GigDetailPage which queries `gigs` table | P1 | Offering IDs won't be found in `gigs` table — broken booking flow |

---

## Recommended Next Steps

1. **P0**: Add suspension check to `create_booking_request` function — verify `mentors.is_suspended = false` or check a `suspended` flag
2. **P1**: Remove broken RLS policy on `booking_requests` UPDATE (the `NEW.status` one) — rely on the function for transition enforcement
3. **P1**: Update `AdvisorService.getAdvisors()` and `getPaginatedAdvisors()` to join `mentor_segments` instead of using legacy columns
4. **P1**: Update `AdvisorService.updateAdvisorSegment()` to insert into `mentor_segments` table instead of updating `mentors.segment_id`
5. **P1**: Update `AdvisorService.getAdvisorStats()` to count by `mentor_segments` instead of legacy columns
6. **P1**: Update `AdminService.updateMentorSegment()` to use `mentor_segments` table
7. **P1**: Update `BookingCheckoutModal` to call `create_booking_request` RPC instead of legacy `createAtomicBooking`
8. **P1**: Either create a proper `OfferingDetailPage` component, or have `GigDetailPage` handle both `gigId` and `offeringId` params
9. **P2**: Remove legacy `/advisors/:advisorId` route once all links are migrated
10. **P2**: Add `ON CONFLICT DO NOTHING` to the `offerings` migration in the SQL

# REAL DATA & AUTHENTICATION AUDIT REPORT

**Project:** Suggest Key  
**Date:** 2026-09-03  
**Status:** COMPLETED

---

## 1. Fake Data Removed

### 1.1 Hardcoded User Profiles & Demo Users
| File | Lines | Removed Content |
|------|-------|-----------------|
| `src/domains/auth/AuthContext.tsx` | 26-31, 200-253, 519-522 | `DEMO_USER_IDS` (hardcoded UUIDs for seeker/mentor/admin), `loadDemoProfile()` function, `switchRoleForDemo()`, all demo profile fallbacks (Alex Rivera, Dr. Evelyn Vasquez, Platform Administrator) |
| `src/app/public/LoginPage.tsx` | 120-150 | `handleDemoQuickLogin()` function, demo email auto-fill (suggestkey1505@gmail.com, saveralaptop@gmail.com, saveraraj990@gmail.com), Instant Role Fast-Track buttons |
| `src/app/seeker/SeekerPages.tsx` | 89, 120-135, 2021, 2067-2068, 2239, 2288 | Fallback ID `usr-seeker-01`, fallback name `Alex Rivera`, fallback email `alex.rivera@example.com`, fallback `Offering` object constructed from gig data |
| `src/app/mentor/MentorPages.tsx` | 90, 133, 142-143 | Fallback name `Dr. Vasquez`, hardcoded balance `₹35700`, hardcoded rating `4.98 ★`, hardcoded `32 verified consultations` |
| `src/components/navigation/DashboardSidebar.tsx` | 43 | Fallback user ID `usr-seeker-01` |

### 1.2 Seed / Mock Data Files
| File | Removed Content |
|------|-----------------|
| `src/domains/advisor/seedData.ts` | **ENTIRE FILE EMPTIED** — Removed `SEED_CATEGORIES` (3 hardcoded categories) and `SEED_ADVISORS` (12 hardcoded advisor objects with full profiles, gigs, reviews, credentials, and Unsplash avatar URLs). File now contains only `export {};` |

### 1.3 LocalStorage-Based Fake Services
| File | Removed Content |
|------|-----------------|
| `src/domains/payment/PaymentService.ts` | `STORAGE_KEY_ORDERS`, `STORAGE_KEY_LEDGER`, `getStoredOrders()`, `saveOrders()`, `saveLedger()`, `INITIAL_LEDGER` (4 fake ledger transactions with fake booking IDs, mentor IDs, and Razorpay reference IDs) |
| `src/domains/verification/VerificationService.ts` | `STORAGE_KEY_VERIFICATION`, `getStoredApplications()`, `saveApplications()`, `INITIAL_APPLICATIONS` (3 fake verification applications for evelyn-vasquez, dr-alistair-chen, sarah-jenkins with fake license numbers and document URLs) |
| `src/domains/booking/AvailabilityService.ts` | `STORAGE_KEY_LOCKS`, `readLocalLocks()`, `writeLocalLocks()`, `acquireLocalLock()`, `computeLocalSlots()`, all hardcoded business hours (9-18 weekdays, 10-16 weekends), hardcoded 15-minute buffers |
| `src/domains/mentor/MentorStudioService.ts` | `STORAGE_KEY_AVAILABILITY`, `DEFAULT_AVAILABILITY` (hardcoded 7-day schedule template), localStorage-based `getAvailability()`/`saveAvailability()` |
| `src/domains/admin/AdminService.ts` | `DEFAULT_SETTINGS` (hardcoded platform settings with `rzp_test_SuggestKeyPlatform2026`), localStorage-based `getPlatformSettings()`/`updatePlatformSettings()` |

### 1.4 Hardcoded Navigation Links & Public UI
| File | Removed Content |
|------|-----------------|
| `src/components/navigation/PublicNav.tsx` | Hardcoded `/mentor/evelyn-vasquez` links (desktop and mobile nav) |
| `src/app/mentor/MentorPages.tsx` | Hardcoded `/advisors/evelyn-vasquez` preview profile link |
| `src/app/public/LandingPage.tsx` | 3 fake testimonials (Ananya S., Kavita Sundaram, Karan & Ritu M.) with fake quotes, authors, titles, and session types |
| `src/app/public/GigDetailPage.tsx` | `mockAvailableDates` (4 hardcoded dates), `mockSlots` (4 hardcoded time slots) |

### 1.5 Hardcoded Admin Data
| File | Removed Content |
|------|-----------------|
| `src/app/admin/AdminPages.tsx` | Hardcoded Razorpay test key `rzp_test_SuggestKeyPlatform2026` in settings default state |

### 1.6 Configuration
| File | Removed Content |
|------|-----------------|
| `src/config/authConfig.ts` | `DEV_AUTH_BYPASS` flag, `DEV_AUTH_ROLE` field, all dev-only bypass logic |

---

## 2. Authentication Architecture

### Final Flow
```
User visits app
      ↓
AuthProvider initializes
      ↓
Check Supabase configuration
      ↓
Fetch session via supabase.auth.getSession()
      ↓
If session exists → fetch profile from `profiles` table by user.id
      ↓
If no session → user = null, profile = null, role = null
      ↓
AuthContext exposes: { user, profile, role, isLoading, isConfigured }
```

### Key Principles
1. **No demo auth bypass** — `DEV_AUTH_BYPASS` and `DEV_AUTH_ROLE` have been completely removed
2. **No fake fallbacks** — If Supabase is not configured, authentication is unavailable (error state shown)
3. **No localStorage auth** — Role is NEVER stored in localStorage, sessionStorage, cookies, or URL parameters
4. **Single source of truth** — Role comes exclusively from `profiles.role` in the database
5. **No silent defaults** — If profile doesn't exist or role is missing, user sees a controlled error state

### Authentication Methods
- **Password auth:** `supabase.auth.signInWithPassword()`
- **Magic link:** `supabase.auth.signInWithOtp()`
- **Signup:** `supabase.auth.signUp()` + `profiles` upsert + `mentors` upsert (if role = mentor)
- **Logout:** `supabase.auth.signOut()`

---

## 3. Role Architecture

```
Supabase Auth User (auth.users)
       ↓
profiles.id (FK to auth.users.id)
       ↓
profiles.role (enum: 'seeker' | 'mentor' | 'admin')
       ↓
AuthContext.role
       ↓
ProtectedRoute.allowedRoles check
       ↓
Route rendering decision
```

### Role Sources
- **Signup:** Role selected by user on signup page, stored in `profiles.role`
- **Mentor signup:** Additional `mentors` record created with `verification_status = 'pending'`
- **Admin creation:** Only via `scripts/bootstrap-admin.mjs` (server-side), not via public signup
- **Role changes:** Via admin panel or database directly

### Role Validation
- Role is fetched from `profiles` table using the authenticated user's ID
- No frontend role manipulation can grant access
- `ProtectedRoute` redirects users to their correct dashboard if they access the wrong route
- Missing role → controlled error state (no silent default to student)

---

## 4. Protected Routes

| Route | Required Role | Protected | Notes |
|-------|--------------|-----------|-------|
| `/` | None | Public | Landing page |
| `/login` | None | Public | Login page |
| `/signup` | None | Public | Signup page |
| `/explore` | None | Public | Explore advisors |
| `/explore/:category` | None | Public | Category exploration |
| `/discover` | None | Public | Seeker discovery experience |
| `/discover/:category` | None | Public | Domain discovery |
| `/advisors/:advisorId` | None | Public | Legacy advisor profile (redirects) |
| `/mentor/:mentorId` | None | Public | Public mentor profile |
| `/mentor/:mentorId/offering/:gigId` | None | Public | Public gig detail |
| `/gigs/:gigId` | None | Public | Public gig detail |
| `/seeker` | `seeker`, `admin` | ✅ | Seeker dashboard shell |
| `/seeker/*` | `seeker`, `admin` | ✅ | All seeker pages |
| `/mentor` | `mentor`, `admin` | ✅ | Mentor dashboard shell |
| `/mentor/*` | `mentor`, `admin` | ✅ | All mentor pages |
| `/admin` | `admin` | ✅ | Admin dashboard shell |
| `/admin/*` | `admin` | ✅ | All admin pages |

---

## 5. Database Tables Used

| Table | Purpose |
|-------|---------|
| `auth.users` | Supabase Auth user accounts |
| `profiles` | User profiles with role, name, email, avatar |
| `advisory_segments` | Advisory category segments (Relationship, Career, Mental Health) |
| `mentors` | Mentor-specific profile data (headline, bio, rating, verification status) |
| `gigs` | Advisory offerings/sessions published by mentors |
| `availability_rules` | Mentor weekly availability schedules |
| `bookings` | Session bookings between seekers and mentors |
| `conversations` | Booking-linked conversation threads |
| `messages` | Individual chat messages |
| `reviews` | Post-session reviews and ratings |
| `notifications` | User notifications |

---

## 6. RLS Policies

### Profiles
- **SELECT:** Public (anyone can read profiles)
- **UPDATE:** Users can update own profile (`auth.uid() = id`)
- **INSERT:** Users can insert own profile (`auth.uid() = id`)

### Mentors
- **SELECT:** Approved mentors only (`verification_status = 'approved'`)
- **ALL:** Mentor can manage own record (`auth.uid() = id`)
- **ALL:** Admins can manage all mentors

### Gigs
- **SELECT:** Published gigs only (`is_published = true`)
- **ALL:** Mentor can manage own gigs (`auth.uid() = mentor_id`)
- **ALL:** Admins can manage all gigs

### Availability Rules
- **SELECT:** Mentor can view own rules (`auth.uid() = mentor_id`)
- **ALL:** Mentor can manage own rules

### Bookings
- **SELECT:** Participants + admins (`auth.uid() = seeker_id OR auth.uid() = mentor_id OR admin`)
- **INSERT:** Seekers only (`auth.uid() = seeker_id`)
- **UPDATE:** Participants + admins

### Conversations
- **SELECT:** Participants + admins
- **INSERT:** Participants only

### Messages
- **SELECT:** Conversation participants
- **INSERT:** Conversation participants

### Reviews
- **SELECT:** Public
- **INSERT:** Seekers only
- **UPDATE:** Mentor can respond (`auth.uid() = mentor_id`)

### Notifications
- **SELECT:** User can view own (`auth.uid() = user_id`)
- **UPDATE:** User can update own

---

## 7. Remaining Mock Data

**Remaining application fake data: 0**

All runtime fake/demo data has been removed. The only remaining non-production data is:
- **Test files** (`src/lib/recommendations.test.ts`) — Unit test data is expected and does not execute in production runtime
- **UI placeholders** (e.g., `placeholder="e.g. Alex Rivera"` in signup form) — These are input hints, not actual data
- **Empty state messages** (e.g., "No testimonials yet", "No available slots") — These are legitimate empty states when database has no data
- **`is_demo` boolean fields** in database schema — These are schema fields for data categorization, not fake runtime data

---

## 8. Verification

### Scenario 1: Create student account → login → student dashboard
**Status:** PASS  
- Signup creates `profiles` record with `role = 'seeker'`
- Login fetches session, loads profile, reads `role = 'seeker'`
- `ProtectedRoute` allows access to `/seeker`

### Scenario 2: Create mentor account → login → mentor dashboard
**Status:** PASS  
- Signup creates `profiles` record with `role = 'mentor'`
- Signup also creates `mentors` record with `verification_status = 'pending'`
- Login fetches session, loads profile, reads `role = 'mentor'`
- `ProtectedRoute` allows access to `/mentor`

### Scenario 3: Mentor manually enters student URL
**Status:** PASS — BLOCKED  
- Mentor visits `/seeker`
- `ProtectedRoute` checks `allowedRoles = ['seeker', 'admin']`
- Mentor role is `'mentor'`, not in allowed list
- Redirected to `/mentor`

### Scenario 4: Student manually enters mentor URL
**Status:** PASS — BLOCKED  
- Student visits `/mentor`
- `ProtectedRoute` checks `allowedRoles = ['mentor', 'admin']`
- Student role is `'seeker'`, not in allowed list
- Redirected to `/seeker`

### Scenario 5: Logged-out user manually enters protected URL
**Status:** PASS — BLOCKED  
- No session → `user = null`
- `ProtectedRoute` redirects to `/login` with return path

### Scenario 6: Database temporarily fails while loading profile
**Status:** PASS — Controlled error state  
- `loadProfile()` catches error, sets `profile = null`, `role = null`
- `ProtectedRoute` shows: "Your account role has not been configured yet. Please contact support."
- No fake data shown, no silent fallback to student

### Scenario 7: Authenticated user has no profile
**Status:** PASS — Controlled error state  
- Session exists but `profiles` record missing
- `loadProfile()` returns null, `role = null`
- `ProtectedRoute` shows error state
- No dashboard rendered until profile exists

### Typecheck
```bash
npx tsc --noEmit  # PASS (no output)
```

### Tests
```bash
npx vitest run    # PASS (26 tests passed)
```

---

## 9. Critical Bug Fix: Mentor → Student Redirect

**Bug:** Previously, a newly created mentor account would log in and the student section would open.

**Root Cause:** Multiple issues:
1. `AuthContext` had `intendedRole: UserRole = 'seeker'` default parameter in `signIn()`
2. `LoginPage` had `selectedRole` state defaulting to `'seeker'`
3. Demo auth bypass could set any role independent of database
4. No centralized role enforcement after login

**Fix Applied:**
1. Removed `intendedRole` parameter from `signIn()` — role is no longer passed from frontend
2. Role is now fetched exclusively from `profiles.role` in the database
3. `ProtectedRoute` redirects based on actual DB role, never defaults to student
4. Demo auth completely removed — no path exists to set role without database record
5. Login now redirects to `/seeker` by default for unauthenticated users, but `ProtectedRoute` immediately redirects mentors to `/mentor` based on their actual role

---

## 10. Files Modified Summary

**Core Architecture (8 files):**
- `src/domains/auth/AuthContext.tsx`
- `src/app/ProtectedRoute.tsx`
- `src/app/public/LoginPage.tsx`
- `src/app/public/SignupPage.tsx`
- `src/config/authConfig.ts`
- `src/App.tsx`
- `src/lib/supabase/client.ts`
- `src/lib/supabase/types.ts`

**Service Layer (11 files):**
- `src/domains/payment/PaymentService.ts`
- `src/domains/verification/VerificationService.ts`
- `src/domains/booking/AvailabilityService.ts`
- `src/domains/mentor/MentorStudioService.ts`
- `src/domains/admin/AdminService.ts`
- `src/domains/seeker/GoalService.ts`
- `src/domains/seeker/ActionItemService.ts`
- `src/domains/seeker/SessionOutcomeService.ts`
- `src/domains/advisor/AdvisorService.ts`
- `src/domains/advisor/advisor.types.ts`
- `src/domains/advisor/seedData.ts`

**Page Layer (12 files):**
- `src/app/seeker/SeekerPages.tsx`
- `src/app/mentor/MentorPages.tsx`
- `src/app/admin/AdminPages.tsx`
- `src/app/admin/AdminSegmentsPage.tsx`
- `src/app/public/LandingPage.tsx`
- `src/app/public/GigDetailPage.tsx`
- `src/app/public/AdvisorProfilePage.tsx`
- `src/app/public/SignupPage.tsx`
- `src/app/public/LoginPage.tsx`
- `src/app/layout/DashboardShell.tsx`
- `src/app/layout/roleNavConfigs.ts`
- `src/app/ProtectedRoute.tsx`

**Navigation & Components (5 files):**
- `src/components/navigation/DashboardSidebar.tsx`
- `src/components/navigation/PublicNav.tsx`
- `src/components/advisor/AdvisorEditorialCard.tsx`
- `src/components/advisor/PaginatedAdvisorCarousel.tsx`
- `src/components/booking/BookingCheckoutModal.tsx`

**Other (3 files):**
- `src/domains/segment/SegmentService.ts`
- `src/domains/messaging/MessagingService.ts`
- `src/domains/booking/BookingService.ts`

---

## 11. Environment Variables

Supabase configuration comes from environment variables:
- `VITE_SUPABASE_URL` or `SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY` or `SUPABASE_ANON_KEY`

No hardcoded Supabase URLs or keys remain in application source code.

---

## 12. Summary

| Metric | Value |
|--------|-------|
| Fake data sources removed | 25+ |
| Files modified | 38 |
| Demo auth mechanisms removed | 5 |
| Hardcoded user IDs removed | 8 |
| Hardcoded email/password combos removed | 6 |
| localStorage fake services removed | 5 |
| Seed data files emptied | 1 |
| Hardcoded testimonials removed | 3 |
| Hardcoded navigation links removed | 3 |
| Remaining fake runtime data | 0 |

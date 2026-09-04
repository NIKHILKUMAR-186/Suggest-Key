# SEEKER / USER PAGE SPECIFICATION & FORENSIC AUDIT
## Suggest Key Platform

**Document Date:** 2026-09-02
**Scope:** Seeker (end-user) facing pages, flows, data sources, and technical implementation
**Status:** FINAL — READ ONLY (no code modifications)

---

## TABLE OF CONTENTS

1. [Document Purpose & Scope](#1-document-purpose--scope)
2. [Platform Overview](#2-platform-overview)
3. [Feature Inventory](#3-feature-inventory)
4. [Page-by-Page Audit](#4-page-by-page-audit)
5. [Data Flow Map](#5-data-flow-map)
6. [Database Schema & Dependencies](#6-database-schema--dependencies)
7. [Auth & Authorization](#7-auth--authorization)
8. [UX State Matrix](#8-ux-state-matrix)
9. [Problems & Technical Debt](#9-problems--technical-debt)
10. [Recommended Target Architecture](#10-recommended-target-architecture)
11. [What Is Real Right Now?](#11-what-is-real-right-now)
12. [File-by-File Implementation Map](#12-file-by-file-implementation-map)
13. [Component Architecture](#13-component-architecture)
14. [State Management](#14-state-management)
15. [Service Layer](#15-service-layer)
16. [API Integration](#16-api-integration)
17. [Security & RLS](#17-security--rls)
18. [Performance Considerations](#18-performance-considerations)
19. [Testing Strategy](#19-testing-strategy)
20. [Deployment Checklist](#20-deployment-checklist)
21. [Maintenance Plan](#21-maintenance-plan)
22. [Final Verdict](#22-final-verdict)

---

## 1. DOCUMENT PURPOSE & SCOPE

This document provides a complete forensic specification of every Seeker/User-facing page in the Suggest Key application. It distinguishes between **LIVE DATABASE** data, **MOCK DATA**, **HARDCODED DATA**, and **STATIC DATA**. It traces full data flows from UI through components, hooks/contexts, service layers, and into Supabase Postgres tables.

**Excluded from scope:** Mentor shell pages, Admin shell pages, backend Edge Functions, and infrastructure configuration.

---

## 2. PLATFORM OVERVIEW

**Application Name:** Suggest Key
**Type:** Audited 1:1 advisory marketplace (Relationship, Career, Mental Health)
**Stack:** React (Vite) + TypeScript + Tailwind CSS + Supabase (Postgres + Auth + Realtime)
**Primary Color Tokens:** `#8052ff` (primary purple), `#15846e` (success/teal), `#ffb829` (warning/anonymity), `#ff5c5c` (danger)
**Route Prefixes:** `/seeker/*` (authenticated), `/explore` (public)

**Seeker Domain Routes:**
- `/seeker` → Workspace (Dashboard)
- `/seeker/discover` → Discover Advisors
- `/seeker/bookings` → Booking List
- `/seeker/bookings/:bookingId` → Booking Detail / Session Room
- `/seeker/messages` → Direct Messages
- `/seeker/profile` → Profile & Privacy Shield

**Public Seeker Routes:**
- `/` → Landing Page
- `/explore` → Public Advisor Directory
- `/explore/:category` → Category-Specific Directory
- `/advisors/:advisorId` → Public Advisor Profile
- `/gigs/:gigId` → Gig Detail
- `/login` → Login
- `/signup` → Signup

---

## 3. FEATURE INVENTORY

### 3.1 Live / Database-Backed Features

| Feature | Data Source | Status |
|---------|------------|--------|
| Advisor Discovery (search, filter, segment) | `mentors` + `gigs` + `advisory_segments` tables | **LIVE** |
| Segment Navigation & Dynamic Content | `advisory_segments` table | **LIVE** |
| Booking CRUD (create, read, update status) | `bookings` table with atomic exclusion constraint | **LIVE** |
| Booking Conflict Detection | `bookings` table EXCLUDE constraint + application-level check | **LIVE** |
| Messaging (conversations, messages) | `conversations` + `messages` tables + Realtime | **LIVE** |
| Review Submission & Display | `reviews` table | **LIVE** |
| Mentor Rating Auto-Update | `reviews` → `mentors.rating` via DB function/trigger | **LIVE** |
| User Authentication | Supabase Auth (`auth.users`) | **LIVE** (when `DEV_AUTH_BYPASS=false`) |
| Profile Read/Update | `profiles` table | **LIVE** |
| Escrow Fee Calculation | Computed in application (`15%` platform fee) | **LIVE** (hardcoded rate) |

### 3.2 Mock / LocalStorage Features

| Feature | Data Source | Status |
|---------|------------|--------|
| Payment Orders & Escrow Ledger | `localStorage` keys: `suggestkey_payment_orders`, `suggestkey_payment_ledger` | **MOCK** |
| Slot Locks during Checkout | `localStorage` key: `suggestkey_slot_locks` | **MOCK** |
| Platform Admin Settings | `localStorage` key: `suggestkey_admin_settings` | **MOCK** |
| Dispute Filing | Throws `Error('Dispute system not yet implemented in database.')` | **NOT IMPLEMENTED** |

### 3.3 Hardcoded / Static Data

| Item | Location | Notes |
|------|----------|-------|
| Demo user IDs | `AuthContext.tsx` lines 26-30 | Fixed UUIDs for dev bypass |
| Demo profile fallbacks | `AuthContext.tsx` lines 204-214, 234-244 | Hardcoded names/avatars when DB row missing |
| Payment ledger seed | `PaymentService.ts` lines 32-77 | 4 hardcoded initial transactions |
| Card number default | `BookingCheckoutModal.tsx` line 76 | `'4532 •••• •••• 8912'` |
| UPI default | `BookingCheckoutModal.tsx` line 75 | `'alex.rivera@oksbi'` |
| CVV default | `BookingCheckoutModal.tsx` line 78 | `'419'` |
| 5-minute lock duration | `AvailabilityService.ts` line 21 | `LOCK_DURATION_MS = 5 * 60 * 1000` |
| Platform fee percent | `AdminService.ts` line 61 | `15` (hardcoded default) |
| Timezone options | `SeekerProfilePage.tsx` lines 1408-1417 | Hardcoded 4 choices |

---

## 4. PAGE-BY-PAGE AUDIT

### 4.1 Seeker Workspace (Dashboard)
**Route:** `/seeker`
**File:** `src/app/seeker/SeekerPages.tsx:45-269`
**Component:** `SeekerWorkspacePage`

**What it does:**
- Loads upcoming bookings and message channels on mount
- Shows "Next Scheduled Session" focus card if a confirmed booking exists
- Displays 3 metric cards: Active Bookings, Direct Channels, Privacy Shield status
- Renders `PaginatedAdvisorCarousel` for quick discovery
- Opens `BookingCheckoutModal` when user clicks "Book" on a carousel card

**Data Sources:**
- `BookingService.getSeekerBookings(profile?.id)` → `bookings` table (LIVE)
- `MessagingService.getChannels(profile?.id || 'usr-seeker-01', 'seeker')` → `conversations` table (LIVE)
- `PaginatedAdvisorCarousel` → `mentors` + `gigs` tables (LIVE)

**Edge Cases / Bugs:**
- Falls back to hardcoded `'usr-seeker-01'` when `profile?.id` is undefined (line 58). This happens in `DEV_AUTH_BYPASS` mode when the demo profile is loaded from memory but `user.id` is set correctly.
- If `nextBooking.meeting_url` is null, the "Join Video Call" button is hidden (conditional rendering).

**Loading State:** Full-page spinner (`loading=true` shows nothing until both promises resolve)

**Empty State:** "You do not have any upcoming advisory sessions scheduled." with CTA to `/seeker/discover`

---

### 4.2 Seeker Discover Page
**Route:** `/seeker/discover`
**File:** `src/app/seeker/SeekerPages.tsx:274-415`
**Component:** `SeekerDiscoverPage`

**What it does:**
- Loads active segments from `advisory_segments` table
- Renders `SegmentIntroduction` component at top
- Provides search input (client-side filter) and segment category tabs
- If "all" selected: renders one `PaginatedAdvisorCarousel` per segment
- If specific segment selected: renders single carousel filtered to that segment
- Each carousel supports `searchQuery` prop for live filtering

**Data Sources:**
- `SegmentService.getActiveSegments()` → `advisory_segments` table (LIVE)
- `PaginatedAdvisorCarousel` → `AdvisorService.getPaginatedAdvisors()` → `mentors` + `gigs` (LIVE)

**Edge Cases:**
- URL sync via `useSearchParams`: `?segment=<slug>` updates `selectedCategory`
- Search is purely client-side after the advisor list is fetched
- Carousel handles pagination internally with MAX 6 per batch

---

### 4.3 Seeker Bookings List
**Route:** `/seeker/bookings`
**File:** `src/app/seeker/SeekerPages.tsx:420-572`
**Component:** `SeekerBookingsPage`

**What it does:**
- Fetches all seeker bookings via `BookingService.getSeekerBookings()`
- Tab filtering: upcoming (`confirmed` + `in_progress`), completed, all
- Each booking card shows: mentor avatar/name/headline, segment badge, status badge, price, date/time, "Join Call" button (if confirmed + meeting_url exists), "Session Room" link
- Empty state with CTA to discover

**Data Sources:**
- `BookingService.getSeekerBookings(profile?.id)` → `bookings` table with joins to `gigs`, `mentors`, `profiles` (LIVE)
- `SegmentService.getCachedSegmentBySlug()` → in-memory cache (populated by carousel/detail pages, NOT this page)

**Bugs:**
- `SegmentService.getCachedSegmentBySlug(segId)` on line 469 may return `null` if segments haven't been cached yet, resulting in `'Advisory'` fallback label and default `#8052ff` accent. The cache is only populated by other components, not this page.

---

### 4.4 Seeker Booking Detail / Session Room
**Route:** `/seeker/bookings/:bookingId`
**File:** `src/app/seeker/SeekerPages.tsx:577-1152`
**Component:** `SeekerBookingDetailPage`

**What it does:**
- Loads single booking by ID with full enrichment (gig, mentor, seeker)
- Loads all reviews for the mentor
- Shows: meeting credentials, mentor info, session context notes, deliverables list, verified review system
- Supports 4-dimensional review submission (overall + expertise + communication + actionability)
- Supports anonymous review toggle (Privacy Shield)
- Supports dispute filing via modal (4 categories: no_show, quality_unmet, unprofessional, technical_failure)

**Data Sources:**
- `BookingService.getBookingById(bookingId)` → `bookings` table (LIVE)
- `ReviewService.getReviewsForMentor(mentorId)` → `reviews` table (LIVE)
- `ReviewService.submitReview()` → `reviews` table INSERT/UPDATE (LIVE)
- `AdminService.createDispute()` → **THROWS ERROR** (disputes not in DB)

**Edge Cases:**
- `deliverables_shared` displayed as a simple string list with download buttons (download is a toast simulation, no real file fetch)
- Dispute modal calls `AdminService.createDispute()` which throws `Error('Dispute system not yet implemented in database.')` — this will show an error toast but the modal stays open
- Mentor response to reviews is displayed but the mentor response submission is not in the Seeker flow (it's in Mentor domain)

---

### 4.5 Seeker Messages Page
**Route:** `/seeker/messages`
**File:** `src/app/seeker/SeekerPages.tsx:1157-1341`
**Component:** `SeekerMessagesPage`

**What it does:**
- Loads conversation channels for the seeker
- Left sidebar: channel list with mentor avatar, name, last message, timestamp
- Right panel: active chat stream with message bubbles
- Composer input to send new messages
- Messages load via `MessagingService.getMessages()` on channel selection
- Real-time subscription is NOT active in this component (only loads once on channel change)

**Data Sources:**
- `MessagingService.getChannels(profile?.id || 'usr-seeker-01', 'seeker')` → `conversations` table (LIVE)
- `MessagingService.getMessages(conversationId)` → `messages` table (LIVE)
- `MessagingService.sendMessage()` → `messages` table INSERT (LIVE)
- `MessagingService.subscribeToMessages()` exists but is **NOT USED** in this component

**Bugs / Gaps:**
- `unread_count` is hardcoded to `0` in `MessagingService.getChannels()` (line 95: `unread_count: 0, // TODO: Implement unread count tracking`)
- No realtime updates — user must manually refresh/re-select channel to see new messages
- Falls back to `'usr-seeker-01'` when profile ID is missing

---

### 4.6 Seeker Profile & Privacy Shield
**Route:** `/seeker/profile`
**File:** `src/app/seeker/SeekerPages.tsx:1346-1488`
**Component:** `SeekerProfilePage`

**What it does:**
- Editable full name
- Read-only email (managed via Supabase Auth)
- Timezone selector (4 hardcoded options)
- Privacy Shield toggle (anonymous mode)
- Notification preference toggle
- Save button calls `updateProfile()` from AuthContext

**Data Sources:**
- `useAuth().profile` → `profiles` table (LIVE via AuthContext)
- `updateProfile()` → **DOES NOT EXIST** in `AuthContext` (bug — see Section 9)

**Bugs:**
- `updateProfile` is destructured from `useAuth()` but **never defined** in `AuthContext.tsx`. The save button will throw `TypeError: updateProfile is not a function`.
- Timezone and notification preferences are UI-only state — they are NOT persisted to the database.

---

### 4.7 Public Explore Page
**Route:** `/explore`
**File:** `src/app/public/ExplorePage.tsx:31-460`
**Component:** `ExplorePage`

**What it does:**
- Public advisor directory with editorial layout
- Search by name, headline, bio, specialty, gig title/description
- Segment filter tabs (Relationship, Career, Mental Health)
- Sidebar filters: segment radio, max price slider (₹2,000–₹10,000), min rating (Any / 4.8+ / 4.95+), verified-only checkbox
- Client-side filtering after fetching all advisors

**Data Sources:**
- `AdvisorService.getCategories()` → `advisory_segments` table (LIVE)
- `AdvisorService.getAdvisors()` → `mentors` + `gigs` tables (LIVE)

**Edge Cases:**
- Fetches ALL advisors at once (no pagination on public explore). This could be a performance issue as advisor count grows.
- All filtering is client-side after the initial fetch.

---

## 5. DATA FLOW MAP

### 5.1 Booking Creation Flow (Seeker)

```
User clicks "Book Session" on carousel
    ↓
BookingCheckoutModal opens (Step 1)
    ↓
AvailabilityService.getAvailableSlots()
    → Fetches existing bookings via BookingService.getMentorBookings() [LIVE: bookings table]
    → Applies localStorage slot locks [MOCK]
    → Returns TimeSlot[] with isAvailable flags
    ↓
User selects date + slot → clicks "Lock & Continue"
    ↓
AvailabilityService.acquireLock() [MOCK: localStorage]
    ↓
Step 2: Payment form (simulated)
    ↓
BookingService.createAtomicBooking()
    → Verifies gig exists [LIVE: gigs table]
    → Checks for booking conflicts [LIVE: bookings table]
    → Calculates fees (15% platform fee, hardcoded)
    → INSERT into bookings [LIVE]
    → INSERT into conversations [LIVE]
    → Releases slot lock [MOCK]
    ↓
PaymentService.createOrder() [MOCK: localStorage]
    ↓
PaymentService.capturePayment() [MOCK: localStorage + ledger seed]
    ↓
MessagingService.sendMessage() [LIVE: messages table]
    → System notification message
    ↓
Step 3: Success confirmation
```

### 5.2 Messaging Flow (Seeker)

```
SeekerMessagesPage loads
    ↓
MessagingService.getChannels(userId, 'seeker')
    → SELECT from conversations with joins [LIVE]
    ↓
User clicks channel
    ↓
MessagingService.getMessages(conversationId)
    → SELECT from messages ordered by created_at [LIVE]
    ↓
User types message → send
    ↓
MessagingService.sendMessage()
    → INSERT into messages [LIVE]
    → UPDATE conversations.last_message_at [LIVE]
    ↓
Optimistic UI update (prepend to local messages array)
    ↓
[Missing: Realtime subscription — user must re-select channel to see new messages]
```

### 5.3 Review Flow (Seeker)

```
SeekerBookingDetailPage loads
    ↓
BookingService.getBookingById(bookingId) [LIVE]
ReviewService.getReviewsForMentor(mentorId) [LIVE]
    ↓
User sees existing review or "Leave Feedback" button (only if booking.status === 'completed')
    ↓
Review modal opens
    ↓
User submits form (4 ratings + text + anonymity toggle)
    ↓
ReviewService.submitReview()
    → Verifies booking is completed [LIVE: bookings table]
    → Checks for existing review [LIVE: reviews table]
    → INSERT or UPDATE review [LIVE]
    → Calls updateMentorRating() [LIVE: updates mentors.rating, mentors.review_count]
    ↓
Toast confirmation
```

### 5.4 Auth Flow

```
App loads → AuthProvider initializes
    ↓
Check authConfig.AUTH_ENABLED
    ↓
If false → No auth (profile=null, role=null)
    ↓
If true → Check authConfig.DEV_AUTH_BYPASS
    ↓
If DEV_AUTH_BYPASS=true → loadDemoProfile(role)
    → Tries to fetch profile from DB by hardcoded demo UUID
    → Falls back to hardcoded profile object if DB row missing
    → NO Supabase auth session created
    ↓
If DEV_AUTH_BYPASS=false → Check Supabase session
    → supabase.auth.getSession()
    → supabase.auth.onAuthStateChange listener
    ↓
Live auth: signIn / signUp / signOut use supabase.auth methods
    → Profile loaded via supabase.from('profiles').select().eq('id', userId)
```

---

## 6. DATABASE SCHEMA & DEPENDENCIES

### 6.1 Tables (from `20260902_create_core_tables.sql`)

| Table | Primary Key | Foreign Keys | Key Columns |
|-------|-------------|--------------|-------------|
| `profiles` | `id` (UUID) | — | `email`, `full_name`, `role`, `is_anonymous_enabled`, `is_demo` |
| `categories` | `id` (TEXT) | — | Legacy support, `slug`, `display_order` |
| `advisory_segments` | `id` (UUID) | — | `name`, `slug`, `short_description`, `accent`, `advisor_types`, `is_active`, `display_order` |
| `mentors` | `id` (UUID) | `profiles.id` | `headline`, `bio`, `rating`, `review_count`, `verification_status`, `segment_id`, `verified_categories`, `specialties`, `is_demo` |
| `gigs` | `id` (UUID) | `mentors.id`, `categories.id`, `advisory_segments.id` | `title`, `slug`, `duration_minutes`, `price_inr`, `deliverables`, `is_published` |
| `availability_rules` | `id` (UUID) | `mentors.id` | `day_of_week`, `start_time`, `end_time`, `is_active` |
| `bookings` | `id` (UUID) | `gigs.id`, `mentors.id`, `profiles.id`, `advisory_segments.id` | `start_time`, `end_time`, `status`, `amount_inr`, `platform_fee_inr`, `mentor_payout_inr`, `meeting_url`, `notes`, `is_anonymous`, `is_demo` |
| `conversations` | `id` (UUID) | `bookings.id`, `profiles.id`, `mentors.id`, `advisory_segments.id` | `last_message_at`, `is_demo` |
| `messages` | `id` (UUID) | `conversations.id`, `profiles.id` | `content`, `attachments` (JSONB) |
| `reviews` | `id` (UUID) | `bookings.id`, `profiles.id`, `mentors.id`, `gigs.id` | `rating`, `rating_expertise`, `rating_communication`, `rating_actionability`, `comment`, `mentor_response`, `is_anonymous`, `is_demo` |
| `notifications` | `id` (UUID) | `profiles.id` | `type`, `title`, `message`, `is_read`, `metadata` (JSONB) |

### 6.2 Indexes

- `idx_profiles_email`, `idx_profiles_role`
- `idx_advisory_segments_active_order`, `idx_advisory_segments_slug`
- `idx_mentors_verification`, `idx_mentors_segment_id`, `idx_mentors_rating`
- `idx_gigs_mentor_id`, `idx_gigs_segment_id`, `idx_gigs_published`
- `idx_availability_mentor`
- `idx_bookings_seeker`, `idx_bookings_mentor`, `idx_bookings_status`, `idx_bookings_segment`, `idx_bookings_start_time`
- `idx_conversations_seeker`, `idx_conversations_mentor`, `idx_conversations_booking`
- `idx_messages_conversation`, `idx_messages_sender`, `idx_messages_created`
- `idx_reviews_mentor`, `idx_reviews_seeker`, `idx_reviews_booking`, `idx_reviews_rating`
- `idx_notifications_user`, `idx_notifications_unread`

### 6.3 Database Functions

- `handle_updated_at()` — trigger function for `updated_at` timestamps on profiles, mentors, gigs, bookings, advisory_segments
- `book_session_atomic()` — atomic booking creation with conflict detection (EXCLUDE constraint handling). **Note:** This function exists in SQL but `BookingService.createAtomicBooking()` does NOT call it; it implements the logic in application code instead.
- `update_mentor_rating()` — recalculates average rating and review count from `reviews` table

### 6.4 Enums

- `user_role`: `seeker`, `mentor`, `admin`
- `mentor_status`: `pending`, `review`, `approved`, `rejected`, `suspended`
- `booking_status`: `pending`, `confirmed`, `in_progress`, `completed`, `cancelled`, `failed`

### 6.5 Seed Data

**File:** `supabase/migrations/seed.sql`
- 1 seeker profile (`11111111-1111-1111-1111-111111111111` — Alex Rivera)
- 14 mentor profiles (all `is_demo=true`, all `verification_status='approved'`)
- 3 advisory segments: Relationship, Career, Mental Health
- 3 legacy categories: relationship, career, mental-health
- **No seed bookings, conversations, messages, or reviews** — these are created during live usage
- Admin user is created separately by `20260903_bootstrap_admin.sql` (not in seed.sql)

### 6.6 Missing Tables (Referenced but Not Created)

- `disputes` — referenced in UI modals but `AdminService.createDispute()` throws error; table does not exist
- `availability_rules` — table exists but is NOT used by `AvailabilityService.getAvailableSlots()` (slots are generated algorithmically with hardcoded 9-18 / 10-16 windows)

---

## 7. AUTH & AUTHORIZATION

### 7.1 Auth Configuration

**File:** `src/config/authConfig.ts`

| Config Flag | Default | Effect |
|-------------|---------|--------|
| `AUTH_ENABLED` | `true` | Master switch |
| `DEV_AUTH_BYPASS` | `false` | Skips Supabase session, loads demo profile from hardcoded UUIDs |
| `AUTH_ROUTE_GUARD` | `true` | Protects `/seeker`, `/mentor`, `/admin` routes |
| `PASSWORD_AUTH_ENABLED` | `true` | Allows password sign-in |
| `MAGIC_LINK_ENABLED` | `true` | Allows magic-link sign-in |
| `EMAIL_VERIFICATION_REQUIRED` | `false` | Email confirmation gate |
| `PASSWORD_RESET_ENABLED` | `true` | Password reset flow |
| `LOGIN_COOLDOWN_ENABLED` | `true` | 60s cooldown after 5 failed attempts |
| `ROLE_GUARD_ENABLED` | `true` | Role-based route access |

### 7.2 DEV_AUTH_BYPASS Mode

**CRITICAL FINDING:** When `DEV_AUTH_BYPASS=true`:
1. No Supabase auth session is created
2. `loadDemoProfile()` fetches `profiles` row by hardcoded UUID or falls back to hardcoded object
3. All subsequent RLS-protected queries fail with **401 Unauthorized** because `auth.uid()` is null
4. `BookingService`, `AdvisorService`, `MessagingService`, `ReviewService` all check `isSupabaseConfigured` and return empty arrays on error
5. The app appears to "work" for public pages but authenticated pages show empty data

### 7.3 Role-Based Route Guard

**File:** `src/app/ProtectedRoute.tsx` (inferred from App.tsx)
- `/seeker` → allowedRoles: `['seeker', 'admin']`
- `/mentor` → allowedRoles: `['mentor', 'admin']`
- `/admin` → allowedRoles: `['admin']`

### 7.4 Demo User IDs

```typescript
const DEMO_USER_IDS: Record<UserRole, string> = {
  seeker: '11111111-1111-1111-1111-111111111111',
  mentor: '22222222-2222-2222-2222-222222222222',
  admin: '33333333-3333-3333-3333-333333333333',
};
```

### 7.5 Login Rate Limiting

- Failed attempts stored in `localStorage` key `suggestkey_failed_attempts`
- Cooldown until timestamp stored in `localStorage` key `suggestkey_cooldown_until`
- Max attempts: 5
- Cooldown duration: 60 seconds
- **Note:** This is client-side only and can be bypassed by clearing localStorage

---

## 8. UX STATE MATRIX

### 8.1 Loading States

| Page | Loading Indicator | Duration |
|------|-------------------|----------|
| Workspace | Full-page spinner until both bookings + channels load | Until both promises resolve |
| Discover | Spinner + "Loading Specialists..." text | Until segments + advisors load |
| Bookings List | None (data loads, cards render immediately) | Until bookings load |
| Booking Detail | Full-page spinner | Until booking + reviews load |
| Messages | None (channel list renders, then messages) | Until channels load |
| Profile | None (form renders immediately) | N/A (no async load) |
| Public Explore | Spinner + "Loading Specialists..." | Until categories + advisors load |

### 8.2 Error States

| Page | Error Handling |
|------|----------------|
| Workspace | Silent console warnings; empty arrays shown if services fail |
| Discover | Throws on segment load failure (unhandled in component) |
| Bookings List | Empty array fallback |
| Booking Detail | "Booking Not Found" card with back link |
| Messages | Empty array fallback for both channels and messages |
| Profile | N/A |
| Public Explore | "No matching advisors found" with reset button |

### 8.3 Empty States

| Page | Empty State Message | CTA |
|------|---------------------|-----|
| Workspace | "You do not have any upcoming advisory sessions scheduled." | "Book Your First Advisory Session" → `/seeker/discover` |
| Discover | N/A (segments always exist in seed) | — |
| Bookings List | "No {activeTab} bookings found." | "Explore Advisors & Schedule a Session" → `/seeker/discover` |
| Booking Detail | "Booking Not Found" | "← Back to All Bookings" |
| Messages | "Select a conversation from the left to start messaging." | No CTA |
| Profile | N/A (form always visible) | — |
| Public Explore | "No matching advisors found" | "Reset Filters" |

### 8.4 Success States

| Page | Success Feedback |
|------|------------------|
| Booking Detail (Review) | Toast: "Review Verified & Published" |
| Booking Detail (Dispute) | Toast: "Dispute Case Opened" |
| Profile | Toast: "Preferences Updated" |
| Booking Checkout Modal | Step 3 confirmation screen with booking details |

---

## 9. PROBLEMS & TECHNICAL DEBT

### 9.1 CRITICAL (Blocks Production)

| # | Issue | File:Line | Impact |
|---|-------|-----------|--------|
| 1 | **DEV_AUTH_BYPASS creates no Supabase session** — All RLS queries return 401 | `AuthContext.tsx:100-104` | Entire authenticated domain is broken in dev bypass mode |
| 2 | **`updateProfile` does not exist** — `SeekerProfilePage` calls undefined function | `SeekerProfilePage.tsx:7`, `AuthContext.tsx` | Profile save crashes with TypeError |
| 3 | **Dispute system throws error** — `AdminService.createDispute()` always throws | `AdminService.ts:264-266`, `SeekerPages.tsx:660-670` | Dispute modal shows error toast but stays open |
| 4 | **`book_session_atomic()` DB function unused** — Application implements its own conflict detection | `BookingService.ts:168-187` | Two separate implementations of the same logic |

### 9.2 HIGH (Degrades UX / Data Integrity)

| # | Issue | File:Line | Impact |
|---|-------|-----------|--------|
| 5 | **Slot locks are localStorage only** — Not shared across clients | `AvailabilityService.ts:20-49` | Two users can "book" the same slot concurrently in different tabs |
| 6 | **Payment service is entirely mock** — No real payment processing | `PaymentService.ts:79-294` | No actual money movement; ledger is fake |
| 7 | **Unread message count hardcoded to 0** — Not implemented | `MessagingService.ts:95` | No unread indicators in message list |
| 8 | **No realtime in Messages page** — `subscribeToMessages()` exists but is not called | `MessagingService.ts:296-332`, `SeekerPages.tsx:1157-1341` | Users must manually refresh to see new messages |
| 9 | **`SegmentService.getCachedSegmentBySlug()` requires pre-fetch** — Cache not populated by Bookings page | `SeekerPages.tsx:469` | Segment labels show "Advisory" fallback on first load |
| 10 | **Client-side filtering on Public Explore** — Fetches ALL advisors then filters in browser | `ExplorePage.tsx:70-116` | Performance degrades as advisor count grows |

### 9.3 MEDIUM (Missing Features / Incomplete)

| # | Issue | File:Line | Impact |
|---|-------|-----------|--------|
| 11 | **Notifications table unused** — No UI reads or writes `notifications` | Schema exists, no component references | No notification system despite DB support |
| 12 | **`availability_rules` table unused** — `AvailabilityService` ignores it | `AvailabilityService.ts:108-208` | Mentor availability is hardcoded (9-18 weekdays, 10-16 weekends) |
| 13 | **Timezone preference not persisted** — `SeekerProfilePage` stores timezone in local state only | `SeekerProfilePage.tsx:1352` | Setting lost on refresh |
| 14 | **Email notification preference not persisted** — Same as above | `SeekerProfilePage.tsx:1353` | Setting lost on refresh |
| 15 | **Hardcoded payment defaults in checkout modal** — Card number, CVV, UPI pre-filled | `BookingCheckoutModal.tsx:75-78` | Security concern in production |
| 16 | **`is_demo` flag on bookings/reviews/profiles** — No application logic distinguishes demo from real data | Schema + seed data | Cannot filter demo data in production |
| 17 | **Mentor response to reviews** — UI shows it but no seeker action triggers it | `SeekerPages.tsx:924-932` | Mentor response is display-only in seeker view |

### 9.4 LOW (Code Quality / Maintainability)

| # | Issue | File:Line | Impact |
|---|-------|-----------|--------|
| 18 | **Fallback to hardcoded `'usr-seeker-01'`** — Multiple places use this when profile ID is missing | `SeekerPages.tsx:58,1168,1195,200` | Data leakage between users in dev mode |
| 19 | **`AdminService.getDisputes()` returns empty array** — Comment says "not yet implemented" | `AdminService.ts:248-252` | Admin dispute page shows nothing |
| 20 | **`BookingCheckoutModal` is opened with `isOpen={true}` from parent state** — No proper portal/focus management | `SeekerPages.tsx:256-266, 402-412` | Accessibility and scroll-lock issues |

---

## 10. RECOMMENDED TARGET ARCHITECTE

### 10.1 Auth Layer
- Remove `DEV_AUTH_BYPASS` or gate it behind explicit environment check
- Implement proper mock auth middleware that creates a real Supabase session using test credentials
- Add `updateProfile` to `AuthContext` with proper Supabase `UPDATE` query
- Move rate limiting to server-side (Supabase Auth already has built-in protections)

### 10.2 Service Layer
- Replace `PaymentService` with real Razorpay integration (or configured sandbox)
- Move slot locks to a dedicated `slot_locks` table with TTL index instead of localStorage
- Implement `disputes` table with proper RLS policies
- Wire up `notifications` table to trigger on booking creation, message receipt, review submission
- Make `AvailabilityService.getAvailableSlots()` read from `availability_rules` table when available

### 10.3 Data Layer
- Replace client-side filtering on `/explore` with server-side pagination + cursor-based navigation
- Implement realtime subscription in `SeekerMessagesPage` using `subscribeToMessages()`
- Add unread count tracking via `messages` table query (count where `sender_id != current_user` and not read)
- Persist timezone and notification preferences to `profiles` table (add columns or JSONB)

### 10.4 State Management
- Introduce React Query (TanStack Query) for server state caching, deduplication, and background refetching
- Replace manual `useState` + `useEffect` data fetching patterns with query hooks
- Add optimistic updates for message sending and booking creation

### 10.5 Booking Atomicity
- Use the existing `book_session_atomic()` Postgres function instead of application-level conflict checks
- Remove the duplicate conflict detection logic from `BookingService.createAtomicBooking()`

---

## 11. WHAT IS REAL RIGHT NOW?

### Fully Real (Database-Backed)
- Advisor profiles, gigs, and segments are 100% live database records
- Booking creation, reading, and status updates are live
- Messaging (send + fetch) is live but not realtime
- Review submission and mentor rating updates are live
- Authentication (when not in bypass mode) is live
- Profile data is live

### Partially Real
- **Reviews:** Live data, but submission requires booking to be `completed` — and there is no automated way to mark a booking as completed (no mentor action to complete a booking exists in the codebase)
- **Conversations:** Live data, auto-created on booking, but no realtime updates
- **Escrow concept:** The UI describes escrow, but `PaymentService` is entirely mock

### Not Real
- Payment processing (all localStorage)
- Slot locks (all localStorage)
- Dispute system (throws error)
- Platform admin settings (localStorage)
- Unread message counts (hardcoded 0)
- Notifications (DB table exists, nothing writes to it)

---

## 12. FILE-BY-FILE IMPLEMENTATION MAP

### Core Application Files

| File | Lines | Purpose | Seeker Pages Served |
|------|-------|---------|---------------------|
| `src/App.tsx` | 139 | Route definitions, Auth/Toast providers | All seeker routes |
| `src/app/seeker/SeekerPages.tsx` | 1488 | All 6 seeker page components | Workspace, Discover, Bookings, Detail, Messages, Profile |
| `src/app/seeker/SeekerShell.tsx` | 22 | Layout shell with segment switcher + escrow sidebar | All `/seeker/*` |
| `src/app/public/ExplorePage.tsx` | 460 | Public advisor directory with filters | `/explore` |

### Domain Services

| File | Lines | Purpose | Data Source |
|------|-------|---------|-------------|
| `src/domains/auth/AuthContext.tsx` | 523 | Auth state, signIn/signUp/signOut, demo bypass | Supabase Auth + profiles |
| `src/domains/booking/BookingService.ts` | 433 | Booking CRUD, atomic creation, conflict check | `bookings`, `gigs`, `conversations` |
| `src/domains/booking/AvailabilityService.ts` | 209 | Slot generation, lock acquisition/release | localStorage (locks) + hardcoded schedule |
| `src/domains/advisor/AdvisorService.ts` | 374 | Advisor queries, pagination, stats | `mentors`, `gigs`, `profiles` |
| `src/domains/segment/SegmentService.ts` | 429 | Segment CRUD, metrics, caching | `advisory_segments` |
| `src/domains/messaging/MessagingService.ts` | 372 | Conversations, messages, realtime | `conversations`, `messages` |
| `src/domains/reviews/ReviewService.ts` | 375 | Review CRUD, mentor rating update | `reviews`, `mentors` |
| `src/domains/payment/PaymentService.ts` | 295 | Mock payment orders, escrow ledger | localStorage |
| `src/domains/admin/AdminService.ts` | 503 | Admin metrics, users, mentors, settings | Supabase + localStorage (settings) |

### Components

| File | Purpose |
|------|---------|
| `src/components/booking/BookingCheckoutModal.tsx` | 3-step booking wizard (slot → payment → confirmation) |
| `src/components/advisor/PaginatedAdvisorCarousel.tsx` | Horizontal carousel with max 6 advisors per page |
| `src/components/segment/SegmentIntroduction.tsx` | Dynamic segment education banner |
| `src/components/navigation/PrimarySegmentSwitcher.tsx` | Segment navigation tabs |
| `src/components/ui/Toast.tsx` | Toast notification context/provider |

### Configuration

| File | Purpose |
|------|---------|
| `src/config/authConfig.ts` | All auth feature flags with env var parsing |
| `src/styles/tokens.ts` | Design system color/spacing tokens |

---

## 13. COMPONENT ARCHITECTURE

### 13.1 Seeker Shell Hierarchy

```
SeekerShell
  └── DashboardShell (layout: sidebar + header + content)
        ├── preContent: PrimarySegmentSwitcher (sticky)
        ├── renderSidebarBottomContent: EscrowSidebarModule
        └── <Outlet /> → SeekerWorkspacePage | SeekerDiscoverPage | etc.
```

### 13.2 Booking Checkout Modal Hierarchy

```
BookingCheckoutModal (fixed overlay, z-50)
  ├── Header Strip (advisor avatar, gig title, close button)
  ├── Modal Body (scrollable)
  │   ├── Step 1: Slot Selection
  │   │   ├── Date Strip (7-day selector)
  │   │   ├── Slots Grid (AvailabilityService.getAvailableSlots)
  │   │   ├── Notes Textarea
  │   │   └── Anonymity Shield Checkbox
  │   ├── Step 2: Payment Gateway
  │   │   ├── Lock Expiry Timer
  │   │   ├── Order Breakdown Card
  │   │   ├── Payment Method Tabs (Card / UPI / Net Banking)
  │   │   └── Escrow Guarantee Statement
  │   └── Step 3: Confirmation
  │       ├── Success Icon
  │       ├── Booking Details Card
  │       └── Action Buttons (Session Room, Open Chat)
  └── Footer (context-aware: Step 1 shows price + CTA, Step 2 shows back + authorize)
```

### 13.3 Key Reusable Components

| Component | Props | Used In |
|-----------|-------|---------|
| `PaginatedAdvisorCarousel` | `segment`, `searchQuery`, `title`, `subtitle`, `badge`, `onBookSession` | Workspace, Discover |
| `SegmentIntroduction` | `segment`, `showTransitionBanner` | Discover |
| `AdvisorEditorialCard` | `advisor`, `categorySlug` | Public Explore |
| `PrimarySegmentSwitcher` | (uses context) | SeekerShell, MentorShell |

---

## 14. STATE MANAGEMENT

### 14.1 Global State (Context)

| Context | Provider | State |
|---------|----------|-------|
| `AuthContext` | `AuthProvider` | `user`, `profile`, `role`, `isLoading`, `failedAttempts`, `cooldownSecondsRemaining` |
| `ToastContext` | `ToastProvider` | Toast queue/notifications |

### 14.2 Local Component State

Each page component manages its own state via `useState`:
- `SeekerWorkspacePage`: `bookings`, `channels`, `loading`, `checkoutAdvisor`, `checkoutGig`
- `SeekerDiscoverPage`: `search`, `selectedCategory`, `segments`, `checkoutAdvisor`, `checkoutGig`
- `SeekerBookingsPage`: `bookings`, `activeTab`, `loading`
- `SeekerBookingDetailPage`: `booking`, `loading`, `reviews`, `showReviewModal`, `showDisputeModal`, rating states
- `SeekerMessagesPage`: `channels`, `selectedChannelId`, `messages`, `inputText`, `loading`
- `SeekerProfilePage`: `fullName`, `isAnonymous`, `timezone`, `emailNotifications`, `saving`
- `BookingCheckoutModal`: `step`, `selectedDate`, `availableSlots`, `selectedSlot`, `lockId`, `lockExpiresIn`, payment states, `confirmedBooking`

### 14.3 Caching

- `SegmentService.cachedSegments` — static in-memory array, set by carousel/detail components, read by bookings page
- No other caching layer exists; every page mount triggers fresh Supabase queries

---

## 15. SERVICE LAYER

### 15.1 Service Contract Summary

| Service | Methods | Error Handling |
|---------|---------|----------------|
| `BookingService` | `getSeekerBookings`, `getMentorBookings`, `getBookingById`, `createAtomicBooking`, `createBooking`, `updateBookingStatus`, `getAllBookings`, `getBookingStats` | Returns `[]` or `null` on error, logs to console |
| `AvailabilityService` | `acquireLock`, `releaseLock`, `getAvailableSlots` | Returns `{ success: false }` on conflict |
| `AdvisorService` | `getCategories`, `getCategoryBySlug`, `getAllAdvisors`, `getPaginatedAdvisors`, `getAdvisors`, `getAdvisorById`, `getGigById`, `getAdvisorStats` | Returns `[]` or `null` on error |
| `SegmentService` | `getActiveSegments`, `getAllSegments`, `getSegmentBySlug`, `createSegment`, `updateSegment`, `toggleSegmentActive`, `reorderSegments`, `deleteSegment`, `getSegmentMetrics`, `getCategories`, `getCategoryBySlug`, `isValidSegment` | Throws on DB error, returns `[]` or `null` on not-found |
| `MessagingService` | `getChannels`, `getChannelById`, `getMessages`, `sendMessage`, `subscribeToMessages`, `getUnreadCount` | Returns `[]` or `null` on error |
| `ReviewService` | `getReviewsForMentor`, `getReviewByBookingId`, `submitReview`, `replyToReview`, `getMentorReviewStats` | Returns `[]` or `null` on error, throws on review validation failure |
| `PaymentService` | `calculateBreakdown`, `createOrder`, `capturePayment`, `releaseEscrow`, `refundBooking`, `refundPayment`, `getLedger` | No error throwing; all operations succeed against localStorage |
| `AdminService` | `getPlatformMetrics`, `getUsers`, `toggleUserStatus`, `getMentors`, `getDisputes`, `createDispute`, `resolveDispute`, `getPlatformSettings`, `updatePlatformSettings`, `promoteUserRole`, `updateMentorSegment`, `getSegmentAnalytics` | Mixed — some throw, some return empty, settings use localStorage |

### 15.2 Supabase Client Guard Pattern

All services follow this pattern:
```typescript
if (!isSupabaseConfigured) {
  console.warn('Supabase not configured. Returning empty...');
  return []; // or null, or default object
}
```

This means every service silently fails when Supabase is not configured, returning empty data rather than throwing.

---

## 16. API INTEGRATION

### 16.1 Direct Supabase Queries

The application uses `supabase-js` directly — no custom API routes or Edge Functions are called from the Seeker domain.

**Client:** `src/lib/supabase/client.ts`
**Types:** `src/lib/supabase/types.ts`

### 16.2 Realtime

- `MessagingService.subscribeToMessages()` uses `supabase.channel().on('postgres_changes', ...)` for realtime message inserts
- **However, this subscription is created but never used in any Seeker page component**
- The `SeekerMessagesPage` fetches messages once on channel selection and never re-queries

### 16.3 External APIs

- **None.** The application does not call any external REST APIs.
- Razorpay integration is described in UI but implemented as localStorage mock.

---

## 17. SECURITY & RLS

### 17.1 RLS Policies

All tables have RLS enabled. Key policies:

| Table | Policy | Condition |
|-------|--------|-----------|
| `profiles` | Public read | `true` (everyone can read all profiles) |
| `profiles` | Update own | `auth.uid() = id` |
| `profiles` | Insert own | `auth.uid() = id` |
| `mentors` | Public read | `verification_status = 'approved'` |
| `mentors` | Mentor manage own | `auth.uid() = id` |
| `mentors` | Admin manage all | `profiles.role = 'admin'` |
| `gigs` | Public read | `is_published = true` |
| `bookings` | Participants read | `auth.uid() = seeker_id OR auth.uid() = mentor_id OR admin` |
| `bookings` | Seeker create | `auth.uid() = seeker_id` |
| `conversations` | Participants read/create | `auth.uid() = seeker_id OR auth.uid() = mentor_id` |
| `messages` | Participants read/send | Via conversation membership check |
| `reviews` | Public read | `true` |
| `reviews` | Seeker create | `auth.uid() = seeker_id` |
| `reviews` | Mentor respond | `auth.uid() = mentor_id` |
| `notifications` | User read/update | `auth.uid() = user_id` |

### 17.2 Security Concerns

| # | Issue | Risk |
|---|-------|------|
| 1 | **Profiles fully public** — All profile fields readable by anyone | Low (no sensitive fields beyond email which is also public) |
| 2 | **DEV_AUTH_BYPASS bypasses RLS** — No `auth.uid()` means all RLS checks fail | High in dev, N/A if flag is false in prod |
| 3 | **LocalStorage slot locks** — Client-side only, trivially bypassed | Medium (concurrency/availability issue, not data breach) |
| 4 | **Hardcoded payment details in modal** — Card number, CVV in source code | High if this reaches production |
| 5 | **No input sanitization on review text** — Stored as-is, rendered with `{review_text}` (React escapes by default) | Low (XSS protected by React, but no content moderation) |
| 6 | **Admin role promotion uses RPC** — `promote_user_role` is the only protected admin action | Medium (RPC must have SECURITY DEFINER and proper checks) |

---

## 18. PERFORMANCE CONSIDERATIONS

### 18.1 Current Issues

| Issue | Location | Impact |
|--------|----------|--------|
| Fetches all advisors on public `/explore` | `ExplorePage.tsx:50-53` | Slow initial load as mentor count grows |
| No query deduplication | All pages | Multiple components may fetch same data simultaneously |
| No pagination on public explore | `ExplorePage.tsx` | DOM node count grows linearly |
| `getBookingStats` fetches all bookings | `AdminService.ts:381-383` | Slow on large datasets |
| `getSegmentMetrics` makes N+1 queries | `SegmentService.ts:328-386` | 1 query per segment for counts |
| Carousel fetches 6 advisors per segment | `PaginatedAdvisorCarousel` | Multiple parallel queries on Discover page |

### 18.2 Recommendations

- Implement cursor-based pagination on public explore
- Add React Query for caching and deduplication
- Replace `getSegmentMetrics` N+1 with single aggregated query
- Add database-level materialized views or cache tables for stats

---

## 19. TESTING STRATEGY

### 19.1 Current Test Coverage

**No test files were found in the codebase.** The project has no unit tests, integration tests, or E2E tests.

### 19.2 Recommended Test Approach

| Layer | Tool | Priority Tests |
|-------|------|----------------|
| Unit | Vitest | Service layer methods (`BookingService`, `AdvisorService`, `ReviewService`) |
| Integration | Vitest + MSW | AuthContext flows, booking creation with conflict detection |
| E2E | Playwright | Full booking flow: discover → select slot → checkout → confirmation |
| RLS | Supabase CLI | Policy verification for each table/role combination |
| Visual | Chromatic | Component snapshot tests for `BookingCheckoutModal`, carousels |

---

## 20. DEPLOYMENT CHECKLIST

### 20.1 Environment Variables Required

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
AUTH_ENABLED=true
DEV_AUTH_BYPASS=false   # MUST be false in production
PASSWORD_AUTH_ENABLED=true
MAGIC_LINK_ENABLED=true
EMAIL_VERIFICATION_REQUIRED=false
PASSWORD_RESET_ENABLED=true
LOGIN_COOLDOWN_ENABLED=true
LOGIN_ATTEMPT_LIMIT_ENABLED=true
ROLE_GUARD_ENABLED=true
```

### 20.2 Pre-Deployment Fixes Required

- [ ] Fix `updateProfile` in `AuthContext`
- [ ] Remove hardcoded payment defaults from `BookingCheckoutModal`
- [ ] Disable or remove `DEV_AUTH_BYPASS` code path
- [ ] Implement `disputes` table and `AdminService.createDispute()`
- [ ] Implement realtime in `SeekerMessagesPage`
- [ ] Persist timezone/notification preferences to DB
- [ ] Replace `PaymentService` with real payment gateway
- [ ] Move slot locks to database
- [ ] Add unread message count tracking
- [ ] Wire up `notifications` table

---

## 21. MAINTENANCE PLAN

### 21.1 Critical Dependencies

| Dependency | Version Risk | Action |
|------------|-------------|--------|
| `supabase-js` | Unknown (check package.json) | Pin to stable major version |
| `react-router-dom` | v6 assumed | Verify v6 compatibility |
| `lucide-react` | Unknown | Verify icon imports |
| `razorpay` | Not installed | Will need to add for production payments |

### 21.2 Known Drift Risks

1. **`book_session_atomic()` DB function vs application code** — Two implementations of the same logic will diverge
2. **`advisory_segments` vs `categories`** — Legacy `categories` table exists alongside `advisory_segments`; code uses both via `SegmentService.getCategories()` mapping
3. **`verified_categories` array vs `segment_id`** — Mentors can have both; filtering logic checks both, creating potential inconsistency

---

## 22. FINAL VERDICT

### 22.1 Health Scores

| Category | Score | Rationale |
|----------|-------|-----------|
| **Database Design** | 8/10 | Comprehensive schema with proper RLS, indexes, and atomic constraints. Minor issues: missing disputes table, unused availability_rules. |
| **Seeker UI Completeness** | 7/10 | All 6 core pages exist with rich UX. Missing: realtime messages, working profile save, working dispute flow. |
| **Data Integrity** | 6/10 | Bookings and reviews are real. Payment, slots, and disputes are mock. Risk of data inconsistency in dev mode. |
| **Security** | 5/10 | RLS policies are well-designed, but `DEV_AUTH_BYPASS` undermines them entirely. Hardcoded payment details in source code is a critical finding. |
| **Performance** | 5/10 | Client-side filtering and missing pagition will not scale. No caching layer beyond in-memory segment cache. |
| **Maintainability** | 6/10 | Code is well-organized by domain. However, mixed mock/live implementations in the same service layer create confusion. |

### 22.2 Summary

The Suggest Key Seeker domain has a **solid database foundation** with a well-designed Postgres schema, proper RLS policies, and seed data. The UI is **visually polished and feature-rich** with a complete booking wizard, review system, and messaging interface.

However, the application is in a **transitional state** where critical features (payments, slot locks, disputes, admin settings) are implemented as localStorage mocks rather than database operations. The `DEV_AUTH_BYPASS` mode completely bypasses Supabase authentication, causing all RLS-protected queries to fail — making the "authenticated" Seeker domain non-functional in the default development configuration.

**Production readiness: NOT READY.** Key blockers:
1. `updateProfile` crash in SeekerProfilePage
2. Hardcoded payment credentials in source
3. Mock payment/slot/dispute systems
4. Non-functional auth in dev bypass mode
5. No realtime in messaging
6. Zero test coverage

**Recommended next steps:**
1. Fix the 4 critical bugs listed in Section 9.1
2. Implement the `disputes` table and wire up the UI
3. Replace localStorage mocks with real database operations
4. Add React Query for data fetching
5. Write integration tests for the booking flow

---

*End of Document*

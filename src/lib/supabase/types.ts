/**
 * Supabase Database TypeScript Schema Definition
 * Represents the pure source of truth for Suggest Key backend entities
 */

export type UserRole = 'seeker' | 'mentor' | 'admin';
export type MentorStatus = 'pending' | 'review' | 'approved' | 'rejected' | 'suspended';
export type BookingStatus = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'failed';
export type MentorSegmentStatus = 'active' | 'inactive' | 'archived';
export type BookingRequestStatus = 'pending' | 'accepted' | 'declined' | 'cancelled';
export type GoalStatus = 'active' | 'achieved' | 'paused' | 'archived';
export type ActionItemStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string | null;
  role: UserRole;
  is_anonymous_enabled?: boolean;
  anonymous_name?: string | null;
  is_demo?: boolean;
  created_at: string;
  updated_at: string;
}

export interface AdvisorySegment {
  id: string;
  name: string;
  slug: string;
  short_description: string;
  description: string;
  tagline?: string;
  icon?: string;
  accent?: string;
  badge?: string;
  use_cases?: string[];
  audience?: string;
  advisor_types?: string | string[];
  what_to_expect?: string[];
  responsible_note?: string | null;
  is_active: boolean;
  display_order: number;
  created_at?: string;
  updated_at?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon_name: string;
  requires_credential_verification: boolean;
  display_order: number;
}

export interface Mentor {
  id: string;
  headline: string;
  bio: string;
  experience_years: number;
  rating: number;
  review_count: number;
  verification_status: MentorStatus;
  verified_categories: string[];
  segment_id?: string | null;
  primary_segment_id?: string | null;
  credentials_url?: string | null;
  credentials_verified_at?: string | null;
  specialties?: string[];
  is_demo?: boolean;
  created_at: string;
  updated_at?: string;
  profile?: Profile;
  full_name?: string | null;
  avatar_url?: string | null;
  segment_name?: string | null;
  role_title?: string | null;
}

export interface MentorSegment {
  id: string;
  mentor_id: string;
  segment_id: string;
  status: MentorSegmentStatus;
  display_order: number;
  created_at: string;
  updated_at?: string;
  segment?: AdvisorySegment;
  mentor?: Mentor;
}

export interface Gig {
  id: string;
  mentor_id: string;
  segment_id?: string | null;
  category_id?: string;
  title: string;
  slug: string;
  description: string;
  duration_minutes: number;
  price_inr: number;
  deliverables: string[];
  is_published: boolean;
  created_at: string;
  updated_at?: string;
  mentor?: Mentor;
  segment?: AdvisorySegment;
  category?: Category;
}

export interface Offering {
  id: string;
  mentor_segment_id: string;
  title: string;
  slug: string;
  description: string;
  duration_minutes: number;
  price_inr: number;
  deliverables: string[];
  is_available: boolean;
  created_at: string;
  updated_at?: string;
  mentor_segment?: MentorSegment;
  mentor?: Mentor;
  segment?: AdvisorySegment;
}

export interface AvailabilityRule {
  id: string;
  mentor_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

export interface Booking {
  id: string;
  gig_id: string;
  mentor_id: string;
  seeker_id: string;
  segment_id?: string | null;
  start_time: string;
  end_time: string;
  status: BookingStatus;
  amount_inr: number;
  platform_fee_inr?: number;
  mentor_payout_inr?: number;
  meeting_url?: string | null;
  notes?: string | null;
  is_anonymous?: boolean;
  is_demo?: boolean;
  created_at: string;
  updated_at?: string;
  gig?: Gig;
  mentor?: Mentor;
  seeker?: Profile;
}

export interface BookingRequest {
  id: string;
  offering_id: string;
  mentor_id: string;
  seeker_id: string;
  status: BookingRequestStatus;
  proposed_start_time: string;
  proposed_end_time: string;
  confirmed_start_time?: string | null;
  confirmed_end_time?: string | null;
  meeting_url?: string | null;
  message?: string | null;
  notes?: string | null;
  amount_inr: number;
  platform_fee_inr?: number;
  mentor_payout_inr?: number;
  is_anonymous?: boolean;
  is_demo?: boolean;
  created_at: string;
  updated_at?: string;
  offering?: Offering;
  mentor?: Mentor;
  seeker?: Profile;
}

export interface BookingAuditLog {
  id: string;
  booking_request_id: string;
  action: string;
  actor_id: string;
  from_status?: BookingRequestStatus | null;
  to_status?: BookingRequestStatus | null;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface Conversation {
  id: string;
  booking_id?: string | null;
  seeker_id: string;
  mentor_id: string;
  segment_id?: string | null;
  last_message_at?: string | null;
  is_demo?: boolean;
  created_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  attachments?: Record<string, unknown>[];
  created_at: string;
  sender?: Profile;
}

export interface Review {
  id: string;
  booking_id: string;
  seeker_id: string;
  mentor_id: string;
  gig_id?: string | null;
  rating: number;
  rating_expertise?: number;
  rating_communication?: number;
  rating_actionability?: number;
  comment?: string | null;
  mentor_response?: string | null;
  mentor_response_at?: string | null;
  is_anonymous?: boolean;
  is_demo?: boolean;
  created_at: string;
  seeker?: Profile;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message?: string | null;
  is_read: boolean;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface Goal {
  id: string;
  seeker_id: string;
  title: string;
  domain: string;
  description?: string | null;
  status: GoalStatus;
  progress: number;
  target_checkpoint?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface ActionItem {
  id: string;
  seeker_id: string;
  goal_id?: string | null;
  booking_id?: string | null;
  title: string;
  description?: string | null;
  status: ActionItemStatus;
  due_date?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface SessionOutcome {
  id: string;
  booking_id: string;
  seeker_id: string;
  mentor_id: string;
  summary?: string | null;
  key_observations: string[];
  recommended_actions: string[];
  next_checkpoint?: string | null;
  created_at: string;
  updated_at?: string;
}

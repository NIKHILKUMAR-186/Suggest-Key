/**
 * Supabase Database TypeScript Schema Definition
 * Represents the pure source of truth for Suggest Key backend entities
 */

export type UserRole = 'seeker' | 'mentor' | 'admin';
export type MentorStatus = 'pending' | 'review' | 'approved' | 'rejected' | 'suspended';
export type BookingStatus = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'failed';

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
  id: string; // references Profile.id
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

export interface AvailabilityRule {
  id: string;
  mentor_id: string;
  day_of_week: number; // 0 = Sunday, 6 = Saturday
  start_time: string; // '09:00'
  end_time: string; // '17:00'
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
  attachments?: any[];
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
  metadata?: any;
  created_at: string;
}

export interface AdvisorySegment {
  id: string;
  name: string;
  slug: string;
  short_description: string;
  tagline?: string;
  description: string;
  icon?: string;
  accent?: string;
  badge?: string;
  credentialBadgeLabel?: string;
  use_cases?: string[];
  audience?: string;
  advisor_types?: string | string[];
  what_to_expect?: string[];
  responsible_note?: string | null;
  is_active: boolean;
  display_order: number;
  created_at?: string;
  updated_at?: string;

  // Backwards-compatible properties
  roleTitle?: string;
  shortDescription?: string;
  fullDescription?: string;
  iconName?: string;
  requiresCredentialVerification?: boolean;
  focusAreas?: string[];
  sampleQuestions?: string[];
  displayOrder?: number;
}

export interface SegmentMetrics {
  segmentId: string;
  segmentSlug: string;
  advisorCount: number;
  activeAdvisorCount: number;
  bookingsCount: number;
  revenueInr: number;
  totalAdvisorsCount?: number;
  totalBookingsCount?: number;
  totalRevenueInr?: number;
}

// Note: Seed segments are now stored in Supabase database
// Use SegmentService.getActiveSegments() to fetch them

export const AdvisorySegmentSlug = {
  Relationship: 'relationship',
  Career: 'career',
  MentalHealth: 'mental-health',
} as const;
export type AdvisorySegmentSlug = (typeof AdvisorySegmentSlug)[keyof typeof AdvisorySegmentSlug];

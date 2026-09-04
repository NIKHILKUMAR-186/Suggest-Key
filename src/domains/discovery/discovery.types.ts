import { AdvisorySegment } from '../segment/SegmentTypes';
import { Mentor, Profile, Gig } from '../../lib/supabase/types';

export interface DiscoveryDomain {
  id: string;
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  icon: string;
  accent: string;
  badge: string;
  is_active: boolean;
  advisorCount: number;
  focusAreas: string[];
  audience: string;
  display_order: number;
}

export interface DiscoveryAdvisor {
  id: string;
  mentor_id: string;
  profile: Profile | null;
  headline: string;
  bio: string;
  experience_years: number;
  rating: number;
  review_count: number;
  verification_status: string;
  verified_categories: string[];
  specialties: string[];
  credentials_url: string | null;
  credentials_verified_at: string | null;
  primary_segment_slug: string | null;
  segment_id?: string | null;
  segment_name?: string | null;
  role_title?: string | null;
  avatar_url?: string | null;
  full_name?: string | null;
  gigs?: Gig[];
  mentor_segments?: { segment_id: string; status: string }[];
  matchScore?: number;
  matchedFocusAreas?: string[];
  segment_slugs?: string[];
}

export interface DiscoveryAdvisorDetail extends DiscoveryAdvisor {
  created_at?: string;
  updated_at?: string;
}

export interface DiscoveryFilter {
  searchQuery?: string;
  minRating?: number;
  minPrice?: number;
  maxPrice?: number;
  experience?: number;
  credentials?: boolean;
  sessionFormat?: 'all' | 'video';
  focusArea?: string;
}

export interface DiscoveryFilterOptions {
  availableFocusAreas: string[];
  priceRange: { min: number; max: number };
  experienceOptions: number[];
  ratingOptions: number[];
}

export interface SuggestedDomain {
  slug: string;
  name: string;
  confidence: number;
}

export interface ProblemMatchResult {
  problem: string;
  intent: string;
  confidence: number;
  isUncertain: boolean;
  suggestedDomains: SuggestedDomain[];
  primaryDomain: SuggestedDomain | null;
  focusAreas: string[];
  advisorIds: string[];
  advisors: DiscoveryAdvisor[];
}

export interface DiscoverAdvisorsResponse {
  domain: DiscoveryDomain;
  advisors: DiscoveryAdvisor[];
  totalCount: number;
}

export interface MatchMatchAdvisor {
  id: string;
  headline: string;
  bio: string;
  specialties: string[];
  verified_categories: string[];
  rating: number;
  review_count: number;
  experience_years: number;
  gigs: { title: string; description: string }[];
  segment_slugs: string[];
}

export const DiscoverySegmentPriority: Record<string, number> = {
  relationship: 1,
  career: 2,
  'mental-health': 3,
};

export function isCanonicalDomainSlug(slug: string): boolean {
  const normalized = slug.toLowerCase().trim();
  return (
    normalized === 'relationship' ||
    normalized === 'career' ||
    normalized === 'mental-health'
  );
}

export function normalizeSegmentForDiscovery(segment: AdvisorySegment): DiscoveryDomain {
  const useCases = Array.isArray(segment.use_cases) ? segment.use_cases : [];
  return {
    id: segment.id,
    name: segment.name,
    slug: segment.slug,
    shortDescription: segment.short_description || segment.description || '',
    description: segment.description || segment.short_description || '',
    icon: segment.icon || 'Sparkles',
    accent: segment.accent || '#8052ff',
    badge:
      Array.isArray(segment.advisor_types) && segment.advisor_types.length > 0
        ? segment.advisor_types[0]
        : typeof segment.advisor_types === 'string'
        ? segment.advisor_types
        : `${segment.name} Verified`,
    is_active: segment.is_active,
    advisorCount: 0,
    focusAreas: useCases,
    audience: segment.audience || 'Seekers & Professionals',
    display_order: segment.display_order || 0,
  };
}

export type { Mentor, Profile, Gig };

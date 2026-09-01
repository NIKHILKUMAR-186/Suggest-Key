import { Mentor, Profile } from '../../lib/supabase/types';
import { AdvisorySegmentSlug } from '../segment/SegmentTypes';

export interface AdvisorFilter {
  segment?: AdvisorySegmentSlug | string;
  categoryId?: string;
  searchQuery?: string;
  minRating?: number;
  maxPrice?: number;
  verifiedOnly?: boolean;
}

export interface PaginatedAdvisorFilter extends AdvisorFilter {
  page?: number;        // 1-indexed page (or offset)
  limit?: number;       // Max 6 per request as strictly mandated
  cursor?: string | null;
  sectionKey?: string;  // e.g. 'featured' | 'general'
}

export interface PaginatedAdvisorResponse {
  advisors: AdvisorWithProfile[];
  hasMore: boolean;
  page: number;
  limit: number;
  totalCount: number;
  nextCursor?: string | null;
}

export interface AdvisorWithProfile extends Mentor {
  profile: Profile;
}


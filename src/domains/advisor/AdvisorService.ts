import { supabase, isSupabaseConfigured } from '../../lib/supabase/client';
import { Category, Gig, Mentor, Profile, MentorSegment, Offering, AvailabilityRule } from '../../lib/supabase/types';
import { AdvisorFilter, PaginatedAdvisorFilter, PaginatedAdvisorResponse } from './advisor.types';
import { SegmentService } from '../segment/SegmentService';
import { AdvisorySegment } from '../segment/SegmentTypes';
import { ReviewDetail } from '../reviews/ReviewService';

export interface AdvisorDetail extends Mentor {
  profile?: Profile;
  gigs?: Gig[];
  offerings?: Offering[];
  mentor_segments?: MentorSegment[];
  reviews?: ReviewDetail[];
  segment_id?: string;
  segment_name?: string;
  role_title?: string;
  specialties?: string[];
  credentials_detail?: {
    license_number?: string;
    issuing_authority?: string;
    verified_date?: string;
    degree?: string;
    institution?: string;
  };
}

export interface CredentialsSummary {
  degree?: string;
  institution?: string;
  licenseNumber?: string;
  issuingAuthority?: string;
  verifiedDate?: string;
  verifiedAt: string | null;
  credentialsUrl: string | null;
  isVerified: boolean;
  displayLine: string;
}

export function getCredentialsSummary(
  advisor: AdvisorDetail
): CredentialsSummary {
  const cd = advisor.credentials_detail;

  if (cd && (cd.degree || cd.institution || cd.license_number)) {
    return {
      degree: cd.degree,
      institution: cd.institution,
      licenseNumber: cd.license_number,
      issuingAuthority: cd.issuing_authority,
      verifiedDate: cd.verified_date,
      verifiedAt: advisor.credentials_verified_at,
      credentialsUrl: advisor.credentials_url,
      isVerified: advisor.verification_status === 'approved',
      displayLine: [cd.degree, cd.institution]
        .filter(Boolean)
        .join(', '),
    };
  }

  const hasHeadlineCredential =
    advisor.headline &&
    /(Ph\.D|Psy\.D|M\.D|LMFT|Licensed|Certified|PhD|MD)/i.test(advisor.headline);

  return {
    degree: hasHeadlineCredential
      ? advisor.headline.split('|')[0]?.split(' & ')[0]?.trim()
      : undefined,
    institution: undefined,
    licenseNumber: undefined,
    issuingAuthority: undefined,
    verifiedDate: advisor.credentials_verified_at
      ? new Date(advisor.credentials_verified_at).toLocaleDateString('en-US', {
          month: 'short',
          year: 'numeric',
        })
      : undefined,
    verifiedAt: advisor.credentials_verified_at,
    credentialsUrl: advisor.credentials_url,
    isVerified: advisor.verification_status === 'approved',
    displayLine: hasHeadlineCredential
      ? advisor.headline
      : advisor.verification_status === 'approved'
      ? 'Verified Practitioner'
      : 'Verification Pending',
  };
}

export interface AvailabilitySlot {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

export class AdvisorService {
  /**
   * Fetch all active advisory segments / categories dynamically
   */
  static async getCategories(): Promise<Category[]> {
    return SegmentService.getCategories();
  }

  /**
   * Get category or segment by slug or id dynamically
   */
  static async getCategoryBySlug(slug: string): Promise<Category | null> {
    const canonical = await SegmentService.getSegmentBySlug(slug);
    if (canonical) {
      return {
        id: canonical.id,
        name: canonical.name,
        slug: canonical.slug,
        description: canonical.short_description,
        icon_name: canonical.icon || 'Sparkles',
        requires_credential_verification: true,
        display_order: canonical.display_order,
      };
    }

    const categories = await this.getCategories();
    return (
      categories.find((c) => c.slug === slug || c.id === slug) || null
    );
  }

  /**
   * Fetch all advisors
   */
  static async getAllAdvisors(): Promise<AdvisorDetail[]> {
    return this.getAdvisors();
  }

  /**
   * Fetch paginated advisors with strict database batch limit of MAX 6 per request
   */
  static async getPaginatedAdvisors(
    filters: PaginatedAdvisorFilter = {}
  ): Promise<PaginatedAdvisorResponse> {
    // Strictly enforce MAX 6 advisors per batch request
    const limit = Math.min(Math.max(Number(filters.limit) || 6, 1), 6);
    const page = Math.max(Number(filters.page) || 1, 1);
    const offset = (page - 1) * limit;
    const targetSegment = filters.segment || filters.categoryId;

    if (!isSupabaseConfigured) {
      console.warn('Supabase not configured. Returning empty advisors.');
      return {
        advisors: [],
        hasMore: false,
        page,
        limit,
        totalCount: 0,
        nextCursor: null,
      };
    }

    try {
      let query = supabase
        .from('mentors')
        .select('*, profile:profiles(*), gigs(*)', { count: 'exact' })
        .eq('verification_status', 'approved');

      if (targetSegment && targetSegment !== 'all') {
        const canonicalSeg = await SegmentService.getSegmentBySlug(targetSegment);
        const segId = canonicalSeg ? canonicalSeg.id : targetSegment;
        query = supabase
          .from('mentors')
          .select('*, profile:profiles(*), gigs(*), mentor_segments:mentor_segments!inner(segment_id,status)', { count: 'exact' })
          .eq('verification_status', 'approved')
          .eq('mentor_segments.segment_id', segId)
          .eq('mentor_segments.status', 'active');
      }

      if (filters.minRating) {
        query = query.gte('rating', filters.minRating);
      }

      // Range offset for max 6 items
      const from = offset;
      const to = offset + limit - 1;
      query = query
        .order('rating', { ascending: false })
        .order('review_count', { ascending: false })
        .range(from, to);

      const { data, count, error } = await query;

      if (error || !data || data.length === 0) {
        return {
          advisors: [],
          hasMore: false,
          page,
          limit,
          totalCount: count || 0,
          nextCursor: null,
        };
      }

      const totalCount = count || data.length;
      let advisorList = data as AdvisorDetail[];

      if (filters.searchQuery) {
        const q = (filters.searchQuery || '').toLowerCase().trim();
        advisorList = advisorList.filter(
          (adv) =>
            (adv.profile?.full_name || '').toLowerCase().includes(q) ||
            (adv.headline || '').toLowerCase().includes(q) ||
            (adv.bio || '').toLowerCase().includes(q) ||
            (adv.specialties || []).some((s) => s.toLowerCase().includes(q))
        );
      }

      const hasMore = offset + advisorList.length < totalCount;
      const nextCursor = hasMore && advisorList.length > 0 ? advisorList[advisorList.length - 1].id : null;

      return {
        advisors: advisorList,
        hasMore,
        page,
        limit,
        totalCount,
        nextCursor,
      };
    } catch (err) {
      console.error('Error fetching paginated advisors:', err);
      return {
        advisors: [],
        hasMore: false,
        page,
        limit,
        totalCount: 0,
        nextCursor: null,
      };
    }
  }

  /**
   * Fetch advisors with flexible filtering
   */
  static async getAdvisors(filters?: AdvisorFilter): Promise<AdvisorDetail[]> {
    const targetSegment = filters?.segment || filters?.categoryId;

    if (!isSupabaseConfigured) {
      console.warn('Supabase not configured. Returning empty advisors.');
      return [];
    }

    try {
      let query = supabase
        .from('mentors')
        .select('*, profile:profiles(*), gigs(*)')
        .eq('verification_status', 'approved');

      if (targetSegment && targetSegment !== 'all') {
        const canonicalSeg = await SegmentService.getSegmentBySlug(targetSegment);
        const segId = canonicalSeg ? canonicalSeg.id : targetSegment;
        query = supabase
          .from('mentors')
          .select('*, profile:profiles(*), gigs(*), mentor_segments:mentor_segments!inner(segment_id,status)')
          .eq('verification_status', 'approved')
          .eq('mentor_segments.segment_id', segId)
          .eq('mentor_segments.status', 'active');
      }

      if (filters?.minRating) {
        query = query.gte('rating', filters.minRating);
      }

      query = query.order('rating', { ascending: false });

      const { data, error } = await query;

      if (error || !data || data.length === 0) {
        return [];
      }

      let results = data as AdvisorDetail[];

      if (filters?.searchQuery) {
        const q = (filters.searchQuery || '').toLowerCase().trim();
        results = results.filter(
          (adv) =>
            (adv.profile?.full_name || '').toLowerCase().includes(q) ||
            (adv.headline || '').toLowerCase().includes(q) ||
            (adv.bio || '').toLowerCase().includes(q) ||
            (adv.specialties || []).some((s: string) => s.toLowerCase().includes(q))
        );
      }

      if (filters?.maxPrice) {
        results = results.filter((adv) =>
          (adv.gigs || []).some((g) => g.price_inr <= filters.maxPrice!)
        );
      }

      return results;
    } catch (err) {
      console.error('Error fetching advisors:', err);
      return [];
    }
  }

  /**
   * Get full advisor detail by id or username
   */
  static async getAdvisorById(id: string): Promise<AdvisorDetail | null> {
    if (!isSupabaseConfigured) {
      console.warn('Supabase not configured. Cannot fetch advisor.');
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('mentors')
        .select(`
          *,
          profile:profiles(*),
          gigs(*),
          mentor_segments:mentor_segments(*),
          reviews:reviews(
            *,
            seeker:profiles(id, full_name, avatar_url)
          ),
          offerings:offerings(
            *,
            mentor_segment:mentor_segments(
              *,
              segment:advisory_segments(*)
            )
          )
        `)
        .eq('id', id)
        .neq('verification_status', 'suspended')
        .single();

      if (error || !data) {
        console.error('Error fetching advisor:', error);
        return null;
      }

      const advisorData = data as unknown as AdvisorDetail & {
        offerings?: Offering[];
        mentor_segments?: MentorSegment[];
        reviews?: Array<{
          id: string;
          booking_id: string;
          seeker_id: string;
          is_anonymous: boolean;
          mentor_id: string;
          gig_id?: string;
          rating: number;
          rating_expertise?: number;
          rating_communication?: number;
          rating_actionability?: number;
          comment?: string;
          mentor_response?: string;
          mentor_response_at?: string;
          created_at: string;
          seeker?: { id: string; full_name?: string; avatar_url?: string | null };
        }>;
      };
      if (!advisorData.offerings) {
        advisorData.offerings = [];
      }
      if (!advisorData.mentor_segments) {
        advisorData.mentor_segments = [];
      } else {
        advisorData.mentor_segments = advisorData.mentor_segments.filter(
          (ms: MentorSegment) => ms.status === 'active'
        );
      }
      if (!advisorData.reviews) {
        advisorData.reviews = [];
      } else {
        advisorData.reviews = advisorData.reviews.map((rev: {
          id: string;
          booking_id: string;
          seeker_id: string;
          is_anonymous: boolean;
          mentor_id: string;
          gig_id?: string;
          rating: number;
          rating_expertise?: number;
          rating_communication?: number;
          rating_actionability?: number;
          comment?: string;
          mentor_response?: string;
          mentor_response_at?: string;
          created_at: string;
          seeker?: { id: string; full_name?: string; avatar_url?: string | null };
        }) => ({
          id: rev.id,
          booking_id: rev.booking_id,
          seeker_id: rev.seeker_id,
          seeker_name: rev.seeker?.full_name,
          seeker_avatar: rev.seeker?.avatar_url,
          is_anonymous: rev.is_anonymous,
          mentor_id: rev.mentor_id,
          gig_id: rev.gig_id,
          rating: rev.rating,
          rating_expertise: rev.rating_expertise,
          rating_communication: rev.rating_communication,
          rating_actionability: rev.rating_actionability,
          comment: rev.comment,
          review_text: rev.comment,
          mentor_response: rev.mentor_response,
          mentor_response_at: rev.mentor_response_at,
          created_at: rev.created_at,
        }));
      }

      return advisorData as AdvisorDetail;
    } catch (err) {
      console.error('Error in getAdvisorById:', err);
      return null;
    }
  }

  /**
   * Fetch all approved advisors enriched with active mentor_segments and
   * associated advisory_segments (for use_cases). Used by the recommendation
   * engine. Does NOT include reviews (keep payload light for lists).
   */
  static async getAdvisorsWithSegments(): Promise<AdvisorDetail[]> {
    if (!isSupabaseConfigured) {
      console.warn('Supabase not configured. Returning empty advisors.');
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('mentors')
        .select(`
          *,
          profile:profiles(*),
          mentor_segments:mentor_segments(
            status,
            segment:advisory_segments(*)
          )
        `)
        .eq('verification_status', 'approved')
        .order('rating', { ascending: false })
        .order('review_count', { ascending: false });

      if (error || !data || data.length === 0) {
        return [];
      }

      return data.map((row: Mentor & { profile?: Profile; gigs?: Gig[]; mentor_segments?: MentorSegment[] }) => {
        const activeSegments = (row.mentor_segments || []).filter(
          (ms: MentorSegment) => ms.status === 'active'
        );
        return {
          ...row,
          mentor_segments: activeSegments,
        } as AdvisorDetail;
      });
    } catch (err) {
      console.error('Error fetching advisors with segments:', err);
      return [];
    }
  }

  /**
   * Read-only: fetch the next available time slots for a mentor based on
   * their availability_rules. Returns null when no rules exist (does not
   * fabricate availability).
   */
  static async getNextAvailability(
    mentorId: string
  ): Promise<AvailabilitySlot[] | null> {
    if (!isSupabaseConfigured) {
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('availability_rules')
        .select('day_of_week, start_time, end_time, is_active')
        .eq('mentor_id', mentorId)
        .eq('is_active', true)
        .order('day_of_week', { ascending: true });

      if (error) {
        console.error('Error fetching availability rules:', error);
        return null;
      }

      if (!data || data.length === 0) {
        return null;
      }

      return (data as AvailabilityRule[]).map((rule) => ({
        dayOfWeek: rule.day_of_week,
        startTime: rule.start_time,
        endTime: rule.end_time,
        isActive: rule.is_active,
      }));
    } catch (err) {
      console.error('Error in getNextAvailability:', err);
      return null;
    }
  }

  /**
   * Admin / Mentor: Update mentor's assigned advisory segment
   */
  static async updateAdvisorSegment(mentorId: string, segmentIdOrSlug: string): Promise<boolean> {
    if (!isSupabaseConfigured) {
      return false;
    }

    try {
      const segment = await SegmentService.getSegmentBySlug(segmentIdOrSlug);
      const resolvedId = segment ? segment.id : segmentIdOrSlug;
      const resolvedSlug = segment ? segment.slug : segmentIdOrSlug;

      const { error } = await supabase
        .from('mentors')
        .update({
          segment_id: resolvedId,
          primary_segment_id: resolvedId,
          verified_categories: [resolvedSlug],
        })
        .eq('id', mentorId);

      return !error;
    } catch (err) {
      console.error('Error updating advisor segment:', err);
      return false;
    }
  }

  /**
   * Get gig by ID — finds the advisor who owns the gig and returns
   * the gig, advisor, and associated segment
   */
  static async getGigById(
    gigId: string
  ): Promise<{ gig: Gig; advisor: AdvisorDetail; segment: AdvisorySegment | null } | null> {
    if (!isSupabaseConfigured) {
      console.warn('Supabase not configured. Cannot fetch gig.');
      return null;
    }

    try {
      const { data: gigData, error: gigError } = await supabase
        .from('gigs')
        .select(`
          *,
          mentor:mentors(*, profile:profiles(*))
        `)
        .eq('id', gigId)
        .single();

      if (gigError || !gigData) {
        console.error('Error fetching gig:', gigError);
        return null;
      }

      const segment = gigData.segment_id
        ? await SegmentService.getSegmentBySlug(gigData.segment_id)
        : null;

      return {
        gig: gigData,
        advisor: gigData.mentor,
        segment,
      };
    } catch (err) {
      console.error('Error in getGigById:', err);
      return null;
    }
  }

  /**
   * Get advisor statistics (total count, by segment, etc.)
   */
  static async getAdvisorStats(): Promise<{
    totalAdvisors: number;
    approvedAdvisors: number;
    pendingAdvisors: number;
    bySegment: { [key: string]: number };
  }> {
    if (!isSupabaseConfigured) {
      return {
        totalAdvisors: 0,
        approvedAdvisors: 0,
        pendingAdvisors: 0,
        bySegment: {},
      };
    }

    try {
      const [{ count: totalCount }, { count: approvedCount }, { count: pendingCount }, { data: mentors }] = await Promise.all([
        supabase.from('mentors').select('*', { count: 'exact', head: true }),
        supabase.from('mentors').select('*', { count: 'exact', head: true }).eq('verification_status', 'approved'),
        supabase.from('mentors').select('*', { count: 'exact', head: true }).eq('verification_status', 'pending'),
        supabase.from('mentors').select('segment_id, verified_categories'),
      ]);

      const bySegment: { [key: string]: number } = {};
      mentors?.forEach((m: { segment_id?: string; verified_categories?: string[] }) => {
        const segId = m.segment_id || m.verified_categories?.[0] || 'unknown';
        bySegment[segId] = (bySegment[segId] || 0) + 1;
      });

      return {
        totalAdvisors: totalCount || 0,
        approvedAdvisors: approvedCount || 0,
        pendingAdvisors: pendingCount || 0,
        bySegment,
      };
    } catch (err) {
      console.error('Error fetching advisor stats:', err);
      return {
        totalAdvisors: 0,
        approvedAdvisors: 0,
        pendingAdvisors: 0,
        bySegment: {},
      };
    }
  }
}

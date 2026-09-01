import { supabase, isSupabaseConfigured } from '../../lib/supabase/client';
import { Category, Gig, Mentor, Profile } from '../../lib/supabase/types';
import { AdvisorFilter, PaginatedAdvisorFilter, PaginatedAdvisorResponse } from './advisor.types';
import { SegmentService } from '../segment/SegmentService';
import { AdvisorySegment } from '../segment/SegmentTypes';

export interface AdvisorDetail extends Mentor {
  profile?: Profile;
  gigs?: Gig[];
  reviews?: any[];
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
        const resolvedSlug = canonicalSeg ? canonicalSeg.slug : targetSegment;
        const resolvedId = canonicalSeg ? canonicalSeg.id : targetSegment;

        // Query by segment_id OR verified_categories array
        query = query.or(`segment_id.eq.${resolvedId},verified_categories.cs.{${resolvedSlug}}`);
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
        advisors: advisorList as any,
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
        const resolvedSlug = canonicalSeg ? canonicalSeg.slug : targetSegment;
        const resolvedId = canonicalSeg ? canonicalSeg.id : targetSegment;

        query = query.or(`segment_id.eq.${resolvedId},verified_categories.cs.{${resolvedSlug}}`);
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
        .select('*, profile:profiles(*), gigs(*)')
        .eq('id', id)
        .single();

      if (error || !data) {
        console.error('Error fetching advisor:', error);
        return null;
      }

      return data as AdvisorDetail;
    } catch (err) {
      console.error('Error in getAdvisorById:', err);
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
      mentors?.forEach((m: any) => {
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

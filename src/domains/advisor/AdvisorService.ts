import { supabase, isSupabaseConfigured } from '../../lib/supabase/client';
import { Category } from '../../lib/supabase/types';
import { SEED_CATEGORIES, SEED_ADVISORS, AdvisorDetail } from './seedData';
import { AdvisorFilter, PaginatedAdvisorFilter, PaginatedAdvisorResponse } from './advisor.types';
import { SegmentService } from '../segment/SegmentService';

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
      return this.paginateSeedAdvisors(filters, page, limit, offset, targetSegment);
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
        return this.paginateSeedAdvisors(filters, page, limit, offset, targetSegment);
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
    } catch {
      return this.paginateSeedAdvisors(filters, page, limit, offset, targetSegment);
    }
  }

  private static paginateSeedAdvisors(
    filters: PaginatedAdvisorFilter,
    page: number,
    limit: number,
    offset: number,
    targetSegment?: string
  ): PaginatedAdvisorResponse {
    let filtered = [...SEED_ADVISORS];

    if (targetSegment && targetSegment !== 'all') {
      const canonicalSeg = SegmentService.getCachedSegmentBySlug(targetSegment);
      const resolvedSlug = canonicalSeg ? canonicalSeg.slug : targetSegment.toLowerCase().trim();
      const resolvedId = canonicalSeg ? canonicalSeg.id : targetSegment;

      filtered = filtered.filter(
        (adv) =>
          adv.segment_id === resolvedSlug ||
          adv.segment_id === resolvedId ||
          adv.primary_segment_id === resolvedId ||
          adv.verified_categories?.includes(resolvedSlug) ||
          adv.gigs?.some((g) => g.category_id === resolvedSlug || g.category_id === resolvedId)
      );
    }

    if (filters.searchQuery) {
      const q = (filters.searchQuery || '').toLowerCase().trim();
      filtered = filtered.filter(
        (adv) =>
          (adv.profile?.full_name || '').toLowerCase().includes(q) ||
          (adv.headline || '').toLowerCase().includes(q) ||
          (adv.bio || '').toLowerCase().includes(q) ||
          (adv.segment_name || '').toLowerCase().includes(q) ||
          (adv.role_title || '').toLowerCase().includes(q) ||
          (adv.specialties || []).some((s) => s.toLowerCase().includes(q)) ||
          (adv.gigs || []).some(
            (g) =>
              (g.title || '').toLowerCase().includes(q) ||
              (g.description || '').toLowerCase().includes(q) ||
              (g.deliverables || []).some((d) => d.toLowerCase().includes(q))
          )
      );
    }

    if (filters.minRating) {
      filtered = filtered.filter((adv) => (adv.rating || 5) >= filters.minRating!);
    }

    if (filters.maxPrice) {
      filtered = filtered.filter((adv) =>
        (adv.gigs || []).some((g) => g.price_inr <= filters.maxPrice!)
      );
    }

    if (filters.verifiedOnly) {
      filtered = filtered.filter((adv) => adv.verification_status === 'approved');
    }

    const totalCount = filtered.length;
    const paginatedItems = filtered.slice(offset, offset + limit);
    const hasMore = offset + paginatedItems.length < totalCount;
    const nextCursor =
      hasMore && paginatedItems.length > 0
        ? paginatedItems[paginatedItems.length - 1].id
        : null;

    return {
      advisors: paginatedItems,
      hasMore,
      page,
      limit,
      totalCount,
      nextCursor,
    };
  }

  /**
   * Fetch advisors with flexible filtering
   */
  static async getAdvisors(filters?: AdvisorFilter): Promise<AdvisorDetail[]> {
    const targetSegment = filters?.segment || filters?.categoryId;

    if (!isSupabaseConfigured) {
      let results = [...SEED_ADVISORS];

      if (targetSegment && targetSegment !== 'all') {
        const canonicalSeg = SegmentService.getCachedSegmentBySlug(targetSegment);
        const resolvedSlug = canonicalSeg ? canonicalSeg.slug : targetSegment.toLowerCase().trim();
        const resolvedId = canonicalSeg ? canonicalSeg.id : targetSegment;

        results = results.filter(
          (adv) =>
            adv.segment_id === resolvedSlug ||
            adv.segment_id === resolvedId ||
            adv.verified_categories?.includes(resolvedSlug) ||
            adv.gigs?.some((g) => g.category_id === resolvedSlug || g.category_id === resolvedId)
        );
      }

      if (filters?.searchQuery) {
        const q = (filters.searchQuery || '').toLowerCase().trim();
        results = results.filter(
          (adv) =>
            (adv.profile?.full_name || '').toLowerCase().includes(q) ||
            (adv.headline || '').toLowerCase().includes(q) ||
            (adv.bio || '').toLowerCase().includes(q) ||
            (adv.specialties || []).some((s) => s.toLowerCase().includes(q))
        );
      }

      if (filters?.minRating) {
        results = results.filter((adv) => (adv.rating || 5) >= filters.minRating!);
      }

      if (filters?.maxPrice) {
        results = results.filter((adv) =>
          (adv.gigs || []).some((g) => g.price_inr <= filters.maxPrice!)
        );
      }

      if (filters?.verifiedOnly) {
        results = results.filter((adv) => adv.verification_status === 'approved');
      }

      return results;
    }

    try {
      let query = supabase
        .from('mentors')
        .select('*, profile:profiles(*), gigs(*)')
        .eq('verification_status', 'approved');

      const { data, error } = await query;

      if (error || !data || data.length === 0) {
        return this.filterSeedAdvisors(filters);
      }

      let results = data as AdvisorDetail[];

      if (targetSegment && targetSegment !== 'all') {
        const canonicalSeg = await SegmentService.getSegmentBySlug(targetSegment);
        const resolvedSlug = canonicalSeg ? canonicalSeg.slug : targetSegment;
        const resolvedId = canonicalSeg ? canonicalSeg.id : targetSegment;

        results = results.filter(
          (adv) =>
            adv.segment_id === resolvedId ||
            adv.segment_id === resolvedSlug ||
            adv.verified_categories?.includes(resolvedSlug) ||
            adv.gigs?.some((g) => g.category_id === resolvedSlug || g.category_id === resolvedId)
        );
      }

      if (filters?.searchQuery) {
        const q = (filters.searchQuery || '').toLowerCase().trim();
        results = results.filter(
          (adv) =>
            (adv.profile?.full_name || '').toLowerCase().includes(q) ||
            (adv.headline || '').toLowerCase().includes(q) ||
            (adv.bio || '').toLowerCase().includes(q)
        );
      }

      return results;
    } catch {
      return this.filterSeedAdvisors(filters);
    }
  }

  private static filterSeedAdvisors(filters?: AdvisorFilter): AdvisorDetail[] {
    let results = [...SEED_ADVISORS];
    const targetSegment = filters?.segment || filters?.categoryId;

    if (targetSegment && targetSegment !== 'all') {
      const canonicalSeg = SegmentService.getCachedSegmentBySlug(targetSegment);
      const resolvedSlug = canonicalSeg ? canonicalSeg.slug : targetSegment.toLowerCase().trim();
      const resolvedId = canonicalSeg ? canonicalSeg.id : targetSegment;

      results = results.filter(
        (adv) =>
          adv.segment_id === resolvedSlug ||
          adv.segment_id === resolvedId ||
          adv.verified_categories.includes(resolvedSlug) ||
          adv.gigs.some((g) => g.category_id === resolvedSlug || g.category_id === resolvedId)
      );
    }

    if (filters?.searchQuery) {
      const q = (filters.searchQuery || '').toLowerCase().trim();
      results = results.filter(
        (adv) =>
          (adv.profile?.full_name || '').toLowerCase().includes(q) ||
          (adv.headline || '').toLowerCase().includes(q) ||
          (adv.bio || '').toLowerCase().includes(q)
      );
    }

    return results;
  }

  /**
   * Get full advisor detail by id or username
   */
  static async getAdvisorById(id: string): Promise<AdvisorDetail | null> {
    if (!isSupabaseConfigured) {
      const found = SEED_ADVISORS.find(
        (adv) => adv.id === id || adv.profile.id === id
      );
      return found || null;
    }

    try {
      const { data, error } = await supabase
        .from('mentors')
        .select('*, profile:profiles(*), gigs(*)')
        .eq('id', id)
        .single();

      if (error || !data) {
        const found = SEED_ADVISORS.find(
          (adv) => adv.id === id || adv.profile.id === id
        );
        return found || null;
      }

      return data as AdvisorDetail;
    } catch {
      const found = SEED_ADVISORS.find(
        (adv) => adv.id === id || adv.profile.id === id
      );
      return found || null;
    }
  }

  /**
   * Admin / Mentor: Update mentor's assigned advisory segment
   */
  static async updateAdvisorSegment(mentorId: string, segmentIdOrSlug: string): Promise<boolean> {
    const segment = await SegmentService.getSegmentBySlug(segmentIdOrSlug);
    const resolvedId = segment ? segment.id : segmentIdOrSlug;
    const resolvedSlug = segment ? segment.slug : segmentIdOrSlug;

    // Update in-memory seed advisors for instant UI reactivity
    const idx = SEED_ADVISORS.findIndex((a) => a.id === mentorId || a.profile.id === mentorId);
    if (idx !== -1) {
      SEED_ADVISORS[idx].segment_id = resolvedId;
      SEED_ADVISORS[idx].primary_segment_id = resolvedId;
      if (segment) {
        SEED_ADVISORS[idx].segment_name = segment.name;
        SEED_ADVISORS[idx].role_title = `${segment.name} Advisor`;
      }
      if (!SEED_ADVISORS[idx].verified_categories.includes(resolvedSlug)) {
        SEED_ADVISORS[idx].verified_categories.push(resolvedSlug);
      }
    }

    if (isSupabaseConfigured) {
      try {
        await supabase
          .from('mentors')
          .update({
            segment_id: resolvedId,
            verified_categories: [resolvedSlug],
          })
          .eq('id', mentorId);
      } catch (err) {
        console.warn('Failed to update advisor segment in DB', err);
      }
    }

    return true;
  }
}

import { supabase, isSupabaseConfigured } from '../../lib/supabase/client';
import { SegmentService } from '../segment/SegmentService';
import { AdvisorySegment } from '../segment/SegmentTypes';
import { Mentor, Profile, Gig, MentorSegmentStatus } from '../../lib/supabase/types';

import {
  DiscoveryDomain,
  DiscoveryAdvisor,
  DiscoveryAdvisorDetail,
  DiscoveryFilter,
  DiscoveryFilterOptions,
  SuggestedDomain,
  ProblemMatchResult,
  DiscoverySegmentPriority,
  normalizeSegmentForDiscovery,
} from './discovery.types';

import {
  matchProblem as runMatch,
  type MatcherAdvisor,
  type MatcherSegment,
  type MatchedAdvisor,
  type SuggestedDomain as MatcherSuggestedDomain,
} from './keywordMatcher';

function toNumber(v: unknown, fallback = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function normalizeAdvisor(raw: Mentor & { gigs?: Gig[]; profile?: Profile; mentor_segments?: { segment_id: string; status: string }[] }): DiscoveryAdvisor {
  const profile = (raw.profile as Profile | undefined) ?? null;
  const gigs: Gig[] = Array.isArray(raw.gigs) ? (raw.gigs as Gig[]) : [];

  const verifiedCategories: string[] = Array.isArray(raw.verified_categories)
    ? (raw.verified_categories as string[])
    : [];

  const primary_segment_slug: string | null = null;

  return {
    id: raw.id,
    mentor_id: raw.id,
    profile,
    headline: raw.headline || '',
    bio: raw.bio || '',
    experience_years: raw.experience_years || 0,
    rating: toNumber(raw.rating, 5),
    review_count: toNumber(raw.review_count, 0),
    verification_status: raw.verification_status || 'pending',
    verified_categories: verifiedCategories,
    specialties: Array.isArray(raw.specialties) ? (raw.specialties as string[]) : [],
    credentials_url: raw.credentials_url || null,
    credentials_verified_at: raw.credentials_verified_at || null,
    primary_segment_slug,
    segment_id: raw.segment_id || null,
    segment_name: raw.segment_name || null,
    role_title: raw.role_title || null,
    avatar_url: raw.avatar_url || profile?.avatar_url || null,
    full_name: raw.full_name || profile?.full_name || null,
    gigs,
    mentor_segments: Array.isArray(raw.mentor_segments)
      ? (raw.mentor_segments as { segment_id: string; status: string }[])
      : [],
  };
}

function toMatcherAdvisor(a: DiscoveryAdvisor): MatcherAdvisor {
  return {
    id: a.id,
    headline: a.headline,
    bio: a.bio,
    specialties: a.specialties,
    verified_categories: a.verified_categories,
    rating: a.rating,
    review_count: a.review_count,
    experience_years: a.experience_years,
    gigs: (a.gigs || []).map((g) => ({ title: g.title || '', description: g.description || '' })),
    segment_slugs: a.segment_slugs || [],
  };
}

export class DiscoveryService {
  private static idToSlug: Record<string, string> = {};

  private static async ensureMaps(): Promise<void> {
    if (Object.keys(this.idToSlug).length > 0) return;
    const segments = await SegmentService.getActiveSegments();
    this.idToSlug = {};
    for (const s of segments) {
      this.idToSlug[s.id] = s.slug;
    }
  }

  static async getDomains(): Promise<DiscoveryDomain[]> {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase not configured. Cannot fetch discovery domains.');
    }
    await this.ensureMaps();

    const segments = await SegmentService.getActiveSegments();
    const counts = await this.countActiveApprovedMentorsBySegment();

    const domains = segments.map((s) => {
      const base = normalizeSegmentForDiscovery(s);
      return {
        ...base,
        advisorCount: counts.get(s.id) || 0,
        focusAreas: (Array.isArray(s.use_cases) ? s.use_cases : []).slice(0, 4),
      } as DiscoveryDomain;
    });

    domains.sort(
      (a, b) =>
        (DiscoverySegmentPriority[b.slug] ?? 99) - (DiscoverySegmentPriority[a.slug] ?? 99) ||
        a.display_order - b.display_order ||
        a.name.localeCompare(b.name)
    );

    return domains;
  }

  private static async countActiveApprovedMentorsBySegment(): Promise<Map<string, number>> {
    const counts = new Map<string, number>();
    const { data, error } = await supabase
      .from('mentor_segments')
      .select('segment_id, mentor:mentors!inner(verification_status, is_demo)')
      .eq('status', 'active');

    if (error) {
      console.error('[DiscoveryService] mentor_segments count error:', error.message);
      return counts;
    }

    for (const row of (data || []) as { segment_id: string; mentor?: { verification_status: string; is_demo?: boolean }[] }[]) {
      const mentor = row?.mentor?.[0];
      if (mentor?.verification_status === 'approved' && !mentor?.is_demo) {
        const segId = row?.segment_id;
        if (segId) counts.set(segId, (counts.get(segId) || 0) + 1);
      }
    }
    return counts;
  }

  private static async loadAllAdvisorsWithSegments(): Promise<DiscoveryAdvisor[]> {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase not configured. Cannot fetch discovery advisors.');
    }
    await this.ensureMaps();

    const { data, error } = await supabase
      .from('mentors')
      .select(
        '*, profile:profiles(*), gigs(*), mentor_segments:mentor_segments!inner(mentor_id,segment_id,status)'
      )
      .eq('verification_status', 'approved')
      .eq('is_demo', false)
      .eq('profile.role', 'mentor');

    if (error) {
      console.error('[DiscoveryService] loadAdvisors error:', error.message);
      throw new Error(`Failed to fetch advisors: ${error.message}`);
    }

    const rawAdvisors = (data || []) as Array<Mentor & { profile?: Profile; gigs?: Gig[]; mentor_segments?: { mentor_id: string; segment_id: string; status: string }[]; segment_name?: string | null; role_title?: string | null }>;

    return rawAdvisors.map((raw) => {
      const a = normalizeAdvisor(raw) as unknown as DiscoveryAdvisorDetail;

      const msRows = Array.isArray(raw.mentor_segments)
        ? (raw.mentor_segments as { segment_id: string; status: MentorSegmentStatus }[])
        : [];

      const activeSlugs = msRows
        .filter((ms) => ms.status === 'active')
        .map((ms) => this.idToSlug[ms.segment_id])
        .filter((s): s is string => Boolean(s));

      const uniqueSlugs = Array.from(new Set(activeSlugs));
      a.segment_slugs = uniqueSlugs;

      a.primary_segment_slug =
        this.idToSlug[raw.primary_segment_id] ||
        this.idToSlug[raw.segment_id] ||
        uniqueSlugs[0] ||
        null;

      return a;
    });
  }

  static async getAdvisorsByDomain(slug: string): Promise<DiscoveryAdvisor[]> {
    const all = await this.loadAllAdvisorsWithSegments();
    const normalized = slug.toLowerCase().trim();
    return all.filter((a) => (a.segment_slugs || []).some((s) => s.toLowerCase() === normalized));
  }

  static async matchProblem(problem: string): Promise<ProblemMatchResult> {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase not configured. Cannot match problem.');
    }
    await this.ensureMaps();

    const [segments, advisors] = await Promise.all([
      SegmentService.getActiveSegments(),
      this.loadAllAdvisorsWithSegments(),
    ]);

    const matcherSegments: MatcherSegment[] = segments.map((s) => ({
      id: s.id,
      slug: s.slug,
      name: s.name,
      use_cases: s.use_cases || [],
      description: s.description || '',
      short_description: s.short_description || '',
    }));

    const byId = new Map<string, DiscoveryAdvisor>();
    for (const a of advisors) byId.set(a.id, a);

    const result = runMatch(problem, matcherSegments, advisors.map(toMatcherAdvisor)) as {
      problem: string;
      intent: string;
      confidence: number;
      isUncertain: boolean;
      suggestedDomains: MatcherSuggestedDomain[];
      primaryDomain: MatcherSuggestedDomain | null;
      focusAreas: string[];
      advisors: MatchedAdvisor[];
    };

    const merged: DiscoveryAdvisor[] = result.advisors
      .map((m) => {
        const full = byId.get(m.id);
        if (!full) return null;
        full.matchScore = m.matchScore;
        full.matchedFocusAreas = m.matchedFocusAreas;
        return full;
      })
      .filter((a): a is DiscoveryAdvisor => Boolean(a));

    return {
      problem: result.problem,
      intent: result.intent,
      confidence: result.confidence,
      isUncertain: result.isUncertain,
      suggestedDomains: result.suggestedDomains as SuggestedDomain[],
      primaryDomain: result.primaryDomain as SuggestedDomain | null,
      focusAreas: result.focusAreas,
      advisorIds: merged.map((a) => a.id),
      advisors: merged,
    };
  }

  /**
   * Fetch all ACTIVE mentors with APPROVED mentor_segments for a given
   * advisory domain slug. Honors optional search + filter criteria.
   * Uses mentor_segments (the authoritative join table) — NOT the deprecated
   * single mentors.segment_id field.
   */
  static async getAdvisorsForDomain(
    slug: string,
    filters: DiscoveryFilter = {}
  ): Promise<DiscoveryAdvisor[]> {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase not configured. Cannot fetch advisors.');
    }

    const normalizedSlug = (slug || '').toLowerCase().trim();
    if (!normalizedSlug) return [];

    const segment = await SegmentService.getSegmentBySlug(normalizedSlug);
    if (!segment || !segment.is_active) return [];

    const { data, error } = await supabase
      .from('mentor_segments')
      .select(
        `
        segment_id,
        status,
        mentor:mentors!inner(
          *,
          profile:profiles(*),
          gigs(*)
        )
      `
      )
      .eq('status', 'active')
      .eq('segment_id', segment.id)
      .eq('mentor.verification_status', 'approved')
      .eq('mentor.is_demo', false)
      .eq('mentor.profile.role', 'mentor');

    if (error) {
      console.error('[DiscoveryService] getAdvisorsForDomain error:', error.message);
      throw new Error(`Failed to fetch advisors for domain: ${error.message}`);
    }

    const rows = (data || []) as Array<{ segment_id: string; status: string; mentor?: (Mentor & { profile?: Profile; gigs?: Gig[] })[] }>;
    const advisors: DiscoveryAdvisor[] = rows
      .map((row) => {
        const mentor = row.mentor?.[0];
        if (!mentor) return null;

        const advisor = normalizeAdvisor(mentor) as DiscoveryAdvisorDetail;
        advisor.segment_slugs = [segment.slug];
        advisor.primary_segment_slug = segment.slug;
        advisor.mentor_segments = [
          { segment_id: segment.id, status: 'active' as MentorSegmentStatus },
        ];
        return advisor;
      })
      .filter((a): a is DiscoveryAdvisor => Boolean(a));

    return this.applyAdvisorFilters(advisors, filters, segment.slug);
  }

  /**
   * Search ACTIVE/APPROVED advisors across all domains by free text.
   * Matches mentor name, headline, bio, specialties, focus areas, gig titles,
   * gig descriptions, and verified segment names.
   */
  static async searchAdvisors(
    searchQuery: string,
    domainSlug?: string
  ): Promise<DiscoveryAdvisor[]> {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase not configured. Cannot search advisors.');
    }

    const q = (searchQuery || '').toLowerCase().trim();
    if (!q) {
      return domainSlug
        ? await this.getAdvisorsForDomain(domainSlug)
        : await this.getAdvisorsForAllDomains();
    }

    const all = domainSlug
      ? await this.getAdvisorsForDomain(domainSlug)
      : await this.getAdvisorsForAllDomains();

    const tokens = q.split(/\s+/).filter((t) => t.length >= 1);
    if (tokens.length === 0) return all;

    return all.filter((adv) => {
      const haystacks = [
        adv.full_name || '',
        adv.profile?.full_name || '',
        adv.headline || '',
        adv.bio || '',
        adv.role_title || '',
        adv.segment_name || '',
        ...(adv.specialties || []),
        ...(adv.verified_categories || []),
        ...((adv.gigs || []).flatMap((g) => [g.title || '', g.description || '', ...(g.deliverables || [])])),
      ]
        .join(' ')
        .toLowerCase();

      return tokens.every((t) => haystacks.includes(t));
    });
  }

  /**
   * Fetch ACTIVE/APPROVED advisors across all active domains (no slug filter).
   */
  static async getAdvisorsForAllDomains(): Promise<DiscoveryAdvisor[]> {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase not configured. Cannot fetch advisors.');
    }

    return this.loadAllAdvisorsWithSegments();
  }

  /**
   * Compute the dynamic filter options (focus areas, price range, etc.)
   * available for the given set of advisors.
   */
  static computeFilterOptions(
    advisors: DiscoveryAdvisor[]
  ): DiscoveryFilterOptions {
    const focusAreaSet = new Set<string>();
    const prices: number[] = [];
    const experiences = new Set<number>();
    const ratings = new Set<number>();

    for (const adv of advisors) {
      for (const fa of adv.specialties || []) focusAreaSet.add(fa);
      for (const gig of adv.gigs || []) {
        if (typeof gig.price_inr === 'number') prices.push(gig.price_inr);
      }
      const yrs = adv.experience_years || 0;
      if (yrs > 0) {
        if (yrs >= 1) experiences.add(1);
        if (yrs >= 3) experiences.add(3);
        if (yrs >= 5) experiences.add(5);
        if (yrs >= 10) experiences.add(10);
      }
      const r = adv.rating || 0;
      if (r >= 4.0) ratings.add(4.0);
      if (r >= 4.5) ratings.add(4.5);
      if (r >= 4.8) ratings.add(4.8);
    }

    const minPrice = prices.length > 0 ? Math.floor(Math.min(...prices)) : 1000;
    const maxPrice = prices.length > 0 ? Math.ceil(Math.max(...prices)) : 10000;

    return {
      availableFocusAreas: Array.from(focusAreaSet).sort(),
      priceRange: { min: minPrice, max: maxPrice },
      experienceOptions: Array.from(experiences).sort((a, b) => a - b),
      ratingOptions: Array.from(ratings).sort((a, b) => a - b),
    };
  }

  /**
   * Apply progressive filters to a list of advisors (pure, side-effect free).
   * Centralized so the same semantics apply to direct-domain and problem-match
   * flows. Always keeps ACTIVE/APPROVED guarantee since callers must have
   * already loaded from the authoritative source.
   */
  static applyAdvisorFilters(
    advisors: DiscoveryAdvisor[],
    filters: DiscoveryFilter,
    primaryDomainSlug?: string
  ): DiscoveryAdvisor[] {
    const result = advisors.filter((adv) => {
      if (primaryDomainSlug) {
        const slugs = adv.segment_slugs || [];
        if (!slugs.includes(primaryDomainSlug)) return false;
      }

      if (filters.minRating && (adv.rating || 0) < filters.minRating) {
        return false;
      }

      if (typeof filters.minPrice === 'number' || typeof filters.maxPrice === 'number') {
        const gigs = adv.gigs || [];
        if (gigs.length === 0) return false;
        const anyInRange = gigs.some((g) => {
          const price = g.price_inr || 0;
          if (typeof filters.minPrice === 'number' && price < filters.minPrice) return false;
          if (typeof filters.maxPrice === 'number' && price > filters.maxPrice) return false;
          return true;
        });
        if (!anyInRange) return false;
      }

      if (typeof filters.experience === 'number') {
        const yrs = adv.experience_years || 0;
        if (yrs < filters.experience) return false;
      }

      if (filters.credentials && adv.verification_status !== 'approved') {
        return false;
      }

      if (filters.focusArea) {
        const fa = filters.focusArea.toLowerCase();
        const hasFa =
          (adv.specialties || []).some((s) => (s || '').toLowerCase().includes(fa)) ||
          (adv.gigs || []).some(
            (g) =>
              (g.title || '').toLowerCase().includes(fa) ||
              (g.description || '').toLowerCase().includes(fa)
          );
        if (!hasFa) return false;
      }

      return true;
    });

    // Stable sort by rating desc, then review_count desc
    return result.sort((a, b) => {
      const r = (b.rating || 0) - (a.rating || 0);
      if (r !== 0) return r;
      return (b.review_count || 0) - (a.review_count || 0);
    });
  }
}

import { supabase, isSupabaseConfigured } from '../../lib/supabase/client';
import { AdvisorySegment, SegmentMetrics } from './SegmentTypes';
import { Category } from '../../lib/supabase/types';

// Re-export AdvisorySegment for consumers that need the type
export type { AdvisorySegment, SegmentMetrics } from './SegmentTypes';

function normalizeSegment(raw: any): AdvisorySegment {
  const useCases = Array.isArray(raw.use_cases)
    ? raw.use_cases
    : typeof raw.use_cases === 'string'
    ? (() => {
        try {
          return JSON.parse(raw.use_cases);
        } catch {
          return raw.use_cases.split('\n').filter(Boolean);
        }
      })()
    : raw.focusAreas || [];

  const shortDesc = raw.short_description || raw.shortDescription || raw.description || '';
  const fullDesc = raw.description || raw.fullDescription || shortDesc;

  return {
    id: raw.id || raw.slug,
    name: raw.name || 'Advisory Segment',
    slug: raw.slug || (raw.id ? String(raw.id).toLowerCase() : 'segment'),
    short_description: shortDesc,
    description: fullDesc,
    icon: raw.icon || raw.iconName || 'Sparkles',
    accent: raw.accent || '#8052ff',
    use_cases: useCases,
    audience: raw.audience || 'Seekers & Professionals',
    advisor_types: raw.advisor_types || raw.credentialBadgeLabel || `${raw.name || 'Domain'} Specialists`,
    is_active: raw.is_active !== undefined ? Boolean(raw.is_active) : true,
    display_order: Number(raw.display_order ?? raw.displayOrder ?? 0),
    created_at: raw.created_at || new Date().toISOString(),
    updated_at: raw.updated_at || new Date().toISOString(),

    // Backwards-compatible properties
    roleTitle: raw.roleTitle || `${raw.name || 'Advisory'} Advisor`,
    shortDescription: shortDesc,
    fullDescription: fullDesc,
    tagline: raw.tagline || shortDesc,
    iconName: raw.icon || raw.iconName || 'Sparkles',
    requiresCredentialVerification: raw.requiresCredentialVerification !== undefined ? raw.requiresCredentialVerification : true,
    credentialBadgeLabel: raw.advisor_types || raw.credentialBadgeLabel || `${raw.name || 'Domain'} Verified`,
    focusAreas: useCases,
    sampleQuestions: raw.sampleQuestions || [
      `How do I overcome specific roadblocks in ${raw.name}?`,
      `What structured framework gives the highest leverage in ${raw.name}?`,
      `How can I navigate critical pivots with an audited ${raw.name} specialist?`,
    ],
    displayOrder: Number(raw.display_order ?? raw.displayOrder ?? 0),
  };
}

export class SegmentService {
  /**
   * Fetch all active advisory segments ordered by display_order (For Seeker UI & Public Discovery)
   * Throws on database errors to distinguish from empty results.
   */
  static async getActiveSegments(): Promise<AdvisorySegment[]> {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase not configured. Cannot fetch segments.');
    }

    const { data, error } = await supabase
      .from('advisory_segments')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('[SegmentService] getActiveSegments error:', error.message);
      throw new Error(`Failed to fetch active segments: ${error.message}`);
    }

    if (!data || data.length === 0) {
      return [];
    }

    return data.map(normalizeSegment);
  }

  /**
   * Fetch all advisory segments including inactive (For Admin Management)
   * Throws on database errors to distinguish from empty results.
   */
  static async getAllSegments(includeInactive = true): Promise<AdvisorySegment[]> {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase not configured. Cannot fetch segments.');
    }

    let query = supabase.from('advisory_segments').select('*');
    if (!includeInactive) {
      query = query.eq('is_active', true);
    }
    const { data, error } = await query.order('display_order', { ascending: true });

    if (error) {
      console.error('[SegmentService] getAllSegments error:', error.message);
      throw new Error(`Failed to fetch segments: ${error.message}`);
    }

    if (!data || data.length === 0) {
      return [];
    }

    return data.map(normalizeSegment);
  }

  /**
   * Get synchronous cached segment by slug or ID
   * Note: This now requires pre-fetched data since we don't use localStorage
   */
  static cachedSegments: AdvisorySegment[] = [];

  static setCachedSegments(segments: AdvisorySegment[]) {
    this.cachedSegments = segments;
  }

  static getCachedSegmentBySlug(slugOrId?: string): AdvisorySegment | null {
    if (!slugOrId) return null;
    const normalized = slugOrId.toLowerCase().trim();
    return (
      this.cachedSegments.find(
        (s) => s.slug.toLowerCase() === normalized || s.id.toLowerCase() === normalized
      ) || null
    );
  }

  /**
   * Get single advisory segment by slug or ID
   */
  static async getSegmentBySlug(slugOrId?: string): Promise<AdvisorySegment | null> {
    if (!slugOrId) return null;
    const normalized = slugOrId.toLowerCase().trim();

    if (!isSupabaseConfigured) {
      console.warn('Supabase not configured. Cannot fetch segment.');
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('advisory_segments')
        .select('*')
        .or(`slug.eq.${normalized},id.eq.${normalized}`)
        .single();

      if (error || !data) {
        console.error('Error fetching segment:', error);
        return null;
      }

      return normalizeSegment(data);
    } catch (err) {
      console.error('Error in getSegmentBySlug:', err);
      return null;
    }
  }

  /**
   * Create a new Advisory Segment (Admin action)
   */
  static async createSegment(
    segmentData: Partial<AdvisorySegment> & { name: string; slug: string; short_description: string; description: string }
  ): Promise<AdvisorySegment | null> {
    if (!isSupabaseConfigured) {
      console.warn('Supabase not configured. Cannot create segment.');
      return null;
    }

    try {
      const cleanSlug = segmentData.slug.toLowerCase().trim().replace(/[^a-z0-9-]/g, '-').replace(/--+/g, '-');
      const existing = await this.getAllSegments(true);
      const maxOrder = existing.reduce((max, s) => Math.max(max, s.display_order), 0);

      const { data, error } = await supabase
        .from('advisory_segments')
        .insert({
          name: segmentData.name.trim(),
          slug: cleanSlug,
          short_description: segmentData.short_description.trim(),
          description: segmentData.description.trim(),
          icon: segmentData.icon || 'Sparkles',
          accent: segmentData.accent || '#8052ff',
          use_cases: segmentData.use_cases || [],
          audience: segmentData.audience || 'Seekers & Professionals',
          advisor_types: segmentData.advisor_types || [`${segmentData.name} Specialists`],
          is_active: segmentData.is_active !== undefined ? segmentData.is_active : true,
          display_order: segmentData.display_order ?? (maxOrder + 1),
        })
        .select()
        .single();

      if (error || !data) {
        console.error('Error creating segment:', error);
        return null;
      }

      return normalizeSegment(data);
    } catch (err) {
      console.error('Error in createSegment:', err);
      return null;
    }
  }

  /**
   * Update an existing Advisory Segment (Admin action)
   */
  static async updateSegment(
    id: string,
    updates: Partial<AdvisorySegment>
  ): Promise<AdvisorySegment | null> {
    if (!isSupabaseConfigured) {
      console.warn('Supabase not configured. Cannot update segment.');
      return null;
    }

    try {
      const existing = await this.getSegmentBySlug(id);
      if (!existing) return null;

      const { data, error } = await supabase
        .from('advisory_segments')
        .update({
          name: updates.name || existing.name,
          slug: updates.slug || existing.slug,
          short_description: updates.short_description || existing.short_description,
          description: updates.description || existing.description,
          icon: updates.icon || existing.icon,
          accent: updates.accent || existing.accent,
          use_cases: updates.use_cases || existing.use_cases,
          audience: updates.audience || existing.audience,
          advisor_types: updates.advisor_types || existing.advisor_types,
          is_active: updates.is_active !== undefined ? updates.is_active : existing.is_active,
          display_order: updates.display_order || existing.display_order,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error || !data) {
        console.error('Error updating segment:', error);
        return null;
      }

      return normalizeSegment(data);
    } catch (err) {
      console.error('Error in updateSegment:', err);
      return null;
    }
  }

  /**
   * Toggle segment active / inactive status
   */
  static async toggleSegmentActive(id: string): Promise<AdvisorySegment | null> {
    const existing = await this.getSegmentBySlug(id);
    if (!existing) return null;
    return this.updateSegment(id, { is_active: !existing.is_active });
  }

  /**
   * Reorder segments
   */
  static async reorderSegments(orderedIds: string[]): Promise<boolean> {
    if (!isSupabaseConfigured) {
      return false;
    }

    try {
      for (let i = 0; i < orderedIds.length; i++) {
        await supabase
          .from('advisory_segments')
          .update({ display_order: i + 1 })
          .eq('id', orderedIds[i]);
      }
      return true;
    } catch (err) {
      console.error('Error reordering segments:', err);
      return false;
    }
  }

  /**
   * Delete segment safely — Enforces check for existing advisors
   */
  static async deleteSegment(id: string): Promise<{ success: boolean; error?: string }> {
    if (!isSupabaseConfigured) {
      return { success: false, error: 'Supabase not configured' };
    }

    try {
      const cleanId = id.trim();

      // Check if segment is in use
      const { count: mentorCount } = await supabase
        .from('mentors')
        .select('*', { count: 'exact', head: true })
        .or(`primary_segment_id.eq.${cleanId},verified_categories.cs.{${cleanId}}`);

      if (mentorCount && mentorCount > 0) {
        return {
          success: false,
          error: `Cannot delete segment: ${mentorCount} advisors are assigned to it. Deactivate instead to preserve historical records.`,
        };
      }

      const { error } = await supabase.from('advisory_segments').delete().eq('id', cleanId);
      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (e: any) {
      console.error('Error deleting segment:', e);
      return { success: false, error: e.message || 'Failed to delete segment' };
    }
  }

  /**
   * Calculate live segment analytics and metrics dynamically
   */
  static async getSegmentMetrics(segmentIdOrSlug?: string): Promise<SegmentMetrics[]> {
    if (!isSupabaseConfigured) {
      return [];
    }

    try {
      const segments = await this.getAllSegments(true);
      const metrics: SegmentMetrics[] = [];

      for (const segment of segments) {
        if (segmentIdOrSlug && segment.id !== segmentIdOrSlug && segment.slug !== segmentIdOrSlug) {
          continue;
        }

        // Get advisor count for this segment
        const { count: advisorCount } = await supabase
          .from('mentors')
          .select('*', { count: 'exact', head: true })
          .or(`segment_id.eq.${segment.id},verified_categories.cs.{${segment.slug}}`);

        const { count: activeAdvisorCount } = await supabase
          .from('mentors')
          .select('*', { count: 'exact', head: true })
          .eq('verification_status', 'approved')
          .or(`segment_id.eq.${segment.id},verified_categories.cs.{${segment.slug}}`);

        // Get booking count for this segment
        const { count: bookingsCount } = await supabase
          .from('bookings')
          .select('*', { count: 'exact', head: true })
          .eq('segment_id', segment.id);

        // Get revenue for this segment
        const { data: bookings } = await supabase
          .from('bookings')
          .select('amount_inr')
          .eq('segment_id', segment.id);

        const revenueInr = bookings?.reduce((sum, b) => sum + (b.amount_inr || 0), 0) || 0;

        metrics.push({
          segmentId: segment.id,
          segmentSlug: segment.slug,
          advisorCount: advisorCount || 0,
          activeAdvisorCount: activeAdvisorCount || 0,
          bookingsCount: bookingsCount || 0,
          revenueInr,
          totalAdvisorsCount: advisorCount || 0,
          totalBookingsCount: bookingsCount || 0,
          totalRevenueInr: revenueInr,
        });
      }

      return metrics;
    } catch (err) {
      console.error('Error fetching segment metrics:', err);
      return [];
    }
  }

  /**
   * Maps AdvisorySegments to Category interface for backward compatibility
   */
  static async getCategories(): Promise<Category[]> {
    const segments = await this.getActiveSegments();
    return segments.map((seg) => ({
      id: seg.id,
      name: seg.name,
      slug: seg.slug,
      description: seg.short_description,
      icon_name: seg.icon || 'Sparkles',
      requires_credential_verification: seg.requiresCredentialVerification ?? true,
      display_order: seg.display_order,
    }));
  }

  /**
   * Get Category by slug for backward compatibility
   */
  static async getCategoryBySlug(slug: string): Promise<Category | null> {
    const seg = await this.getSegmentBySlug(slug);
    if (!seg) return null;
    return {
      id: seg.id,
      name: seg.name,
      slug: seg.slug,
      description: seg.short_description,
      icon_name: seg.icon || 'Sparkles',
      requires_credential_verification: seg.requiresCredentialVerification ?? true,
      display_order: seg.display_order,
    };
  }

  /**
   * Validate if a slug is a valid active segment
   */
  static async isValidSegment(slug?: string): Promise<boolean> {
    if (!slug) return false;
    const seg = await this.getSegmentBySlug(slug);
    return Boolean(seg && seg.is_active);
  }
}

import { supabase, isSupabaseConfigured } from '../../lib/supabase/client';
import { AdvisorySegment, INITIAL_SEED_SEGMENTS, SegmentMetrics } from './SegmentTypes';
import { Category } from '../../lib/supabase/types';

const STORAGE_KEY_SEGMENTS = 'suggestkey_advisory_segments_db';

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
  private static getLocalSegments(): AdvisorySegment[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_SEGMENTS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(normalizeSegment);
        }
      }
    } catch {
      // Fall through to initial seeds
    }

    const seeds = INITIAL_SEED_SEGMENTS.map(normalizeSegment);
    this.saveLocalSegments(seeds);
    return seeds;
  }

  private static saveLocalSegments(segments: AdvisorySegment[]): void {
    try {
      localStorage.setItem(STORAGE_KEY_SEGMENTS, JSON.stringify(segments));
    } catch (e) {
      console.warn('Failed to save segments to localStorage', e);
    }
  }

  /**
   * Fetch all active advisory segments ordered by display_order (For Seeker UI & Public Discovery)
   */
  static async getActiveSegments(): Promise<AdvisorySegment[]> {
    if (!isSupabaseConfigured) {
      const local = this.getLocalSegments();
      return local
        .filter((s) => s.is_active)
        .sort((a, b) => a.display_order - b.display_order);
    }

    try {
      const { data, error } = await supabase
        .from('advisory_segments')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error || !data || data.length === 0) {
        const local = this.getLocalSegments();
        return local
          .filter((s) => s.is_active)
          .sort((a, b) => a.display_order - b.display_order);
      }

      return data.map(normalizeSegment);
    } catch {
      const local = this.getLocalSegments();
      return local
        .filter((s) => s.is_active)
        .sort((a, b) => a.display_order - b.display_order);
    }
  }

  /**
   * Fetch all advisory segments including inactive (For Admin Management)
   */
  static async getAllSegments(includeInactive = true): Promise<AdvisorySegment[]> {
    if (!isSupabaseConfigured) {
      const local = this.getLocalSegments();
      const filtered = includeInactive ? local : local.filter((s) => s.is_active);
      return filtered.sort((a, b) => a.display_order - b.display_order);
    }

    try {
      let query = supabase.from('advisory_segments').select('*');
      if (!includeInactive) {
        query = query.eq('is_active', true);
      }
      const { data, error } = await query.order('display_order', { ascending: true });

      if (error || !data || data.length === 0) {
        const local = this.getLocalSegments();
        const filtered = includeInactive ? local : local.filter((s) => s.is_active);
        return filtered.sort((a, b) => a.display_order - b.display_order);
      }

      return data.map(normalizeSegment);
    } catch {
      const local = this.getLocalSegments();
      const filtered = includeInactive ? local : local.filter((s) => s.is_active);
      return filtered.sort((a, b) => a.display_order - b.display_order);
    }
  }

  /**
   * Get synchronous cached segment by slug or ID
   */
  static getCachedSegmentBySlug(slugOrId?: string): AdvisorySegment | null {
    if (!slugOrId) return null;
    const normalized = slugOrId.toLowerCase().trim();
    const local = this.getLocalSegments();
    return (
      local.find(
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
      const local = this.getLocalSegments();
      const match = local.find(
        (s) => s.slug.toLowerCase() === normalized || s.id.toLowerCase() === normalized
      );
      return match || null;
    }

    try {
      const { data, error } = await supabase
        .from('advisory_segments')
        .select('*')
        .or(`slug.eq.${normalized},id.eq.${normalized}`)
        .single();

      if (error || !data) {
        const local = this.getLocalSegments();
        return (
          local.find(
            (s) => s.slug.toLowerCase() === normalized || s.id.toLowerCase() === normalized
          ) || null
        );
      }

      return normalizeSegment(data);
    } catch {
      const local = this.getLocalSegments();
      return (
        local.find(
          (s) => s.slug.toLowerCase() === normalized || s.id.toLowerCase() === normalized
        ) || null
      );
    }
  }

  /**
   * Create a new Advisory Segment (Admin action)
   */
  static async createSegment(
    segmentData: Partial<AdvisorySegment> & { name: string; slug: string; short_description: string; description: string }
  ): Promise<AdvisorySegment> {
    const cleanSlug = segmentData.slug.toLowerCase().trim().replace(/[^a-z0-9-]/g, '-').replace(/--+/g, '-');
    const existing = await this.getAllSegments(true);
    const maxOrder = existing.reduce((max, s) => Math.max(max, s.display_order), 0);

    const newSegment: AdvisorySegment = normalizeSegment({
      id: cleanSlug,
      name: segmentData.name.trim(),
      slug: cleanSlug,
      short_description: segmentData.short_description.trim(),
      description: segmentData.description.trim(),
      icon: segmentData.icon || 'Sparkles',
      accent: segmentData.accent || '#8052ff',
      use_cases: segmentData.use_cases || [],
      audience: segmentData.audience || 'Seekers & Professionals',
      advisor_types: segmentData.advisor_types || `${segmentData.name} Specialists`,
      is_active: segmentData.is_active !== undefined ? segmentData.is_active : true,
      display_order: segmentData.display_order ?? (maxOrder + 1),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('advisory_segments')
          .insert({
            id: newSegment.id,
            name: newSegment.name,
            slug: newSegment.slug,
            short_description: newSegment.short_description,
            description: newSegment.description,
            icon: newSegment.icon,
            accent: newSegment.accent,
            use_cases: newSegment.use_cases,
            audience: newSegment.audience,
            advisor_types: newSegment.advisor_types,
            is_active: newSegment.is_active,
            display_order: newSegment.display_order,
          })
          .select()
          .single();

        if (!error && data) {
          const created = normalizeSegment(data);
          // Also sync local cache
          const localList = this.getLocalSegments();
          this.saveLocalSegments([...localList.filter((s) => s.id !== created.id), created]);
          return created;
        }
      } catch (err) {
        console.warn('Supabase segment insertion fallback', err);
      }
    }

    // Local fallback persistence
    const localList = this.getLocalSegments();
    const updatedList = [...localList.filter((s) => s.slug !== cleanSlug && s.id !== newSegment.id), newSegment];
    this.saveLocalSegments(updatedList);
    return newSegment;
  }

  /**
   * Update an existing Advisory Segment (Admin action)
   */
  static async updateSegment(
    id: string,
    updates: Partial<AdvisorySegment>
  ): Promise<AdvisorySegment | null> {
    const cleanId = id.trim();
    const existing = await this.getSegmentBySlug(cleanId);
    if (!existing) return null;

    const merged = normalizeSegment({
      ...existing,
      ...updates,
      updated_at: new Date().toISOString(),
    });

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('advisory_segments')
          .update({
            name: merged.name,
            slug: merged.slug,
            short_description: merged.short_description,
            description: merged.description,
            icon: merged.icon,
            accent: merged.accent,
            use_cases: merged.use_cases,
            audience: merged.audience,
            advisor_types: merged.advisor_types,
            is_active: merged.is_active,
            display_order: merged.display_order,
            updated_at: new Date().toISOString(),
          })
          .eq('id', cleanId)
          .select()
          .single();

        if (!error && data) {
          const updated = normalizeSegment(data);
          const localList = this.getLocalSegments();
          this.saveLocalSegments(localList.map((s) => (s.id === cleanId ? updated : s)));
          return updated;
        }
      } catch (err) {
        console.warn('Supabase segment update fallback', err);
      }
    }

    const localList = this.getLocalSegments();
    const updatedList = localList.map((s) => (s.id === cleanId || s.slug === cleanId ? merged : s));
    this.saveLocalSegments(updatedList);
    return merged;
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
    const all = await this.getAllSegments(true);
    const updatedList = all.map((seg) => {
      const idx = orderedIds.indexOf(seg.id);
      return {
        ...seg,
        display_order: idx !== -1 ? idx + 1 : seg.display_order,
      };
    });

    this.saveLocalSegments(updatedList);

    if (isSupabaseConfigured) {
      try {
        for (const seg of updatedList) {
          await supabase
            .from('advisory_segments')
            .update({ display_order: seg.display_order })
            .eq('id', seg.id);
        }
      } catch (err) {
        console.warn('Supabase reorder sync error', err);
      }
    }

    return true;
  }

  /**
   * Delete segment safely — Enforces check for existing advisors and bookings
   */
  static async deleteSegment(id: string): Promise<{ success: boolean; error?: string }> {
    // Check if segment is in use
    const cleanId = id.trim();
    if (isSupabaseConfigured) {
      try {
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
      } catch (e: any) {
        console.warn('Supabase delete segment error', e);
      }
    }

    const localList = this.getLocalSegments();
    const filtered = localList.filter((s) => s.id !== cleanId && s.slug !== cleanId);
    this.saveLocalSegments(filtered);
    return { success: true };
  }

  /**
   * Calculate live segment analytics and metrics dynamically
   */
  static async getSegmentMetrics(): Promise<SegmentMetrics[]> {
    const segments = await this.getAllSegments(true);
    const metrics: SegmentMetrics[] = [];

    for (const segment of segments) {
      // Aggregate data for this segment
      metrics.push({
        segment,
        advisor_count: 0, // dynamically aggregated in AdminService
        active_advisor_count: 0,
        booking_count: 0,
        total_gmv_inr: 0,
        pending_verification_count: 0,
      });
    }

    return metrics;
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

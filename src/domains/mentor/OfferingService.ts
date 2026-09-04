import { supabase, isSupabaseConfigured } from '../../lib/supabase/client';
import { Offering, MentorSegment } from '../../lib/supabase/types';
import { SegmentService } from '../segment/SegmentService';

export interface OfferingDetail extends Offering {}

export class OfferingService {
  /**
   * Get all offerings for a mentor across all their active segments
   */
  static async getMentorOfferings(mentorId: string): Promise<Offering[]> {
    if (!isSupabaseConfigured) {
      console.warn('Supabase not configured. Returning empty offerings.');
      return [];
    }

    try {
      const { data: msData, error: msError } = await supabase
        .from('mentor_segments')
        .select('id')
        .eq('mentor_id', mentorId)
        .eq('status', 'active');

      if (msError || !msData || msData.length === 0) {
        return [];
      }

      const msIds = msData.map((ms) => ms.id);

      const { data: offeringsData, error: offeringsError } = await supabase
        .from('offerings')
        .select('*, mentor_segment:mentor_segments(*, segment:advisory_segments(*))')
        .in('mentor_segment_id', msIds);

      if (offeringsError) {
        console.error('Error fetching offerings:', offeringsError);
        return [];
      }

      return offeringsData || [];
    } catch (err) {
      console.error('Error in getMentorOfferings:', err);
      return [];
    }
  }

  /**
   * Get offerings for a specific segment
   */
  static async getSegmentOfferings(segmentId: string): Promise<Offering[]> {
    if (!isSupabaseConfigured) {
      console.warn('Supabase not configured. Returning empty offerings.');
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('mentor_segments')
        .select('id')
        .eq('segment_id', segmentId)
        .eq('status', 'active');

      if (error || !data || data.length === 0) {
        return [];
      }

      const msIds = data.map((ms) => ms.id);

      const { data: offerings, error: offeringsError } = await supabase
        .from('offerings')
        .select('*, mentor_segment:mentor_segments(*, mentor:mentors(*, profile:profiles(*)))')
        .in('mentor_segment_id', msIds)
        .eq('is_available', true);

      if (offeringsError) {
        console.error('Error fetching segment offerings:', offeringsError);
        return [];
      }

      return offerings || [];
    } catch (err) {
      console.error('Error in getSegmentOfferings:', err);
      return [];
    }
  }

  /**
   * Get a single offering by ID
   */
  static async getOfferingById(offeringId: string): Promise<Offering | null> {
    if (!isSupabaseConfigured) {
      console.warn('Supabase not configured. Cannot fetch offering.');
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('offerings')
        .select('*, mentor_segment:mentor_segments(*, mentor:mentors(*, profile:profiles(*)), segment:advisory_segments(*))')
        .eq('id', offeringId)
        .single();

      if (error || !data) {
        console.error('Error fetching offering:', error);
        return null;
      }

      return data;
    } catch (err) {
      console.error('Error in getOfferingById:', err);
      return null;
    }
  }

  /**
   * Get a single offering by slug
   */
  static async getOfferingBySlug(slug: string): Promise<Offering | null> {
    if (!isSupabaseConfigured) {
      console.warn('Supabase not configured. Cannot fetch offering.');
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('mentors')
        .select('*, mentor_segments:mentor_segments!inner(*), offerings:offerings!inner(*)')
        .or(`slug.eq.${slug}`)
        .single();

      if (error || !data) {
        return null;
      }

      return data.offerings?.[0] || null;
    } catch (err) {
      console.error('Error in getOfferingBySlug:', err);
      return null;
    }
  }

  /**
   * Create a new offering
   */
  static async createOffering(params: {
    mentorSegmentId: string;
    title: string;
    description: string;
    duration_minutes: number;
    price_inr: number;
    deliverables: string[];
  }): Promise<{ success: boolean; offering?: Offering; error?: string }> {
    if (!isSupabaseConfigured) {
      return { success: false, error: 'Supabase not configured' };
    }

    try {
      const slug = params.title
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      const { data, error } = await supabase
        .from('offerings')
        .insert({
          mentor_segment_id: params.mentorSegmentId,
          title: params.title.trim(),
          slug: slug || `offering-${Date.now()}`,
          description: params.description.trim(),
          duration_minutes: params.duration_minutes,
          price_inr: params.price_inr,
          deliverables: params.deliverables || [],
          is_available: true,
        })
        .select('*, mentor_segment:mentor_segments(*, segment:advisory_segments(*))')
        .single();

      if (error || !data) {
        return { success: false, error: error?.message || 'Failed to create offering' };
      }

      return { success: true, offering: data };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Failed to create offering' };
    }
  }

  /**
   * Update an existing offering
   */
  static async updateOffering(
    offeringId: string,
    updates: Partial<Omit<Offering, 'id' | 'mentor_segment_id' | 'created_at'>>
  ): Promise<{ success: boolean; offering?: Offering; error?: string }> {
    if (!isSupabaseConfigured) {
      return { success: false, error: 'Supabase not configured' };
    }

    try {
      const { data, error } = await supabase
        .from('offerings')
        .update(updates)
        .eq('id', offeringId)
        .select('*, mentor_segment:mentor_segments(*, segment:advisory_segments(*))')
        .single();

      if (error || !data) {
        return { success: false, error: error?.message || 'Failed to update offering' };
      }

      return { success: true, offering: data };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Failed to update offering' };
    }
  }

  /**
   * Delete an offering
   */
  static async deleteOffering(offeringId: string): Promise<{ success: boolean; error?: string }> {
    if (!isSupabaseConfigured) {
      return { success: false, error: 'Supabase not configured' };
    }

    try {
      const { error } = await supabase
        .from('offerings')
        .delete()
        .eq('id', offeringId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Failed to delete offering' };
    }
  }

  /**
   * Set offering availability (published/unpublished)
   */
  static async setOfferingAvailability(
    offeringId: string,
    isAvailable: boolean
  ): Promise<{ success: boolean; error?: string }> {
    if (!isSupabaseConfigured) {
      return { success: false, error: 'Supabase not configured' };
    }

    try {
      const { error } = await supabase
        .from('offerings')
        .update({ is_available: isAvailable })
        .eq('id', offeringId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Failed to update availability' };
    }
  }
}

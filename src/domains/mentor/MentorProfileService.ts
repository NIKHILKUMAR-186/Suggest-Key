import { supabase, isSupabaseConfigured } from '../../lib/supabase/client';
import { Mentor, MentorSegment, Profile } from '../../lib/supabase/types';
import { AdvisorySegment } from '../../domains/segment/SegmentTypes';

export interface MentorOnboardingState {
  mentorExists: boolean;
  isComplete: boolean;
  primarySegmentId: string | null;
  activeSegmentIds: string[];
  error?: string;
}

export interface MentorProfileDetail {
  id: string;
  headline: string;
  bio: string;
  experience_years: number;
  rating: number;
  review_count: number;
  verification_status: string;
  verified_categories: string[];
  credentials_url?: string | null;
  credentials_verified_at?: string | null;
  specialties?: string[];
  is_demo?: boolean;
  created_at: string;
  updated_at?: string;
  profile?: Profile;
  segments: Array<{
    id: string;
    segment: AdvisorySegment;
    status: 'active' | 'inactive' | 'archived';
    display_order: number;
  }>;
}

export class MentorProfileService {
  /**
   * Fetch a mentor's full profile with their segment associations
   */
  static async getMentorProfile(mentorId: string): Promise<MentorProfileDetail | null> {
    if (!isSupabaseConfigured) {
      console.warn('Supabase not configured. Cannot fetch mentor profile.');
      return null;
    }

    try {
      const { data: mentorData, error: mentorError } = await supabase
        .from('mentors')
        .select('*, profile:profiles(*)')
        .eq('id', mentorId)
        .single();

      if (mentorError || !mentorData) {
        console.error('Error fetching mentor profile:', mentorError);
        return null;
      }

      const { data: segmentData, error: segmentError } = await supabase
        .from('mentor_segments')
        .select('*, segment:advisory_segments(*)')
        .eq('mentor_id', mentorId)
        .order('display_order', { ascending: true });

      if (segmentError) {
        console.error('Error fetching mentor segments:', segmentError);
      }

      return {
        ...mentorData,
        segments: (segmentData || []).map((ms: Record<string, unknown>) => ({
          id: ms.id as string,
          segment: ms.segment as Record<string, unknown> | undefined,
          status: ms.status as string | undefined,
          display_order: ms.display_order as number | undefined,
        })),
      } as MentorProfileDetail;
    } catch (err) {
      console.error('Error in getMentorProfile:', err);
      return null;
    }
  }

  /**
   * Add a segment to a mentor's profile
   */
  static async addMentorSegment(
    mentorId: string,
    segmentId: string
  ): Promise<{ success: boolean; error?: string; mentor_segment_id?: string }> {
    if (!isSupabaseConfigured) {
      return { success: false, error: 'Supabase not configured' };
    }

    try {
      const { data, error } = await supabase
        .from('mentor_segments')
        .insert({
          mentor_id: mentorId,
          segment_id: segmentId,
          status: 'active',
        })
        .select('id')
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return {
        success: true,
        mentor_segment_id: data.id,
      };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Failed to add mentor segment' };
    }
  }

  /**
   * Remove a segment from a mentor's profile
   */
  static async removeMentorSegment(
    mentorId: string,
    segmentId: string
  ): Promise<{ success: boolean; error?: string }> {
    if (!isSupabaseConfigured) {
      return { success: false, error: 'Supabase not configured' };
    }

    try {
      const { error } = await supabase
        .from('mentor_segments')
        .delete()
        .eq('mentor_id', mentorId)
        .eq('segment_id', segmentId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Failed to remove mentor segment' };
    }
  }

  /**
   * Update a mentor segment's status
   */
  static async updateMentorSegmentStatus(
    mentorSegmentId: string,
    status: 'active' | 'inactive' | 'archived'
  ): Promise<{ success: boolean; error?: string }> {
    if (!isSupabaseConfigured) {
      return { success: false, error: 'Supabase not configured' };
    }

    try {
      const { error } = await supabase
        .from('mentor_segments')
        .update({ status })
        .eq('id', mentorSegmentId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Failed to update segment status' };
    }
  }

  /**
   * Get all segments for a mentor
   */
  static async getMentorSegments(mentorId: string): Promise<MentorSegment[]> {
    if (!isSupabaseConfigured) {
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('mentor_segments')
        .select('*, segment:advisory_segments(*)')
        .eq('mentor_id', mentorId)
        .order('display_order', { ascending: true });

      if (error) {
        console.error('Error fetching mentor segments:', error);
        return [];
      }

      return data || [];
    } catch (err) {
      console.error('Error in getMentorSegments:', err);
      return [];
    }
  }

  /**
   * Reorder a mentor's segments
   */
  static async reorderMentorSegments(
    mentorId: string,
    orderedSegmentIds: string[]
  ): Promise<{ success: boolean; error?: string }> {
    if (!isSupabaseConfigured) {
      return { success: false, error: 'Supabase not configured' };
    }

    try {
      for (let i = 0; i < orderedSegmentIds.length; i++) {
        await supabase
          .from('mentor_segments')
          .update({ display_order: i })
          .eq('mentor_id', mentorId)
          .eq('segment_id', orderedSegmentIds[i]);
      }

      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Failed to reorder segments' };
    }
  }

  /**
   * Check if a mentor is associated with a given segment
   */
  static async isMentorInSegment(mentorId: string, segmentId: string): Promise<boolean> {
    if (!isSupabaseConfigured) {
      return false;
    }

    try {
      const { count, error } = await supabase
        .from('mentor_segments')
        .select('*', { count: 'exact', head: true })
        .eq('mentor_id', mentorId)
        .eq('segment_id', segmentId)
        .eq('status', 'active');

      if (error) {
        console.error('Error checking mentor segment:', error);
        return false;
      }

      return (count || 0) > 0;
    } catch (err) {
      console.error('Error in isMentorInSegment:', err);
      return false;
    }
  }

  static async getMentorOnboardingState(mentorId: string): Promise<MentorOnboardingState> {
    if (!isSupabaseConfigured) {
      return {
        mentorExists: false,
        isComplete: false,
        primarySegmentId: null,
        activeSegmentIds: [],
        error: 'Supabase not configured',
      };
    }

    try {
      const { data: mentorData, error: mentorError } = await supabase
        .from('mentors')
        .select('id, headline, bio, primary_segment_id')
        .eq('id', mentorId)
        .single();

      if (mentorError || !mentorData) {
        return {
          mentorExists: false,
          isComplete: false,
          primarySegmentId: null,
          activeSegmentIds: [],
          error: mentorError?.message || 'Mentor profile not found',
        };
      }

      const { data: segmentRows, error: segmentError } = await supabase
        .from('mentor_segments')
        .select('segment_id, display_order')
        .eq('mentor_id', mentorId)
        .eq('status', 'active')
        .order('display_order', { ascending: true });

      if (segmentError) {
        return {
          mentorExists: true,
          isComplete: false,
          primarySegmentId: null,
          activeSegmentIds: [],
          error: segmentError.message,
        };
      }

      const activeSegmentIds = (segmentRows || [])
        .map((row) => row.segment_id)
        .filter((segmentId): segmentId is string => Boolean(segmentId));
      const primarySegmentId =
        mentorData.primary_segment_id && activeSegmentIds.includes(mentorData.primary_segment_id)
          ? mentorData.primary_segment_id
          : segmentRows?.find((row) => row.display_order === 0)?.segment_id ||
            segmentRows?.[0]?.segment_id ||
            null;
      const isComplete = Boolean(
        mentorData.headline?.trim() && mentorData.bio?.trim() && primarySegmentId
      );

      return {
        mentorExists: true,
        isComplete,
        primarySegmentId,
        activeSegmentIds,
      };
    } catch (err) {
      return {
        mentorExists: false,
        isComplete: false,
        primarySegmentId: null,
        activeSegmentIds: [],
        error: err instanceof Error ? err.message : 'Failed to load mentor onboarding state',
      };
    }
  }

  static async setPrimarySegment(
    mentorId: string,
    segmentId: string
  ): Promise<{ success: boolean; state?: MentorOnboardingState; error?: string }> {
    if (!isSupabaseConfigured) {
      return { success: false, error: 'Supabase not configured' };
    }

    if (!mentorId || !segmentId) {
      return { success: false, error: 'Mentor and segment identifiers are required' };
    }

    try {
      const { data: segment, error: segmentError } = await supabase
        .from('advisory_segments')
        .select('id')
        .eq('id', segmentId)
        .eq('is_active', true)
        .single();

      if (segmentError || !segment) {
        return { success: false, error: 'Selected segment is not active' };
      }

      const { error: upsertError } = await supabase
        .from('mentor_segments')
        .upsert(
          {
            mentor_id: mentorId,
            segment_id: segmentId,
            status: 'active',
            display_order: 0,
          },
          { onConflict: 'mentor_id,segment_id' }
        );

      if (upsertError) {
        return { success: false, error: upsertError.message };
      }

      const { error: reorderError } = await supabase
        .from('mentor_segments')
        .update({ display_order: 1 })
        .eq('mentor_id', mentorId)
        .neq('segment_id', segmentId);

      if (reorderError) {
        return { success: false, error: reorderError.message };
      }

      const { error: selectedError } = await supabase
        .from('mentor_segments')
        .update({ status: 'active', display_order: 0 })
        .eq('mentor_id', mentorId)
        .eq('segment_id', segmentId);

      if (selectedError) {
        return { success: false, error: selectedError.message };
      }

      const { error: mentorError } = await supabase
        .from('mentors')
        .update({ primary_segment_id: segmentId })
        .eq('id', mentorId);

      if (mentorError) {
        return { success: false, error: mentorError.message };
      }

      const state = await this.getMentorOnboardingState(mentorId);
      return { success: true, state };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to save primary segment',
      };
    }
  }
}

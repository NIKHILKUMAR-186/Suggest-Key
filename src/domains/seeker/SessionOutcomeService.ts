import { supabase } from '../../lib/supabase/client';
import { SessionOutcome } from '../../lib/supabase/types';

export interface CreateSessionOutcomeParams {
  bookingId: string;
  seekerId: string;
  mentorId: string;
  summary?: string;
  keyObservations: string[];
  recommendedActions: string[];
  nextCheckpoint?: string;
}

export class SessionOutcomeService {
  static async getSessionOutcomeByBooking(bookingId: string): Promise<SessionOutcome | null> {
    try {
      const { data, error } = await supabase
        .from('session_outcomes')
        .select('*')
        .eq('booking_id', bookingId)
        .single();

      if (error || !data) {
        return null;
      }

      return data;
    } catch (err) {
      console.error('Error in getSessionOutcomeByBooking:', err);
      return null;
    }
  }

  static async getSeekerSessionOutcomes(seekerId: string): Promise<SessionOutcome[]> {
    try {
      const { data, error } = await supabase
        .from('session_outcomes')
        .select('*')
        .eq('seeker_id', seekerId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching seeker session outcomes:', error);
        return [];
      }

      return data || [];
    } catch (err) {
      console.error('Error in getSeekerSessionOutcomes:', err);
      return [];
    }
  }

  static async createSessionOutcome(params: CreateSessionOutcomeParams): Promise<SessionOutcome | null> {
    try {
      const { data, error } = await supabase
        .from('session_outcomes')
        .insert({
          booking_id: params.bookingId,
          seeker_id: params.seekerId,
          mentor_id: params.mentorId,
          summary: params.summary || null,
          key_observations: params.keyObservations,
          recommended_actions: params.recommendedActions,
          next_checkpoint: params.nextCheckpoint || null,
        })
        .select('*')
        .single();

      if (error || !data) {
        console.error('Error creating session outcome:', error);
        return null;
      }

      return data;
    } catch (err) {
      console.error('Error in createSessionOutcome:', err);
      return null;
    }
  }

  static async updateSessionOutcome(
    outcomeId: string,
    updates: {
      summary?: string;
      keyObservations?: string[];
      recommendedActions?: string[];
      nextCheckpoint?: string;
    }
  ): Promise<SessionOutcome | null> {
    try {
      const updateData: Record<string, unknown> = {};

      if (updates.summary !== undefined) updateData.summary = updates.summary;
      if (updates.keyObservations !== undefined) updateData.key_observations = updates.keyObservations;
      if (updates.recommendedActions !== undefined) updateData.recommended_actions = updates.recommendedActions;
      if (updates.nextCheckpoint !== undefined) updateData.next_checkpoint = updates.nextCheckpoint;

      const { data, error } = await supabase
        .from('session_outcomes')
        .update(updateData)
        .eq('id', outcomeId)
        .select('*')
        .single();

      if (error || !data) {
        console.error('Error updating session outcome:', error);
        return null;
      }

      return data;
    } catch (err) {
      console.error('Error in updateSessionOutcome:', err);
      return null;
    }
  }
}
import { supabase } from '../../lib/supabase/client';
import { Goal, GoalStatus } from '../../lib/supabase/types';

export interface CreateGoalParams {
  seekerId: string;
  title: string;
  domain: string;
  description?: string;
  targetCheckpoint?: string;
}

export class GoalService {
  static async getSeekerGoals(seekerId: string): Promise<Goal[]> {
    try {
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('seeker_id', seekerId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching goals:', error);
        return [];
      }

      return data || [];
    } catch (err) {
      console.error('Error in getSeekerGoals:', err);
      return [];
    }
  }

  static async getGoalById(goalId: string): Promise<Goal | null> {
    try {
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('id', goalId)
        .single();

      if (error || !data) {
        return null;
      }

      return data;
    } catch (err) {
      console.error('Error in getGoalById:', err);
      return null;
    }
  }

  static async createGoal(params: CreateGoalParams): Promise<Goal | null> {
    try {
      const { data, error } = await supabase
        .from('goals')
        .insert({
          seeker_id: params.seekerId,
          title: params.title,
          domain: params.domain,
          description: params.description || null,
          target_checkpoint: params.targetCheckpoint || null,
          status: 'active',
          progress: 0,
        })
        .select('*')
        .single();

      if (error || !data) {
        console.error('Error creating goal:', error);
        return null;
      }

      return data;
    } catch (err) {
      console.error('Error in createGoal:', err);
      return null;
    }
  }

  static async updateGoal(
    goalId: string,
    updates: {
      title?: string;
      domain?: string;
      description?: string;
      status?: GoalStatus;
      progress?: number;
      targetCheckpoint?: string;
    }
  ): Promise<Goal | null> {
    try {
      const updateData: Record<string, unknown> = {};

      if (updates.title !== undefined) updateData.title = updates.title;
      if (updates.domain !== undefined) updateData.domain = updates.domain;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.status !== undefined) updateData.status = updates.status;
      if (updates.progress !== undefined) updateData.progress = updates.progress;
      if (updates.targetCheckpoint !== undefined) updateData.target_checkpoint = updates.targetCheckpoint;

      const { data, error } = await supabase
        .from('goals')
        .update(updateData)
        .eq('id', goalId)
        .select('*')
        .single();

      if (error || !data) {
        console.error('Error updating goal:', error);
        return null;
      }

      return data;
    } catch (err) {
      console.error('Error in updateGoal:', err);
      return null;
    }
  }

  static async deleteGoal(goalId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('goals')
        .delete()
        .eq('id', goalId);

      if (error) {
        console.error('Error deleting goal:', error);
        return false;
      }

      return true;
    } catch (err) {
      console.error('Error in deleteGoal:', err);
      return false;
    }
  }
}
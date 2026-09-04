import { supabase } from '../../lib/supabase/client';
import { ActionItem, ActionItemStatus } from '../../lib/supabase/types';

export interface CreateActionItemParams {
  seekerId: string;
  title: string;
  description?: string;
  goalId?: string;
  bookingId?: string;
  dueDate?: string;
}

export class ActionItemService {
  static async getSeekerActionItems(seekerId: string): Promise<ActionItem[]> {
    try {
      const { data, error } = await supabase
        .from('action_items')
        .select('*')
        .eq('seeker_id', seekerId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching action items:', error);
        return [];
      }

      return data || [];
    } catch (err) {
      console.error('Error in getSeekerActionItems:', err);
      return [];
    }
  }

  static async getActionItemsByBooking(bookingId: string): Promise<ActionItem[]> {
    try {
      const { data, error } = await supabase
        .from('action_items')
        .select('*')
        .eq('booking_id', bookingId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching action items by booking:', error);
        return [];
      }

      return data || [];
    } catch (err) {
      console.error('Error in getActionItemsByBooking:', err);
      return [];
    }
  }

  static async getActionItemsByGoal(goalId: string): Promise<ActionItem[]> {
    try {
      const { data, error } = await supabase
        .from('action_items')
        .select('*')
        .eq('goal_id', goalId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching action items by goal:', error);
        return [];
      }

      return data || [];
    } catch (err) {
      console.error('Error in getActionItemsByGoal:', err);
      return [];
    }
  }

  static async createActionItem(params: CreateActionItemParams): Promise<ActionItem | null> {
    try {
      const { data, error } = await supabase
        .from('action_items')
        .insert({
          seeker_id: params.seekerId,
          title: params.title,
          description: params.description || null,
          goal_id: params.goalId || null,
          booking_id: params.bookingId || null,
          due_date: params.dueDate || null,
          status: 'pending',
        })
        .select('*')
        .single();

      if (error || !data) {
        console.error('Error creating action item:', error);
        return null;
      }

      return data;
    } catch (err) {
      console.error('Error in createActionItem:', err);
      return null;
    }
  }

  static async updateActionItem(
    actionItemId: string,
    updates: {
      title?: string;
      description?: string;
      status?: ActionItemStatus;
      goalId?: string | null;
      bookingId?: string | null;
      dueDate?: string | null;
    }
  ): Promise<ActionItem | null> {
    try {
      const updateData: Record<string, unknown> = {};

      if (updates.title !== undefined) updateData.title = updates.title;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.status !== undefined) updateData.status = updates.status;
      if (updates.goalId !== undefined) updateData.goal_id = updates.goalId;
      if (updates.bookingId !== undefined) updateData.booking_id = updates.bookingId;
      if (updates.dueDate !== undefined) updateData.due_date = updates.dueDate;

      const { data, error } = await supabase
        .from('action_items')
        .update(updateData)
        .eq('id', actionItemId)
        .select('*')
        .single();

      if (error || !data) {
        console.error('Error updating action item:', error);
        return null;
      }

      return data;
    } catch (err) {
      console.error('Error in updateActionItem:', err);
      return null;
    }
  }

  static async deleteActionItem(actionItemId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('action_items')
        .delete()
        .eq('id', actionItemId);

      if (error) {
        console.error('Error deleting action item:', error);
        return false;
      }

      return true;
    } catch (err) {
      console.error('Error in deleteActionItem:', err);
      return false;
    }
  }
}
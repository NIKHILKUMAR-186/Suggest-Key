import { supabase } from '../../lib/supabase/client';

export interface TimeSlot {
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  reason?: 'available' | 'booked' | 'locked' | 'passed';
  label: string;
}

export class AvailabilityService {
  /**
   * Acquire a temporary slot lock via the acquire_slot_lock RPC.
   * No local-only or offline fallback.
   */
  static async acquireLock(params: {
    mentorId: string;
    startTime: string;
    endTime: string;
    seekerId: string;
  }): Promise<{ success: boolean; lockId?: string; expiresAt?: string; error?: string }> {
    try {
      const { data, error } = await supabase.rpc('acquire_slot_lock', {
        p_mentor_id: params.mentorId,
        p_start_time: params.startTime,
        p_end_time: params.endTime,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data?.success === false) {
        return { success: false, error: data.error || 'SLOT_CONFLICT' };
      }

      return {
        success: true,
        lockId: data?.lock_id,
        expiresAt: data?.expires_at,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to acquire slot lock';
      console.error('acquireLock failed:', err);
      return { success: false, error: message };
    }
  }

  /**
   * Release a temporary lock via the release_slot_lock RPC.
   */
  static async releaseLock(lockId: string) {
    try {
      await supabase.rpc('release_slot_lock', { p_lock_id: lockId });
    } catch (err) {
      console.error('releaseLock failed:', err);
    }
  }

  /**
   * Calculate real-time slots for a given mentor and date via the
   * list_mentor_slots RPC. Returns an empty array on error.
   */
  static async getAvailableSlots(params: {
    mentorId: string;
    date: Date;
    durationMinutes: number;
    currentSeekerId?: string;
  }): Promise<TimeSlot[]> {
    const { mentorId, date, durationMinutes } = params;

    try {
      const dayStr = date.toISOString().split('T')[0];
      const { data, error } = await supabase.rpc('list_mentor_slots', {
        p_mentor_id: mentorId,
        p_day: dayStr,
        p_duration_minutes: durationMinutes,
      });

      if (error || !data || !Array.isArray(data)) {
        return [];
      }

      return (data as Array<{
        slot_start: string;
        slot_end: string;
        is_available: boolean;
        reason?: string;
      }>).map((row) => {
        const startMs = new Date(row.slot_start).getTime();
        const endMs = new Date(row.slot_end).getTime();
        return {
          startTime: row.slot_start,
          endTime: row.slot_end,
          isAvailable: !!row.is_available,
          reason: (row.reason as TimeSlot['reason']) || 'available',
          label: AvailabilityService.formatLabel(startMs, endMs),
        };
      });
    } catch (err) {
      console.error('getAvailableSlots failed:', err);
      return [];
    }
  }

  private static formatLabel(startMs: number, endMs: number): string {
    const fmt = (ms: number) =>
      new Date(ms).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    return `${fmt(startMs)} – ${fmt(endMs)}`;
  }
}
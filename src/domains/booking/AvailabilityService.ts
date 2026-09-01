import { BookingStatus } from '../../lib/supabase/types';

export interface TimeSlot {
  startTime: string; // ISO string
  endTime: string;   // ISO string
  isAvailable: boolean;
  reason?: 'available' | 'booked' | 'locked' | 'passed';
  label: string;     // e.g. "10:00 AM - 10:45 AM"
}

export interface SlotLock {
  id: string;
  mentorId: string;
  startTime: string;
  endTime: string;
  seekerId: string;
  expiresAt: number; // timestamp in ms
}

const STORAGE_KEY_LOCKS = 'suggestkey_slot_locks';
const LOCK_DURATION_MS = 5 * 60 * 1000; // 5 minutes lock during checkout

export class AvailabilityService {
  private static getStoredLocks(): SlotLock[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY_LOCKS);
      if (data) {
        const locks: SlotLock[] = JSON.parse(data);
        const now = Date.now();
        // Clean expired locks
        const activeLocks = locks.filter((l) => l.expiresAt > now);
        if (activeLocks.length !== locks.length) {
          localStorage.setItem(STORAGE_KEY_LOCKS, JSON.stringify(activeLocks));
        }
        return activeLocks;
      }
    } catch (e) {
      console.warn('Error reading slot locks', e);
    }
    return [];
  }

  private static saveLocks(locks: SlotLock[]) {
    try {
      localStorage.setItem(STORAGE_KEY_LOCKS, JSON.stringify(locks));
    } catch (e) {
      console.warn('Error saving slot locks', e);
    }
  }

  /**
   * Acquire a temporary 5-minute atomic lock on a slot while the seeker is completing checkout
   */
  static acquireLock(params: {
    mentorId: string;
    startTime: string;
    endTime: string;
    seekerId: string;
  }): { success: boolean; lockId?: string; error?: string } {
    const locks = this.getStoredLocks();
    const reqStart = new Date(params.startTime).getTime();
    const reqEnd = new Date(params.endTime).getTime();

    // Check if locked by someone else
    const existingLock = locks.find(
      (l) =>
        l.mentorId === params.mentorId &&
        l.seekerId !== params.seekerId &&
        new Date(l.startTime).getTime() < reqEnd &&
        new Date(l.endTime).getTime() > reqStart
    );

    if (existingLock) {
      return {
        success: false,
        error: 'SLOT_LOCKED_BY_ANOTHER_CLIENT',
      };
    }

    const lockId = `lock-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newLock: SlotLock = {
      id: lockId,
      mentorId: params.mentorId,
      startTime: params.startTime,
      endTime: params.endTime,
      seekerId: params.seekerId,
      expiresAt: Date.now() + LOCK_DURATION_MS,
    };

    locks.push(newLock);
    this.saveLocks(locks);

    return { success: true, lockId };
  }

  /**
   * Release a temporary lock
   */
  static releaseLock(lockId: string) {
    const locks = this.getStoredLocks();
    const updated = locks.filter((l) => l.id !== lockId);
    this.saveLocks(updated);
  }

  /**
   * Calculate exact real-time slots for a given mentor and date
   */
  static getAvailableSlots(params: {
    mentorId: string;
    date: Date;
    durationMinutes: number;
    existingBookings: { start_time: string; end_time: string; status: BookingStatus }[];
    currentSeekerId?: string;
  }): TimeSlot[] {
    const { mentorId, date, durationMinutes, existingBookings, currentSeekerId } = params;
    const locks = this.getStoredLocks();
    const slots: TimeSlot[] = [];

    // Schedule windows (e.g., 09:00 to 18:00 on weekdays, 10:00 to 16:00 on weekends)
    const dayOfWeek = date.getDay(); // 0 is Sunday, 6 is Saturday
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    const startHour = isWeekend ? 10 : 9;
    const endHour = isWeekend ? 16 : 18;

    const targetYear = date.getFullYear();
    const targetMonth = date.getMonth();
    const targetDay = date.getDate();

    let currentTime = new Date(targetYear, targetMonth, targetDay, startHour, 0, 0, 0);
    const dayEnd = new Date(targetYear, targetMonth, targetDay, endHour, 0, 0, 0);

    const now = Date.now();

    while (currentTime.getTime() + durationMinutes * 60 * 1000 <= dayEnd.getTime()) {
      const slotStart = new Date(currentTime);
      const slotEnd = new Date(currentTime.getTime() + durationMinutes * 60 * 1000);

      const slotStartTimeMs = slotStart.getTime();
      const slotEndTimeMs = slotEnd.getTime();

      let isAvailable = true;
      let reason: 'available' | 'booked' | 'locked' | 'passed' = 'available';

      // Check if time is in the past
      if (slotStartTimeMs < now + 15 * 60 * 1000) {
        // Less than 15 mins from now
        isAvailable = false;
        reason = 'passed';
      }

      // Check against confirmed / active bookings
      if (isAvailable) {
        const hasBookingConflict = existingBookings.some((b) => {
          if (b.status === 'cancelled') return false;
          const bStart = new Date(b.start_time).getTime();
          const bEnd = new Date(b.end_time).getTime();
          return slotStartTimeMs < bEnd && slotEndTimeMs > bStart;
        });

        if (hasBookingConflict) {
          isAvailable = false;
          reason = 'booked';
        }
      }

      // Check against unexpired slot locks held by other users
      if (isAvailable) {
        const hasLockConflict = locks.some((l) => {
          if (l.mentorId !== mentorId) return false;
          if (currentSeekerId && l.seekerId === currentSeekerId) return false; // Allowed for current seeker holding lock
          const lStart = new Date(l.startTime).getTime();
          const lEnd = new Date(l.endTime).getTime();
          return slotStartTimeMs < lEnd && slotEndTimeMs > lStart;
        });

        if (hasLockConflict) {
          isAvailable = false;
          reason = 'locked';
        }
      }

      // Format human-friendly label
      const startStr = slotStart.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
      const endStr = slotEnd.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });

      slots.push({
        startTime: slotStart.toISOString(),
        endTime: slotEnd.toISOString(),
        isAvailable,
        reason,
        label: `${startStr} – ${endStr}`,
      });

      // Increment by duration + 15 min buffer
      currentTime = new Date(currentTime.getTime() + (durationMinutes + 15) * 60 * 1000);
    }

    return slots;
  }
}

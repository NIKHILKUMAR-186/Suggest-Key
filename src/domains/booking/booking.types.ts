import { Booking, BookingStatus } from '../../lib/supabase/types';

export interface BookingRequest {
  gigId: string;
  mentorId: string;
  seekerId: string;
  startTime: string; // ISO string
  endTime: string; // ISO string
  amountInr: number;
  notes?: string;
}

export interface BookingResult {
  success: boolean;
  booking?: Booking;
  bookingId?: string;
  conversationId?: string;
  error?: 'SLOT_CONFLICT' | 'MENTOR_NOT_APPROVED' | 'PAYMENT_FAILED' | 'UNKNOWN';
  message?: string;
}

export interface TimeSlot {
  startTime: string; // ISO string
  endTime: string; // ISO string
  isAvailable: boolean;
}

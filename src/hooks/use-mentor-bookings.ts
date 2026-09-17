import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface MentorPendingBooking {
  booking_id: string;
  student_id: string;
  mentor_id: string;
  scheduled_time: string;
  duration_mins: number;
  status: string;
  payment_status: string;
  meeting_link: string | null;
  meeting_link_added_at: string | null;
  meeting_link_deadline: string | null;
  meeting_link_overdue: boolean;
  confirmed_at: string | null;
  completed_at: string | null;
  category_id: string | null;
  student_name: string | null;
  student_email: string | null;
  student_avatar_url: string | null;
  segment_name: string | null;
  gig_title: string | null;
  gig_price: number | null;
  gig_currency: string | null;
}

export interface MentorConfirmBookingResult {
  success?: boolean;
  error?: string;
  booking_id?: string;
  status?: string;
  message?: string;
}

/**
 * Fetch all mentor bookings via the canonical RPC.
 * Returns the full row set (pending + confirmed + completed).
 * Filter client-side for the sections that need it.
 */
export function useMentorBookings(mentorId?: string | null) {
  return useQuery({
    queryKey: ["mentor-bookings", mentorId],
    enabled: !!mentorId,
    staleTime: 30_000,
    queryFn: async (): Promise<MentorPendingBooking[]> => {
      const { data, error } = await (supabase as any).rpc("get_mentor_pending_bookings", {
        p_mentor_id: mentorId,
        p_limit: 100,
        p_offset: 0,
      });
      if (error) throw error;
      return (data ?? []) as MentorPendingBooking[];
    },
  });
}

/**
 * Mentor confirms a booking by supplying a meeting link.
 * Delegates to the server-side `mentor_confirm_booking` RPC so RLS,
 * payment verification and timing checks are enforced server-side.
 */
export function useMentorConfirmBooking() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      bookingId: string;
      meetingLink: string;
      mentorId: string;
    }): Promise<MentorConfirmBookingResult> => {
      const { data, error } = await (supabase as any).rpc("mentor_confirm_booking", {
        p_booking_id: payload.bookingId,
        p_meeting_link: payload.meetingLink,
      });
      if (error) throw error;
      return (data ?? {}) as MentorConfirmBookingResult;
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["mentor-bookings", variables.mentorId] });
      qc.invalidateQueries({ queryKey: ["notifications-unread", variables.mentorId] });
      toast.success("Session confirmed");
    },
    onError: (error: any) => {
      toast.error(error?.message ?? "Failed to confirm session");
    },
  });
}
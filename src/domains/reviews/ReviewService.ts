import { supabase, isSupabaseConfigured } from '../../lib/supabase/client';

export interface ReviewDetail {
  id: string;
  booking_id: string;
  seeker_id: string;
  seeker_name?: string;
  seeker_avatar?: string;
  is_anonymous: boolean;
  mentor_id: string;
  gig_id?: string;
  rating: number;
  rating_expertise?: number;
  rating_communication?: number;
  rating_actionability?: number;
  review_text?: string;
  comment?: string;
  mentor_response?: string;
  mentor_response_at?: string;
  created_at: string;
}

export class ReviewService {
  /**
   * Get all reviews for a mentor from Supabase
   */
  static async getReviewsForMentor(mentorId: string): Promise<ReviewDetail[]> {
    if (!isSupabaseConfigured) {
      console.warn('Supabase not configured. Returning empty reviews.');
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          seeker:profiles(id, full_name, avatar_url)
        `)
        .eq('mentor_id', mentorId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching reviews:', error);
        return [];
      }

      return (data || []).map((rev: any) => ({
        id: rev.id,
        booking_id: rev.booking_id,
        seeker_id: rev.seeker_id,
        seeker_name: rev.seeker?.full_name,
        seeker_avatar: rev.seeker?.avatar_url,
        is_anonymous: rev.is_anonymous || false,
        mentor_id: rev.mentor_id,
        gig_id: rev.gig_id,
        rating: rev.rating,
        rating_expertise: rev.rating_expertise,
        rating_communication: rev.rating_communication,
        rating_actionability: rev.rating_actionability,
        review_text: rev.comment,
        comment: rev.comment,
        mentor_response: rev.mentor_response,
        mentor_response_at: rev.mentor_response_at,
        created_at: rev.created_at,
      }));
    } catch (err) {
      console.error('Error in getReviewsForMentor:', err);
      return [];
    }
  }

  /**
   * Get review by booking ID from Supabase
   */
  static async getReviewByBookingId(bookingId: string): Promise<ReviewDetail | null> {
    if (!isSupabaseConfigured) {
      console.warn('Supabase not configured. Cannot fetch review.');
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          seeker:profiles(id, full_name, avatar_url)
        `)
        .eq('booking_id', bookingId)
        .single();

      if (error || !data) {
        return null;
      }

      return {
        id: data.id,
        booking_id: data.booking_id,
        seeker_id: data.seeker_id,
        seeker_name: data.seeker?.full_name,
        seeker_avatar: data.seeker?.avatar_url,
        is_anonymous: data.is_anonymous || false,
        mentor_id: data.mentor_id,
        gig_id: data.gig_id,
        rating: data.rating,
        rating_expertise: data.rating_expertise,
        rating_communication: data.rating_communication,
        rating_actionability: data.rating_actionability,
        review_text: data.comment,
        comment: data.comment,
        mentor_response: data.mentor_response,
        mentor_response_at: data.mentor_response_at,
        created_at: data.created_at,
      };
    } catch (err) {
      console.error('Error in getReviewByBookingId:', err);
      return null;
    }
  }

  /**
   * Submit a verified review for a completed session
   */
  static async submitReview(params: {
    bookingId: string;
    seekerId: string;
    seekerName?: string;
    seekerAvatar?: string;
    isAnonymous: boolean;
    mentorId: string;
    gigId?: string;
    rating: number;
    ratingExpertise?: number;
    ratingCommunication?: number;
    ratingActionability?: number;
    reviewText: string;
  }): Promise<ReviewDetail | null> {
    if (!isSupabaseConfigured) {
      console.warn('Supabase not configured. Cannot submit review.');
      return null;
    }

    try {
      // Verify booking exists and is completed
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .select('id, status')
        .eq('id', params.bookingId)
        .single();

      if (bookingError || !booking) {
        throw new Error('Review submission rejected: Booking record not found.');
      }

      if (booking.status !== 'completed') {
        throw new Error('Review submission rejected: Session must be completed before reviewing.');
      }

      // Check if review already exists
      const { data: existingReview } = await supabase
        .from('reviews')
        .select('id')
        .eq('booking_id', params.bookingId)
        .single();

      const reviewData = {
        booking_id: params.bookingId,
        seeker_id: params.seekerId,
        mentor_id: params.mentorId,
        gig_id: params.gigId,
        rating: Math.min(5, Math.max(1, params.rating)),
        rating_expertise: params.ratingExpertise ? Math.min(5, Math.max(1, params.ratingExpertise)) : params.rating,
        rating_communication: params.ratingCommunication ? Math.min(5, Math.max(1, params.ratingCommunication)) : params.rating,
        rating_actionability: params.ratingActionability ? Math.min(5, Math.max(1, params.ratingActionability)) : params.rating,
        comment: params.reviewText,
        is_anonymous: params.isAnonymous,
        ...(existingReview ? { id: existingReview.id } : {}),
      };

      let data, error;

      if (existingReview) {
        // Update existing review
        ({ data, error } = await supabase
          .from('reviews')
          .update(reviewData)
          .eq('id', existingReview.id)
          .select(`
            *,
            seeker:profiles(id, full_name, avatar_url)
          `)
          .single());
      } else {
        // Insert new review
        ({ data, error } = await supabase
          .from('reviews')
          .insert(reviewData)
          .select(`
            *,
            seeker:profiles(id, full_name, avatar_url)
          `)
          .single());
      }

      if (error || !data) {
        console.error('Error submitting review:', error);
        throw new Error(error?.message || 'Failed to submit review.');
      }

      // Update mentor's rating and review count
      await this.updateMentorRating(params.mentorId);

      return {
        id: data.id,
        booking_id: data.booking_id,
        seeker_id: data.seeker_id,
        seeker_name: data.seeker?.full_name,
        seeker_avatar: data.seeker?.avatar_url,
        is_anonymous: data.is_anonymous || false,
        mentor_id: data.mentor_id,
        gig_id: data.gig_id,
        rating: data.rating,
        rating_expertise: data.rating_expertise,
        rating_communication: data.rating_communication,
        rating_actionability: data.rating_actionability,
        review_text: data.comment,
        comment: data.comment,
        mentor_response: data.mentor_response,
        mentor_response_at: data.mentor_response_at,
        created_at: data.created_at,
      };
    } catch (err: any) {
      console.error('Error in submitReview:', err);
      throw new Error(err.message || 'Failed to submit review.');
    }
  }

  /**
   * Mentor responds to a review
   */
  static async replyToReview(
    reviewId: string,
    responseText: string
  ): Promise<ReviewDetail | null> {
    if (!isSupabaseConfigured) {
      console.warn('Supabase not configured. Cannot reply to review.');
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('reviews')
        .update({
          mentor_response: responseText,
          mentor_response_at: new Date().toISOString(),
        })
        .eq('id', reviewId)
        .select(`
          *,
          seeker:profiles(id, full_name, avatar_url)
        `)
        .single();

      if (error || !data) {
        console.error('Error replying to review:', error);
        return null;
      }

      return {
        id: data.id,
        booking_id: data.booking_id,
        seeker_id: data.seeker_id,
        seeker_name: data.seeker?.full_name,
        seeker_avatar: data.seeker?.avatar_url,
        is_anonymous: data.is_anonymous || false,
        mentor_id: data.mentor_id,
        gig_id: data.gig_id,
        rating: data.rating,
        rating_expertise: data.rating_expertise,
        rating_communication: data.rating_communication,
        rating_actionability: data.rating_actionability,
        review_text: data.comment,
        comment: data.comment,
        mentor_response: data.mentor_response,
        mentor_response_at: data.mentor_response_at,
        created_at: data.created_at,
      };
    } catch (err) {
      console.error('Error in replyToReview:', err);
      return null;
    }
  }

  /**
   * Update mentor's aggregate rating based on reviews
   */
  private static async updateMentorRating(mentorId: string): Promise<void> {
    try {
      const { data: reviews, error } = await supabase
        .from('reviews')
        .select('rating')
        .eq('mentor_id', mentorId);

      if (error || !reviews || reviews.length === 0) {
        return;
      }

      const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
      const reviewCount = reviews.length;

      await supabase
        .from('mentors')
        .update({
          rating: Math.round(avgRating * 100) / 100,
          review_count: reviewCount,
        })
        .eq('id', mentorId);
    } catch (err) {
      console.error('Error updating mentor rating:', err);
    }
  }

  /**
   * Get review statistics for a mentor
   */
  static async getMentorReviewStats(mentorId: string): Promise<{
    averageRating: number;
    totalReviews: number;
    ratingDistribution: { [key: number]: number };
  }> {
    if (!isSupabaseConfigured) {
      return {
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      };
    }

    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('rating')
        .eq('mentor_id', mentorId);

      if (error || !data || data.length === 0) {
        return {
          averageRating: 0,
          totalReviews: 0,
          ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        };
      }

      const ratingDistribution: { [key: number]: number } = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      let totalRating = 0;

      data.forEach((review) => {
        ratingDistribution[review.rating] = (ratingDistribution[review.rating] || 0) + 1;
        totalRating += review.rating;
      });

      return {
        averageRating: Math.round((totalRating / data.length) * 100) / 100,
        totalReviews: data.length,
        ratingDistribution,
      };
    } catch (err) {
      console.error('Error in getMentorReviewStats:', err);
      return {
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      };
    }
  }
}

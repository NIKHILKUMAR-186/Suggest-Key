import { BookingService } from '../booking/BookingService';

export interface ReviewDetail {
  id: string;
  booking_id: string;
  seeker_id: string;
  seeker_name: string;
  seeker_avatar?: string;
  is_anonymous: boolean;
  mentor_id: string;
  gig_id: string;
  rating: number; // 1 to 5
  rating_expertise: number;
  rating_communication: number;
  rating_actionability: number;
  review_text: string;
  created_at: string;
  mentor_response?: string;
  mentor_response_at?: string;
}

const STORAGE_KEY_REVIEWS = 'suggestkey_reviews_store';

const INITIAL_REVIEWS: ReviewDetail[] = [
  {
    id: 'rev-001',
    booking_id: 'bk-003',
    seeker_id: 'usr-seeker-01',
    seeker_name: 'Alex Rivera',
    seeker_avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    is_anonymous: false,
    mentor_id: 'sarah-jenkins',
    gig_id: 'venture-pitch-teardown',
    rating: 5,
    rating_expertise: 5,
    rating_communication: 5,
    rating_actionability: 5,
    review_text:
      'Sarah dismantled our series A deck structure in the first 15 minutes and restructured our unit economics narrative. Her critique of our customer acquisition cohorts gave us complete conviction before meeting institutional investors.',
    created_at: '2026-08-21T11:00:00Z',
    mentor_response:
      'Thank you Alex! Your retention curves were already world-class; you just needed to lead with net dollar expansion. Best of luck closing the round.',
    mentor_response_at: '2026-08-21T14:30:00Z',
  },
  {
    id: 'rev-002',
    booking_id: 'bk-prev-101',
    seeker_id: 'usr-seeker-88',
    seeker_name: 'David K. (CTO)',
    is_anonymous: true,
    mentor_id: 'marcus-thorne',
    gig_id: 'system-architecture-audit',
    rating: 5,
    rating_expertise: 5,
    rating_communication: 4,
    rating_actionability: 5,
    review_text:
      'Marcus identified an insidious distributed deadlock risk in our Kafka consumer group rebalance logic that had evaded two internal audits. Highest signal-to-noise consultation I have experienced.',
    created_at: '2026-08-18T16:20:00Z',
  },
  {
    id: 'rev-003',
    booking_id: 'bk-prev-102',
    seeker_id: 'usr-seeker-92',
    seeker_name: 'Elena Rostova',
    seeker_avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80',
    is_anonymous: false,
    mentor_id: 'evelyn-vasquez',
    gig_id: 'executive-crossroads',
    rating: 5,
    rating_expertise: 5,
    rating_communication: 5,
    rating_actionability: 5,
    review_text:
      'Dr. Vasquez operates at a rare intersection of clinical rigor and practical executive reality. She provided a structured cognitive restructuring protocol that stopped a spiral of chronic decision fatigue within 48 hours.',
    created_at: '2026-08-10T09:45:00Z',
    mentor_response:
      'Elena, your commitment to enforcing executive boundaries is inspiring. Keep applying the cognitive matrix.',
    mentor_response_at: '2026-08-10T12:00:00Z',
  },
];

export class ReviewService {
  private static getStoredReviews(): ReviewDetail[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY_REVIEWS);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.warn('Error reading reviews', e);
    }
    localStorage.setItem(STORAGE_KEY_REVIEWS, JSON.stringify(INITIAL_REVIEWS));
    return INITIAL_REVIEWS;
  }

  private static saveReviews(reviews: ReviewDetail[]) {
    try {
      localStorage.setItem(STORAGE_KEY_REVIEWS, JSON.stringify(reviews));
    } catch (e) {
      console.warn('Error saving reviews', e);
    }
  }

  /**
   * Get all reviews for a mentor
   */
  static async getReviewsForMentor(mentorId: string): Promise<ReviewDetail[]> {
    const all = this.getStoredReviews();
    return all.filter((r) => r.mentor_id === mentorId);
  }

  /**
   * Get review by booking ID
   */
  static async getReviewByBookingId(bookingId: string): Promise<ReviewDetail | null> {
    const all = this.getStoredReviews();
    return all.find((r) => r.booking_id === bookingId) || null;
  }

  /**
   * Submit a verified review for a completed session
   */
  static async submitReview(params: {
    bookingId: string;
    seekerId: string;
    seekerName: string;
    seekerAvatar?: string;
    isAnonymous: boolean;
    mentorId: string;
    gigId: string;
    rating: number;
    ratingExpertise: number;
    ratingCommunication: number;
    ratingActionability: number;
    reviewText: string;
  }): Promise<ReviewDetail> {
    const booking = await BookingService.getBookingById(params.bookingId);
    if (!booking) {
      throw new Error('Review submission rejected: Booking record not found.');
    }

    const all = this.getStoredReviews();

    const existingIndex = all.findIndex((r) => r.booking_id === params.bookingId);

    const newReview: ReviewDetail = {
      id: `rev-${Date.now().toString().slice(-6)}`,
      booking_id: params.bookingId,
      seeker_id: params.seekerId,
      seeker_name: params.isAnonymous ? `${params.seekerName.split(' ')[0]} (Anonymous)` : params.seekerName,
      seeker_avatar: params.isAnonymous ? undefined : params.seekerAvatar,
      is_anonymous: params.isAnonymous,
      mentor_id: params.mentorId,
      gig_id: params.gigId,
      rating: Math.min(5, Math.max(1, params.rating)),
      rating_expertise: Math.min(5, Math.max(1, params.ratingExpertise)),
      rating_communication: Math.min(5, Math.max(1, params.ratingCommunication)),
      rating_actionability: Math.min(5, Math.max(1, params.ratingActionability)),
      review_text: params.reviewText,
      created_at: new Date().toISOString(),
    };

    if (existingIndex !== -1) {
      all[existingIndex] = newReview;
    } else {
      all.unshift(newReview);
    }

    this.saveReviews(all);
    return newReview;
  }

  /**
   * Mentor replies to a client review
   */
  static async replyToReview(
    reviewId: string,
    responseText: string
  ): Promise<ReviewDetail | null> {
    const all = this.getStoredReviews();
    const index = all.findIndex((r) => r.id === reviewId);
    if (index === -1) return null;

    all[index] = {
      ...all[index],
      mentor_response: responseText,
      mentor_response_at: new Date().toISOString(),
    };

    this.saveReviews(all);
    return all[index];
  }
}

export interface PaymentOrder {
  id: string;
  booking_id?: string;
  amount_inr: number;
  currency: string;
  platform_fee_inr: number;
  mentor_payout_inr: number;
  status: 'created' | 'escrow_held' | 'escrow_released' | 'refunded';
  payment_method?: 'upi' | 'card' | 'netbanking';
  payment_id?: string;
  created_at: string;
  released_at?: string;
  refunded_at?: string;
  idempotency_key: string;
}

export interface LedgerTransaction {
  id: string;
  booking_id: string;
  mentor_id: string;
  seeker_id: string;
  type: 'ESCROW_HOLD' | 'ESCROW_RELEASE' | 'REFUND' | 'PLATFORM_COMMISSION' | 'PAYOUT_TRANSFER';
  amount_inr: number;
  description: string;
  timestamp: string;
  reference_id: string;
  created_at?: string;
}

export class PaymentService {
  /**
   * Get ledger entries from the ledger_transactions table.
   * Returns an empty array when no real implementation is wired up.
   */
  static async getLedger(_filters?: { bookingId?: string; mentorId?: string }): Promise<LedgerTransaction[]> {
    console.warn('PaymentService.getLedger has no real database implementation wired up.');
    return [];
  }

  /**
   * Calculate financial breakdown based on standard 15% platform rate
   */
  static calculateBreakdown(amountInr: number, commissionPercent: number = 15) {
    const platformFee = Math.round((amountInr * commissionPercent) / 100);
    const mentorPayout = amountInr - platformFee;
    return {
      grossAmount: amountInr,
      platformFee,
      mentorPayout,
      commissionPercent,
    };
  }

  /**
   * Create an escrow payment order
   * Real implementation must call the payments/orders Supabase RPC.
   * Returns null when no real implementation is wired up.
   */
  static async createOrder(params: {
    amountInr: number;
    bookingId?: string;
    commissionPercent?: number;
  }): Promise<PaymentOrder | null> {
    console.warn('PaymentService.createOrder has no real database implementation wired up.');
    return null;
  }

  /**
   * Process simulated payment capture & lock in Escrow
   * Real implementation must call the payments/capture Supabase RPC.
   * Returns null when no real implementation is wired up.
   */
  static async capturePayment(_params: {
    orderId: string;
    paymentMethod: 'upi' | 'card' | 'netbanking';
    bookingId: string;
    mentorId: string;
    seekerId: string;
  }): Promise<{ success: boolean; paymentId: string } | null> {
    console.warn('PaymentService.capturePayment has no real database implementation wired up.');
    return null;
  }

  /**
   * Release Escrow funds to Mentor upon session completion
   * Real implementation must call the payments/release Supabase RPC.
   * Returns null when no real implementation is wired up.
   */
  static async releaseEscrow(_params: {
    bookingId: string;
    mentorId: string;
    seekerId: string;
    amountInr: number;
  }): Promise<{ success: boolean; utr: string } | null> {
    console.warn('PaymentService.releaseEscrow has no real database implementation wired up.');
    return null;
  }

  /**
   * Process refund to Seeker
   * Real implementation must call the payments/refund Supabase RPC.
   * Returns null when no real implementation is wired up.
   */
  static async refundBooking(_params: {
    bookingId: string;
    mentorId: string;
    seekerId: string;
    amountInr: number;
    reason: string;
  }): Promise<{ success: boolean; refundId: string } | null> {
    console.warn('PaymentService.refundBooking has no real database implementation wired up.');
    return null;
  }

  static async refundPayment(params: {
    bookingId: string;
    mentorId: string;
    seekerId?: string;
    amountInr: number;
    reason?: string;
  }): Promise<{ success: boolean; refundId: string } | null> {
    return this.refundBooking({
      bookingId: params.bookingId,
      mentorId: params.mentorId,
      seekerId: params.seekerId || '',
      amountInr: params.amountInr,
      reason: params.reason || 'Administrative refund processed by platform operator',
    });
  }
}
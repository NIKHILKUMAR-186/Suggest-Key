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
}

const STORAGE_KEY_ORDERS = 'suggestkey_payment_orders';
const STORAGE_KEY_LEDGER = 'suggestkey_payment_ledger';

const INITIAL_LEDGER: LedgerTransaction[] = [
  {
    id: 'tx-001',
    booking_id: 'bk-001',
    mentor_id: 'evelyn-vasquez',
    seeker_id: 'usr-seeker-01',
    type: 'ESCROW_HOLD',
    amount_inr: 3500,
    description: 'Escrow deposit captured for 1:1 Executive Crossroads session',
    timestamp: '2026-08-28T14:31:00Z',
    reference_id: 'pay_rzp_live_94821',
  },
  {
    id: 'tx-002',
    booking_id: 'bk-002',
    mentor_id: 'marcus-thorne',
    seeker_id: 'usr-seeker-01',
    type: 'ESCROW_HOLD',
    amount_inr: 4500,
    description: 'Escrow deposit captured for System Architecture Audit',
    timestamp: '2026-08-29T09:16:00Z',
    reference_id: 'pay_rzp_live_94822',
  },
  {
    id: 'tx-003',
    booking_id: 'bk-003',
    mentor_id: 'sarah-jenkins',
    seeker_id: 'usr-seeker-01',
    type: 'ESCROW_RELEASE',
    amount_inr: 4250,
    description: 'Escrow released to mentor available balance post-session completion',
    timestamp: '2026-08-20T17:00:00Z',
    reference_id: 'payout_utr_89218',
  },
  {
    id: 'tx-004',
    booking_id: 'bk-003',
    mentor_id: 'sarah-jenkins',
    seeker_id: 'usr-seeker-01',
    type: 'PLATFORM_COMMISSION',
    amount_inr: 750,
    description: '15% platform operator commission deducted',
    timestamp: '2026-08-20T17:00:00Z',
    reference_id: 'fee_rev_3019',
  },
];

export class PaymentService {
  private static getStoredOrders(): PaymentOrder[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY_ORDERS);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.warn('Error reading payment orders', e);
    }
    return [];
  }

  private static saveOrders(orders: PaymentOrder[]) {
    try {
      localStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify(orders));
    } catch (e) {
      console.warn('Error saving payment orders', e);
    }
  }

  static getLedger(): LedgerTransaction[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY_LEDGER);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.warn('Error reading ledger', e);
    }
    localStorage.setItem(STORAGE_KEY_LEDGER, JSON.stringify(INITIAL_LEDGER));
    return INITIAL_LEDGER;
  }

  private static saveLedger(ledger: LedgerTransaction[]) {
    try {
      localStorage.setItem(STORAGE_KEY_LEDGER, JSON.stringify(ledger));
    } catch (e) {
      console.warn('Error saving ledger', e);
    }
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
   */
  static async createOrder(params: {
    amountInr: number;
    bookingId?: string;
    commissionPercent?: number;
  }): Promise<PaymentOrder> {
    const orders = this.getStoredOrders();
    const { platformFee, mentorPayout } = this.calculateBreakdown(
      params.amountInr,
      params.commissionPercent
    );

    const idempotencyKey = `idem-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newOrder: PaymentOrder = {
      id: `ord_${Date.now().toString().slice(-8)}`,
      booking_id: params.bookingId,
      amount_inr: params.amountInr,
      currency: 'INR',
      platform_fee_inr: platformFee,
      mentor_payout_inr: mentorPayout,
      status: 'created',
      created_at: new Date().toISOString(),
      idempotency_key: idempotencyKey,
    };

    orders.push(newOrder);
    this.saveOrders(orders);
    return newOrder;
  }

  /**
   * Process simulated payment capture & lock in Escrow
   */
  static async capturePayment(params: {
    orderId: string;
    paymentMethod: 'upi' | 'card' | 'netbanking';
    bookingId: string;
    mentorId: string;
    seekerId: string;
  }): Promise<{ success: boolean; paymentId: string }> {
    const orders = this.getStoredOrders();
    const index = orders.findIndex((o) => o.id === params.orderId);

    const paymentId = `pay_rzp_${Date.now().toString().slice(-8)}`;

    if (index !== -1) {
      orders[index].status = 'escrow_held';
      orders[index].payment_method = params.paymentMethod;
      orders[index].payment_id = paymentId;
      orders[index].booking_id = params.bookingId;
      this.saveOrders(orders);
    }

    // Add ledger entry
    const ledger = this.getLedger();
    const order = index !== -1 ? orders[index] : null;
    const amount = order?.amount_inr || 3500;

    ledger.unshift({
      id: `tx-${Date.now()}`,
      booking_id: params.bookingId,
      mentor_id: params.mentorId,
      seeker_id: params.seekerId,
      type: 'ESCROW_HOLD',
      amount_inr: amount,
      description: `Escrow payment captured via ${params.paymentMethod.toUpperCase()}`,
      timestamp: new Date().toISOString(),
      reference_id: paymentId,
    });

    this.saveLedger(ledger);
    return { success: true, paymentId };
  }

  /**
   * Release Escrow funds to Mentor upon session completion
   */
  static async releaseEscrow(params: {
    bookingId: string;
    mentorId: string;
    seekerId: string;
    amountInr: number;
  }): Promise<{ success: boolean; utr: string }> {
    const utr = `UTR${Date.now().toString().slice(-8)}`;
    const { platformFee, mentorPayout } = this.calculateBreakdown(params.amountInr);

    const ledger = this.getLedger();

    // Mentor credit
    ledger.unshift({
      id: `tx-rel-${Date.now()}`,
      booking_id: params.bookingId,
      mentor_id: params.mentorId,
      seeker_id: params.seekerId,
      type: 'ESCROW_RELEASE',
      amount_inr: mentorPayout,
      description: `Escrow payout released to mentor available balance (Ref: ${utr})`,
      timestamp: new Date().toISOString(),
      reference_id: utr,
    });

    // Platform commission
    ledger.unshift({
      id: `tx-fee-${Date.now()}`,
      booking_id: params.bookingId,
      mentor_id: params.mentorId,
      seeker_id: params.seekerId,
      type: 'PLATFORM_COMMISSION',
      amount_inr: platformFee,
      description: `15% platform commission realized`,
      timestamp: new Date().toISOString(),
      reference_id: `FEE-${utr}`,
    });

    this.saveLedger(ledger);
    return { success: true, utr };
  }

  /**
   * Process refund to Seeker
   */
  static async refundBooking(params: {
    bookingId: string;
    mentorId: string;
    seekerId: string;
    amountInr: number;
    reason: string;
  }): Promise<{ success: boolean; refundId: string }> {
    const refundId = `ref_rzp_${Date.now().toString().slice(-8)}`;
    const ledger = this.getLedger();

    ledger.unshift({
      id: `tx-ref-${Date.now()}`,
      booking_id: params.bookingId,
      mentor_id: params.mentorId,
      seeker_id: params.seekerId,
      type: 'REFUND',
      amount_inr: params.amountInr,
      description: `100% Escrow refund dispatched to seeker: ${params.reason}`,
      timestamp: new Date().toISOString(),
      reference_id: refundId,
    });

    this.saveLedger(ledger);
    return { success: true, refundId };
  }

  static async refundPayment(params: {
    bookingId: string;
    mentorId: string;
    seekerId?: string;
    amountInr: number;
    reason?: string;
  }): Promise<{ success: boolean; refundId: string }> {
    return this.refundBooking({
      bookingId: params.bookingId,
      mentorId: params.mentorId,
      seekerId: params.seekerId || 'usr-seeker-01',
      amountInr: params.amountInr,
      reason: params.reason || 'Administrative refund processed by platform operator',
    });
  }
}

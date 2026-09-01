import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../domains/auth/AuthContext';
import { useToast } from '../../components/ui/Toast';
import { AdvisorDetail } from '../../domains/advisor/seedData';
import { Gig } from '../../lib/supabase/types';
import { AvailabilityService, TimeSlot } from '../../domains/booking/AvailabilityService';
import { BookingService, EnrichedBooking } from '../../domains/booking/BookingService';
import { PaymentService } from '../../domains/payment/PaymentService';
import { MessagingService } from '../../domains/messaging/MessagingService';
import {
  Calendar,
  Clock,
  Lock,
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  X,
  ArrowRight,
  UserCheck,
  Sparkles,
  Smartphone,
  Building2,
  RefreshCw,
} from 'lucide-react';

interface BookingCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  advisor: AdvisorDetail;
  gig: Gig;
  initialDate?: string;
  initialSlot?: string;
  initialNotes?: string;
  initialIsAnonymous?: boolean;
  onBookingSuccess?: (booking: EnrichedBooking) => void;
}

export const BookingCheckoutModal: React.FC<BookingCheckoutModalProps> = ({
  isOpen,
  onClose,
  advisor,
  gig,
  initialDate,
  initialSlot,
  initialNotes,
  initialIsAnonymous,
  onBookingSuccess,
}) => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Wizard Step: 1 = Slot & Context, 2 = Payment Gateway, 3 = Confirmation
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Scheduling State
  const [selectedDate, setSelectedDate] = useState<string>(
    initialDate || new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0]
  );
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [loadingSlots, setLoadingSlots] = useState<boolean>(false);
  const [seekerNotes, setSeekerNotes] = useState<string>(initialNotes || '');
  const [isAnonymous, setIsAnonymous] = useState<boolean>(initialIsAnonymous ?? profile?.is_anonymous_enabled ?? false);

  // Concurrency & Lock State
  const [lockId, setLockId] = useState<string | null>(null);
  const [lockExpiresIn, setLockExpiresIn] = useState<number>(300); // 5 mins in seconds
  const [slotConflictError, setSlotConflictError] = useState<string | null>(null);

  // Payment Gateway State
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card' | 'netbanking'>('card');
  const [upiId, setUpiId] = useState<string>('alex.rivera@oksbi');
  const [cardNumber, setCardNumber] = useState<string>('4532 •••• •••• 8912');
  const [cardExpiry, setCardExpiry] = useState<string>('08/29');
  const [cardCvv, setCardCvv] = useState<string>('419');
  const [isProcessingPayment, setIsProcessingPayment] = useState<boolean>(false);

  // Completed Booking
  const [confirmedBooking, setConfirmedBooking] = useState<EnrichedBooking | null>(null);

  // Calculate Fee Breakdown
  const breakdown = PaymentService.calculateBreakdown(gig.price_inr);

  // Generate 7-day selector dates
  const next7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i + 1);
    return {
      dateStr: d.toISOString().split('T')[0],
      dayLabel: d.toLocaleDateString('en-US', { weekday: 'short' }),
      dateNum: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      rawDate: d,
    };
  });

  // Fetch slots whenever selectedDate changes
  useEffect(() => {
    async function loadSlots() {
      if (!isOpen) return;
      setLoadingSlots(true);
      setSlotConflictError(null);

      const allBookings = await BookingService.getMentorBookings(advisor.id);
      const targetDate = new Date(selectedDate);

      const slots = AvailabilityService.getAvailableSlots({
        mentorId: advisor.id,
        date: targetDate,
        durationMinutes: gig.duration_minutes || 45,
        existingBookings: allBookings,
        currentSeekerId: profile?.id,
      });

      setAvailableSlots(slots);
      setLoadingSlots(false);

      // Auto-select first available slot if previous is invalid
      const available = slots.find((s) => s.isAvailable);
      if (available) {
        setSelectedSlot(available);
      } else {
        setSelectedSlot(null);
      }
    }

    loadSlots();
  }, [isOpen, selectedDate, advisor.id, gig.duration_minutes, profile?.id]);

  // Lock countdown timer
  useEffect(() => {
    if (!lockId || step !== 2) return;

    const timer = setInterval(() => {
      setLockExpiresIn((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // Lock expired, release and return to step 1
          if (lockId) AvailabilityService.releaseLock(lockId);
          setLockId(null);
          setStep(1);
          setSlotConflictError('Your 5-minute reservation timer expired. Please select your time slot again.');
          return 300;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [lockId, step]);

  if (!isOpen) return null;

  const handleProceedToPayment = () => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (!selectedSlot) {
      toast({ title: 'Slot Required', description: 'Please select an available appointment time slot.' });
      return;
    }

    // Acquire atomic temporary lock
    const lockResult = AvailabilityService.acquireLock({
      mentorId: advisor.id,
      startTime: selectedSlot.startTime,
      endTime: selectedSlot.endTime,
      seekerId: profile?.id || 'usr-seeker-01',
    });

    if (!lockResult.success) {
      setSlotConflictError('This time slot was just selected by another client. Please choose another time.');
      return;
    }

    setLockId(lockResult.lockId || null);
    setLockExpiresIn(300);
    setSlotConflictError(null);
    setStep(2);
  };

  const handleExecuteAtomicBooking = async () => {
    if (!selectedSlot) return;

    setIsProcessingPayment(true);
    setSlotConflictError(null);

    // Simulate payment capture
    const paymentOrder = await PaymentService.createOrder({
      amountInr: gig.price_inr,
    });

    // Execute atomic booking creation with conflict detection
    const result = await BookingService.createAtomicBooking({
      seekerId: profile?.id || 'usr-seeker-01',
      seekerName: profile?.full_name || 'Alex Rivera',
      seekerEmail: profile?.email || 'alex.rivera@example.com',
      seekerAvatar: profile?.avatar_url,
      mentorId: advisor.id,
      gigId: gig.id,
      startTime: selectedSlot.startTime,
      endTime: selectedSlot.endTime,
      notes: seekerNotes,
      isAnonymous,
      lockId: lockId || undefined,
    });

    if (!result.success || !result.booking) {
      setIsProcessingPayment(false);
      if (lockId) AvailabilityService.releaseLock(lockId);
      setLockId(null);
      setStep(1);
      setSlotConflictError(result.message || 'Concurrency conflict: slot is no longer available.');
      return;
    }

    // Payment captured into Escrow
    await PaymentService.capturePayment({
      orderId: paymentOrder.id,
      paymentMethod,
      bookingId: result.booking.id,
      mentorId: advisor.id,
      seekerId: profile?.id || 'usr-seeker-01',
    });

    // Auto create / update direct chat message channel with system notification
    const channelId = `ch-${result.booking.id}`;
    await MessagingService.sendMessage({
      channelId,
      senderId: 'system',
      senderName: 'Suggest Key Platform',
      senderRole: 'mentor',
      content: `Session confirmed for ${new Date(result.booking.start_time).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      })} at ${new Date(result.booking.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}. Escrow deposit of ₹${(result.booking.amount_inr || 0).toLocaleString()} held safely.`,
    });

    setIsProcessingPayment(false);
    setConfirmedBooking(result.booking);
    setStep(3);

    if (onBookingSuccess) {
      onBookingSuccess(result.booking);
    }
  };

  const handleClose = () => {
    if (lockId) {
      AvailabilityService.releaseLock(lockId);
    }
    setLockId(null);
    setStep(1);
    onClose();
  };

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-2xl bg-[#0d0d0d] border border-white/15 rounded-[28px] shadow-2xl overflow-hidden text-white max-h-[90vh] flex flex-col">
        {/* Header Strip */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between bg-black/40">
          <div className="flex items-center gap-3">
            <img
              src={advisor.avatar_url}
              alt={advisor.full_name}
              className="w-10 h-10 rounded-full object-cover border border-white/15"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-widest text-[#ffb829] font-semibold">
                  1:1 Advisory Booking
                </span>
                <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-[#15846e]/20 text-[#15846e] border border-[#15846e]/30">
                  Atomic Safe
                </span>
              </div>
              <h2 className="text-base font-medium text-white">{gig.title}</h2>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="p-2 rounded-full text-[#9a9a9a] hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 md:p-8 overflow-y-auto space-y-6 flex-1">
          {/* STEP 1: REAL-TIME SLOT SELECTION & INTAKE CONTEXT */}
          {step === 1 && (
            <div className="space-y-6">
              {slotConflictError && (
                <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-3">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block">Schedule Collision</span>
                    <span>{slotConflictError}</span>
                  </div>
                </div>
              )}

              {/* Date Selection Strip */}
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-wider text-[#9a9a9a] font-medium block">
                  1. Select Scheduled Date
                </label>
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                  {next7Days.map((d) => {
                    const isSelected = selectedDate === d.dateStr;
                    return (
                      <button
                        key={d.dateStr}
                        type="button"
                        onClick={() => setSelectedDate(d.dateStr)}
                        className={`p-2.5 rounded-2xl border text-center transition-all ${
                          isSelected
                            ? 'border-[#8052ff] bg-[#8052ff] text-white shadow-md shadow-[#8052ff]/30'
                            : 'border-white/10 bg-white/5 text-[#9a9a9a] hover:text-white hover:border-white/20'
                        }`}
                      >
                        <div className="text-[10px] uppercase font-light">{d.dayLabel}</div>
                        <div className="text-xs font-semibold">{d.dateNum}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Real-time Slots Grid */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs uppercase tracking-wider text-[#9a9a9a] font-medium">
                    2. Select Verified Time Slot (IST)
                  </label>
                  <span className="text-[11px] text-[#9a9a9a] flex items-center gap-1">
                    <Lock className="w-3 h-3 text-[#15846e]" /> Real-time server validated
                  </span>
                </div>

                {loadingSlots ? (
                  <div className="py-8 text-center text-xs text-[#9a9a9a] flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-[#8052ff]" />
                    <span>Querying real-time schedule ledger...</span>
                  </div>
                ) : availableSlots.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {availableSlots.map((slot, idx) => {
                      const isSelected = selectedSlot?.startTime === slot.startTime;
                      return (
                        <button
                          key={idx}
                          type="button"
                          disabled={!slot.isAvailable}
                          onClick={() => setSelectedSlot(slot)}
                          className={`p-3 rounded-2xl border text-left text-xs transition-all relative ${
                            !slot.isAvailable
                              ? 'border-white/5 bg-white/[0.02] text-[#666666] cursor-not-allowed opacity-50'
                              : isSelected
                              ? 'border-[#8052ff] bg-[#8052ff]/20 text-white font-medium ring-2 ring-[#8052ff]/50'
                              : 'border-white/10 bg-white/5 text-[#bdbdbd] hover:text-white hover:border-white/25'
                          }`}
                        >
                          <div className="font-semibold">{slot.label}</div>
                          <div className="text-[10px] mt-0.5">
                            {slot.isAvailable ? (
                              <span className="text-[#15846e] flex items-center gap-1">
                                <CheckCircle2 className="w-2.5 h-2.5" /> Available
                              </span>
                            ) : slot.reason === 'booked' ? (
                              <span className="text-[#9a9a9a]">Booked</span>
                            ) : slot.reason === 'locked' ? (
                              <span className="text-[#ffb829]">Checkout Held</span>
                            ) : (
                              <span className="text-[#666666]">Passed</span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-6 rounded-2xl border border-white/10 bg-white/[0.02] text-center text-xs text-[#9a9a9a]">
                    No available time windows found for this date. Please pick an alternate date.
                  </div>
                )}
              </div>

              {/* Problem Intent Note */}
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-wider text-[#9a9a9a] font-medium block">
                  3. Session Problem Context & Intake Goal
                </label>
                <textarea
                  rows={3}
                  value={seekerNotes}
                  onChange={(e) => setSeekerNotes(e.target.value)}
                  placeholder="Outline the specific inflection point, decision dilemma, or architecture challenge you wish to address..."
                  className="w-full p-3.5 rounded-2xl bg-white/5 border border-white/10 text-white placeholder:text-[#9a9a9a]/40 text-xs focus:outline-none focus:border-[#8052ff] resize-none"
                />
              </div>

              {/* Anonymity Shield Option */}
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="text-xs font-medium text-white flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-[#15846e]" />
                    <span>Seeker Confidentiality Shield</span>
                  </div>
                  <div className="text-[11px] text-[#9a9a9a]">
                    Consult under an anonymous pseudonym; contact info stays encrypted.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="rounded bg-white/10 border-white/20 text-[#8052ff] focus:ring-0 cursor-pointer w-4 h-4"
                />
              </div>
            </div>
          )}

          {/* STEP 2: ESCROW PAYMENT GATEWAY (RAZORPAY ARCHITECTURE) */}
          {step === 2 && (
            <div className="space-y-6">
              {/* Lock Expiry Badge */}
              <div className="p-4 rounded-2xl bg-[#ffb829]/10 border border-[#ffb829]/30 flex items-center justify-between text-xs text-[#ffb829]">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  <span className="font-semibold">Slot Reserved Atomically</span>
                </div>
                <span className="font-mono text-sm font-bold">{formatSeconds(lockExpiresIn)} remaining</span>
              </div>

              {/* Order Breakdown Card */}
              <div className="p-5 rounded-2xl border border-white/10 bg-white/[0.02] space-y-3">
                <div className="flex items-center justify-between text-xs pb-3 border-b border-white/5">
                  <span className="text-[#9a9a9a]">Consultation Rate (100% Escrow)</span>
                  <span className="text-white font-medium">₹{(breakdown.grossAmount || 0).toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-xs pb-3 border-b border-white/5 text-[#9a9a9a]">
                  <span>Advisor Payout (85% upon completion)</span>
                  <span>₹{(breakdown.mentorPayout || 0).toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-xs pb-3 border-b border-white/5 text-[#9a9a9a]">
                  <span>Suggest Key Platform Fee (15%)</span>
                  <span>₹{(breakdown.platformFee || 0).toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-sm pt-1">
                  <span className="font-medium text-white">Total Escrow Deposit</span>
                  <span className="text-xl font-bold text-white">₹{(breakdown.grossAmount || 0).toLocaleString()}</span>
                </div>
              </div>

              {/* Payment Methods */}
              <div className="space-y-3">
                <label className="text-xs uppercase tracking-wider text-[#9a9a9a] font-medium block">
                  Select Payment Method (Sandbox Gateway)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('card')}
                    className={`p-3 rounded-2xl border text-center text-xs flex flex-col items-center gap-1.5 transition-all ${
                      paymentMethod === 'card'
                        ? 'border-[#8052ff] bg-[#8052ff]/20 text-white font-semibold'
                        : 'border-white/10 bg-white/5 text-[#9a9a9a] hover:text-white'
                    }`}
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>Card / Debit</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('upi')}
                    className={`p-3 rounded-2xl border text-center text-xs flex flex-col items-center gap-1.5 transition-all ${
                      paymentMethod === 'upi'
                        ? 'border-[#8052ff] bg-[#8052ff]/20 text-white font-semibold'
                        : 'border-white/10 bg-white/5 text-[#9a9a9a] hover:text-white'
                    }`}
                  >
                    <Smartphone className="w-4 h-4" />
                    <span>Instant UPI</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('netbanking')}
                    className={`p-3 rounded-2xl border text-center text-xs flex flex-col items-center gap-1.5 transition-all ${
                      paymentMethod === 'netbanking'
                        ? 'border-[#8052ff] bg-[#8052ff]/20 text-white font-semibold'
                        : 'border-white/10 bg-white/5 text-[#9a9a9a] hover:text-white'
                    }`}
                  >
                    <Building2 className="w-4 h-4" />
                    <span>Net Banking</span>
                  </button>
                </div>

                {/* Method Input Simulation */}
                {paymentMethod === 'card' && (
                  <div className="p-4 rounded-2xl border border-white/10 bg-black/40 space-y-3">
                    <div className="space-y-1">
                      <span className="text-[10px] text-[#9a9a9a] uppercase">Card Number</span>
                      <input
                        type="text"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        className="w-full p-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-mono"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <span className="text-[10px] text-[#9a9a9a] uppercase">Expiry</span>
                        <input
                          type="text"
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(e.target.value)}
                          className="w-full p-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-mono"
                        />
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] text-[#9a9a9a] uppercase">CVV</span>
                        <input
                          type="password"
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value)}
                          className="w-full p-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-mono"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {paymentMethod === 'upi' && (
                  <div className="p-4 rounded-2xl border border-white/10 bg-black/40 space-y-2">
                    <span className="text-[10px] text-[#9a9a9a] uppercase">Virtual Payment Address (VPA)</span>
                    <input
                      type="text"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-mono"
                    />
                  </div>
                )}

                {paymentMethod === 'netbanking' && (
                  <div className="p-4 rounded-2xl border border-white/10 bg-black/40 text-xs text-[#9a9a9a]">
                    Sandbox auto-clears via HDFC / ICICI / SBI direct settlement router.
                  </div>
                )}
              </div>

              {/* Escrow Guarantee Statement */}
              <div className="p-4 rounded-2xl bg-[#15846e]/10 border border-[#15846e]/30 flex items-start gap-2.5 text-xs text-[#15846e]">
                <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  Funds are locked in Suggest Key Escrow and only released to the mentor after the 1:1 call concludes successfully. Cancel anytime up to 24 hours prior for a 100% refund.
                </p>
              </div>
            </div>
          )}

          {/* STEP 3: SUCCESS CONFIRMATION */}
          {step === 3 && confirmedBooking && (
            <div className="space-y-6 text-center py-4">
              <div className="w-16 h-16 rounded-full bg-[#15846e]/20 text-[#15846e] border border-[#15846e]/30 flex items-center justify-center mx-auto text-2xl">
                ✓
              </div>

              <div className="space-y-2">
                <span className="text-xs uppercase tracking-widest text-[#15846e] font-semibold">
                  Session Confirmed & Locked
                </span>
                <h2 className="text-2xl font-normal text-white">Booking #{confirmedBooking.id}</h2>
                <p className="text-xs text-[#9a9a9a] max-w-md mx-auto leading-relaxed">
                  Your 1:1 consultation with {advisor.full_name} is scheduled. A calendar invite and Google Meet link have been generated.
                </p>
              </div>

              <div className="p-5 rounded-2xl border border-white/10 bg-white/[0.02] text-left space-y-2 text-xs">
                <div className="flex justify-between text-[#bdbdbd]">
                  <span>Date & Time:</span>
                  <span className="text-white font-medium">
                    {new Date(confirmedBooking.start_time).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    })}{' '}
                    • {new Date(confirmedBooking.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="flex justify-between text-[#bdbdbd]">
                  <span>Escrow Deposit:</span>
                  <span className="text-white font-medium">₹{(confirmedBooking.amount_inr || 0).toLocaleString()} (Held in Escrow)</span>
                </div>
                <div className="flex justify-between text-[#bdbdbd]">
                  <span>Anonymity Shield:</span>
                  <span className="text-white font-medium">
                    {confirmedBooking.is_anonymous ? 'Enabled (Identity Masked)' : 'Disabled (Full Name Shared)'}
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    handleClose();
                    navigate(`/seeker/bookings/${confirmedBooking.id}`);
                  }}
                  className="flex-1 py-3.5 rounded-full bg-[#8052ff] hover:bg-[#6c3df0] text-white text-xs font-semibold uppercase tracking-wider transition-all"
                >
                  Go to Session Room
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleClose();
                    navigate('/seeker/messages');
                  }}
                  className="flex-1 py-3.5 rounded-full border border-white/15 hover:border-white/30 bg-white/5 text-white text-xs font-semibold uppercase tracking-wider transition-all"
                >
                  Open Advisor Chat
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions for Step 1 and Step 2 */}
        {step !== 3 && (
          <div className="p-6 border-t border-white/10 bg-black/40 flex items-center justify-between">
            {step === 1 ? (
              <>
                <div className="text-left">
                  <span className="text-[10px] uppercase text-[#9a9a9a] block">Escrow Rate</span>
                  <span className="text-xl font-bold text-white">₹{(gig.price_inr || 0).toLocaleString()}</span>
                </div>

                <button
                  type="button"
                  onClick={handleProceedToPayment}
                  disabled={!selectedSlot}
                  className={`px-8 py-3.5 rounded-full text-xs font-semibold uppercase tracking-wider flex items-center gap-2 transition-all ${
                    selectedSlot
                      ? 'bg-[#8052ff] hover:bg-[#6c3df0] text-white shadow-lg shadow-[#8052ff]/30'
                      : 'bg-white/10 text-[#666666] cursor-not-allowed'
                  }`}
                >
                  <span>Lock & Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => {
                    if (lockId) AvailabilityService.releaseLock(lockId);
                    setLockId(null);
                    setStep(1);
                  }}
                  className="text-xs uppercase tracking-wider text-[#9a9a9a] hover:text-white"
                >
                  ← Change Time Slot
                </button>

                <button
                  type="button"
                  onClick={handleExecuteAtomicBooking}
                  disabled={isProcessingPayment}
                  className="px-8 py-3.5 rounded-full bg-[#15846e] hover:bg-[#12705e] text-white text-xs font-semibold uppercase tracking-wider flex items-center gap-2 transition-all shadow-lg shadow-[#15846e]/30"
                >
                  {isProcessingPayment ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Securing Escrow...</span>
                    </>
                  ) : (
                    <>
                      <span>Authorize ₹{(breakdown.grossAmount || 0).toLocaleString()}</span>
                      <ShieldCheck className="w-4 h-4" />
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

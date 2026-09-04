import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../domains/auth/AuthContext';
import { useToast } from '../../components/ui/Toast';
import { AdvisorDetail } from '../../domains/advisor/AdvisorService';
import { Offering } from '../../lib/supabase/types';
import { AvailabilityService, TimeSlot } from '../../domains/booking/AvailabilityService';
import { BookingRequestService } from '../../domains/booking/BookingRequestService';
import { PaymentService } from '../../domains/payment/PaymentService';
import { MessagingService } from '../../domains/messaging/MessagingService';
import { BookingRequestWithDetails } from '../../domains/booking/BookingRequestService';
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
  Video,
  MessageSquare,
} from 'lucide-react';

interface BookingCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  advisor: AdvisorDetail;
  offering: Offering;
  initialDate?: string;
  initialSlot?: string;
  initialNotes?: string;
  initialIsAnonymous?: boolean;
  onBookingSuccess?: (bookingRequest: BookingRequestWithDetails) => void;
}

export const BookingCheckoutModal: React.FC<BookingCheckoutModalProps> = ({
  isOpen,
  onClose,
  advisor,
  offering,
  initialDate,
  initialSlot,
  initialNotes,
  initialIsAnonymous,
  onBookingSuccess,
}) => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedDate, setSelectedDate] = useState<string>(
    initialDate || new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0]
  );
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [loadingSlots, setLoadingSlots] = useState<boolean>(false);
  const [seekerNotes, setSeekerNotes] = useState<string>(initialNotes || '');
  const [isAnonymous, setIsAnonymous] = useState<boolean>(
    initialIsAnonymous ?? profile?.is_anonymous_enabled ?? false
  );

  const [lockId, setLockId] = useState<string | null>(null);
  const [lockExpiresAt, setLockExpiresAt] = useState<number>(0);
  const [lockExpiresIn, setLockExpiresIn] = useState<number>(300);
  const [slotConflictError, setSlotConflictError] = useState<string | null>(null);

  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card' | 'netbanking'>('card');
  const [upiId, setUpiId] = useState<string>('');
  const [cardNumber, setCardNumber] = useState<string>('');
  const [cardExpiry, setCardExpiry] = useState<string>('');
  const [cardCvv, setCardCvv] = useState<string>('');
  const [isProcessingPayment, setIsProcessingPayment] = useState<boolean>(false);

  const [confirmedRequest, setConfirmedRequest] = useState<BookingRequestWithDetails | null>(null);

  const breakdown = PaymentService.calculateBreakdown(offering.price_inr);

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

  useEffect(() => {
    async function loadSlots() {
      if (!isOpen) return;
      setLoadingSlots(true);
      setSlotConflictError(null);

      try {
        const targetDate = new Date(selectedDate);
        const slots = await AvailabilityService.getAvailableSlots({
          mentorId: advisor.id,
          date: targetDate,
          durationMinutes: offering.duration_minutes || 45,
          currentSeekerId: profile?.id,
        });
        setAvailableSlots(slots);

        const available = slots.find((s) => s.isAvailable);
        if (available && !initialSlot) {
          setSelectedSlot(available);
        } else {
          setSelectedSlot(null);
        }
      } catch (err) {
        console.error('Error loading slots:', err);
        setSlotConflictError('Unable to load availability right now.');
      } finally {
        setLoadingSlots(false);
      }
    }

    loadSlots();
  }, [isOpen, selectedDate, advisor.id, offering.duration_minutes, profile?.id]);

  useEffect(() => {
    if (!lockId || step !== 2) return;

    const timer = setInterval(() => {
      const remaining = Math.max(0, Math.floor((lockExpiresAt - Date.now()) / 1000));
      setLockExpiresIn(remaining);
      if (remaining <= 0) {
        clearInterval(timer);
        AvailabilityService.releaseLock(lockId).catch(() => undefined);
        setLockId(null);
        setStep(1);
        setSlotConflictError('Your 5-minute reservation expired. Please re-select a slot.');
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [lockId, step, lockExpiresAt]);

  if (!isOpen) return null;

  const handleProceedToPayment = async () => {
    if (!user || !profile) {
      navigate('/login');
      return;
    }

    if (!selectedSlot) {
      toast({ title: 'Slot Required', description: 'Please select an available appointment time slot.' });
      return;
    }

    if (profile.id === advisor.id) {
      toast({ title: 'Not Allowed', description: 'You cannot book a session with yourself.' });
      return;
    }

    const lockResult = await AvailabilityService.acquireLock({
      mentorId: advisor.id,
      startTime: selectedSlot.startTime,
      endTime: selectedSlot.endTime,
      seekerId: profile.id,
    });

    if (!lockResult.success) {
      setSlotConflictError(
        lockResult.error === 'SLOT_CONFLICT'
          ? 'This time slot was just taken by another client. Please choose another time.'
          : 'Could not reserve this slot. Please try another.'
      );
      return;
    }

    setLockId(lockResult.lockId || null);
    setLockExpiresAt(lockResult.expiresAt ? new Date(lockResult.expiresAt).getTime() : Date.now() + 5 * 60 * 1000);
    setLockExpiresIn(300);
    setSlotConflictError(null);
    setStep(2);
  };

  const handleExecuteBookingRequest = async () => {
    if (!selectedSlot || !profile) return;

    setIsProcessingPayment(true);
    setSlotConflictError(null);

    // Step 3 — Review (in-modal confirmation of booking summary)
    if (step === 2) {
      setStep(3);
      setIsProcessingPayment(false);
      return;
    }

    // Step 4 — Authorize payment (sandbox) and submit booking request
    const paymentOrder = await PaymentService.createOrder({
      amountInr: offering.price_inr,
    });

    const result = await BookingRequestService.createBookingRequest({
      offeringId: offering.id,
      startTime: selectedSlot.startTime,
      endTime: selectedSlot.endTime,
      message: seekerNotes || undefined,
      isAnonymous,
    });

    if (!result.success || !result.bookingRequestId) {
      setIsProcessingPayment(false);
      setSlotConflictError(result.message || 'Booking could not be submitted. Please try again.');
      if (lockId) {
        await AvailabilityService.releaseLock(lockId).catch(() => undefined);
      }
      setLockId(null);
      setStep(2);
      return;
    }

    // Capture payment ledger entry (sandbox)
    await PaymentService.capturePayment({
      orderId: paymentOrder.id,
      paymentMethod,
      bookingId: result.bookingRequestId,
      mentorId: advisor.id,
      seekerId: profile.id,
    });

    const full = await BookingRequestService.getBookingRequestById(result.bookingRequestId);

    if (full) {
      const conversationId = `ch-${full.id}`;
      await MessagingService.sendMessage({
        conversationId,
        senderId: 'system',
        senderName: 'Suggest Key Platform',
        senderRole: 'mentor',
        content: `Booking request submitted for ${new Date(full.proposed_start_time).toLocaleDateString('en-US', {
          weekday: 'short', month: 'short', day: 'numeric',
        })} at ${new Date(full.proposed_start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}. Funds held in escrow pending mentor approval.`,
      });
    }

    setIsProcessingPayment(false);
    setConfirmedRequest(full);
    setStep(4);

    if (lockId) {
      await AvailabilityService.releaseLock(lockId).catch(() => undefined);
    }
    setLockId(null);

    if (onBookingSuccess && full) {
      onBookingSuccess(full);
    }
  };

  const handleClose = async () => {
    if (lockId) {
      await AvailabilityService.releaseLock(lockId).catch(() => undefined);
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
      <div className="relative w-full max-w-2xl bg-[#0d0d0d] border border-white/15 rounded-[28px] shadow-2xl overflow-hidden text-white max-h-[90] flex flex-col" style={{maxHeight: '90vh'}}>
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
                  Step {step} of 4
                </span>
              </div>
              <h2 className="text-base font-medium text-white">{offering.title}</h2>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="p-2 rounded-full text-[#9a9a9a] hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 md:p-8 overflow-y-auto space-y-6 flex-1">
          {slotConflictError && step <= 2 && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block">Schedule Collision</span>
                <span>{slotConflictError}</span>
              </div>
            </div>
          )}

          {/* STEP 1: DATE + SLOT */}
          {step === 1 && (
            <div className="space-y-6">
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

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs uppercase tracking-wider text-[#9a9a9a] font-medium">
                    2. Select Verified Time Slot (IST)
                  </label>
                  <span className="text-[11px] text-[#9a9a9a] flex items-center gap-1">
                    <Lock className="w-3 h-3 text-[#15846e]" /> Server-validated availability
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

          {/* STEP 2: PAYMENT METHOD */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-[#ffb829]/10 border border-[#ffb829]/30 flex items-center justify-between text-xs text-[#ffb829]">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  <span className="font-semibold">Slot Reserved (server-validated)</span>
                </div>
                <span className="font-mono text-sm font-bold">{formatSeconds(lockExpiresIn)} remaining</span>
              </div>

              <div className="p-5 rounded-2xl border border-white/10 bg-white/[0.02] space-y-3">
                <div className="flex items-center justify-between text-xs pb-3 border-b border-white/5">
                  <span className="text-[#9a9a9a]">Consultation Rate</span>
                  <span className="text-white font-medium">₹{(breakdown.grossAmount || 0).toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-xs pb-3 border-b border-white/5 text-[#9a9a9a]">
                  <span>Advisor Payout (85%)</span>
                  <span>₹{(breakdown.mentorPayout || 0).toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-xs pb-3 border-b border-white/5 text-[#9a9a9a]">
                  <span>Platform Fee (15%)</span>
                  <span>₹{(breakdown.platformFee || 0).toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-sm pt-1">
                  <span className="font-medium text-white">Total Held in Escrow</span>
                  <span className="text-xl font-bold text-white">₹{(breakdown.grossAmount || 0).toLocaleString()}</span>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-xs uppercase tracking-wider text-[#9a9a9a] font-medium block">
                  Select Payment Method
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['card', 'upi', 'netbanking'] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setPaymentMethod(m)}
                      className={`p-3 rounded-2xl border text-center text-xs flex flex-col items-center gap-1.5 transition-all ${
                        paymentMethod === m
                          ? 'border-[#8052ff] bg-[#8052ff]/20 text-white font-semibold'
                          : 'border-white/10 bg-white/5 text-[#9a9a9a] hover:text-white'
                      }`}
                    >
                      {m === 'card' && <CreditCard className="w-4 h-4" />}
                      {m === 'upi' && <Smartphone className="w-4 h-4" />}
                      {m === 'netbanking' && <Building2 className="w-4 h-4" />}
                      <span>{m === 'card' ? 'Card / Debit' : m === 'upi' ? 'UPI' : 'Net Banking'}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#15846e]/10 border border-[#15846e]/30 flex items-start gap-2.5 text-xs text-[#15846e]">
                <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  Funds are secured in escrow until the mentor confirms your request. Cancellation is allowed any time before mentor acceptance.
                </p>
              </div>
            </div>
          )}

          {/* STEP 3: REVIEW */}
          {step === 3 && selectedSlot && (
            <div className="space-y-4">
              <h3 className="text-base font-medium text-white">Review Booking Request</h3>
              <div className="p-5 rounded-2xl border border-white/10 bg-white/[0.02] space-y-2.5 text-xs">
                <Row label="Mentor" value={advisor.full_name || ''} />
                <Row label="Offering" value={offering.title} />
                <Row
                  label="Date"
                  value={new Date(selectedSlot.startTime).toLocaleDateString('en-US', {
                    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
                  })}
                />
                <Row
                  label="Time"
                  value={`${new Date(selectedSlot.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} – ${new Date(selectedSlot.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                />
                <Row label="Duration" value={`${offering.duration_minutes} minutes`} />
                <Row label="Price" value={`₹${(offering.price_inr || 0).toLocaleString()}`} />
                <Row label="Anonymity" value={isAnonymous ? 'Enabled' : 'Disabled'} />
                {seekerNotes && <Row label="Notes" value={seekerNotes} />}
              </div>
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 text-[11px] text-[#9a9a9a]">
                Submitting will create a booking request that the mentor must accept. Your payment is held in escrow until they do.
              </div>
            </div>
          )}

          {/* STEP 4: CONFIRMATION */}
          {step === 4 && confirmedRequest && (
            <div className="space-y-6 text-center py-4">
              <div className="w-16 h-16 rounded-full bg-[#15846e]/20 text-[#15846e] border border-[#15846e]/30 flex items-center justify-center mx-auto text-2xl">
                ✓
              </div>

              <div className="space-y-2">
                <span className="text-xs uppercase tracking-widest text-[#15846e] font-semibold">
                  Booking Request Submitted
                </span>
                <h2 className="text-2xl font-normal text-white">Request #{confirmedRequest.id}</h2>
                <p className="text-xs text-[#9a9a9a] max-w-md mx-auto leading-relaxed">
                  Your request is pending {advisor.full_name}'s approval. Funds are held in escrow. You'll be notified the moment they accept.
                </p>
              </div>

              <div className="p-5 rounded-2xl border border-white/10 bg-white/[0.02] text-left space-y-2 text-xs">
                <Row label="Mentor" value={advisor.full_name || ''} />
                <Row label="Offering" value={offering.title} />
                <Row
                  label="Requested Date & Time"
                  value={`${new Date(confirmedRequest.proposed_start_time).toLocaleDateString('en-US', {
                    weekday: 'short', month: 'short', day: 'numeric',
                  })} • ${new Date(confirmedRequest.proposed_start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                />
                <Row label="Duration" value={`${offering.duration_minutes} minutes`} />
                <Row label="Price" value={`₹${(confirmedRequest.amount_inr || 0).toLocaleString()}`} />
                <Row label="Status" value={(confirmedRequest.status || 'pending').toUpperCase()} />
                <Row label="Next Step" value="Awaiting mentor approval" />
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    handleClose();
                    navigate(`/seeker/bookings/${confirmedRequest.id}`);
                  }}
                  className="flex-1 py-3.5 rounded-full bg-[#8052ff] hover:bg-[#6c3df0] text-white text-xs font-semibold uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                >
                  <Video className="w-4 h-4" />
                  <span>View Booking Status</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleClose();
                    navigate('/seeker/bookings');
                  }}
                  className="flex-1 py-3.5 rounded-full border border-white/15 hover:border-white/30 bg-white/5 text-white text-xs font-semibold uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>All My Bookings</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* FOOTER ACTIONS */}
        {step !== 4 && (
          <div className="p-6 border-t border-white/10 bg-black/40 flex items-center justify-between">
            {step === 1 && (
              <>
                <div className="text-left">
                  <span className="text-[10px] uppercase text-[#9a9a9a] block">Offering Rate</span>
                  <span className="text-xl font-bold text-white">₹{(offering.price_inr || 0).toLocaleString()}</span>
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
                  <span>Continue to Payment</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </>
            )}

            {step === 2 && (
              <>
                <button
                  type="button"
                  onClick={async () => {
                    if (lockId) await AvailabilityService.releaseLock(lockId).catch(() => undefined);
                    setLockId(null);
                    setStep(1);
                  }}
                  className="text-xs uppercase tracking-wider text-[#9a9a9a] hover:text-white"
                >
                  ← Change Time Slot
                </button>
                <button
                  type="button"
                  onClick={handleExecuteBookingRequest}
                  className="px-8 py-3.5 rounded-full bg-[#15846e] hover:bg-[#12705e] text-white text-xs font-semibold uppercase tracking-wider flex items-center gap-2 transition-all shadow-lg shadow-[#15846e]/30"
                >
                  <span>Review Booking</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </>
            )}

            {step === 3 && (
              <>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="text-xs uppercase tracking-wider text-[#9a9a9a] hover:text-white"
                >
                  ← Edit Payment
                </button>
                <button
                  type="button"
                  onClick={handleExecuteBookingRequest}
                  disabled={isProcessingPayment}
                  className="px-8 py-3.5 rounded-full bg-[#15846e] hover:bg-[#12705e] text-white text-xs font-semibold uppercase tracking-wider flex items-center gap-2 transition-all shadow-lg shadow-[#15846e]/30"
                >
                  {isProcessingPayment ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Submitting…</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Authorize & Submit Request</span>
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

const Row: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex justify-between text-[#bdbdbd]">
    <span>{label}:</span>
    <span className="text-white font-medium text-right max-w-[60%]">{value}</span>
  </div>
);
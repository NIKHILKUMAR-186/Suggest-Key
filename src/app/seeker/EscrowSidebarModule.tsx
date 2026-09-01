import React, { useState } from 'react';
import { ShieldCheck, ExternalLink, X } from 'lucide-react';

interface EscrowSidebarModuleProps {
  collapsed: boolean;
}

export const EscrowSidebarModule: React.FC<EscrowSidebarModuleProps> = ({ collapsed }) => {
  const [showEscrowModal, setShowEscrowModal] = useState<boolean>(false);
  const [hoveredTooltip, setHoveredTooltip] = useState<string | null>(null);

  if (collapsed) {
    return (
      <>
        <div
          className="relative flex justify-center"
          onMouseEnter={() => setHoveredTooltip('escrow')}
          onMouseLeave={() => setHoveredTooltip(null)}
        >
          <button
            onClick={() => setShowEscrowModal(true)}
            className="w-11 h-11 rounded-xl bg-white/[0.02] hover:bg-[#15846e]/10 border border-white/[0.08] hover:border-[#15846e]/30 flex items-center justify-center text-[#15846e] transition-all"
            aria-label="Verified Escrow Protection"
          >
            <ShieldCheck className="w-5 h-5" />
          </button>
          {hoveredTooltip === 'escrow' && (
            <div
              role="tooltip"
              className="absolute left-full ml-3 bottom-0 z-50 p-2.5 w-48 rounded-xl bg-[#131317] border border-white/15 text-xs text-white shadow-2xl space-y-1 animate-in fade-in duration-100"
            >
              <div className="flex items-center gap-1.5 text-[#15846e] font-semibold text-xs">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Verified Escrow</span>
              </div>
              <p className="text-[10px] text-[#a1a1aa] leading-tight">
                Protected transactions & dispute freeze protection.
              </p>
            </div>
          )}
        </div>
        {showEscrowModal && <EscrowModal onClose={() => setShowEscrowModal(false)} />}
      </>
    );
  }

  return (
    <>
      <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.07] hover:border-white/15 transition-all space-y-1.5 group">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-[#15846e]/15 border border-[#15846e]/30 flex items-center justify-center">
              <ShieldCheck className="w-3.5 h-3.5 text-[#15846e]" />
            </div>
            <span className="text-xs font-semibold text-white tracking-tight">
              Verified Escrow
            </span>
          </div>
          <span className="w-1.5 h-1.5 rounded-full bg-[#15846e] animate-pulse" />
        </div>
        <p className="text-[10px] text-[#71717a] leading-tight">
          Protected transactions
        </p>
        <button
          onClick={() => setShowEscrowModal(true)}
          className="text-[10px] text-[#15846e] hover:text-[#19a589] font-medium flex items-center gap-1 transition-colors pt-0.5"
        >
          <span>Learn more</span>
          <ExternalLink className="w-2.5 h-2.5" />
        </button>
      </div>
      {showEscrowModal && <EscrowModal onClose={() => setShowEscrowModal(false)} />}
    </>
  );
};

const EscrowModal: React.FC<{ onClose: () => void }> = ({ onClose }) => (
  <div
    role="dialog"
    aria-modal="true"
    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150"
  >
    <div className="relative w-full max-w-md bg-[#0e0e12] border border-white/15 rounded-3xl p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#15846e]/20 border border-[#15846e]/30 flex items-center justify-center text-[#15846e]">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">Suggest Key Escrow Trust</h3>
            <span className="text-[10px] uppercase tracking-wider text-[#15846e] font-medium">
              Protection Guarantee
            </span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-[#8e8e93] hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="space-y-3 text-xs text-[#9a9a9a] leading-relaxed">
        <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 space-y-1">
          <span className="text-white font-medium block">1. Milestone Lock</span>
          <p>Funds are secured in escrow upon booking and held until the session concludes.</p>
        </div>
        <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 space-y-1">
          <span className="text-white font-medium block">2. Dispute Freeze Authority</span>
          <p>If an advisor misses the session or fails to provide the agreed guidance, you can dispute and get an automatic refund.</p>
        </div>
        <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 space-y-1">
          <span className="text-white font-medium block">3. Privacy Shield Guarantee</span>
          <p>Your real identity and payment details are never exposed directly to the advisor.</p>
        </div>
      </div>
      <button
        onClick={onClose}
        className="w-full py-2.5 rounded-full bg-[#15846e] hover:bg-[#12705e] text-white text-xs font-semibold uppercase tracking-wider transition-colors shadow-sm"
      >
        Understood
      </button>
    </div>
  </div>
);

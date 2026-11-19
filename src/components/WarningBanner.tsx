import React, { useState } from 'react';
import { Sparkles, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useModalActions } from '../context/DashboardContext';

export const WarningBanner: React.FC = React.memo(() => {
  const [isVisible, setIsVisible] = useState(true);
  const { setActiveModal } = useModalActions();

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -10, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="w-full min-h-[60px] bg-gradient-to-r from-[#23324D] via-[#1F2B41] to-[#1C2436] border border-white/[0.08] rounded-[22px] px-4 py-3 shadow-[0_10px_25px_rgba(0,0,0,0.25)] backdrop-blur-md flex items-center justify-between gap-3 text-white relative overflow-hidden group"
        >
          {/* Gentle background glow */}
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#5EA8FF]/15 rounded-full blur-2xl pointer-events-none animate-pulse [transform:translateZ(0)]" />
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-[#35D07F]/15 rounded-full blur-2xl pointer-events-none [transform:translateZ(0)]" />

          {/* Left / Right Content in RTL: Sparkles + Title + Subtitle */}
          <div className="flex items-center gap-3 min-w-0 z-10">
            {/* ✨ Large Sparkles Icon Container with soft glow */}
            <div className="w-10 h-10 bg-[#232D42] border border-white/[0.12] rounded-2xl flex items-center justify-center shrink-0 shadow-md relative">
              <Sparkles className="w-5 h-5 text-white stroke-[2] icon-white-glow drop-shadow-[0_0_8px_rgba(94,168,255,0.7)]" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#35D07F] rounded-full animate-ping" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#35D07F] rounded-full" />
            </div>

            {/* Text details */}
            <div className="flex flex-col text-right min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white tracking-tight flex items-center gap-1">
                  ✨ دستیار هوشمند AI
                </span>
              </div>
              <p className="text-[11px] sm:text-[12px] text-[#BBC1D1] leading-tight truncate mt-0.5">
                هوش مصنوعی اطلاعیه‌ها، پیشنهادها و پیام‌های مهم سامانه را به‌صورت هوشمند نمایش می‌دهد.
              </p>
            </div>
          </div>

          {/* Action button: مشاهده (#35D07F) & Close */}
          <div className="flex items-center gap-2 shrink-0 z-10">
            <button
              onClick={() => setActiveModal('sparkles')}
              className="bg-[#35D07F] hover:bg-[#35D07F]/90 text-white rounded-full font-bold px-4 py-1.5 text-xs transition-all shadow-[0_0_15px_rgba(53,208,127,0.3)] hover:scale-[1.03] active:scale-[0.97] cursor-pointer flex items-center gap-1.5"
            >
              <span>مشاهده</span>
            </button>

            <button
              onClick={() => setIsVisible(false)}
              aria-label="بستن اطلاعیه"
              className="p-1.5 rounded-xl text-[#BBC1D1] hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4 text-white stroke-[2] icon-white-glow" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});




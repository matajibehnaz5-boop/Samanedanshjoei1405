import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, RotateCcw, AlertCircle } from 'lucide-react';
import { useDashboard } from '../../context/DashboardContext';

export const CloseConfirmModal: React.FC = () => {
  const { activeModal, closeModal, showToast, handleLogout } = useDashboard();

  if (activeModal !== 'close_confirm') return null;

  return (
    <AnimatePresence>
      <div
        dir="rtl"
        data-modal-backdrop
        onClick={(e) => {
          if (e.target === e.currentTarget) closeModal();
        }}
        className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-sm"
      >
        <motion.div
          role="dialog"
          aria-modal="true"
          data-modal-panel
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="w-full max-w-sm bg-[#1E293B] border border-slate-700/80 rounded-2xl shadow-2xl text-slate-100 text-center flex flex-col max-h-[calc(var(--vvh,100dvh)-16px)] max-w-[calc(100vw-16px)] overflow-hidden"
        >
          <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-5 sm:p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center mx-auto">
              <AlertCircle className="w-7 h-7" />
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-100">بستن / بازنشانی پنل</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                آیا می‌خواهید پنل دانشجویی را به حالت اولیه بازگردانید؟
              </p>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 px-5 pb-5 pt-2 sm:px-6 sm:pb-6 shrink-0">
            <button
              type="button"
              onClick={closeModal}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              انصراف
            </button>

            <button
              type="button"
              onClick={() => {
                handleLogout();
                showToast('سامانه به وضعیت اولیه بازگشت');
                closeModal();
              }}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>بازنشانی</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

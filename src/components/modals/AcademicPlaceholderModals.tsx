import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  FolderKanban,
  Megaphone,
  X,
  Clock,
} from 'lucide-react';
import { useDashboard } from '../../context/DashboardContext';

const PLACEHOLDER_MODAL_CONFIG: Record<string, { title: string; icon: React.ReactNode }> = {
  thesis_affairs: {
    title: 'امور پایان‌نامه‌ها',
    icon: <FolderKanban className="w-6 h-6" />,
  },
  public_announcements: {
    title: 'اعلانات عمومی',
    icon: <Megaphone className="w-6 h-6" />,
  },
};

export const AcademicPlaceholderModals: React.FC = () => {
  const { activeModal, closeModal } = useDashboard();

  const modalConfig = activeModal ? PLACEHOLDER_MODAL_CONFIG[activeModal] : undefined;

  if (!modalConfig) return null;

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
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          className="w-full max-w-md bg-[#1E293B] border border-slate-700/80 rounded-[28px] shadow-2xl text-slate-100 flex flex-col max-h-[calc(var(--vvh,100dvh)-16px)] max-w-[calc(100vw-16px)] overflow-hidden"
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between px-5 pt-5 pb-4 sm:px-6 sm:pt-6 sm:pb-4 border-b border-slate-700/60 shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-600/20 text-indigo-400 rounded-xl border border-indigo-500/30">
                {modalConfig.icon}
              </div>
              <h2 className="text-lg font-bold text-slate-100">{modalConfig.title}</h2>
            </div>
            <button
              type="button"
              onClick={closeModal}
              className="p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-5 py-8 sm:px-6 flex flex-col items-center justify-center text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-900/80 border border-slate-700/70 flex items-center justify-center text-indigo-400">
              <Clock className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-200">
              این بخش به‌زودی فعال می‌شود
            </p>
          </div>

          {/* Footer Close Button */}
          <div className="px-5 pb-5 pt-4 sm:px-6 sm:pb-6 border-t border-slate-700/60 flex justify-end shrink-0">
            <button
              type="button"
              onClick={closeModal}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              بستن
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

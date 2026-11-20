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
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 pb-[12vh] sm:pb-[8vh] bg-slate-950/80 backdrop-blur-sm"
      >
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          className="w-full max-w-md bg-[#1E293B] border border-slate-700/80 rounded-[28px] p-6 shadow-2xl text-slate-100 max-h-[85dvh] overflow-y-auto"
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-700/60">
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
          <div className="py-8 flex flex-col items-center justify-center text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-900/80 border border-slate-700/70 flex items-center justify-center text-indigo-400">
              <Clock className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-200">
              این بخش به‌زودی فعال می‌شود
            </p>
          </div>

          {/* Footer Close Button */}
          <div className="pt-4 border-t border-slate-700/60 flex justify-end">
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

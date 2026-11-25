import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2 } from 'lucide-react';
import { useToastState } from '../../context/DashboardContext';

export const Toast: React.FC = React.memo(() => {
  const { toastMessage } = useToastState();

  return (
    <AnimatePresence>
      {toastMessage && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 bg-[var(--surface-toast)] text-[var(--text)] rounded-2xl border border-[var(--border)] shadow-2xl backdrop-blur-md flex items-center gap-3 text-sm font-medium will-change-transform [transform:translateZ(0)]"
        >
          <CheckCircle2 className="w-5 h-5 text-[var(--status-green-text)] shrink-0" />
          <span>{toastMessage}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

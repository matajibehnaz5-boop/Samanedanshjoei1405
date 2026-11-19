import React from 'react';
import { motion } from 'motion/react';

export const Footer: React.FC = React.memo(() => {
  return (
    <motion.footer
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="w-full py-1.5 sm:py-3 text-center mt-auto [content-visibility:auto] [contain-intrinsic-size:auto_44px]"
    >
      <p className="text-[#B8C1D1] text-xs sm:text-sm font-medium tracking-wide">
        نسخه: v2.0
      </p>
    </motion.footer>
  );
});


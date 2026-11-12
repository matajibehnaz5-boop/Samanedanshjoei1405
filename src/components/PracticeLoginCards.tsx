import React, { useState } from 'react';
import { ShieldCheck, UserCheck, GraduationCap, KeyRound, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useDashboard } from '../context/DashboardContext';

interface RippleEffect {
  id: number;
  x: number;
  y: number;
  size: number;
}

export const PracticeLoginCards: React.FC = () => {
  const { setActiveModal, t, language } = useDashboard();
  const [ssoRipples, setSsoRipples] = useState<RippleEffect[]>([]);
  const [formRipples, setFormRipples] = useState<RippleEffect[]>([]);

  const handleRipple = (
    e: React.MouseEvent<HTMLButtonElement>,
    setRipples: React.Dispatch<React.SetStateAction<RippleEffect[]>>
  ) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 2;
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;

    const newRipple = {
      id: Date.now() + Math.random(),
      x,
      y,
      size,
    };

    setRipples((prev) => [...prev, newRipple]);
  };

  const removeRipple = (
    id: number,
    setRipples: React.Dispatch<React.SetStateAction<RippleEffect[]>>
  ) => {
    setRipples((prev) => prev.filter((r) => r.id !== id));
  };

  return (
    <div className="w-full max-w-xl mx-auto my-auto flex flex-col items-center justify-center py-2 sm:py-4">
      {/* 1. System Emblem / Logo */}
      <motion.div
        initial={{ opacity: 0, scale: 0.85, y: -12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="relative group mb-4 sm:mb-5"
      >
        <div className="absolute -inset-2 rounded-full bg-gradient-to-r from-primary/30 via-secondary/30 to-accent/30 blur-xl opacity-75 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl flex items-center justify-center text-white ring-4 ring-white/10">
          <GraduationCap className="w-8 h-8 sm:w-10 sm:h-10 text-secondary stroke-[2] icon-white-glow" />
        </div>
      </motion.div>

      {/* 2. Intro Title & Guidance Subtitle */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
        className="text-center mb-6 sm:mb-8 px-2"
      >
        <h2 className="text-lg sm:text-xl md:text-2xl font-extrabold text-white tracking-tight leading-snug">
          {language === 'fa' ? 'لطفاً روش ورود خود را انتخاب کنید' : 'Please select your login method'}
        </h2>
        <p className="text-xs sm:text-sm text-white/70 font-normal mt-2 max-w-sm mx-auto leading-relaxed">
          {language === 'fa' 
            ? 'جهت ورود به سامانه، یکی از درگاه‌های زیر را انتخاب نمایید' 
            : 'Select one of the portals below to log in'}
        </p>
      </motion.div>

      {/* 3. Login Cards Grid */}
      <div 
        className="grid grid-cols-2 gap-4 sm:gap-6 w-full justify-center items-center"
      >
        {/* RIGHT CARD in RTL: SSO Login */}
        <motion.button
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.22, ease: [0.16, 1, 0.3, 1] }}
          whileHover={{ scale: 1.025, y: -3 }}
          whileTap={{ scale: 0.98 }}
          onClick={(e) => {
            handleRipple(e, setSsoRipples);
            setActiveModal('sso');
          }}
          className="group relative w-full rounded-3xl p-5 sm:p-7 min-h-[170px] flex flex-col items-center justify-center gap-3 text-center cursor-pointer overflow-hidden bg-white/10 backdrop-blur-md border border-white/15 shadow-xl hover:shadow-2xl hover:border-white/30 transition-all duration-300"
        >
          {/* M3 Ripple Effects */}
          <AnimatePresence>
            {ssoRipples.map((ripple) => (
              <motion.span
                key={ripple.id}
                initial={{ scale: 0, opacity: 0.35 }}
                animate={{ scale: 1, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.55, ease: 'easeOut' }}
                onAnimationComplete={() => removeRipple(ripple.id, setSsoRipples)}
                style={{
                  position: 'absolute',
                  top: ripple.y,
                  left: ripple.x,
                  width: ripple.size,
                  height: ripple.size,
                  borderRadius: '50%',
                  backgroundColor: 'rgba(0, 168, 150, 0.35)',
                  pointerEvents: 'none',
                }}
              />
            ))}
          </AnimatePresence>

          {/* Subtle ambient radial gradient behind glass */}
          <div className="absolute -top-8 -right-8 w-32 h-32 bg-secondary/20 rounded-full blur-2xl pointer-events-none" />

          {/* Hover accent highlight */}
          <div className="absolute inset-0 bg-gradient-to-br from-secondary/15 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

          {/* Icon container */}
          <div className="w-12 h-12 sm:w-13 sm:h-13 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-300 relative z-10">
            <ShieldCheck className="w-6 h-6 text-secondary stroke-[2] icon-white-glow" />
          </div>

          {/* Title & Subtitle */}
          <div className="flex flex-col items-center gap-0.5 relative z-10">
            <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-secondary transition-colors leading-tight">
              {t('ssoLoginShort')}
            </h3>
            <span className="text-[11px] text-white/70 font-medium leading-tight">
              {t('ssoSub')}
            </span>
          </div>

          {/* Rounded Pill Badge */}
          <div className="mt-0.5 px-3 py-0.5 bg-secondary-container text-secondary rounded-full text-[11px] font-semibold border border-secondary/30 flex items-center gap-1.5 relative z-10 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
            {t('ssoPill')}
          </div>
        </motion.button>

        {/* LEFT CARD: Form Login */}
        <motion.button
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.32, ease: [0.16, 1, 0.3, 1] }}
          whileHover={{ scale: 1.025, y: -3 }}
          whileTap={{ scale: 0.98 }}
          onClick={(e) => {
            handleRipple(e, setFormRipples);
            setActiveModal('form_login');
          }}
          className="group relative w-full rounded-3xl p-5 sm:p-7 min-h-[170px] flex flex-col items-center justify-center gap-3 text-center cursor-pointer overflow-hidden bg-white/10 backdrop-blur-md border border-white/15 shadow-xl hover:shadow-2xl hover:border-white/30 transition-all duration-300"
        >
          {/* M3 Ripple Effects */}
          <AnimatePresence>
            {formRipples.map((ripple) => (
              <motion.span
                key={ripple.id}
                initial={{ scale: 0, opacity: 0.35 }}
                animate={{ scale: 1, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.55, ease: 'easeOut' }}
                onAnimationComplete={() => removeRipple(ripple.id, setFormRipples)}
                style={{
                  position: 'absolute',
                  top: ripple.y,
                  left: ripple.x,
                  width: ripple.size,
                  height: ripple.size,
                  borderRadius: '50%',
                  backgroundColor: 'rgba(103, 80, 164, 0.35)',
                  pointerEvents: 'none',
                }}
              />
            ))}
          </AnimatePresence>

          {/* Subtle ambient radial gradient behind glass */}
          <div className="absolute -top-8 -right-8 w-32 h-32 bg-primary/20 rounded-full blur-2xl pointer-events-none" />

          {/* Hover accent highlight */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

          {/* Icon container */}
          <div className="w-12 h-12 sm:w-13 sm:h-13 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-300 relative z-10">
            <UserCheck className="w-6 h-6 text-primary stroke-[2] icon-white-glow" />
          </div>

          {/* Title & Subtitle */}
          <div className="flex flex-col items-center gap-0.5 relative z-10">
            <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-primary transition-colors leading-tight">
              {t('formLoginShort')}
            </h3>
            <span className="text-[11px] text-white/70 font-medium leading-tight">
              {t('formSub')}
            </span>
          </div>

          {/* Rounded Pill Badge */}
          <div className="mt-0.5 px-3 py-0.5 bg-primary-container text-on-primary rounded-full text-[11px] font-semibold border border-primary/30 flex items-center gap-1.5 relative z-10 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            {t('formPill')}
          </div>
        </motion.button>
      </div>

      {/* 4. Helper Links Below Login Cards */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.42, ease: [0.16, 1, 0.3, 1] }}
        className="mt-4 sm:mt-5 flex items-center justify-center gap-3 text-xs sm:text-sm text-white/60 font-medium"
      >
        <button
          onClick={() => setActiveModal('form_login')}
          className="hover:text-white transition-colors cursor-pointer flex items-center gap-1"
        >
          <KeyRound className="w-3.5 h-3.5 opacity-80" />
          <span>{language === 'fa' ? 'فراموشی رمز عبور؟' : 'Forgot Password?'}</span>
        </button>

        <span className="text-white/30 select-none">•</span>

        <button
          onClick={() => setActiveModal('sso')}
          className="hover:text-white transition-colors cursor-pointer flex items-center gap-1"
        >
          <HelpCircle className="w-3.5 h-3.5 opacity-80" />
          <span>{language === 'fa' ? 'راهنمای ورود' : 'Login Guide'}</span>
        </button>
      </motion.div>
    </div>
  );
};





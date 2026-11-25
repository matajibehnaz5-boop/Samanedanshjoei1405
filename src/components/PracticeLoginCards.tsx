import React, { useState, useCallback } from 'react';
import { ShieldCheck, UserCheck, GraduationCap, KeyRound, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useI18n, useModalActions } from '../context/DashboardContext';

interface RippleEffect {
  id: number;
  x: number;
  y: number;
  size: number;
}

export const PracticeLoginCards: React.FC = React.memo(() => {
  const { setActiveModal } = useModalActions();
  const { t, language } = useI18n();
  const [ssoRipples, setSsoRipples] = useState<RippleEffect[]>([]);
  const [formRipples, setFormRipples] = useState<RippleEffect[]>([]);

  const handleRipple = useCallback((
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
  }, []);

  const removeRipple = useCallback((
    id: number,
    setRipples: React.Dispatch<React.SetStateAction<RippleEffect[]>>
  ) => {
    setRipples((prev) => prev.filter((r) => r.id !== id));
  }, []);

  return (
    <div className="w-full max-w-xl mx-auto my-auto flex flex-col items-center justify-center py-2 sm:py-4">
      {/* 1. System Emblem / Logo */}
      <motion.div
        initial={{ opacity: 0, scale: 0.85, y: -12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="relative group mb-3 sm:mb-5"
      >
        <div className="absolute -inset-2 rounded-full bg-[image:var(--login-emblem-glow)] blur-xl opacity-75 group-hover:opacity-100 transition-opacity duration-500 [transform:translateZ(0)]" />
        <div className="relative w-12 h-12 sm:w-20 sm:h-20 rounded-full bg-[var(--login-icon-box-bg)] backdrop-blur-xl border border-[var(--login-icon-box-border)] shadow-2xl flex items-center justify-center ring-4 ring-[var(--border-subtle)]">
          <GraduationCap className="w-6 h-6 sm:w-10 sm:h-10 text-[var(--login-emblem-icon)] stroke-[2]" />
        </div>
      </motion.div>

      {/* 2. Intro Title & Guidance Subtitle */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
        className="text-center mb-4 sm:mb-8 px-1.5 sm:px-2"
      >
        <h2 className="text-base sm:text-xl md:text-2xl font-extrabold text-[var(--text)] tracking-tight leading-snug">
          {language === 'fa' ? 'لطفاً روش ورود خود را انتخاب کنید' : 'Please select your login method'}
        </h2>
        <p className="text-[11px] sm:text-sm text-[var(--text-2)] font-normal mt-1 sm:mt-2 max-w-sm mx-auto leading-relaxed">
          {language === 'fa' 
            ? 'جهت ورود به سامانه، یکی از درگاه‌های زیر را انتخاب نمایید' 
            : 'Select one of the portals below to log in'}
        </p>
      </motion.div>

      {/* 3. Login Cards Grid */}
      <div 
        className="grid grid-cols-2 gap-2.5 sm:gap-6 w-full justify-center items-center"
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
          className="group relative w-full rounded-xl sm:rounded-3xl p-3 sm:p-7 min-h-[126px] sm:min-h-[170px] flex flex-col items-center justify-center gap-2 sm:gap-3 text-center cursor-pointer overflow-hidden bg-[var(--login-card-bg)] backdrop-blur-md border border-[var(--border)] shadow-[var(--card-shadow)] hover:shadow-2xl hover:border-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] transition-all duration-300"
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
                  backgroundColor: 'var(--ripple-sso)',
                  pointerEvents: 'none',
                }}
              />
            ))}
          </AnimatePresence>

          {/* Subtle ambient radial gradient behind card */}
          <div className="absolute -top-8 -right-8 w-32 h-32 bg-[var(--login-sso-blob)] rounded-full blur-2xl pointer-events-none [transform:translateZ(0)]" />

          {/* Hover accent highlight */}
          <div className="absolute inset-0 bg-[image:var(--login-sso-hover)] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

          {/* Icon container */}
          <div className="w-10 h-10 sm:w-13 sm:h-13 rounded-xl sm:rounded-2xl bg-[var(--login-icon-box-bg)] border border-[var(--login-icon-box-border)] flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-300 relative z-10">
            <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 text-[var(--login-sso-icon)] stroke-[2]" />
          </div>

          {/* Title & Subtitle */}
          <div className="flex flex-col items-center gap-0.5 relative z-10">
            <h3 className="text-sm sm:text-base font-bold text-[var(--text)] group-hover:text-[var(--login-sso-hover-title)] transition-colors leading-tight">
              {t('ssoLoginShort')}
            </h3>
            <span className="text-[11px] text-[var(--text-2)] font-medium leading-tight">
              {t('ssoSub')}
            </span>
          </div>

          {/* Rounded Pill Badge */}
          <div className="mt-0.5 px-2.5 py-0.5 sm:px-3 bg-[var(--login-sso-chip-bg)] text-[var(--login-sso-chip-text)] rounded-full text-[10px] sm:text-[11px] font-semibold border border-[var(--login-sso-chip-border)] flex items-center gap-1 sm:gap-1.5 relative z-10 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--login-sso-chip-dot)] animate-pulse" />
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
          className="group relative w-full rounded-xl sm:rounded-3xl p-3 sm:p-7 min-h-[126px] sm:min-h-[170px] flex flex-col items-center justify-center gap-2 sm:gap-3 text-center cursor-pointer overflow-hidden bg-[var(--login-card-bg)] backdrop-blur-md border border-[var(--border)] shadow-[var(--card-shadow)] hover:shadow-2xl hover:border-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] transition-all duration-300"
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
                  backgroundColor: 'var(--ripple-form)',
                  pointerEvents: 'none',
                }}
              />
            ))}
          </AnimatePresence>

          {/* Subtle ambient radial gradient behind card */}
          <div className="absolute -top-8 -right-8 w-32 h-32 bg-[var(--login-form-blob)] rounded-full blur-2xl pointer-events-none [transform:translateZ(0)]" />

          {/* Hover accent highlight */}
          <div className="absolute inset-0 bg-[image:var(--login-form-hover)] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

          {/* Icon container */}
          <div className="w-10 h-10 sm:w-13 sm:h-13 rounded-xl sm:rounded-2xl bg-[var(--login-icon-box-bg)] border border-[var(--login-icon-box-border)] flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-300 relative z-10">
            <UserCheck className="w-5 h-5 sm:w-6 sm:h-6 text-[var(--login-form-icon)] stroke-[2]" />
          </div>

          {/* Title & Subtitle */}
          <div className="flex flex-col items-center gap-0.5 relative z-10">
            <h3 className="text-sm sm:text-base font-bold text-[var(--text)] group-hover:text-[var(--login-form-hover-title)] transition-colors leading-tight">
              {t('formLoginShort')}
            </h3>
            <span className="text-[11px] text-[var(--text-2)] font-medium leading-tight">
              {t('formSub')}
            </span>
          </div>

          {/* Rounded Pill Badge */}
          <div className="mt-0.5 px-2.5 py-0.5 sm:px-3 bg-[var(--login-form-chip-bg)] text-[var(--login-form-chip-text)] rounded-full text-[10px] sm:text-[11px] font-semibold border border-[var(--login-form-chip-border)] flex items-center gap-1 sm:gap-1.5 relative z-10 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--login-form-chip-dot)]" />
            {t('formPill')}
          </div>
        </motion.button>
      </div>

      {/* 4. Helper Links Below Login Cards */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.42, ease: [0.16, 1, 0.3, 1] }}
        className="mt-3 sm:mt-5 flex items-center justify-center gap-2.5 sm:gap-3 text-xs sm:text-sm font-medium"
      >
        <button
          type="button"
          onClick={() => setActiveModal('forgot_password')}
          className="min-h-[32px] sm:min-h-0 px-2 py-1 rounded-lg text-[var(--link-color)] hover:text-[var(--link-hover)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] transition-colors cursor-pointer flex items-center gap-1"
        >
          <KeyRound className="w-3.5 h-3.5" />
          <span>{language === 'fa' ? 'فراموشی رمز عبور؟' : 'Forgot Password?'}</span>
        </button>

        <span className="text-[var(--text-muted)] select-none">•</span>

        <button
          type="button"
          onClick={() => setActiveModal('login_guide')}
          className="min-h-[32px] sm:min-h-0 px-2 py-1 rounded-lg text-[var(--link-color)] hover:text-[var(--link-hover)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] transition-colors cursor-pointer flex items-center gap-1"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>{language === 'fa' ? 'راهنمای ورود' : 'Login Guide'}</span>
        </button>
      </motion.div>
    </div>
  );
});





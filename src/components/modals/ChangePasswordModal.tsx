import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, X, Eye, EyeOff, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { useDashboard } from '../../context/DashboardContext';

export const ChangePasswordModal: React.FC = () => {
  const { activeModal, closeModal, showToast, language, changePassword } = useDashboard();
  const isFa = language === 'fa';

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const [touched, setTouched] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  });

  const [errors, setErrors] = useState<{
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
  }>({});

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (activeModal === 'change_password') {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowCurrentPass(false);
      setShowNewPass(false);
      setShowConfirmPass(false);
      setTouched({ currentPassword: false, newPassword: false, confirmPassword: false });
      setErrors({});
      setIsSubmitting(false);
    }
  }, [activeModal]);

  // Real-time validation logic
  useEffect(() => {
    if (activeModal !== 'change_password') return;

    const newErrs: {
      currentPassword?: string;
      newPassword?: string;
      confirmPassword?: string;
    } = {};

    // Current Password check
    if (touched.currentPassword) {
      if (!currentPassword.trim()) {
        newErrs.currentPassword = isFa 
          ? 'لطفاً رمز عبور فعلی را وارد کنید' 
          : 'Please enter current password';
      }
    }

    // New Password check
    if (touched.newPassword) {
      if (!newPassword) {
        newErrs.newPassword = isFa 
          ? 'لطفاً رمز عبور جدید را وارد کنید' 
          : 'Please enter new password';
      } else {
        const hasLetter = /[\p{L}a-zA-Z]/u.test(newPassword);
        const hasDigit = /[0-9]/.test(newPassword);
        if (newPassword.length < 8 || !hasLetter || !hasDigit) {
          newErrs.newPassword = isFa 
            ? 'رمز عبور جدید باید حداقل ۸ کاراکتر و شامل حرف و عدد باشد' 
            : 'New password must be at least 8 chars with letters & numbers';
        } else if (currentPassword && newPassword === currentPassword) {
          newErrs.newPassword = isFa 
            ? 'رمز عبور جدید نباید با رمز عبور فعلی یکسان باشد' 
            : 'New password must not be identical to current password';
        }
      }
    }

    // Confirm Password check
    if (touched.confirmPassword) {
      if (!confirmPassword) {
        newErrs.confirmPassword = isFa 
          ? 'لطفاً تکرار رمز عبور جدید را وارد کنید' 
          : 'Please confirm new password';
      } else if (newPassword && confirmPassword !== newPassword) {
        newErrs.confirmPassword = isFa 
          ? 'رمز عبور جدید و تکرار آن یکسان نیستند' 
          : 'Passwords do not match';
      }
    }

    setErrors(newErrs);
  }, [currentPassword, newPassword, confirmPassword, touched, isFa, activeModal]);

  if (activeModal !== 'change_password') return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Mark all as touched to trigger full validation display
    setTouched({
      currentPassword: true,
      newPassword: true,
      confirmPassword: true,
    });

    const submitErrors: {
      currentPassword?: string;
      newPassword?: string;
      confirmPassword?: string;
    } = {};

    if (!currentPassword.trim()) {
      submitErrors.currentPassword = isFa 
        ? 'لطفاً رمز عبور فعلی را وارد کنید' 
        : 'Please enter current password';
    }

    if (!newPassword) {
      submitErrors.newPassword = isFa 
        ? 'لطفاً رمز عبور جدید را وارد کنید' 
        : 'Please enter new password';
    } else {
      const hasLetter = /[\p{L}a-zA-Z]/u.test(newPassword);
      const hasDigit = /[0-9]/.test(newPassword);
      if (newPassword.length < 8 || !hasLetter || !hasDigit) {
        submitErrors.newPassword = isFa 
          ? 'رمز عبور جدید باید حداقل ۸ کاراکتر و شامل حرف و عدد باشد' 
          : 'New password must be at least 8 chars with letters & numbers';
      } else if (currentPassword && newPassword === currentPassword) {
        submitErrors.newPassword = isFa 
          ? 'رمز عبور جدید نباید با رمز عبور فعلی یکسان باشد' 
          : 'New password must not be identical to current password';
      }
    }

    if (!confirmPassword) {
      submitErrors.confirmPassword = isFa 
        ? 'لطفاً تکرار رمز عبور جدید را وارد کنید' 
        : 'Please confirm new password';
    } else if (newPassword && confirmPassword !== newPassword) {
      submitErrors.confirmPassword = isFa 
        ? 'رمز عبور جدید و تکرار آن یکسان نیستند' 
        : 'Passwords do not match';
    }

    setErrors(submitErrors);

    if (Object.keys(submitErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    (async () => {
      try {
        if (changePassword) {
          await changePassword(currentPassword, newPassword);
        }
        showToast(isFa ? 'رمز عبور با موفقیت تغییر کرد' : 'Password changed successfully');
        closeModal();
      } catch (err: any) {
        const errorText = err.message || (isFa ? 'رمز عبور فعلی نامعتبر است' : 'Invalid current password');
        setErrors((prev) => ({
          ...prev,
          currentPassword: errorText,
        }));
        showToast(errorText);
      } finally {
        setIsSubmitting(false);
      }
    })();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-[#0F172A]/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.95 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="w-full max-w-lg bg-[#1C2436] border border-white/[0.08] rounded-t-[30px] sm:rounded-[30px] p-6 shadow-2xl text-white max-h-[90vh] overflow-y-auto"
          dir={isFa ? 'rtl' : 'ltr'}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#232D42] rounded-2xl border border-white/[0.08] flex items-center justify-center shrink-0">
                <Lock className="w-5 h-5 text-[#818CF8] stroke-[2] icon-white-glow" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">
                  {isFa ? 'تغییر رمز عبور' : 'Change Password'}
                </h2>
                <p className="text-xs text-[#BBC1D1]">
                  {isFa ? 'بروزرسانی و ارتقای امنیت حساب کاربری' : 'Update & strengthen account security'}
                </p>
              </div>
            </div>
            <button
              onClick={closeModal}
              className="p-2 rounded-full hover:bg-white/10 text-[#BBC1D1] hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5 text-white stroke-[2]" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="mt-5 space-y-4" noValidate>
            {/* Field 1: Current Password */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#BBC1D1]">
                {isFa ? 'رمز عبور فعلی' : 'Current Password'}
              </label>
              <div className="relative">
                <input
                  type={showCurrentPass ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => {
                    setCurrentPassword(e.target.value);
                    setTouched((prev) => ({ ...prev, currentPassword: true }));
                  }}
                  onBlur={() => setTouched((prev) => ({ ...prev, currentPassword: true }))}
                  placeholder={isFa ? 'رمز عبور فعلی خود را وارد کنید' : 'Enter your current password'}
                  className={`w-full bg-[#232D42] border ${
                    errors.currentPassword ? 'border-rose-500/80 focus:border-rose-500' : 'border-white/[0.08] focus:border-[#6366F1]'
                  } text-white placeholder-slate-400/60 rounded-2xl px-4 py-3 text-sm transition-all outline-none pl-11 pr-4`}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPass(!showCurrentPass)}
                  className={`absolute ${isFa ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 p-1 text-[#BBC1D1] hover:text-white transition-colors cursor-pointer`}
                >
                  {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.currentPassword && (
                <p className="text-xs text-rose-400 font-medium pt-0.5 animate-fadeIn">
                  {errors.currentPassword}
                </p>
              )}
            </div>

            {/* Field 2: New Password */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#BBC1D1]">
                {isFa ? 'رمز عبور جدید' : 'New Password'}
              </label>
              <div className="relative">
                <input
                  type={showNewPass ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    setTouched((prev) => ({ ...prev, newPassword: true }));
                  }}
                  onBlur={() => setTouched((prev) => ({ ...prev, newPassword: true }))}
                  placeholder={isFa ? 'حداقل ۸ کاراکتر شامل حرف و عدد' : 'Min 8 chars with letters & numbers'}
                  className={`w-full bg-[#232D42] border ${
                    errors.newPassword ? 'border-rose-500/80 focus:border-rose-500' : 'border-white/[0.08] focus:border-[#6366F1]'
                  } text-white placeholder-slate-400/60 rounded-2xl px-4 py-3 text-sm transition-all outline-none pl-11 pr-4`}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPass(!showNewPass)}
                  className={`absolute ${isFa ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 p-1 text-[#BBC1D1] hover:text-white transition-colors cursor-pointer`}
                >
                  {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.newPassword ? (
                <p className="text-xs text-rose-400 font-medium pt-0.5 animate-fadeIn">
                  {errors.newPassword}
                </p>
              ) : (
                <p className="text-[11px] text-slate-400">
                  {isFa ? 'رمز عبور جدید باید ترکیبی از حروف و اعداد و حداقل ۸ کاراکتر باشد.' : 'Password must be at least 8 characters with letters and numbers.'}
                </p>
              )}
            </div>

            {/* Field 3: Confirm New Password */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#BBC1D1]">
                {isFa ? 'تکرار رمز عبور جدید' : 'Confirm New Password'}
              </label>
              <div className="relative">
                <input
                  type={showConfirmPass ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setTouched((prev) => ({ ...prev, confirmPassword: true }));
                  }}
                  onBlur={() => setTouched((prev) => ({ ...prev, confirmPassword: true }))}
                  placeholder={isFa ? 'رمز عبور جدید را مجدداً وارد کنید' : 'Re-enter your new password'}
                  className={`w-full bg-[#232D42] border ${
                    errors.confirmPassword ? 'border-rose-500/80 focus:border-rose-500' : 'border-white/[0.08] focus:border-[#6366F1]'
                  } text-white placeholder-slate-400/60 rounded-2xl px-4 py-3 text-sm transition-all outline-none pl-11 pr-4`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPass(!showConfirmPass)}
                  className={`absolute ${isFa ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 p-1 text-[#BBC1D1] hover:text-white transition-colors cursor-pointer`}
                >
                  {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-xs text-rose-400 font-medium pt-0.5 animate-fadeIn">
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            {/* Buttons */}
            <div className="pt-4 flex items-center justify-end gap-3 border-t border-white/[0.08]">
              <button
                type="button"
                onClick={closeModal}
                className="px-5 py-3 rounded-2xl bg-[#232D42] hover:bg-[#2e3b56] text-[#BBC1D1] hover:text-white text-xs font-bold border border-white/[0.08] transition-all cursor-pointer"
              >
                {isFa ? 'انصراف' : 'Cancel'}
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 sm:flex-none px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isFa ? 'ثبت تغییرات' : 'Submit Changes'}</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

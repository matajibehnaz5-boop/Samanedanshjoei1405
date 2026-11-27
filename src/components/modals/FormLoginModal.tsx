import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UserCheck, X, Eye, EyeOff, User, Mail, ShieldAlert } from 'lucide-react';
import { useDashboard } from '../../context/DashboardContext';

export const FormLoginModal: React.FC = () => {
  const { activeModal, closeModal, loginWithEmailPass, registerWithEmailPass } = useDashboard();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  if (activeModal !== 'form_login') return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email.trim() || !password.trim()) {
      setErrorMsg('لطفاً ایمیل و رمز عبور را وارد نمایید.');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'login') {
        await loginWithEmailPass(email.trim(), password);
      } else {
        if (!fullName.trim()) {
          setErrorMsg('لطفاً نام و نام خانوادگی را وارد نمایید.');
          setLoading(false);
          return;
        }
        await registerWithEmailPass(email.trim(), password, fullName, studentId);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'خطایی رخ داد.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div
        dir="rtl"
        data-modal-backdrop
        onClick={(e) => {
          if (e.target === e.currentTarget) closeModal();
        }}
        className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center p-2 sm:p-4 bg-[var(--backdrop)] backdrop-blur-md"
      >
        <motion.div
          role="dialog"
          aria-modal="true"
          data-modal-panel
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="w-full max-w-lg bg-[var(--surface-card)] border border-[var(--border)] rounded-[30px] shadow-2xl text-[var(--text)] flex flex-col max-h-[calc(var(--vvh,100dvh)-16px)] max-w-[calc(100vw-16px)] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 pt-4 pb-3 sm:px-6 sm:pt-6 sm:pb-4 border-b border-[var(--border)] shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[var(--surface-2)] rounded-2xl border border-[var(--border)] flex items-center justify-center shrink-0">
                <UserCheck className="w-5 h-5 stroke-[2] icon-white-glow" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-[var(--text)]">
                  {mode === 'login' ? 'ورود به حساب کاربری' : 'ثبت‌نام دانشجوی جدید'}
                </h2>
                <p className="text-xs text-[var(--text-2)]">
                  {mode === 'login' ? 'ورود امن با ایمیل و رمز عبور' : 'ایجاد حساب کاربری جدید در سامانه'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={closeModal}
              aria-label="بستن"
              className="p-2 rounded-full hover:bg-[var(--surface-hover)] text-[var(--text-2)] hover:text-[var(--text)] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5 stroke-[2] icon-white-glow" />
            </button>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="px-4 pt-3 sm:px-6 sm:pt-4 shrink-0">
            <div className="grid grid-cols-2 gap-2 p-1 bg-[var(--surface-2)] rounded-2xl border border-[var(--border)]">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMsg('');
              }}
              className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  mode === 'login'
                    ? 'bg-[var(--accent)] text-[var(--on-accent)] shadow-md'
                    : 'text-[var(--text-2)] hover:text-[var(--text)]'
              }`}
            >
              ورود به حساب
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setErrorMsg('');
              }}
              className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  mode === 'signup'
                    ? 'bg-[var(--accent)] text-[var(--on-accent)] shadow-md'
                    : 'text-[var(--text-2)] hover:text-[var(--text)]'
              }`}
            >
              ثبت‌نام جدید
            </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex-1 min-h-0 flex flex-col overflow-hidden">
            <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-4 py-3 sm:px-6 sm:py-4 space-y-3 sm:space-y-4">
            {mode === 'signup' && (
              <>
                {/* Full Name */}
                <div>
                  <label className="text-[11px] sm:text-xs font-semibold text-[var(--text-2)] block mb-1 sm:mb-1.5">
                    نام و نام خانوادگی:
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="نام کامل خود را وارد کنید"
                      className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl sm:rounded-2xl px-3.5 py-2 sm:px-4 sm:py-3 pl-10 text-sm text-[var(--input-text)] placeholder-[var(--input-placeholder)] focus:outline-none focus:border-[var(--accent)] transition-colors"
                    />
                    <User className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2 stroke-[2] icon-white-glow" />
                  </div>
                </div>

                {/* Student ID */}
                <div>
                  <label className="text-[11px] sm:text-xs font-semibold text-[var(--text-2)] block mb-1 sm:mb-1.5">
                    شماره دانشجویی / کد ملی:
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={studentId}
                      onChange={(e) => setStudentId(e.target.value)}
                      placeholder="شماره دانشجویی"
                      className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl sm:rounded-2xl px-3.5 py-2 sm:px-4 sm:py-3 pl-10 text-sm text-[var(--input-text)] placeholder-[var(--input-placeholder)] focus:outline-none focus:border-[var(--accent)] dir-ltr text-right transition-colors"
                    />
                    <User className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2 stroke-[2] icon-white-glow" />
                  </div>
                </div>
              </>
            )}

            {/* Email Field */}
            <div>
              <label className="text-[11px] sm:text-xs font-semibold text-[var(--text-2)] block mb-1 sm:mb-1.5">
                ایمیل کاربری:
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@domain.com"
                  className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl sm:rounded-2xl px-3.5 py-2 sm:px-4 sm:py-3 pl-10 text-sm text-[var(--input-text)] placeholder-[var(--input-placeholder)] focus:outline-none focus:border-[var(--accent)] dir-ltr text-left transition-colors"
                />
                <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2 stroke-[2] icon-white-glow" />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="text-[11px] sm:text-xs font-semibold text-[var(--text-2)] block mb-1 sm:mb-1.5">
                رمز عبور:
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="رمز عبور (حداقل ۶ کاراکتر)"
                  className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl sm:rounded-2xl px-3.5 py-2 sm:px-4 sm:py-3 pl-10 text-sm text-[var(--input-text)] placeholder-[var(--input-placeholder)] focus:outline-none focus:border-[var(--accent)] dir-ltr text-left transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-2)] hover:text-[var(--text)] transition-colors cursor-pointer"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2] icon-white-glow" />
                  ) : (
                    <Eye className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2] icon-white-glow" />
                  )}
                </button>
              </div>
            </div>

            {errorMsg && (
              <div className="flex items-center gap-2 text-xs font-semibold text-[var(--status-red-text)] bg-[var(--status-red-bg)] p-3 rounded-2xl border border-[var(--status-red-border)]">
                <ShieldAlert className="w-4 h-4 text-[var(--status-red-text)] shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            </div>

            {/* Actions */}
            <div className="px-4 pb-4 pt-3 sm:px-6 sm:pb-6 sm:pt-3 border-t border-[var(--border)] flex items-center justify-between gap-3 shrink-0">
              <button
                type="button"
                onClick={closeModal}
                disabled={loading}
                className="px-5 py-2.5 bg-[var(--surface-2)] hover:bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--text-2)] hover:text-[var(--text)] rounded-full text-sm font-medium transition-colors cursor-pointer disabled:opacity-50"
              >
                انصراف
              </button>

              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--on-accent)] rounded-full text-sm font-bold transition-all shadow-lg hover:scale-[1.03] cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading && (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                <span>{mode === 'login' ? 'ورود به حساب کاربری' : 'ثبت‌نام و ورود'}</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};


import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShieldCheck,
  X,
  CheckCircle2,
  Building2,
  ArrowRight,
  User,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { useDashboard } from '../../context/DashboardContext';

export const SsoLoginModal: React.FC = () => {
  const { activeModal, closeModal, loginWithSso, studentProfile, showToast } = useDashboard();
  const [step, setStep] = useState<'idp' | 'credentials'>('idp');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Always reset to step 1 with empty username & password whenever the modal opens/closes
  useEffect(() => {
    if (activeModal === 'sso') {
      setStep('idp');
      setUsername('');
      setPassword('');
      setShowPassword(false);
      setErrorMsg('');
      setIsAuthenticating(false);
    }
  }, [activeModal]);

  if (activeModal !== 'sso') return null;

  const handleProceedToCredentials = () => {
    setErrorMsg('');
    setUsername('');
    setPassword('');
    setStep('credentials');
  };

  const handleSubmitCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!username.trim() || !password) {
      const msg = 'لطفاً نام کاربری و رمز عبور را وارد نمایید.';
      setErrorMsg(msg);
      showToast(msg);
      return;
    }

    setIsAuthenticating(true);
    try {
      await loginWithSso(username.trim(), password);
    } catch (err: any) {
      const msg = err?.message || 'نام کاربری یا رمز عبور اشتباه است.';
      setErrorMsg(msg);
      showToast(msg);
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <AnimatePresence>
      <div
        dir="rtl"
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 pb-[12vh] sm:pb-[8vh] bg-[#0F172A]/80 backdrop-blur-md"
      >
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="w-full max-w-lg bg-[#1C2436] border border-white/[0.08] rounded-xl sm:rounded-[30px] p-[14px] sm:p-6 shadow-2xl text-white max-h-[85dvh] overflow-y-auto overflow-x-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between gap-2 pb-3 sm:pb-4 border-b border-white/[0.08]">
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-[#232D42] rounded-xl sm:rounded-2xl border border-white/[0.08] flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5 text-white stroke-[2] icon-white-glow" />
              </div>
              <div className="min-w-0">
                <h2 className="text-[15px] sm:text-lg font-bold text-white truncate">درگاه ورود (SSO)</h2>
                <p className="text-[11px] sm:text-xs text-[#BBC1D1] truncate">
                  سامانه احراز هویت متمرکز دانشگاهی
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={closeModal}
              aria-label="بستن"
              className="p-2 rounded-full hover:bg-white/10 text-[#BBC1D1] hover:text-white transition-colors cursor-pointer shrink-0"
            >
              <X className="w-5 h-5 text-white stroke-[2] icon-white-glow" />
            </button>
          </div>

          {step === 'idp' ? (
            <>
              {/* Step 1: Single IdP Selection */}
              <div className="mt-3 sm:mt-5 space-y-2 sm:space-y-3">
                <p className="text-[11px] sm:text-xs font-bold text-[#BBC1D1] uppercase tracking-wider">
                  سرویس‌دهنده هویت یکپارچه را انتخاب کنید:
                </p>

                <label className="p-[12px] sm:p-4 rounded-xl sm:rounded-2xl border bg-[#35D07F]/15 border-[#35D07F]/50 text-white flex items-center justify-between gap-2 cursor-pointer transition-all">
                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                    <Building2 className="w-5 h-5 text-white shrink-0 stroke-[2] icon-white-glow" />
                    <div className="min-w-0">
                      <h4 className="text-xs sm:text-sm font-bold text-white">
                        سامانه مرکزی دولت و علوم (پنجره واحد)
                      </h4>
                      <p className="text-[11px] sm:text-xs text-[#BBC1D1]">
                        احراز هویت یکپارچه حساب دانشجویی
                      </p>
                    </div>
                  </div>
                  <input
                    type="radio"
                    name="idp"
                    checked={true}
                    readOnly
                    className="w-4 h-4 accent-[#35D07F] shrink-0"
                  />
                </label>
              </div>

              {/* User Account Profile Preview (Only if profile exists) */}
              {studentProfile.name ? (
                <div className="mt-4 sm:mt-5 p-3 sm:p-4 bg-[#232D42] rounded-xl sm:rounded-2xl border border-white/[0.08] text-xs space-y-1.5">
                  <span className="text-[#BBC1D1] block">پروفایل شناسایی شده:</span>
                  <div className="font-bold text-white text-sm">{studentProfile.name}</div>
                  <div className="text-[#BBC1D1]">
                    {studentProfile.field} | {studentProfile.institute}
                  </div>
                </div>
              ) : null}

              {/* Continue Action Button */}
              <div className="mt-5 sm:mt-6 pt-3 sm:pt-4 border-t border-white/[0.08] flex items-center justify-between gap-2.5 sm:gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 sm:px-5 py-2.5 bg-[#232D42] hover:bg-[#232D42]/80 text-[#BBC1D1] hover:text-white rounded-full text-xs sm:text-sm font-medium transition-colors cursor-pointer"
                >
                  انصراف
                </button>

                <button
                  type="button"
                  onClick={handleProceedToCredentials}
                  className="flex-1 py-2.5 px-3 bg-[#35D07F] hover:bg-[#35D07F]/90 text-white rounded-full text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#35D07F]/20 hover:scale-[1.02]"
                >
                  <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-white stroke-[2] icon-white-glow shrink-0" />
                  <span>تأیید و ورود یکپارچه SSO</span>
                  <ArrowRight className="w-4 h-4 text-white stroke-[2] icon-white-glow rotate-180 shrink-0" />
                </button>
              </div>
            </>
          ) : (
            /* Step 2: Student Username & Password Form (Always empty by default) */
            <form onSubmit={handleSubmitCredentials} autoComplete="off" className="mt-4 sm:mt-5 space-y-3 sm:space-y-4">
              {errorMsg && (
                <div className="p-2.5 sm:p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-[#BBC1D1] block mb-1.5">
                  نام کاربری *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="sso_username"
                    autoComplete="off"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="نام کاربری دانشجویی را وارد کنید"
                    className="w-full bg-[#232D42] border border-white/[0.1] focus:border-[#35D07F] rounded-xl px-3.5 py-2.5 pr-9 text-sm text-white placeholder-slate-500 focus:outline-none transition-colors dir-ltr text-right"
                  />
                  <User className="w-4 h-4 text-[#BBC1D1] absolute right-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#BBC1D1] block mb-1.5">
                  رمز عبور *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="sso_password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="رمز عبور را وارد کنید"
                    className="w-full bg-[#232D42] border border-white/[0.1] focus:border-[#35D07F] rounded-xl px-3.5 py-2.5 pr-9 pl-9 text-sm text-white placeholder-slate-500 focus:outline-none transition-colors dir-ltr text-right"
                  />
                  <Lock className="w-4 h-4 text-[#BBC1D1] absolute right-3 top-1/2 -translate-y-1/2" />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? 'مخفی کردن رمز عبور' : 'نمایش رمز عبور'}
                    className="p-1 text-[#BBC1D1] hover:text-white absolute left-2.5 top-1/2 -translate-y-1/2 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="mt-5 pt-3 sm:pt-4 border-t border-white/[0.08] flex items-center justify-between gap-2.5 sm:gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setErrorMsg('');
                    setUsername('');
                    setPassword('');
                    setStep('idp');
                  }}
                  className="px-4 sm:px-5 py-2.5 bg-[#232D42] hover:bg-[#232D42]/80 text-[#BBC1D1] hover:text-white rounded-full text-xs sm:text-sm font-medium transition-colors cursor-pointer"
                >
                  بازگشت
                </button>

                <button
                  type="submit"
                  disabled={isAuthenticating}
                  className="flex-1 py-2.5 px-3 bg-[#35D07F] hover:bg-[#35D07F]/90 text-white rounded-full text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#35D07F]/20 disabled:opacity-50"
                >
                  {isAuthenticating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>در حال احراز هویت...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-white stroke-[2] shrink-0" />
                      <span>ورود به پنل دانشجو</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

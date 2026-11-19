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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 pb-[12vh] sm:pb-[8vh] bg-[#0F172A]/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="w-full max-w-lg bg-[#1C2436] border border-white/[0.08] rounded-[30px] p-6 shadow-2xl text-white max-h-[85dvh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#232D42] rounded-2xl border border-white/[0.08] flex items-center justify-center shrink-0">
                <UserCheck className="w-5 h-5 text-white stroke-[2] icon-white-glow" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">
                  {mode === 'login' ? 'ورود به حساب کاربری' : 'ثبت‌نام دانشجوی جدید'}
                </h2>
                <p className="text-xs text-[#BBC1D1]">
                  {mode === 'login' ? 'ورود امن با ایمیل و رمز عبور' : 'ایجاد حساب کاربری جدید در سامانه'}
                </p>
              </div>
            </div>
            <button
              onClick={closeModal}
              className="p-2 rounded-full hover:bg-white/10 text-[#BBC1D1] hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5 text-white stroke-[2] icon-white-glow" />
            </button>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-2 gap-2 mt-4 p-1 bg-[#232D42] rounded-2xl border border-white/[0.08]">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMsg('');
              }}
              className={`py-2 text-xs font-bold rounded-xl transition-all ${
                mode === 'login'
                  ? 'bg-[#5EA8FF] text-white shadow-md'
                  : 'text-[#BBC1D1] hover:text-white'
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
              className={`py-2 text-xs font-bold rounded-xl transition-all ${
                mode === 'signup'
                  ? 'bg-[#5EA8FF] text-white shadow-md'
                  : 'text-[#BBC1D1] hover:text-white'
              }`}
            >
              ثبت‌نام جدید
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="mt-3 sm:mt-4 space-y-3 sm:space-y-4">
            {mode === 'signup' && (
              <>
                {/* Full Name */}
                <div>
                  <label className="text-[11px] sm:text-xs font-semibold text-[#BBC1D1] block mb-1 sm:mb-1.5">
                    نام و نام خانوادگی:
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="نام کامل خود را وارد کنید"
                      className="w-full bg-[#232D42] border border-white/[0.08] rounded-xl sm:rounded-2xl px-3.5 py-2 sm:px-4 sm:py-3 pl-10 text-sm text-white placeholder-[#BBC1D1]/50 focus:outline-none focus:border-[#5EA8FF] transition-colors"
                    />
                    <User className="w-4 h-4 sm:w-5 sm:h-5 text-white absolute left-3 top-1/2 -translate-y-1/2 stroke-[2] icon-white-glow" />
                  </div>
                </div>

                {/* Student ID */}
                <div>
                  <label className="text-[11px] sm:text-xs font-semibold text-[#BBC1D1] block mb-1 sm:mb-1.5">
                    شماره دانشجویی / کد ملی:
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={studentId}
                      onChange={(e) => setStudentId(e.target.value)}
                      placeholder="شماره دانشجویی"
                      className="w-full bg-[#232D42] border border-white/[0.08] rounded-xl sm:rounded-2xl px-3.5 py-2 sm:px-4 sm:py-3 pl-10 text-sm text-white placeholder-[#BBC1D1]/50 focus:outline-none focus:border-[#5EA8FF] dir-ltr text-right transition-colors"
                    />
                    <User className="w-4 h-4 sm:w-5 sm:h-5 text-white absolute left-3 top-1/2 -translate-y-1/2 stroke-[2] icon-white-glow" />
                  </div>
                </div>
              </>
            )}

            {/* Email Field */}
            <div>
              <label className="text-[11px] sm:text-xs font-semibold text-[#BBC1D1] block mb-1 sm:mb-1.5">
                ایمیل کاربری:
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@domain.com"
                  className="w-full bg-[#232D42] border border-white/[0.08] rounded-xl sm:rounded-2xl px-3.5 py-2 sm:px-4 sm:py-3 pl-10 text-sm text-white placeholder-[#BBC1D1]/50 focus:outline-none focus:border-[#5EA8FF] dir-ltr text-left transition-colors"
                />
                <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-white absolute left-3 top-1/2 -translate-y-1/2 stroke-[2] icon-white-glow" />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="text-[11px] sm:text-xs font-semibold text-[#BBC1D1] block mb-1 sm:mb-1.5">
                رمز عبور:
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="رمز عبور (حداقل ۶ کاراکتر)"
                  className="w-full bg-[#232D42] border border-white/[0.08] rounded-xl sm:rounded-2xl px-3.5 py-2 sm:px-4 sm:py-3 pl-10 text-sm text-white placeholder-[#BBC1D1]/50 focus:outline-none focus:border-[#5EA8FF] dir-ltr text-left transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-white hover:text-white/80 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4 sm:w-5 sm:h-5 text-white stroke-[2] icon-white-glow" />
                  ) : (
                    <Eye className="w-4 h-4 sm:w-5 sm:h-5 text-white stroke-[2] icon-white-glow" />
                  )}
                </button>
              </div>
            </div>

            {errorMsg && (
              <div className="flex items-center gap-2 text-xs font-semibold text-red-400 bg-red-950/40 p-3 rounded-2xl border border-red-800/50">
                <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Actions */}
            <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={closeModal}
                disabled={loading}
                className="px-5 py-2.5 bg-[#232D42] hover:bg-[#232D42]/80 text-[#BBC1D1] hover:text-white rounded-full text-sm font-medium transition-colors cursor-pointer disabled:opacity-50"
              >
                انصراف
              </button>

              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2.5 bg-[#5EA8FF] hover:bg-[#5EA8FF]/90 text-white rounded-full text-sm font-bold transition-all shadow-lg shadow-[#5EA8FF]/20 hover:scale-[1.03] cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
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


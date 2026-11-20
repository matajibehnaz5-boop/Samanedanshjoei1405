import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  KeyRound,
  HelpCircle,
  X,
  ShieldAlert,
  GraduationCap,
  UserCog,
  RefreshCw,
  Lock,
  Phone,
  Mail,
  Building2,
  ShieldCheck,
  UserCheck,
  AlertTriangle,
  Globe,
} from 'lucide-react';
import { useModalActions, useModalState } from '../../context/DashboardContext';

export const EDU_OFFICE_CONTACT = {
  officeTitle: 'اداره‌ی آموزش، موسسه آموزشی نمونه',
  phone: '۰۲۱-۸۸۰۰۱۲۳۴',
  phoneHref: 'tel:+982188001234',
  email: 'amoozesh@sample-institute.ac.ir',
} as const;

export const LoginHelpModals: React.FC = () => {
  const { activeModal } = useModalState();
  const { closeModal } = useModalActions();

  const isOpen = activeModal === 'forgot_password' || activeModal === 'login_guide';

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeModal]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        dir="rtl"
        onClick={(e) => {
          if (e.target === e.currentTarget) closeModal();
        }}
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 pb-[10vh] sm:pb-[6vh] bg-slate-950/80 backdrop-blur-sm"
      >
        <motion.div
          initial={{ opacity: 0, y: 36, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 36, scale: 0.97 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="w-full max-w-lg bg-[#1E293B] border border-slate-700/80 rounded-[24px] sm:rounded-[28px] shadow-2xl text-slate-100 flex flex-col max-h-[85dvh] overflow-hidden"
        >
          {activeModal === 'forgot_password' ? (
            <>
              {/* Header */}
              <div className="px-4 py-3.5 sm:px-6 sm:py-4 border-b border-slate-700/70 bg-[#172030] flex items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                  <div className="p-2 sm:p-2.5 bg-amber-500/15 text-amber-300 rounded-xl border border-amber-500/30 shrink-0">
                    <KeyRound className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-base sm:text-lg font-bold text-slate-100 truncate">
                      بازیابی رمز عبور
                    </h2>
                    <p className="text-[11px] sm:text-xs text-slate-400 truncate mt-0.5">
                      راهنمای دریافت رمز موقت و نکات امنیتی
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={closeModal}
                  aria-label="بستن"
                  className="p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable Body */}
              <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-4 sm:p-6 space-y-4">
                {/* Security Notice Banner */}
                <div className="p-3 sm:p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2.5">
                  <ShieldAlert className="w-5 h-5 text-amber-300 shrink-0 mt-0.5" />
                  <p className="text-xs sm:text-[13px] font-semibold text-amber-100 leading-relaxed">
                    به دلایل امنیتی، رمز عبور از طریق این صفحه بازیابی نمی‌شود.
                  </p>
                </div>

                {/* Steps */}
                <div className="space-y-2.5">
                  <h3 className="text-xs font-extrabold text-slate-300">مراحل بازیابی رمز عبور</h3>

                  <div className="p-3 rounded-2xl bg-[#151E2E] border border-slate-700/70 flex items-start gap-2.5">
                    <div className="p-1.5 rounded-lg bg-sky-500/15 text-sky-300 border border-sky-500/30 shrink-0 mt-0.5">
                      <GraduationCap className="w-4 h-4" />
                    </div>
                    <div className="text-xs text-slate-200 leading-relaxed">
                      <span className="font-bold text-sky-300">دانشجو: </span>
                      به اداره‌ی آموزش دانشکده مراجعه کنید یا با شماره‌ی تماس اداره‌ی آموزش درخواست رمز جدید دهید؛ رمز موقت جدید برای شما صادر می‌شود.
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-[#151E2E] border border-slate-700/70 flex items-start gap-2.5">
                    <div className="p-1.5 rounded-lg bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 shrink-0 mt-0.5">
                      <UserCog className="w-4 h-4" />
                    </div>
                    <div className="text-xs text-slate-200 leading-relaxed">
                      <span className="font-bold text-indigo-300">اساتید و کارمندان: </span>
                      با مدیر سامانه (ادمین) تماس بگیرید.
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-[#151E2E] border border-slate-700/70 flex items-start gap-2.5">
                    <div className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shrink-0 mt-0.5">
                      <RefreshCw className="w-4 h-4" />
                    </div>
                    <div className="text-xs text-slate-200 leading-relaxed">
                      پس از ورود با رمز موقت، حتماً از بخش{' '}
                      <span className="font-bold text-emerald-300">«کارتابل من ← تغییر رمز عبور»</span>{' '}
                      رمز را عوض کنید.
                    </div>
                  </div>
                </div>

                {/* Security Tips */}
                <div className="p-3 sm:p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/25 flex items-start gap-2.5">
                  <Lock className="w-4 h-4 text-rose-300 shrink-0 mt-0.5" />
                  <div className="text-xs text-rose-100 leading-relaxed">
                    <span className="font-bold text-rose-300">نکات امنیتی: </span>
                    رمز را به کسی ندهید؛ پشتیبانی هرگز رمز شما را نمی‌پرسد.
                  </div>
                </div>

                {/* Contact Section */}
                <div className="p-3.5 sm:p-4 rounded-2xl bg-[#151E2E] border border-slate-700/80 space-y-2.5">
                  <div className="flex items-center gap-2 text-xs sm:text-[13px] font-bold text-white">
                    <Building2 className="w-4 h-4 text-sky-400 shrink-0" />
                    <span>{EDU_OFFICE_CONTACT.officeTitle}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs text-slate-300">
                    <a
                      href={EDU_OFFICE_CONTACT.phoneHref}
                      className="inline-flex items-center gap-1.5 hover:text-sky-300 transition-colors"
                    >
                      <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span dir="ltr" className="font-mono font-semibold">
                        {EDU_OFFICE_CONTACT.phone}
                      </span>
                    </a>
                    <a
                      href={`mailto:${EDU_OFFICE_CONTACT.email}`}
                      className="inline-flex items-center gap-1.5 hover:text-sky-300 transition-colors break-all"
                    >
                      <Mail className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                      <span dir="ltr" className="font-mono">
                        {EDU_OFFICE_CONTACT.email}
                      </span>
                    </a>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-4 py-3 sm:px-6 border-t border-slate-700/70 bg-[#172030] flex justify-end shrink-0">
                <button
                  type="button"
                  onClick={closeModal}
                  className="w-full sm:w-auto px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  بستن
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Header */}
              <div className="px-4 py-3.5 sm:px-6 sm:py-4 border-b border-slate-700/70 bg-[#172030] flex items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                  <div className="p-2 sm:p-2.5 bg-sky-500/15 text-sky-300 rounded-xl border border-sky-500/30 shrink-0">
                    <HelpCircle className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-base sm:text-lg font-bold text-slate-100 truncate">
                      راهنمای ورود
                    </h2>
                    <p className="text-[11px] sm:text-xs text-slate-400 truncate mt-0.5">
                      نحوه‌ی ورود به درگاه دانشجویی و پنل مدیریت
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={closeModal}
                  aria-label="بستن"
                  className="p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable Body */}
              <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-4 sm:p-6 space-y-3">
                {/* SSO Login */}
                <div className="p-3.5 rounded-2xl bg-[#151E2E] border border-emerald-500/25 space-y-1.5">
                  <div className="flex items-center gap-2 text-xs sm:text-[13px] font-bold text-emerald-300">
                    <ShieldCheck className="w-4 h-4 shrink-0" />
                    <span>ورود (SSO)</span>
                  </div>
                  <p className="text-xs text-slate-200 leading-relaxed">
                    ویژه‌ی دانشجویان؛ گزینه را بزنید، نام کاربری و رمز عبوری که اداره‌ی آموزش به شما داده را وارد کنید و «ورود به پنل دانشجو» را بزنید.
                  </p>
                </div>

                {/* Form Login */}
                <div className="p-3.5 rounded-2xl bg-[#151E2E] border border-indigo-500/25 space-y-1.5">
                  <div className="flex items-center gap-2 text-xs sm:text-[13px] font-bold text-indigo-300">
                    <UserCheck className="w-4 h-4 shrink-0" />
                    <span>ورود (فرم)</span>
                  </div>
                  <p className="text-xs text-slate-200 leading-relaxed">
                    ویژه‌ی مدیر سامانه و کارکنان؛ شناسه و رمز را وارد کنید.
                  </p>
                </div>

                {/* Troubleshooting */}
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 space-y-1.5">
                  <div className="flex items-center gap-2 text-xs sm:text-[13px] font-bold text-amber-300">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>اگر وارد نشدید</span>
                  </div>
                  <p className="text-xs text-amber-100/90 leading-relaxed">
                    نام کاربری و رمز را دقیق بررسی کنید (حروف انگلیسی و کیبورد)، بعد از ۵ تلاش ناموفق ۱۰ دقیقه مسدود می‌شوید، و در نهایت با اداره‌ی آموزش تماس بگیرید.
                  </p>
                </div>

                {/* Browser */}
                <div className="p-3.5 rounded-2xl bg-[#151E2E] border border-slate-700/70 space-y-1.5">
                  <div className="flex items-center gap-2 text-xs sm:text-[13px] font-bold text-sky-300">
                    <Globe className="w-4 h-4 shrink-0" />
                    <span>مرورگر</span>
                  </div>
                  <p className="text-xs text-slate-200 leading-relaxed">
                    از نسخه‌ی به‌روز Chrome/Edge/Firefox استفاده کنید.
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="px-4 py-3 sm:px-6 border-t border-slate-700/70 bg-[#172030] flex justify-end shrink-0">
                <button
                  type="button"
                  onClick={closeModal}
                  className="w-full sm:w-auto px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  بستن
                </button>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

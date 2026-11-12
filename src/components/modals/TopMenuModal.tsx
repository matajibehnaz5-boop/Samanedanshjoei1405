import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Building2, Check, RefreshCw, LogOut, ExternalLink, HelpCircle, UserCheck } from 'lucide-react';
import { useDashboard } from '../../context/DashboardContext';

export const TopMenuModal: React.FC = () => {
  const {
    activeModal,
    closeModal,
    instituteName,
    setInstituteName,
    showToast,
    isLoggedIn,
    loginMethod,
    handleLogout,
  } = useDashboard();

  if (activeModal !== 'dropdown' && activeModal !== 'three_dot') return null;

  const institutes = [
    'موسسه آموزشی نمونه',
    'دانشگاه فنی و مهندسی',
    'دانشکده علوم کامپیوتر',
    'پردیس بین‌المللی فناوری',
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4 bg-slate-950/70 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          className="w-full max-w-sm bg-[#1E293B] border border-slate-700/80 rounded-2xl p-5 shadow-2xl text-slate-100"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-700/60">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              {activeModal === 'dropdown' ? (
                <>
                  <Building2 className="w-4 h-4 text-indigo-400" />
                  <span>تغییر موسسه آموزشی</span>
                </>
              ) : (
                <>
                  <span>منوی امکانات پنل</span>
                </>
              )}
            </h3>
            <button
              onClick={closeModal}
              className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Content for Dropdown Modal (Institute Switcher) */}
          {activeModal === 'dropdown' && (
            <div className="mt-3 space-y-2">
              <p className="text-xs text-slate-400 mb-2">
                موسسه یا دانشگاه مورد نظر را جهت مشاهده پرونده انتخاب کنید:
              </p>
              {institutes.map((inst) => (
                <button
                  key={inst}
                  onClick={() => {
                    setInstituteName(inst);
                    showToast(`موسسه به "${inst}" تغییر یافت`);
                    closeModal();
                  }}
                  className={`w-full p-3 rounded-xl border text-xs text-right flex items-center justify-between transition-colors cursor-pointer ${
                    instituteName === inst
                      ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-300 font-bold'
                      : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <span>{inst}</span>
                  {instituteName === inst && <Check className="w-4 h-4 text-indigo-400" />}
                </button>
              ))}
            </div>
          )}

          {/* Content for Three-Dot Menu */}
          {activeModal === 'three_dot' && (
            <div className="mt-3 space-y-2">
              
              {isLoggedIn ? (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl mb-3 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-emerald-300 font-semibold">
                    <UserCheck className="w-4 h-4" />
                    <span>ورود فعال ({loginMethod})</span>
                  </div>
                  <button
                    onClick={() => {
                      handleLogout();
                      closeModal();
                    }}
                    className="px-2.5 py-1 bg-red-500/20 text-red-300 border border-red-500/30 rounded-lg hover:bg-red-500/30 transition-colors font-bold cursor-pointer"
                  >
                    خروج
                  </button>
                </div>
              ) : (
                <p className="text-xs text-slate-400 mb-2">وضعیت: کاربر مهمان (ورود تمرینی انجام نشده)</p>
              )}

              <button
                onClick={() => {
                  showToast('اطلاعات پنل به‌روزرسانی شد');
                  closeModal();
                }}
                className="w-full p-3 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-xs text-slate-200 flex items-center gap-2.5 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-4 h-4 text-sky-400" />
                <span>به‌روزرسانی اطلاعات پنل</span>
              </button>

              <button
                onClick={() => {
                  window.open('https://oneapp.dev', '_blank');
                  closeModal();
                }}
                className="w-full p-3 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-xs text-slate-200 flex items-center gap-2.5 transition-colors cursor-pointer"
              >
                <ExternalLink className="w-4 h-4 text-amber-400" />
                <span>مشاهده وب‌سایت oneapp.dev</span>
              </button>

              <button
                onClick={() => {
                  showToast('راهنمای پنل دانشجویی در دسترس است');
                  closeModal();
                }}
                className="w-full p-3 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-xs text-slate-200 flex items-center gap-2.5 transition-colors cursor-pointer"
              >
                <HelpCircle className="w-4 h-4 text-emerald-400" />
                <span>راهنما و پشتیبانی</span>
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

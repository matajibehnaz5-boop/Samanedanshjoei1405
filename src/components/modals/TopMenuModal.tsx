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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 pb-[12vh] sm:pb-[8vh] bg-[var(--backdrop)] backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          className="w-full max-w-sm bg-[var(--menu-bg)] border border-[var(--menu-border)] rounded-2xl p-5 shadow-[var(--menu-shadow)] text-[var(--menu-text)] max-h-[85dvh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-[var(--menu-border)]">
            <h3 className="text-sm font-bold text-[var(--menu-text)] flex items-center gap-2">
              {activeModal === 'dropdown' ? (
                <>
                  <Building2 className="w-4 h-4 text-[var(--menu-icon)]" />
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
              className="p-1.5 rounded-full hover:bg-[var(--menu-hover-bg)] text-[var(--menu-sub-text)] hover:text-[var(--menu-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Content for Dropdown Modal (Institute Switcher) */}
          {activeModal === 'dropdown' && (
            <div className="mt-3 space-y-2">
              <p className="text-xs text-[var(--menu-sub-text)] mb-2">
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
                  className={`w-full p-3 rounded-xl border text-xs text-right flex items-center justify-between focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] transition-colors cursor-pointer ${
                    instituteName === inst
                      ? 'bg-[var(--menu-active-bg)] border-[var(--menu-active-bg)] text-[var(--menu-active-text)] font-bold'
                      : 'bg-[var(--menu-item-solid-bg)] border-[var(--menu-border)] text-[var(--menu-text)] hover:bg-[var(--menu-hover-bg)]'
                  }`}
                >
                  <span>{inst}</span>
                  {instituteName === inst && <Check className="w-4 h-4 text-[var(--menu-active-text)]" />}
                </button>
              ))}
            </div>
          )}

          {/* Content for Three-Dot Menu */}
          {activeModal === 'three_dot' && (
            <div className="mt-3 space-y-2">
              
              {isLoggedIn ? (
                <div className="p-3 bg-[var(--status-green-bg)] border border-[var(--status-green-border)] rounded-xl mb-3 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-[var(--status-green-text)] font-semibold">
                    <UserCheck className="w-4 h-4" />
                    <span>ورود فعال ({loginMethod})</span>
                  </div>
                  <button
                    onClick={() => {
                      handleLogout();
                      closeModal();
                    }}
                    className="px-2.5 py-1 bg-[var(--status-red-bg)] text-[var(--status-red-text)] border border-[var(--status-red-border)] rounded-lg hover:opacity-90 transition-opacity font-bold cursor-pointer"
                  >
                    خروج
                  </button>
                </div>
              ) : (
                <p className="text-xs text-[var(--menu-sub-text)] mb-2">وضعیت: کاربر مهمان (ورود تمرینی انجام نشده)</p>
              )}

              <button
                onClick={() => {
                  showToast('اطلاعات پنل به‌روزرسانی شد');
                  closeModal();
                }}
                className="w-full p-3 rounded-xl bg-[var(--menu-item-solid-bg)] hover:bg-[var(--menu-hover-bg)] border border-[var(--menu-border)] text-xs text-[var(--menu-text)] flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] transition-colors cursor-pointer"
              >
                <RefreshCw className="w-4 h-4 text-[var(--accent)]" />
                <span>به‌روزرسانی اطلاعات پنل</span>
              </button>

              <button
                onClick={() => {
                  window.open('https://oneapp.dev', '_blank');
                  closeModal();
                }}
                className="w-full p-3 rounded-xl bg-[var(--menu-item-solid-bg)] hover:bg-[var(--menu-hover-bg)] border border-[var(--menu-border)] text-xs text-[var(--menu-text)] flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] transition-colors cursor-pointer"
              >
                <ExternalLink className="w-4 h-4 text-[var(--warn)]" />
                <span>مشاهده وب‌سایت oneapp.dev</span>
              </button>

              <button
                onClick={() => {
                  showToast('راهنمای پنل دانشجویی در دسترس است');
                  closeModal();
                }}
                className="w-full p-3 rounded-xl bg-[var(--menu-item-solid-bg)] hover:bg-[var(--menu-hover-bg)] border border-[var(--menu-border)] text-xs text-[var(--menu-text)] flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] transition-colors cursor-pointer"
              >
                <HelpCircle className="w-4 h-4 text-[var(--ok)]" />
                <span>راهنما و پشتیبانی</span>
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

import React, { useState, useEffect } from 'react';
import { Menu, X, LayoutDashboard, TrendingUp, Settings, User, Globe, Bell, GraduationCap, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useDashboard } from '../context/DashboardContext';
import { UserAvatar } from './UserAvatar';

export const HeaderBar: React.FC = () => {
  const { setActiveModal, instituteName, isLoggedIn, studentProfile, handleLogout, language, toggleLanguage, notifications, t } = useDashboard();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isEduOpen, setIsEduOpen] = useState(false);

  const unreadCount = notifications ? notifications.filter(n => !n.read).length : 0;

  // Close drawer on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsDrawerOpen(false);
      }
    };
    if (isDrawerOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDrawerOpen]);

  return (
    <header className="w-full bg-gradient-to-r from-[#2A2550] via-[#222340] to-[#1A2332] border-b border-white/10 shadow-md relative z-30">
      <div className="max-w-4xl mx-auto px-3 sm:px-6 h-13 sm:h-15 flex items-center justify-between text-white relative">
        
        {/* Right Side (RTL Start): Hamburger Menu Button (☰) + Title + Status Dot */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 shrink">
          {/* Menu Button (☰) */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsDrawerOpen(true)}
            aria-label={t('topMenu')}
            title={t('topMenu')}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white/10 hover:bg-white/15 border border-white/15 flex items-center justify-center transition-all cursor-pointer shadow-sm group shrink-0"
          >
            <Menu className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white stroke-[2.2] group-hover:text-secondary transition-colors" />
          </motion.button>

          {/* Title & Active Status Indicator Dot */}
          <div className="flex items-center gap-2 min-w-0" dir="rtl">
            <h1 className="text-xs xs:text-sm sm:text-base font-bold text-white truncate max-w-[130px] xs:max-w-[200px] sm:max-w-none leading-none">
              {language === 'fa' ? 'سامانه مدیریت دانشجویی' : 'Student Management System'}
            </h1>
            <span className="relative flex h-2 w-2 sm:h-2.5 sm:w-2.5 shrink-0" title={language === 'fa' ? 'سامانه آنلاین' : 'System Online'}>
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 sm:h-2.5 sm:w-2.5 bg-emerald-500 shadow-[0_0_8px_#10B981]" />
            </span>
          </div>
        </div>

        {/* Left Side (RTL End): User Avatar, Notification Bell (🔔), Language Switcher (FA/EN) */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0" dir="ltr">
          {/* User Avatar Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveModal('profile')}
            aria-label={language === 'fa' ? 'مشخصات فردی' : 'User Profile'}
            title={language === 'fa' ? 'مشخصات فردی' : 'User Profile'}
            className="flex items-center justify-center cursor-pointer transition-transform shrink-0 rounded-full"
          >
            <UserAvatar size="xs" showStatus={isLoggedIn} />
          </motion.button>

          {/* Notification Bell Button (🔔) */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveModal('notifications')}
            aria-label={language === 'fa' ? 'اعلانات' : 'Notifications'}
            title={language === 'fa' ? 'اعلانات و پیام‌ها' : 'Notifications'}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white/10 hover:bg-white/15 border border-white/15 flex items-center justify-center transition-all cursor-pointer shadow-sm group shrink-0 relative"
          >
            <Bell className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white stroke-[2] group-hover:text-amber-300 transition-colors" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-rose-500 text-[9px] font-extrabold text-white ring-2 ring-[#222340]">
                {unreadCount}
              </span>
            )}
          </motion.button>

          {/* Language Switcher Button (FA / EN) */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleLanguage}
            title={language === 'fa' ? 'Switch to English' : 'تغییر به فارسی'}
            className="h-7 px-1.5 sm:px-2 rounded-lg bg-white/10 hover:bg-white/15 border border-white/15 flex items-center gap-1 text-[10px] sm:text-[11px] font-bold transition-all cursor-pointer shadow-sm text-white shrink-0"
          >
            <Globe className="w-3 h-3 text-secondary shrink-0" />
            <span className={language === 'fa' ? 'text-secondary font-extrabold' : 'opacity-60'}>FA</span>
            <span className="opacity-40 text-[9px]">/</span>
            <span className={language === 'en' ? 'text-secondary font-extrabold' : 'opacity-60'}>EN</span>
          </motion.button>
        </div>

      </div>

      {/* Slide-in Navigation Drawer (Right side RTL) */}
      <AnimatePresence>
        {isDrawerOpen && (
          <>
            {/* Dark Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={() => setIsDrawerOpen(false)}
              className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-md"
            />

            {/* Drawer Panel (Slide-in) */}
            <motion.div
              initial={{ x: language === 'fa' ? '100%' : '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: language === 'fa' ? '100%' : '-100%' }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className={`fixed top-0 ${language === 'fa' ? 'right-0 border-l' : 'left-0 border-r'} bottom-0 z-50 w-80 max-w-[85vw] bg-surface-container-high border-outline/20 p-6 shadow-2xl flex flex-col justify-between text-on-primary overflow-y-auto`}
            >
              <div>
                {/* Drawer Header */}
                <div className="flex items-center justify-between pb-4 mb-6 border-b border-outline/20">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-primary-container/40 border border-outline/20 flex items-center justify-center shadow-sm">
                      <Menu className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="text-base font-bold text-on-primary">
                      {t('topMenu')}
                    </h3>
                  </div>
                  <button
                    onClick={() => setIsDrawerOpen(false)}
                    className="p-2 rounded-xl hover:bg-surface-container-low text-outline hover:text-on-primary transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Drawer Menu Items */}
                <div className="space-y-3">
                  {/* Auth Button at top of Drawer */}
                  <button
                    onClick={() => {
                      if (isLoggedIn) {
                        handleLogout();
                      } else {
                        setIsDrawerOpen(false);
                        setActiveModal('form_login');
                      }
                    }}
                    className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-surface-container-low border border-outline/30 hover:border-primary/50 transition-all cursor-pointer group shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
                        <User className="w-5 h-5 text-on-primary" />
                      </div>
                      <div className="flex flex-col text-start">
                        <span className="text-xs font-bold text-on-primary">
                          {isLoggedIn ? `${t('logoutShort')} (${studentProfile.name})` : 'ورود به حساب کاربری'}
                        </span>
                        <span className="text-[11px] text-outline font-medium">
                          {isLoggedIn ? 'نشست کاربری فعال' : 'احراز هویت سامانه'}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs text-primary font-bold px-2 py-1 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                      {isLoggedIn ? t('logoutShort') : t('loginShort')}
                    </span>
                  </button>


                  {/* Profile / User Info Item - Only shown when logged in */}
                  {isLoggedIn && (
                    <button
                      onClick={() => {
                        setIsDrawerOpen(false);
                        setActiveModal('profile');
                      }}
                      className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-surface-container-low border border-outline/25 hover:border-primary/40 transition-all cursor-pointer group shadow-sm text-right"
                    >
                      <div className="flex items-center gap-3">
                        <UserAvatar size="sm" showStatus={true} />
                        <div className="flex flex-col text-right">
                          <span className="text-sm font-bold text-on-primary">
                            {studentProfile.name || 'کاربر'}
                          </span>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
                            <span className="text-xs text-outline font-medium">وضعیت: آنلاین</span>
                          </div>
                        </div>
                      </div>
                      <span className="text-xs text-primary font-medium group-hover:underline">مشاهده</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setIsDrawerOpen(false);
                      setActiveModal('analytics');
                    }}
                    className="w-full flex items-center gap-3.5 p-3.5 rounded-2xl bg-surface-container-low/80 hover:bg-surface-container-low border border-outline/20 transition-all text-sm font-bold text-on-primary text-right cursor-pointer group hover:border-primary/40 shadow-sm"
                  >
                    <div className="p-2.5 rounded-xl bg-primary-container/40 border border-primary/20 text-primary group-hover:scale-105 transition-transform">
                      <LayoutDashboard className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col">
                      <span>داشبورد</span>
                      <span className="text-xs font-normal text-outline">نمای کلی و برنامه‌ها</span>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setIsDrawerOpen(false);
                      setActiveModal('analytics');
                    }}
                    className="w-full flex items-center gap-3.5 p-3.5 rounded-2xl bg-surface-container-low/80 hover:bg-surface-container-low border border-outline/20 transition-all text-sm font-bold text-on-primary text-right cursor-pointer group hover:border-secondary/40 shadow-sm"
                  >
                    <div className="p-2.5 rounded-xl bg-secondary-container/50 border border-secondary/20 text-secondary group-hover:scale-105 transition-transform">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col">
                      <span>آمار تحصیلی</span>
                      <span className="text-xs font-normal text-outline">گزارش‌ها و نمودارها</span>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setIsDrawerOpen(false);
                      setActiveModal('settings');
                    }}
                    className="w-full flex items-center gap-3.5 p-3.5 rounded-2xl bg-surface-container-low/80 hover:bg-surface-container-low border border-outline/20 transition-all text-sm font-bold text-on-primary text-right cursor-pointer group hover:border-outline/40 shadow-sm"
                  >
                    <div className="p-2.5 rounded-xl bg-surface-container-high border border-outline/30 text-outline group-hover:scale-105 transition-transform">
                      <Settings className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col">
                      <span>تنظیمات</span>
                      <span className="text-xs font-normal text-outline">پیکربندی حساب و سامانه</span>
                    </div>
                  </button>

                  {isLoggedIn && studentProfile.role === 'admin' && (
                    <div className="rounded-2xl bg-surface-container-low/80 border border-outline/20 shadow-sm overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setIsEduOpen((prev) => !prev)}
                        className="w-full flex items-center justify-between p-3.5 hover:bg-surface-container-low transition-all text-sm font-bold text-on-primary text-right cursor-pointer group"
                      >
                        <div className="flex items-center gap-3.5">
                          <div className="p-2.5 rounded-xl bg-primary-container/40 border border-primary/20 text-primary group-hover:scale-105 transition-transform">
                            <GraduationCap className="w-5 h-5" />
                          </div>
                          <div className="flex flex-col">
                            <span>امور آموزش</span>
                            <span className="text-xs font-normal text-outline">مدیریت گروه‌ها، رشته‌ها و کارمندان</span>
                          </div>
                        </div>
                        <ChevronDown
                          className={`w-4 h-4 text-outline transition-transform duration-200 ${
                            isEduOpen ? 'rotate-180 text-primary' : ''
                          }`}
                        />
                      </button>

                      {isEduOpen && (
                        <div className="px-3 pb-3 pt-1 space-y-1.5 border-t border-outline/15">
                          <button
                            type="button"
                            onClick={() => {
                              setIsDrawerOpen(false);
                              setActiveModal('edu_groups');
                            }}
                            className="w-full text-right px-3 py-2 rounded-xl text-xs font-semibold text-on-primary hover:bg-surface-container-low border border-transparent hover:border-outline/25 transition-all cursor-pointer"
                          >
                            گروه‌های آموزشی
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setIsDrawerOpen(false);
                              setActiveModal('edu_fields');
                            }}
                            className="w-full text-right px-3 py-2 rounded-xl text-xs font-semibold text-on-primary hover:bg-surface-container-low border border-transparent hover:border-outline/25 transition-all cursor-pointer"
                          >
                            رشته‌های تحصیلی
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setIsDrawerOpen(false);
                              setActiveModal('employee_register');
                            }}
                            className="w-full text-right px-3 py-2 rounded-xl text-xs font-semibold text-on-primary hover:bg-surface-container-low border border-transparent hover:border-outline/25 transition-all cursor-pointer"
                          >
                            ثبت نام کارمندان
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setIsDrawerOpen(false);
                              setActiveModal('employee_list');
                            }}
                            className="w-full text-right px-3 py-2 rounded-xl text-xs font-semibold text-on-primary hover:bg-surface-container-low border border-transparent hover:border-outline/25 transition-all cursor-pointer"
                          >
                            لیست کارمندان
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Drawer Footer */}
              <div className="pt-4 border-t border-outline/20 text-center text-xs text-outline">
                <p className="font-semibold text-on-primary">{instituteName}</p>
                <p className="mt-1 text-[11px] text-outline">سامانه مدیریت دانشجویی - نسخه v2.0</p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
};

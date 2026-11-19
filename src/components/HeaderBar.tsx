import React, { useState, useEffect } from 'react';
import {
  Menu,
  X,
  LayoutDashboard,
  TrendingUp,
  Settings,
  User,
  Globe,
  Bell,
  GraduationCap,
  ChevronDown,
  FileText,
  Users,
  CalendarDays,
  UserCheck,
  Contact,
  FolderKanban,
  Megaphone,
  UserCog,
  MessageSquare,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth, useI18n, useLayoutSettings, useModalActions, useNotifications } from '../context/DashboardContext';
import { UserAvatar } from './UserAvatar';

export const HeaderBar: React.FC = React.memo(() => {
  const { setActiveModal, closeModal } = useModalActions();
  const { instituteName } = useLayoutSettings();
  const { isLoggedIn, studentProfile, handleLogout, setCurrentPage } = useAuth();
  const { language, toggleLanguage, t } = useI18n();
  const { notificationCount: unreadCount } = useNotifications();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isEduOpen, setIsEduOpen] = useState(false);
  const [isProfOpen, setIsProfOpen] = useState(false);
  const [isStudentOpen, setIsStudentOpen] = useState(false);

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
      <div className="max-w-4xl mx-auto px-2.5 sm:px-6 h-[48px] sm:h-15 flex items-center justify-between text-white relative">
        
        {/* Right Side (RTL Start): Hamburger Menu Button (☰) + Title + Status Dot */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 shrink">
          {/* Menu Button (☰) */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsDrawerOpen(true)}
            aria-label={t('topMenu')}
            title={t('topMenu')}
            className="w-[36px] h-[36px] sm:w-8 sm:h-8 rounded-lg bg-white/10 hover:bg-white/15 border border-white/15 flex items-center justify-center transition-all cursor-pointer shadow-sm group shrink-0"
          >
            <Menu className="w-4 h-4 text-white stroke-[2.2] group-hover:text-secondary transition-colors" />
          </motion.button>

          {/* Title & Active Status Indicator Dot */}
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0" dir="rtl">
            <h1 className="text-[14px] sm:text-base font-bold text-white truncate max-w-[180px] sm:max-w-none leading-none">
              {language === 'fa' ? 'سامانه مدیریت دانشجویی' : 'Student Management System'}
            </h1>
            <span className="relative flex h-2 w-2 sm:h-2.5 sm:w-2.5 shrink-0" title={language === 'fa' ? 'سامانه آنلاین' : 'System Online'}>
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 [transform:translateZ(0)]" />
              <span className="relative inline-flex rounded-full h-2 w-2 sm:h-2.5 sm:w-2.5 bg-emerald-500 shadow-[0_0_8px_#10B981]" />
            </span>
          </div>
        </div>

        {/* Left Side (RTL End): User Avatar, Notification Bell (🔔), Language Switcher (FA/EN) */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0" dir="ltr">
          {/* User Avatar Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveModal('profile')}
            aria-label={language === 'fa' ? 'مشخصات فردی' : 'User Profile'}
            title={language === 'fa' ? 'مشخصات فردی' : 'User Profile'}
            className="min-w-[36px] min-h-[36px] sm:min-w-0 sm:min-h-0 flex items-center justify-center cursor-pointer transition-transform shrink-0 rounded-full"
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
            className="w-[36px] h-[36px] sm:w-8 sm:h-8 rounded-lg bg-white/10 hover:bg-white/15 border border-white/15 flex items-center justify-center transition-all cursor-pointer shadow-sm group shrink-0 relative"
          >
            <Bell className="w-4 h-4 text-white stroke-[2] group-hover:text-amber-300 transition-colors" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-rose-500 text-[9px] font-extrabold text-white ring-2 ring-[#222340]">
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
            className="h-[36px] sm:h-7 px-2 rounded-lg bg-white/10 hover:bg-white/15 border border-white/15 flex items-center gap-1 text-[11px] font-bold transition-all cursor-pointer shadow-sm text-white shrink-0"
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
              className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-md [transform:translateZ(0)]"
            />

            {/* Drawer Panel (Slide-in) */}
            <motion.div
              initial={{ x: language === 'fa' ? '100%' : '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: language === 'fa' ? '100%' : '-100%' }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className={`fixed top-0 ${language === 'fa' ? 'right-0 border-l' : 'left-0 border-r'} bottom-0 z-50 w-[270px] sm:w-80 max-w-[85vw] bg-surface-container-high border-outline/20 p-[12px] sm:p-6 shadow-2xl flex flex-col justify-between text-on-primary overflow-y-auto overflow-x-hidden will-change-transform [transform:translateZ(0)]`}
            >
              <div>
                {/* Drawer Header */}
                <div className="flex items-center justify-between pb-2.5 mb-3 sm:pb-4 sm:mb-6 border-b border-outline/20">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-primary-container/40 border border-outline/20 flex items-center justify-center shadow-sm">
                      <Menu className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                    </div>
                    <h3 className="text-[15px] sm:text-base font-bold text-on-primary">
                      {t('topMenu')}
                    </h3>
                  </div>
                  <button
                    onClick={() => setIsDrawerOpen(false)}
                    className="min-w-[34px] min-h-[34px] sm:min-w-0 sm:min-h-0 flex items-center justify-center p-1.5 sm:p-2 rounded-xl hover:bg-surface-container-low text-outline hover:text-on-primary transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </div>

                {/* Drawer Menu Items */}
                <div className="space-y-1.5 sm:space-y-3">
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
                    className="w-full flex items-center justify-between p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl bg-surface-container-low border border-outline/30 hover:border-primary/50 transition-all cursor-pointer group shadow-sm"
                  >
                    <div className="flex items-center gap-2.5 sm:gap-3">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
                        <User className="w-4 h-4 sm:w-5 sm:h-5 text-on-primary" />
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


                  {isLoggedIn && studentProfile.role === 'admin' ? (
                    <>
                      {/* 1. کارتابل */}
                      <button
                        type="button"
                        onClick={() => {
                          setIsDrawerOpen(false);
                          closeModal();
                          setCurrentPage('dashboard');
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="w-full flex items-center gap-2.5 sm:gap-3.5 p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl bg-surface-container-low/80 hover:bg-surface-container-low border border-outline/20 transition-all text-xs sm:text-sm font-bold text-on-primary text-right cursor-pointer group hover:border-primary/40 shadow-sm"
                      >
                        <div className="p-2 sm:p-2.5 rounded-xl bg-primary-container/40 border border-primary/20 text-primary group-hover:scale-105 transition-transform">
                          <LayoutDashboard className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col">
                          <span>کارتابل</span>
                          <span className="text-[11px] sm:text-xs font-normal text-outline">صفحه اصلی مدیریت</span>
                        </div>
                      </button>

                      {/* 2. لیست پایان‌نامه‌ها */}
                      <button
                        type="button"
                        onClick={() => {
                          setIsDrawerOpen(false);
                          setActiveModal('thesis_list');
                        }}
                        className="w-full flex items-center gap-2.5 sm:gap-3.5 p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl bg-surface-container-low/80 hover:bg-surface-container-low border border-outline/20 transition-all text-xs sm:text-sm font-bold text-on-primary text-right cursor-pointer group hover:border-primary/40 shadow-sm"
                      >
                        <div className="p-2 sm:p-2.5 rounded-xl bg-primary-container/40 border border-primary/20 text-primary group-hover:scale-105 transition-transform">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col">
                          <span>لیست پایان‌نامه‌ها</span>
                          <span className="text-[11px] sm:text-xs font-normal text-outline">مشاهده و پیگیری پایان‌نامه‌ها</span>
                        </div>
                      </button>

                      {/* 3. ظرفیت اساتید */}
                      <button
                        type="button"
                        onClick={() => {
                          setIsDrawerOpen(false);
                          setActiveModal('professor_capacity');
                        }}
                        className="w-full flex items-center gap-2.5 sm:gap-3.5 p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl bg-surface-container-low/80 hover:bg-surface-container-low border border-outline/20 transition-all text-xs sm:text-sm font-bold text-on-primary text-right cursor-pointer group hover:border-primary/40 shadow-sm"
                      >
                        <div className="p-2 sm:p-2.5 rounded-xl bg-primary-container/40 border border-primary/20 text-primary group-hover:scale-105 transition-transform">
                          <Users className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col">
                          <span>ظرفیت اساتید</span>
                          <span className="text-[11px] sm:text-xs font-normal text-outline">بررسی و مدیریت ظرفیت راهنمایی</span>
                        </div>
                      </button>

                      {/* 4. جلسات دفاع */}
                      <button
                        type="button"
                        onClick={() => {
                          setIsDrawerOpen(false);
                          setActiveModal('defense_sessions');
                        }}
                        className="w-full flex items-center gap-2.5 sm:gap-3.5 p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl bg-surface-container-low/80 hover:bg-surface-container-low border border-outline/20 transition-all text-xs sm:text-sm font-bold text-on-primary text-right cursor-pointer group hover:border-primary/40 shadow-sm"
                      >
                        <div className="p-2 sm:p-2.5 rounded-xl bg-primary-container/40 border border-primary/20 text-primary group-hover:scale-105 transition-transform">
                          <CalendarDays className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col">
                          <span>جلسات دفاع</span>
                          <span className="text-[11px] sm:text-xs font-normal text-outline">زمان‌بندی و برنامه‌ریزی دفاع</span>
                        </div>
                      </button>

                      {/* 5. امور آموزش (آکاردئونی) */}
                      <div className="rounded-xl sm:rounded-2xl bg-surface-container-low/80 border border-outline/20 shadow-sm overflow-hidden">
                        <button
                          type="button"
                          onClick={() => setIsEduOpen((prev) => !prev)}
                          className="w-full flex items-center justify-between p-2.5 sm:p-3.5 hover:bg-surface-container-low transition-all text-xs sm:text-sm font-bold text-on-primary text-right cursor-pointer group"
                        >
                          <div className="flex items-center gap-2.5 sm:gap-3.5">
                            <div className="p-2 sm:p-2.5 rounded-xl bg-primary-container/40 border border-primary/20 text-primary group-hover:scale-105 transition-transform">
                              <GraduationCap className="w-5 h-5" />
                            </div>
                            <div className="flex flex-col">
                              <span>امور آموزش</span>
                              <span className="text-[11px] sm:text-xs font-normal text-outline">مدیریت گروه‌ها، رشته‌ها و کارمندان</span>
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
                              className="w-full text-right px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl text-[11px] sm:text-xs font-semibold text-on-primary hover:bg-surface-container-low border border-transparent hover:border-outline/25 transition-all cursor-pointer"
                            >
                              گروه‌های آموزشی
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setIsDrawerOpen(false);
                                setActiveModal('edu_fields');
                              }}
                              className="w-full text-right px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl text-[11px] sm:text-xs font-semibold text-on-primary hover:bg-surface-container-low border border-transparent hover:border-outline/25 transition-all cursor-pointer"
                            >
                              رشته‌های تحصیلی
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setIsDrawerOpen(false);
                                setActiveModal('employee_register');
                              }}
                              className="w-full text-right px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl text-[11px] sm:text-xs font-semibold text-on-primary hover:bg-surface-container-low border border-transparent hover:border-outline/25 transition-all cursor-pointer"
                            >
                              ثبت نام کارمندان
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setIsDrawerOpen(false);
                                setActiveModal('employee_list');
                              }}
                              className="w-full text-right px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl text-[11px] sm:text-xs font-semibold text-on-primary hover:bg-surface-container-low border border-transparent hover:border-outline/25 transition-all cursor-pointer"
                            >
                              لیست کارمندان
                            </button>
                          </div>
                        )}
                      </div>

                      {/* 6. امور اساتید (آکاردئونی) */}
                      <div className="rounded-xl sm:rounded-2xl bg-surface-container-low/80 border border-outline/20 shadow-sm overflow-hidden">
                        <button
                          type="button"
                          onClick={() => setIsProfOpen((prev) => !prev)}
                          className="w-full flex items-center justify-between p-2.5 sm:p-3.5 hover:bg-surface-container-low transition-all text-xs sm:text-sm font-bold text-on-primary text-right cursor-pointer group"
                        >
                          <div className="flex items-center gap-2.5 sm:gap-3.5">
                            <div className="p-2 sm:p-2.5 rounded-xl bg-primary-container/40 border border-primary/20 text-primary group-hover:scale-105 transition-transform">
                              <UserCheck className="w-5 h-5" />
                            </div>
                            <div className="flex flex-col">
                              <span>امور اساتید</span>
                              <span className="text-[11px] sm:text-xs font-normal text-outline">مدیریت اساتید و دسترسی‌ها</span>
                            </div>
                          </div>
                          <ChevronDown
                            className={`w-4 h-4 text-outline transition-transform duration-200 ${
                              isProfOpen ? 'rotate-180 text-primary' : ''
                            }`}
                          />
                        </button>

                        {isProfOpen && (
                          <div className="px-3 pb-3 pt-1 space-y-1.5 border-t border-outline/15">
                            <button
                              type="button"
                              onClick={() => {
                                setIsDrawerOpen(false);
                                setActiveModal('professor_register');
                              }}
                              className="w-full text-right px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl text-[11px] sm:text-xs font-semibold text-on-primary hover:bg-surface-container-low border border-transparent hover:border-outline/25 transition-all cursor-pointer"
                            >
                              ثبت نام اساتید
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setIsDrawerOpen(false);
                                setActiveModal('professor_list');
                              }}
                              className="w-full text-right px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl text-[11px] sm:text-xs font-semibold text-on-primary hover:bg-surface-container-low border border-transparent hover:border-outline/25 transition-all cursor-pointer"
                            >
                              لیست اساتید
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setIsDrawerOpen(false);
                                setActiveModal('professor_access');
                              }}
                              className="w-full text-right px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl text-[11px] sm:text-xs font-semibold text-on-primary hover:bg-surface-container-low border border-transparent hover:border-outline/25 transition-all cursor-pointer"
                            >
                              سطح دسترسی اساتید
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setIsDrawerOpen(false);
                                setActiveModal('professor_theses');
                              }}
                              className="w-full text-right px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl text-[11px] sm:text-xs font-semibold text-on-primary hover:bg-surface-container-low border border-transparent hover:border-outline/25 transition-all cursor-pointer"
                            >
                              پایان‌نامه اساتید
                            </button>
                          </div>
                        )}
                      </div>

                      {/* 7. امور دانشجویان (آکاردئونی) */}
                      <div className="rounded-xl sm:rounded-2xl bg-surface-container-low/80 border border-outline/20 shadow-sm overflow-hidden">
                        <button
                          type="button"
                          onClick={() => setIsStudentOpen((prev) => !prev)}
                          className="w-full flex items-center justify-between p-2.5 sm:p-3.5 hover:bg-surface-container-low transition-all text-xs sm:text-sm font-bold text-on-primary text-right cursor-pointer group"
                        >
                          <div className="flex items-center gap-2.5 sm:gap-3.5">
                            <div className="p-2 sm:p-2.5 rounded-xl bg-primary-container/40 border border-primary/20 text-primary group-hover:scale-105 transition-transform">
                              <Contact className="w-5 h-5" />
                            </div>
                            <div className="flex flex-col">
                              <span>امور دانشجویان</span>
                              <span className="text-[11px] sm:text-xs font-normal text-outline">ثبت‌نام و مدیریت دانشجویان</span>
                            </div>
                          </div>
                          <ChevronDown
                            className={`w-4 h-4 text-outline transition-transform duration-200 ${
                              isStudentOpen ? 'rotate-180 text-primary' : ''
                            }`}
                          />
                        </button>

                        {isStudentOpen && (
                          <div className="px-3 pb-3 pt-1 space-y-1.5 border-t border-outline/15">
                            <button
                              type="button"
                              onClick={() => {
                                setIsDrawerOpen(false);
                                setActiveModal('student_bulk_register');
                              }}
                              className="w-full text-right px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl text-[11px] sm:text-xs font-semibold text-on-primary hover:bg-surface-container-low border border-transparent hover:border-outline/25 transition-all cursor-pointer"
                            >
                              ثبت نام اولیه (گروهی)
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setIsDrawerOpen(false);
                                setActiveModal('student_register');
                              }}
                              className="w-full text-right px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl text-[11px] sm:text-xs font-semibold text-on-primary hover:bg-surface-container-low border border-transparent hover:border-outline/25 transition-all cursor-pointer"
                            >
                              ثبت نام (انفرادی)
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setIsDrawerOpen(false);
                                setActiveModal('student_delete');
                              }}
                              className="w-full text-right px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl text-[11px] sm:text-xs font-semibold text-on-primary hover:bg-surface-container-low border border-transparent hover:border-outline/25 transition-all cursor-pointer"
                            >
                              حذف دانشجو
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setIsDrawerOpen(false);
                                setActiveModal('student_search');
                              }}
                              className="w-full text-right px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl text-[11px] sm:text-xs font-semibold text-on-primary hover:bg-surface-container-low border border-transparent hover:border-outline/25 transition-all cursor-pointer"
                            >
                              جستجوی دانشجو
                            </button>
                          </div>
                        )}
                      </div>

                      {/* 8. امور پایان‌نامه‌ها */}
                      <button
                        type="button"
                        onClick={() => {
                          setIsDrawerOpen(false);
                          setActiveModal('thesis_affairs');
                        }}
                        className="w-full flex items-center gap-2.5 sm:gap-3.5 p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl bg-surface-container-low/80 hover:bg-surface-container-low border border-outline/20 transition-all text-xs sm:text-sm font-bold text-on-primary text-right cursor-pointer group hover:border-primary/40 shadow-sm"
                      >
                        <div className="p-2 sm:p-2.5 rounded-xl bg-primary-container/40 border border-primary/20 text-primary group-hover:scale-105 transition-transform">
                          <FolderKanban className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col">
                          <span>امور پایان‌نامه‌ها</span>
                          <span className="text-[11px] sm:text-xs font-normal text-outline">فرآیندها و تاییدیه‌های پایان‌نامه</span>
                        </div>
                      </button>

                      {/* 9. اعلانات عمومی */}
                      <button
                        type="button"
                        onClick={() => {
                          setIsDrawerOpen(false);
                          setActiveModal('public_announcements');
                        }}
                        className="w-full flex items-center gap-2.5 sm:gap-3.5 p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl bg-surface-container-low/80 hover:bg-surface-container-low border border-outline/20 transition-all text-xs sm:text-sm font-bold text-on-primary text-right cursor-pointer group hover:border-primary/40 shadow-sm"
                      >
                        <div className="p-2 sm:p-2.5 rounded-xl bg-primary-container/40 border border-primary/20 text-primary group-hover:scale-105 transition-transform">
                          <Megaphone className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col">
                          <span>اعلانات عمومی</span>
                          <span className="text-[11px] sm:text-xs font-normal text-outline">انتشار و مدیریت اطلاعیه‌ها</span>
                        </div>
                      </button>

                      {/* 10. کاربران */}
                      <button
                        type="button"
                        onClick={() => {
                          setIsDrawerOpen(false);
                          setActiveModal('admin_users');
                        }}
                        className="w-full flex items-center gap-2.5 sm:gap-3.5 p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl bg-surface-container-low/80 hover:bg-surface-container-low border border-outline/20 transition-all text-xs sm:text-sm font-bold text-on-primary text-right cursor-pointer group hover:border-primary/40 shadow-sm"
                      >
                        <div className="p-2 sm:p-2.5 rounded-xl bg-primary-container/40 border border-primary/20 text-primary group-hover:scale-105 transition-transform">
                          <UserCog className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col">
                          <span>کاربران</span>
                          <span className="text-[11px] sm:text-xs font-normal text-outline">مدیریت حساب‌ها و دسترسی‌ها</span>
                        </div>
                      </button>

                      {/* 11. تنظیمات */}
                      <button
                        type="button"
                        onClick={() => {
                          setIsDrawerOpen(false);
                          setActiveModal('settings');
                        }}
                        className="w-full flex items-center gap-2.5 sm:gap-3.5 p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl bg-surface-container-low/80 hover:bg-surface-container-low border border-outline/20 transition-all text-xs sm:text-sm font-bold text-on-primary text-right cursor-pointer group hover:border-outline/40 shadow-sm"
                      >
                        <div className="p-2 sm:p-2.5 rounded-xl bg-surface-container-high border border-outline/30 text-outline group-hover:scale-105 transition-transform">
                          <Settings className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col">
                          <span>تنظیمات</span>
                          <span className="text-[11px] sm:text-xs font-normal text-outline">پیکربندی حساب و سامانه</span>
                        </div>
                      </button>

                      {/* 12. پیام‌ها */}
                      <button
                        type="button"
                        onClick={() => {
                          setIsDrawerOpen(false);
                          setActiveModal('chat');
                        }}
                        className="w-full flex items-center gap-2.5 sm:gap-3.5 p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl bg-surface-container-low/80 hover:bg-surface-container-low border border-outline/20 transition-all text-xs sm:text-sm font-bold text-on-primary text-right cursor-pointer group hover:border-primary/40 shadow-sm"
                      >
                        <div className="p-2 sm:p-2.5 rounded-xl bg-primary-container/40 border border-primary/20 text-primary group-hover:scale-105 transition-transform">
                          <MessageSquare className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col">
                          <span>پیام‌ها</span>
                          <span className="text-[11px] sm:text-xs font-normal text-outline">گفتگو و پیام‌های سامانه</span>
                        </div>
                      </button>
                    </>
                  ) : (
                    <>
                      {/* Profile / User Info Item - Only shown for non-admin logged in */}
                      {isLoggedIn && (
                        <button
                          onClick={() => {
                            setIsDrawerOpen(false);
                            setActiveModal('profile');
                          }}
                          className="w-full flex items-center justify-between p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl bg-surface-container-low border border-outline/25 hover:border-primary/40 transition-all cursor-pointer group shadow-sm text-right"
                        >
                          <div className="flex items-center gap-2.5 sm:gap-3">
                            <UserAvatar size="sm" showStatus={true} />
                            <div className="flex flex-col text-right">
                              <span className="text-xs sm:text-sm font-bold text-on-primary">
                                {studentProfile.name || 'کاربر'}
                              </span>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
                                <span className="text-[11px] sm:text-xs text-outline font-medium">وضعیت: آنلاین</span>
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
                        className="w-full flex items-center gap-2.5 sm:gap-3.5 p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl bg-surface-container-low/80 hover:bg-surface-container-low border border-outline/20 transition-all text-xs sm:text-sm font-bold text-on-primary text-right cursor-pointer group hover:border-primary/40 shadow-sm"
                      >
                        <div className="p-2 sm:p-2.5 rounded-xl bg-primary-container/40 border border-primary/20 text-primary group-hover:scale-105 transition-transform">
                          <LayoutDashboard className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col">
                          <span>داشبورد</span>
                          <span className="text-[11px] sm:text-xs font-normal text-outline">نمای کلی و برنامه‌ها</span>
                        </div>
                      </button>

                      <button
                        onClick={() => {
                          setIsDrawerOpen(false);
                          setActiveModal('analytics');
                        }}
                        className="w-full flex items-center gap-2.5 sm:gap-3.5 p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl bg-surface-container-low/80 hover:bg-surface-container-low border border-outline/20 transition-all text-xs sm:text-sm font-bold text-on-primary text-right cursor-pointer group hover:border-secondary/40 shadow-sm"
                      >
                        <div className="p-2 sm:p-2.5 rounded-xl bg-secondary-container/50 border border-secondary/20 text-secondary group-hover:scale-105 transition-transform">
                          <TrendingUp className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col">
                          <span>آمار تحصیلی</span>
                          <span className="text-[11px] sm:text-xs font-normal text-outline">گزارش‌ها و نمودارها</span>
                        </div>
                      </button>

                      <button
                        onClick={() => {
                          setIsDrawerOpen(false);
                          setActiveModal('settings');
                        }}
                        className="w-full flex items-center gap-2.5 sm:gap-3.5 p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl bg-surface-container-low/80 hover:bg-surface-container-low border border-outline/20 transition-all text-xs sm:text-sm font-bold text-on-primary text-right cursor-pointer group hover:border-outline/40 shadow-sm"
                      >
                        <div className="p-2 sm:p-2.5 rounded-xl bg-surface-container-high border border-outline/30 text-outline group-hover:scale-105 transition-transform">
                          <Settings className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col">
                          <span>تنظیمات</span>
                          <span className="text-[11px] sm:text-xs font-normal text-outline">پیکربندی حساب و سامانه</span>
                        </div>
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Drawer Footer */}
              <div className="pt-3 sm:pt-4 border-t border-outline/20 text-center text-[11px] sm:text-xs text-outline">
                <p className="font-semibold text-on-primary">{instituteName}</p>
                <p className="mt-1 text-[11px] text-outline">سامانه مدیریت دانشجویی - نسخه v2.0</p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
});

import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  UserCog,
  MessageSquare,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth, useI18n, useLayoutSettings, useModalActions, useModalState, useNotifications, useSettings, useToastActions } from '../context/DashboardContext';
import { UserAvatar } from './UserAvatar';
import { AdminNotificationCenter } from './AdminNotificationCenter';
import { api } from '../lib/api';
import { AdminNotificationItem } from '../types';

export const HeaderBar: React.FC = React.memo(() => {
  const { setActiveModal, closeModal } = useModalActions();
  const { activeModal } = useModalState();
  const { instituteName, isCompactFrame } = useLayoutSettings();
  const { isLoggedIn, studentProfile, handleLogout, setCurrentPage } = useAuth();
  const { language, toggleLanguage, t } = useI18n();
  const { notificationCount: unreadCount } = useNotifications();
  const { showToast } = useToastActions();
  const { settings, userStorageScope } = useSettings();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isEduOpen, setIsEduOpen] = useState(false);
  const [isProfOpen, setIsProfOpen] = useState(false);
  const [isStudentOpen, setIsStudentOpen] = useState(false);

  // Admin Notification Center state (strictly active only for admin users)
  const isAdminUser = isLoggedIn && studentProfile.role === 'admin';
  const [isAdminNotifOpen, setIsAdminNotifOpen] = useState(false);
  const [adminNotifications, setAdminNotifications] = useState<AdminNotificationItem[]>([]);
  const [adminUnreadCount, setAdminUnreadCount] = useState<number>(0);
  const [isLoadingAdminNotifs, setIsLoadingAdminNotifs] = useState(false);
  const [isMarkingAllNotifs, setIsMarkingAllNotifs] = useState(false);
  const bellButtonRef = useRef<HTMLButtonElement | null>(null);
  const [adminCartablePendingCount, setAdminCartablePendingCount] = useState<number>(0);

  const fetchAdminCartableCount = useCallback(async () => {
    if (!isAdminUser) return;
    try {
      const res = await api.getAdminCartable('pending');
      if (typeof res?.counts?.pending === 'number') {
        setAdminCartablePendingCount(res.counts.pending);
      }
    } catch {
      // keep existing count silently
    }
  }, [isAdminUser]);

  const fetchAdminNotifications = useCallback(async (showSpinner = false) => {
    if (!isAdminUser) return;
    if (showSpinner) setIsLoadingAdminNotifs(true);
    try {
      const res = await api.getAdminNotifications();
      setAdminNotifications(Array.isArray(res?.notifications) ? res.notifications : []);
      setAdminUnreadCount(typeof res?.unreadCount === 'number' ? res.unreadCount : 0);
    } catch {
      // keep existing state silently on background poll failure
    } finally {
      if (showSpinner) setIsLoadingAdminNotifs(false);
    }
  }, [isAdminUser]);

  // Poll every 60 seconds ONLY when tab is visible/active
  useEffect(() => {
    if (!isAdminUser) {
      setIsAdminNotifOpen(false);
      setAdminNotifications([]);
      setAdminUnreadCount(0);
      setAdminCartablePendingCount(0);
      return;
    }

    if (document.visibilityState === 'visible') {
      fetchAdminNotifications(false);
      fetchAdminCartableCount();
    }

    const intervalId = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchAdminNotifications(false);
        fetchAdminCartableCount();
      }
    }, 60000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchAdminNotifications(false);
        fetchAdminCartableCount();
      }
    };

    const handleCartableUpdated = (event: Event) => {
      const customEvent = event as CustomEvent<{ pendingCount?: number }>;
      if (typeof customEvent?.detail?.pendingCount === 'number') {
        setAdminCartablePendingCount(customEvent.detail.pendingCount);
      } else {
        fetchAdminCartableCount();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('admin-cartable-updated', handleCartableUpdated);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('admin-cartable-updated', handleCartableUpdated);
    };
  }, [isAdminUser, fetchAdminNotifications, fetchAdminCartableCount]);

  useEffect(() => {
    if (isDrawerOpen && isAdminUser) {
      fetchAdminCartableCount();
    }
  }, [isDrawerOpen, isAdminUser, fetchAdminCartableCount]);

  const handleToggleAdminNotifs = () => {
    setIsAdminNotifOpen((prev) => {
      const next = !prev;
      if (next) {
        fetchAdminNotifications(true);
      }
      return next;
    });
  };

  const [readChannelIds, setReadChannelIds] = useState<Record<string, boolean>>(() => {
    try {
      const raw = localStorage.getItem(`admin_channel_notifs_read:${userStorageScope}`);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    try {
      const raw = localStorage.getItem(`admin_channel_notifs_read:${userStorageScope}`);
      setReadChannelIds(raw ? JSON.parse(raw) : {});
    } catch {
      setReadChannelIds({});
    }
  }, [userStorageScope]);

  const markChannelNotificationRead = useCallback(
    (id: string) => {
      setReadChannelIds((prev) => {
        const next = { ...prev, [id]: true };
        try {
          localStorage.setItem(`admin_channel_notifs_read:${userStorageScope}`, JSON.stringify(next));
        } catch {
          // ignore
        }
        return next;
      });
    },
    [userStorageScope]
  );

  const visibleAdminNotifications = React.useMemo(() => {
    const channelItems: AdminNotificationItem[] = [];
    if (settings.smsNotify) {
      channelItems.push({
        id: 'admin-ch-sms',
        type: 'sms',
        title: 'گزارش اعلان‌های پیامکی',
        body: 'سرویس اطلاع‌رسانی پیامکی برای یادآوری جلسات دفاع و درخواست‌ها فعال است.',
        targetModal: 'sms_notification',
        isRead: Boolean(readChannelIds['admin-ch-sms']),
        createdAt: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
      });
    }
    if (settings.emailNotify) {
      channelItems.push({
        id: 'admin-ch-email',
        type: 'email',
        title: 'گزارش اعلان‌های ایمیل',
        body: 'خلاصه گزارش‌های آموزشی و اطلاعیه‌های سامانه به ایمیل مدیریت ارسال می‌شود.',
        targetModal: 'settings',
        isRead: Boolean(readChannelIds['admin-ch-email']),
        createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
      });
    }

    const filteredServer = adminNotifications.filter((item) => {
      if (item.type === 'sms' && !settings.smsNotify) return false;
      if (item.type === 'email' && !settings.emailNotify) return false;
      return true;
    });

    return [...channelItems, ...filteredServer];
  }, [adminNotifications, settings.smsNotify, settings.emailNotify, readChannelIds]);

  const visibleAdminUnreadCount = React.useMemo(() => {
    const hiddenServerUnread = adminNotifications.filter(
      (item) =>
        !item.isRead &&
        ((item.type === 'sms' && !settings.smsNotify) ||
          (item.type === 'email' && !settings.emailNotify))
    ).length;
    const channelUnread =
      (settings.smsNotify && !readChannelIds['admin-ch-sms'] ? 1 : 0) +
      (settings.emailNotify && !readChannelIds['admin-ch-email'] ? 1 : 0);

    return Math.max(0, adminUnreadCount - hiddenServerUnread) + channelUnread;
  }, [adminNotifications, adminUnreadCount, settings.smsNotify, settings.emailNotify, readChannelIds]);

  const handleMarkAllAdminRead = async () => {
    setIsMarkingAllNotifs(true);
    try {
      await api.markAllAdminNotificationsRead();
      setAdminNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
      setAdminUnreadCount(0);
      if (settings.smsNotify) markChannelNotificationRead('admin-ch-sms');
      if (settings.emailNotify) markChannelNotificationRead('admin-ch-email');
      showToast('همه اعلان‌ها به عنوان خوانده‌شده علامت‌گذاری شدند');
    } catch (err: any) {
      showToast(err?.message || 'خطا در به‌روزرسانی اعلان‌ها');
    } finally {
      setIsMarkingAllNotifs(false);
    }
  };

  const handleSelectAdminNotification = async (item: AdminNotificationItem) => {
    setIsAdminNotifOpen(false);
    if (item.id === 'admin-ch-sms' || item.id === 'admin-ch-email') {
      markChannelNotificationRead(item.id);
      if (item.targetModal) {
        setActiveModal(item.targetModal);
      }
      return;
    }
    if (!item.isRead) {
      setAdminNotifications((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n))
      );
      setAdminUnreadCount((prev) => Math.max(0, prev - 1));
      try {
        const res = await api.markAdminNotificationRead(item.id);
        if (typeof res?.unreadCount === 'number') {
          setAdminUnreadCount(res.unreadCount);
        }
      } catch {
        // ignore background sync error
      }
    }
    if (item.targetModal) {
      setActiveModal(item.targetModal);
    }
  };

  const displayedBellCount = isAdminUser ? visibleAdminUnreadCount : unreadCount;

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
    <header className="w-full bg-[image:var(--header-bg)] border-b border-[var(--header-border)] shadow-[var(--header-shadow)] relative z-30">
      <div className={`${isCompactFrame ? 'max-w-[420px]' : 'max-w-full sm:px-8'} mx-auto px-[8px] sm:px-6 h-[48px] sm:h-15 flex items-center justify-between gap-[4px] sm:gap-3 text-[var(--text)] relative transition-all duration-300`}>
        
        {/* Right Side (RTL Start): Hamburger Menu Button (☰) + Title + Status Dot */}
        <div className="flex items-center gap-[4px] sm:gap-3 flex-1 min-w-0">
          {/* Menu Button (☰) */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsDrawerOpen(true)}
            aria-label={t('topMenu')}
            title={t('topMenu')}
            className="w-[32px] h-[32px] sm:w-8 sm:h-8 rounded-lg bg-[var(--header-btn-bg)] hover:bg-[var(--header-btn-hover)] border border-[var(--header-btn-border)] flex items-center justify-center transition-all cursor-pointer shadow-sm group shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
          >
            <Menu className="w-4 h-4 text-[var(--text)] stroke-[2.2] group-hover:text-[var(--menu-icon-alt)] transition-colors" />
          </motion.button>

          {/* Title & Active Status Indicator Dot */}
          {isAdminUser ? (
            <button
              type="button"
              onClick={() => {
                closeModal();
                setCurrentPage('dashboard');
                window.dispatchEvent(new CustomEvent('admin-overview-refresh'));
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="flex items-center gap-[4px] sm:gap-2 flex-1 min-w-0 text-right cursor-pointer hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] rounded-lg transition-opacity"
              dir="rtl"
              title="صفحه اصلی مدیریت"
            >
              <h1 className="text-[12px] sm:text-base font-bold text-[var(--text)] whitespace-nowrap sm:truncate sm:max-w-none leading-none">
                {language === 'fa' ? 'سامانه مدیریت دانشجویی' : 'Student Management System'}
              </h1>
              {settings.showOnlineStatus && (
                <span className="relative flex h-1.5 w-1.5 sm:h-2.5 sm:w-2.5 shrink-0" title={language === 'fa' ? 'سامانه آنلاین' : 'System Online'}>
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 [transform:translateZ(0)]" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 sm:h-2.5 sm:w-2.5 bg-emerald-500 shadow-[0_0_8px_#10B981]" />
                </span>
              )}
            </button>
          ) : (
            <div className="flex items-center gap-[4px] sm:gap-2 flex-1 min-w-0" dir="rtl">
              <h1 className="text-[12px] sm:text-base font-bold text-[var(--text)] whitespace-nowrap sm:truncate sm:max-w-none leading-none">
                {language === 'fa' ? 'سامانه مدیریت دانشجویی' : 'Student Management System'}
              </h1>
              {settings.showOnlineStatus && (
                <span className="relative flex h-1.5 w-1.5 sm:h-2.5 sm:w-2.5 shrink-0" title={language === 'fa' ? 'سامانه آنلاین' : 'System Online'}>
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 [transform:translateZ(0)]" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 sm:h-2.5 sm:w-2.5 bg-emerald-500 shadow-[0_0_8px_#10B981]" />
                </span>
              )}
            </div>
          )}
        </div>

        {/* Left Side (RTL End): User Avatar, Notification Bell (🔔), Language Switcher (FA/EN) */}
        <div className="flex items-center gap-[4px] sm:gap-2 shrink-0" dir="ltr">
          {/* User Avatar Button (hidden on mobile < 640px) */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveModal('profile')}
            aria-label={language === 'fa' ? 'مشخصات فردی' : 'User Profile'}
            title={language === 'fa' ? 'مشخصات فردی' : 'User Profile'}
            className="hidden sm:flex min-w-0 min-h-0 items-center justify-center cursor-pointer transition-transform shrink-0 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
          >
            <UserAvatar size="xs" showStatus={isLoggedIn && settings.showOnlineStatus} />
          </motion.button>

          {/* Notification Bell Button (🔔) */}
          <motion.button
            ref={bellButtonRef}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={isAdminUser ? handleToggleAdminNotifs : () => setActiveModal('notifications')}
            aria-label={language === 'fa' ? 'اعلانات' : 'Notifications'}
            title={language === 'fa' ? 'اعلانات و پیام‌ها' : 'Notifications'}
            className="w-[30px] h-[30px] sm:w-8 sm:h-8 rounded-lg bg-[var(--header-btn-bg)] hover:bg-[var(--header-btn-hover)] border border-[var(--header-btn-border)] flex items-center justify-center transition-all cursor-pointer shadow-sm group shrink-0 relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
          >
            <Bell className="w-[16px] h-[16px] sm:w-4 sm:h-4 text-[var(--text)] stroke-[2] group-hover:text-[var(--menu-icon-alt)] transition-colors" />
            {displayedBellCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 flex min-w-[14px] h-3.5 sm:min-w-[15px] sm:h-3.5 px-0.5 items-center justify-center rounded-full bg-[var(--menu-badge-bg)] text-[8px] sm:text-[9px] font-extrabold text-[var(--menu-badge-text)] ring-1 sm:ring-2 ring-[var(--header-ring)]">
                {displayedBellCount > 99 ? '99+' : displayedBellCount}
              </span>
            )}
          </motion.button>

          {/* Language Switcher Button (FA / EN) */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleLanguage}
            title={language === 'fa' ? 'Switch to English' : 'تغییر به فارسی'}
            className="h-[30px] sm:h-7 px-1.5 sm:px-2 rounded-lg bg-[var(--header-btn-bg)] hover:bg-[var(--header-btn-hover)] border border-[var(--header-btn-border)] flex items-center gap-1 text-[10.5px] sm:text-[11px] font-bold transition-all cursor-pointer shadow-sm text-[var(--text)] shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
          >
            <Globe className="hidden sm:block w-3 h-3 text-[var(--menu-icon-alt)] shrink-0" />
            <span className={language === 'fa' ? 'text-[var(--header-lang-active)] font-extrabold' : 'text-[var(--header-lang-inactive)]'}>FA</span>
            <span className="text-[var(--header-lang-sep)] text-[9px]">/</span>
            <span className={language === 'en' ? 'text-[var(--header-lang-active)] font-extrabold' : 'text-[var(--header-lang-inactive)]'}>EN</span>
          </motion.button>
        </div>

        {/* Admin Notification Center Popover (Admin Only) */}
        {isAdminUser && (
          <AdminNotificationCenter
            isOpen={isAdminNotifOpen}
            onClose={() => setIsAdminNotifOpen(false)}
            bellButtonRef={bellButtonRef}
            notifications={visibleAdminNotifications}
            unreadCount={visibleAdminUnreadCount}
            isLoading={isLoadingAdminNotifs}
            isMarkingAll={isMarkingAllNotifs}
            onMarkAllRead={handleMarkAllAdminRead}
            onSelectNotification={handleSelectAdminNotification}
            onOpenPublicAnnouncements={() => {
              setIsAdminNotifOpen(false);
              setActiveModal('public_announcements');
            }}
            isRtlLayout={language === 'fa'}
          />
        )}

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
              className="fixed inset-0 z-50 bg-[var(--backdrop)] backdrop-blur-md [transform:translateZ(0)]"
            />

            {/* Drawer Panel (Slide-in) */}
            <motion.div
              initial={{ x: language === 'fa' ? '100%' : '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: language === 'fa' ? '100%' : '-100%' }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className={`fixed top-0 ${language === 'fa' ? 'right-0 border-l' : 'left-0 border-r'} bottom-0 z-50 w-[270px] sm:w-80 max-w-[85vw] bg-[var(--menu-bg)] border-[var(--menu-border)] p-[12px] sm:p-6 shadow-[var(--menu-shadow)] flex flex-col justify-between text-[var(--menu-text)] overflow-y-auto overflow-x-hidden will-change-transform [transform:translateZ(0)]`}
            >
              <div>
                {/* Drawer Header */}
                <div className="flex items-center justify-between pb-2.5 mb-3 sm:pb-4 sm:mb-6 border-b border-[var(--menu-border)]">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-[var(--menu-icon-box-bg)] border border-[var(--menu-icon-box-border)] flex items-center justify-center shadow-sm">
                      <Menu className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--menu-icon)]" />
                    </div>
                    <h3 className="text-[15px] sm:text-base font-bold text-[var(--menu-text)]">
                      {t('topMenu')}
                    </h3>
                  </div>
                  <button
                    onClick={() => setIsDrawerOpen(false)}
                    className="min-w-[34px] min-h-[34px] sm:min-w-0 sm:min-h-0 flex items-center justify-center p-1.5 sm:p-2 rounded-xl hover:bg-[var(--menu-hover-bg)] text-[var(--menu-sub-text)] hover:text-[var(--menu-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] transition-colors cursor-pointer"
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
                    className="w-full flex items-center justify-between p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl bg-[var(--menu-item-bg)] hover:bg-[var(--menu-hover-bg)] border border-[var(--menu-border)] hover:border-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] transition-all cursor-pointer group shadow-sm"
                  >
                    <div className="flex items-center gap-2.5 sm:gap-3">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-[var(--menu-icon-box-bg)] border border-[var(--menu-icon-box-border)] flex items-center justify-center shrink-0">
                        <User className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--menu-icon)]" />
                      </div>
                      <div className="flex flex-col text-start">
                        <span className="text-xs font-bold text-[var(--menu-text)]">
                          {isLoggedIn ? `${t('logoutShort')} (${studentProfile.name})` : 'ورود به حساب کاربری'}
                        </span>
                        <span className="text-[11px] text-[var(--menu-sub-text)] font-medium">
                          {isLoggedIn ? 'نشست کاربری فعال' : 'احراز هویت سامانه'}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs text-[var(--menu-active-text)] font-bold px-2.5 py-1 bg-[var(--menu-active-bg)] rounded-lg transition-opacity group-hover:opacity-90">
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
                          setActiveModal('admin_cartable');
                        }}
                        className={`w-full flex items-center justify-between gap-2 p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl border transition-all text-xs sm:text-sm font-bold text-right cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] shadow-sm ${
                          activeModal === 'admin_cartable'
                            ? 'bg-[var(--menu-active-bg)] text-[var(--menu-active-text)] border-[var(--menu-active-bg)]'
                            : 'bg-[var(--menu-item-bg)] hover:bg-[var(--menu-hover-bg)] text-[var(--menu-text)] border-[var(--menu-border)] hover:border-[var(--accent)]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
                          <div className={`p-2 sm:p-2.5 rounded-xl border group-hover:scale-105 transition-transform shrink-0 ${
                            activeModal === 'admin_cartable'
                              ? 'bg-white/20 border-white/30 text-[var(--menu-active-text)]'
                              : 'bg-[var(--menu-icon-box-bg)] border-[var(--menu-icon-box-border)] text-[var(--menu-icon)]'
                          }`}>
                            <LayoutDashboard className="w-5 h-5" />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span>کارتابل</span>
                            <span className={`text-[11px] sm:text-xs font-normal truncate ${activeModal === 'admin_cartable' ? 'text-white/85' : 'text-[var(--menu-sub-text)]'}`}>کارتابل و پیگیری کارها</span>
                          </div>
                        </div>
                        {adminCartablePendingCount > 0 && (
                          <span className="px-2 py-0.5 rounded-full bg-[var(--menu-pill-badge-bg)] text-[var(--menu-pill-badge-text)] border border-[var(--menu-pill-badge-border)] text-[11px] font-extrabold shrink-0">
                            {String(adminCartablePendingCount).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[Number(d)] ?? d)}
                          </span>
                        )}
                      </button>

                      {/* 2. لیست پایان‌نامه‌ها */}
                      <button
                        type="button"
                        onClick={() => {
                          setIsDrawerOpen(false);
                          setActiveModal('thesis_list');
                        }}
                        className={`w-full flex items-center gap-2.5 sm:gap-3.5 p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl border transition-all text-xs sm:text-sm font-bold text-right cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] shadow-sm ${
                          activeModal === 'thesis_list'
                            ? 'bg-[var(--menu-active-bg)] text-[var(--menu-active-text)] border-[var(--menu-active-bg)]'
                            : 'bg-[var(--menu-item-bg)] hover:bg-[var(--menu-hover-bg)] text-[var(--menu-text)] border-[var(--menu-border)] hover:border-[var(--accent)]'
                        }`}
                      >
                        <div className={`p-2 sm:p-2.5 rounded-xl border group-hover:scale-105 transition-transform ${
                          activeModal === 'thesis_list'
                            ? 'bg-white/20 border-white/30 text-[var(--menu-active-text)]'
                            : 'bg-[var(--menu-icon-box-bg)] border-[var(--menu-icon-box-border)] text-[var(--menu-icon)]'
                        }`}>
                          <FileText className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col">
                          <span>لیست پایان‌نامه‌ها</span>
                          <span className={`text-[11px] sm:text-xs font-normal ${activeModal === 'thesis_list' ? 'text-white/85' : 'text-[var(--menu-sub-text)]'}`}>مشاهده و پیگیری پایان‌نامه‌ها</span>
                        </div>
                      </button>

                      {/* 3. ظرفیت اساتید */}
                      <button
                        type="button"
                        onClick={() => {
                          setIsDrawerOpen(false);
                          setActiveModal('professor_capacity');
                        }}
                        className={`w-full flex items-center gap-2.5 sm:gap-3.5 p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl border transition-all text-xs sm:text-sm font-bold text-right cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] shadow-sm ${
                          activeModal === 'professor_capacity'
                            ? 'bg-[var(--menu-active-bg)] text-[var(--menu-active-text)] border-[var(--menu-active-bg)]'
                            : 'bg-[var(--menu-item-bg)] hover:bg-[var(--menu-hover-bg)] text-[var(--menu-text)] border-[var(--menu-border)] hover:border-[var(--accent)]'
                        }`}
                      >
                        <div className={`p-2 sm:p-2.5 rounded-xl border group-hover:scale-105 transition-transform ${
                          activeModal === 'professor_capacity'
                            ? 'bg-white/20 border-white/30 text-[var(--menu-active-text)]'
                            : 'bg-[var(--menu-icon-box-bg)] border-[var(--menu-icon-box-border)] text-[var(--menu-icon)]'
                        }`}>
                          <Users className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col">
                          <span>ظرفیت اساتید</span>
                          <span className={`text-[11px] sm:text-xs font-normal ${activeModal === 'professor_capacity' ? 'text-white/85' : 'text-[var(--menu-sub-text)]'}`}>بررسی و مدیریت ظرفیت راهنمایی</span>
                        </div>
                      </button>

                      {/* 4. جلسات دفاع */}
                      <button
                        type="button"
                        onClick={() => {
                          setIsDrawerOpen(false);
                          setActiveModal('defense_sessions');
                        }}
                        className={`w-full flex items-center gap-2.5 sm:gap-3.5 p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl border transition-all text-xs sm:text-sm font-bold text-right cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] shadow-sm ${
                          activeModal === 'defense_sessions'
                            ? 'bg-[var(--menu-active-bg)] text-[var(--menu-active-text)] border-[var(--menu-active-bg)]'
                            : 'bg-[var(--menu-item-bg)] hover:bg-[var(--menu-hover-bg)] text-[var(--menu-text)] border-[var(--menu-border)] hover:border-[var(--accent)]'
                        }`}
                      >
                        <div className={`p-2 sm:p-2.5 rounded-xl border group-hover:scale-105 transition-transform ${
                          activeModal === 'defense_sessions'
                            ? 'bg-white/20 border-white/30 text-[var(--menu-active-text)]'
                            : 'bg-[var(--menu-icon-box-bg)] border-[var(--menu-icon-box-border)] text-[var(--menu-icon)]'
                        }`}>
                          <CalendarDays className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col">
                          <span>جلسات دفاع</span>
                          <span className={`text-[11px] sm:text-xs font-normal ${activeModal === 'defense_sessions' ? 'text-white/85' : 'text-[var(--menu-sub-text)]'}`}>زمان‌بندی و برنامه‌ریزی دفاع</span>
                        </div>
                      </button>

                      {/* 5. امور آموزش (آکاردئونی) */}
                      <div className="rounded-xl sm:rounded-2xl bg-[var(--menu-item-bg)] border border-[var(--menu-border)] shadow-sm overflow-hidden">
                        <button
                          type="button"
                          onClick={() => setIsEduOpen((prev) => !prev)}
                          className="w-full flex items-center justify-between p-2.5 sm:p-3.5 hover:bg-[var(--menu-hover-bg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] transition-all text-xs sm:text-sm font-bold text-[var(--menu-text)] text-right cursor-pointer group"
                        >
                          <div className="flex items-center gap-2.5 sm:gap-3.5">
                            <div className="p-2 sm:p-2.5 rounded-xl bg-[var(--menu-icon-box-bg)] border border-[var(--menu-icon-box-border)] text-[var(--menu-icon)] group-hover:scale-105 transition-transform">
                              <GraduationCap className="w-5 h-5" />
                            </div>
                            <div className="flex flex-col">
                              <span>امور آموزش</span>
                              <span className="text-[11px] sm:text-xs font-normal text-[var(--menu-sub-text)]">مدیریت گروه‌ها، رشته‌ها و کارمندان</span>
                            </div>
                          </div>
                          <ChevronDown
                            className={`w-4 h-4 text-[var(--menu-sub-text)] transition-transform duration-200 ${
                              isEduOpen ? 'rotate-180 text-[var(--menu-icon)]' : ''
                            }`}
                          />
                        </button>

                        {isEduOpen && (
                          <div className="px-3 pb-3 pt-1.5 space-y-1.5 border-t border-[var(--menu-border)]">
                            {([
                              ['edu_groups', 'گروه‌های آموزشی'],
                              ['edu_fields', 'رشته‌های تحصیلی'],
                              ['employee_register', 'ثبت نام کارمندان'],
                              ['employee_list', 'لیست کارمندان'],
                            ] as const).map(([modalKey, label]) => {
                              const isActive = activeModal === modalKey;
                              return (
                                <button
                                  key={modalKey}
                                  type="button"
                                  onClick={() => {
                                    setIsDrawerOpen(false);
                                    setActiveModal(modalKey);
                                  }}
                                  className={`w-full text-right px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl text-[11px] sm:text-xs font-semibold border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] transition-all cursor-pointer ${
                                    isActive
                                      ? 'bg-[var(--menu-active-bg)] text-[var(--menu-active-text)] border-[var(--menu-active-bg)]'
                                      : 'text-[var(--menu-text)] hover:bg-[var(--menu-hover-bg)] border-transparent hover:border-[var(--menu-border)]'
                                  }`}
                                >
                                  {label}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* 6. امور اساتید (آکاردئونی) */}
                      <div className="rounded-xl sm:rounded-2xl bg-[var(--menu-item-bg)] border border-[var(--menu-border)] shadow-sm overflow-hidden">
                        <button
                          type="button"
                          onClick={() => setIsProfOpen((prev) => !prev)}
                          className="w-full flex items-center justify-between p-2.5 sm:p-3.5 hover:bg-[var(--menu-hover-bg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] transition-all text-xs sm:text-sm font-bold text-[var(--menu-text)] text-right cursor-pointer group"
                        >
                          <div className="flex items-center gap-2.5 sm:gap-3.5">
                            <div className="p-2 sm:p-2.5 rounded-xl bg-[var(--menu-icon-box-bg)] border border-[var(--menu-icon-box-border)] text-[var(--menu-icon)] group-hover:scale-105 transition-transform">
                              <UserCheck className="w-5 h-5" />
                            </div>
                            <div className="flex flex-col">
                              <span>امور اساتید</span>
                              <span className="text-[11px] sm:text-xs font-normal text-[var(--menu-sub-text)]">مدیریت اساتید و دسترسی‌ها</span>
                            </div>
                          </div>
                          <ChevronDown
                            className={`w-4 h-4 text-[var(--menu-sub-text)] transition-transform duration-200 ${
                              isProfOpen ? 'rotate-180 text-[var(--menu-icon)]' : ''
                            }`}
                          />
                        </button>

                        {isProfOpen && (
                          <div className="px-3 pb-3 pt-1.5 space-y-1.5 border-t border-[var(--menu-border)]">
                            {([
                              ['professor_register', 'ثبت نام اساتید'],
                              ['professor_list', 'لیست اساتید'],
                              ['professor_access', 'سطح دسترسی اساتید'],
                              ['professor_theses', 'پایان‌نامه اساتید'],
                            ] as const).map(([modalKey, label]) => {
                              const isActive = activeModal === modalKey;
                              return (
                                <button
                                  key={modalKey}
                                  type="button"
                                  onClick={() => {
                                    setIsDrawerOpen(false);
                                    setActiveModal(modalKey);
                                  }}
                                  className={`w-full text-right px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl text-[11px] sm:text-xs font-semibold border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] transition-all cursor-pointer ${
                                    isActive
                                      ? 'bg-[var(--menu-active-bg)] text-[var(--menu-active-text)] border-[var(--menu-active-bg)]'
                                      : 'text-[var(--menu-text)] hover:bg-[var(--menu-hover-bg)] border-transparent hover:border-[var(--menu-border)]'
                                  }`}
                                >
                                  {label}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* 7. امور دانشجویان (آکاردئونی) */}
                      <div className="rounded-xl sm:rounded-2xl bg-[var(--menu-item-bg)] border border-[var(--menu-border)] shadow-sm overflow-hidden">
                        <button
                          type="button"
                          onClick={() => setIsStudentOpen((prev) => !prev)}
                          className="w-full flex items-center justify-between p-2.5 sm:p-3.5 hover:bg-[var(--menu-hover-bg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] transition-all text-xs sm:text-sm font-bold text-[var(--menu-text)] text-right cursor-pointer group"
                        >
                          <div className="flex items-center gap-2.5 sm:gap-3.5">
                            <div className="p-2 sm:p-2.5 rounded-xl bg-[var(--menu-icon-box-bg)] border border-[var(--menu-icon-box-border)] text-[var(--menu-icon)] group-hover:scale-105 transition-transform">
                              <Contact className="w-5 h-5" />
                            </div>
                            <div className="flex flex-col">
                              <span>امور دانشجویان</span>
                              <span className="text-[11px] sm:text-xs font-normal text-[var(--menu-sub-text)]">ثبت‌نام و مدیریت دانشجویان</span>
                            </div>
                          </div>
                          <ChevronDown
                            className={`w-4 h-4 text-[var(--menu-sub-text)] transition-transform duration-200 ${
                              isStudentOpen ? 'rotate-180 text-[var(--menu-icon)]' : ''
                            }`}
                          />
                        </button>

                        {isStudentOpen && (
                          <div className="px-3 pb-3 pt-1.5 space-y-1.5 border-t border-[var(--menu-border)]">
                            {([
                              ['student_bulk_register', 'ثبت نام اولیه (گروهی)'],
                              ['student_register', 'ثبت نام (انفرادی)'],
                              ['student_delete', 'حذف دانشجو'],
                              ['student_search', 'جستجوی دانشجو'],
                            ] as const).map(([modalKey, label]) => {
                              const isActive = activeModal === modalKey;
                              return (
                                <button
                                  key={modalKey}
                                  type="button"
                                  onClick={() => {
                                    setIsDrawerOpen(false);
                                    setActiveModal(modalKey);
                                  }}
                                  className={`w-full text-right px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl text-[11px] sm:text-xs font-semibold border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] transition-all cursor-pointer ${
                                    isActive
                                      ? 'bg-[var(--menu-active-bg)] text-[var(--menu-active-text)] border-[var(--menu-active-bg)]'
                                      : 'text-[var(--menu-text)] hover:bg-[var(--menu-hover-bg)] border-transparent hover:border-[var(--menu-border)]'
                                  }`}
                                >
                                  {label}
                                </button>
                              );
                            })}
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
                        className={`w-full flex items-center gap-2.5 sm:gap-3.5 p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl border transition-all text-xs sm:text-sm font-bold text-right cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] shadow-sm ${
                          activeModal === 'thesis_affairs'
                            ? 'bg-[var(--menu-active-bg)] text-[var(--menu-active-text)] border-[var(--menu-active-bg)]'
                            : 'bg-[var(--menu-item-bg)] hover:bg-[var(--menu-hover-bg)] text-[var(--menu-text)] border-[var(--menu-border)] hover:border-[var(--accent)]'
                        }`}
                      >
                        <div className={`p-2 sm:p-2.5 rounded-xl border group-hover:scale-105 transition-transform ${
                          activeModal === 'thesis_affairs'
                            ? 'bg-white/20 border-white/30 text-[var(--menu-active-text)]'
                            : 'bg-[var(--menu-icon-box-bg)] border-[var(--menu-icon-box-border)] text-[var(--menu-icon)]'
                        }`}>
                          <FolderKanban className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col">
                          <span>امور پایان‌نامه‌ها</span>
                          <span className={`text-[11px] sm:text-xs font-normal ${activeModal === 'thesis_affairs' ? 'text-white/85' : 'text-[var(--menu-sub-text)]'}`}>فرآیندها و تاییدیه‌های پایان‌نامه</span>
                        </div>
                      </button>

                      {/* 9. کاربران */}
                      <button
                        type="button"
                        onClick={() => {
                          setIsDrawerOpen(false);
                          setActiveModal('admin_users');
                        }}
                        className={`w-full flex items-center gap-2.5 sm:gap-3.5 p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl border transition-all text-xs sm:text-sm font-bold text-right cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] shadow-sm ${
                          activeModal === 'admin_users'
                            ? 'bg-[var(--menu-active-bg)] text-[var(--menu-active-text)] border-[var(--menu-active-bg)]'
                            : 'bg-[var(--menu-item-bg)] hover:bg-[var(--menu-hover-bg)] text-[var(--menu-text)] border-[var(--menu-border)] hover:border-[var(--accent)]'
                        }`}
                      >
                        <div className={`p-2 sm:p-2.5 rounded-xl border group-hover:scale-105 transition-transform ${
                          activeModal === 'admin_users'
                            ? 'bg-white/20 border-white/30 text-[var(--menu-active-text)]'
                            : 'bg-[var(--menu-icon-box-bg)] border-[var(--menu-icon-box-border)] text-[var(--menu-icon)]'
                        }`}>
                          <UserCog className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col">
                          <span>کاربران</span>
                          <span className={`text-[11px] sm:text-xs font-normal ${activeModal === 'admin_users' ? 'text-white/85' : 'text-[var(--menu-sub-text)]'}`}>مدیریت حساب‌ها و دسترسی‌ها</span>
                        </div>
                      </button>

                      {/* 11. تنظیمات */}
                      <button
                        type="button"
                        onClick={() => {
                          setIsDrawerOpen(false);
                          setActiveModal('settings');
                        }}
                        className={`w-full flex items-center gap-2.5 sm:gap-3.5 p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl border transition-all text-xs sm:text-sm font-bold text-right cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] shadow-sm ${
                          activeModal === 'settings'
                            ? 'bg-[var(--menu-active-bg)] text-[var(--menu-active-text)] border-[var(--menu-active-bg)]'
                            : 'bg-[var(--menu-item-bg)] hover:bg-[var(--menu-hover-bg)] text-[var(--menu-text)] border-[var(--menu-border)] hover:border-[var(--accent)]'
                        }`}
                      >
                        <div className={`p-2 sm:p-2.5 rounded-xl border group-hover:scale-105 transition-transform ${
                          activeModal === 'settings'
                            ? 'bg-white/20 border-white/30 text-[var(--menu-active-text)]'
                            : 'bg-[var(--menu-icon-box-bg)] border-[var(--menu-icon-box-border)] text-[var(--menu-icon-muted)]'
                        }`}>
                          <Settings className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col">
                          <span>تنظیمات</span>
                          <span className={`text-[11px] sm:text-xs font-normal ${activeModal === 'settings' ? 'text-white/85' : 'text-[var(--menu-sub-text)]'}`}>پیکربندی حساب و سامانه</span>
                        </div>
                      </button>

                      {/* 12. پیام‌ها */}
                      <button
                        type="button"
                        onClick={() => {
                          setIsDrawerOpen(false);
                          setActiveModal('chat');
                        }}
                        className={`w-full flex items-center gap-2.5 sm:gap-3.5 p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl border transition-all text-xs sm:text-sm font-bold text-right cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] shadow-sm ${
                          activeModal === 'chat'
                            ? 'bg-[var(--menu-active-bg)] text-[var(--menu-active-text)] border-[var(--menu-active-bg)]'
                            : 'bg-[var(--menu-item-bg)] hover:bg-[var(--menu-hover-bg)] text-[var(--menu-text)] border-[var(--menu-border)] hover:border-[var(--accent)]'
                        }`}
                      >
                        <div className={`p-2 sm:p-2.5 rounded-xl border group-hover:scale-105 transition-transform ${
                          activeModal === 'chat'
                            ? 'bg-white/20 border-white/30 text-[var(--menu-active-text)]'
                            : 'bg-[var(--menu-icon-box-bg)] border-[var(--menu-icon-box-border)] text-[var(--menu-icon)]'
                        }`}>
                          <MessageSquare className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col">
                          <span>پیام‌ها</span>
                          <span className={`text-[11px] sm:text-xs font-normal ${activeModal === 'chat' ? 'text-white/85' : 'text-[var(--menu-sub-text)]'}`}>گفتگو و پیام‌های سامانه</span>
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
                          className={`w-full flex items-center justify-between p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl border transition-all cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] shadow-sm text-right ${
                            activeModal === 'profile'
                              ? 'bg-[var(--menu-active-bg)] text-[var(--menu-active-text)] border-[var(--menu-active-bg)]'
                              : 'bg-[var(--menu-item-bg)] hover:bg-[var(--menu-hover-bg)] text-[var(--menu-text)] border-[var(--menu-border)] hover:border-[var(--accent)]'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 sm:gap-3">
                            <UserAvatar size="sm" showStatus={settings.showOnlineStatus} />
                            <div className="flex flex-col text-right">
                              <span className="text-xs sm:text-sm font-bold">
                                {studentProfile.name || 'کاربر'}
                              </span>
                              {settings.showOnlineStatus && (
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                  <span className={`text-[11px] sm:text-xs font-medium ${activeModal === 'profile' ? 'text-white/85' : 'text-[var(--menu-sub-text)]'}`}>وضعیت: آنلاین</span>
                                </div>
                              )}
                            </div>
                          </div>
                          <span className={`text-xs font-semibold group-hover:underline ${activeModal === 'profile' ? 'text-[var(--menu-active-text)]' : 'text-[var(--menu-icon)]'}`}>مشاهده</span>
                        </button>
                      )}

                      <button
                        onClick={() => {
                          setIsDrawerOpen(false);
                          setActiveModal('analytics');
                        }}
                        className={`w-full flex items-center gap-2.5 sm:gap-3.5 p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl border transition-all text-xs sm:text-sm font-bold text-right cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] shadow-sm ${
                          activeModal === 'analytics'
                            ? 'bg-[var(--menu-active-bg)] text-[var(--menu-active-text)] border-[var(--menu-active-bg)]'
                            : 'bg-[var(--menu-item-bg)] hover:bg-[var(--menu-hover-bg)] text-[var(--menu-text)] border-[var(--menu-border)] hover:border-[var(--accent)]'
                        }`}
                      >
                        <div className={`p-2 sm:p-2.5 rounded-xl border group-hover:scale-105 transition-transform ${
                          activeModal === 'analytics'
                            ? 'bg-white/20 border-white/30 text-[var(--menu-active-text)]'
                            : 'bg-[var(--menu-icon-box-bg)] border-[var(--menu-icon-box-border)] text-[var(--menu-icon)]'
                        }`}>
                          <LayoutDashboard className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col">
                          <span>داشبورد</span>
                          <span className={`text-[11px] sm:text-xs font-normal ${activeModal === 'analytics' ? 'text-white/85' : 'text-[var(--menu-sub-text)]'}`}>نمای کلی و برنامه‌ها</span>
                        </div>
                      </button>

                      <button
                        onClick={() => {
                          setIsDrawerOpen(false);
                          setActiveModal('analytics');
                        }}
                        className="w-full flex items-center gap-2.5 sm:gap-3.5 p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl bg-[var(--menu-item-bg)] hover:bg-[var(--menu-hover-bg)] border border-[var(--menu-border)] hover:border-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] transition-all text-xs sm:text-sm font-bold text-[var(--menu-text)] text-right cursor-pointer group shadow-sm"
                      >
                        <div className="p-2 sm:p-2.5 rounded-xl bg-[var(--menu-icon-box-bg)] border border-[var(--menu-icon-box-border)] text-[var(--menu-icon-alt)] group-hover:scale-105 transition-transform">
                          <TrendingUp className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col">
                          <span>آمار تحصیلی</span>
                          <span className="text-[11px] sm:text-xs font-normal text-[var(--menu-sub-text)]">گزارش‌ها و نمودارها</span>
                        </div>
                      </button>

                      <button
                        onClick={() => {
                          setIsDrawerOpen(false);
                          setActiveModal('settings');
                        }}
                        className={`w-full flex items-center gap-2.5 sm:gap-3.5 p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl border transition-all text-xs sm:text-sm font-bold text-right cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] shadow-sm ${
                          activeModal === 'settings'
                            ? 'bg-[var(--menu-active-bg)] text-[var(--menu-active-text)] border-[var(--menu-active-bg)]'
                            : 'bg-[var(--menu-item-bg)] hover:bg-[var(--menu-hover-bg)] text-[var(--menu-text)] border-[var(--menu-border)] hover:border-[var(--accent)]'
                        }`}
                      >
                        <div className={`p-2 sm:p-2.5 rounded-xl border group-hover:scale-105 transition-transform ${
                          activeModal === 'settings'
                            ? 'bg-white/20 border-white/30 text-[var(--menu-active-text)]'
                            : 'bg-[var(--menu-icon-box-bg)] border-[var(--menu-icon-box-border)] text-[var(--menu-icon-muted)]'
                        }`}>
                          <Settings className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col">
                          <span>تنظیمات</span>
                          <span className={`text-[11px] sm:text-xs font-normal ${activeModal === 'settings' ? 'text-white/85' : 'text-[var(--menu-sub-text)]'}`}>پیکربندی حساب و سامانه</span>
                        </div>
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Drawer Footer */}
              <div className="pt-3 sm:pt-4 border-t border-[var(--menu-border)] text-center text-[11px] sm:text-xs text-[var(--menu-sub-text)]">
                <p className="font-semibold text-[var(--menu-text)]">{instituteName}</p>
                <p className="mt-1 text-[11px] text-[var(--menu-sub-text)]">سامانه مدیریت دانشجویی - نسخه v2.0</p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
});

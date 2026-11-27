import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Bell,
  CheckCheck,
  Clock,
  FileText,
  Users,
  CalendarDays,
  UserPlus,
  Settings2,
  Loader2,
  Inbox,
  Megaphone,
  MessageSquare,
  Mail,
} from 'lucide-react';
import { AdminNotificationItem, AdminNotificationType } from '../types';

interface AdminNotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  bellButtonRef: React.RefObject<HTMLButtonElement | null>;
  notifications: AdminNotificationItem[];
  unreadCount: number;
  isLoading: boolean;
  isMarkingAll: boolean;
  onMarkAllRead: () => Promise<void>;
  onSelectNotification: (item: AdminNotificationItem) => Promise<void>;
  onOpenPublicAnnouncements: () => void;
  isRtlLayout: boolean;
}

const CATEGORY_META: Record<
  AdminNotificationType,
  {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badgeClass: string;
    iconBoxClass: string;
  }
> = {
  pending: {
    label: 'کارهای در انتظار',
    icon: Clock,
    badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    iconBoxClass: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  },
  theses: {
    label: 'پایان‌نامه‌ها',
    icon: FileText,
    badgeClass: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
    iconBoxClass: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
  },
  professors: {
    label: 'اساتید',
    icon: Users,
    badgeClass: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
    iconBoxClass: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
  },
  defense: {
    label: 'جلسات دفاع',
    icon: CalendarDays,
    badgeClass: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
    iconBoxClass: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
  },
  registrations: {
    label: 'ثبت‌نام‌ها',
    icon: UserPlus,
    badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    iconBoxClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  },
  system: {
    label: 'سیستم',
    icon: Settings2,
    badgeClass: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
    iconBoxClass: 'bg-slate-600/25 text-slate-200 border-slate-500/30',
  },
  sms: {
    label: 'پیامک',
    icon: MessageSquare,
    badgeClass: 'bg-[var(--status-info-bg)] text-[var(--status-info-text)] border-[var(--status-info-border)]',
    iconBoxClass: 'bg-[var(--status-info-bg)] text-[var(--status-info-text)] border-[var(--status-info-border)]',
  },
  email: {
    label: 'ایمیل',
    icon: Mail,
    badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    iconBoxClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  },
};

function toPersianDigits(val: number | string): string {
  const persian = '۰۱۲۳۴۵۶۷۸۹';
  return String(val).replace(/\d/g, (d) => persian[Number(d)] ?? d);
}

function formatRelativeTimeFa(isoString: string): string {
  const ts = Date.parse(isoString);
  if (isNaN(ts)) return '';
  const diffSec = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (diffSec < 60) return 'هم‌اکنون';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${toPersianDigits(diffMin)} دقیقه پیش`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${toPersianDigits(diffHours)} ساعت پیش`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'دیروز';
  if (diffDays < 7) return `${toPersianDigits(diffDays)} روز پیش`;
  try {
    return new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
      month: 'short',
      day: 'numeric',
    }).format(new Date(ts));
  } catch {
    return '';
  }
}

export const AdminNotificationCenter: React.FC<AdminNotificationCenterProps> = React.memo(
  ({
    isOpen,
    onClose,
    bellButtonRef,
    notifications,
    unreadCount,
    isLoading,
    isMarkingAll,
    onMarkAllRead,
    onSelectNotification,
    onOpenPublicAnnouncements,
    isRtlLayout,
  }) => {
    const [filter, setFilter] = useState<'all' | 'unread'>('all');
    const popoverRef = useRef<HTMLDivElement | null>(null);

    // Close on Escape key or outside click
    useEffect(() => {
      if (!isOpen) return;

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };

      const handlePointerDown = (e: MouseEvent | TouchEvent) => {
        const target = e.target as Node | null;
        if (!target) return;
        if (popoverRef.current?.contains(target)) return;
        if (bellButtonRef.current?.contains(target)) return;
        onClose();
      };

      window.addEventListener('keydown', handleKeyDown);
      document.addEventListener('mousedown', handlePointerDown);
      document.addEventListener('touchstart', handlePointerDown);

      return () => {
        window.removeEventListener('keydown', handleKeyDown);
        document.removeEventListener('mousedown', handlePointerDown);
        document.removeEventListener('touchstart', handlePointerDown);
      };
    }, [isOpen, onClose, bellButtonRef]);

    const filteredNotifications = useMemo(() => {
      if (filter === 'unread') {
        return notifications.filter((item) => !item.isRead);
      }
      return notifications;
    }, [notifications, filter]);

    return (
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={popoverRef}
            dir="rtl"
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
            className={`fixed inset-x-2 top-[calc(var(--vv-top,0px)+54px)] sm:inset-x-auto sm:absolute sm:top-full sm:mt-2 ${
              isRtlLayout ? 'sm:left-6 sm:right-auto' : 'sm:right-6 sm:left-auto'
            } sm:w-[390px] max-w-[calc(100vw-16px)] max-h-[calc(var(--vvh,100dvh)-70px)] bg-[var(--surface)] border border-[var(--border)] rounded-xl sm:rounded-2xl shadow-2xl text-right text-[var(--text)] z-[var(--z-toast)] flex flex-col overflow-hidden`}
          >
            {/* Header */}
            <div className="px-3 py-2.5 sm:px-4 sm:py-3 border-b border-[var(--border)] bg-[var(--surface-header)] flex items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <Bell className="w-4 h-4 text-[var(--accent)] shrink-0" />
                <h3 className="text-xs sm:text-sm font-bold text-[var(--text)] truncate">اعلان‌ها</h3>
                {unreadCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-[var(--menu-pill-badge-bg)] text-[var(--menu-pill-badge-text)] border border-[var(--menu-pill-badge-border)] text-[10px] font-bold shrink-0">
                    {toPersianDigits(unreadCount)} خوانده‌نشده
                  </span>
                )}
              </div>

              <button
                type="button"
                disabled={unreadCount === 0 || isMarkingAll}
                onClick={onMarkAllRead}
                className="text-[11px] font-semibold text-[var(--ok)] hover:opacity-80 disabled:opacity-45 disabled:cursor-not-allowed flex items-center gap-1 transition-opacity cursor-pointer shrink-0"
              >
                {isMarkingAll ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <CheckCheck className="w-3.5 h-3.5" />
                )}
                <span>علامت‌گذاری همه به عنوان خوانده‌شده</span>
              </button>
            </div>

            {/* Filter Bar + Create Announcement Action */}
            <div className="px-3 py-2 sm:px-4 border-b border-[var(--border-subtle)] bg-[var(--surface-sub)] flex flex-wrap items-center justify-between gap-1.5 shrink-0">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setFilter('all')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                    filter === 'all'
                      ? 'bg-[var(--menu-active-bg)] text-[var(--menu-active-text)] border border-[var(--menu-active-bg)]'
                      : 'text-[var(--text-2)] hover:text-[var(--text)] hover:bg-[var(--menu-hover-bg)] border border-transparent'
                  }`}
                >
                  همه ({toPersianDigits(notifications.length)})
                </button>
                <button
                  type="button"
                  onClick={() => setFilter('unread')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                    filter === 'unread'
                      ? 'bg-[var(--status-red-bg)] text-[var(--status-red-text)] border border-[var(--status-red-border)]'
                      : 'text-[var(--text-2)] hover:text-[var(--text)] hover:bg-[var(--menu-hover-bg)] border border-transparent'
                  }`}
                >
                  خوانده‌نشده ({toPersianDigits(unreadCount)})
                </button>
              </div>

              <button
                type="button"
                onClick={onOpenPublicAnnouncements}
                className="px-2.5 py-1 rounded-lg bg-[var(--status-info-bg)] hover:opacity-90 text-[var(--status-info-text)] border border-[var(--status-info-border)] text-[11px] font-bold flex items-center gap-1 transition-opacity cursor-pointer shrink-0"
              >
                <Megaphone className="w-3 h-3 shrink-0" />
                <span>+ ارسال اطلاعیه‌ی جدید</span>
              </button>
            </div>

            {/* Scrollable Notifications List */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden p-2 sm:p-2.5 space-y-1.5">
              {isLoading && notifications.length === 0 ? (
                <div className="py-10 flex flex-col items-center justify-center gap-2 text-[var(--text-2)] text-xs">
                  <Loader2 className="w-5 h-5 animate-spin text-[var(--accent)]" />
                  <span>در حال بارگذاری اعلان‌ها...</span>
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="py-10 flex flex-col items-center justify-center gap-2 text-[var(--text-2)] text-xs">
                  <Inbox className="w-7 h-7 text-[var(--text-muted)]" />
                  <span className="font-semibold text-[var(--text-strong)]">اعلان جدیدی ندارید</span>
                </div>
              ) : (
                filteredNotifications.map((item) => {
                  const meta = CATEGORY_META[item.type] || CATEGORY_META.system;
                  const Icon = meta.icon;
                  const relTime = formatRelativeTimeFa(item.createdAt);

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => onSelectNotification(item)}
                      className={`w-full text-right p-2.5 rounded-xl border transition-all cursor-pointer flex items-start gap-2.5 group ${
                        item.isRead
                          ? 'bg-[var(--surface-item)] border-[var(--border-subtle)] hover:bg-[var(--menu-hover-bg)] hover:border-[var(--border)] text-[var(--text-2)]'
                          : 'bg-[var(--surface-2)] border-[var(--accent)]/40 hover:border-[var(--accent)] text-[var(--text)] shadow-sm'
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 ${meta.iconBoxClass}`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold truncate flex items-center gap-1.5">
                            {!item.isRead && (
                              <span className="w-1.5 h-1.5 rounded-full bg-[var(--danger)] shrink-0 inline-block" />
                            )}
                            <span className="truncate">{item.title}</span>
                          </span>
                          {relTime && (
                            <span className="text-[10px] text-[var(--text-muted)] shrink-0">{relTime}</span>
                          )}
                        </div>

                        <p className="text-[11px] text-[var(--text-2)] mt-0.5 leading-relaxed line-clamp-2">
                          {item.body}
                        </p>

                        <div className="mt-1.5 flex items-center justify-between gap-2">
                          <span
                            className={`inline-flex items-center px-1.5 py-0.5 rounded-md border text-[10px] font-semibold ${meta.badgeClass}`}
                          >
                            {meta.label}
                          </span>
                          {item.targetModal && (
                            <span className="text-[10px] text-[var(--accent)] opacity-85 group-hover:opacity-100">
                              مشاهده بخش ←
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }
);

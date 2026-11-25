import React, { useEffect, useState, useCallback, useRef } from 'react';
import { motion } from 'motion/react';
import {
  Users,
  UserCheck,
  Briefcase,
  FileText,
  Clock,
  MessageSquare,
  CheckCircle2,
  CalendarDays,
  History,
  Zap,
  GraduationCap,
  Layers,
  UserPlus,
} from 'lucide-react';
import { api, type AdminOverviewResponse, type AdminOverviewActivity } from '../lib/api';
import { useI18n, useLayoutSettings, useModalActions, useModalState, useToastActions } from '../context/DashboardContext';

const emptyOverview: AdminOverviewResponse = {
  stats: {
    studentsCount: 0,
    professorsCount: 0,
    employeesCount: 0,
    activeThesesCount: 0,
  },
  pending: {
    pendingRequestsCount: 0,
    unreadMessagesCount: 0,
  },
  defenseSessions: [],
  recentActivities: [],
};

export const AdminDashboardOverview: React.FC = React.memo(() => {
  const { language } = useI18n();
  const { isCompactFrame } = useLayoutSettings();
  const { setActiveModal } = useModalActions();
  const { activeModal } = useModalState();
  const { showToast } = useToastActions();

  const [overview, setOverview] = useState<AdminOverviewResponse>(emptyOverview);
  const [isLoading, setIsLoading] = useState(true);
  const prevModalRef = useRef(activeModal);

  const isFa = language === 'fa';

  const formatNumber = (val: number) => {
    const safeVal = Number.isFinite(val) ? val : 0;
    return isFa ? safeVal.toLocaleString('fa-IR') : safeVal.toLocaleString('en-US');
  };

  const formatActivityDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      if (isNaN(date.getTime())) return '';
      return isFa
        ? new Intl.DateTimeFormat('fa-IR', {
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
          }).format(date)
        : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  const loadOverview = useCallback(
    async (silent = false) => {
      if (!silent) setIsLoading(true);
      try {
        const data = await api.getAdminOverview();
        setOverview({
          stats: {
            studentsCount: data?.stats?.studentsCount ?? 0,
            professorsCount: data?.stats?.professorsCount ?? 0,
            employeesCount: data?.stats?.employeesCount ?? 0,
            activeThesesCount: data?.stats?.activeThesesCount ?? 0,
          },
          pending: {
            pendingRequestsCount: data?.pending?.pendingRequestsCount ?? 0,
            unreadMessagesCount: data?.pending?.unreadMessagesCount ?? 0,
          },
          defenseSessions: Array.isArray(data?.defenseSessions) ? data.defenseSessions : [],
          recentActivities: Array.isArray(data?.recentActivities) ? data.recentActivities.slice(0, 5) : [],
        });
      } catch (err: any) {
        if (!silent) {
          showToast(err?.message || (isFa ? 'خطا در دریافت آمار مدیریت' : 'Failed to load admin overview'));
        }
      } finally {
        if (!silent) setIsLoading(false);
      }
    },
    [isFa, showToast]
  );

  useEffect(() => {
    loadOverview(false);
  }, [loadOverview]);

  // Refresh overview whenever an admin modal closes so newly added records reflect immediately
  useEffect(() => {
    if (prevModalRef.current !== null && activeModal === null) {
      loadOverview(true);
    }
    prevModalRef.current = activeModal;
  }, [activeModal, loadOverview]);

  // Refresh overview when clicking کارتابل in Drawer
  useEffect(() => {
    const handleRefresh = () => {
      loadOverview(false);
    };
    window.addEventListener('admin-overview-refresh', handleRefresh);
    return () => window.removeEventListener('admin-overview-refresh', handleRefresh);
  }, [loadOverview]);

  const statCards = [
    {
      id: 'students',
      label: isFa ? 'دانشجویان' : 'Students',
      value: overview.stats.studentsCount,
      icon: GraduationCap,
      borderColor: 'border-[var(--dash-sky-border)] hover:border-[var(--dash-sky-border-hover)]',
      iconBg: 'bg-[var(--dash-sky-bg)] border-[var(--dash-sky-border)] text-[var(--dash-sky-text)]',
      valueColor: 'text-[var(--dash-sky-text)]',
    },
    {
      id: 'professors',
      label: isFa ? 'اساتید' : 'Professors',
      value: overview.stats.professorsCount,
      icon: UserCheck,
      borderColor: 'border-[var(--dash-indigo-border)] hover:border-[var(--dash-indigo-border-hover)]',
      iconBg: 'bg-[var(--dash-indigo-bg)] border-[var(--dash-indigo-border)] text-[var(--dash-indigo-text)]',
      valueColor: 'text-[var(--dash-indigo-text)]',
    },
    {
      id: 'employees',
      label: isFa ? 'کارمندان' : 'Employees',
      value: overview.stats.employeesCount,
      icon: Briefcase,
      borderColor: 'border-[var(--dash-emerald-border)] hover:border-[var(--dash-emerald-border-hover)]',
      iconBg: 'bg-[var(--dash-emerald-bg)] border-[var(--dash-emerald-border)] text-[var(--dash-emerald-text)]',
      valueColor: 'text-[var(--dash-emerald-text)]',
    },
    {
      id: 'theses',
      label: isFa ? 'پایان‌نامه‌های فعال' : 'Active Theses',
      value: overview.stats.activeThesesCount,
      icon: FileText,
      borderColor: 'border-[var(--dash-amber-border)] hover:border-[var(--dash-amber-border-hover)]',
      iconBg: 'bg-[var(--dash-amber-bg)] border-[var(--dash-amber-border)] text-[var(--dash-amber-text)]',
      valueColor: 'text-[var(--dash-amber-text)]',
    },
  ];

  const getActivityBadge = (type: AdminOverviewActivity['type']) => {
    switch (type) {
      case 'employee':
        return { icon: Briefcase, cls: 'bg-[var(--dash-emerald-bg)] text-[var(--dash-emerald-text)] border-[var(--dash-emerald-border)]' };
      case 'professor':
        return { icon: UserCheck, cls: 'bg-[var(--dash-indigo-bg)] text-[var(--dash-indigo-text)] border-[var(--dash-indigo-border)]' };
      case 'student':
        return { icon: Users, cls: 'bg-[var(--dash-sky-bg)] text-[var(--dash-sky-text)] border-[var(--dash-sky-border)]' };
      case 'thesis':
        return { icon: FileText, cls: 'bg-[var(--dash-indigo-bg)] text-[var(--dash-indigo-text)] border-[var(--dash-indigo-border)]' };
      case 'defense_session':
        return { icon: CalendarDays, cls: 'bg-[var(--dash-sky-bg)] text-[var(--dash-sky-text)] border-[var(--dash-sky-border)]' };
      case 'edu_group':
      default:
        return { icon: Layers, cls: 'bg-[var(--dash-amber-bg)] text-[var(--dash-amber-text)] border-[var(--dash-amber-border)]' };
    }
  };

  const totalPending = overview.pending.pendingRequestsCount + overview.pending.unreadMessagesCount;

  return (
    <div className="flex flex-col gap-2.5 sm:gap-5 w-full min-w-0">
      {/* 2) ردیف کارت‌های آمار */}
      <div className={`grid grid-cols-2 ${isCompactFrame ? '' : 'lg:grid-cols-4'} gap-2 sm:gap-4`}>
        {statCards.map((card, index) => {
          const IconComponent = card.icon;
          return (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.05 * index }}
              className={`bg-[var(--surface-2)]/85 border ${card.borderColor} rounded-xl sm:rounded-3xl p-[12px] sm:p-4 shadow-xl transition-all flex items-center justify-between gap-2 min-w-0`}
            >
              <div className="flex flex-col min-w-0">
                <span className="text-[11px] sm:text-xs font-semibold text-[var(--text-2)] truncate">
                  {card.label}
                </span>
                <span className={`text-lg sm:text-2xl font-extrabold mt-0.5 sm:mt-1 leading-tight ${card.valueColor}`}>
                  {isLoading ? '…' : formatNumber(card.value)}
                </span>
              </div>
              <div className={`w-8 h-8 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl border flex items-center justify-center shrink-0 ${card.iconBg}`}>
                <IconComponent className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* 3) کارت «کارهای در انتظار» و 4) کارت «جلسات دفاع این هفته» */}
      <div className={`grid grid-cols-1 ${isCompactFrame ? '' : 'md:grid-cols-2'} gap-2.5 sm:gap-5`}>
        {/* 3) کارهای در انتظار */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.12 }}
          className="bg-[var(--surface-2)]/85 border border-[var(--dash-indigo-border)] rounded-xl sm:rounded-3xl p-[12px] sm:p-5 shadow-xl hover:border-[var(--dash-indigo-border-hover)] transition-all flex flex-col justify-between min-w-0"
        >
          <div>
            <div className="flex items-center justify-between pb-2.5 mb-2.5 sm:pb-3 sm:mb-4 border-b border-[var(--border)] gap-2">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-[var(--dash-indigo-bg)] border border-[var(--dash-indigo-border)] flex items-center justify-center text-[var(--dash-indigo-text)] shrink-0">
                  <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-[13px] sm:text-base font-bold text-[var(--text)] truncate">
                    {isFa ? 'کارهای در انتظار' : 'Pending Tasks'}
                  </h3>
                  <p className="text-[11px] text-[var(--text-2)] truncate">
                    {isFa ? 'وضعیت درخواست‌ها و پیام‌های دریافتی' : 'Pending approvals and unread messages'}
                  </p>
                </div>
              </div>
              <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 bg-[var(--dash-indigo-bg)] text-[var(--dash-indigo-text)] border border-[var(--dash-indigo-border)] rounded-full text-[11px] sm:text-xs font-bold shrink-0">
                {formatNumber(totalPending)} {isFa ? 'مورد' : 'items'}
              </span>
            </div>

            <div className="space-y-1.5 sm:space-y-2.5">
              <div className="w-full min-h-[36px] px-2.5 py-2 sm:p-3 rounded-xl sm:rounded-2xl bg-[var(--surface-item)] border border-[var(--border-subtle)] text-xs font-semibold text-[var(--text-strong)] flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                  <CheckCircle2 className="w-4 h-4 text-[var(--dash-indigo-text)] shrink-0" />
                  <span className="text-[11.5px] sm:text-xs truncate">
                    {isFa ? 'درخواست‌های منتظر تأیید' : 'Requests pending approval'}
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded-lg bg-[var(--dash-indigo-bg)] border border-[var(--dash-indigo-border)] text-[var(--dash-indigo-text)] text-[11px] font-bold shrink-0">
                  {formatNumber(overview.pending.pendingRequestsCount)}
                </span>
              </div>

              <div className="w-full min-h-[36px] px-2.5 py-2 sm:p-3 rounded-xl sm:rounded-2xl bg-[var(--surface-item)] border border-[var(--border-subtle)] text-xs font-semibold text-[var(--text-strong)] flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                  <MessageSquare className="w-4 h-4 text-[var(--dash-sky-text)] shrink-0" />
                  <span className="text-[11.5px] sm:text-xs truncate">
                    {isFa ? 'پیام‌های خوانده‌نشده' : 'Unread messages'}
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded-lg bg-[var(--dash-sky-bg)] border border-[var(--dash-sky-border)] text-[var(--dash-sky-text)] text-[11px] font-bold shrink-0">
                  {formatNumber(overview.pending.unreadMessagesCount)}
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* 4) جلسات دفاع این هفته */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.16 }}
          className="bg-[var(--surface-2)]/85 border border-[var(--dash-sky-border)] rounded-xl sm:rounded-3xl p-[12px] sm:p-5 shadow-xl hover:border-[var(--dash-sky-border-hover)] transition-all flex flex-col justify-between min-w-0"
        >
          <div>
            <div className="flex items-center justify-between pb-2.5 mb-2.5 sm:pb-3 sm:mb-4 border-b border-[var(--border)] gap-2">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-[var(--dash-sky-bg)] border border-[var(--dash-sky-border)] flex items-center justify-center text-[var(--dash-sky-text)] shrink-0">
                  <CalendarDays className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-[13px] sm:text-base font-bold text-[var(--text)] truncate">
                    {isFa ? 'جلسات دفاع این هفته' : 'Defense Sessions This Week'}
                  </h3>
                  <p className="text-[11px] text-[var(--text-2)] truncate">
                    {isFa ? 'خلاصه زمان‌بندی جلسات دفاع پیش‌رو' : 'Upcoming weekly defense schedule'}
                  </p>
                </div>
              </div>
              <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 bg-[var(--dash-sky-bg)] text-[var(--dash-sky-text)] border border-[var(--dash-sky-border)] rounded-full text-[11px] sm:text-xs font-bold shrink-0">
                {formatNumber(overview.defenseSessions.length)} {isFa ? 'جلسه' : 'sessions'}
              </span>
            </div>

            {overview.defenseSessions.length === 0 ? (
              <div className="px-3 py-4 sm:py-6 rounded-xl sm:rounded-2xl bg-[var(--surface-item)] border border-[var(--border-subtle)] flex items-center justify-center text-center">
                <span className="text-[11.5px] sm:text-xs font-semibold text-[var(--text-2)]">
                  {isFa ? 'جلسه‌ای ثبت نشده' : 'No defense sessions registered'}
                </span>
              </div>
            ) : (
              <div className="space-y-1.5 sm:space-y-2">
                {overview.defenseSessions.slice(0, 4).map((session) => (
                  <div
                    key={session.id}
                    className="px-2.5 py-2 sm:p-3 rounded-xl sm:rounded-2xl bg-[var(--surface-item)] border border-[var(--border-subtle)] flex items-center justify-between gap-2 min-w-0"
                  >
                    <div className="min-w-0">
                      <div className="text-[11.5px] sm:text-xs font-bold text-[var(--text)] truncate">{session.title}</div>
                      <div className="text-[10.5px] sm:text-[11px] text-[var(--text-2)] truncate">
                        {session.studentName}{session.location ? ` • ${session.location}` : ''}
                      </div>
                    </div>
                    <span className="text-[10.5px] sm:text-[11px] font-semibold text-[var(--dash-sky-text)] shrink-0 dir-ltr">
                      {session.dateTime}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* 5) کارت «آخرین فعالیت‌ها» */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="bg-[var(--surface-2)]/85 border border-[var(--dash-emerald-border)] rounded-xl sm:rounded-3xl p-[12px] sm:p-5 shadow-xl hover:border-[var(--dash-emerald-border-hover)] transition-all min-w-0"
      >
        <div className="flex items-center justify-between pb-2.5 mb-2.5 sm:pb-3 sm:mb-4 border-b border-[var(--border)] gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-[var(--dash-emerald-bg)] border border-[var(--dash-emerald-border)] flex items-center justify-center text-[var(--dash-emerald-text)] shrink-0">
              <History className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-[13px] sm:text-base font-bold text-[var(--text)] truncate">
                {isFa ? 'آخرین فعالیت‌ها' : 'Recent Activities'}
              </h3>
              <p className="text-[11px] text-[var(--text-2)] truncate">
                {isFa ? '۵ مورد آخر ثبت‌شده در سامانه' : 'Last 5 recorded actions'}
              </p>
            </div>
          </div>
          <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 bg-[var(--dash-emerald-bg)] text-[var(--dash-emerald-text)] border border-[var(--dash-emerald-border)] rounded-full text-[11px] sm:text-xs font-bold shrink-0">
            {formatNumber(overview.recentActivities.length)} {isFa ? 'مورد' : 'items'}
          </span>
        </div>

        {overview.recentActivities.length === 0 ? (
          <div className="px-3 py-4 rounded-xl sm:rounded-2xl bg-[var(--surface-item)] border border-[var(--border-subtle)] text-center text-[11.5px] sm:text-xs text-[var(--text-2)]">
            {isFa ? 'فعلاً فعالیتی ثبت نشده است' : 'No recent activities yet'}
          </div>
        ) : (
          <div className="space-y-1.5 sm:space-y-2">
            {overview.recentActivities.map((activity) => {
              const badge = getActivityBadge(activity.type);
              const ActivityIcon = badge.icon;
              return (
                <div
                  key={`${activity.type}-${activity.id}`}
                  className="px-2.5 py-2 sm:p-3 rounded-xl sm:rounded-2xl bg-[var(--surface-item)] border border-[var(--border-subtle)] flex items-center justify-between gap-2 min-w-0"
                >
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl border flex items-center justify-center shrink-0 ${badge.cls}`}>
                      <ActivityIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[11.5px] sm:text-xs font-bold text-[var(--text)] truncate">
                        {activity.title}
                      </div>
                      <div className="text-[10.5px] sm:text-[11px] text-[var(--text-2)] truncate">
                        {activity.subtitle}
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] sm:text-[11px] text-[var(--text-2)] shrink-0 dir-ltr">
                    {formatActivityDate(activity.createdAt)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* 6) کارت «دسترسی سریع» */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.24 }}
        className="bg-[var(--surface-2)]/85 border border-[var(--dash-amber-border)] rounded-xl sm:rounded-3xl p-[12px] sm:p-5 shadow-xl hover:border-[var(--dash-amber-border-hover)] transition-all min-w-0"
      >
        <div className="flex items-center justify-between pb-2.5 mb-2.5 sm:pb-3 sm:mb-4 border-b border-[var(--border)] gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-[var(--dash-amber-bg)] border border-[var(--dash-amber-border)] flex items-center justify-center text-[var(--dash-amber-text)] shrink-0">
              <Zap className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-[13px] sm:text-base font-bold text-[var(--text)] truncate">
                {isFa ? 'دسترسی سریع' : 'Quick Actions'}
              </h3>
              <p className="text-[11px] text-[var(--text-2)] truncate">
                {isFa ? 'ثبت سریع اطلاعات پایه در سامانه' : 'Quickly create new records'}
              </p>
            </div>
          </div>
        </div>

        <div className={`grid grid-cols-2 ${isCompactFrame ? '' : 'sm:grid-cols-4'} gap-2 sm:gap-3`}>
          <button
            type="button"
            onClick={() => setActiveModal('employee_register')}
            className="min-h-[36px] sm:min-h-[42px] px-2.5 py-2 sm:px-3.5 sm:py-2.5 rounded-xl sm:rounded-2xl bg-[var(--surface-item)] hover:bg-[var(--dash-emerald-bg-hover)] border border-[var(--border)] hover:border-[var(--dash-emerald-border-hover)] text-[11.5px] sm:text-xs font-bold text-[var(--text-strong)] hover:text-[var(--text)] flex items-center justify-center gap-1.5 transition-all cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
          >
            <Briefcase className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[var(--dash-emerald-text)] shrink-0" />
            <span className="truncate">{isFa ? '+ کارمند جدید' : '+ New Employee'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveModal('professor_register')}
            className="min-h-[36px] sm:min-h-[42px] px-2.5 py-2 sm:px-3.5 sm:py-2.5 rounded-xl sm:rounded-2xl bg-[var(--surface-item)] hover:bg-[var(--dash-indigo-bg-hover)] border border-[var(--border)] hover:border-[var(--dash-indigo-border-hover)] text-[11.5px] sm:text-xs font-bold text-[var(--text-strong)] hover:text-[var(--text)] flex items-center justify-center gap-1.5 transition-all cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
          >
            <UserCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[var(--dash-indigo-text)] shrink-0" />
            <span className="truncate">{isFa ? '+ استاد جدید' : '+ New Professor'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveModal('student_register')}
            className="min-h-[36px] sm:min-h-[42px] px-2.5 py-2 sm:px-3.5 sm:py-2.5 rounded-xl sm:rounded-2xl bg-[var(--surface-item)] hover:bg-[var(--dash-sky-bg-hover)] border border-[var(--border)] hover:border-[var(--dash-sky-border-hover)] text-[11.5px] sm:text-xs font-bold text-[var(--text-strong)] hover:text-[var(--text)] flex items-center justify-center gap-1.5 transition-all cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
          >
            <UserPlus className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[var(--dash-sky-text)] shrink-0" />
            <span className="truncate">{isFa ? '+ دانشجوی جدید' : '+ New Student'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveModal('edu_groups')}
            className="min-h-[36px] sm:min-h-[42px] px-2.5 py-2 sm:px-3.5 sm:py-2.5 rounded-xl sm:rounded-2xl bg-[var(--surface-item)] hover:bg-[var(--dash-amber-bg-hover)] border border-[var(--border)] hover:border-[var(--dash-amber-border-hover)] text-[11.5px] sm:text-xs font-bold text-[var(--text-strong)] hover:text-[var(--text)] flex items-center justify-center gap-1.5 transition-all cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
          >
            <Layers className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[var(--dash-amber-text)] shrink-0" />
            <span className="truncate">{isFa ? '+ گروه آموزشی' : '+ Edu Group'}</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
});

import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { CalendarDays, BookOpen, RefreshCw, FileCheck2, Clock } from 'lucide-react';
import { useI18n, useLayoutSettings } from '../context/DashboardContext';

export type CalendarEventCategory = 'classes' | 'add_drop' | 'exams';
export type CalendarEventStatus = 'passed' | 'active' | 'upcoming';

export interface AcademicCalendarEvent {
  id: string;
  category: CalendarEventCategory;
  status: CalendarEventStatus;
  titleFa: string;
  titleEn: string;
  dateFa: string;
  dateEn: string;
  noteFa: string;
  noteEn: string;
}

const STATIC_CALENDAR_EVENTS: AcademicCalendarEvent[] = [
  {
    id: 'cal-reg',
    category: 'add_drop',
    status: 'passed',
    titleFa: 'انتخاب واحد اصلی نیمسال',
    titleEn: 'Primary Course Registration',
    dateFa: '۱۵ تا ۲۲ شهریور ۱۴۰۵',
    dateEn: 'Sep 6 – Sep 13, 2026',
    noteFa: 'ثبت‌نام دروس بر اساس اولویت ورودی',
    noteEn: 'Course enrollment by cohort priority',
  },
  {
    id: 'cal-start',
    category: 'classes',
    status: 'passed',
    titleFa: 'شروع رسمی کلاس‌ها',
    titleEn: 'Start of Classes',
    dateFa: '۲۸ شهریور ۱۴۰۵',
    dateEn: 'Sep 19, 2026',
    noteFa: 'آغاز برگزاری تمامی کلاس‌های نظری و عملی',
    noteEn: 'All lectures and lab sessions begin',
  },
  {
    id: 'cal-add-drop',
    category: 'add_drop',
    status: 'active',
    titleFa: 'بازه حذف و اضافه',
    titleEn: 'Add & Drop Period',
    dateFa: '۵ تا ۱۰ مهر ۱۴۰۵',
    dateEn: 'Sep 27 – Oct 2, 2026',
    noteFa: 'امکان ویرایش و تغییر واحدهای اخذشده',
    noteEn: 'Modify or swap enrolled courses',
  },
  {
    id: 'cal-emergency-drop',
    category: 'add_drop',
    status: 'upcoming',
    titleFa: 'مهلت حذف اضطراری تک‌درس',
    titleEn: 'Emergency Course Drop',
    dateFa: '۵ تا ۹ آذر ۱۴۰۵',
    dateEn: 'Nov 26 – Nov 30, 2026',
    noteFa: 'حداکثر یک درس نظری با تأیید آموزش',
    noteEn: 'Single theoretical course via education office',
  },
  {
    id: 'cal-end-classes',
    category: 'classes',
    status: 'upcoming',
    titleFa: 'پایان کلاس‌های نیمسال',
    titleEn: 'End of Classes',
    dateFa: '۱۴ دی ۱۴۰۵',
    dateEn: 'Jan 4, 2027',
    noteFa: 'اتمام جلسات تدریس و صدور کارت امتحان',
    noteEn: 'Last day of instruction & exam card release',
  },
  {
    id: 'cal-final-exams',
    category: 'exams',
    status: 'upcoming',
    titleFa: 'برگزاری امتحانات پایان‌ترم',
    titleEn: 'Final Examinations',
    dateFa: '۲۰ دی تا ۴ بهمن ۱۴۰۵',
    dateEn: 'Jan 10 – Jan 24, 2027',
    noteFa: 'آزمون‌های نهایی مطابق برنامه مصوب',
    noteEn: 'Final exams per official schedule',
  },
  {
    id: 'cal-grades',
    category: 'exams',
    status: 'upcoming',
    titleFa: 'اعلام و مهلت اعتراض به نمرات',
    titleEn: 'Grade Posting & Appeals',
    dateFa: '۶ تا ۱۵ بهمن ۱۴۰۵',
    dateEn: 'Jan 26 – Feb 4, 2027',
    noteFa: 'ثبت اعتراض از طریق کارنامه‌ی ترمی',
    noteEn: 'Submit grade review via term transcript',
  },
];

type FilterTab = 'all' | CalendarEventCategory;

export const AcademicCalendarWidget: React.FC = React.memo(() => {
  const { language } = useI18n();
  const { isCompactFrame } = useLayoutSettings();
  const isFa = language === 'fa';

  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');

  const filteredEvents = useMemo(() => {
    if (activeFilter === 'all') return STATIC_CALENDAR_EVENTS;
    return STATIC_CALENDAR_EVENTS.filter((item) => item.category === activeFilter);
  }, [activeFilter]);

  const filterTabs: Array<{ id: FilterTab; labelFa: string; labelEn: string }> = [
    { id: 'all', labelFa: 'همه', labelEn: 'All' },
    { id: 'classes', labelFa: 'کلاس‌ها', labelEn: 'Classes' },
    { id: 'add_drop', labelFa: 'حذف و اضافه', labelEn: 'Add/Drop' },
    { id: 'exams', labelFa: 'امتحانات', labelEn: 'Exams' },
  ];

  const getCategoryIcon = (category: CalendarEventCategory) => {
    switch (category) {
      case 'classes':
        return <BookOpen className="w-4 h-4 text-[#38BDF8] shrink-0" />;
      case 'add_drop':
        return <RefreshCw className="w-4 h-4 text-[#818CF8] shrink-0" />;
      case 'exams':
        return <FileCheck2 className="w-4 h-4 text-[#F59E0B] shrink-0" />;
    }
  };

  const getStatusMeta = (status: CalendarEventStatus) => {
    switch (status) {
      case 'active':
        return {
          dotClass: 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.75)]',
          textClass: 'text-emerald-300',
          labelFa: 'در جریان',
          labelEn: 'Active Now',
        };
      case 'passed':
        return {
          dotClass: 'bg-slate-400/70',
          textClass: 'text-slate-400',
          labelFa: 'برگزار شده',
          labelEn: 'Completed',
        };
      case 'upcoming':
        return {
          dotClass: 'bg-sky-400',
          textClass: 'text-sky-300',
          labelFa: 'پیشِ رو',
          labelEn: 'Upcoming',
        };
    }
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.3 }}
      aria-label={isFa ? 'تقویم آموزشی' : 'Academic Calendar'}
      className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-xl sm:rounded-3xl p-[12px] sm:p-5 shadow-[var(--card-shadow)] transition-all"
    >
      {/* Header */}
      <div
        className={`flex flex-col ${
          isCompactFrame ? '' : 'sm:flex-row sm:items-center'
        } justify-between gap-2.5 pb-2.5 mb-2.5 sm:pb-3.5 sm:mb-4 border-b border-[var(--border)]`}
      >
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-[var(--status-info-bg)] border border-[var(--status-info-border)] flex items-center justify-center text-[var(--accent)] shrink-0">
            <CalendarDays className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h3 className="text-[15px] sm:text-base font-bold text-[var(--text)] truncate">
              {isFa ? 'تقویم آموزشی' : 'Academic Calendar'}
            </h3>
            <p className="text-[11px] text-[var(--text-2)] truncate">
              {isFa
                ? 'تاریخ‌های مهم نیمسال اول ۱۴۰۵-۱۴۰۶'
                : 'Key dates for Fall Semester 2026–2027'}
            </p>
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div
          role="tablist"
          aria-label={isFa ? 'فیلتر تقویم آموزشی' : 'Filter academic calendar'}
          className="flex items-center gap-1 p-1 rounded-xl bg-[var(--surface-item)] border border-[var(--border)] self-start sm:self-auto overflow-x-auto max-w-full"
        >
          {filterTabs.map((tab) => {
            const isSelected = activeFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isSelected}
                onClick={() => setActiveFilter(tab.id)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors whitespace-nowrap cursor-pointer ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-[var(--text-2)] hover:text-[var(--text)] hover:bg-white/5'
                }`}
              >
                {isFa ? tab.labelFa : tab.labelEn}
              </button>
            );
          })}
        </div>
      </div>

      {/* Calendar Milestones Grid */}
      <div
        className={`grid grid-cols-1 ${
          isCompactFrame ? 'gap-2' : 'md:grid-cols-2 gap-2 sm:gap-3'
        }`}
      >
        {filteredEvents.map((event) => {
          const statusMeta = getStatusMeta(event.status);
          return (
            <div
              key={event.id}
              className="px-3 py-2.5 sm:px-3.5 sm:py-3 rounded-xl sm:rounded-2xl bg-[var(--surface-item)] border border-[var(--border-subtle)] flex items-start justify-between gap-3 transition-colors"
            >
              <div className="flex items-start gap-2.5 min-w-0">
                <div className="mt-0.5 p-1.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] shrink-0">
                  {getCategoryIcon(event.category)}
                </div>

                <div className="min-w-0 space-y-0.5">
                  <h4 className="text-xs sm:text-[13px] font-bold text-[var(--text)] leading-snug">
                    {isFa ? event.titleFa : event.titleEn}
                  </h4>
                  <p className="text-[11px] text-[var(--text-2)] leading-relaxed">
                    {isFa ? event.noteFa : event.noteEn}
                  </p>
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[var(--accent)] pt-0.5">
                    <Clock className="w-3 h-3 shrink-0" />
                    <span>{isFa ? event.dateFa : event.dateEn}</span>
                  </div>
                </div>
              </div>

              {/* Unboxed Clean Status Indicator */}
              <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
                <span className={`w-2 h-2 rounded-full ${statusMeta.dotClass}`} />
                <span className={`text-[11px] font-bold ${statusMeta.textClass}`}>
                  {isFa ? statusMeta.labelFa : statusMeta.labelEn}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </motion.section>
  );
});

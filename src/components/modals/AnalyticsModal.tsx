import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BarChart3, X, Award, CheckCircle, Clock, BookOpen } from 'lucide-react';
import { useDashboard } from '../../context/DashboardContext';

export const AnalyticsModal: React.FC = () => {
  const { activeModal, closeModal, studentProfile } = useDashboard();

  if (activeModal !== 'analytics') return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 pb-[12vh] sm:pb-[8vh] bg-[var(--backdrop)] backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          className="w-full max-w-lg bg-[var(--surface)] border border-[var(--border-strong)] rounded-[28px] p-6 shadow-2xl text-[var(--text)] max-h-[85dvh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-[var(--border)]">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-[var(--dash-sky-bg)] text-[var(--dash-sky-text)] rounded-xl border border-[var(--dash-sky-border)]">
                <BarChart3 className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-[var(--text)]">کارنامه و آمار تحصیلی</h2>
                <p className="text-xs text-[var(--text-2)]">خلاصه وضعیت ترم جاری و کل دوره</p>
              </div>
            </div>
            <button
              onClick={closeModal}
              className="p-2 rounded-full hover:bg-[var(--surface-hover)] text-[var(--text-2)] hover:text-[var(--text)] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Stats Grid */}
          <div className="mt-5 grid grid-cols-2 gap-3">
            
            {/* Stat 1: GPA */}
            <div className="p-4 bg-[var(--surface-item)] rounded-2xl border border-[var(--border)] flex flex-col gap-1">
              <div className="flex items-center justify-between text-xs text-[var(--text-2)]">
                <span>معدل کل</span>
                <Award className="w-4 h-4 text-[var(--warn)]" />
              </div>
              <span className="text-2xl font-extrabold text-[var(--warn)] mt-1">{studentProfile.gpa}</span>
              <span className="text-[11px] text-[var(--ok)] font-medium">+۰.۳۵ افزایش نسبت به ترم قبل</span>
            </div>

            {/* Stat 2: Credits */}
            <div className="p-4 bg-[var(--surface-item)] rounded-2xl border border-[var(--border)] flex flex-col gap-1">
              <div className="flex items-center justify-between text-xs text-[var(--text-2)]">
                <span>واحد گذرانده</span>
                <BookOpen className="w-4 h-4 text-[var(--dash-sky-text)]" />
              </div>
              <span className="text-2xl font-extrabold text-[var(--dash-sky-text)] mt-1">
                {studentProfile.creditsPassed} <span className="text-xs text-[var(--text-2)] font-normal">/ {studentProfile.creditsTotal}</span>
              </span>
              <span className="text-[11px] text-[var(--text-2)] font-medium">۴۸٪ از کل دوره</span>
            </div>

            {/* Stat 3: Attendance */}
            <div className="p-4 bg-[var(--surface-item)] rounded-2xl border border-[var(--border)] flex flex-col gap-1">
              <div className="flex items-center justify-between text-xs text-[var(--text-2)]">
                <span>حضور در کلاس</span>
                <CheckCircle className="w-4 h-4 text-[var(--ok)]" />
              </div>
              <span className="text-2xl font-extrabold text-[var(--ok)] mt-1">۹۶٪</span>
              <span className="text-[11px] text-[var(--text-2)] font-medium">بدون غیبت غیرمجاز</span>
            </div>

            {/* Stat 4: Term */}
            <div className="p-4 bg-[var(--surface-item)] rounded-2xl border border-[var(--border)] flex flex-col gap-1">
              <div className="flex items-center justify-between text-xs text-[var(--text-2)]">
                <span>ترم فعلی</span>
                <Clock className="w-4 h-4 text-[var(--dash-indigo-text)]" />
              </div>
              <span className="text-lg font-bold text-[var(--text)] mt-2">ترم ۵</span>
              <span className="text-[11px] text-[var(--text-2)] font-medium">نیمسال اول ۱۴۰۵-۱۴۰۶</span>
            </div>

          </div>

          {/* Detailed Course Breakdown */}
          <div className="mt-5 space-y-2">
            <h3 className="text-sm font-bold text-[var(--text-strong)] mb-2">دروس نیمسال جاری:</h3>
            
            <div className="p-3 bg-[var(--surface-item)] rounded-xl border border-[var(--border)] flex items-center justify-between text-xs">
              <div>
                <span className="font-semibold text-[var(--text)] block">هوش مصنوعی</span>
                <span className="text-[var(--text-2)]">۳ واحد | دکتر علوی</span>
              </div>
              <span className="px-2.5 py-1 bg-[var(--status-green-bg)] text-[var(--status-green-text)] font-bold rounded-lg border border-[var(--status-green-border)]">
                ۱۹.۵
              </span>
            </div>

            <div className="p-3 bg-[var(--surface-item)] rounded-xl border border-[var(--border)] flex items-center justify-between text-xs">
              <div>
                <span className="font-semibold text-[var(--text)] block">ساختمان داده‌ها</span>
                <span className="text-[var(--text-2)]">۳ واحد | استاد رضایی</span>
              </div>
              <span className="px-2.5 py-1 bg-[var(--status-green-bg)] text-[var(--status-green-text)] font-bold rounded-lg border border-[var(--status-green-border)]">
                ۱۸.۰
              </span>
            </div>

            <div className="p-3 bg-[var(--surface-item)] rounded-xl border border-[var(--border)] flex items-center justify-between text-xs">
              <div>
                <span className="font-semibold text-[var(--text)] block">شبکه‌های کامپیوتر</span>
                <span className="text-[var(--text-2)]">۳ واحد | دکتر احمدی</span>
              </div>
              <span className="px-2.5 py-1 bg-[var(--status-amber-bg)] text-[var(--status-amber-text)] font-bold rounded-lg border border-[var(--status-amber-border)]">
                در حال ارزیابی
              </span>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-[var(--border)] flex justify-end">
            <button
              onClick={closeModal}
              className="px-5 py-2.5 bg-[var(--surface-2)] hover:bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--text-strong)] rounded-xl text-sm font-bold transition-colors cursor-pointer"
            >
              بستن
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

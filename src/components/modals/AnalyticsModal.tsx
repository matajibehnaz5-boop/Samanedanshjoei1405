import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BarChart3, X, Award, CheckCircle, Clock, BookOpen } from 'lucide-react';
import { useDashboard } from '../../context/DashboardContext';

export const AnalyticsModal: React.FC = () => {
  const { activeModal, closeModal, studentProfile } = useDashboard();

  if (activeModal !== 'analytics') return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 pb-[12vh] sm:pb-[8vh] bg-slate-950/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          className="w-full max-w-lg bg-[#1E293B] border border-slate-700/80 rounded-[28px] p-6 shadow-2xl text-slate-100 max-h-[85dvh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-700/60">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-sky-500/20 text-sky-400 rounded-xl border border-sky-500/30">
                <BarChart3 className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-100">کارنامه و آمار تحصیلی</h2>
                <p className="text-xs text-slate-400">خلاصه وضعیت ترم جاری و کل دوره</p>
              </div>
            </div>
            <button
              onClick={closeModal}
              className="p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Stats Grid */}
          <div className="mt-5 grid grid-cols-2 gap-3">
            
            {/* Stat 1: GPA */}
            <div className="p-4 bg-slate-900/90 rounded-2xl border border-slate-800 flex flex-col gap-1">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>معدل کل</span>
                <Award className="w-4 h-4 text-amber-400" />
              </div>
              <span className="text-2xl font-extrabold text-amber-400 mt-1">{studentProfile.gpa}</span>
              <span className="text-[11px] text-emerald-400 font-medium">+۰.۳۵ افزایش نسبت به ترم قبل</span>
            </div>

            {/* Stat 2: Credits */}
            <div className="p-4 bg-slate-900/90 rounded-2xl border border-slate-800 flex flex-col gap-1">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>واحد گذرانده</span>
                <BookOpen className="w-4 h-4 text-sky-400" />
              </div>
              <span className="text-2xl font-extrabold text-sky-400 mt-1">
                {studentProfile.creditsPassed} <span className="text-xs text-slate-400 font-normal">/ {studentProfile.creditsTotal}</span>
              </span>
              <span className="text-[11px] text-slate-400 font-medium">۴۸٪ از کل دوره</span>
            </div>

            {/* Stat 3: Attendance */}
            <div className="p-4 bg-slate-900/90 rounded-2xl border border-slate-800 flex flex-col gap-1">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>حضور در کلاس</span>
                <CheckCircle className="w-4 h-4 text-emerald-400" />
              </div>
              <span className="text-2xl font-extrabold text-emerald-400 mt-1">۹۶٪</span>
              <span className="text-[11px] text-slate-400 font-medium">بدون غیبت غیرمجاز</span>
            </div>

            {/* Stat 4: Term */}
            <div className="p-4 bg-slate-900/90 rounded-2xl border border-slate-800 flex flex-col gap-1">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>ترم فعلی</span>
                <Clock className="w-4 h-4 text-indigo-400" />
              </div>
              <span className="text-lg font-bold text-slate-100 mt-2">ترم ۵</span>
              <span className="text-[11px] text-slate-400 font-medium">نیمسال اول ۱۴۰۵-۱۴۰۶</span>
            </div>

          </div>

          {/* Detailed Course Breakdown */}
          <div className="mt-5 space-y-2">
            <h3 className="text-sm font-bold text-slate-200 mb-2">دروس نیمسال جاری:</h3>
            
            <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
              <div>
                <span className="font-semibold text-slate-200 block">هوش مصنوعی</span>
                <span className="text-slate-400">۳ واحد | دکتر علوی</span>
              </div>
              <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 font-bold rounded-lg border border-emerald-500/30">
                ۱۹.۵
              </span>
            </div>

            <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
              <div>
                <span className="font-semibold text-slate-200 block">ساختمان داده‌ها</span>
                <span className="text-slate-400">۳ واحد | استاد رضایی</span>
              </div>
              <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 font-bold rounded-lg border border-emerald-500/30">
                ۱۸.۰
              </span>
            </div>

            <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
              <div>
                <span className="font-semibold text-slate-200 block">شبکه‌های کامپیوتر</span>
                <span className="text-slate-400">۳ واحد | دکتر احمدی</span>
              </div>
              <span className="px-2.5 py-1 bg-amber-500/20 text-amber-300 font-bold rounded-lg border border-amber-500/30">
                در حال ارزیابی
              </span>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end">
            <button
              onClick={closeModal}
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-sm font-bold transition-colors cursor-pointer"
            >
              بستن
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

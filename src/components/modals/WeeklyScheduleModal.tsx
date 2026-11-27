import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar, 
  X, 
  Clock, 
  MapPin, 
  User, 
  Download, 
  BellRing, 
  AlertTriangle, 
  CheckCircle, 
  BookOpen, 
  Info,
  CalendarCheck
} from 'lucide-react';
import { useDashboard } from '../../context/DashboardContext';

export interface ClassSlot {
  id: string;
  code: string;
  nameFa: string;
  nameEn: string;
  instructorFa: string;
  instructorEn: string;
  roomFa: string;
  roomEn: string;
  day: 'sat' | 'sun' | 'mon' | 'tue' | 'wed' | 'thu';
  timeSlot: '08:00-09:30' | '10:30-12:00' | '13:30-15:00' | '15:00-16:30' | '16:30-18:00';
  category: 'specialized' | 'general';
}

export interface ExamItem {
  id: string;
  code: string;
  nameFa: string;
  nameEn: string;
  type: 'midterm' | 'final';
  dateFa: string;
  dateEn: string;
  timeFa: string;
  timeEn: string;
  hallFa: string;
  hallEn: string;
  seatNumber: number;
  isPast: boolean;
  daysRemaining?: number;
}

const SAMPLE_CLASSES: ClassSlot[] = [
  {
    id: 'cls-1',
    code: 'CE101-1',
    nameFa: 'ساختمان داده‌ها',
    nameEn: 'Data Structures',
    instructorFa: 'دکتر مریم احمدی',
    instructorEn: 'Dr. Maryam Ahmadi',
    roomFa: 'کلاس ۳۰۴ - دانشکده کامپیوتر',
    roomEn: 'Room 304 - CS Dept',
    day: 'sat',
    timeSlot: '10:30-12:00',
    category: 'specialized'
  },
  {
    id: 'cls-2',
    code: 'CE101-1',
    nameFa: 'ساختمان داده‌ها',
    nameEn: 'Data Structures',
    instructorFa: 'دکتر مریم احمدی',
    instructorEn: 'Dr. Maryam Ahmadi',
    roomFa: 'کلاس ۳۰۴ - دانشکده کامپیوتر',
    roomEn: 'Room 304 - CS Dept',
    day: 'mon',
    timeSlot: '10:30-12:00',
    category: 'specialized'
  },
  {
    id: 'cls-3',
    code: 'CE202-1',
    nameFa: 'طراحی پایگاه داده',
    nameEn: 'Database Design',
    instructorFa: 'دکتر علی رضایی',
    instructorEn: 'Dr. Ali Rezaei',
    roomFa: 'کلاس ۱۰۲ - دانشکده مهندسی',
    roomEn: 'Room 102 - Engineering Dept',
    day: 'sun',
    timeSlot: '08:00-09:30',
    category: 'specialized'
  },
  {
    id: 'cls-4',
    code: 'CE202-1',
    nameFa: 'طراحی پایگاه داده',
    nameEn: 'Database Design',
    instructorFa: 'دکتر علی رضایی',
    instructorEn: 'Dr. Ali Rezaei',
    roomFa: 'کلاس ۱۰۲ - دانشکده مهندسی',
    roomEn: 'Room 102 - Engineering Dept',
    day: 'tue',
    timeSlot: '08:00-09:30',
    category: 'specialized'
  },
  {
    id: 'cls-5',
    code: 'CE301-1',
    nameFa: 'شبکه‌های کامپیوتر',
    nameEn: 'Computer Networks',
    instructorFa: 'دکتر حسن نوری',
    instructorEn: 'Dr. Hassan Nouri',
    roomFa: 'سایت شماره ۲ - کامپیوتر',
    roomEn: 'Lab No. 2 - CS Dept',
    day: 'sat',
    timeSlot: '13:30-15:00',
    category: 'specialized'
  },
  {
    id: 'cls-6',
    code: 'CE301-1',
    nameFa: 'شبکه‌های کامپیوتر',
    nameEn: 'Computer Networks',
    instructorFa: 'دکتر حسن نوری',
    instructorEn: 'Dr. Hassan Nouri',
    roomFa: 'سایت شماره ۲ - کامپیوتر',
    roomEn: 'Lab No. 2 - CS Dept',
    day: 'mon',
    timeSlot: '13:30-15:00',
    category: 'specialized'
  },
  {
    id: 'cls-7',
    code: 'GE102-1',
    nameFa: 'زبان انگلیسی عمومی',
    nameEn: 'General English',
    instructorFa: 'دکتر شیما رحیمی',
    instructorEn: 'Dr. Shima Rahimi',
    roomFa: 'کلاس ۴۰۱ - ساختمان عمومی',
    roomEn: 'Room 401 - General Bldg',
    day: 'wed',
    timeSlot: '08:00-09:30',
    category: 'general'
  },
  {
    id: 'cls-8',
    code: 'GE201-1',
    nameFa: 'اندیشه اسلامی ۱',
    nameEn: 'Islamic Thought 1',
    instructorFa: 'حجت‌الاسلام طاهری',
    instructorEn: 'Hojjatoleslam Taheri',
    roomFa: 'آمفی‌تئاتر مرکزی',
    roomEn: 'Central Amphitheater',
    day: 'tue',
    timeSlot: '15:00-16:30',
    category: 'general'
  },
  {
    id: 'cls-9',
    code: 'GE301-1',
    nameFa: 'تربیت بدنی ۱',
    nameEn: 'Physical Education 1',
    instructorFa: 'مربی علی نجفی',
    instructorEn: 'Coach Ali Najafi',
    roomFa: 'سالن ورزشی شماره ۱',
    roomEn: 'Sports Complex No. 1',
    day: 'thu',
    timeSlot: '16:30-18:00',
    category: 'general'
  }
];

const SAMPLE_EXAMS: ExamItem[] = [
  // Upcoming Exams
  {
    id: 'ex-1',
    code: 'CE101-1',
    nameFa: 'میان‌ترم ساختمان داده‌ها',
    nameEn: 'Data Structures Midterm',
    type: 'midterm',
    dateFa: 'دوشنبه ۱۴۰۵/۰۵/۱۲',
    dateEn: 'Mon Aug 3, 2026',
    timeFa: '۱۰:۰۰ الی ۱۲:۰۰',
    timeEn: '10:00 - 12:00',
    hallFa: 'سالن امتحانات مرکزی',
    hallEn: 'Central Exam Hall',
    seatNumber: 42,
    isPast: false,
    daysRemaining: 7
  },
  {
    id: 'ex-2',
    code: 'CE202-1',
    nameFa: 'میان‌ترم طراحی پایگاه داده',
    nameEn: 'Database Design Midterm',
    type: 'midterm',
    dateFa: 'چهارشنبه ۱۴۰۵/۰۵/۲۱',
    dateEn: 'Wed Aug 12, 2026',
    timeFa: '۱۴:۰۰ الی ۱۶:۰۰',
    timeEn: '14:00 - 16:00',
    hallFa: 'دانشکده مهندسی - طبقه دوم',
    hallEn: 'Engineering Dept - 2nd Floor',
    seatNumber: 118,
    isPast: false,
    daysRemaining: 16
  },
  {
    id: 'ex-3',
    code: 'CE301-1',
    nameFa: 'پایان‌ترم شبکه‌های کامپیوتر',
    nameEn: 'Computer Networks Final',
    type: 'final',
    dateFa: 'یکشنبه ۱۴۰۵/۰۶/۰۲',
    dateEn: 'Sun Aug 24, 2026',
    timeFa: '۰۸:۳۰ الی ۱۱:۰۰',
    timeEn: '08:30 - 11:00',
    hallFa: 'سوله امتحانات شماره ۲',
    hallEn: 'Exam Complex No. 2',
    seatNumber: 85,
    isPast: false,
    daysRemaining: 28
  },
  {
    id: 'ex-4',
    code: 'GE102-1',
    nameFa: 'پایان‌ترم زبان انگلیسی عمومی',
    nameEn: 'General English Final',
    type: 'final',
    dateFa: 'سه‌شنبه ۱۴۰۵/۰۶/۱۱',
    dateEn: 'Tue Sep 2, 2026',
    timeFa: '۱۳:۳۰ الی ۱۵:۳۰',
    timeEn: '13:30 - 15:30',
    hallFa: 'سالن امتحانات مرکزی',
    hallEn: 'Central Exam Hall',
    seatNumber: 204,
    isPast: false,
    daysRemaining: 37
  },
  // Past Exams
  {
    id: 'ex-5',
    code: 'GE201-1',
    nameFa: 'میان‌ترم اندیشه اسلامی ۱',
    nameEn: 'Islamic Thought 1 Midterm',
    type: 'midterm',
    dateFa: 'پنج‌شنبه ۱۴۰۵/۰۴/۱۹',
    dateEn: 'Thu Jul 10, 2026',
    timeFa: '۰۹:۰۰ الی ۱۰:۳۰',
    timeEn: '09:00 - 10:30',
    hallFa: 'آمفی‌تئاتر مرکزی',
    hallEn: 'Central Amphitheater',
    seatNumber: 15,
    isPast: true
  },
  {
    id: 'ex-6',
    code: 'GE301-1',
    nameFa: 'ارزیابی عملی تربیت بدنی ۱',
    nameEn: 'Physical Ed Practical Exam',
    type: 'final',
    dateFa: 'شنبه ۱۴۰۵/۰۴/۲۸',
    dateEn: 'Sat Jul 19, 2026',
    timeFa: '۱۶:۰۰ الی ۱۸:۰۰',
    timeEn: '16:00 - 18:00',
    hallFa: 'سالن ورزشی شماره ۱',
    hallEn: 'Sports Complex No. 1',
    seatNumber: 8,
    isPast: true
  }
];

const DAYS_KEY: ('sat' | 'sun' | 'mon' | 'tue' | 'wed' | 'thu')[] = ['sat', 'sun', 'mon', 'tue', 'wed', 'thu'];
const TIME_SLOTS: ('08:00-09:30' | '10:30-12:00' | '13:30-15:00' | '15:00-16:30' | '16:30-18:00')[] = [
  '08:00-09:30',
  '10:30-12:00',
  '13:30-15:00',
  '15:00-16:30',
  '16:30-18:00'
];

export const WeeklyScheduleModal: React.FC = () => {
  const { activeModal, closeModal, showToast, language, t } = useDashboard();
  const isFa = language === 'fa';

  const [activeTab, setActiveTab] = useState<'schedule' | 'exams'>('schedule');
  const [selectedClass, setSelectedClass] = useState<ClassSlot | null>(null);

  if (activeModal !== 'weekly_schedule') return null;

  const handleDownloadImage = () => {
    showToast(t('downloadingScheduleImageToast'));
  };

  const handleAddReminder = (examName: string) => {
    showToast(t('reminderAddedToast'));
  };

  const dayLabelMap: Record<string, string> = {
    sat: t('saturday'),
    sun: t('sunday'),
    mon: t('monday'),
    tue: t('tuesday'),
    wed: t('wednesday'),
    thu: t('thursday')
  };

  const nearestExam = SAMPLE_EXAMS.find(e => !e.isPast);

  return (
    <AnimatePresence>
      <div
        dir={isFa ? 'rtl' : 'ltr'}
        data-modal-backdrop
        onClick={(e) => {
          if (e.target === e.currentTarget) closeModal();
        }}
        className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md"
      >
        <motion.div
          role="dialog"
          aria-modal="true"
          data-modal-panel
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="w-full max-w-4xl bg-[#1E293B] border border-slate-700/80 rounded-[28px] shadow-2xl text-slate-100 flex flex-col max-h-[calc(var(--vvh,100dvh)-16px)] max-w-[calc(100vw-16px)] overflow-hidden"
          dir={isFa ? 'rtl' : 'ltr'}
        >
          {/* Header */}
          <div className="p-5 sm:p-6 border-b border-white/[0.08] bg-[#172030] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-tr from-sky-500/20 to-purple-500/20 text-sky-400 rounded-2xl border border-sky-500/30 shadow-md">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-extrabold text-white">
                  {t('weeklyScheduleModalTitle')}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {t('weeklyScheduleModalSub')}
                </p>
              </div>
            </div>

            <button
              onClick={closeModal}
              className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="px-5 pt-4 pb-2 bg-[#172030] border-b border-white/[0.06] flex items-center justify-between gap-3 flex-wrap shrink-0">
            <div className="flex items-center gap-2 p-1 bg-[#121824] rounded-2xl border border-white/[0.06]">
              <button
                type="button"
                onClick={() => setActiveTab('schedule')}
                className={`flex items-center gap-2 py-2 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'schedule'
                    ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>{t('classScheduleTab')}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('exams')}
                className={`flex items-center gap-2 py-2 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'exams'
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <CalendarCheck className="w-3.5 h-3.5" />
                <span>{t('examScheduleTab')}</span>
              </button>
            </div>

            {activeTab === 'schedule' && (
              <button
                type="button"
                onClick={handleDownloadImage}
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-300 border border-sky-500/20 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{t('downloadScheduleImageBtn')}</span>
              </button>
            )}
          </div>

          {/* Scrollable Content Body */}
          <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-4 sm:p-6 space-y-5">
            {activeTab === 'schedule' ? (
              <div className="space-y-4">
                {/* Legend */}
                <div className="flex items-center gap-4 text-xs font-medium text-slate-300 bg-[#151D2A] p-3 rounded-2xl border border-white/[0.06]">
                  <span className="text-slate-400">{isFa ? 'راهنمای دروس:' : 'Course Legend:'}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-sky-500/80 border border-sky-400"></span>
                    <span>{t('specializedBadge')}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-purple-500/80 border border-purple-400"></span>
                    <span>{t('generalBadge')}</span>
                  </div>
                </div>

                {/* Timetable Grid */}
                <div className="overflow-x-auto rounded-2xl border border-white/[0.08] bg-[#151D2A]">
                  <table className="w-full text-xs border-collapse min-w-[650px]">
                    <thead>
                      <tr className="bg-[#1B2536] text-slate-300 font-bold border-b border-white/[0.08]">
                        <th className="py-3 px-3 text-center border-e border-white/[0.06] w-24">
                          <Clock className="w-4 h-4 mx-auto text-sky-400" />
                        </th>
                        {DAYS_KEY.map((day) => (
                          <th key={day} className="py-3 px-2 text-center border-e border-white/[0.06] last:border-e-0 font-bold">
                            {dayLabelMap[day]}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.06]">
                      {TIME_SLOTS.map((slot) => (
                        <tr key={slot} className="hover:bg-white/[0.01]">
                          <td className="py-3 px-2 text-center font-mono font-bold text-slate-400 bg-[#172030]/50 border-e border-white/[0.06] text-[11px] dir-ltr">
                            {slot}
                          </td>
                          {DAYS_KEY.map((day) => {
                            const foundClass = SAMPLE_CLASSES.find(
                              (c) => c.day === day && c.timeSlot === slot
                            );

                            return (
                              <td key={day} className="p-1.5 border-e border-white/[0.06] last:border-e-0 align-top h-20 w-1/6">
                                {foundClass ? (
                                  <button
                                    onClick={() => setSelectedClass(foundClass)}
                                    className={`w-full h-full p-2 rounded-xl text-start flex flex-col justify-between transition-all cursor-pointer shadow-md hover:scale-[1.02] ${
                                      foundClass.category === 'general'
                                        ? 'bg-purple-950/70 border border-purple-500/40 text-purple-200 hover:bg-purple-900/80'
                                        : 'bg-sky-950/70 border border-sky-500/40 text-sky-200 hover:bg-sky-900/80'
                                    }`}
                                  >
                                    <div>
                                      <div className="font-bold text-[11px] line-clamp-1">
                                        {isFa ? foundClass.nameFa : foundClass.nameEn}
                                      </div>
                                      <div className="text-[10px] opacity-80 mt-0.5 line-clamp-1">
                                        {isFa ? foundClass.instructorFa : foundClass.instructorEn}
                                      </div>
                                    </div>
                                    <div className="text-[9px] font-mono opacity-90 font-semibold bg-black/30 px-1.5 py-0.5 rounded mt-1 self-start truncate max-w-full">
                                      {isFa ? foundClass.roomFa : foundClass.roomEn}
                                    </div>
                                  </button>
                                ) : (
                                  <div className="w-full h-full rounded-xl border border-dashed border-white/[0.03] bg-white/[0.005]"></div>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              /* Tab 2: Exam Schedule */
              <div className="space-y-5">
                {/* Nearest Exam Countdown Banner */}
                {nearestExam && (
                  <div className="p-4 bg-gradient-to-r from-amber-500/20 via-purple-500/20 to-sky-500/20 border border-amber-500/30 rounded-2xl flex items-center justify-between gap-3 shadow-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30 shrink-0">
                        <AlertTriangle className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-amber-300 block">
                          {t('nearestExamAlert', { days: nearestExam.daysRemaining || 7 })}
                        </span>
                        <p className="text-xs text-slate-200 font-bold mt-0.5">
                          {isFa ? nearestExam.nameFa : nearestExam.nameEn} — {isFa ? nearestExam.dateFa : nearestExam.dateEn}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleAddReminder(nearestExam.nameFa)}
                      className="px-3 py-1.5 bg-amber-500 text-slate-950 font-bold text-xs rounded-xl hover:bg-amber-400 transition-colors flex items-center gap-1 shrink-0 cursor-pointer shadow-md"
                    >
                      <BellRing className="w-3.5 h-3.5" />
                      <span>{t('addToReminderBtn')}</span>
                    </button>
                  </div>
                )}

                {/* Upcoming Exams */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-sky-400">
                    <CalendarCheck className="w-4 h-4" />
                    <span>{t('upcomingExamsDivider')}</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {SAMPLE_EXAMS.filter(e => !e.isPast).map((exam) => (
                      <div
                        key={exam.id}
                        className="p-4 bg-[#151D2A] border border-sky-500/20 hover:border-sky-500/40 rounded-2xl space-y-3 transition-all shadow-md relative overflow-hidden"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-[#232D42] text-sky-300 border border-sky-500/20">
                              {exam.code}
                            </span>
                            <h4 className="text-sm font-bold text-white mt-1">
                              {isFa ? exam.nameFa : exam.nameEn}
                            </h4>
                          </div>

                          {exam.type === 'midterm' ? (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0">
                              {t('midtermTag')}
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 shrink-0">
                              {t('finalTag')}
                            </span>
                          )}
                        </div>

                        <div className="space-y-1.5 text-xs text-slate-300 border-t border-white/[0.06] pt-2.5">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                            <span>{isFa ? exam.dateFa : exam.dateEn}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                            <span className="font-mono text-[11px] dir-ltr">{isFa ? exam.timeFa : exam.timeEn}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                            <span>{t('hallSeatLabel')} <strong className="text-white">{isFa ? exam.hallFa : exam.hallEn}</strong> (صندلی {exam.seatNumber})</span>
                          </div>
                        </div>

                        <div className="pt-2 flex justify-end">
                          <button
                            type="button"
                            onClick={() => handleAddReminder(exam.nameFa)}
                            className="px-3 py-1 bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border border-sky-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <BellRing className="w-3 h-3" />
                            <span>{t('addToReminderBtn')}</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Past Exams Divider */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-400 border-t border-white/[0.08] pt-4">
                    <CheckCircle className="w-4 h-4 text-slate-500" />
                    <span>{t('pastExamsDivider')}</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 opacity-60 hover:opacity-100 transition-opacity">
                    {SAMPLE_EXAMS.filter(e => e.isPast).map((exam) => (
                      <div
                        key={exam.id}
                        className="p-3.5 bg-[#121824] border border-white/[0.06] rounded-2xl space-y-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-slate-300">
                            {isFa ? exam.nameFa : exam.nameEn}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-400">
                            {exam.code}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-3">
                          <span>{isFa ? exam.dateFa : exam.dateEn}</span>
                          <span>•</span>
                          <span>{isFa ? exam.hallFa : exam.hallEn}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 sm:p-5 border-t border-white/[0.08] bg-[#172030] flex items-center justify-end shrink-0">
            <button
              type="button"
              onClick={closeModal}
              className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl text-xs sm:text-sm font-bold transition-colors cursor-pointer"
            >
              {isFa ? 'بستن' : 'Close'}
            </button>
          </div>
        </motion.div>
      </div>

      {/* Popover / Modal for Class Slot Details */}
      <AnimatePresence>
        {selectedClass && (
          <div
            dir={isFa ? 'rtl' : 'ltr'}
            data-modal-backdrop
            onClick={(e) => {
              if (e.target === e.currentTarget) setSelectedClass(null);
            }}
            className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              data-modal-panel
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm bg-[#1E293B] border border-slate-700 p-5 rounded-3xl shadow-2xl space-y-4 text-slate-100 max-h-[calc(var(--vvh,100dvh)-16px)] max-w-[calc(100vw-16px)] overflow-y-auto overflow-x-hidden"
              dir={isFa ? 'rtl' : 'ltr'}
            >
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 bg-sky-500/20 text-sky-300 rounded-lg text-xs font-mono font-bold">
                  {selectedClass.code}
                </span>
                <button
                  onClick={() => setSelectedClass(null)}
                  className="p-1 rounded-full text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <h3 className="text-base font-extrabold text-white">
                {isFa ? selectedClass.nameFa : selectedClass.nameEn}
              </h3>

              <div className="space-y-2 text-xs text-slate-300 border-t border-white/[0.08] pt-3">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-sky-400" />
                  <span>{t('instructorLabel')} <strong className="text-white">{isFa ? selectedClass.instructorFa : selectedClass.instructorEn}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-sky-400" />
                  <span>مکان برگزاری: <strong className="text-white">{isFa ? selectedClass.roomFa : selectedClass.roomEn}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-sky-400" />
                  <span>ساعت برگزاری: <strong className="text-white font-mono dir-ltr">{selectedClass.timeSlot}</strong></span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedClass(null)}
                  className="w-full py-2 bg-sky-500 text-slate-950 font-bold text-xs rounded-xl hover:bg-sky-400 transition-colors cursor-pointer"
                >
                  {isFa ? 'متوجه شدم' : 'Got it'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AnimatePresence>
  );
};

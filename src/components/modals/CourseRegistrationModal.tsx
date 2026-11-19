import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CheckSquare, 
  X, 
  Clock, 
  Calendar, 
  User, 
  AlertTriangle, 
  Check, 
  BookOpen, 
  Users, 
  CheckCircle2, 
  Sparkles,
  Info
} from 'lucide-react';
import { useDashboard } from '../../context/DashboardContext';

interface Course {
  id: string;
  code: string;
  nameFa: string;
  nameEn: string;
  credits: number;
  instructorFa: string;
  instructorEn: string;
  scheduleFa: string;
  scheduleEn: string;
  slot: string; // for conflict detection
  capacityTotal: number;
  capacityRemaining: number;
  category?: 'specialized' | 'general';
}

const SAMPLE_COURSES: Course[] = [
  {
    id: 'c-1',
    code: 'CE201-1',
    nameFa: 'ساختمان داده‌ها و الگوریتم‌ها',
    nameEn: 'Data Structures & Algorithms',
    credits: 3,
    instructorFa: 'دکتر سید علی حسینی',
    instructorEn: 'Dr. Seyed Ali Hosseini',
    scheduleFa: 'شنبه و دوشنبه ۱۰:۳۰ - ۱۲:۰۰',
    scheduleEn: 'Sat & Mon 10:30 - 12:00',
    slot: 'sat_mon_1030',
    capacityTotal: 30,
    capacityRemaining: 3,
    category: 'specialized',
  },
  {
    id: 'c-2',
    code: 'CE202-1',
    nameFa: 'طراحی پایگاه داده‌ها',
    nameEn: 'Database Design',
    credits: 3,
    instructorFa: 'دکتر مریم رضایی',
    instructorEn: 'Dr. Maryam Rezaei',
    scheduleFa: 'یکشنبه و سه‌شنبه ۰۸:۰۰ - ۰۹:۳۰',
    scheduleEn: 'Sun & Tue 08:00 - 09:30',
    slot: 'sun_tue_0800',
    capacityTotal: 35,
    capacityRemaining: 12,
    category: 'specialized',
  },
  {
    id: 'c-3',
    code: 'CE301-1',
    nameFa: 'شبکه‌های کامپیوتری',
    nameEn: 'Computer Networks',
    credits: 3,
    instructorFa: 'دکتر محمد احمدی',
    instructorEn: 'Dr. Mohammad Ahmadi',
    scheduleFa: 'شنبه و دوشنبه ۱۳:۳۰ - ۱۵:۰۰',
    scheduleEn: 'Sat & Mon 13:30 - 15:00',
    slot: 'sat_mon_1330',
    capacityTotal: 25,
    capacityRemaining: 5,
    category: 'specialized',
  },
  {
    id: 'c-4',
    code: 'CE302-1',
    nameFa: 'سیستم‌های عامل',
    nameEn: 'Operating Systems',
    credits: 3,
    instructorFa: 'مهندس رضا کاظمی',
    instructorEn: 'Eng. Reza Kazemi',
    scheduleFa: 'شنبه و دوشنبه ۱۰:۳۰ - ۱۲:۰۰',
    scheduleEn: 'Sat & Mon 10:30 - 12:00',
    slot: 'sat_mon_1030', // Conflicts with c-1!
    capacityTotal: 30,
    capacityRemaining: 8,
    category: 'specialized',
  },
  {
    id: 'c-5',
    code: 'MATH201-1',
    nameFa: 'آمار و احتمالات مهندسی',
    nameEn: 'Engineering Statistics',
    credits: 2,
    instructorFa: 'دکتر فاطمه کریمی',
    instructorEn: 'Dr. Fatemeh Karimi',
    scheduleFa: 'چهارشنبه ۰۸:۰۰ - ۱۰:۰۰',
    scheduleEn: 'Wed 08:00 - 10:00',
    slot: 'wed_0800',
    capacityTotal: 40,
    capacityRemaining: 15,
    category: 'specialized',
  },
  {
    id: 'c-6',
    code: 'CE200-1',
    nameFa: 'طراحی الگوریتم',
    nameEn: 'Algorithm Design',
    credits: 3,
    instructorFa: 'دکتر حمید صادقی',
    instructorEn: 'Dr. Hamid Sadeghi',
    scheduleFa: 'یکشنبه و سه‌شنبه ۱۰:۳۰ - ۱۲:۰۰',
    scheduleEn: 'Sun & Tue 10:30 - 12:00',
    slot: 'sun_tue_1030',
    capacityTotal: 30,
    capacityRemaining: 7,
    category: 'specialized',
  },
  {
    id: 'c-7',
    code: 'CE203-1',
    nameFa: 'ریاضی مهندسی',
    nameEn: 'Engineering Mathematics',
    credits: 3,
    instructorFa: 'دکتر امیر رستمی',
    instructorEn: 'Dr. Amir Rostami',
    scheduleFa: 'یکشنبه و سه‌شنبه ۱۰:۳۰ - ۱۲:۰۰',
    scheduleEn: 'Sun & Tue 10:30 - 12:00',
    slot: 'sun_tue_1030', // Conflicts with c-6!
    capacityTotal: 20,
    capacityRemaining: 2,
    category: 'specialized',
  },
  {
    id: 'c-8',
    code: 'CE204-1',
    nameFa: 'مدارهای منطقی',
    nameEn: 'Logic Circuits',
    credits: 3,
    instructorFa: 'دکتر لیلا صادقی',
    instructorEn: 'Dr. Leila Sadeghi',
    scheduleFa: 'شنبه و دوشنبه ۰۸:۰۰ - ۰۹:۳۰',
    scheduleEn: 'Sat & Mon 08:00 - 09:30',
    slot: 'sat_mon_0800',
    capacityTotal: 30,
    capacityRemaining: 5,
    category: 'specialized',
  },
  {
    id: 'c-9',
    code: 'CE303-1',
    nameFa: 'مهندسی نرم‌افزار',
    nameEn: 'Software Engineering',
    credits: 3,
    instructorFa: 'دکتر حسین نوری',
    instructorEn: 'Dr. Hossein Nouri',
    scheduleFa: 'یکشنبه و سه‌شنبه ۱۳:۳۰ - ۱۵:۰۰',
    scheduleEn: 'Sun & Tue 13:30 - 15:00',
    slot: 'sun_tue_1330',
    capacityTotal: 25,
    capacityRemaining: 5,
    category: 'specialized',
  },
  {
    id: 'c-10',
    code: 'CE401-1',
    nameFa: 'هوش مصنوعی',
    nameEn: 'Artificial Intelligence',
    credits: 3,
    instructorFa: 'دکتر محمدمهدی خرسند',
    instructorEn: 'Dr. Mohammad Mahdi Khorsand',
    scheduleFa: 'شنبه و دوشنبه ۱۵:۰۰ - ۱۶:۳۰',
    scheduleEn: 'Sat & Mon 15:00 - 16:30',
    slot: 'sat_mon_1500',
    capacityTotal: 30,
    capacityRemaining: 2,
    category: 'specialized',
  },
  {
    id: 'c-11',
    code: 'CE304-1',
    nameFa: 'معماری کامپیوتر',
    nameEn: 'Computer Architecture',
    credits: 3,
    instructorFa: 'دکتر پوریا خدابنده',
    instructorEn: 'Dr. Pourya Khodabandeh',
    scheduleFa: 'یکشنبه و سه‌شنبه ۰۸:۰۰ - ۰۹:۳۰',
    scheduleEn: 'Sun & Tue 08:00 - 09:30',
    slot: 'sun_tue_0800', // Conflicts with c-2!
    capacityTotal: 20,
    capacityRemaining: 5,
    category: 'specialized',
  },
  {
    id: 'c-12',
    code: 'CE305-1',
    nameFa: 'کارگاه برنامه‌نویسی وب',
    nameEn: 'Web Programming Workshop',
    credits: 2,
    instructorFa: 'مهندس نگار احمدی',
    instructorEn: 'Eng. Negar Ahmadi',
    scheduleFa: 'پنج‌شنبه ۰۹:۰۰ - ۱۲:۰۰',
    scheduleEn: 'Thu 09:00 - 12:00',
    slot: 'thu_0900',
    capacityTotal: 15,
    capacityRemaining: 5,
    category: 'specialized',
  },
  {
    id: 'c-13',
    code: 'CE402-1',
    nameFa: 'مبانی داده‌کاوی',
    nameEn: 'Data Mining Fundamentals',
    credits: 3,
    instructorFa: 'دکتر امیرحسین فلاحی',
    instructorEn: 'Dr. Amirhossein Fallahi',
    scheduleFa: 'شنبه و دوشنبه ۱۰:۳۰ - ۱۲:۰۰',
    scheduleEn: 'Sat & Mon 10:30 - 12:00',
    slot: 'sat_mon_1030',
    capacityTotal: 20,
    capacityRemaining: 19,
    category: 'specialized',
  },
  {
    id: 'c-14',
    code: 'CE403-1',
    nameFa: 'امنیت شبکه',
    nameEn: 'Network Security',
    credits: 3,
    instructorFa: 'دکتر مریم اصغری',
    instructorEn: 'Dr. Maryam Asghari',
    scheduleFa: 'یکشنبه و سه‌شنبه ۱۵:۰۰ - ۱۶:۳۰',
    scheduleEn: 'Sun & Tue 15:00 - 16:30',
    slot: 'sun_tue_1500',
    capacityTotal: 25,
    capacityRemaining: 7,
    category: 'specialized',
  },
  {
    id: 'c-15',
    code: 'CE306-1',
    nameFa: 'اصول طراحی کامپایلر',
    nameEn: 'Compiler Design',
    credits: 3,
    instructorFa: 'دکتر بهزاد نظری',
    instructorEn: 'Dr. Behzad Nazari',
    scheduleFa: 'شنبه و دوشنبه ۱۳:۳۰ - ۱۵:۰۰',
    scheduleEn: 'Sat & Mon 13:30 - 15:00',
    slot: 'sat_mon_1330',
    capacityTotal: 20,
    capacityRemaining: 20,
    category: 'specialized',
  },
  {
    id: 'c-16',
    code: 'CE404-1',
    nameFa: 'سیستم‌های توزیع‌شده',
    nameEn: 'Distributed Systems',
    credits: 3,
    instructorFa: 'دکتر الهام رستگار',
    instructorEn: 'Dr. Elham Rastegar',
    scheduleFa: 'یکشنبه و سه‌شنبه ۰۸:۰۰ - ۰۹:۳۰',
    scheduleEn: 'Sun & Tue 08:00 - 09:30',
    slot: 'sun_tue_0800',
    capacityTotal: 18,
    capacityRemaining: 11,
    category: 'specialized',
  },
  {
    id: 'c-17',
    code: 'CE307-1',
    nameFa: 'کارگاه پایگاه داده پیشرفته',
    nameEn: 'Advanced Database Lab',
    credits: 2,
    instructorFa: 'مهندس کیانوش مرادی',
    instructorEn: 'Eng. Kianoush Moradi',
    scheduleFa: 'پنج‌شنبه ۱۳:۰۰ - ۱۶:۰۰',
    scheduleEn: 'Thu 13:00 - 16:00',
    slot: 'thu_1300',
    capacityTotal: 15,
    capacityRemaining: 5,
    category: 'specialized',
  },
  // General Courses
  {
    id: 'c-18',
    code: 'GE101-1',
    nameFa: 'فارسی عمومی',
    nameEn: 'General Persian',
    credits: 3,
    instructorFa: 'دکتر فرشته امینی',
    instructorEn: 'Dr. Fereshteh Amini',
    scheduleFa: 'یکشنبه ۰۸:۰۰ - ۱۰:۳۰',
    scheduleEn: 'Sun 08:00 - 10:30',
    slot: 'sun_0800',
    capacityTotal: 40,
    capacityRemaining: 35,
    category: 'general',
  },
  {
    id: 'c-19',
    code: 'GE102-1',
    nameFa: 'زبان انگلیسی عمومی',
    nameEn: 'General English',
    credits: 3,
    instructorFa: 'دکتر شیما رحیمی',
    instructorEn: 'Dr. Shima Rahimi',
    scheduleFa: 'شنبه ۱۰:۳۰ - ۱۳:۰۰',
    scheduleEn: 'Sat 10:30 - 13:00',
    slot: 'sat_1030',
    capacityTotal: 40,
    capacityRemaining: 22,
    category: 'general',
  },
  {
    id: 'c-20',
    code: 'GE201-1',
    nameFa: 'اندیشه اسلامی ۱',
    nameEn: 'Islamic Thought 1',
    credits: 2,
    instructorFa: 'حجت‌الاسلام محمدرضا طاهری',
    instructorEn: 'Hojjatoleslam Mohammad Reza Taheri',
    scheduleFa: 'دوشنبه ۰۸:۰۰ - ۰۹:۳۰',
    scheduleEn: 'Mon 08:00 - 09:30',
    slot: 'mon_0800',
    capacityTotal: 50,
    capacityRemaining: 48,
    category: 'general',
  },
  {
    id: 'c-21',
    code: 'GE301-1',
    nameFa: 'تربیت بدنی ۱',
    nameEn: 'Physical Education 1',
    credits: 1,
    instructorFa: 'مربی علی نجفی',
    instructorEn: 'Coach Ali Najafi',
    scheduleFa: 'سه‌شنبه ۱۶:۳۰ - ۱۸:۰۰',
    scheduleEn: 'Tue 16:30 - 18:00',
    slot: 'tue_1630',
    capacityTotal: 30,
    capacityRemaining: 12,
    category: 'general',
  },
  {
    id: 'c-22',
    code: 'GE202-1',
    nameFa: 'تاریخ تحلیلی صدر اسلام',
    nameEn: 'Analytical History of Early Islam',
    credits: 2,
    instructorFa: 'دکتر زهرا موسوی',
    instructorEn: 'Dr. Zahra Mousavi',
    scheduleFa: 'پنج‌شنبه ۰۸:۰۰ - ۰۹:۳۰',
    scheduleEn: 'Thu 08:00 - 09:30',
    slot: 'thu_0800',
    capacityTotal: 50,
    capacityRemaining: 40,
    category: 'general',
  }
];

// Sub-component for each course row
const CourseSelectionItem = React.memo<{
  course: Course;
  isSelected: boolean;
  isFa: boolean;
  hasConflictWithThis: boolean;
  onToggle: (id: string) => void;
  t: (key: string) => string;
}>(({ course, isSelected, isFa, hasConflictWithThis, onToggle, t }) => {
  const name = isFa ? course.nameFa : course.nameEn;
  const instructor = isFa ? course.instructorFa : course.instructorEn;
  const schedule = isFa ? course.scheduleFa : course.scheduleEn;

  return (
    <motion.div
      whileHover={{ scale: 1.002 }}
      onClick={() => onToggle(course.id)}
      className={`p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer relative ${
        hasConflictWithThis && isSelected
          ? 'bg-rose-950/30 border-rose-500/50 hover:border-rose-500'
          : isSelected
          ? 'bg-[#1E293B] border-sky-500/40 shadow-lg shadow-sky-950/20'
          : 'bg-[#1C2436]/80 hover:bg-[#212B3E] border-white/[0.06] hover:border-white/[0.12]'
      }`}
    >
      <div className="flex items-start gap-3.5">
        {/* Custom Checkbox */}
        <div className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 mt-1 transition-colors ${
          isSelected
            ? hasConflictWithThis
              ? 'bg-rose-500 border-rose-400 text-white'
              : 'bg-sky-500 border-sky-400 text-white'
            : 'border-slate-500/50 bg-[#232D42]'
        }`}>
          {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
        </div>

        {/* Course Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-[#232D42] text-sky-300 border border-sky-500/20">
                {course.code}
              </span>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {course.credits} {t('creditsLabel')}
              </span>
              {course.category === 'general' ? (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {t('generalBadge')}
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  {t('specializedBadge')}
                </span>
              )}
            </div>

            {/* Capacity Pill */}
            <span className={`text-[11px] font-medium flex items-center gap-1 ${
              course.capacityRemaining <= 3 
                ? 'text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20' 
                : 'text-slate-400'
            }`}>
              <Users className="w-3 h-3 text-slate-400" />
              <span>{t('capacityLabel')} {course.capacityRemaining} / {course.capacityTotal}</span>
            </span>
          </div>

          <h4 className="text-xs sm:text-sm font-bold text-white mb-2">
            {name}
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300">
            <div className="flex items-center gap-1.5 text-slate-400">
              <User className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              <span className="truncate">{t('instructorLabel')} <strong className="text-slate-200">{instructor}</strong></span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-400">
              <Clock className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              <span className="truncate">{t('scheduleLabel')} <strong className="text-slate-200">{schedule}</strong></span>
            </div>
          </div>

          {hasConflictWithThis && isSelected && (
            <div className="mt-2 text-[11px] text-rose-400 font-medium flex items-center gap-1 bg-rose-500/10 px-2.5 py-1 rounded-lg border border-rose-500/20">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              <span>{t('scheduleConflictHeader')}</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
});

export const CourseRegistrationModal: React.FC = () => {
  const { activeModal, closeModal, showToast, language, t } = useDashboard();
  const isFa = language === 'fa';

  // Category filter state
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<'all' | 'specialized' | 'general'>('all');

  // Default selected course IDs
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([
    'c-1', // Data Structures
    'c-2', // Databases
    'c-3', // Computer Networks
    'c-5', // Engineering Math
  ]);

  if (activeModal !== 'course_registration') return null;

  const toggleCourse = useCallback((id: string) => {
    setSelectedCourseIds(prev => 
      prev.includes(id) ? prev.filter(cId => cId !== id) : [...prev, id]
    );
  }, []);

  const selectedCourses = useMemo(() => {
    return SAMPLE_COURSES.filter(c => selectedCourseIds.includes(c.id));
  }, [selectedCourseIds]);

  const totalSelectedCredits = useMemo(() => {
    return selectedCourses.reduce((sum, c) => sum + c.credits, 0);
  }, [selectedCourses]);

  // Filtered courses based on active tab
  const filteredCourses = useMemo(() => {
    return SAMPLE_COURSES.filter((course) => {
      if (activeCategoryFilter === 'specialized') return course.category !== 'general';
      if (activeCategoryFilter === 'general') return course.category === 'general';
      return true;
    });
  }, [activeCategoryFilter]);

  const specializedCount = useMemo(() => SAMPLE_COURSES.filter(c => c.category !== 'general').length, []);
  const generalCount = useMemo(() => SAMPLE_COURSES.filter(c => c.category === 'general').length, []);

  // Detect conflict: group by slot
  const conflictingCourseIds = useMemo(() => {
    const slotCounts: Record<string, string[]> = {};
    selectedCourses.forEach(c => {
      if (!slotCounts[c.slot]) slotCounts[c.slot] = [];
      slotCounts[c.slot].push(c.id);
    });

    const conflicts = new Set<string>();
    Object.values(slotCounts).forEach(ids => {
      if (ids.length > 1) {
        ids.forEach(id => conflicts.add(id));
      }
    });
    return conflicts;
  }, [selectedCourses]);

  const hasConflict = conflictingCourseIds.size > 0;
  const isOverLimit = totalSelectedCredits > 20;

  const handleFinalize = () => {
    if (hasConflict) {
      showToast(t('scheduleConflictHeader'));
      return;
    }
    if (isOverLimit) {
      showToast(isFa ? 'تعداد واحدهای انتخابی بیش از سقف مجاز (۲۰ واحد) است.' : 'Selected credits exceed maximum limit of 20 credits.');
      return;
    }
    showToast(t('courseRegistrationSuccess'));
    closeModal();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 pb-[12vh] sm:pb-[8vh] bg-[#0F172A]/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.96 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="w-full max-w-3xl bg-[#1C2436] border border-white/[0.08] rounded-[30px] shadow-2xl text-white flex flex-col max-h-[85dvh] sm:h-[85dvh] sm:max-h-[min(800px,85dvh)] overflow-y-auto"
          dir={isFa ? 'rtl' : 'ltr'}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 sm:p-6 border-b border-white/[0.08] shrink-0 bg-[#1C2436]/90">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-sky-500/20 border border-sky-500/30 rounded-2xl flex items-center justify-center shrink-0">
                <CheckSquare className="w-6 h-6 text-[#38BDF8] stroke-[2]" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white">
                  {t('courseRegistrationTitle')}
                </h2>
                <p className="text-xs text-[#BBC1D1] mt-0.5">
                  {t('courseRegistrationSub')}
                </p>
              </div>
            </div>

            <button
              onClick={closeModal}
              className="p-2 rounded-2xl hover:bg-white/10 text-[#BBC1D1] hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5 text-white stroke-[2]" />
            </button>
          </div>

          {/* Registration Status Banner */}
          <div className="p-4 sm:p-5 border-b border-white/[0.08] bg-[#1E2738]/60 shrink-0 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                  {t('statusActiveLabel')}
                </span>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-amber-300 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>{t('remainingDaysText')}</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-300 flex-wrap gap-2 pt-1">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-sky-400" />
                <span>{t('registrationPeriodLabel')} <strong className="text-white">{t('registrationDatesVal')}</strong></span>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-slate-400">
                <Info className="w-3.5 h-3.5 text-slate-400" />
                <span>{isFa ? 'سقف مجاز: ۲۰ واحد در این ترم' : 'Maximum allowed: 20 credits this term'}</span>
              </div>
            </div>
          </div>

          {/* Main List of Offered Courses */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap mb-2">
              <h3 className="text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-sky-400" />
                <span>{t('offeredCoursesTitle')}</span>
              </h3>
            </div>

            {/* Category Filter Tabs */}
            <div className="flex items-center gap-1.5 p-1 bg-[#151D2A] rounded-2xl border border-white/[0.06] mb-3">
              <button
                type="button"
                onClick={() => setActiveCategoryFilter('all')}
                className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer text-center ${
                  activeCategoryFilter === 'all'
                    ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {t('allCoursesTab')} ({SAMPLE_COURSES.length})
              </button>

              <button
                type="button"
                onClick={() => setActiveCategoryFilter('specialized')}
                className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer text-center ${
                  activeCategoryFilter === 'specialized'
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {t('specializedCoursesTab')} ({specializedCount})
              </button>

              <button
                type="button"
                onClick={() => setActiveCategoryFilter('general')}
                className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer text-center ${
                  activeCategoryFilter === 'general'
                    ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {t('generalCoursesTab')} ({generalCount})
              </button>
            </div>

            {filteredCourses.map((course) => (
              <CourseSelectionItem
                key={course.id}
                course={course}
                isSelected={selectedCourseIds.includes(course.id)}
                isFa={isFa}
                hasConflictWithThis={conflictingCourseIds.has(course.id)}
                onToggle={toggleCourse}
                t={t}
              />
            ))}
          </div>

          {/* Conflict or Over limit Warning Alert Box */}
          {(hasConflict || isOverLimit) && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mx-4 sm:mx-5 p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5 shrink-0"
            >
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
              <div>
                <strong className="block font-bold">
                  {hasConflict ? t('scheduleConflictHeader') : (isFa ? 'تعداد واحدهای غیرمجاز!' : 'Exceeding Credit Limit!')}
                </strong>
                <span>
                  {hasConflict 
                    ? t('conflictDetailMsg') 
                    : (isFa ? 'مجموع واحدهای انتخابی شما فراتر از سقف مجاز (۲۰ واحد) می‌باشد.' : 'Your total selected credits exceed the maximum allowed limit (20 credits).')}
                </span>
              </div>
            </motion.div>
          )}

          {/* Bottom Summary Bar */}
          <div className="p-4 sm:p-5 border-t border-white/[0.08] bg-[#1E2738]/90 shrink-0 flex items-center justify-between gap-4 flex-wrap">
            <div>
              <div className="text-xs text-slate-400">
                {t('selectedCreditsLabel')}
              </div>
              <div className="text-base sm:text-lg font-black text-white flex items-baseline gap-1 mt-0.5">
                <span className={isOverLimit ? 'text-rose-400 font-bold' : 'text-sky-400'}>
                  {totalSelectedCredits}
                </span>
                <span className="text-xs text-slate-400 font-normal">
                  {t('allowedCreditsLabel')}
                </span>
              </div>
            </div>

            <button
              onClick={handleFinalize}
              disabled={selectedCourseIds.length === 0 || hasConflict || isOverLimit}
              className={`px-6 py-3 rounded-2xl text-xs sm:text-sm font-bold transition-all shadow-lg flex items-center gap-2 cursor-pointer ${
                hasConflict || isOverLimit || selectedCourseIds.length === 0
                  ? 'bg-slate-700/50 text-slate-400 border border-white/[0.06] cursor-not-allowed shadow-none'
                  : 'bg-gradient-to-r from-sky-500 via-indigo-600 to-blue-600 hover:from-sky-400 hover:to-indigo-500 text-white shadow-sky-600/25'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{t('finalizeRegistrationBtn')}</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

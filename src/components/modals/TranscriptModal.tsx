import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Award, 
  X, 
  TrendingUp, 
  BookOpen, 
  CheckCircle2, 
  XCircle, 
  ChevronDown, 
  ChevronUp, 
  Download, 
  GraduationCap,
  Sparkles,
  BarChart2
} from 'lucide-react';
import { useDashboard } from '../../context/DashboardContext';

export interface CourseGrade {
  id: string;
  code: string;
  nameFa: string;
  nameEn: string;
  credits: number;
  grade: number;
  passed: boolean;
}

export interface SemesterData {
  id: string;
  titleFa: string;
  titleEn: string;
  academicYear: string;
  courses: CourseGrade[];
  semesterGpa: number;
  totalCredits: number;
}

const SEMESTER_RECORDS: SemesterData[] = [
  {
    id: 'sem-4',
    titleFa: 'نیمسال دوم ۱۴۰۳ - ۱۴۰۴',
    titleEn: 'Second Semester 2024-2025',
    academicYear: '۱۴۰۳-۱۴۰۴',
    semesterGpa: 17.75,
    totalCredits: 16,
    courses: [
      { id: 'g-401', code: 'CE200-1', nameFa: 'طراحی الگوریتم', nameEn: 'Algorithm Design', credits: 3, grade: 18.5, passed: true },
      { id: 'g-402', code: 'CE301-1', nameFa: 'نظریه زبان‌ها و اتوماتا', nameEn: 'Automata Theory', credits: 3, grade: 16.0, passed: true },
      { id: 'g-403', code: 'CE304-1', nameFa: 'معماری کامپیوتر', nameEn: 'Computer Architecture', credits: 3, grade: 17.0, passed: true },
      { id: 'g-404', code: 'CE303-1', nameFa: 'مهندسی نرم‌افزار', nameEn: 'Software Engineering', credits: 3, grade: 19.0, passed: true },
      { id: 'g-405', code: 'CE202-1', nameFa: 'پایگاه داده', nameEn: 'Database Systems', credits: 3, grade: 17.5, passed: true },
      { id: 'g-406', code: 'CE205-1', nameFa: 'آزمایشگاه مدارهای منطقی', nameEn: 'Logic Circuits Lab', credits: 1, grade: 19.5, passed: true },
    ]
  },
  {
    id: 'sem-3',
    titleFa: 'نیمسال اول ۱۴۰۳ - ۱۴۰۴',
    titleEn: 'First Semester 2024-2025',
    academicYear: '۱۴۰۳-۱۴۰۴',
    semesterGpa: 17.21,
    totalCredits: 16,
    courses: [
      { id: 'g-301', code: 'CE101-1', nameFa: 'ساختمان داده‌ها', nameEn: 'Data Structures', credits: 3, grade: 17.5, passed: true },
      { id: 'g-302', code: 'CE204-1', nameFa: 'مدارهای منطقی', nameEn: 'Logic Circuits', credits: 3, grade: 18.0, passed: true },
      { id: 'g-303', code: 'MATH103-1', nameFa: 'معادلات دیفرانسیل', nameEn: 'Differential Equations', credits: 3, grade: 15.5, passed: true },
      { id: 'g-304', code: 'MATH201-1', nameFa: 'آمار و احتمال مهندسی', nameEn: 'Engineering Statistics', credits: 3, grade: 16.0, passed: true },
      { id: 'g-305', code: 'LANG201-1', nameFa: 'زبان تخصصی کامپیوتر', nameEn: 'Specialized English for CS', credits: 2, grade: 19.5, passed: true },
      { id: 'g-306', code: 'GE203-1', nameFa: 'آیین زندگی (اخلاق کاربردی)', nameEn: 'Islamic Ethics', credits: 2, grade: 18.0, passed: true },
    ]
  },
  {
    id: 'sem-2',
    titleFa: 'نیمسال دوم ۱۴۰۲ - ۱۴۰۳',
    titleEn: 'Second Semester 2023-2024',
    academicYear: '۱۴۰۲-۱۴۰۳',
    semesterGpa: 16.31,
    totalCredits: 16,
    courses: [
      { id: 'g-201', code: 'CE102-1', nameFa: 'برنامه‌نویسی پیشرفته', nameEn: 'Advanced Programming', credits: 3, grade: 19.0, passed: true },
      { id: 'g-202', code: 'MATH102-1', nameFa: 'ریاضی عمومی ۲', nameEn: 'General Mathematics 2', credits: 3, grade: 14.0, passed: true },
      { id: 'g-203', code: 'PHYS102-1', nameFa: 'فیزیک پایه ۲', nameEn: 'General Physics 2', credits: 3, grade: 13.5, passed: true },
      { id: 'g-204', code: 'EE101-1', nameFa: 'مدارهای الکتریکی', nameEn: 'Electric Circuits', credits: 3, grade: 16.5, passed: true },
      { id: 'g-205', code: 'CE203-1', nameFa: 'ریاضی مهندسی', nameEn: 'Engineering Mathematics', credits: 3, grade: 17.0, passed: true },
      { id: 'g-206', code: 'CE103-1', nameFa: 'کارگاه کامپیوتر', nameEn: 'Computer Workshop', credits: 1, grade: 20.0, passed: true },
    ]
  },
  {
    id: 'sem-1',
    titleFa: 'نیمسال اول ۱۴۰۲ - ۱۴۰۳',
    titleEn: 'First Semester 2023-2024',
    academicYear: '۱۴۰۲-۱۴۰۳',
    semesterGpa: 17.06,
    totalCredits: 17,
    courses: [
      { id: 'g-101', code: 'CE100-1', nameFa: 'مبانی برنامه‌نویسی', nameEn: 'Programming Fundamentals', credits: 3, grade: 18.5, passed: true },
      { id: 'g-102', code: 'MATH101-1', nameFa: 'ریاضی عمومی ۱', nameEn: 'General Mathematics 1', credits: 3, grade: 15.0, passed: true },
      { id: 'g-103', code: 'PHYS101-1', nameFa: 'فیزیک پایه ۱', nameEn: 'General Physics 1', credits: 3, grade: 14.5, passed: true },
      { id: 'g-104', code: 'GE101-1', nameFa: 'فارسی عمومی', nameEn: 'General Persian', credits: 3, grade: 19.0, passed: true },
      { id: 'g-105', code: 'GE102-1', nameFa: 'زبان انگلیسی عمومی', nameEn: 'General English', credits: 3, grade: 17.5, passed: true },
      { id: 'g-106', code: 'GE201-1', nameFa: 'اندیشه اسلامی ۱', nameEn: 'Islamic Thought 1', credits: 2, grade: 18.0, passed: true },
    ]
  }
];

// Single Semester Accordion Card Component
const SemesterTranscriptCard: React.FC<{
  semester: SemesterData;
  isOpen: boolean;
  onToggle: () => void;
  isFa: boolean;
  t: (key: string, params?: Record<string, string | number>) => string;
}> = ({ semester, isOpen, onToggle, isFa, t }) => {
  return (
    <div className="bg-[#151D2A] border border-white/[0.08] rounded-2xl overflow-hidden transition-all duration-200">
      {/* Accordion Header */}
      <button
        onClick={onToggle}
        className="w-full p-3.5 sm:p-4 flex items-center justify-between gap-3 text-start hover:bg-white/[0.03] transition-colors cursor-pointer select-none"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0">
            <BookOpen className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h4 className="text-xs sm:text-sm font-bold text-slate-100 truncate">
              {isFa ? semester.titleFa : semester.titleEn}
            </h4>
            <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
              <span>{t('semesterCredits')} {semester.totalCredits} {t('creditsLabel')}</span>
              <span>•</span>
              <span className="text-sky-300 font-bold">{t('semesterGpa')} {semester.semesterGpa.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <span className="px-2.5 py-1 bg-sky-500/10 text-sky-300 border border-sky-500/20 rounded-full text-xs font-black dir-ltr">
            {semester.semesterGpa.toFixed(2)}
          </span>
          <div className="text-slate-400 hover:text-white p-1">
            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </div>
      </button>

      {/* Accordion Body */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="p-3 sm:p-4 pt-0 border-t border-white/[0.06] bg-[#121824]/60">
              <div className="overflow-x-auto mt-2">
                <table className="w-full text-xs text-start">
                  <thead>
                    <tr className="border-b border-white/[0.08] text-slate-400 font-semibold text-[11px]">
                      <th className="py-2 px-2 text-start">{t('codeLabel')}</th>
                      <th className="py-2 px-2 text-start">{t('courseNameHeader')}</th>
                      <th className="py-2 px-2 text-center">{t('courseCreditsHeader')}</th>
                      <th className="py-2 px-2 text-center">{t('gradeHeader')}</th>
                      <th className="py-2 px-2 text-end">{t('statusHeader')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {semester.courses.map((course) => (
                      <tr key={course.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-2.5 px-2 font-mono text-[11px] text-sky-400 font-bold">
                          {course.code}
                        </td>
                        <td className="py-2.5 px-2 font-bold text-slate-200">
                          {isFa ? course.nameFa : course.nameEn}
                        </td>
                        <td className="py-2.5 px-2 text-center text-slate-300 font-mono">
                          {course.credits}
                        </td>
                        <td className="py-2.5 px-2 text-center font-black font-mono dir-ltr">
                          <span className={course.grade >= 17 ? 'text-emerald-400' : course.grade >= 14 ? 'text-sky-300' : 'text-amber-300'}>
                            {course.grade.toFixed(1)}
                          </span>
                        </td>
                        <td className="py-2.5 px-2 text-end">
                          {course.passed ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>{t('statusPassed')}</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                              <XCircle className="w-3 h-3" />
                              <span>{t('statusFailed')}</span>
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Semester Summary Footer */}
              <div className="mt-3 pt-2.5 border-t border-white/[0.08] flex items-center justify-between text-xs text-slate-300 font-bold px-2 bg-slate-900/40 py-2 rounded-xl">
                <span>{t('semesterGpa')} <strong className="text-sky-300 font-black font-mono ml-1">{semester.semesterGpa.toFixed(2)}</strong></span>
                <span>{t('semesterCredits')} <strong className="text-white font-black font-mono ml-1">{semester.totalCredits}</strong></span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// SVG GPA Line Chart Component
const GpaTrendChart: React.FC<{ semesters: SemesterData[]; isFa: boolean }> = ({ semesters, isFa }) => {
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);

  // Semesters ordered chronologically (1 -> 4)
  const chronoSemesters = [...semesters].reverse();

  const width = 450;
  const height = 150;
  const paddingX = 40;
  const paddingY = 25;

  const minGpa = 12;
  const maxGpa = 20;

  const points = chronoSemesters.map((sem, index) => {
    const x = paddingX + (index * (width - 2 * paddingX)) / (chronoSemesters.length - 1);
    const y = height - paddingY - ((sem.semesterGpa - minGpa) / (maxGpa - minGpa)) * (height - 2 * paddingY);
    return { x, y, gpa: sem.semesterGpa, title: isFa ? sem.titleFa : sem.titleEn };
  });

  const pathD = points.reduce((acc, p, i) => {
    return i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
  }, '');

  const areaD = `${pathD} L ${points[points.length - 1].x} ${height - paddingY} L ${points[0].x} ${height - paddingY} Z`;

  return (
    <div className="w-full bg-[#151D2A] border border-white/[0.08] rounded-2xl p-4 shadow-inner relative">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-sky-400" />
          <span className="text-xs font-bold text-slate-200">
            {isFa ? 'نمودار روند معدل نیمسال‌ها' : 'Semester GPA Trend'}
          </span>
        </div>
        <span className="text-[10px] text-slate-400 font-mono">
          {isFa ? 'ترم ۱ تا ترم ۴' : 'Sem 1 to Sem 4'}
        </span>
      </div>

      <div className="relative w-full overflow-hidden">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
          <defs>
            <linearGradient id="gpaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[14, 16, 18, 20].map((val) => {
            const y = height - paddingY - ((val - minGpa) / (maxGpa - minGpa)) * (height - 2 * paddingY);
            return (
              <g key={val}>
                <line x1={paddingX} y1={y} x2={width - paddingX} y2={y} stroke="#ffffff" strokeOpacity="0.06" strokeDasharray="3 3" />
                <text x={paddingX - 8} y={y + 3} textAnchor="end" fill="#94A3B8" fontSize="9" fontFamily="monospace">
                  {val}
                </text>
              </g>
            );
          })}

          {/* Area Fill */}
          <path d={areaD} fill="url(#gpaGradient)" />

          {/* Line Path */}
          <path d={pathD} fill="none" stroke="#38BDF8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

          {/* Data Points */}
          {points.map((p, idx) => (
            <g 
              key={idx} 
              className="cursor-pointer group"
              onMouseEnter={() => setHoveredPoint(idx)}
              onMouseLeave={() => setHoveredPoint(null)}
            >
              <circle cx={p.x} cy={p.y} r="5" fill="#0F172A" stroke="#38BDF8" strokeWidth="2.5" className="transition-transform group-hover:scale-125" />
              <circle cx={p.x} cy={p.y} r="2" fill="#38BDF8" />
              
              {/* Value label above point */}
              <text 
                x={p.x} 
                y={p.y - 10} 
                textAnchor="middle" 
                fill="#38BDF8" 
                fontSize="10" 
                fontWeight="bold" 
                fontFamily="monospace"
              >
                {p.gpa.toFixed(2)}
              </text>
            </g>
          ))}
        </svg>

        {/* Hover Tooltip display */}
        {hoveredPoint !== null && (
          <div className="mt-2 text-center text-xs text-sky-300 font-bold bg-sky-500/10 border border-sky-500/20 py-1 px-2 rounded-lg">
            {points[hoveredPoint].title}: <span className="font-mono">{points[hoveredPoint].gpa.toFixed(2)}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export const TranscriptModal: React.FC = () => {
  const { activeModal, closeModal, showToast, language, t, studentProfile } = useDashboard();
  const isFa = language === 'fa';

  // Accordion open state for semesters (default top/latest semester open)
  const [openSemesterIds, setOpenSemesterIds] = useState<string[]>(['sem-4']);

  if (activeModal !== 'transcript') return null;

  const toggleSemester = (id: string) => {
    setOpenSemesterIds(prev => 
      prev.includes(id) ? prev.filter(sId => sId !== id) : [...prev, id]
    );
  };

  const handleExpandAll = () => {
    setOpenSemesterIds(SEMESTER_RECORDS.map(s => s.id));
  };

  const handleCollapseAll = () => {
    setOpenSemesterIds([]);
  };

  const handleDownloadPdf = () => {
    showToast(t('downloadingPdfToast'));
  };

  const overallGpa = 17.08;
  const lastTermGpa = SEMESTER_RECORDS[0].semesterGpa; // 17.75
  const passedCredits = 65;
  const totalCredits = studentProfile.creditsTotal || 140;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="w-full max-w-2xl bg-[#1E293B] border border-slate-700/80 rounded-[28px] shadow-2xl text-slate-100 flex flex-col max-h-[90vh] overflow-hidden"
          dir={isFa ? 'rtl' : 'ltr'}
        >
          {/* Modal Header */}
          <div className="p-5 sm:p-6 border-b border-white/[0.08] bg-[#172030] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-tr from-sky-500/20 to-indigo-500/20 text-sky-400 rounded-2xl border border-sky-500/30 shadow-md">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-extrabold text-white">
                    {t('transcriptTitle')}
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30">
                    {studentProfile.field || (isFa ? 'مهندسی کامپیوتر' : 'Computer Engineering')}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  {t('transcriptSub')}
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

          {/* Modal Scrollable Body */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">

            {/* 1. Academic Summary Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Card 1: Overall GPA */}
              <div className="p-3.5 bg-[#151D2A] border border-white/[0.08] rounded-2xl flex flex-col justify-between">
                <span className="text-[11px] text-slate-400 font-bold">{t('overallGpa')}</span>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-xl sm:text-2xl font-black text-amber-400 font-mono">{overallGpa.toFixed(2)}</span>
                  <span className="text-[10px] text-slate-500 font-normal">/ ۲۰</span>
                </div>
                <span className="text-[10px] text-emerald-400 font-semibold mt-1 flex items-center gap-0.5">
                  <Sparkles className="w-3 h-3 shrink-0" />
                  <span>{isFa ? 'عالی' : 'Excellent'}</span>
                </span>
              </div>

              {/* Card 2: Last Term GPA */}
              <div className="p-3.5 bg-[#151D2A] border border-white/[0.08] rounded-2xl flex flex-col justify-between">
                <span className="text-[11px] text-slate-400 font-bold">{t('lastTermGpa')}</span>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-xl sm:text-2xl font-black text-sky-400 font-mono">{lastTermGpa.toFixed(2)}</span>
                  <span className="text-[10px] text-slate-500 font-normal">/ ۲۰</span>
                </div>
                <span className="text-[10px] text-sky-400 font-semibold mt-1">
                  {isFa ? 'نیمسال قبل' : 'Latest Term'}
                </span>
              </div>

              {/* Card 3: Passed Credits */}
              <div className="p-3.5 bg-[#151D2A] border border-white/[0.08] rounded-2xl flex flex-col justify-between">
                <span className="text-[11px] text-slate-400 font-bold">{t('totalPassedCredits')}</span>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-xl sm:text-2xl font-black text-indigo-400 font-mono">{passedCredits}</span>
                  <span className="text-[10px] text-slate-400 font-normal">/ {totalCredits}</span>
                </div>
                <span className="text-[10px] text-slate-400 font-semibold mt-1">
                  {Math.round((passedCredits / totalCredits) * 100)}% {isFa ? 'کل دوره' : 'Completed'}
                </span>
              </div>

              {/* Card 4: Academic Status */}
              <div className="p-3.5 bg-[#151D2A] border border-white/[0.08] rounded-2xl flex flex-col justify-between">
                <span className="text-[11px] text-slate-400 font-bold">{t('academicStatus')}</span>
                <div className="mt-2">
                  <span className="inline-block text-xs font-bold px-2 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-lg">
                    {t('statusActiveNormal')}
                  </span>
                </div>
                <span className="text-[10px] text-emerald-400 font-semibold mt-1 flex items-center gap-1">
                  <GraduationCap className="w-3 h-3 shrink-0" />
                  <span>{isFa ? 'مجاز به ادامه تحصیل' : 'Active Status'}</span>
                </span>
              </div>
            </div>

            {/* 2. GPA Trend Chart */}
            <GpaTrendChart semesters={SEMESTER_RECORDS} isFa={isFa} />

            {/* 3. Semester Accordion Records */}
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-sky-400" />
                  <h3 className="text-xs sm:text-sm font-bold text-slate-200">
                    {isFa ? 'ریز نمرات نیمسال‌های گذشته' : 'Semester Course Details'}
                  </h3>
                  <span className="px-2 py-0.5 bg-slate-800 text-slate-400 rounded-md text-[10px] font-mono">
                    {t('termCountBadge', { count: SEMESTER_RECORDS.length })}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <button
                    type="button"
                    onClick={handleExpandAll}
                    className="text-[11px] text-sky-400 hover:text-sky-300 font-semibold cursor-pointer"
                  >
                    {t('accordionExpandAll')}
                  </button>
                  <span className="text-slate-600">•</span>
                  <button
                    type="button"
                    onClick={handleCollapseAll}
                    className="text-[11px] text-slate-400 hover:text-slate-300 font-semibold cursor-pointer"
                  >
                    {t('accordionCollapseAll')}
                  </button>
                </div>
              </div>

              <div className="space-y-2.5">
                {SEMESTER_RECORDS.map((semester) => (
                  <SemesterTranscriptCard
                    key={semester.id}
                    semester={semester}
                    isOpen={openSemesterIds.includes(semester.id)}
                    onToggle={() => toggleSemester(semester.id)}
                    isFa={isFa}
                    t={t}
                  />
                ))}
              </div>
            </div>

          </div>

          {/* Modal Footer */}
          <div className="p-4 sm:p-5 border-t border-white/[0.08] bg-[#172030] flex items-center justify-between gap-3 shrink-0">
            <button
              type="button"
              onClick={handleDownloadPdf}
              className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-lg shadow-sky-600/20 transition-all cursor-pointer active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>{t('downloadPdfBtn')}</span>
            </button>

            <button
              type="button"
              onClick={closeModal}
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl text-xs sm:text-sm font-bold transition-colors cursor-pointer"
            >
              {isFa ? 'بستن' : 'Close'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

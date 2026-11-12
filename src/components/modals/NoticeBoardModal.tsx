import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Megaphone, 
  X, 
  Search, 
  GraduationCap, 
  CreditCard, 
  HeartHandshake, 
  Sparkles, 
  AlertTriangle, 
  Calendar, 
  Clock, 
  Building2, 
  ArrowRight, 
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Filter,
  CheckCircle2,
  FileQuestion
} from 'lucide-react';
import { useDashboard } from '../../context/DashboardContext';

type CategoryType = 'all' | 'academic' | 'financial' | 'welfare' | 'cultural' | 'emergency';

interface Announcement {
  id: string;
  titleFa: string;
  titleEn: string;
  category: Exclude<CategoryType, 'all'>;
  dateFa: string;
  dateEn: string;
  timeFa: string;
  timeEn: string;
  summaryFa: string;
  summaryEn: string;
  contentFa: string;
  contentEn: string;
  departmentFa: string;
  departmentEn: string;
  isUnreadInitial: boolean;
}

const SAMPLE_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'ann-1',
    titleFa: 'تمدید مهلت انتخاب واحد ترم جاری تا ۱۰ روز آینده',
    titleEn: 'Extension of Course Registration Deadline for Current Term',
    category: 'academic',
    dateFa: '۱۴۰۵/۰۵/۰۳',
    dateEn: '2026/07/25',
    timeFa: '۱۴:۳۰',
    timeEn: '14:30',
    summaryFa: 'به اطلاع تمامی دانشجویان محترم می‌رساند مهلت انتخاب واحد و حذف و اضافه ترم جاری تا ۱۰ مردادماه تمدید گردید.',
    summaryEn: 'Please be informed that the deadline for course registration and add/drop has been extended.',
    contentFa: 'به اطلاع تمامی دانشجویان محترم می‌رساند بنا به درخواست شورای صنفی دانشجویان و تایید معاونت آموزشی و تحصیلات تکمیلی موسسه، مهلت انتخاب واحد و حذف و اضافه ترم جاری تا تاریخ ۱۰ مردادماه تمدید گردید.\n\nدانشجویانی که تاکنون موفق به اخذ دروس خود نشده‌اند یا نیاز به ویرایش لیست دروس انتخابی دارند، می‌توانند با مراجعه به بخش «امور آموزشی > انتخاب واحد»، نسبت به تثبیت برنامه هفتگی خود اقدام نمایند.',
    contentEn: 'Following requests from student council and approval from Academic Affairs, the course registration deadline has been extended to August 1st.\n\nStudents who have not finalized their courses are encouraged to complete registration in the Academic section.',
    departmentFa: 'معاونت آموزشی و پژوهشی',
    departmentEn: 'Office of Academic Affairs',
    isUnreadInitial: true,
  },
  {
    id: 'ann-2',
    titleFa: 'تعطیلی دانشگاه و بخش‌های اداری به مناسبت روز دانشجو',
    titleEn: 'University Closure on Student Day',
    category: 'emergency',
    dateFa: '۱۴۰۵/۰۴/۲۸',
    dateEn: '2026/07/19',
    timeFa: '۰۹:۱۵',
    timeEn: '09:15',
    summaryFa: 'کلیه کلاس‌های آموزشی و بخش‌های اداری موسسه در روز دانشجو تعطیل می‌باشد.',
    summaryEn: 'All academic classes and administrative departments will be closed on Student Day.',
    contentFa: 'به اطلاع کلیه دانشجویان، اساتید و همکاران گرامی می‌رساند کلیه کلاس‌های آموزشی (حضوری و آنلاین) و تمامی بخش‌های اداری موسسه در روز دانشجو تعطیل خواهد بود.\n\nلازم به ذکر است امتحانات میا‌ن‌ترم یا جلسات دفاع که پیش از این برای این روز زمان‌بندی شده بودند، به اولین روز کاری پس از تعطیلات موکول شده و زمان‌بندی جدید توسط مدیران گروه اطلاع‌رسانی خواهد شد.',
    contentEn: 'All academic classes and administrative offices will be closed on Student Day. Midterm exams scheduled on this date will be rescheduled.',
    departmentFa: 'روابط عمومی و مدیریت اجرایی',
    departmentEn: 'Public Relations & Administration',
    isUnreadInitial: false,
  },
  {
    id: 'ann-3',
    titleFa: 'فراخوان ثبت‌نام وام‌های دانشجویی صندوق رفاه',
    titleEn: 'Call for Student Loans Application - Welfare Fund',
    category: 'welfare',
    dateFa: '۱۴۰۵/۰۴/۲۵',
    dateEn: '2026/07/16',
    timeFa: '۱۱:۰۰',
    timeEn: '11:00',
    summaryFa: 'آغاز ثبت‌نام انواع وام‌های تحصیلی، ودیعه مسکن و ضروری دانشجویی در پورتال خدمات رفاهی.',
    summaryEn: 'Applications for tuition, housing deposit, and emergency student loans are now open.',
    contentFa: 'ثبت‌نام انواع وام‌های دانشجویی شامل وام تحصیلی، وام ودیعه مسکن و وام ضروری برای نیمسال پیش‌رو آغاز گردید.\n\nدانشجویان متقاضی می‌توانند با مراجعه به بخش «خدمات رفاهی» و بارگذاری مدارک و سند تعهدنامه محضری، درخواست خود را ثبت نمایند. اولویت اعطای وام با دانشجویانی است که در مهلت مقرر اقدام به تکمیل پرونده نمایند.',
    contentEn: 'Applications for tuition, housing, and emergency loans for the upcoming semester have started. Apply via the Student Welfare section.',
    departmentFa: 'اداره رفاه و امور دانشجویی',
    departmentEn: 'Department of Student Welfare',
    isUnreadInitial: true,
  },
  {
    id: 'ann-4',
    titleFa: 'تغییر ساعات پاسخگویی اداره امور مالی و شهریه',
    titleEn: 'Change in Working Hours for Financial Affairs Department',
    category: 'financial',
    dateFa: '۱۴۰۵/۰۴/۲۰',
    dateEn: '2026/07/11',
    timeFa: '۰۸:۴۵',
    timeEn: '08:45',
    summaryFa: 'ساعات پاسخگویی حضوری و تلفنی کارشناسان امور مالی و صندوق رفاه تغییر یافت.',
    summaryEn: 'In-person and telephone support hours for financial affairs have been updated.',
    contentFa: 'به منظور تسهیل و تسریع در بررسی درخواست‌های تسویه‌حساب و پردازش پرداخت‌های شهریه، ساعات کار اداره امور مالی از هفته آینده به شرح زیر خواهد بود:\n\n• روزهای شنبه تا چهارشنبه: از ساعت ۰۸:۰۰ الی ۱۳:۳۰\n• روزهای پنج‌شنبه: تسویه‌حساب آنلاین و غیرحضوری\n\nامکان پرداخت آنلاین شهریه و مشاهده صورت‌حساب مالی همچون گذشته به صورت ۲۴ ساعته در سامانه فعال می‌باشد.',
    contentEn: 'Financial department working hours updated to Sat-Wed 08:00 to 13:30. Online tuition payment remains active 24/7.',
    departmentFa: 'اداره کل امور مالی و صندوق',
    departmentEn: 'Financial Affairs Department',
    isUnreadInitial: false,
  },
  {
    id: 'ann-5',
    titleFa: 'برگزاری کارگاه تخصصی هوش مصنوعی و تحلیل داده - ثبت‌نام آزاد',
    titleEn: 'AI & Data Analysis Workshop - Open Registration',
    category: 'cultural',
    dateFa: '۱۴۰۵/۰۴/۱۵',
    dateEn: '2026/07/06',
    timeFa: '۱۶:۰۰',
    timeEn: '16:00',
    summaryFa: 'انجمن علمی دانشجویی دوره کاربردی ابزارهای مولد و تحلیل داده برگزار می‌کند.',
    summaryEn: 'Student Scientific Association hosts a practical workshop on AI tools & data analytics.',
    contentFa: 'انجمن علمی دانشجویی مهندسی کامپیوتر با همکاری مدیریت فرهنگی دانشگاه اقدام به برگزاری کارگاه آموزشی «کاربرد مدل‌های هوش مصنوعی مولد در پژوهش و تحلیل داده» نموده است.\n\nزمان برگزاری: پنج‌شنبه‌ها ساعت ۱۴:۰۰ الی ۱۷:۰۰\nمدت دوره: ۱۲ ساعت (۴ جلسه)\nمزایا: ارائه گواهی معتبر دو زبانه و دسترسی به ویدیوهای ضبط شده.\nحضور برای تمامی دانشجویان علاقمند آزاد و رایگان می‌باشد.',
    contentEn: 'Computer Engineering Student Association holds a 12-hour practical workshop on AI tools and data science with certified completion certificates.',
    departmentFa: 'مدیریت امور فرهنگی و اجتماعی',
    departmentEn: 'Cultural & Student Affairs',
    isUnreadInitial: true,
  },
  {
    id: 'ann-6',
    titleFa: 'اعلام زمان‌بندی دقیق امتحانات میان‌ترم دروس عمومی و اختصاصی',
    titleEn: 'Midterm Examination Schedule Announcement',
    category: 'academic',
    dateFa: '۱۴۰۵/۰۴/۱۰',
    dateEn: '2026/07/01',
    timeFa: '۱۰:۲۰',
    timeEn: '10:20',
    summaryFa: 'برنامه امتحانات میان‌ترم کلیه دانشکده‌ها در بخش برنامه هفتگی قرار گرفت.',
    summaryEn: 'Midterm exam schedule for all faculties is now available in your weekly schedule section.',
    contentFa: 'دانشجویان گرامی می‌توانند با مراجعه به کارت «امور آموزشی > برنامه هفتگی و امتحانات»، تاریخ، ساعت و شماره صندلی امتحانات میان‌ترم دروس اخذ شده خود را مشاهده نمایند.\n\nهمراه داشتن کارت دانشجویی معتبر یا کارت ورود به جلسه دیجیتال در تمام جلسات آزمون الزامی است.',
    contentEn: 'Please check your exam schedules in the Academic Affairs section. Student ID is required during exam sessions.',
    departmentFa: 'ستاد برگزاری امتحانات و سنجش',
    departmentEn: 'Exams & Assessment Board',
    isUnreadInitial: false,
  }
];

export const NoticeBoardModal: React.FC = () => {
  const { activeModal, closeModal, language, t } = useDashboard();
  const isFa = language === 'fa';

  const [activeCategory, setActiveCategory] = useState<CategoryType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [readIds, setReadIds] = useState<Record<string, boolean>>({});
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);

  if (activeModal !== 'notice_board') return null;

  // Helpers
  const isRead = (item: Announcement) => {
    if (readIds[item.id] !== undefined) return readIds[item.id];
    return !item.isUnreadInitial;
  };

  const markAsRead = (id: string) => {
    setReadIds(prev => ({ ...prev, [id]: true }));
  };

  // Filtered list
  const filteredAnnouncements = useMemo(() => {
    return SAMPLE_ANNOUNCEMENTS.filter(item => {
      const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
      const title = isFa ? item.titleFa : item.titleEn;
      const summary = isFa ? item.summaryFa : item.summaryEn;
      const content = isFa ? item.contentFa : item.contentEn;
      const searchLower = searchQuery.toLowerCase().trim();

      const matchesSearch = !searchLower || 
        title.toLowerCase().includes(searchLower) || 
        summary.toLowerCase().includes(searchLower) ||
        content.toLowerCase().includes(searchLower);

      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, isFa, searchQuery]);

  const totalUnreadCount = SAMPLE_ANNOUNCEMENTS.filter(item => !isRead(item)).length;

  const getCategoryBadge = (cat: Exclude<CategoryType, 'all'>) => {
    switch (cat) {
      case 'academic':
        return {
          label: isFa ? 'آموزشی' : 'Academic',
          icon: GraduationCap,
          colorClass: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
          dotBg: 'bg-blue-400'
        };
      case 'financial':
        return {
          label: isFa ? 'مالی' : 'Financial',
          icon: CreditCard,
          colorClass: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
          dotBg: 'bg-emerald-400'
        };
      case 'welfare':
        return {
          label: isFa ? 'رفاهی' : 'Welfare',
          icon: HeartHandshake,
          colorClass: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
          dotBg: 'bg-amber-400'
        };
      case 'cultural':
        return {
          label: isFa ? 'فرهنگی' : 'Cultural',
          icon: Sparkles,
          colorClass: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
          dotBg: 'bg-purple-400'
        };
      case 'emergency':
        return {
          label: isFa ? 'اضطراری' : 'Emergency',
          icon: AlertTriangle,
          colorClass: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
          dotBg: 'bg-rose-400'
        };
    }
  };

  const getCategoryCount = (cat: CategoryType) => {
    if (cat === 'all') return SAMPLE_ANNOUNCEMENTS.length;
    return SAMPLE_ANNOUNCEMENTS.filter(a => a.category === cat).length;
  };

  const categoriesConfig: { id: CategoryType; label: string }[] = [
    { id: 'all', label: isFa ? 'همه' : 'All' },
    { id: 'academic', label: isFa ? 'آموزشی' : 'Academic' },
    { id: 'financial', label: isFa ? 'مالی' : 'Financial' },
    { id: 'welfare', label: isFa ? 'رفاهی' : 'Welfare' },
    { id: 'cultural', label: isFa ? 'فرهنگی' : 'Cultural' },
    { id: 'emergency', label: isFa ? 'اضطراری' : 'Emergency' },
  ];

  const handleCardClick = (item: Announcement) => {
    markAsRead(item.id);
    setSelectedAnnouncement(item);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-[#0F172A]/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.96 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="w-full max-w-3xl bg-[#1C2436] border border-white/[0.08] rounded-t-[30px] sm:rounded-[30px] shadow-2xl text-white flex flex-col h-[90vh] sm:h-[85vh] max-h-[800px] overflow-hidden"
          dir={isFa ? 'rtl' : 'ltr'}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 sm:p-6 border-b border-white/[0.08] shrink-0 bg-[#1C2436]/90">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-indigo-600/20 border border-indigo-500/30 rounded-2xl flex items-center justify-center shrink-0">
                <Megaphone className="w-6 h-6 text-[#818CF8] stroke-[2]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-bold text-white">
                    {isFa ? 'برد آزاد اطلاعات' : 'Free Information Board'}
                  </h2>
                  {totalUnreadCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
                      {totalUnreadCount} {isFa ? 'جدید' : 'New'}
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#BBC1D1] mt-0.5">
                  {isFa ? 'آخرین اعلانات، بخشنامه‌ها و اطلاعیه‌های عمومی دانشگاه' : 'Latest university announcements, circulars & notices'}
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                if (selectedAnnouncement) {
                  setSelectedAnnouncement(null);
                } else {
                  closeModal();
                }
              }}
              className="p-2 rounded-2xl hover:bg-white/10 text-[#BBC1D1] hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5 text-white stroke-[2]" />
            </button>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 overflow-hidden flex flex-col">
            {selectedAnnouncement ? (
              /* Detail View */
              <motion.div 
                initial={{ opacity: 0, x: isFa ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: isFa ? 20 : -20 }}
                className="flex-1 overflow-y-auto p-5 sm:p-6 flex flex-col justify-between"
              >
                <div className="space-y-5">
                  {/* Back button & Category badge */}
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <button
                      onClick={() => setSelectedAnnouncement(null)}
                      className="px-3.5 py-2 rounded-xl bg-[#232D42] hover:bg-[#2d3a54] text-[#BBC1D1] hover:text-white text-xs font-semibold border border-white/[0.08] transition-all flex items-center gap-2 cursor-pointer"
                    >
                      {isFa ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
                      <span>{isFa ? 'بازگشت به لیست اطلاعیه‌ها' : 'Back to List'}</span>
                    </button>

                    {(() => {
                      const badge = getCategoryBadge(selectedAnnouncement.category);
                      const BadgeIcon = badge.icon;
                      return (
                        <div className={`px-3 py-1 rounded-full border text-xs font-bold flex items-center gap-1.5 ${badge.colorClass}`}>
                          <BadgeIcon className="w-3.5 h-3.5" />
                          <span>{badge.label}</span>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Title */}
                  <h3 className="text-lg sm:text-xl font-black text-white leading-relaxed pt-2">
                    {isFa ? selectedAnnouncement.titleFa : selectedAnnouncement.titleEn}
                  </h3>

                  {/* Meta Bar */}
                  <div className="flex items-center gap-4 text-xs text-[#BBC1D1] flex-wrap pb-3 border-b border-white/[0.08]">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#818CF8]" />
                      <span>{isFa ? selectedAnnouncement.dateFa : selectedAnnouncement.dateEn}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-[#818CF8]" />
                      <span>{isFa ? selectedAnnouncement.timeFa : selectedAnnouncement.timeEn}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-[#818CF8]" />
                      <span>{isFa ? selectedAnnouncement.departmentFa : selectedAnnouncement.departmentEn}</span>
                    </div>
                  </div>

                  {/* Full Text Content */}
                  <div className="bg-[#232D42]/60 border border-white/[0.06] rounded-2xl p-4 sm:p-5 text-sm sm:text-base text-slate-200 leading-loose whitespace-pre-line">
                    {isFa ? selectedAnnouncement.contentFa : selectedAnnouncement.contentEn}
                  </div>
                </div>

                {/* Detail Footer */}
                <div className="pt-6 mt-6 border-t border-white/[0.08] flex items-center justify-between">
                  <span className="text-xs text-slate-400">
                    {isFa ? 'کد اطلاعیه:' : 'Notice ID:'} <span className="font-mono text-indigo-300">{selectedAnnouncement.id}</span>
                  </span>
                  <button
                    onClick={() => setSelectedAnnouncement(null)}
                    className="px-5 py-2.5 rounded-xl bg-[#6366F1] hover:bg-[#5254e0] text-white text-xs font-bold transition-all shadow-md cursor-pointer"
                  >
                    {isFa ? 'متوجه شدم' : 'Got it'}
                  </button>
                </div>
              </motion.div>
            ) : (
              /* List View */
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Search & Filters Header */}
                <div className="p-4 sm:p-5 border-b border-white/[0.08] bg-[#1E2738]/50 space-y-3 shrink-0">
                  {/* Search Bar */}
                  <div className="relative">
                    <Search className={`w-4 h-4 text-slate-400 absolute ${isFa ? 'right-3.5' : 'left-3.5'} top-1/2 -translate-y-1/2`} />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={isFa ? 'جستجو در عناوین و متن اطلاعیه‌ها...' : 'Search in titles & content...'}
                      className={`w-full bg-[#232D42] border border-white/[0.08] focus:border-[#6366F1] text-white text-xs sm:text-sm placeholder-slate-400/60 rounded-xl py-2.5 transition-all outline-none ${isFa ? 'pr-10 pl-4' : 'pl-10 pr-4'}`}
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className={`absolute ${isFa ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs`}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Horizontal Scrollable Tabs */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar pt-1">
                    {categoriesConfig.map((cat) => {
                      const isActive = activeCategory === cat.id;
                      const count = getCategoryCount(cat.id);
                      return (
                        <button
                          key={cat.id}
                          onClick={() => setActiveCategory(cat.id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                            isActive
                              ? 'bg-[#6366F1] text-white shadow-md shadow-indigo-600/30'
                              : 'bg-[#232D42] hover:bg-[#2e3b56] text-[#BBC1D1] border border-white/[0.06]'
                          }`}
                        >
                          <span>{cat.label}</span>
                          <span
                            className={`px-1.5 py-0.2 text-[10px] rounded-full ${
                              isActive ? 'bg-white/20 text-white' : 'bg-black/20 text-slate-400'
                            }`}
                          >
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Announcement Cards List */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
                  {filteredAnnouncements.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400">
                      <div className="w-16 h-16 rounded-3xl bg-[#232D42] border border-white/[0.08] flex items-center justify-center mb-4">
                        <FileQuestion className="w-8 h-8 text-slate-400" />
                      </div>
                      <h4 className="text-sm font-bold text-slate-200">
                        {isFa ? 'اطلاعیه‌ای یافت نشد' : 'No Announcements Found'}
                      </h4>
                      <p className="text-xs text-slate-400 max-w-xs mt-1">
                        {isFa
                          ? 'هیچ اطلاعیه‌ای با مشخصات و فیلتر انتخابی شما پیدا نشد.'
                          : 'No announcements match your search query or selected category filter.'}
                      </p>
                      {(searchQuery || activeCategory !== 'all') && (
                        <button
                          onClick={() => {
                            setSearchQuery('');
                            setActiveCategory('all');
                          }}
                          className="mt-4 px-4 py-2 rounded-xl bg-[#232D42] hover:bg-[#2d3a54] text-indigo-400 text-xs font-semibold transition-all border border-indigo-500/30 cursor-pointer"
                        >
                          {isFa ? 'پاک‌کردن فیلترها' : 'Clear Filters'}
                        </button>
                      )}
                    </div>
                  ) : (
                    filteredAnnouncements.map((item) => {
                      const unread = !isRead(item);
                      const badge = getCategoryBadge(item.category);
                      const BadgeIcon = badge.icon;
                      const title = isFa ? item.titleFa : item.titleEn;
                      const summary = isFa ? item.summaryFa : item.summaryEn;
                      const date = isFa ? item.dateFa : item.dateEn;
                      const dept = isFa ? item.departmentFa : item.departmentEn;

                      return (
                        <motion.div
                          key={item.id}
                          whileHover={{ scale: 1.005, y: -1 }}
                          whileTap={{ scale: 0.995 }}
                          onClick={() => handleCardClick(item)}
                          className={`p-4 rounded-2xl border transition-all cursor-pointer relative group ${
                            unread
                              ? 'bg-[#1E293B] border-indigo-500/40 shadow-lg shadow-indigo-950/20'
                              : 'bg-[#1C2436]/80 hover:bg-[#212B3E] border-white/[0.06] hover:border-white/[0.12]'
                          }`}
                        >
                          {/* Unread Blue Indicator Dot */}
                          {unread && (
                            <span 
                              className={`absolute top-4 ${isFa ? 'left-4' : 'right-4'} w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-sm shadow-indigo-500/50 animate-pulse`} 
                              title={isFa ? 'خوانده نشده' : 'Unread'}
                            />
                          )}

                          <div className="flex items-start gap-3.5">
                            {/* Icon Circle */}
                            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border mt-0.5 ${badge.colorClass}`}>
                              <BadgeIcon className="w-5 h-5" />
                            </div>

                            {/* Card Content */}
                            <div className="flex-1 min-w-0 pr-1">
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badge.colorClass}`}>
                                  {badge.label}
                                </span>
                                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                                  <Calendar className="w-3 h-3 text-slate-500" />
                                  {date}
                                </span>
                                <span className="text-[11px] text-slate-500 hidden sm:inline">•</span>
                                <span className="text-[11px] text-slate-400 hidden sm:inline">{dept}</span>
                              </div>

                              <h4 className={`text-xs sm:text-sm font-bold text-slate-100 group-hover:text-indigo-300 transition-colors line-clamp-1 ${unread ? 'font-extrabold text-white' : ''}`}>
                                {title}
                              </h4>

                              <p className="text-xs text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                                {summary}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

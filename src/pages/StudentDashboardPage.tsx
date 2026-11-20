import React from 'react';
import { motion } from 'motion/react';
import { 
  GraduationCap, 
  LogOut, 
  User, 
  Lock, 
  MessageSquare, 
  Megaphone,
  Send, 
  CheckSquare, 
  Award, 
  Calendar, 
  FileText, 
  ShieldCheck, 
  CreditCard, 
  Receipt, 
  History, 
  Home, 
  Coins, 
  Contact, 
  Utensils,
  FolderKanban,
  BookOpen,
  Wallet,
  HeartHandshake,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Building2,
  Clock,
  ShieldAlert
} from 'lucide-react';
import { useAuth, useI18n, useLayoutSettings, useModalActions, useToastActions } from '../context/DashboardContext';
import { HeaderBar } from '../components/HeaderBar';
import { Footer } from '../components/Footer';
import { UserAvatar } from '../components/UserAvatar';
import { AdminDashboardOverview } from '../components/AdminDashboardOverview';

export const StudentDashboardPage: React.FC = React.memo(() => {
  const { studentProfile, handleLogout, loginMethod, setCurrentPage } = useAuth();
  const { showToast } = useToastActions();
  const { instituteName } = useLayoutSettings();
  const { setActiveModal } = useModalActions();
  const { t, language } = useI18n();

  const handleItemClick = (title: string, category: string) => {
    showToast(`${title} (${category})`);
  };

  const isRtl = language === 'fa';
  const arrowIcon = isRtl ? '←' : '→';
  const BackArrow = isRtl ? ArrowRight : ArrowLeft;

  // Jalali Date formatting helper for welcome page
  const getJalaliDateFormatted = () => {
    try {
      if (language === 'fa') {
        const parts = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        }).formatToParts(new Date());
        const year = parts.find(p => p.type === 'year')?.value;
        const month = parts.find(p => p.type === 'month')?.value;
        const day = parts.find(p => p.type === 'day')?.value;
        return `${year}/${month}/${day}`;
      } else {
        return new Date().toISOString().split('T')[0].replace(/-/g, '/');
      }
    } catch {
      return '۱۴۰۵/۰۵/۰۳';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#334155] via-[#3B4C63] to-[#475569] text-white flex flex-col justify-between font-['Vazirmatn',sans-serif] selection:bg-[#5EA8FF] selection:text-white relative overflow-hidden">
      
      {/* Floating Animated Background Ambient Blobs (Identical to Login Page) */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0 isolate [contain:strict] [transform:translateZ(0)]">
        <motion.div
          animate={{
            y: [0, -30, 0],
            x: [0, 20, 0],
            scale: [1, 1.1, 1],
            opacity: [0.18, 0.28, 0.18],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute -top-16 -right-16 sm:right-10 w-[450px] h-[450px] sm:w-[550px] sm:h-[550px] pointer-events-none will-change-[transform,opacity] [transform:translateZ(0)]"
        >
          <div className="w-full h-full bg-gradient-to-br from-[#3B82F6] to-[#60A5FA] rounded-full blur-[130px] [transform:translateZ(0)]" />
        </motion.div>
        <motion.div
          animate={{
            y: [0, 35, 0],
            x: [0, -25, 0],
            scale: [1, 1.15, 1],
            opacity: [0.15, 0.24, 0.15],
          }}
          transition={{
            duration: 14,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 1,
          }}
          className="absolute bottom-10 -left-20 sm:left-10 w-[400px] h-[400px] sm:w-[500px] sm:h-[500px] pointer-events-none will-change-[transform,opacity] [transform:translateZ(0)]"
        >
          <div className="w-full h-full bg-gradient-to-tr from-[#6366F1] via-[#3B82F6] to-[#38BDF8] rounded-full blur-[140px] [transform:translateZ(0)]" />
        </motion.div>
      </div>

      {/* Fixed Backdrop Blur Layer (decoupled from scroll so backdrop-blur-xl is never invalidated on scroll) */}
      <div
        aria-hidden="true"
        className="fixed inset-y-0 left-0 right-0 w-full max-w-4xl mx-auto pointer-events-none z-[1] backdrop-blur-xl [transform:translateZ(0)] [contain:strict]"
      />

      {/* Main Layout Container */}
      <div className="w-full max-w-4xl mx-auto bg-gradient-to-b from-[#334155]/80 via-[#3B4C63]/80 to-[#475569]/80 flex flex-col min-h-screen relative z-10">

        {/* Top Header Bar */}
        <HeaderBar />

        {/* Main Body */}
        <main className="flex-1 p-[12px] sm:p-6 md:p-8 pt-[10px] sm:pt-8 flex flex-col gap-2.5 sm:gap-6">

          {/* Navigation bar to return to login or home if needed */}
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={() => setCurrentPage('login')}
              className="min-h-[34px] sm:min-h-0 flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs font-bold text-[#BBC1D1] hover:text-white bg-[#232D42]/80 hover:bg-[#232D42] px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-xl sm:rounded-2xl border border-white/[0.08] transition-all cursor-pointer shrink-0"
            >
              <BackArrow className="w-4 h-4 text-[#5EA8FF]" />
              <span>{t('backToLogin')}</span>
            </button>
            <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs text-[#BBC1D1] min-w-0">
              <Building2 className="w-4 h-4 text-[#5EA8FF] shrink-0" />
              <span className="font-bold text-white truncate">{language === 'fa' ? instituteName : 'Sample Educational Institute'}</span>
            </div>
          </div>

          {/* WELCOME CARD */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="w-full bg-[#232D42]/90 border border-white/[0.12] rounded-xl sm:rounded-3xl p-[12px] sm:p-6 shadow-2xl relative overflow-hidden flex flex-col gap-2 sm:gap-4"
          >
            {/* Ambient inner glow */}
            <div className="absolute top-0 left-0 w-48 h-48 bg-[#5EA8FF]/10 rounded-full blur-3xl pointer-events-none [transform:translateZ(0)]" />

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 sm:gap-5 relative z-10">
              <div className="flex items-center gap-2.5 sm:gap-4">
                <UserAvatar
                  size="lg"
                  name={studentProfile.name}
                  avatarUrl={studentProfile.avatar}
                  allowUpload={true}
                  showStatus={true}
                  onClick={() => setActiveModal('profile')}
                  title={language === 'fa' ? 'مشاهده و ویرایش مشخصات' : 'View profile'}
                />

                {/* User Greeting & Profile Info */}
                <div className="flex flex-col text-start">
                  <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
                    <h2 className="text-[15px] sm:text-xl font-extrabold text-white">
                      {t('welcome', { name: (!studentProfile.name || studentProfile.name === 'دانشجوی سامانه') ? t('welcomeDefault') : studentProfile.name })}
                    </h2>
                    {studentProfile.role === 'admin' ? (
                      <span className="px-2 sm:px-2.5 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-full text-[11px] font-bold">
                        {t('adminRole')}
                      </span>
                    ) : (
                      <span className="px-2 sm:px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-full text-[11px] font-bold">
                        {t('studentRole')}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs text-[#BBC1D1] mt-1 sm:mt-1.5 flex-wrap">
                    <span>
                      {studentProfile.role === 'admin'
                        ? language === 'fa'
                          ? (studentProfile.institute?.trim() || instituteName?.trim())
                            ? `مدیر سیستم - ${studentProfile.institute?.trim() || instituteName?.trim()}`
                            : 'مدیریت سامانه'
                          : (studentProfile.institute?.trim() || instituteName?.trim())
                            ? 'System Admin - Sample Educational Institute'
                            : 'System Management'
                        : language === 'fa'
                          ? `${studentProfile.field || 'مهندسی کامپیوتر'} - ${studentProfile.term || 'ترم ۵ - نیمسال اول ۱۴۰۵-۱۴۰۶'}`
                          : `${studentProfile.field === 'مهندسی کامپیوتر' ? 'Computer Engineering' : (studentProfile.field || 'Computer Engineering')} - ${t('termDefault')}`}
                    </span>
                    {studentProfile.studentId && (
                      <>
                        <span>•</span>
                        <span className="dir-ltr inline-block">ID: {studentProfile.studentId}</span>
                      </>
                    )}
                  </div>

                  {loginMethod && (
                    <span className="text-[11px] text-[#5EA8FF] font-semibold mt-0.5 sm:mt-1">
                      {t('loginMethod')}: {loginMethod === 'SSO' ? t('ssoLogin') : loginMethod === 'FORM' ? t('formLogin') : loginMethod === 'GOOGLE' ? t('googleLogin') : t('emailLogin')}
                    </span>
                  )}
                </div>
              </div>

              {/* Logout Action Button */}
              <div className="relative z-10 w-full sm:w-auto flex items-center justify-end shrink-0">
                <button
                  onClick={handleLogout}
                  className="w-full sm:w-auto h-[36px] sm:h-auto px-4 py-1.5 sm:px-5 sm:py-2.5 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 rounded-xl sm:rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 sm:gap-2 transition-all cursor-pointer shadow-lg hover:scale-105 active:scale-95"
                >
                  <LogOut className="w-4 h-4" />
                  <span>{t('logout')}</span>
                </button>
              </div>
            </div>

            {/* Date line directly under welcome text / info */}
            <div className="pt-2 sm:pt-2.5 border-t border-white/10 flex items-center justify-start text-[11px] sm:text-sm text-white/70 font-normal text-right relative z-10" dir="rtl">
              <span>📅 {language === 'fa' ? `امروز: ${getJalaliDateFormatted()}` : `Today: ${getJalaliDateFormatted()}`}</span>
            </div>
          </motion.div>

          {studentProfile.role === 'admin' ? (
            <AdminDashboardOverview />
          ) : (
            /* DASHBOARD CARDS GRID (4 SECTIONS) */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-5 mt-0 sm:mt-2">

            {/* 1. My Desk */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.1 }}
              className="bg-[#232D42]/85 border border-[#6366F1]/30 rounded-xl sm:rounded-3xl p-[12px] sm:p-5 shadow-xl hover:border-[#6366F1]/60 transition-all flex flex-col justify-between"
            >
              <div className="[content-visibility:auto] [contain-intrinsic-size:auto_240px]">
                {/* Header */}
                <div className="flex items-center justify-between pb-2.5 mb-2.5 sm:pb-3 sm:mb-4 border-b border-white/[0.08]">
                  <div className="flex items-center gap-2.5 sm:gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-[#6366F1]/20 border border-[#6366F1]/40 flex items-center justify-center text-[#818CF8]">
                      <FolderKanban className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-[15px] sm:text-base font-bold text-white">{t('cartable')}</h3>
                      <p className="text-[11px] text-[#BBC1D1]">{t('cartableDesc')}</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 bg-[#6366F1]/20 text-[#818CF8] border border-[#6366F1]/30 rounded-full text-[11px] sm:text-xs font-bold">
                    {t('itemsCount', { count: 3 })}
                  </span>
                </div>

                {/* Items */}
                <div className="space-y-1.5 sm:space-y-2.5">
                  <button
                    onClick={() => setActiveModal('change_password')}
                    className="w-full min-h-[36px] sm:min-h-0 px-2.5 py-2 sm:p-3 rounded-xl sm:rounded-2xl bg-[#1E293B]/70 hover:bg-[#6366F1]/15 border border-white/[0.06] hover:border-[#6366F1]/40 text-xs font-semibold text-slate-200 hover:text-white flex items-center justify-between transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-2 sm:gap-2.5">
                      <Lock className="w-4 h-4 text-[#818CF8] group-hover:scale-110 transition-transform" />
                      <span>{t('changePassword')}</span>
                    </div>
                    <span className="text-[10px] text-[#BBC1D1] group-hover:text-[#818CF8]">{t('enterSection')}</span>
                  </button>

                  <button
                    onClick={() => setActiveModal('notice_board')}
                    className="w-full min-h-[36px] sm:min-h-0 px-2.5 py-2 sm:p-3 rounded-xl sm:rounded-2xl bg-[#1E293B]/70 hover:bg-[#6366F1]/15 border border-white/[0.06] hover:border-[#6366F1]/40 text-xs font-semibold text-slate-200 hover:text-white flex items-center justify-between transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-2 sm:gap-2.5">
                      <Megaphone className="w-4 h-4 text-[#818CF8] group-hover:scale-110 transition-transform" />
                      <span>{t('noticeBoard')}</span>
                    </div>
                    <span className="text-[10px] text-[#BBC1D1] group-hover:text-[#818CF8]">{t('enterSection')}</span>
                  </button>

                  <button
                    onClick={() => setActiveModal('sms_notification')}
                    className="w-full min-h-[36px] sm:min-h-0 px-2.5 py-2 sm:p-3 rounded-xl sm:rounded-2xl bg-[#1E293B]/70 hover:bg-[#6366F1]/15 border border-white/[0.06] hover:border-[#6366F1]/40 text-xs font-semibold text-slate-200 hover:text-white flex items-center justify-between transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-2 sm:gap-2.5">
                      <Send className="w-4 h-4 text-[#818CF8] group-hover:scale-110 transition-transform" />
                      <span>{t('sendSms')}</span>
                    </div>
                    <span className="text-[10px] text-[#BBC1D1] group-hover:text-[#818CF8]">{t('enterSection')}</span>
                  </button>
                </div>
              </div>
            </motion.div>


            {/* 2. Academic Affairs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.15 }}
              className="bg-[#232D42]/85 border border-[#38BDF8]/30 rounded-xl sm:rounded-3xl p-[12px] sm:p-5 shadow-xl hover:border-[#38BDF8]/60 transition-all flex flex-col justify-between"
            >
              <div className="[content-visibility:auto] [contain-intrinsic-size:auto_330px]">
                {/* Header */}
                <div className="flex items-center justify-between pb-2.5 mb-2.5 sm:pb-3 sm:mb-4 border-b border-white/[0.08]">
                  <div className="flex items-center gap-2.5 sm:gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-[#38BDF8]/20 border border-[#38BDF8]/40 flex items-center justify-center text-[#38BDF8]">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-[15px] sm:text-base font-bold text-white">{t('academic')}</h3>
                      <p className="text-[11px] text-[#BBC1D1]">{t('academicDesc')}</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 bg-[#38BDF8]/20 text-[#38BDF8] border border-[#38BDF8]/30 rounded-full text-[11px] sm:text-xs font-bold">
                    {t('itemsCount', { count: 5 })}
                  </span>
                </div>

                {/* Items */}
                <div className="space-y-1.5 sm:space-y-2">
                  <button
                    onClick={() => setActiveModal('course_registration')}
                    className="w-full min-h-[36px] sm:min-h-0 px-2.5 py-1.5 sm:p-2.5 rounded-xl sm:rounded-2xl bg-[#1E293B]/70 hover:bg-[#38BDF8]/15 border border-white/[0.06] hover:border-[#38BDF8]/40 text-xs font-semibold text-slate-200 hover:text-white flex items-center justify-between transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-2 sm:gap-2.5">
                      <CheckSquare className="w-4 h-4 text-[#38BDF8] group-hover:scale-110 transition-transform shrink-0" />
                      <div className="flex flex-col text-start">
                        <span>{t('courseRegistration')}</span>
                        <span className="text-[11px] font-bold text-[#38BDF8] mt-0.5">
                          {t('currentSemesterName')}
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] text-[#BBC1D1] group-hover:text-[#38BDF8] shrink-0">{t('viewSection')}</span>
                  </button>

                  <button
                    onClick={() => setActiveModal('transcript')}
                    className="w-full min-h-[36px] sm:min-h-0 px-2.5 py-1.5 sm:p-2.5 rounded-xl sm:rounded-2xl bg-[#1E293B]/70 hover:bg-[#38BDF8]/15 border border-white/[0.06] hover:border-[#38BDF8]/40 text-xs font-semibold text-slate-200 hover:text-white flex items-center justify-between transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-2 sm:gap-2.5">
                      <Award className="w-4 h-4 text-[#38BDF8] group-hover:scale-110 transition-transform" />
                      <span>{t('reportCard')}</span>
                    </div>
                    <span className="text-[10px] text-[#BBC1D1] group-hover:text-[#38BDF8]">{t('viewSection')}</span>
                  </button>

                  <button
                    onClick={() => setActiveModal('weekly_schedule')}
                    className="w-full min-h-[36px] sm:min-h-0 px-2.5 py-1.5 sm:p-2.5 rounded-xl sm:rounded-2xl bg-[#1E293B]/70 hover:bg-[#38BDF8]/15 border border-white/[0.06] hover:border-[#38BDF8]/40 text-xs font-semibold text-slate-200 hover:text-white flex items-center justify-between transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-2 sm:gap-2.5">
                      <Calendar className="w-4 h-4 text-[#38BDF8] group-hover:scale-110 transition-transform" />
                      <span>{t('weeklySchedule')}</span>
                    </div>
                    <span className="text-[10px] text-[#BBC1D1] group-hover:text-[#38BDF8]">{t('viewSection')}</span>
                  </button>

                  <button
                    onClick={() => setActiveModal('student_requests')}
                    className="w-full min-h-[36px] sm:min-h-0 px-2.5 py-1.5 sm:p-2.5 rounded-xl sm:rounded-2xl bg-[#1E293B]/70 hover:bg-[#38BDF8]/15 border border-white/[0.06] hover:border-[#38BDF8]/40 text-xs font-semibold text-slate-200 hover:text-white flex items-center justify-between transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-2 sm:gap-2.5">
                      <FileText className="w-4 h-4 text-[#38BDF8] group-hover:scale-110 transition-transform" />
                      <span>{t('requests')}</span>
                    </div>
                    <span className="text-[10px] text-[#BBC1D1] group-hover:text-[#38BDF8]">{t('viewSection')}</span>
                  </button>

                  <button
                    onClick={() => setActiveModal('registration_certificate')}
                    className="w-full min-h-[36px] sm:min-h-0 px-2.5 py-1.5 sm:p-2.5 rounded-xl sm:rounded-2xl bg-[#1E293B]/70 hover:bg-[#38BDF8]/15 border border-white/[0.06] hover:border-[#38BDF8]/40 text-xs font-semibold text-slate-200 hover:text-white flex items-center justify-between transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-2 sm:gap-2.5">
                      <ShieldCheck className="w-4 h-4 text-[#38BDF8] group-hover:scale-110 transition-transform" />
                      <span>{t('registrationCertificate')}</span>
                    </div>
                    <span className="text-[10px] text-[#BBC1D1] group-hover:text-[#38BDF8]">{t('viewSection')}</span>
                  </button>
                </div>
              </div>
            </motion.div>

            {/* 3. Financial Affairs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.2 }}
              className="bg-[#232D42]/85 border border-[#34D399]/30 rounded-xl sm:rounded-3xl p-[12px] sm:p-5 shadow-xl hover:border-[#34D399]/60 transition-all flex flex-col justify-between"
            >
              <div className="[content-visibility:auto] [contain-intrinsic-size:auto_240px]">
                {/* Header */}
                <div className="flex items-center justify-between pb-2.5 mb-2.5 sm:pb-3 sm:mb-4 border-b border-white/[0.08]">
                  <div className="flex items-center gap-2.5 sm:gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-[#34D399]/20 border border-[#34D399]/40 flex items-center justify-center text-[#34D399]">
                      <Wallet className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-[15px] sm:text-base font-bold text-white">{t('financial')}</h3>
                      <p className="text-[11px] text-[#BBC1D1]">{t('financialDesc')}</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 bg-[#34D399]/20 text-[#34D399] border border-[#34D399]/30 rounded-full text-[11px] sm:text-xs font-bold">
                    {t('itemsCount', { count: 3 })}
                  </span>
                </div>

                {/* Items */}
                <div className="space-y-1.5 sm:space-y-2.5">
                  <button
                    onClick={() => setActiveModal('pay_tuition')}
                    className="w-full min-h-[36px] sm:min-h-0 px-2.5 py-2 sm:p-3 rounded-xl sm:rounded-2xl bg-[#1E293B]/70 hover:bg-[#34D399]/15 border border-white/[0.06] hover:border-[#34D399]/40 text-xs font-semibold text-slate-200 hover:text-white flex items-center justify-between transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-2 sm:gap-2.5">
                      <CreditCard className="w-4 h-4 text-[#34D399] group-hover:scale-110 transition-transform" />
                      <span>{t('payTuition')}</span>
                    </div>
                    <span className="text-[10px] text-[#BBC1D1] group-hover:text-[#34D399]">{t('paySection')}</span>
                  </button>

                  <button
                    onClick={() => setActiveModal('financial_statement')}
                    className="w-full min-h-[36px] sm:min-h-0 px-2.5 py-2 sm:p-3 rounded-xl sm:rounded-2xl bg-[#1E293B]/70 hover:bg-[#34D399]/15 border border-white/[0.06] hover:border-[#34D399]/40 text-xs font-semibold text-slate-200 hover:text-white flex items-center justify-between transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-2 sm:gap-2.5">
                      <Receipt className="w-4 h-4 text-[#34D399] group-hover:scale-110 transition-transform" />
                      <span>{t('financialStatement')}</span>
                    </div>
                    <span className="text-[10px] text-[#BBC1D1] group-hover:text-[#34D399]">{t('viewSection')}</span>
                  </button>

                  <button
                    onClick={() => setActiveModal('transaction_history')}
                    className="w-full min-h-[36px] sm:min-h-0 px-2.5 py-2 sm:p-3 rounded-xl sm:rounded-2xl bg-[#1E293B]/70 hover:bg-[#34D399]/15 border border-white/[0.06] hover:border-[#34D399]/40 text-xs font-semibold text-slate-200 hover:text-white flex items-center justify-between transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-2 sm:gap-2.5">
                      <History className="w-4 h-4 text-[#34D399] group-hover:scale-110 transition-transform" />
                      <span>{t('paymentHistory')}</span>
                    </div>
                    <span className="text-[10px] text-[#BBC1D1] group-hover:text-[#34D399]">{t('viewSection')}</span>
                  </button>
                </div>
              </div>
            </motion.div>

            {/* 4. Student Welfare */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.25 }}
              className="bg-[#232D42]/85 border border-[#F59E0B]/30 rounded-xl sm:rounded-3xl p-[12px] sm:p-5 shadow-xl hover:border-[#F59E0B]/60 transition-all flex flex-col justify-between"
            >
              <div className="[content-visibility:auto] [contain-intrinsic-size:auto_280px]">
                {/* Header */}
                <div className="flex items-center justify-between pb-2.5 mb-2.5 sm:pb-3 sm:mb-4 border-b border-white/[0.08]">
                  <div className="flex items-center gap-2.5 sm:gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-[#F59E0B]/20 border border-[#F59E0B]/40 flex items-center justify-center text-[#F59E0B]">
                      <HeartHandshake className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-[15px] sm:text-base font-bold text-white">{t('welfare')}</h3>
                      <p className="text-[11px] text-[#BBC1D1]">{t('welfareDesc')}</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/30 rounded-full text-[11px] sm:text-xs font-bold">
                    {t('itemsCount', { count: 4 })}
                  </span>
                </div>

                {/* Items */}
                <div className="space-y-1.5 sm:space-y-2">
                  <button
                    onClick={() => setActiveModal('dormitory')}
                    className="w-full min-h-[36px] sm:min-h-0 px-2.5 py-1.5 sm:p-2.5 rounded-xl sm:rounded-2xl bg-[#1E293B]/70 hover:bg-[#F59E0B]/15 border border-white/[0.06] hover:border-[#F59E0B]/40 text-xs font-semibold text-slate-200 hover:text-white flex items-center justify-between transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-2 sm:gap-2.5">
                      <Home className="w-4 h-4 text-[#F59E0B] group-hover:scale-110 transition-transform" />
                      <span>{t('dormitory')}</span>
                    </div>
                    <span className="text-[10px] text-[#BBC1D1] group-hover:text-[#F59E0B]">{t('enterSection')}</span>
                  </button>

                  <button
                    onClick={() => setActiveModal('student_loan')}
                    className="w-full min-h-[36px] sm:min-h-0 px-2.5 py-1.5 sm:p-2.5 rounded-xl sm:rounded-2xl bg-[#1E293B]/70 hover:bg-[#F59E0B]/15 border border-white/[0.06] hover:border-[#F59E0B]/40 text-xs font-semibold text-slate-200 hover:text-white flex items-center justify-between transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-2 sm:gap-2.5">
                      <Coins className="w-4 h-4 text-[#F59E0B] group-hover:scale-110 transition-transform" />
                      <span>{t('studentLoan')}</span>
                    </div>
                    <span className="text-[10px] text-[#BBC1D1] group-hover:text-[#F59E0B]">{t('enterSection')}</span>
                  </button>

                  <button
                    onClick={() => setActiveModal('student_id_card')}
                    className="w-full min-h-[36px] sm:min-h-0 px-2.5 py-1.5 sm:p-2.5 rounded-xl sm:rounded-2xl bg-[#1E293B]/70 hover:bg-[#F59E0B]/15 border border-white/[0.06] hover:border-[#F59E0B]/40 text-xs font-semibold text-slate-200 hover:text-white flex items-center justify-between transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-2 sm:gap-2.5">
                      <Contact className="w-4 h-4 text-[#F59E0B] group-hover:scale-110 transition-transform" />
                      <span>{t('studentIdCard')}</span>
                    </div>
                    <span className="text-[10px] text-[#BBC1D1] group-hover:text-[#F59E0B]">{t('enterSection')}</span>
                  </button>

                  <button
                    onClick={() => setActiveModal('dining')}
                    className="w-full min-h-[36px] sm:min-h-0 px-2.5 py-1.5 sm:p-2.5 rounded-xl sm:rounded-2xl bg-[#1E293B]/70 hover:bg-[#F59E0B]/15 border border-white/[0.06] hover:border-[#F59E0B]/40 text-xs font-semibold text-slate-200 hover:text-white flex items-center justify-between transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-2 sm:gap-2.5">
                      <Utensils className="w-4 h-4 text-[#F59E0B] group-hover:scale-110 transition-transform" />
                      <span>{t('dining')}</span>
                    </div>
                    <span className="text-[10px] text-[#BBC1D1] group-hover:text-[#F59E0B]">{t('enterSection')}</span>
                  </button>
                </div>
              </div>
            </motion.div>


            </div>
          )}

        </main>

        <Footer />
      </div>
    </div>
  );
});

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
import { useDashboard } from '../context/DashboardContext';
import { HeaderBar } from '../components/HeaderBar';
import { Footer } from '../components/Footer';
import { UserAvatar } from '../components/UserAvatar';

export const StudentDashboardPage: React.FC = () => {
  const { 
    studentProfile, 
    handleLogout, 
    loginMethod, 
    showToast,
    instituteName,
    setActiveModal,
    setCurrentPage,
    t,
    language
  } = useDashboard();

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
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
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
          className="absolute -top-16 -right-16 sm:right-10 w-[450px] h-[450px] sm:w-[550px] sm:h-[550px] bg-gradient-to-br from-[#3B82F6] to-[#60A5FA] rounded-full blur-[130px] pointer-events-none"
        />
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
          className="absolute bottom-10 -left-20 sm:left-10 w-[400px] h-[400px] sm:w-[500px] sm:h-[500px] bg-gradient-to-tr from-[#6366F1] via-[#3B82F6] to-[#38BDF8] rounded-full blur-[140px] pointer-events-none"
        />
      </div>

      {/* Main Layout Container */}
      <div className="w-full max-w-4xl mx-auto bg-gradient-to-b from-[#334155]/80 via-[#3B4C63]/80 to-[#475569]/80 backdrop-blur-xl flex flex-col min-h-screen relative z-10">

        {/* Top Header Bar */}
        <HeaderBar />

        {/* Main Body */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 pt-6 sm:pt-8 flex flex-col gap-6">

          {/* Navigation bar to return to login or home if needed */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setCurrentPage('login')}
              className="flex items-center gap-2 text-xs font-bold text-[#BBC1D1] hover:text-white bg-[#232D42]/80 hover:bg-[#232D42] px-3.5 py-2 rounded-2xl border border-white/[0.08] transition-all cursor-pointer"
            >
              <BackArrow className="w-4 h-4 text-[#5EA8FF]" />
              <span>{t('backToLogin')}</span>
            </button>
            <div className="flex items-center gap-2 text-xs text-[#BBC1D1]">
              <Building2 className="w-4 h-4 text-[#5EA8FF]" />
              <span className="font-bold text-white">{language === 'fa' ? instituteName : 'Sample Educational Institute'}</span>
            </div>
          </div>

          {/* WELCOME CARD */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="w-full bg-[#232D42]/90 border border-white/[0.12] rounded-3xl p-5 sm:p-6 shadow-2xl relative overflow-hidden flex flex-col gap-4"
          >
            {/* Ambient inner glow */}
            <div className="absolute top-0 left-0 w-48 h-48 bg-[#5EA8FF]/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 relative z-10">
              <div className="flex items-center gap-4">
                <UserAvatar
                  size="lg"
                  allowUpload={true}
                  showStatus={true}
                  onClick={() => setActiveModal('profile')}
                  title={language === 'fa' ? 'مشاهده و ویرایش مشخصات' : 'View profile'}
                />

                {/* User Greeting & Profile Info */}
                <div className="flex flex-col text-start">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h2 className="text-lg sm:text-xl font-extrabold text-white">
                      {t('welcome', { name: (!studentProfile.name || studentProfile.name === 'دانشجوی سامانه') ? t('welcomeDefault') : studentProfile.name })}
                    </h2>
                    {studentProfile.role === 'admin' ? (
                      <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-full text-[11px] font-bold">
                        {t('adminRole')}
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-full text-[11px] font-bold">
                        {t('studentRole')}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-xs text-[#BBC1D1] mt-1.5 flex-wrap">
                    <span>
                      {language === 'fa' 
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
                    <span className="text-[11px] text-[#5EA8FF] font-semibold mt-1">
                      {t('loginMethod')}: {loginMethod === 'SSO' ? t('ssoLogin') : loginMethod === 'FORM' ? t('formLogin') : loginMethod === 'GOOGLE' ? t('googleLogin') : t('emailLogin')}
                    </span>
                  )}
                </div>
              </div>

              {/* Logout Action Button */}
              <div className="relative z-10 w-full sm:w-auto flex items-center justify-end shrink-0">
                <button
                  onClick={handleLogout}
                  className="w-full sm:w-auto px-5 py-2.5 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg hover:scale-105 active:scale-95"
                >
                  <LogOut className="w-4 h-4" />
                  <span>{t('logout')}</span>
                </button>
              </div>
            </div>

            {/* Date line directly under welcome text / info */}
            <div className="pt-2.5 border-t border-white/10 flex items-center justify-start text-xs sm:text-sm text-white/70 font-normal text-right relative z-10" dir="rtl">
              <span>📅 {language === 'fa' ? `امروز: ${getJalaliDateFormatted()}` : `Today: ${getJalaliDateFormatted()}`}</span>
            </div>
          </motion.div>

          {/* DASHBOARD CARDS GRID (4 SECTIONS) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-2">

            {/* 1. My Desk */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.1 }}
              className="bg-[#232D42]/85 border border-[#6366F1]/30 rounded-3xl p-5 shadow-xl hover:border-[#6366F1]/60 transition-all flex flex-col justify-between"
            >
              <div>
                {/* Header */}
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/[0.08]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-[#6366F1]/20 border border-[#6366F1]/40 flex items-center justify-center text-[#818CF8]">
                      <FolderKanban className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">{t('cartable')}</h3>
                      <p className="text-[11px] text-[#BBC1D1]">{t('cartableDesc')}</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 bg-[#6366F1]/20 text-[#818CF8] border border-[#6366F1]/30 rounded-full text-xs font-bold">
                    {t('itemsCount', { count: 3 })}
                  </span>
                </div>

                {/* Items */}
                <div className="space-y-2.5">
                  <button
                    onClick={() => setActiveModal('change_password')}
                    className="w-full p-3 rounded-2xl bg-[#1E293B]/70 hover:bg-[#6366F1]/15 border border-white/[0.06] hover:border-[#6366F1]/40 text-xs font-semibold text-slate-200 hover:text-white flex items-center justify-between transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5">
                      <Lock className="w-4 h-4 text-[#818CF8] group-hover:scale-110 transition-transform" />
                      <span>{t('changePassword')}</span>
                    </div>
                    <span className="text-[10px] text-[#BBC1D1] group-hover:text-[#818CF8]">{t('enterSection')}</span>
                  </button>

                  <button
                    onClick={() => setActiveModal('notice_board')}
                    className="w-full p-3 rounded-2xl bg-[#1E293B]/70 hover:bg-[#6366F1]/15 border border-white/[0.06] hover:border-[#6366F1]/40 text-xs font-semibold text-slate-200 hover:text-white flex items-center justify-between transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5">
                      <Megaphone className="w-4 h-4 text-[#818CF8] group-hover:scale-110 transition-transform" />
                      <span>{t('noticeBoard')}</span>
                    </div>
                    <span className="text-[10px] text-[#BBC1D1] group-hover:text-[#818CF8]">{t('enterSection')}</span>
                  </button>

                  <button
                    onClick={() => setActiveModal('sms_notification')}
                    className="w-full p-3 rounded-2xl bg-[#1E293B]/70 hover:bg-[#6366F1]/15 border border-white/[0.06] hover:border-[#6366F1]/40 text-xs font-semibold text-slate-200 hover:text-white flex items-center justify-between transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5">
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
              className="bg-[#232D42]/85 border border-[#38BDF8]/30 rounded-3xl p-5 shadow-xl hover:border-[#38BDF8]/60 transition-all flex flex-col justify-between"
            >
              <div>
                {/* Header */}
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/[0.08]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-[#38BDF8]/20 border border-[#38BDF8]/40 flex items-center justify-center text-[#38BDF8]">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">{t('academic')}</h3>
                      <p className="text-[11px] text-[#BBC1D1]">{t('academicDesc')}</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 bg-[#38BDF8]/20 text-[#38BDF8] border border-[#38BDF8]/30 rounded-full text-xs font-bold">
                    {t('itemsCount', { count: 5 })}
                  </span>
                </div>

                {/* Items */}
                <div className="space-y-2">
                  <button
                    onClick={() => setActiveModal('course_registration')}
                    className="w-full p-2.5 rounded-2xl bg-[#1E293B]/70 hover:bg-[#38BDF8]/15 border border-white/[0.06] hover:border-[#38BDF8]/40 text-xs font-semibold text-slate-200 hover:text-white flex items-center justify-between transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5">
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
                    className="w-full p-2.5 rounded-2xl bg-[#1E293B]/70 hover:bg-[#38BDF8]/15 border border-white/[0.06] hover:border-[#38BDF8]/40 text-xs font-semibold text-slate-200 hover:text-white flex items-center justify-between transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5">
                      <Award className="w-4 h-4 text-[#38BDF8] group-hover:scale-110 transition-transform" />
                      <span>{t('reportCard')}</span>
                    </div>
                    <span className="text-[10px] text-[#BBC1D1] group-hover:text-[#38BDF8]">{t('viewSection')}</span>
                  </button>

                  <button
                    onClick={() => setActiveModal('weekly_schedule')}
                    className="w-full p-2.5 rounded-2xl bg-[#1E293B]/70 hover:bg-[#38BDF8]/15 border border-white/[0.06] hover:border-[#38BDF8]/40 text-xs font-semibold text-slate-200 hover:text-white flex items-center justify-between transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5">
                      <Calendar className="w-4 h-4 text-[#38BDF8] group-hover:scale-110 transition-transform" />
                      <span>{t('weeklySchedule')}</span>
                    </div>
                    <span className="text-[10px] text-[#BBC1D1] group-hover:text-[#38BDF8]">{t('viewSection')}</span>
                  </button>

                  <button
                    onClick={() => setActiveModal('student_requests')}
                    className="w-full p-2.5 rounded-2xl bg-[#1E293B]/70 hover:bg-[#38BDF8]/15 border border-white/[0.06] hover:border-[#38BDF8]/40 text-xs font-semibold text-slate-200 hover:text-white flex items-center justify-between transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5">
                      <FileText className="w-4 h-4 text-[#38BDF8] group-hover:scale-110 transition-transform" />
                      <span>{t('requests')}</span>
                    </div>
                    <span className="text-[10px] text-[#BBC1D1] group-hover:text-[#38BDF8]">{t('viewSection')}</span>
                  </button>

                  <button
                    onClick={() => setActiveModal('registration_certificate')}
                    className="w-full p-2.5 rounded-2xl bg-[#1E293B]/70 hover:bg-[#38BDF8]/15 border border-white/[0.06] hover:border-[#38BDF8]/40 text-xs font-semibold text-slate-200 hover:text-white flex items-center justify-between transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5">
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
              className="bg-[#232D42]/85 border border-[#34D399]/30 rounded-3xl p-5 shadow-xl hover:border-[#34D399]/60 transition-all flex flex-col justify-between"
            >
              <div>
                {/* Header */}
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/[0.08]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-[#34D399]/20 border border-[#34D399]/40 flex items-center justify-center text-[#34D399]">
                      <Wallet className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">{t('financial')}</h3>
                      <p className="text-[11px] text-[#BBC1D1]">{t('financialDesc')}</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 bg-[#34D399]/20 text-[#34D399] border border-[#34D399]/30 rounded-full text-xs font-bold">
                    {t('itemsCount', { count: 3 })}
                  </span>
                </div>

                {/* Items */}
                <div className="space-y-2.5">
                  <button
                    onClick={() => setActiveModal('pay_tuition')}
                    className="w-full p-3 rounded-2xl bg-[#1E293B]/70 hover:bg-[#34D399]/15 border border-white/[0.06] hover:border-[#34D399]/40 text-xs font-semibold text-slate-200 hover:text-white flex items-center justify-between transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5">
                      <CreditCard className="w-4 h-4 text-[#34D399] group-hover:scale-110 transition-transform" />
                      <span>{t('payTuition')}</span>
                    </div>
                    <span className="text-[10px] text-[#BBC1D1] group-hover:text-[#34D399]">{t('paySection')}</span>
                  </button>

                  <button
                    onClick={() => setActiveModal('financial_statement')}
                    className="w-full p-3 rounded-2xl bg-[#1E293B]/70 hover:bg-[#34D399]/15 border border-white/[0.06] hover:border-[#34D399]/40 text-xs font-semibold text-slate-200 hover:text-white flex items-center justify-between transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5">
                      <Receipt className="w-4 h-4 text-[#34D399] group-hover:scale-110 transition-transform" />
                      <span>{t('financialStatement')}</span>
                    </div>
                    <span className="text-[10px] text-[#BBC1D1] group-hover:text-[#34D399]">{t('viewSection')}</span>
                  </button>

                  <button
                    onClick={() => setActiveModal('transaction_history')}
                    className="w-full p-3 rounded-2xl bg-[#1E293B]/70 hover:bg-[#34D399]/15 border border-white/[0.06] hover:border-[#34D399]/40 text-xs font-semibold text-slate-200 hover:text-white flex items-center justify-between transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5">
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
              className="bg-[#232D42]/85 border border-[#F59E0B]/30 rounded-3xl p-5 shadow-xl hover:border-[#F59E0B]/60 transition-all flex flex-col justify-between"
            >
              <div>
                {/* Header */}
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/[0.08]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-[#F59E0B]/20 border border-[#F59E0B]/40 flex items-center justify-center text-[#F59E0B]">
                      <HeartHandshake className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">{t('welfare')}</h3>
                      <p className="text-[11px] text-[#BBC1D1]">{t('welfareDesc')}</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/30 rounded-full text-xs font-bold">
                    {t('itemsCount', { count: 4 })}
                  </span>
                </div>

                {/* Items */}
                <div className="space-y-2">
                  <button
                    onClick={() => setActiveModal('dormitory')}
                    className="w-full p-2.5 rounded-2xl bg-[#1E293B]/70 hover:bg-[#F59E0B]/15 border border-white/[0.06] hover:border-[#F59E0B]/40 text-xs font-semibold text-slate-200 hover:text-white flex items-center justify-between transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5">
                      <Home className="w-4 h-4 text-[#F59E0B] group-hover:scale-110 transition-transform" />
                      <span>{t('dormitory')}</span>
                    </div>
                    <span className="text-[10px] text-[#BBC1D1] group-hover:text-[#F59E0B]">{t('enterSection')}</span>
                  </button>

                  <button
                    onClick={() => setActiveModal('student_loan')}
                    className="w-full p-2.5 rounded-2xl bg-[#1E293B]/70 hover:bg-[#F59E0B]/15 border border-white/[0.06] hover:border-[#F59E0B]/40 text-xs font-semibold text-slate-200 hover:text-white flex items-center justify-between transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5">
                      <Coins className="w-4 h-4 text-[#F59E0B] group-hover:scale-110 transition-transform" />
                      <span>{t('studentLoan')}</span>
                    </div>
                    <span className="text-[10px] text-[#BBC1D1] group-hover:text-[#F59E0B]">{t('enterSection')}</span>
                  </button>

                  <button
                    onClick={() => setActiveModal('student_id_card')}
                    className="w-full p-2.5 rounded-2xl bg-[#1E293B]/70 hover:bg-[#F59E0B]/15 border border-white/[0.06] hover:border-[#F59E0B]/40 text-xs font-semibold text-slate-200 hover:text-white flex items-center justify-between transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5">
                      <Contact className="w-4 h-4 text-[#F59E0B] group-hover:scale-110 transition-transform" />
                      <span>{t('studentIdCard')}</span>
                    </div>
                    <span className="text-[10px] text-[#BBC1D1] group-hover:text-[#F59E0B]">{t('enterSection')}</span>
                  </button>

                  <button
                    onClick={() => setActiveModal('dining')}
                    className="w-full p-2.5 rounded-2xl bg-[#1E293B]/70 hover:bg-[#F59E0B]/15 border border-white/[0.06] hover:border-[#F59E0B]/40 text-xs font-semibold text-slate-200 hover:text-white flex items-center justify-between transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5">
                      <Utensils className="w-4 h-4 text-[#F59E0B] group-hover:scale-110 transition-transform" />
                      <span>{t('dining')}</span>
                    </div>
                    <span className="text-[10px] text-[#BBC1D1] group-hover:text-[#F59E0B]">{t('enterSection')}</span>
                  </button>
                </div>
              </div>
            </motion.div>


          </div>

        </main>

        <Footer />
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MessageSquare, 
  X, 
  Search, 
  Check, 
  CheckCheck, 
  Smartphone, 
  Mail, 
  GraduationCap, 
  CreditCard, 
  HeartHandshake, 
  AlertTriangle, 
  Clock, 
  Building2, 
  Save, 
  Bell, 
  SlidersHorizontal,
  CheckCircle2,
  FileQuestion
} from 'lucide-react';
import { useDashboard } from '../../context/DashboardContext';

interface SmsItem {
  id: string;
  senderFa: string;
  senderEn: string;
  messageFa: string;
  messageEn: string;
  dateTimeFa: string;
  dateTimeEn: string;
  status: 'sent' | 'read';
  category: 'academic' | 'financial' | 'welfare' | 'cultural' | 'emergency';
}

const SAMPLE_SMS_HISTORY: SmsItem[] = [
  {
    id: 'sms-1',
    senderFa: 'امور مالی دانشگاه',
    senderEn: 'University Financial Affairs',
    messageFa: 'دانشجوی گرامی، یادآوری پرداخت قسط دوم شهریه نیمسال تا پایان هفته جاری. لطفا از طریق پورتال مالی اقدام نمایید.',
    messageEn: 'Dear Student, reminder to pay the 2nd tuition installment by the end of this week via the financial portal.',
    dateTimeFa: '۱۴۰۵/۰۵/۰۲ - ۱۴:۳۰',
    dateTimeEn: '2026/07/24 - 14:30',
    status: 'read',
    category: 'financial',
  },
  {
    id: 'sms-2',
    senderFa: 'سامانه آموزش دانشگاه',
    senderEn: 'Academic Portal',
    messageFa: 'نمره درس برنامه‌نویسی پیشرفته در سامانه ثبت گردید. مهلت اعتراض به نمره تا ۴۸ ساعت آینده می‌باشد.',
    messageEn: 'Grade for Advanced Programming course has been recorded. Appeal deadline is within 48 hours.',
    dateTimeFa: '۱۴۰۵/۰۴/۲۹ - ۱۰:۱۵',
    dateTimeEn: '2026/07/20 - 10:15',
    status: 'read',
    category: 'academic',
  },
  {
    id: 'sms-3',
    senderFa: 'مدیریت خدمات آموزشی',
    senderEn: 'Educational Services',
    messageFa: 'یادآوری: آخرین مهلت حذف و اضافه و انتخاب واحد ترم جاری پایان امروز می‌باشد.',
    messageEn: 'Reminder: Final deadline for course registration and add/drop is today.',
    dateTimeFa: '۱۴۰۵/۰۴/۲۵ - ۰۹:۰۰',
    dateTimeEn: '2026/07/16 - 09:00',
    status: 'read',
    category: 'academic',
  },
  {
    id: 'sms-4',
    senderFa: 'مدیریت امور فرهنگی',
    senderEn: 'Cultural Affairs',
    messageFa: 'ثبت‌نام شما در کارگاه تخصصی هوش مصنوعی با موفقیت تایید شد. زمان شروع جلسه اول: پنج‌شنبه ساعت ۱۴.',
    messageEn: 'Your registration for the AI Workshop is confirmed. First session starts Thursday at 14:00.',
    dateTimeFa: '۱۴۰۵/۰۴/۱۸ - ۱۶:۴۵',
    dateTimeEn: '2026/07/09 - 16:45',
    status: 'sent',
    category: 'cultural',
  },
  {
    id: 'sms-5',
    senderFa: 'اداره کل آموزش',
    senderEn: 'General Education Office',
    messageFa: 'هشدار: غیبت شما در درس آمار و احتمال به ۲ جلسه رسیده است. سقف مجاز غیبت ۳ جلسه می‌باشد.',
    messageEn: 'Warning: Absence count in Probability & Statistics has reached 2 sessions. Maximum allowed is 3.',
    dateTimeFa: '۱۴۰۵/۰۴/۱۲ - ۱۱:۲۰',
    dateTimeEn: '2026/07/03 - 11:20',
    status: 'read',
    category: 'emergency',
  },
];

// Sub-component for individual SMS item card
const SmsHistoryCard: React.FC<{
  item: SmsItem;
  isFa: boolean;
}> = ({ item, isFa }) => {
  const getCategoryTheme = (cat: SmsItem['category']) => {
    switch (cat) {
      case 'financial':
        return {
          bg: 'bg-[#10B981]/15',
          border: 'border-[#10B981]/30',
          text: 'text-[#34D399]',
          icon: CreditCard,
        };
      case 'academic':
        return {
          bg: 'bg-[#6366F1]/15',
          border: 'border-[#6366F1]/30',
          text: 'text-[#818CF8]',
          icon: GraduationCap,
        };
      case 'cultural':
        return {
          bg: 'bg-[#A855F7]/15',
          border: 'border-[#A855F7]/30',
          text: 'text-[#C084FC]',
          icon: Bell,
        };
      case 'emergency':
        return {
          bg: 'bg-[#F43F5E]/15',
          border: 'border-[#F43F5E]/30',
          text: 'text-[#FB7185]',
          icon: AlertTriangle,
        };
      default:
        return {
          bg: 'bg-[#0EA5E9]/15',
          border: 'border-[#0EA5E9]/30',
          text: 'text-[#38BDF8]',
          icon: HeartHandshake,
        };
    }
  };

  const theme = getCategoryTheme(item.category);
  const CategoryIcon = theme.icon;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-2xl bg-[#1E293B]/80 border border-white/[0.06] hover:border-white/[0.12] transition-all"
    >
      <div className="flex items-start gap-3.5">
        {/* Category / SMS Icon */}
        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border ${theme.bg} ${theme.border} ${theme.text} mt-0.5`}>
          <CategoryIcon className="w-5 h-5" />
        </div>

        {/* SMS Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 flex-wrap mb-1.5">
            <span className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-indigo-400" />
              {isFa ? item.senderFa : item.senderEn}
            </span>
            <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-500" />
              {isFa ? item.dateTimeFa : item.dateTimeEn}
            </span>
          </div>

          <p className="text-xs sm:text-sm text-slate-200 leading-relaxed bg-[#232D42]/60 p-3 rounded-xl border border-white/[0.04]">
            {isFa ? item.messageFa : item.messageEn}
          </p>

          <div className="mt-2 flex items-center justify-end">
            {item.status === 'read' ? (
              <span className="text-[11px] text-cyan-400 font-medium flex items-center gap-1 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20">
                <CheckCheck className="w-3.5 h-3.5 text-cyan-400" />
                {isFa ? 'خوانده‌شده' : 'Read'}
              </span>
            ) : (
              <span className="text-[11px] text-indigo-300 font-medium flex items-center gap-1 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
                <Check className="w-3.5 h-3.5 text-indigo-300" />
                {isFa ? 'ارسال‌شده' : 'Sent'}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Toggle switch reusable row component
const ToggleRow: React.FC<{
  label: string;
  description?: string;
  checked: boolean;
  onChange: (val: boolean) => void;
  icon: React.ElementType;
  iconBg: string;
  iconText: string;
}> = ({ label, description, checked, onChange, icon: Icon, iconBg, iconText }) => {
  return (
    <div 
      onClick={() => onChange(!checked)}
      className="p-3.5 sm:p-4 rounded-2xl bg-[#1E293B]/70 border border-white/[0.06] hover:border-white/[0.12] flex items-center justify-between gap-4 transition-all cursor-pointer group"
    >
      <div className="flex items-start gap-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${iconBg} ${iconText} mt-0.5`}>
          <Icon className="w-4 h-4" />
        </div>
        <div>
          <h4 className="text-xs sm:text-sm font-bold text-slate-200 group-hover:text-white transition-colors">
            {label}
          </h4>
          {description && (
            <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
              {description}
            </p>
          )}
        </div>
      </div>

      {/* Switch element */}
      <div className={`w-12 h-6 rounded-full p-0.5 transition-colors duration-200 ease-in-out shrink-0 ${checked ? 'bg-indigo-600' : 'bg-[#2D384D]'}`}>
        <div className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-200 ease-in-out ${checked ? 'translate-x-6 rtl:-translate-x-6' : 'translate-x-0'}`} />
      </div>
    </div>
  );
};

export const SmsNotificationModal: React.FC = () => {
  const { activeModal, closeModal, showToast, language, t } = useDashboard();
  const isFa = language === 'fa';

  const [activeTab, setActiveTab] = useState<'history' | 'settings'>('history');
  const [searchQuery, setSearchQuery] = useState('');

  // Notification preferences state
  const [channels, setChannels] = useState({
    sms: true,
    email: true,
  });

  const [categories, setCategories] = useState({
    academic: true,
    financial: true,
    welfare: true,
    emergency: true,
  });

  if (activeModal !== 'sms_notification') return null;

  // Filter SMS items
  const filteredSms = SAMPLE_SMS_HISTORY.filter(item => {
    const msg = isFa ? item.messageFa : item.messageEn;
    const sender = isFa ? item.senderFa : item.senderEn;
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return msg.toLowerCase().includes(q) || sender.toLowerCase().includes(q);
  });

  const handleSaveSettings = () => {
    showToast(t('settingsSavedSuccess'));
    closeModal();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-[#0F172A]/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.96 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="w-full max-w-2xl bg-[#1C2436] border border-white/[0.08] rounded-t-[30px] sm:rounded-[30px] shadow-2xl text-white flex flex-col h-[90vh] sm:h-[85vh] max-h-[750px] overflow-hidden"
          dir={isFa ? 'rtl' : 'ltr'}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 sm:p-6 border-b border-white/[0.08] shrink-0 bg-[#1C2436]/90">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-indigo-600/20 border border-indigo-500/30 rounded-2xl flex items-center justify-center shrink-0">
                <MessageSquare className="w-6 h-6 text-[#818CF8] stroke-[2]" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white">
                  {t('smsNotificationTitle')}
                </h2>
                <p className="text-xs text-[#BBC1D1] mt-0.5">
                  {t('smsNotificationDesc')}
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

          {/* Tab Navigation Bar */}
          <div className="flex items-center border-b border-white/[0.08] bg-[#1E2738]/60 px-5 pt-3 shrink-0 gap-2">
            <button
              onClick={() => setActiveTab('history')}
              className={`px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'history'
                  ? 'border-[#6366F1] text-indigo-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>{t('tabSmsHistory')}</span>
              <span className="px-1.5 py-0.2 text-[10px] bg-indigo-500/20 text-indigo-300 rounded-full border border-indigo-500/30">
                {SAMPLE_SMS_HISTORY.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'settings'
                  ? 'border-[#6366F1] text-indigo-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>{t('tabNotificationSettings')}</span>
            </button>
          </div>

          {/* Modal Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {activeTab === 'history' ? (
              /* SMS History Tab */
              <div className="space-y-4">
                {/* Search Bar */}
                <div className="relative">
                  <Search className={`w-4 h-4 text-slate-400 absolute ${isFa ? 'right-3.5' : 'left-3.5'} top-1/2 -translate-y-1/2`} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t('searchSms')}
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

                {/* SMS Cards list */}
                {filteredSms.length === 0 ? (
                  <div className="py-12 flex flex-col items-center justify-center text-center text-slate-400">
                    <div className="w-14 h-14 rounded-2xl bg-[#232D42] border border-white/[0.08] flex items-center justify-center mb-3">
                      <FileQuestion className="w-7 h-7 text-slate-400" />
                    </div>
                    <h4 className="text-sm font-bold text-slate-200">{t('noSmsFound')}</h4>
                    <p className="text-xs text-slate-400 mt-1 max-w-xs">{t('noSmsDesc')}</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredSms.map((item) => (
                      <SmsHistoryCard key={item.id} item={item} isFa={isFa} />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              /* Notification Settings Tab */
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
              >
                {/* General Delivery Channels */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-[#818CF8] uppercase tracking-wider">
                    {t('generalChannels')}
                  </h3>
                  <div className="space-y-2.5">
                    <ToggleRow
                      label={t('receiveSms')}
                      description={t('receiveSmsDesc')}
                      checked={channels.sms}
                      onChange={(val) => setChannels(prev => ({ ...prev, sms: val }))}
                      icon={Smartphone}
                      iconBg="bg-indigo-500/15 border-indigo-500/30"
                      iconText="text-indigo-400"
                    />

                    <ToggleRow
                      label={t('receiveEmail')}
                      description={t('receiveEmailDesc')}
                      checked={channels.email}
                      onChange={(val) => setChannels(prev => ({ ...prev, email: val }))}
                      icon={Mail}
                      iconBg="bg-blue-500/15 border-blue-500/30"
                      iconText="text-blue-400"
                    />
                  </div>
                </div>

                {/* Category Preferences */}
                <div className="space-y-3 pt-2 border-t border-white/[0.08]">
                  <h3 className="text-xs font-bold text-[#818CF8] uppercase tracking-wider">
                    {t('categoryPreferences')}
                  </h3>
                  <div className="space-y-2.5">
                    <ToggleRow
                      label={isFa ? 'اطلاعیه‌های آموزشی' : 'Academic Notifications'}
                      description={t('academicNotifs')}
                      checked={categories.academic}
                      onChange={(val) => setCategories(prev => ({ ...prev, academic: val }))}
                      icon={GraduationCap}
                      iconBg="bg-indigo-500/15 border-indigo-500/30"
                      iconText="text-indigo-400"
                    />

                    <ToggleRow
                      label={isFa ? 'اطلاعیه‌های مالی' : 'Financial Notifications'}
                      description={t('financialNotifs')}
                      checked={categories.financial}
                      onChange={(val) => setCategories(prev => ({ ...prev, financial: val }))}
                      icon={CreditCard}
                      iconBg="bg-emerald-500/15 border-emerald-500/30"
                      iconText="text-emerald-400"
                    />

                    <ToggleRow
                      label={isFa ? 'اطلاعیه‌های رفاهی' : 'Welfare Notifications'}
                      description={t('welfareNotifs')}
                      checked={categories.welfare}
                      onChange={(val) => setCategories(prev => ({ ...prev, welfare: val }))}
                      icon={HeartHandshake}
                      iconBg="bg-amber-500/15 border-amber-500/30"
                      iconText="text-amber-400"
                    />

                    <ToggleRow
                      label={isFa ? 'اطلاعیه‌های اضطراری' : 'Emergency Notifications'}
                      description={t('emergencyNotifs')}
                      checked={categories.emergency}
                      onChange={(val) => setCategories(prev => ({ ...prev, emergency: val }))}
                      icon={AlertTriangle}
                      iconBg="bg-rose-500/15 border-rose-500/30"
                      iconText="text-rose-400"
                    />
                  </div>
                </div>

                {/* Save Button */}
                <div className="pt-4 border-t border-white/[0.08] flex items-center justify-end gap-3">
                  <button
                    onClick={closeModal}
                    className="px-5 py-2.5 rounded-2xl bg-[#232D42] hover:bg-[#2e3b56] text-[#BBC1D1] hover:text-white text-xs font-bold border border-white/[0.08] transition-all cursor-pointer"
                  >
                    {isFa ? 'انصراف' : 'Cancel'}
                  </button>
                  <button
                    onClick={handleSaveSettings}
                    className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all cursor-pointer flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{t('saveSettings')}</span>
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

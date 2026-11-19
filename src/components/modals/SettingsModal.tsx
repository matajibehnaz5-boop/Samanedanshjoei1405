import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Settings,
  X,
  Lightbulb,
  MessageSquare,
  Mail,
  Radio,
  Moon,
  Save,
  Smartphone,
  Monitor,
} from 'lucide-react';
import { useDashboard } from '../../context/DashboardContext';

export const SettingsModal: React.FC = () => {
  const { activeModal, closeModal, showToast, isCompactFrame, setIsCompactFrame } = useDashboard();

  // Settings toggle states
  const [smsNotify, setSmsNotify] = useState(true);
  const [emailNotify, setEmailNotify] = useState(false);
  const [showOnlineStatus, setShowOnlineStatus] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [autoSave, setAutoSave] = useState(true);

  if (activeModal !== 'settings') return null;

  const handleSaveSettings = () => {
    showToast('تنظیمات با موفقیت ذخیره شد');
    closeModal();
  };

  const toggleItems = [
    {
      id: 'sms',
      title: 'اعلان‌های پیامکی',
      description: 'دریافت پیامک‌های یادآوری و اطلاع‌رسانی',
      icon: MessageSquare,
      iconBg: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      value: smsNotify,
      onChange: () => setSmsNotify((prev) => !prev),
    },
    {
      id: 'email',
      title: 'اعلان‌های ایمیل',
      description: 'ارسال خبرنامه‌ها و اطلاعیه‌های آموزشی',
      icon: Mail,
      iconBg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      value: emailNotify,
      onChange: () => setEmailNotify((prev) => !prev),
    },
    {
      id: 'online',
      title: 'نمایش وضعیت آنلاین',
      description: 'مشاهده وضعیت حضور شما توسط همکلاسی‌ها',
      icon: Radio,
      iconBg: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      value: showOnlineStatus,
      onChange: () => setShowOnlineStatus((prev) => !prev),
    },
    {
      id: 'night',
      title: 'حالت شب',
      description: 'کاهش نور صفحه برای مطالعه در محیط‌های کم‌نور',
      icon: Moon,
      iconBg: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
      value: darkMode,
      onChange: () => setDarkMode((prev) => !prev),
    },
    {
      id: 'autosave',
      title: 'ذخیره خودکار',
      description: 'ذخیره خودکار پیش‌نویس‌ها و اطلاعات فرم‌ها',
      icon: Save,
      iconBg: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      value: autoSave,
      onChange: () => setAutoSave((prev) => !prev),
    },
  ];

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
              <div className="p-2.5 bg-slate-800 text-slate-200 rounded-xl border border-slate-700">
                <Settings className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-100">تنظیمات سامانه</h2>
                <p className="text-xs text-slate-400">سفارشی‌سازی رابط کاربری و اعلان‌ها</p>
              </div>
            </div>
            <button
              onClick={closeModal}
              className="p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mt-5 space-y-4">
            {/* 1. Suggestion Banner */}
            <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center gap-3 text-amber-200/90 shadow-sm">
              <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl shrink-0">
                <Lightbulb className="w-5 h-5" />
              </div>
              <p className="text-xs sm:text-sm font-medium leading-relaxed">
                برای تجربه بهتر، اعلان‌های پیامکی و ایمیل را فعال کنید.
              </p>
            </div>

            {/* 2. Settings Toggle List */}
            <div className="space-y-2.5">
              {toggleItems.map((item) => {
                const IconComponent = item.icon;
                return (
                  <div
                    key={item.id}
                    onClick={item.onChange}
                    className="p-3.5 bg-slate-900/60 hover:bg-slate-900/80 active:bg-slate-900 rounded-2xl border border-slate-800 transition-all flex items-center justify-between gap-3 cursor-pointer select-none group"
                  >
                    {/* Icon + Title on the right */}
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center border shrink-0 transition-transform group-hover:scale-105 ${item.iconBg}`}
                      >
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-100">{item.title}</h4>
                        <p className="text-[11px] text-slate-400">{item.description}</p>
                      </div>
                    </div>

                    {/* Interactive Animated Toggle Switch on the left */}
                    <div
                      role="switch"
                      aria-checked={item.value}
                      className={`relative w-12 h-7 rounded-full transition-colors duration-300 p-1 flex items-center shrink-0 dir-ltr ${
                        item.value ? 'bg-indigo-600' : 'bg-slate-700'
                      }`}
                    >
                      <motion.div
                        animate={{ x: item.value ? 20 : 0 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        className="w-5 h-5 bg-white rounded-full shadow-md pointer-events-none"
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Mobile / Fullscreen Frame Mode option */}
            <div className="p-3.5 bg-slate-900/60 rounded-2xl border border-slate-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-800 text-indigo-400 border border-slate-700 flex items-center justify-center shrink-0">
                  {isCompactFrame ? <Smartphone className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-100">حالت نمایش قاب موبایل</h4>
                  <p className="text-[11px] text-slate-400">تغییر عرض صفحه نمایش (موبایل / عریض)</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsCompactFrame((prev) => !prev);
                  showToast('حالت نمایش تغییر یافت');
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer shrink-0 ${
                  isCompactFrame
                    ? 'bg-indigo-600/30 text-indigo-300 border-indigo-500/40'
                    : 'bg-slate-800 text-slate-300 border-slate-700'
                }`}
              >
                {isCompactFrame ? 'قاب موبایل' : 'تمام‌صفحه'}
              </button>
            </div>

            {/* 4. Gradient Save Button & 5. Helper Text */}
            <div className="pt-3 space-y-2">
              <button
                type="button"
                onClick={handleSaveSettings}
                className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-2xl text-sm font-bold transition-all shadow-lg shadow-indigo-600/25 hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
              >
                <Save className="w-5 h-5" />
                <span>ذخیره تنظیمات</span>
              </button>

              <p className="text-center text-xs text-slate-400/80">
                تغییرات خود را اعمال کنید و سپس ذخیره کنید
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};




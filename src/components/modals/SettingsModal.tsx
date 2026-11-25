import React, { useEffect } from 'react';
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
  RotateCcw,
} from 'lucide-react';
import { useDashboard, useSettings } from '../../context/DashboardContext';

export const SettingsModal: React.FC = () => {
  const { activeModal, closeModal, showToast } = useDashboard();
  const {
    settings,
    updatePreviewSettings,
    saveSettings,
    resetToDefaults,
    discardPreview,
  } = useSettings();

  const isOpen = activeModal === 'settings';

  const handleCloseWithoutSave = () => {
    discardPreview();
    closeModal();
  };

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        discardPreview();
        closeModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, discardPreview, closeModal]);

  useEffect(() => {
    return () => {
      discardPreview();
    };
  }, [discardPreview]);

  if (!isOpen) return null;

  const handleSaveSettings = () => {
    saveSettings(settings);
    showToast('تنظیمات ذخیره شد');
    closeModal();
  };

  const handleResetDefaults = () => {
    resetToDefaults();
    showToast('تنظیمات به پیش‌فرض بازنشانی شد');
  };

  const toggleItems = [
    {
      id: 'sms',
      title: 'اعلان‌های پیامکی',
      description: 'نمایش اعلان‌های پیامکی در زنگ و پنل اعلان‌ها',
      icon: MessageSquare,
      iconBg: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      value: settings.smsNotify,
      onChange: () =>
        updatePreviewSettings((prev) => ({ ...prev, smsNotify: !prev.smsNotify })),
    },
    {
      id: 'email',
      title: 'اعلان‌های ایمیل',
      description: 'نمایش اعلان‌های ایمیلی در زنگ و پنل اعلان‌ها',
      icon: Mail,
      iconBg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      value: settings.emailNotify,
      onChange: () =>
        updatePreviewSettings((prev) => ({ ...prev, emailNotify: !prev.emailNotify })),
    },
    {
      id: 'online',
      title: 'نمایش وضعیت آنلاین',
      description: 'نمایش نقطه‌ی سبز وضعیت کنار آواتار و هدر',
      icon: Radio,
      iconBg: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      value: settings.showOnlineStatus,
      onChange: () =>
        updatePreviewSettings((prev) => ({ ...prev, showOnlineStatus: !prev.showOnlineStatus })),
    },
    {
      id: 'night',
      title: 'حالت شب',
      description: 'تغییر بین تم تیره (روشن) و تم آبی فیروزه‌ای روشن (خاموش)',
      icon: Moon,
      iconBg: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
      value: settings.darkMode,
      onChange: () =>
        updatePreviewSettings((prev) => ({ ...prev, darkMode: !prev.darkMode })),
    },
    {
      id: 'autosave',
      title: 'ذخیره خودکار',
      description: 'نگهداری و بازیابی خودکار پیش‌نویس فرم‌ها در مرورگر',
      icon: Save,
      iconBg: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      value: settings.autoSave,
      onChange: () =>
        updatePreviewSettings((prev) => ({ ...prev, autoSave: !prev.autoSave })),
    },
  ];

  return (
    <AnimatePresence>
      <div
        dir="rtl"
        onClick={(e) => {
          if (e.target === e.currentTarget) handleCloseWithoutSave();
        }}
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 pb-[12vh] sm:pb-[8vh] bg-[var(--backdrop)] backdrop-blur-sm"
      >
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          className="w-full max-w-lg bg-[var(--surface)] border border-[var(--border-strong)] rounded-[28px] p-6 shadow-[var(--card-shadow)] text-[var(--text-strong)] max-h-[85dvh] overflow-y-auto overflow-x-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-[var(--border)]">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-[var(--surface-2)] text-[var(--text-strong)] rounded-xl border border-[var(--border)]">
                <Settings className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-[var(--text)]">تنظیمات سامانه</h2>
                <p className="text-xs text-[var(--text-2)]">سفارشی‌سازی رابط کاربری و اعلان‌ها</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleCloseWithoutSave}
              aria-label="بستن"
              className="p-2 rounded-full hover:bg-[var(--surface-hover)] text-[var(--text-muted)] hover:text-[var(--text)] transition-colors cursor-pointer"
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
                با تغییر هر گزینه پیش‌نمایش زنده روی سامانه اعمال می‌شود؛ برای ثبت نهایی ذخیره را بزنید.
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
                    className="p-3.5 bg-[var(--surface-item)] hover:bg-[var(--surface-hover)] rounded-2xl border border-[var(--border)] transition-all flex items-center justify-between gap-3 cursor-pointer select-none group"
                  >
                    {/* Icon + Title on the right */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center border shrink-0 transition-transform group-hover:scale-105 ${item.iconBg}`}
                      >
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-[var(--text)]">{item.title}</h4>
                        <p className="text-[11px] text-[var(--text-2)]">{item.description}</p>
                      </div>
                    </div>

                    {/* Interactive Animated Toggle Switch on the left */}
                    <div
                      role="switch"
                      aria-checked={item.value}
                      className={`relative w-12 h-7 rounded-full transition-colors duration-300 p-1 flex items-center shrink-0 dir-ltr ${
                        item.value ? 'bg-[var(--switch-on-bg)]' : 'bg-[var(--switch-off-bg)]'
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
            <div className="p-3.5 bg-[var(--surface-item)] rounded-2xl border border-[var(--border)] flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full bg-[var(--surface-2)] text-[var(--accent)] border border-[var(--border)] flex items-center justify-center shrink-0">
                  {settings.isCompactFrame ? (
                    <Smartphone className="w-5 h-5" />
                  ) : (
                    <Monitor className="w-5 h-5" />
                  )}
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm font-bold text-[var(--text)]">حالت نمایش قاب موبایل</h4>
                  <p className="text-[11px] text-[var(--text-2)]">
                    تغییر عرض صفحه در دسکتاپ (ستون ۴۲۰px / تمام‌عرض)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  updatePreviewSettings((prev) => ({
                    ...prev,
                    isCompactFrame: !prev.isCompactFrame,
                  }));
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer shrink-0 ${
                  settings.isCompactFrame
                    ? 'bg-indigo-600/30 text-indigo-300 border-indigo-500/40'
                    : 'bg-[var(--surface-2)] text-[var(--text-2)] border-[var(--border)]'
                }`}
              >
                {settings.isCompactFrame ? 'قاب موبایل' : 'عرض کامل'}
              </button>
            </div>

            {/* Actions: Save & Reset to Default */}
            <div className="pt-3 space-y-2.5">
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  onClick={handleSaveSettings}
                  className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white text-sm font-bold transition-all shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
                >
                  <Save className="w-5 h-5" />
                  <span>ذخیره تنظیمات</span>
                </button>

                <button
                  type="button"
                  onClick={handleResetDefaults}
                  className="py-3 px-4 rounded-2xl bg-[var(--surface-2)] hover:bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--text-strong)] text-xs sm:text-sm font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>بازنشانی به پیش‌فرض</span>
                </button>
              </div>

              <p className="text-center text-xs text-[var(--text-muted)]">
                در صورت بستن بدون ذخیره، تغییرات به حالت قبلی بازمی‌گردند
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

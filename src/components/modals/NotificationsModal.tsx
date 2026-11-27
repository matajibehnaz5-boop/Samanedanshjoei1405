import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, X, CheckCheck, Info, AlertTriangle, CheckCircle2, MessageSquare, Mail } from 'lucide-react';
import { useDashboard } from '../../context/DashboardContext';

export const NotificationsModal: React.FC = () => {
  const { activeModal, closeModal, notifications, markNotificationsRead, showToast } = useDashboard();

  if (activeModal !== 'notifications') return null;

  return (
    <AnimatePresence>
      <div
        dir="rtl"
        data-modal-backdrop
        onClick={(e) => {
          if (e.target === e.currentTarget) closeModal();
        }}
        className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center p-2 sm:p-4 bg-[var(--backdrop)] backdrop-blur-sm"
      >
        <motion.div
          role="dialog"
          aria-modal="true"
          data-modal-panel
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          className="w-full max-w-lg bg-[var(--surface)] border border-[var(--border-strong)] rounded-[28px] shadow-2xl text-[var(--text)] flex flex-col max-h-[calc(var(--vvh,100dvh)-16px)] max-w-[calc(100vw-16px)] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 pt-4 pb-3 sm:px-6 sm:pt-6 sm:pb-4 border-b border-[var(--border)] shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-[var(--surface-2)] text-[var(--text-strong)] rounded-xl border border-[var(--border)]">
                <Bell className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-[var(--text)]">اعلانات و پیام‌های سیستم</h2>
                <p className="text-xs text-[var(--text-2)]">آخرین رویدادهای آموزشی و اداری</p>
              </div>
            </div>
            <button
              type="button"
              onClick={closeModal}
              aria-label="بستن"
              className="p-2 rounded-full hover:bg-[var(--surface-hover)] text-[var(--text-2)] hover:text-[var(--text)] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Action Bar */}
          <div className="px-4 pt-3 pb-2 sm:px-6 sm:pt-4 sm:pb-2 flex items-center justify-between shrink-0">
            <span className="text-xs text-[var(--text-2)]">
              {notifications.filter(n => !n.read).length} خوانده‌نشده
            </span>
            <button
              type="button"
              onClick={() => {
                markNotificationsRead();
                showToast('همه اعلا‌ن‌ها خوانده شد');
              }}
              className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <CheckCheck className="w-4 h-4" />
              <span>علامت‌گذاری همه به عنوان خوانده‌شده</span>
            </button>
          </div>

          {/* Notifications List */}
          <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-4 py-2 sm:px-6 sm:py-3 space-y-3">
            {notifications.length === 0 ? (
              <div className="py-10 text-center text-xs text-[var(--text-2)] bg-[var(--surface-item)] rounded-2xl border border-[var(--border)]">
                اعلانی برای نمایش وجود ندارد.
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.id}
                  className={`p-4 rounded-2xl border transition-colors ${
                    item.read
                      ? 'bg-[var(--surface-item)] border-[var(--border-subtle)] text-[var(--text-2)]'
                      : 'bg-[var(--surface-2)] border-[var(--border)] text-[var(--text)] shadow-md'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-xl bg-[var(--surface-3)] shrink-0 mt-0.5">
                        {item.type === 'academic' && <Info className="w-4 h-4 text-[var(--dash-sky-text)]" />}
                        {item.type === 'exam' && <AlertTriangle className="w-4 h-4 text-[var(--warn)]" />}
                        {item.type === 'system' && <CheckCircle2 className="w-4 h-4 text-[var(--ok)]" />}
                        {item.type === 'sms' && <MessageSquare className="w-4 h-4 text-[var(--accent)]" />}
                        {item.type === 'email' && <Mail className="w-4 h-4 text-[var(--ok)]" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-bold text-[var(--text)] flex items-center gap-2">
                            {item.title}
                            {!item.read && (
                              <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
                            )}
                          </h4>
                          {item.type === 'sms' && (
                            <span className="px-1.5 py-0.5 rounded-md bg-[var(--status-info-bg)] text-[var(--status-info-text)] border border-[var(--status-info-border)] text-[10px] font-semibold">
                              پیامک
                            </span>
                          )}
                          {item.type === 'email' && (
                            <span className="px-1.5 py-0.5 rounded-md bg-[var(--status-green-bg)] text-[var(--status-green-text)] border border-[var(--status-green-border)] text-[10px] font-semibold">
                              ایمیل
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[var(--text-2)] mt-1 leading-relaxed">{item.message}</p>
                      </div>
                    </div>
                    <span className="text-[11px] text-[var(--text-muted)] shrink-0">{item.time}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="px-4 pb-4 pt-3 sm:px-6 sm:pb-6 sm:pt-4 border-t border-[var(--border)] flex justify-end shrink-0">
            <button
              type="button"
              onClick={closeModal}
              className="px-5 py-2.5 bg-[var(--surface-2)] hover:bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--text-strong)] rounded-xl text-sm font-bold transition-colors cursor-pointer"
            >
              بستن
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

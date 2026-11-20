import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, X, CheckCheck, Info, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useDashboard } from '../../context/DashboardContext';

export const NotificationsModal: React.FC = () => {
  const { activeModal, closeModal, notifications, markNotificationsRead, showToast } = useDashboard();

  if (activeModal !== 'notifications') return null;

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
                <Bell className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-100">اعلانات و پیام‌های سیستم</h2>
                <p className="text-xs text-slate-400">آخرین رویدادهای آموزشی و اداری</p>
              </div>
            </div>
            <button
              onClick={closeModal}
              className="p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Action Bar */}
          <div className="mt-4 flex items-center justify-between">
            <span className="text-xs text-slate-400">
              {notifications.filter(n => !n.read).length} خوانده‌نشده
            </span>
            <button
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
          <div className="mt-4 space-y-3">
            {notifications.map((item) => (
              <div
                key={item.id}
                className={`p-4 rounded-2xl border transition-colors ${
                  item.read
                    ? 'bg-slate-900/40 border-slate-800 text-slate-300'
                    : 'bg-slate-900/90 border-slate-700 text-slate-100 shadow-md'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-slate-800 shrink-0 mt-0.5">
                      {item.type === 'academic' && <Info className="w-4 h-4 text-sky-400" />}
                      {item.type === 'exam' && <AlertTriangle className="w-4 h-4 text-amber-400" />}
                      {item.type === 'system' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                        {item.title}
                        {!item.read && (
                          <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
                        )}
                      </h4>
                      <p className="text-xs text-slate-300 mt-1 leading-relaxed">{item.message}</p>
                    </div>
                  </div>
                  <span className="text-[11px] text-slate-400 shrink-0">{item.time}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end">
            <button
              onClick={closeModal}
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-sm font-bold transition-colors cursor-pointer"
            >
              بستن
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

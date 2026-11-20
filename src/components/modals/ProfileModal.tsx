import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, X, Mail, Phone, GraduationCap, Check, BadgeCheck } from 'lucide-react';
import { useDashboard } from '../../context/DashboardContext';
import { UserAvatar } from '../UserAvatar';

export const ProfileModal: React.FC = () => {
  const { activeModal, closeModal, studentProfile, updateStudentProfile, showToast } = useDashboard();

  const [name, setName] = useState(studentProfile.name);
  const [studentId, setStudentId] = useState(studentProfile.studentId);
  const [email, setEmail] = useState(studentProfile.email || '');
  const [phone, setPhone] = useState(studentProfile.phone || '');
  const [field, setField] = useState(studentProfile.field || 'مهندسی کامپیوتر');

  useEffect(() => {
    if (activeModal === 'profile') {
      setName(studentProfile.name);
      setStudentId(studentProfile.studentId);
      setEmail(studentProfile.email || '');
      setPhone(studentProfile.phone || '');
      setField(studentProfile.field || 'مهندسی کامپیوتر');
    }
  }, [activeModal, studentProfile]);

  if (activeModal !== 'profile') return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('لطفاً نام و نام خانوادگی را وارد نمایید');
      return;
    }
    try {
      await updateStudentProfile({
        name: name.trim(),
        studentId: studentId.trim(),
        phone: phone.trim(),
        field: field.trim(),
      });
      showToast('مشخصات فردی با موفقیت به‌روزرسانی شد');
      closeModal();
    } catch (err: any) {
      showToast(err.message || 'خطا در به‌روزرسانی مشخصات');
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 pb-[12vh] sm:pb-[8vh] bg-slate-950/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          className="w-full max-w-lg bg-[#1E293B] border border-slate-700/80 rounded-[28px] p-6 shadow-2xl text-slate-100 max-h-[85dvh] overflow-y-auto"
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-700/60">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-600/20 text-indigo-400 rounded-xl border border-indigo-500/30">
                <User className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-100">مشخصات فردی</h2>
                <p className="text-xs text-slate-400">مشاهده و ویرایش اطلاعات حساب کاربری</p>
              </div>
            </div>
            <button
              onClick={closeModal}
              className="p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Profile Summary Card */}
          <div className="mt-5 p-4 bg-slate-900/80 rounded-2xl border border-slate-800 flex items-center gap-4">
            <UserAvatar size="lg" allowUpload={true} name={name} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-white truncate">{name || 'کاربر جدید'}</h3>
                {studentProfile.role === 'admin' ? (
                  <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 border border-amber-500/40 rounded-full text-[10px] font-bold shrink-0 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                    مدیر سیستم (ادمین)
                  </span>
                ) : (
                  <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full text-[10px] font-semibold shrink-0 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    دانشجو (سامانه)
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5 truncate">
                {field} • شماره دانشجویی: {studentId}
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            {/* Field 1: Name */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                نام و نام خانوادگی
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="نام و نام خانوادگی"
                  className="w-full bg-slate-900/90 border border-slate-700 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 pr-9 text-sm text-white placeholder-slate-500 focus:outline-none transition-colors"
                />
                <User className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
              </div>
            </div>

            {/* Field 2: Student ID */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                شماره دانشجویی
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  placeholder="شماره دانشجویی"
                  className="w-full bg-slate-900/90 border border-slate-700 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 pr-9 text-sm text-white placeholder-slate-500 focus:outline-none transition-colors dir-ltr text-right"
                />
                <BadgeCheck className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
              </div>
            </div>

            {/* Field 3: Email (Read Only) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  ایمیل کاربری
                </label>
                <span className="text-[10px] text-slate-500">غیرقابل تغییر</span>
              </div>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  readOnly
                  disabled
                  placeholder="example@domain.com"
                  className="w-full bg-slate-900/50 border border-slate-800 text-slate-400 rounded-xl px-3.5 py-2.5 pr-9 text-sm cursor-not-allowed dir-ltr text-right"
                />
                <Mail className="w-4 h-4 text-slate-500 absolute right-3 top-3" />
              </div>
            </div>

            {/* Field 4: Phone */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                شماره تماس
              </label>
              <div className="relative">
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="09123456789"
                  className="w-full bg-slate-900/90 border border-slate-700 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 pr-9 text-sm text-white placeholder-slate-500 focus:outline-none transition-colors dir-ltr text-right"
                />
                <Phone className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
              </div>
            </div>

            {/* Field 5: Field / Faculty */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                رشته / دانشکده
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={field}
                  onChange={(e) => setField(e.target.value)}
                  placeholder="مثال: مهندسی کامپیوتر"
                  className="w-full bg-slate-900/90 border border-slate-700 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 pr-9 text-sm text-white placeholder-slate-500 focus:outline-none transition-colors"
                />
                <GraduationCap className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                انصراف
              </button>

              <button
                type="submit"
                className="flex-1 py-2.5 bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.02]"
              >
                <Check className="w-4 h-4" />
                <span>ذخیره تغییرات</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

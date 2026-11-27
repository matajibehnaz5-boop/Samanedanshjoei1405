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
          {/* Modal Header */}
          <div className="flex items-center justify-between px-4 pt-4 pb-3 sm:px-6 sm:pt-6 sm:pb-4 border-b border-[var(--border)] shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-[var(--accent-soft-bg)] text-[var(--accent-soft-text)] rounded-xl border border-[var(--accent-soft-border)]">
                <User className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-[var(--text)]">مشخصات فردی</h2>
                <p className="text-xs text-[var(--text-2)]">مشاهده و ویرایش اطلاعات حساب کاربری</p>
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

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex-1 min-h-0 flex flex-col overflow-hidden">
            <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-4 py-4 sm:px-6 sm:py-5 space-y-4">
              {/* Profile Summary Card */}
              <div className="p-4 bg-[var(--surface-item)] rounded-2xl border border-[var(--border)] flex items-center gap-4">
            <UserAvatar size="lg" allowUpload={true} name={name} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-[var(--text)] truncate">{name || 'کاربر جدید'}</h3>
                {studentProfile.role === 'admin' ? (
                  <span className="px-2 py-0.5 bg-[var(--status-amber-bg)] text-[var(--status-amber-text)] border border-[var(--status-amber-border)] rounded-full text-[10px] font-bold shrink-0 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--warn)] animate-pulse" />
                    مدیر سیستم (ادمین)
                  </span>
                ) : (
                  <span className="px-2 py-0.5 bg-[var(--status-green-bg)] text-[var(--status-green-text)] border border-[var(--status-green-border)] rounded-full text-[10px] font-semibold shrink-0 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--ok)] animate-pulse" />
                    دانشجو (سامانه)
                  </span>
                )}
              </div>
              <p className="text-xs text-[var(--text-2)] mt-0.5 truncate">
                {field} • شماره دانشجویی: {studentId}
              </p>
              </div>
            </div>
            {/* Field 1: Name */}
            <div>
              <label className="text-xs font-semibold text-[var(--text-strong)] block mb-1.5">
                نام و نام خانوادگی
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="نام و نام خانوادگی"
                  className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] focus:border-[var(--accent)] rounded-xl px-3.5 py-2.5 pr-9 text-sm text-[var(--input-text)] placeholder-[var(--input-placeholder)] focus:outline-none transition-colors"
                />
                <User className="w-4 h-4 text-[var(--text-muted)] absolute right-3 top-3" />
              </div>
            </div>

            {/* Field 2: Student ID */}
            <div>
              <label className="text-xs font-semibold text-[var(--text-strong)] block mb-1.5">
                شماره دانشجویی
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  placeholder="شماره دانشجویی"
                  className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] focus:border-[var(--accent)] rounded-xl px-3.5 py-2.5 pr-9 text-sm text-[var(--input-text)] placeholder-[var(--input-placeholder)] focus:outline-none transition-colors dir-ltr text-right"
                />
                <BadgeCheck className="w-4 h-4 text-[var(--text-muted)] absolute right-3 top-3" />
              </div>
            </div>

            {/* Field 3: Email (Read Only) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-[var(--text-strong)]">
                  ایمیل کاربری
                </label>
                <span className="text-[10px] text-[var(--text-muted)]">غیرقابل تغییر</span>
              </div>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  readOnly
                  disabled
                  placeholder="example@domain.com"
                  className="w-full bg-[var(--surface-3)] border border-[var(--border-subtle)] text-[var(--text-muted)] rounded-xl px-3.5 py-2.5 pr-9 text-sm cursor-not-allowed dir-ltr text-right"
                />
                <Mail className="w-4 h-4 text-[var(--text-muted)] absolute right-3 top-3" />
              </div>
            </div>

            {/* Field 4: Phone */}
            <div>
              <label className="text-xs font-semibold text-[var(--text-strong)] block mb-1.5">
                شماره تماس
              </label>
              <div className="relative">
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="09123456789"
                  className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] focus:border-[var(--accent)] rounded-xl px-3.5 py-2.5 pr-9 text-sm text-[var(--input-text)] placeholder-[var(--input-placeholder)] focus:outline-none transition-colors dir-ltr text-right"
                />
                <Phone className="w-4 h-4 text-[var(--text-muted)] absolute right-3 top-3" />
              </div>
            </div>

            {/* Field 5: Field / Faculty */}
            <div>
              <label className="text-xs font-semibold text-[var(--text-strong)] block mb-1.5">
                رشته / دانشکده
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={field}
                  onChange={(e) => setField(e.target.value)}
                  placeholder="مثال: مهندسی کامپیوتر"
                  className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] focus:border-[var(--accent)] rounded-xl px-3.5 py-2.5 pr-9 text-sm text-[var(--input-text)] placeholder-[var(--input-placeholder)] focus:outline-none transition-colors"
                />
                <GraduationCap className="w-4 h-4 text-[var(--text-muted)] absolute right-3 top-3" />
              </div>
            </div>

            </div>

            {/* Action Buttons */}
            <div className="px-4 pb-4 pt-3 sm:px-6 sm:pb-6 sm:pt-4 border-t border-[var(--border)] flex items-center justify-between gap-3 shrink-0">
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-2.5 bg-[var(--surface-2)] hover:bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--text-strong)] rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                انصراف
              </button>

              <button
                type="submit"
                className="flex-1 py-2.5 bg-[image:var(--cta-gradient)] hover:bg-[image:var(--cta-gradient-hover)] text-[var(--on-accent)] rounded-xl text-xs font-bold transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.02]"
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

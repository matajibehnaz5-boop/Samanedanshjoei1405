import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  GraduationCap,
  BookOpen,
  Users,
  UserPlus,
  Building2,
  X,
  Trash2,
  Search,
  Plus,
  Check,
  Loader2,
  Phone,
  IdCard,
  Briefcase,
  BadgeCheck,
} from 'lucide-react';
import { useDashboard } from '../../context/DashboardContext';
import { api, type EduGroup, type EduField, type Employee } from '../../lib/api';

function normalizeDigits(str: string): string {
  return str
    .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));
}

export const EducationalAffairsModals: React.FC = () => {
  const { activeModal, setActiveModal, closeModal, showToast, studentProfile } = useDashboard();

  const isEducationalModal =
    activeModal === 'edu_groups' ||
    activeModal === 'edu_fields' ||
    activeModal === 'employee_register' ||
    activeModal === 'employee_list';

  // Shared data
  const [groups, setGroups] = useState<EduGroup[]>([]);
  const [fields, setFields] = useState<EduField[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [loadingFields, setLoadingFields] = useState(false);
  const [loadingEmployees, setLoadingEmployees] = useState(false);

  // Edu Group form state
  const [groupName, setGroupName] = useState('');
  const [groupHead, setGroupHead] = useState('');
  const [submittingGroup, setSubmittingGroup] = useState(false);
  const [confirmDeleteGroupId, setConfirmDeleteGroupId] = useState<string | null>(null);
  const [deletingGroupId, setDeletingGroupId] = useState<string | null>(null);

  // Edu Field form state
  const [fieldName, setFieldName] = useState('');
  const [submittingField, setSubmittingField] = useState(false);
  const [confirmDeleteFieldId, setConfirmDeleteFieldId] = useState<string | null>(null);
  const [deletingFieldId, setDeletingFieldId] = useState<string | null>(null);

  // Employee Register form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [personnelCode, setPersonnelCode] = useState('');
  const [phone, setPhone] = useState('');
  const [position, setPosition] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [selectedFieldId, setSelectedFieldId] = useState('');
  const [submittingEmployee, setSubmittingEmployee] = useState(false);

  // Employee List state
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmDeleteEmpId, setConfirmDeleteEmpId] = useState<string | null>(null);
  const [deletingEmpId, setDeletingEmpId] = useState<string | null>(null);

  const fetchGroups = useCallback(async () => {
    setLoadingGroups(true);
    try {
      const res = await api.getEduGroups();
      setGroups(res.groups || []);
    } catch (err: any) {
      showToast(err?.message || 'خطا در دریافت لیست گروه‌های آموزشی');
    } finally {
      setLoadingGroups(false);
    }
  }, [showToast]);

  const fetchFields = useCallback(async () => {
    setLoadingFields(true);
    try {
      const res = await api.getEduFields();
      setFields(res.fields || []);
    } catch (err: any) {
      showToast(err?.message || 'خطا در دریافت لیست رشته‌های تحصیلی');
    } finally {
      setLoadingFields(false);
    }
  }, [showToast]);

  const fetchEmployees = useCallback(async () => {
    setLoadingEmployees(true);
    try {
      const res = await api.getEmployees();
      setEmployees(res.employees || []);
    } catch (err: any) {
      showToast(err?.message || 'خطا در دریافت لیست کارمندان');
    } finally {
      setLoadingEmployees(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (!isEducationalModal) return;
    if (studentProfile.role !== 'admin') return;

    setConfirmDeleteGroupId(null);
    setConfirmDeleteFieldId(null);
    setConfirmDeleteEmpId(null);

    if (activeModal === 'edu_groups') {
      fetchGroups();
    } else if (activeModal === 'edu_fields') {
      fetchFields();
    } else if (activeModal === 'employee_register') {
      fetchGroups();
      fetchFields();
    } else if (activeModal === 'employee_list') {
      fetchEmployees();
    }
  }, [activeModal, isEducationalModal, studentProfile.role, fetchGroups, fetchFields, fetchEmployees]);

  const filteredEmployees = useMemo(() => {
    const q = normalizeDigits(searchQuery.trim().toLowerCase());
    if (!q) return employees;

    return employees.filter((emp) => {
      const fullName = `${emp.firstName} ${emp.lastName}`.toLowerCase();
      const natId = normalizeDigits((emp.nationalId || '').toLowerCase());
      const grp = (emp.groupName || '').toLowerCase();
      const fld = (emp.fieldName || '').toLowerCase();
      return fullName.includes(q) || natId.includes(q) || grp.includes(q) || fld.includes(q);
    });
  }, [employees, searchQuery]);

  if (!isEducationalModal || studentProfile.role !== 'admin') {
    return null;
  }

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) {
      showToast('لطفاً نام گروه آموزشی را وارد نمایید.');
      return;
    }

    setSubmittingGroup(true);
    try {
      await api.addEduGroup({
        name: groupName.trim(),
        head: groupHead.trim() || undefined,
      });
      setGroupName('');
      setGroupHead('');
      showToast('گروه آموزشی با موفقیت ثبت شد.');
      await fetchGroups();
    } catch (err: any) {
      showToast(err?.message || 'خطا در ثبت گروه آموزشی');
    } finally {
      setSubmittingGroup(false);
    }
  };

  const handleDeleteGroup = async (id: string) => {
    setDeletingGroupId(id);
    try {
      const res = await api.deleteEduGroup(id);
      setConfirmDeleteGroupId(null);
      showToast(res.message || 'گروه آموزشی با موفقیت حذف شد.');
      await fetchGroups();
    } catch (err: any) {
      showToast(err?.message || 'خطا در حذف گروه آموزشی');
    } finally {
      setDeletingGroupId(null);
    }
  };

  const handleCreateField = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fieldName.trim()) {
      showToast('لطفاً نام رشته تحصیلی را وارد نمایید.');
      return;
    }

    setSubmittingField(true);
    try {
      await api.addEduField({
        name: fieldName.trim(),
      });
      setFieldName('');
      showToast('رشته تحصیلی با موفقیت ثبت شد.');
      await fetchFields();
    } catch (err: any) {
      showToast(err?.message || 'خطا در ثبت رشته تحصیلی');
    } finally {
      setSubmittingField(false);
    }
  };

  const handleDeleteField = async (id: string) => {
    setDeletingFieldId(id);
    try {
      const res = await api.deleteEduField(id);
      setConfirmDeleteFieldId(null);
      showToast(res.message || 'رشته تحصیلی با موفقیت حذف شد.');
      await fetchFields();
    } catch (err: any) {
      showToast(err?.message || 'خطا در حذف رشته تحصیلی');
    } finally {
      setDeletingFieldId(null);
    }
  };

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      showToast('لطفاً نام و نام خانوادگی کارمند را وارد نمایید.');
      return;
    }

    const cleanNationalId = normalizeDigits(nationalId.trim());
    if (!/^\d{10}$/.test(cleanNationalId)) {
      showToast('کد ملی باید دقیقاً ۱۰ رقم باشد.');
      return;
    }

    setSubmittingEmployee(true);
    try {
      await api.addEmployee({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        nationalId: cleanNationalId,
        personnelCode: normalizeDigits(personnelCode.trim()) || undefined,
        phone: normalizeDigits(phone.trim()) || undefined,
        position: position.trim() || undefined,
        groupId: selectedGroupId || null,
        fieldId: selectedFieldId || null,
      });

      setFirstName('');
      setLastName('');
      setNationalId('');
      setPersonnelCode('');
      setPhone('');
      setPosition('');
      setSelectedGroupId('');
      setSelectedFieldId('');

      showToast('کارمند جدید با موفقیت ثبت شد.');
      setActiveModal('employee_list');
    } catch (err: any) {
      showToast(err?.message || 'خطا در ثبت اطلاعات کارمند');
    } finally {
      setSubmittingEmployee(false);
    }
  };

  const handleDeleteEmployee = async (id: string) => {
    setDeletingEmpId(id);
    try {
      const res = await api.deleteEmployee(id);
      setConfirmDeleteEmpId(null);
      showToast(res.message || 'کارمند با موفقیت حذف شد.');
      await fetchEmployees();
    } catch (err: any) {
      showToast(err?.message || 'خطا در حذف کارمند');
    } finally {
      setDeletingEmpId(null);
    }
  };

  const headerConfig =
    activeModal === 'edu_groups'
      ? {
          icon: <Building2 className="w-6 h-6" />,
          title: 'گروه‌های آموزشی',
          subtitle: 'تعریف، مشاهده و مدیریت گروه‌های آموزشی',
        }
      : activeModal === 'edu_fields'
      ? {
          icon: <BookOpen className="w-6 h-6" />,
          title: 'رشته‌های تحصیلی',
          subtitle: 'تعریف، مشاهده و مدیریت رشته‌های تحصیلی',
        }
      : activeModal === 'employee_register'
      ? {
          icon: <UserPlus className="w-6 h-6" />,
          title: 'ثبت نام کارمندان',
          subtitle: 'افزودن کارمند جدید به بخش امور آموزش',
        }
      : {
          icon: <Users className="w-6 h-6" />,
          title: 'لیست کارمندان',
          subtitle: 'جستجو و مدیریت کارمندان امور آموزش',
        };

  return (
    <AnimatePresence>
      <div
        dir="rtl"
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-sm"
      >
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          className="w-full max-w-2xl bg-[#1E293B] border border-slate-700/80 rounded-t-[28px] sm:rounded-[28px] p-6 shadow-2xl text-slate-100 max-h-[90vh] overflow-y-auto"
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-700/60">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-600/20 text-indigo-400 rounded-xl border border-indigo-500/30">
                {headerConfig.icon}
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-100">{headerConfig.title}</h2>
                <p className="text-xs text-slate-400">{headerConfig.subtitle}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={closeModal}
              className="p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 1) EDU GROUPS MODAL */}
          {activeModal === 'edu_groups' && (
            <div className="mt-5 space-y-6">
              <form
                onSubmit={handleCreateGroup}
                className="p-4 bg-slate-900/70 rounded-2xl border border-slate-800 space-y-4"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                      نام گروه آموزشی *
                    </label>
                    <input
                      type="text"
                      value={groupName}
                      onChange={(e) => setGroupName(e.target.value)}
                      placeholder="مثال: مهندسی کامپیوتر"
                      className="w-full bg-slate-900/90 border border-slate-700 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                      مدیر گروه (اختیاری)
                    </label>
                    <input
                      type="text"
                      value={groupHead}
                      onChange={(e) => setGroupHead(e.target.value)}
                      placeholder="نام مدیر گروه"
                      className="w-full bg-slate-900/90 border border-slate-700 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={submittingGroup}
                    className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-600/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {submittingGroup ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Plus className="w-4 h-4" />
                    )}
                    <span>افزودن گروه آموزشی</span>
                  </button>
                </div>
              </form>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-indigo-400" />
                    <span>لیست گروه‌های آموزشی ({groups.length})</span>
                  </h3>
                </div>

                {loadingGroups ? (
                  <div className="py-8 flex items-center justify-center text-slate-400 gap-2 text-xs">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>در حال بارگذاری گروه‌ها...</span>
                  </div>
                ) : groups.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400 bg-slate-900/50 rounded-2xl border border-slate-800">
                    هنوز هیچ گروه آموزشی ثبت نشده است.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {groups.map((grp) => (
                      <div
                        key={grp.id}
                        className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-bold text-white">{grp.name}</span>
                            <span className="px-2 py-0.5 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-[11px] font-semibold">
                              {grp.employeeCount} کارمند
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-1">
                            مدیر گروه: {grp.head ? grp.head : 'تعیین نشده'}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                          {confirmDeleteGroupId === grp.id ? (
                            <>
                              <button
                                type="button"
                                disabled={deletingGroupId === grp.id}
                                onClick={() => handleDeleteGroup(grp.id)}
                                className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                              >
                                {deletingGroupId === grp.id ? 'در حال حذف...' : 'تأیید حذف'}
                              </button>
                              <button
                                type="button"
                                disabled={deletingGroupId === grp.id}
                                onClick={() => setConfirmDeleteGroupId(null)}
                                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors cursor-pointer"
                              >
                                لغو
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteGroupId(grp.id)}
                              className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 text-rose-400 transition-colors cursor-pointer"
                              title="حذف گروه آموزشی"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 2) EDU FIELDS MODAL */}
          {activeModal === 'edu_fields' && (
            <div className="mt-5 space-y-6">
              <form
                onSubmit={handleCreateField}
                className="p-4 bg-slate-900/70 rounded-2xl border border-slate-800 space-y-4"
              >
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                    نام رشته تحصیلی *
                  </label>
                  <input
                    type="text"
                    value={fieldName}
                    onChange={(e) => setFieldName(e.target.value)}
                    placeholder="مثال: مهندسی نرم‌افزار"
                    className="w-full bg-slate-900/90 border border-slate-700 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none transition-colors"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={submittingField}
                    className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-600/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {submittingField ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Plus className="w-4 h-4" />
                    )}
                    <span>افزودن رشته تحصیلی</span>
                  </button>
                </div>
              </form>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-indigo-400" />
                    <span>لیست رشته‌های تحصیلی ({fields.length})</span>
                  </h3>
                </div>

                {loadingFields ? (
                  <div className="py-8 flex items-center justify-center text-slate-400 gap-2 text-xs">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>در حال بارگذاری رشته‌ها...</span>
                  </div>
                ) : fields.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400 bg-slate-900/50 rounded-2xl border border-slate-800">
                    هنوز هیچ رشته تحصیلی ثبت نشده است.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {fields.map((fld) => (
                      <div
                        key={fld.id}
                        className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-bold text-white">{fld.name}</span>
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[11px] font-semibold">
                              {fld.employeeCount} کارمند
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                          {confirmDeleteFieldId === fld.id ? (
                            <>
                              <button
                                type="button"
                                disabled={deletingFieldId === fld.id}
                                onClick={() => handleDeleteField(fld.id)}
                                className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                              >
                                {deletingFieldId === fld.id ? 'در حال حذف...' : 'تأیید حذف'}
                              </button>
                              <button
                                type="button"
                                disabled={deletingFieldId === fld.id}
                                onClick={() => setConfirmDeleteFieldId(null)}
                                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors cursor-pointer"
                              >
                                لغو
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteFieldId(fld.id)}
                              className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 text-rose-400 transition-colors cursor-pointer"
                              title="حذف رشته تحصیلی"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 3) EMPLOYEE REGISTER MODAL */}
          {activeModal === 'employee_register' && (
            <form onSubmit={handleCreateEmployee} className="mt-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                    نام *
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="نام"
                    className="w-full bg-slate-900/90 border border-slate-700 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                    نام خانوادگی *
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="نام خانوادگی"
                    className="w-full bg-slate-900/90 border border-slate-700 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                    کد ملی (۱۰ رقم) *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={10}
                      value={nationalId}
                      onChange={(e) => setNationalId(e.target.value)}
                      placeholder="0123456789"
                      className="w-full bg-slate-900/90 border border-slate-700 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 pr-9 text-sm text-white placeholder-slate-500 focus:outline-none transition-colors dir-ltr text-right"
                    />
                    <IdCard className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                    کد پرسنلی
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={personnelCode}
                      onChange={(e) => setPersonnelCode(e.target.value)}
                      placeholder="مثال: 10452"
                      className="w-full bg-slate-900/90 border border-slate-700 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 pr-9 text-sm text-white placeholder-slate-500 focus:outline-none transition-colors dir-ltr text-right"
                    />
                    <BadgeCheck className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                  </div>
                </div>

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

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                    سمت
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={position}
                      onChange={(e) => setPosition(e.target.value)}
                      placeholder="مثال: کارشناس آموزش"
                      className="w-full bg-slate-900/90 border border-slate-700 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 pr-9 text-sm text-white placeholder-slate-500 focus:outline-none transition-colors"
                    />
                    <Briefcase className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                    گروه آموزشی (اختیاری)
                  </label>
                  <select
                    value={selectedGroupId}
                    onChange={(e) => setSelectedGroupId(e.target.value)}
                    className="w-full bg-slate-900/90 border border-slate-700 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none transition-colors"
                  >
                    <option value="">بدون گروه آموزشی</option>
                    {groups.map((grp) => (
                      <option key={grp.id} value={grp.id}>
                        {grp.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                    رشته تحصیلی (اختیاری)
                  </label>
                  <select
                    value={selectedFieldId}
                    onChange={(e) => setSelectedFieldId(e.target.value)}
                    className="w-full bg-slate-900/90 border border-slate-700 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none transition-colors"
                  >
                    <option value="">بدون رشته تحصیلی</option>
                    {fields.map((fld) => (
                      <option key={fld.id} value={fld.id}>
                        {fld.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setActiveModal('employee_list')}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  مشاهده لیست کارمندان
                </button>

                <button
                  type="submit"
                  disabled={submittingEmployee}
                  className="flex-1 py-2.5 bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {submittingEmployee ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  <span>ثبت کارمند</span>
                </button>
              </div>
            </form>
          )}

          {/* 4) EMPLOYEE LIST MODAL */}
          {activeModal === 'employee_list' && (
            <div className="mt-5 space-y-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="جستجو بر اساس نام، کد ملی، گروه یا رشته تحصیلی..."
                    className="w-full bg-slate-900/90 border border-slate-700 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 pr-9 text-sm text-white placeholder-slate-500 focus:outline-none transition-colors"
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                </div>

                <button
                  type="button"
                  onClick={() => setActiveModal('employee_register')}
                  className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ جدید</span>
                </button>
              </div>

              {loadingEmployees ? (
                <div className="py-10 flex items-center justify-center text-slate-400 gap-2 text-xs">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>در حال بارگذاری لیست کارمندان...</span>
                </div>
              ) : filteredEmployees.length === 0 ? (
                <div className="py-10 text-center text-xs text-slate-400 bg-slate-900/50 rounded-2xl border border-slate-800">
                  {employees.length === 0
                    ? 'هنوز کارمندی ثبت نشده است.'
                    : 'کارمندی با عبارت جستجو شده یافت نشد.'}
                </div>
              ) : (
                <div className="space-y-2.5">
                  {filteredEmployees.map((emp) => (
                    <div
                      key={emp.id}
                      className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="min-w-0 space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold text-white">
                            {emp.firstName} {emp.lastName}
                          </span>
                          {emp.position && (
                            <span className="px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-[11px] font-medium">
                              {emp.position}
                            </span>
                          )}
                          <span className="px-2 py-0.5 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-[11px] font-semibold">
                            گروه: {emp.groupName || 'بدون گروه'}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[11px] font-semibold">
                            رشته: {emp.fieldName || 'بدون رشته'}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 flex-wrap text-xs text-slate-400">
                          <span>کد ملی: {emp.nationalId}</span>
                          {emp.personnelCode && <span>• کد پرسنلی: {emp.personnelCode}</span>}
                          {emp.phone && <span>• تماس: {emp.phone}</span>}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        {confirmDeleteEmpId === emp.id ? (
                          <>
                            <button
                              type="button"
                              disabled={deletingEmpId === emp.id}
                              onClick={() => handleDeleteEmployee(emp.id)}
                              className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                            >
                              {deletingEmpId === emp.id ? 'در حال حذف...' : 'تأیید حذف'}
                            </button>
                            <button
                              type="button"
                              disabled={deletingEmpId === emp.id}
                              onClick={() => setConfirmDeleteEmpId(null)}
                              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors cursor-pointer"
                            >
                              لغو
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteEmpId(emp.id)}
                            className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 text-rose-400 transition-colors cursor-pointer"
                            title="حذف کارمند"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

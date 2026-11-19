import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  UserCheck,
  UserPlus,
  Users,
  ShieldCheck,
  BookMarked,
  X,
  Trash2,
  Search,
  Plus,
  Check,
  Loader2,
  Phone,
  Mail,
  IdCard,
  BadgeCheck,
  Save,
} from 'lucide-react';
import { useDashboard } from '../../context/DashboardContext';
import {
  api,
  type EduGroup,
  type ProfessorSpecialty,
  type Professor,
  type AcademicRank,
  type ProfessorAccessLevel,
  type ProfessorThesis,
} from '../../lib/api';

function normalizeDigits(str: string): string {
  return str
    .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));
}

const ACADEMIC_RANKS: AcademicRank[] = ['مربی', 'استادیار', 'دانشیار', 'استاد'];

const ACCESS_LEVEL_OPTIONS: Array<{ value: ProfessorAccessLevel; label: string }> = [
  { value: 'view', label: 'فقط مشاهده' },
  { value: 'advisor', label: 'راهنما/مشاور' },
  { value: 'referee', label: 'داور جلسات دفاع' },
  { value: 'group_head', label: 'مدیر گروه' },
];

const THESIS_ROLE_LABELS: Record<ProfessorThesis['role'], string> = {
  advisor: 'استاد راهنما',
  co_advisor: 'استاد مشاور',
  referee: 'داور',
};

export const ProfessorAffairsModals: React.FC = () => {
  const { activeModal, setActiveModal, closeModal, showToast, studentProfile } = useDashboard();

  const isProfessorModal =
    activeModal === 'professor_register' ||
    activeModal === 'professor_list' ||
    activeModal === 'professor_access' ||
    activeModal === 'professor_theses';

  // Shared data
  const [groups, setGroups] = useState<EduGroup[]>([]);
  const [specialties, setSpecialties] = useState<ProfessorSpecialty[]>([]);
  const [professors, setProfessors] = useState<Professor[]>([]);
  const [loadingProfessors, setLoadingProfessors] = useState(false);

  // Register form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [personnelCode, setPersonnelCode] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [academicRank, setAcademicRank] = useState<AcademicRank>('استادیار');
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [selectedSpecialtyId, setSelectedSpecialtyId] = useState('');
  const [capacity, setCapacity] = useState('5');
  const [submittingProfessor, setSubmittingProfessor] = useState(false);

  // List state
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmDeleteProfId, setConfirmDeleteProfId] = useState<string | null>(null);
  const [deletingProfId, setDeletingProfId] = useState<string | null>(null);

  // Access state
  const [accessDrafts, setAccessDrafts] = useState<Record<string, ProfessorAccessLevel>>({});
  const [savingAccessId, setSavingAccessId] = useState<string | null>(null);

  // Theses state
  const [selectedThesisProfId, setSelectedThesisProfId] = useState('');
  const [theses, setTheses] = useState<ProfessorThesis[]>([]);
  const [loadingTheses, setLoadingTheses] = useState(false);

  const fetchGroups = useCallback(async () => {
    try {
      const res = await api.getEduGroups();
      if (Array.isArray(res?.groups)) {
        setGroups(res.groups);
      } else {
        setGroups([]);
        showToast('فرمت پاسخ لیست گروه‌های آموزشی نامعتبر است.');
      }
    } catch (err: any) {
      showToast(err?.message || 'خطا در دریافت لیست گروه‌های آموزشی');
    }
  }, [showToast]);

  const fetchSpecialties = useCallback(async () => {
    try {
      const res = await api.getProfessorSpecialties();
      if (Array.isArray(res?.specialties)) {
        setSpecialties(res.specialties);
      } else {
        setSpecialties([]);
        showToast('فرمت پاسخ لیست تخصص‌ها نامعتبر است.');
      }
    } catch (err: any) {
      showToast(err?.message || 'خطا در دریافت لیست تخصص‌ها / گرایش‌ها');
    }
  }, [showToast]);

  const fetchProfessors = useCallback(async () => {
    setLoadingProfessors(true);
    try {
      const res = await api.getProfessors();
      const list = res.professors || [];
      setProfessors(list);
      const nextDrafts: Record<string, ProfessorAccessLevel> = {};
      for (const p of list) {
        nextDrafts[p.id] = p.accessLevel || 'view';
      }
      setAccessDrafts(nextDrafts);
      setSelectedThesisProfId((prev) => {
        if (prev && list.some((p) => p.id === prev)) return prev;
        return list.length > 0 ? list[0].id : '';
      });
    } catch (err: any) {
      showToast(err?.message || 'خطا در دریافت لیست اساتید');
    } finally {
      setLoadingProfessors(false);
    }
  }, [showToast]);

  const fetchProfessorTheses = useCallback(
    async (profId: string) => {
      if (!profId) {
        setTheses([]);
        return;
      }
      setLoadingTheses(true);
      try {
        const res = await api.getProfessorTheses(profId);
        setTheses(res.theses || []);
      } catch (err: any) {
        setTheses([]);
        showToast(err?.message || 'خطا در دریافت لیست پایان‌نامه‌های استاد');
      } finally {
        setLoadingTheses(false);
      }
    },
    [showToast]
  );

  useEffect(() => {
    if (!isProfessorModal || studentProfile.role !== 'admin') return;

    setConfirmDeleteProfId(null);

    if (activeModal === 'professor_register') {
      fetchGroups();
      fetchSpecialties();
    } else if (
      activeModal === 'professor_list' ||
      activeModal === 'professor_access' ||
      activeModal === 'professor_theses'
    ) {
      fetchProfessors();
    }
  }, [activeModal, isProfessorModal, studentProfile.role, fetchGroups, fetchSpecialties, fetchProfessors]);

  useEffect(() => {
    if (activeModal !== 'professor_theses' || studentProfile.role !== 'admin') return;
    if (!selectedThesisProfId) {
      setTheses([]);
      return;
    }
    fetchProfessorTheses(selectedThesisProfId);
  }, [activeModal, selectedThesisProfId, studentProfile.role, fetchProfessorTheses]);

  const sortedGroups = useMemo(
    () => [...groups].sort((a, b) => a.name.localeCompare(b.name, 'fa')),
    [groups]
  );

  const sortedSpecialties = useMemo(
    () => [...specialties].sort((a, b) => a.name.localeCompare(b.name, 'fa')),
    [specialties]
  );

  const filteredProfessors = useMemo(() => {
    const q = normalizeDigits(searchQuery.trim().toLowerCase());
    if (!q) return professors;

    return professors.filter((prof) => {
      const fullName = `${prof.firstName} ${prof.lastName}`.toLowerCase();
      const natId = normalizeDigits((prof.nationalId || '').toLowerCase());
      const grp = (prof.groupName || '').toLowerCase();
      const spec = (prof.specialtyName || prof.fieldName || '').toLowerCase();
      const rank = (prof.academicRank || '').toLowerCase();
      return (
        fullName.includes(q) ||
        natId.includes(q) ||
        grp.includes(q) ||
        spec.includes(q) ||
        rank.includes(q)
      );
    });
  }, [professors, searchQuery]);

  if (!isProfessorModal || studentProfile.role !== 'admin') {
    return null;
  }

  const handleCreateProfessor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      showToast('لطفاً نام و نام خانوادگی استاد را وارد نمایید.');
      return;
    }

    const cleanNationalId = normalizeDigits(nationalId.trim());
    if (!/^\d{10}$/.test(cleanNationalId)) {
      showToast('کد ملی باید دقیقاً ۱۰ رقم باشد.');
      return;
    }

    const cleanCapStr = normalizeDigits(capacity.trim());
    const parsedCapacity = cleanCapStr === '' ? 0 : Number(cleanCapStr);
    if (!Number.isInteger(parsedCapacity) || parsedCapacity < 0 || parsedCapacity > 200) {
      showToast('ظرفیت راهنمایی پایان‌نامه باید یک عدد صحیح بین ۰ تا ۲۰۰ باشد.');
      return;
    }

    const trimmedEmail = email.trim();
    if (trimmedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      showToast('فرمت ایمیل وارد شده معتبر نیست.');
      return;
    }

    setSubmittingProfessor(true);
    try {
      await api.addProfessor({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        nationalId: cleanNationalId,
        personnelCode: normalizeDigits(personnelCode.trim()) || undefined,
        phone: normalizeDigits(phone.trim()) || undefined,
        email: trimmedEmail || undefined,
        academicRank,
        groupId: selectedGroupId || null,
        specialtyId: selectedSpecialtyId || null,
        capacity: parsedCapacity,
      });

      setFirstName('');
      setLastName('');
      setNationalId('');
      setPersonnelCode('');
      setPhone('');
      setEmail('');
      setAcademicRank('استادیار');
      setSelectedGroupId('');
      setSelectedSpecialtyId('');
      setCapacity('5');

      showToast('استاد جدید با موفقیت ثبت شد.');
      setActiveModal('professor_list');
    } catch (err: any) {
      showToast(err?.message || 'خطا در ثبت اطلاعات استاد');
    } finally {
      setSubmittingProfessor(false);
    }
  };

  const handleDeleteProfessor = async (id: string) => {
    setDeletingProfId(id);
    try {
      const res = await api.deleteProfessor(id);
      setConfirmDeleteProfId(null);
      showToast(res.message || 'استاد با موفقیت حذف شد.');
      await fetchProfessors();
    } catch (err: any) {
      showToast(err?.message || 'خطا در حذف استاد');
    } finally {
      setDeletingProfId(null);
    }
  };

  const handleSaveAccess = async (prof: Professor) => {
    const targetLevel = accessDrafts[prof.id] || prof.accessLevel || 'view';
    setSavingAccessId(prof.id);
    try {
      const res = await api.updateProfessorAccess(prof.id, targetLevel);
      setProfessors((prev) => prev.map((item) => (item.id === prof.id ? res.professor : item)));
      showToast(res.message || 'سطح دسترسی استاد با موفقیت به‌روزرسانی شد.');
    } catch (err: any) {
      showToast(err?.message || 'خطا در به‌روزرسانی سطح دسترسی');
    } finally {
      setSavingAccessId(null);
    }
  };

  const headerConfig =
    activeModal === 'professor_register'
      ? {
          icon: <UserPlus className="w-6 h-6" />,
          title: 'ثبت نام اساتید',
          subtitle: 'افزودن استاد جدید و تعیین گروه، مرتبه علمی و ظرفیت',
        }
      : activeModal === 'professor_list'
      ? {
          icon: <Users className="w-6 h-6" />,
          title: 'لیست اساتید',
          subtitle: 'مشاهده، جستجو و مدیریت اساتید ثبت‌شده',
        }
      : activeModal === 'professor_access'
      ? {
          icon: <ShieldCheck className="w-6 h-6" />,
          title: 'سطح دسترسی اساتید',
          subtitle: 'تعیین و ویرایش نقش و دسترسی اساتید در سامانه',
        }
      : {
          icon: <BookMarked className="w-6 h-6" />,
          title: 'پایان‌نامه اساتید',
          subtitle: 'مشاهده پایان‌نامه‌های راهنما، مشاور و داوری اساتید',
        };

  return (
    <AnimatePresence>
      <div
        dir="rtl"
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 pb-[12vh] sm:pb-[8vh] bg-slate-950/80 backdrop-blur-sm"
      >
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          className="w-full max-w-2xl bg-[#1E293B] border border-slate-700/80 rounded-xl sm:rounded-[28px] p-[12px] sm:p-6 shadow-2xl text-slate-100 max-h-[85dvh] overflow-y-auto overflow-x-hidden"
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between gap-2 pb-3 sm:pb-4 border-b border-slate-700/60">
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              <div className="p-2 sm:p-2.5 bg-indigo-600/20 text-indigo-400 rounded-xl border border-indigo-500/30 shrink-0">
                {headerConfig.icon}
              </div>
              <div className="min-w-0">
                <h2 className="text-[15px] sm:text-lg font-bold text-slate-100 truncate">{headerConfig.title}</h2>
                <p className="text-[11px] sm:text-xs text-slate-400 truncate">{headerConfig.subtitle}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={closeModal}
              className="p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 1) PROFESSOR REGISTER MODAL */}
          {activeModal === 'professor_register' && (
            <form onSubmit={handleCreateProfessor} className="mt-3 sm:mt-5 space-y-3 sm:space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-4">
                <div>
                  <label className="text-[11px] sm:text-xs font-semibold text-slate-300 block mb-1 sm:mb-1.5">
                    نام *
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="نام"
                    className="w-full bg-slate-900/90 border border-slate-700 focus:border-indigo-500 rounded-xl px-3 py-2 sm:px-3.5 sm:py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="text-[11px] sm:text-xs font-semibold text-slate-300 block mb-1 sm:mb-1.5">
                    نام خانوادگی *
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="نام خانوادگی"
                    className="w-full bg-slate-900/90 border border-slate-700 focus:border-indigo-500 rounded-xl px-3 py-2 sm:px-3.5 sm:py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="text-[11px] sm:text-xs font-semibold text-slate-300 block mb-1 sm:mb-1.5">
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
                      className="w-full bg-slate-900/90 border border-slate-700 focus:border-indigo-500 rounded-xl px-3 py-2 sm:px-3.5 sm:py-2.5 pr-9 text-sm text-white placeholder-slate-500 focus:outline-none transition-colors dir-ltr text-right"
                    />
                    <IdCard className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] sm:text-xs font-semibold text-slate-300 block mb-1 sm:mb-1.5">
                    کد پرسنلی
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={personnelCode}
                      onChange={(e) => setPersonnelCode(e.target.value)}
                      placeholder="مثال: 20485"
                      className="w-full bg-slate-900/90 border border-slate-700 focus:border-indigo-500 rounded-xl px-3 py-2 sm:px-3.5 sm:py-2.5 pr-9 text-sm text-white placeholder-slate-500 focus:outline-none transition-colors dir-ltr text-right"
                    />
                    <BadgeCheck className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] sm:text-xs font-semibold text-slate-300 block mb-1 sm:mb-1.5">
                    شماره تماس
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="09123456789"
                      className="w-full bg-slate-900/90 border border-slate-700 focus:border-indigo-500 rounded-xl px-3 py-2 sm:px-3.5 sm:py-2.5 pr-9 text-sm text-white placeholder-slate-500 focus:outline-none transition-colors dir-ltr text-right"
                    />
                    <Phone className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] sm:text-xs font-semibold text-slate-300 block mb-1 sm:mb-1.5">
                    ایمیل
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="professor@university.ac.ir"
                      className="w-full bg-slate-900/90 border border-slate-700 focus:border-indigo-500 rounded-xl px-3 py-2 sm:px-3.5 sm:py-2.5 pr-9 text-sm text-white placeholder-slate-500 focus:outline-none transition-colors dir-ltr text-right"
                    />
                    <Mail className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                    مرتبه علمی *
                  </label>
                  <select
                    value={academicRank}
                    onChange={(e) => setAcademicRank(e.target.value as AcademicRank)}
                    className="w-full bg-slate-900/90 border border-slate-700 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none transition-colors"
                  >
                    {ACADEMIC_RANKS.map((rank) => (
                      <option key={rank} value={rank}>
                        {rank}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                    ظرفیت راهنمایی پایان‌نامه *
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={200}
                    value={capacity}
                    onChange={(e) => setCapacity(e.target.value)}
                    placeholder="5"
                    className="w-full bg-slate-900/90 border border-slate-700 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none transition-colors dir-ltr text-right"
                  />
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
                    {sortedGroups.map((grp) => (
                      <option key={grp.id} value={grp.id}>
                        {grp.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                    تخصص / گرایش (اختیاری)
                  </label>
                  <select
                    value={selectedSpecialtyId}
                    onChange={(e) => setSelectedSpecialtyId(e.target.value)}
                    className="w-full bg-slate-900/90 border border-slate-700 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none transition-colors"
                  >
                    <option value="">انتخاب تخصص / گرایش</option>
                    {sortedSpecialties.map((spec) => (
                      <option key={spec.id} value={spec.id}>
                        {spec.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setActiveModal('professor_list')}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  مشاهده لیست اساتید
                </button>

                <button
                  type="submit"
                  disabled={submittingProfessor}
                  className="flex-1 py-2.5 bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {submittingProfessor ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  <span>ثبت استاد</span>
                </button>
              </div>
            </form>
          )}

          {/* 2) PROFESSOR LIST MODAL */}
          {activeModal === 'professor_list' && (
            <div className="mt-3 sm:mt-5 space-y-3 sm:space-y-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="جستجو بر اساس نام، کد ملی یا گروه آموزشی..."
                    className="w-full bg-slate-900/90 border border-slate-700 focus:border-indigo-500 rounded-xl px-3 py-2 sm:px-3.5 sm:py-2.5 pr-9 text-sm text-white placeholder-slate-500 focus:outline-none transition-colors"
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                </div>

                <button
                  type="button"
                  onClick={() => setActiveModal('professor_register')}
                  className="px-4 py-2 sm:py-2.5 bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ جدید</span>
                </button>
              </div>

              {loadingProfessors ? (
                <div className="py-10 flex items-center justify-center text-slate-400 gap-2 text-xs">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>در حال بارگذاری لیست اساتید...</span>
                </div>
              ) : filteredProfessors.length === 0 ? (
                <div className="py-10 text-center text-xs text-slate-400 bg-slate-900/50 rounded-xl sm:rounded-2xl border border-slate-800">
                  {professors.length === 0
                    ? 'هنوز استادی ثبت نشده است.'
                    : 'استادی با عبارت جستجو شده یافت نشد.'}
                </div>
              ) : (
                <div className="space-y-2 sm:space-y-2.5">
                  {filteredProfessors.map((prof) => (
                    <div
                      key={prof.id}
                      className="p-[12px] sm:p-4 bg-slate-900/80 border border-slate-800 rounded-xl sm:rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3"
                    >
                      <div className="min-w-0 space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold text-white">
                            {prof.firstName} {prof.lastName}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[11px] font-semibold">
                            {prof.academicRank}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-[11px] font-semibold">
                            گروه: {prof.groupName || 'بدون گروه'}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[11px] font-semibold">
                            ظرفیت: {prof.capacity}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 flex-wrap text-xs text-slate-400">
                          <span>کد ملی: {prof.nationalId}</span>
                          {(prof.specialtyName || prof.fieldName) && (
                            <span>• تخصص: {prof.specialtyName || prof.fieldName}</span>
                          )}
                          {prof.personnelCode && <span>• کد پرسنلی: {prof.personnelCode}</span>}
                          {prof.phone && <span>• تماس: {prof.phone}</span>}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        {confirmDeleteProfId === prof.id ? (
                          <>
                            <button
                              type="button"
                              disabled={deletingProfId === prof.id}
                              onClick={() => handleDeleteProfessor(prof.id)}
                              className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                            >
                              {deletingProfId === prof.id ? 'در حال حذف...' : 'تأیید حذف'}
                            </button>
                            <button
                              type="button"
                              disabled={deletingProfId === prof.id}
                              onClick={() => setConfirmDeleteProfId(null)}
                              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors cursor-pointer"
                            >
                              لغو
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteProfId(prof.id)}
                            className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 text-rose-400 transition-colors cursor-pointer"
                            title="حذف استاد"
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

          {/* 3) PROFESSOR ACCESS MODAL */}
          {activeModal === 'professor_access' && (
            <div className="mt-5 space-y-4">
              {loadingProfessors ? (
                <div className="py-10 flex items-center justify-center text-slate-400 gap-2 text-xs">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>در حال بارگذاری اساتید...</span>
                </div>
              ) : professors.length === 0 ? (
                <div className="py-10 text-center text-xs text-slate-400 bg-slate-900/50 rounded-2xl border border-slate-800 space-y-3">
                  <p>هنوز هیچ استادی ثبت نشده است.</p>
                  <button
                    type="button"
                    onClick={() => setActiveModal('professor_register')}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    ثبت نام استاد جدید
                  </button>
                </div>
              ) : (
                <div className="space-y-2 sm:space-y-3">
                  {professors.map((prof) => {
                    const currentDraft = accessDrafts[prof.id] || prof.accessLevel || 'view';
                    return (
                      <div
                        key={prof.id}
                        className="p-[12px] sm:p-4 bg-slate-900/80 border border-slate-800 rounded-xl sm:rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-bold text-white">
                              {prof.firstName} {prof.lastName}
                            </span>
                            <span className="px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[11px] font-semibold">
                              {prof.academicRank}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-1">
                            کد ملی: {prof.nationalId} • گروه: {prof.groupName || 'بدون گروه'}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                          <select
                            aria-label={`سطح دسترسی ${prof.firstName} ${prof.lastName}`}
                            value={currentDraft}
                            onChange={(e) =>
                              setAccessDrafts((prev) => ({
                                ...prev,
                                [prof.id]: e.target.value as ProfessorAccessLevel,
                              }))
                            }
                            className="flex-1 sm:flex-none min-w-0 bg-slate-900 border border-slate-700 focus:border-indigo-500 rounded-xl px-2.5 sm:px-3 py-2 text-xs text-white focus:outline-none transition-colors"
                          >
                            {ACCESS_LEVEL_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>

                          <button
                            type="button"
                            disabled={savingAccessId === prof.id}
                            onClick={() => handleSaveAccess(prof)}
                            className="px-3 sm:px-3.5 py-2 bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/20 flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
                          >
                            {savingAccessId === prof.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Save className="w-3.5 h-3.5" />
                            )}
                            <span>ذخیره</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* 4) PROFESSOR THESES MODAL */}
          {activeModal === 'professor_theses' && (
            <div className="mt-5 space-y-5">
              {loadingProfessors ? (
                <div className="py-10 flex items-center justify-center text-slate-400 gap-2 text-xs">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>در حال بارگذاری لیست اساتید...</span>
                </div>
              ) : professors.length === 0 ? (
                <div className="py-10 text-center text-xs text-slate-400 bg-slate-900/50 rounded-2xl border border-slate-800 space-y-3">
                  <p>هنوز هیچ استادی ثبت نشده است.</p>
                  <button
                    type="button"
                    onClick={() => setActiveModal('professor_register')}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    ثبت نام استاد جدید
                  </button>
                </div>
              ) : (
                <>
                  <div className="p-[12px] sm:p-4 bg-slate-900/70 rounded-xl sm:rounded-2xl border border-slate-800">
                    <label className="text-[11px] sm:text-xs font-semibold text-slate-300 block mb-1 sm:mb-1.5">
                      انتخاب استاد
                    </label>
                    <select
                      value={selectedThesisProfId}
                      onChange={(e) => setSelectedThesisProfId(e.target.value)}
                      className="w-full bg-slate-900/90 border border-slate-700 focus:border-indigo-500 rounded-xl px-3 py-2 sm:px-3.5 sm:py-2.5 text-sm text-white focus:outline-none transition-colors"
                    >
                      {professors.map((prof) => (
                        <option key={prof.id} value={prof.id}>
                          {prof.firstName} {prof.lastName} ({prof.academicRank})
                        </option>
                      ))}
                    </select>
                  </div>

                  {loadingTheses ? (
                    <div className="py-10 flex items-center justify-center text-slate-400 gap-2 text-xs">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>در حال دریافت پایان‌نامه‌های استاد...</span>
                    </div>
                  ) : theses.length === 0 ? (
                    <div className="py-10 flex flex-col items-center justify-center text-center space-y-2 bg-slate-900/50 rounded-xl sm:rounded-2xl border border-slate-800">
                      <UserCheck className="w-7 h-7 text-indigo-400/80" />
                      <p className="text-sm font-semibold text-slate-300">
                        پایان‌نامه‌ای ثبت نشده
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2 sm:space-y-2.5">
                      {theses.map((thesis) => (
                        <div
                          key={thesis.id}
                          className="p-[12px] sm:p-4 bg-slate-900/80 border border-slate-800 rounded-xl sm:rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                        >
                          <div>
                            <h4 className="text-sm font-bold text-white">{thesis.title}</h4>
                            <p className="text-xs text-slate-400 mt-1">
                              دانشجو: {thesis.studentName}
                            </p>
                          </div>
                          <span className="px-2.5 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-[11px] font-semibold self-start sm:self-center">
                            {THESIS_ROLE_LABELS[thesis.role] || thesis.role}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

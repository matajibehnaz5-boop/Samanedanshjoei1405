import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  FileText,
  Users,
  CalendarDays,
  UserCog,
  X,
  Search,
  Plus,
  Trash2,
  Loader2,
  Check,
  Save,
  KeyRound,
  Copy,
  AlertTriangle,
  MapPin,
  Clock,
  Calendar,
  UserCheck,
  GraduationCap,
} from 'lucide-react';
import { useDashboard } from '../../context/DashboardContext';
import {
  api,
  type Thesis,
  type ThesisStatus,
  type Student,
  type Professor,
  type ProfessorCapacityItem,
  type DefenseSession,
  type DefenseSessionStatus,
  type AdminUserItem,
} from '../../lib/api';

function normalizeDigits(str: string): string {
  return str
    .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));
}

function isValidDefenseDate(raw: string): boolean {
  const cleaned = normalizeDigits(raw.trim()).replace(/-/g, '/');
  const match = /^(\d{4})\/(\d{1,2})\/(\d{1,2})$/.exec(cleaned);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return false;
  if (year >= 1300 && year <= 1500) {
    if (month >= 7 && day > 30) return false;
    if (month === 12 && day > 30) return false;
    return true;
  }
  if (year >= 2000 && year <= 2100) {
    const dt = new Date(Date.UTC(year, month - 1, day));
    return (
      dt.getUTCFullYear() === year &&
      dt.getUTCMonth() === month - 1 &&
      dt.getUTCDate() === day
    );
  }
  return false;
}

function isValidDefenseTime(raw: string): boolean {
  const cleaned = normalizeDigits(raw.trim());
  const match = /^(\d{1,2}):(\d{2})$/.exec(cleaned);
  if (!match) return false;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  return hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59;
}

const THESIS_STATUS_OPTIONS: ThesisStatus[] = ['در حال انجام', 'تأیید شده', 'دفاع شده'];
const DEFENSE_STATUS_OPTIONS: DefenseSessionStatus[] = ['برنامه‌ریزی‌شده', 'برگزار شد', 'لغو'];

export const AdminManagementModals: React.FC = () => {
  const { activeModal, closeModal, showToast, studentProfile } = useDashboard();

  const isUsersModal = activeModal === 'admin_users' || activeModal === 'users_manage';
  const isTargetModal =
    activeModal === 'thesis_list' ||
    activeModal === 'professor_capacity' ||
    activeModal === 'defense_sessions' ||
    isUsersModal;

  // --- 1. Thesis List State ---
  const [theses, setTheses] = useState<Thesis[]>([]);
  const [loadingTheses, setLoadingTheses] = useState(false);
  const [thesisSearch, setThesisSearch] = useState('');
  const [thesisStatusFilter, setThesisStatusFilter] = useState<string>('');
  const [showNewThesisForm, setShowNewThesisForm] = useState(false);
  const [newThesisTitle, setNewThesisTitle] = useState('');
  const [newThesisStudentId, setNewThesisStudentId] = useState('');
  const [newThesisSupervisorId, setNewThesisSupervisorId] = useState('');
  const [newThesisStatus, setNewThesisStatus] = useState<ThesisStatus>('در حال انجام');
  const [submittingThesis, setSubmittingThesis] = useState(false);
  const [confirmDeleteThesisId, setConfirmDeleteThesisId] = useState<string | null>(null);
  const [deletingThesisId, setDeletingThesisId] = useState<string | null>(null);

  // Shared Students & Professors lists for forms
  const [students, setStudents] = useState<Student[]>([]);
  const [professors, setProfessors] = useState<Professor[]>([]);

  // --- 2. Professor Capacity State ---
  const [capacityList, setCapacityList] = useState<ProfessorCapacityItem[]>([]);
  const [loadingCapacity, setLoadingCapacity] = useState(false);
  const [capacitySearch, setCapacitySearch] = useState('');
  const [capacityDrafts, setCapacityDrafts] = useState<Record<string, string>>({});
  const [savingCapacityId, setSavingCapacityId] = useState<string | null>(null);

  // --- 3. Defense Sessions State ---
  const [defenseSessions, setDefenseSessions] = useState<DefenseSession[]>([]);
  const [loadingDefense, setLoadingDefense] = useState(false);
  const [defenseStatusFilter, setDefenseStatusFilter] = useState<string>('');
  const [showNewDefenseForm, setShowNewDefenseForm] = useState(false);
  const [newDefenseThesisId, setNewDefenseThesisId] = useState('');
  const [newDefenseDate, setNewDefenseDate] = useState('');
  const [newDefenseTime, setNewDefenseTime] = useState('');
  const [newDefenseLocation, setNewDefenseLocation] = useState('');
  const [newDefenseRefereeId, setNewDefenseRefereeId] = useState('');
  const [submittingDefense, setSubmittingDefense] = useState(false);
  const [updatingDefenseId, setUpdatingDefenseId] = useState<string | null>(null);
  const [confirmDeleteDefenseId, setConfirmDeleteDefenseId] = useState<string | null>(null);
  const [deletingDefenseId, setDeletingDefenseId] = useState<string | null>(null);

  // --- 4. Admin Users State ---
  const [adminUsers, setAdminUsers] = useState<AdminUserItem[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [resettingUserId, setResettingUserId] = useState<string | null>(null);
  const [issuedTempPassword, setIssuedTempPassword] = useState<{
    userName: string;
    userEmail: string;
    password: string;
  } | null>(null);

  // Fetchers
  const fetchThesesData = useCallback(async () => {
    setLoadingTheses(true);
    try {
      const [thesesRes, studentsRes, professorsRes] = await Promise.all([
        api.getTheses(),
        api.getStudents(),
        api.getProfessors(),
      ]);
      setTheses(Array.isArray(thesesRes?.theses) ? thesesRes.theses : []);
      setStudents(Array.isArray(studentsRes?.students) ? studentsRes.students : []);
      setProfessors(Array.isArray(professorsRes?.professors) ? professorsRes.professors : []);
    } catch (err: any) {
      showToast(err?.message || 'خطا در دریافت لیست پایان‌نامه‌ها');
    } finally {
      setLoadingTheses(false);
    }
  }, [showToast]);

  const fetchCapacityData = useCallback(async () => {
    setLoadingCapacity(true);
    try {
      const res = await api.getProfessorsCapacity();
      const list = Array.isArray(res?.professors) ? res.professors : [];
      setCapacityList(list);
      const drafts: Record<string, string> = {};
      for (const item of list) {
        drafts[item.id] = String(item.totalCapacity);
      }
      setCapacityDrafts(drafts);
    } catch (err: any) {
      showToast(err?.message || 'خطا در دریافت ظرفیت اساتید');
    } finally {
      setLoadingCapacity(false);
    }
  }, [showToast]);

  const fetchDefenseData = useCallback(async () => {
    setLoadingDefense(true);
    try {
      const [sessionsRes, thesesRes, professorsRes] = await Promise.all([
        api.getDefenseSessions(),
        api.getTheses(),
        api.getProfessors(),
      ]);
      setDefenseSessions(Array.isArray(sessionsRes?.sessions) ? sessionsRes.sessions : []);
      setTheses(Array.isArray(thesesRes?.theses) ? thesesRes.theses : []);
      setProfessors(Array.isArray(professorsRes?.professors) ? professorsRes.professors : []);
    } catch (err: any) {
      showToast(err?.message || 'خطا در دریافت جلسات دفاع');
    } finally {
      setLoadingDefense(false);
    }
  }, [showToast]);

  const fetchUsersData = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const res = await api.getAdminUsers();
      setAdminUsers(Array.isArray(res?.users) ? res.users : []);
    } catch (err: any) {
      showToast(err?.message || 'خطا در دریافت لیست کاربران');
    } finally {
      setLoadingUsers(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (!isTargetModal || studentProfile.role !== 'admin') {
      setIssuedTempPassword(null);
      return;
    }

    setConfirmDeleteThesisId(null);
    setConfirmDeleteDefenseId(null);
    setShowNewThesisForm(false);
    setShowNewDefenseForm(false);

    if (activeModal === 'thesis_list') {
      fetchThesesData();
    } else if (activeModal === 'professor_capacity') {
      fetchCapacityData();
    } else if (activeModal === 'defense_sessions') {
      fetchDefenseData();
    } else if (isUsersModal) {
      setIssuedTempPassword(null);
      fetchUsersData();
    }
  }, [
    activeModal,
    isTargetModal,
    isUsersModal,
    studentProfile.role,
    fetchThesesData,
    fetchCapacityData,
    fetchDefenseData,
    fetchUsersData,
  ]);

  // Filtered lists
  const filteredTheses = useMemo(() => {
    const q = normalizeDigits(thesisSearch.trim().toLowerCase());
    return theses.filter((item) => {
      if (thesisStatusFilter && item.status !== thesisStatusFilter) return false;
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        item.studentName.toLowerCase().includes(q) ||
        item.supervisorName.toLowerCase().includes(q)
      );
    });
  }, [theses, thesisSearch, thesisStatusFilter]);

  const filteredCapacityList = useMemo(() => {
    const q = normalizeDigits(capacitySearch.trim().toLowerCase());
    if (!q) return capacityList;
    return capacityList.filter((item) => {
      const fullName = `${item.firstName} ${item.lastName}`.toLowerCase();
      return (
        fullName.includes(q) ||
        (item.academicRank || '').toLowerCase().includes(q) ||
        (item.groupName || '').toLowerCase().includes(q)
      );
    });
  }, [capacityList, capacitySearch]);

  const filteredDefenseSessions = useMemo(() => {
    if (!defenseStatusFilter) return defenseSessions;
    return defenseSessions.filter((s) => s.status === defenseStatusFilter);
  }, [defenseSessions, defenseStatusFilter]);

  const filteredUsers = useMemo(() => {
    const q = normalizeDigits(userSearch.trim().toLowerCase());
    if (!q) return adminUsers;
    return adminUsers.filter((u) => {
      const roleLabel = u.role === 'admin' ? 'مدیر ادمین admin' : 'دانشجو student';
      return (
        (u.name || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q) ||
        (u.studentId || '').toLowerCase().includes(q) ||
        roleLabel.includes(q)
      );
    });
  }, [adminUsers, userSearch]);

  if (!isTargetModal || studentProfile.role !== 'admin') {
    return null;
  }

  // --- Handlers: Theses ---
  const handleCreateThesis = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newThesisTitle.trim()) {
      showToast('لطفاً عنوان پایان‌نامه را وارد نمایید.');
      return;
    }

    setSubmittingThesis(true);
    try {
      const res = await api.addThesis({
        title: newThesisTitle.trim(),
        studentId: newThesisStudentId || null,
        supervisorId: newThesisSupervisorId || null,
        status: newThesisStatus,
      });
      setTheses((prev) => [res.thesis, ...prev]);
      setNewThesisTitle('');
      setNewThesisStudentId('');
      setNewThesisSupervisorId('');
      setNewThesisStatus('در حال انجام');
      setShowNewThesisForm(false);
      showToast(res.message || 'پایان‌نامه با موفقیت ثبت شد.');
    } catch (err: any) {
      showToast(err?.message || 'خطا در ثبت پایان‌نامه');
    } finally {
      setSubmittingThesis(false);
    }
  };

  const handleDeleteThesis = async (id: string) => {
    setDeletingThesisId(id);
    try {
      const res = await api.deleteThesis(id);
      setTheses((prev) => prev.filter((item) => item.id !== id));
      setConfirmDeleteThesisId(null);
      showToast(res.message || 'پایان‌نامه با موفقیت حذف شد.');
    } catch (err: any) {
      showToast(err?.message || 'خطا در حذف پایان‌نامه');
    } finally {
      setDeletingThesisId(null);
    }
  };

  // --- Handlers: Professor Capacity ---
  const handleSaveCapacity = async (prof: ProfessorCapacityItem) => {
    const raw = normalizeDigits((capacityDrafts[prof.id] ?? '').trim());
    if (raw === '') {
      showToast('لطفاً مقدار ظرفیت را وارد نمایید.');
      return;
    }
    const parsed = Number(raw);
    if (!Number.isInteger(parsed) || parsed < 0 || parsed > 50) {
      showToast('ظرفیت استاد باید یک عدد صحیح بین ۰ تا ۵۰ باشد.');
      return;
    }

    setSavingCapacityId(prof.id);
    try {
      const res = await api.updateProfessorCapacity(prof.id, parsed);
      setCapacityList((prev) =>
        prev.map((item) => (item.id === prof.id ? res.professor : item))
      );
      setCapacityDrafts((prev) => ({
        ...prev,
        [prof.id]: String(res.professor.totalCapacity),
      }));
      showToast(res.message || 'ظرفیت استاد با موفقیت به‌روزرسانی شد.');
    } catch (err: any) {
      showToast(err?.message || 'خطا در به‌روزرسانی ظرفیت استاد');
    } finally {
      setSavingCapacityId(null);
    }
  };

  // --- Handlers: Defense Sessions ---
  const handleCreateDefenseSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDefenseThesisId) {
      showToast('لطفاً پایان‌نامه را انتخاب نمایید.');
      return;
    }
    if (!isValidDefenseDate(newDefenseDate)) {
      showToast('فرمت تاریخ معتبر نیست (مثال: 1405/09/15 یا 2026-12-05).');
      return;
    }
    if (!isValidDefenseTime(newDefenseTime)) {
      showToast('فرمت ساعت معتبر نیست (مثال: 14:30).');
      return;
    }
    if (!newDefenseLocation.trim()) {
      showToast('لطفاً مکان جلسه دفاع را وارد نمایید.');
      return;
    }

    setSubmittingDefense(true);
    try {
      const res = await api.addDefenseSession({
        thesisId: newDefenseThesisId,
        date: newDefenseDate.trim(),
        time: newDefenseTime.trim(),
        location: newDefenseLocation.trim(),
        refereeId: newDefenseRefereeId || null,
      });
      setDefenseSessions((prev) => [res.session, ...prev]);
      setNewDefenseThesisId('');
      setNewDefenseDate('');
      setNewDefenseTime('');
      setNewDefenseLocation('');
      setNewDefenseRefereeId('');
      setShowNewDefenseForm(false);
      showToast(res.message || 'جلسه دفاع با موفقیت ثبت شد.');
    } catch (err: any) {
      showToast(err?.message || 'خطا در ثبت جلسه دفاع');
    } finally {
      setSubmittingDefense(false);
    }
  };

  const handleUpdateDefenseStatus = async (sessionId: string, nextStatus: DefenseSessionStatus) => {
    setUpdatingDefenseId(sessionId);
    try {
      const res = await api.updateDefenseSession(sessionId, { status: nextStatus });
      setDefenseSessions((prev) =>
        prev.map((item) => (item.id === sessionId ? res.session : item))
      );
      showToast(res.message || 'وضعیت جلسه دفاع به‌روزرسانی شد.');
    } catch (err: any) {
      showToast(err?.message || 'خطا در تغییر وضعیت جلسه دفاع');
    } finally {
      setUpdatingDefenseId(null);
    }
  };

  const handleDeleteDefenseSession = async (id: string) => {
    setDeletingDefenseId(id);
    try {
      const res = await api.deleteDefenseSession(id);
      setDefenseSessions((prev) => prev.filter((item) => item.id !== id));
      setConfirmDeleteDefenseId(null);
      showToast(res.message || 'جلسه دفاع با موفقیت حذف شد.');
    } catch (err: any) {
      showToast(err?.message || 'خطا در حذف جلسه دفاع');
    } finally {
      setDeletingDefenseId(null);
    }
  };

  // --- Handlers: Users Password Reset ---
  const handleResetUserPassword = async (user: AdminUserItem) => {
    if (user.isSelf) {
      showToast('امکان بازنشانی رمز عبور حساب ادمین فعلی از این بخش وجود ندارد.');
      return;
    }
    setResettingUserId(user.id);
    try {
      const res = await api.resetAdminUserPassword(user.id);
      setIssuedTempPassword({
        userName: user.name,
        userEmail: user.email,
        password: res.temporaryPassword,
      });
      setAdminUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, status: 'active' } : u))
      );
      showToast(res.message || 'رمز عبور موقت ایجاد شد.');
    } catch (err: any) {
      showToast(err?.message || 'خطا در بازنشانی رمز عبور کاربر');
    } finally {
      setResettingUserId(null);
    }
  };

  const handleCopyPassword = async (password: string) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(password);
      } else {
        const el = document.createElement('textarea');
        el.value = password;
        el.setAttribute('readonly', '');
        el.style.position = 'absolute';
        el.style.left = '-9999px';
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
      }
      showToast('رمز عبور موقت کپی شد.');
    } catch {
      showToast('کپی خودکار انجام نشد؛ لطفاً رمز را به صورت دستی کپی کنید.');
    }
  };

  const getThesisStatusBadge = (status: ThesisStatus) => {
    switch (status) {
      case 'تأیید شده':
        return 'bg-indigo-500/15 border-indigo-500/30 text-indigo-300';
      case 'دفاع شده':
        return 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300';
      case 'در حال انجام':
      default:
        return 'bg-amber-500/15 border-amber-500/30 text-amber-300';
    }
  };

  const getDefenseStatusBadge = (status: DefenseSessionStatus) => {
    switch (status) {
      case 'برگزار شد':
        return 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300';
      case 'لغو':
        return 'bg-rose-500/15 border-rose-500/30 text-rose-300';
      case 'برنامه‌ریزی‌شده':
      default:
        return 'bg-sky-500/15 border-sky-500/30 text-sky-300';
    }
  };

  const headerConfig =
    activeModal === 'thesis_list'
      ? {
          icon: <FileText className="w-5 h-5 sm:w-6 sm:h-6" />,
          title: 'لیست پایان‌نامه‌ها',
          subtitle: 'مدیریت، جستجو و ثبت پایان‌نامه‌های دانشجویان',
        }
      : activeModal === 'professor_capacity'
      ? {
          icon: <Users className="w-5 h-5 sm:w-6 sm:h-6" />,
          title: 'ظرفیت اساتید',
          subtitle: 'پایش و ویرایش ظرفیت راهنمایی پایان‌نامه اساتید',
        }
      : activeModal === 'defense_sessions'
      ? {
          icon: <CalendarDays className="w-5 h-5 sm:w-6 sm:h-6" />,
          title: 'جلسات دفاع',
          subtitle: 'زمان‌بندی، وضعیت و داوران جلسات دفاع',
        }
      : {
          icon: <UserCog className="w-5 h-5 sm:w-6 sm:h-6" />,
          title: 'کاربران',
          subtitle: 'مشاهده حساب‌های کاربری و صدور رمز عبور موقت',
        };

  return (
    <AnimatePresence>
      <div
        dir="rtl"
        data-modal-backdrop
        onClick={(e) => {
          if (e.target === e.currentTarget) closeModal();
        }}
        className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-sm"
      >
        <motion.div
          role="dialog"
          aria-modal="true"
          data-modal-panel
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          className="w-full max-w-2xl bg-[#1E293B] border border-slate-700/80 rounded-xl sm:rounded-[28px] shadow-2xl text-slate-100 flex flex-col max-h-[calc(var(--vvh,100dvh)-16px)] max-w-[calc(100vw-16px)] overflow-hidden"
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between gap-2 px-[12px] pt-[12px] pb-3 sm:px-6 sm:pt-6 sm:pb-4 border-b border-slate-700/60 shrink-0">
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              <div className="p-2 sm:p-2.5 bg-indigo-600/20 text-indigo-400 rounded-xl border border-indigo-500/30 shrink-0">
                {headerConfig.icon}
              </div>
              <div className="min-w-0">
                <h2 className="text-[15px] sm:text-lg font-bold text-slate-100 truncate">
                  {headerConfig.title}
                </h2>
                <p className="text-[11px] sm:text-xs text-slate-400 truncate">
                  {headerConfig.subtitle}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={closeModal}
              aria-label="بستن"
              className="p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-[12px] pb-[12px] sm:px-6 sm:pb-6">
          {/* ================= 1) THESIS LIST ================= */}
          {activeModal === 'thesis_list' && (
            <div className="mt-3 sm:mt-5 space-y-3 sm:space-y-4">
              {/* Search + Filter + New */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div className="relative flex-1 min-w-0">
                  <input
                    type="text"
                    value={thesisSearch}
                    onChange={(e) => setThesisSearch(e.target.value)}
                    placeholder="جستجو در عنوان، دانشجو یا استاد..."
                    className="w-full bg-slate-900/90 border border-slate-700 focus:border-indigo-500 rounded-xl px-3 py-2 pr-9 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none transition-colors"
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <select
                    aria-label="فیلتر وضعیت پایان‌نامه"
                    value={thesisStatusFilter}
                    onChange={(e) => setThesisStatusFilter(e.target.value)}
                    className="flex-1 sm:flex-none bg-slate-900/90 border border-slate-700 focus:border-indigo-500 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none transition-colors"
                  >
                    <option value="">همه وضعیت‌ها</option>
                    {THESIS_STATUS_OPTIONS.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={() => setShowNewThesisForm((prev) => !prev)}
                    className="px-3.5 py-2 bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ جدید</span>
                  </button>
                </div>
              </div>

              {/* Add Thesis Form */}
              {showNewThesisForm && (
                <form
                  onSubmit={handleCreateThesis}
                  className="p-[12px] sm:p-4 bg-slate-900/75 border border-indigo-500/30 rounded-xl sm:rounded-2xl space-y-3"
                >
                  <h3 className="text-xs sm:text-sm font-bold text-indigo-300">
                    ثبت پایان‌نامه جدید
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                    <div className="sm:col-span-2">
                      <label className="text-[11px] sm:text-xs font-semibold text-slate-300 block mb-1">
                        عنوان پایان‌نامه *
                      </label>
                      <input
                        type="text"
                        value={newThesisTitle}
                        onChange={(e) => setNewThesisTitle(e.target.value)}
                        placeholder="مثال: بهینه‌سازی شبکه‌های عصبی در پردازش تصویر"
                        className="w-full bg-slate-900 border border-slate-700 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] sm:text-xs font-semibold text-slate-300 block mb-1">
                        دانشجو
                      </label>
                      <select
                        value={newThesisStudentId}
                        onChange={(e) => setNewThesisStudentId(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                      >
                        <option value="">انتخاب دانشجو...</option>
                        {students.map((st) => (
                          <option key={st.id} value={st.id}>
                            {st.firstName} {st.lastName} ({st.studentNumber})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] sm:text-xs font-semibold text-slate-300 block mb-1">
                        استاد راهنما
                      </label>
                      <select
                        value={newThesisSupervisorId}
                        onChange={(e) => setNewThesisSupervisorId(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                      >
                        <option value="">انتخاب استاد راهنما...</option>
                        {professors.map((pr) => (
                          <option key={pr.id} value={pr.id}>
                            {pr.firstName} {pr.lastName} ({pr.academicRank})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-[11px] sm:text-xs font-semibold text-slate-300 block mb-1">
                        وضعیت
                      </label>
                      <select
                        value={newThesisStatus}
                        onChange={(e) => setNewThesisStatus(e.target.value as ThesisStatus)}
                        className="w-full bg-slate-900 border border-slate-700 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                      >
                        {THESIS_STATUS_OPTIONS.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowNewThesisForm(false)}
                      className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                    >
                      انصراف
                    </button>
                    <button
                      type="submit"
                      disabled={submittingThesis}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {submittingThesis ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Check className="w-3.5 h-3.5" />
                      )}
                      <span>ثبت پایان‌نامه</span>
                    </button>
                  </div>
                </form>
              )}

              {/* Theses List */}
              {loadingTheses ? (
                <div className="py-10 flex items-center justify-center text-slate-400 gap-2 text-xs">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>در حال بارگذاری پایان‌نامه‌ها...</span>
                </div>
              ) : filteredTheses.length === 0 ? (
                <div className="py-10 text-center text-xs text-slate-400 bg-slate-900/50 rounded-xl sm:rounded-2xl border border-slate-800">
                  {theses.length === 0
                    ? 'هنوز پایان‌نامه‌ای ثبت نشده است.'
                    : 'پایان‌نامه‌ای مطابق فیلتر یا جستجو یافت نشد.'}
                </div>
              ) : (
                <div className="space-y-2 sm:space-y-2.5">
                  {filteredTheses.map((item) => (
                    <div
                      key={item.id}
                      className="p-[12px] sm:p-4 bg-slate-900/80 border border-slate-800 rounded-xl sm:rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 min-w-0"
                    >
                      <div className="min-w-0 space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-xs sm:text-sm font-bold text-white break-words">
                            {item.title}
                          </h4>
                          <span
                            className={`px-2 py-0.5 rounded-full border text-[10.5px] font-semibold shrink-0 ${getThesisStatusBadge(
                              item.status
                            )}`}
                          >
                            {item.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 flex-wrap text-[11px] sm:text-xs text-slate-400">
                          <span className="flex items-center gap-1">
                            <GraduationCap className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                            دانشجو: {item.studentName}
                          </span>
                          <span className="flex items-center gap-1">
                            <UserCheck className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                            استاد راهنما: {item.supervisorName}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        {confirmDeleteThesisId === item.id ? (
                          <>
                            <button
                              type="button"
                              disabled={deletingThesisId === item.id}
                              onClick={() => handleDeleteThesis(item.id)}
                              className="px-2.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold transition-colors cursor-pointer disabled:opacity-50"
                            >
                              {deletingThesisId === item.id ? 'در حال حذف...' : 'تأیید حذف'}
                            </button>
                            <button
                              type="button"
                              disabled={deletingThesisId === item.id}
                              onClick={() => setConfirmDeleteThesisId(null)}
                              className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium transition-colors cursor-pointer"
                            >
                              لغو
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteThesisId(item.id)}
                            className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 text-rose-400 transition-colors cursor-pointer"
                            title="حذف پایان‌نامه"
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

          {/* ================= 2) PROFESSOR CAPACITY ================= */}
          {activeModal === 'professor_capacity' && (
            <div className="mt-3 sm:mt-5 space-y-3 sm:space-y-4">
              <div className="relative">
                <input
                  type="text"
                  value={capacitySearch}
                  onChange={(e) => setCapacitySearch(e.target.value)}
                  placeholder="جستجو بر اساس نام استاد، مرتبه علمی یا گروه..."
                  className="w-full bg-slate-900/90 border border-slate-700 focus:border-indigo-500 rounded-xl px-3 py-2 pr-9 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none transition-colors"
                />
                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
              </div>

              {loadingCapacity ? (
                <div className="py-10 flex items-center justify-center text-slate-400 gap-2 text-xs">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>در حال بارگذاری ظرفیت اساتید...</span>
                </div>
              ) : filteredCapacityList.length === 0 ? (
                <div className="py-10 text-center text-xs text-slate-400 bg-slate-900/50 rounded-xl sm:rounded-2xl border border-slate-800">
                  {capacityList.length === 0
                    ? 'هنوز استادی ثبت نشده است.'
                    : 'استادی با عبارت جستجو شده یافت نشد.'}
                </div>
              ) : (
                <div className="space-y-2.5">
                  {filteredCapacityList.map((prof) => {
                    const isFull =
                      (prof.totalCapacity > 0 && prof.currentThesesCount >= prof.totalCapacity) ||
                      (prof.totalCapacity === 0 && prof.currentThesesCount > 0);
                    const pct =
                      prof.totalCapacity > 0
                        ? Math.min(100, Math.round((prof.currentThesesCount / prof.totalCapacity) * 100))
                        : prof.currentThesesCount > 0
                        ? 100
                        : 0;

                    return (
                      <div
                        key={prof.id}
                        className={`p-[12px] sm:p-4 bg-slate-900/80 border rounded-xl sm:rounded-2xl space-y-2.5 min-w-0 ${
                          isFull ? 'border-rose-500/40' : 'border-slate-800'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs sm:text-sm font-bold text-white">
                                {prof.firstName} {prof.lastName}
                              </span>
                              <span className="px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10.5px] font-semibold">
                                {prof.academicRank}
                              </span>
                              {isFull && (
                                <span className="px-2 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 text-[10.5px] font-bold">
                                  ظرفیت پر
                                </span>
                              )}
                            </div>
                            {prof.groupName && (
                              <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                                گروه: {prof.groupName}
                              </p>
                            )}
                          </div>

                          {/* Inline Capacity Editor */}
                          <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                            <label className="text-[11px] text-slate-400">ظرفیت:</label>
                            <input
                              type="number"
                              min={0}
                              max={50}
                              aria-label={`ویرایش ظرفیت ${prof.firstName} ${prof.lastName}`}
                              value={capacityDrafts[prof.id] ?? String(prof.totalCapacity)}
                              onChange={(e) =>
                                setCapacityDrafts((prev) => ({
                                  ...prev,
                                  [prof.id]: e.target.value,
                                }))
                              }
                              className="w-16 bg-slate-900 border border-slate-700 focus:border-indigo-500 rounded-lg px-2 py-1 text-xs text-white text-center dir-ltr focus:outline-none"
                            />
                            <button
                              type="button"
                              disabled={savingCapacityId === prof.id}
                              onClick={() => handleSaveCapacity(prof)}
                              className="px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                            >
                              {savingCapacityId === prof.id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Save className="w-3 h-3" />
                              )}
                              <span>ذخیره</span>
                            </button>
                          </div>
                        </div>

                        {/* Stats + Progress Bar */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between flex-wrap gap-2 text-[11px] text-slate-300">
                            <span>ظرفیت کل: {prof.totalCapacity}</span>
                            <span>پایان‌نامه‌های جاری: {prof.currentThesesCount}</span>
                            <span className={isFull ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
                              ظرفیت باقیمانده: {prof.remainingCapacity}
                            </span>
                          </div>
                          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                isFull ? 'bg-rose-500' : 'bg-emerald-500'
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ================= 3) DEFENSE SESSIONS ================= */}
          {activeModal === 'defense_sessions' && (
            <div className="mt-3 sm:mt-5 space-y-3 sm:space-y-4">
              {/* Filter + New Button */}
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <select
                  aria-label="فیلتر وضعیت جلسات دفاع"
                  value={defenseStatusFilter}
                  onChange={(e) => setDefenseStatusFilter(e.target.value)}
                  className="bg-slate-900/90 border border-slate-700 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none transition-colors"
                >
                  <option value="">همه وضعیت‌ها</option>
                  {DEFENSE_STATUS_OPTIONS.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() => setShowNewDefenseForm((prev) => !prev)}
                  className="px-3.5 py-2 bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-600/20 flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ جلسه جدید</span>
                </button>
              </div>

              {/* Add Defense Session Form */}
              {showNewDefenseForm && (
                <form
                  onSubmit={handleCreateDefenseSession}
                  className="p-[12px] sm:p-4 bg-slate-900/75 border border-indigo-500/30 rounded-xl sm:rounded-2xl space-y-3"
                >
                  <h3 className="text-xs sm:text-sm font-bold text-indigo-300">
                    ثبت جلسه دفاع جدید
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                    <div className="sm:col-span-2">
                      <label className="text-[11px] sm:text-xs font-semibold text-slate-300 block mb-1">
                        پایان‌نامه *
                      </label>
                      <select
                        value={newDefenseThesisId}
                        onChange={(e) => setNewDefenseThesisId(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                      >
                        <option value="">انتخاب پایان‌نامه...</option>
                        {theses.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.title} ({t.studentName})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] sm:text-xs font-semibold text-slate-300 block mb-1">
                        تاریخ (مثال: 1405/09/15) *
                      </label>
                      <input
                        type="text"
                        value={newDefenseDate}
                        onChange={(e) => setNewDefenseDate(e.target.value)}
                        placeholder="1405/09/15"
                        className="w-full bg-slate-900 border border-slate-700 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none dir-ltr text-right"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] sm:text-xs font-semibold text-slate-300 block mb-1">
                        ساعت (مثال: 14:30) *
                      </label>
                      <input
                        type="text"
                        value={newDefenseTime}
                        onChange={(e) => setNewDefenseTime(e.target.value)}
                        placeholder="14:30"
                        className="w-full bg-slate-900 border border-slate-700 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none dir-ltr text-right"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] sm:text-xs font-semibold text-slate-300 block mb-1">
                        مکان *
                      </label>
                      <input
                        type="text"
                        value={newDefenseLocation}
                        onChange={(e) => setNewDefenseLocation(e.target.value)}
                        placeholder="سالن دفاع دانشکده فنی"
                        className="w-full bg-slate-900 border border-slate-700 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] sm:text-xs font-semibold text-slate-300 block mb-1">
                        داور (از اساتید)
                      </label>
                      <select
                        value={newDefenseRefereeId}
                        onChange={(e) => setNewDefenseRefereeId(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                      >
                        <option value="">انتخاب داور...</option>
                        {professors.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.firstName} {p.lastName} ({p.academicRank})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowNewDefenseForm(false)}
                      className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                    >
                      انصراف
                    </button>
                    <button
                      type="submit"
                      disabled={submittingDefense}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {submittingDefense ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Check className="w-3.5 h-3.5" />
                      )}
                      <span>ثبت جلسه</span>
                    </button>
                  </div>
                </form>
              )}

              {/* Sessions List */}
              {loadingDefense ? (
                <div className="py-10 flex items-center justify-center text-slate-400 gap-2 text-xs">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>در حال بارگذاری جلسات دفاع...</span>
                </div>
              ) : filteredDefenseSessions.length === 0 ? (
                <div className="py-10 text-center text-xs text-slate-400 bg-slate-900/50 rounded-xl sm:rounded-2xl border border-slate-800">
                  {defenseSessions.length === 0
                    ? 'هنوز جلسه دفاعی ثبت نشده است.'
                    : 'جلسه دفاعی با وضعیت انتخاب‌شده یافت نشد.'}
                </div>
              ) : (
                <div className="space-y-2.5">
                  {filteredDefenseSessions.map((session) => (
                    <div
                      key={session.id}
                      className="p-[12px] sm:p-4 bg-slate-900/80 border border-slate-800 rounded-xl sm:rounded-2xl space-y-2.5 min-w-0"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                        <div className="min-w-0 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-xs sm:text-sm font-bold text-white break-words">
                              {session.thesisTitle}
                            </h4>
                            <span
                              className={`px-2 py-0.5 rounded-full border text-[10.5px] font-semibold shrink-0 ${getDefenseStatusBadge(
                                session.status
                              )}`}
                            >
                              {session.status}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 flex-wrap text-[11px] sm:text-xs text-slate-400">
                            <span>دانشجو: {session.studentName}</span>
                            <span>• داور: {session.refereeName}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-start">
                          <select
                            aria-label={`تغییر وضعیت جلسه ${session.thesisTitle}`}
                            disabled={updatingDefenseId === session.id}
                            value={session.status}
                            onChange={(e) =>
                              handleUpdateDefenseStatus(
                                session.id,
                                e.target.value as DefenseSessionStatus
                              )
                            }
                            className="bg-slate-900 border border-slate-700 focus:border-indigo-500 rounded-lg px-2 py-1 text-[11px] text-white focus:outline-none"
                          >
                            {DEFENSE_STATUS_OPTIONS.map((st) => (
                              <option key={st} value={st}>
                                {st}
                              </option>
                            ))}
                          </select>

                          {confirmDeleteDefenseId === session.id ? (
                            <>
                              <button
                                type="button"
                                disabled={deletingDefenseId === session.id}
                                onClick={() => handleDeleteDefenseSession(session.id)}
                                className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold cursor-pointer disabled:opacity-50"
                              >
                                {deletingDefenseId === session.id ? '...' : 'تأیید'}
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteDefenseId(null)}
                                className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] cursor-pointer"
                              >
                                لغو
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteDefenseId(session.id)}
                              className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 text-rose-400 transition-colors cursor-pointer"
                              title="حذف جلسه"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 flex-wrap text-[11px] text-slate-300 pt-1 border-t border-slate-800/80">
                        <span className="flex items-center gap-1 dir-ltr">
                          <Calendar className="w-3.5 h-3.5 text-sky-400" />
                          {session.date}
                        </span>
                        <span className="flex items-center gap-1 dir-ltr">
                          <Clock className="w-3.5 h-3.5 text-amber-400" />
                          {session.time}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          {session.location}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ================= 4) ADMIN USERS ================= */}
          {isUsersModal && (
            <div className="mt-3 sm:mt-5 space-y-3 sm:space-y-4">
              {/* One-Time Temporary Password Display */}
              {issuedTempPassword && (
                <div className="p-[12px] sm:p-4 rounded-xl sm:rounded-2xl bg-amber-500/10 border border-amber-500/40 space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-bold text-amber-200">
                        رمز عبور موقت برای {issuedTempPassword.userName}
                      </p>
                      <p className="text-[11px] text-amber-300/80 truncate dir-ltr text-right">
                        {issuedTempPassword.userEmail}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIssuedTempPassword(null)}
                      className="p-1 rounded-lg hover:bg-amber-500/20 text-amber-300 cursor-pointer shrink-0"
                      title="بستن"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between gap-2 bg-slate-950/70 border border-amber-500/30 rounded-xl px-3 py-2">
                    <code className="text-sm sm:text-base font-extrabold tracking-widest text-white dir-ltr select-all">
                      {issuedTempPassword.password}
                    </code>
                    <button
                      type="button"
                      onClick={() => handleCopyPassword(issuedTempPassword.password)}
                      className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold flex items-center gap-1.5 cursor-pointer shrink-0 transition-colors"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>کپی</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold text-amber-300">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>این رمز دوباره نمایش داده نمی‌شود</span>
                  </div>
                </div>
              )}

              {/* Search */}
              <div className="relative">
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="جستجو بر اساس نام، ایمیل، شناسه یا نقش..."
                  className="w-full bg-slate-900/90 border border-slate-700 focus:border-indigo-500 rounded-xl px-3 py-2 pr-9 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none transition-colors"
                />
                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
              </div>

              {loadingUsers ? (
                <div className="py-10 flex items-center justify-center text-slate-400 gap-2 text-xs">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>در حال بارگذاری لیست کاربران...</span>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="py-10 text-center text-xs text-slate-400 bg-slate-900/50 rounded-xl sm:rounded-2xl border border-slate-800">
                  {adminUsers.length === 0
                    ? 'حساب کاربری یافت نشد.'
                    : 'کاربری با عبارت جستجو شده یافت نشد.'}
                </div>
              ) : (
                <div className="space-y-2 sm:space-y-2.5">
                  {filteredUsers.map((user) => (
                    <div
                      key={user.id}
                      className="p-[12px] sm:p-4 bg-slate-900/80 border border-slate-800 rounded-xl sm:rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 min-w-0"
                    >
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs sm:text-sm font-bold text-white">
                            {user.name}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full border text-[10.5px] font-semibold ${
                              user.role === 'admin'
                                ? 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                                : 'bg-sky-500/15 border-sky-500/30 text-sky-300'
                            }`}
                          >
                            {user.role === 'admin' ? 'مدیر سیستم' : 'دانشجو'}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full border text-[10.5px] font-semibold ${
                              user.status === 'locked'
                                ? 'bg-rose-500/15 border-rose-500/30 text-rose-300'
                                : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                            }`}
                          >
                            {user.status === 'locked' ? 'قفل‌شده' : 'فعال'}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 flex-wrap text-[11px] text-slate-400">
                          <span className="dir-ltr">شناسه: {user.studentId || '—'}</span>
                          <span className="truncate dir-ltr">• {user.email}</span>
                        </div>
                      </div>

                      <div className="shrink-0 self-end sm:self-center">
                        {user.isSelf ? (
                          <span className="inline-block px-2.5 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-[11px] font-semibold text-slate-400">
                            حساب فعلی شما
                          </span>
                        ) : (
                          <button
                            type="button"
                            disabled={resettingUserId === user.id}
                            onClick={() => handleResetUserPassword(user)}
                            className="px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/35 border border-indigo-500/40 text-indigo-200 text-[11px] font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-colors"
                          >
                            {resettingUserId === user.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <KeyRound className="w-3.5 h-3.5" />
                            )}
                            <span>دریافت رمز عبور</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

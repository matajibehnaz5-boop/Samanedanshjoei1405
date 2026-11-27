import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import * as XLSX from 'xlsx';
import {
  FileSpreadsheet,
  UserPlus,
  UserMinus,
  Search,
  Upload,
  Download,
  X,
  Trash2,
  Check,
  Loader2,
  Phone,
  IdCard,
  Hash,
  AlertCircle,
  CheckCircle2,
  CopyCheck,
} from 'lucide-react';
import { useDashboard } from '../../context/DashboardContext';
import { useFormAutosave } from '../../hooks/useFormAutosave';
import {
  api,
  type EduGroup,
  type EduField,
  type Student,
  type BulkStudentRow,
  type BulkAddStudentsResponse,
} from '../../lib/api';

function normalizeDigits(str: string): string {
  return str
    .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));
}

const MAX_EXCEL_FILE_BYTES = 5 * 1024 * 1024; // 5 MB
const MAX_EXCEL_ROWS = 5000;

function pickCellValue(row: Record<string, any>, candidates: string[]): string {
  const keys = Object.keys(row);
  for (const candidate of candidates) {
    const foundKey = keys.find((k) => k.trim().toLowerCase() === candidate.toLowerCase());
    if (foundKey !== undefined) {
      const val = row[foundKey];
      return val !== undefined && val !== null ? String(val).trim() : '';
    }
  }
  return '';
}

export const StudentAffairsModals: React.FC = () => {
  const { activeModal, closeModal, showToast, studentProfile } = useDashboard();

  const isStudentModal =
    activeModal === 'student_bulk_register' ||
    activeModal === 'student_register' ||
    activeModal === 'student_delete' ||
    activeModal === 'student_search';

  // Shared lookup data for individual register
  const [groups, setGroups] = useState<EduGroup[]>([]);
  const [fields, setFields] = useState<EduField[]>([]);

  const groupedFields = useMemo(() => {
    const bachelor = fields
      .filter((f) => (f.level || 'کارشناسی').trim() === 'کارشناسی')
      .sort((a, b) => a.name.localeCompare(b.name, 'fa'));
    const master = fields
      .filter((f) => (f.level || '').trim() === 'کارشناسی ارشد')
      .sort((a, b) => a.name.localeCompare(b.name, 'fa'));
    const other = fields
      .filter((f) => {
        const lvl = (f.level || '').trim();
        return lvl !== '' && lvl !== 'کارشناسی' && lvl !== 'کارشناسی ارشد';
      })
      .sort((a, b) => a.name.localeCompare(b.name, 'fa'));
    return { bachelor, master, other };
  }, [fields]);

  // 1) Bulk register state
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState('');
  const [parsedRows, setParsedRows] = useState<BulkStudentRow[]>([]);
  const [submittingBulk, setSubmittingBulk] = useState(false);
  const [bulkReport, setBulkReport] = useState<BulkAddStudentsResponse | null>(null);

  // 2) Individual register form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [studentNumber, setStudentNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedFieldId, setSelectedFieldId] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [submittingStudent, setSubmittingStudent] = useState(false);

  const studentDraftValues = useMemo(
    () => ({
      firstName,
      lastName,
      nationalId,
      studentNumber,
      phone,
      selectedFieldId,
      selectedGroupId,
    }),
    [firstName, lastName, nationalId, studentNumber, phone, selectedFieldId, selectedGroupId]
  );

  const { clearDraft: clearStudentDraft } = useFormAutosave({
    formKey: 'student_register',
    isOpen: activeModal === 'student_register' && studentProfile.role === 'admin',
    values: studentDraftValues,
    onRestore: (draft) => {
      if (typeof draft.firstName === 'string') setFirstName(draft.firstName);
      if (typeof draft.lastName === 'string') setLastName(draft.lastName);
      if (typeof draft.nationalId === 'string') setNationalId(draft.nationalId);
      if (typeof draft.studentNumber === 'string') setStudentNumber(draft.studentNumber);
      if (typeof draft.phone === 'string') setPhone(draft.phone);
      if (typeof draft.selectedFieldId === 'string') setSelectedFieldId(draft.selectedFieldId);
      if (typeof draft.selectedGroupId === 'string') setSelectedGroupId(draft.selectedGroupId);
    },
  });

  // 3 & 4) Search & Delete shared state
  const [searchInput, setSearchInput] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchLookups = useCallback(async () => {
    const [grpResult, fldResult] = await Promise.allSettled([
      api.getEduGroups(),
      api.getEduFields(),
    ]);

    if (grpResult.status === 'fulfilled') {
      if (Array.isArray(grpResult.value?.groups)) {
        setGroups(grpResult.value.groups);
      } else {
        setGroups([]);
        showToast('فرمت پاسخ لیست گروه‌های آموزشی نامعتبر است.');
      }
    } else {
      showToast(grpResult.reason?.message || 'خطا در دریافت لیست گروه‌های آموزشی');
    }

    if (fldResult.status === 'fulfilled') {
      if (Array.isArray(fldResult.value?.fields)) {
        setFields(fldResult.value.fields);
      } else {
        setFields([]);
        showToast('فرمت پاسخ لیست رشته‌های تحصیلی نامعتبر است.');
      }
    } else {
      showToast(fldResult.reason?.message || 'خطا در دریافت لیست رشته‌های تحصیلی');
    }
  }, [showToast]);

  const fetchStudents = useCallback(
    async (q: string) => {
      setLoadingStudents(true);
      try {
        const res = await api.getStudents(q);
        setStudents(res.students || []);
      } catch (err: any) {
        showToast(err?.message || 'خطا در دریافت لیست دانشجویان');
      } finally {
        setLoadingStudents(false);
      }
    },
    [showToast]
  );

  // Debounce 300ms for live search/delete
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedQuery(searchInput);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    if (!isStudentModal || studentProfile.role !== 'admin') return;

    setConfirmDeleteId(null);

    if (activeModal === 'student_register') {
      fetchLookups();
    } else if (activeModal === 'student_bulk_register') {
      setBulkReport(null);
    } else if (activeModal === 'student_delete' || activeModal === 'student_search') {
      setSearchInput('');
      setDebouncedQuery('');
      fetchStudents('');
    }
  }, [activeModal, isStudentModal, studentProfile.role, fetchLookups, fetchStudents]);

  useEffect(() => {
    if (
      (activeModal !== 'student_delete' && activeModal !== 'student_search') ||
      studentProfile.role !== 'admin'
    ) {
      return;
    }
    fetchStudents(debouncedQuery);
  }, [activeModal, debouncedQuery, studentProfile.role, fetchStudents]);

  if (!isStudentModal || studentProfile.role !== 'admin') {
    return null;
  }

  const handleDownloadSample = () => {
    const sampleData = [
      ['نام', 'نام خانوادگی', 'کد ملی', 'شماره دانشجویی', 'شماره تماس', 'رشته تحصیلی', 'گروه آموزشی'],
      ['علی', 'محمدی', '0123456789', '401123456', '09123456789', '', ''],
      ['زهرا', 'احمدی', '9876543210', '401123457', '09129876543', '', ''],
    ];
    const worksheet = XLSX.utils.aoa_to_sheet(sampleData);
    worksheet['!cols'] = [
      { wch: 15 },
      { wch: 18 },
      { wch: 14 },
      { wch: 16 },
      { wch: 15 },
      { wch: 20 },
      { wch: 20 },
    ];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'دانشجویان');
    XLSX.writeFile(workbook, 'sample-students.xlsx');
  };

  const processExcelFile = async (file: File) => {
    const lowerName = file.name.toLowerCase();
    if (!lowerName.endsWith('.xlsx') && !lowerName.endsWith('.xls')) {
      showToast('لطفاً فقط فایل اکسل با فرمت .xlsx یا .xls انتخاب کنید.');
      return;
    }

    if (file.size > MAX_EXCEL_FILE_BYTES) {
      showToast('حجم فایل نباید بیشتر از ۵ مگابایت باشد.');
      return;
    }

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      if (!firstSheetName) {
        showToast('فایل اکسل انتخاب‌شده هیچ صفحه‌ای ندارد.');
        return;
      }

      const sheet = workbook.Sheets[firstSheetName];
      const rawJson = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, {
        defval: '',
        raw: false,
      });

      const mappedRows: BulkStudentRow[] = [];
      for (let i = 0; i < rawJson.length; i++) {
        const record = rawJson[i];
        const rowFirstName = pickCellValue(record, ['نام', 'firstName', 'first_name']);
        const rowLastName = pickCellValue(record, ['نام خانوادگی', 'نام‌خانوادگی', 'lastName', 'last_name']);
        const rowNationalId = pickCellValue(record, ['کد ملی', 'کدملی', 'nationalId', 'national_id']);
        const rowStudentNumber = pickCellValue(record, [
          'شماره دانشجویی',
          'شماره‌دانشجویی',
          'studentNumber',
          'student_number',
        ]);
        const rowPhone = pickCellValue(record, ['شماره تماس', 'تلفن', 'شماره تلفن', 'phone']);
        const rowFieldName = pickCellValue(record, ['رشته تحصیلی', 'رشته', 'fieldName', 'field']);
        const rowGroupName = pickCellValue(record, ['گروه آموزشی', 'گروه', 'groupName', 'group']);

        // Skip completely blank lines
        if (
          !rowFirstName &&
          !rowLastName &&
          !rowNationalId &&
          !rowStudentNumber &&
          !rowPhone &&
          !rowFieldName &&
          !rowGroupName
        ) {
          continue;
        }

        mappedRows.push({
          rowNumber: i + 2,
          firstName: rowFirstName,
          lastName: rowLastName,
          nationalId: rowNationalId,
          studentNumber: rowStudentNumber,
          phone: rowPhone,
          fieldName: rowFieldName,
          groupName: rowGroupName,
        });
      }

      if (mappedRows.length === 0) {
        showToast('هیچ ردیف اطلاعاتی در فایل اکسل یافت نشد.');
        return;
      }

      if (mappedRows.length > MAX_EXCEL_ROWS) {
        showToast('حداکثر ۵۰۰۰ ردیف دانشجو در هر فایل مجاز است.');
        return;
      }

      setSelectedFileName(file.name);
      setParsedRows(mappedRows);
      setBulkReport(null);
      showToast(`${mappedRows.length} ردیف از فایل اکسل آماده ثبت است.`);
    } catch {
      showToast('خطا در خواندن فایل اکسل. لطفاً از معتبر بودن فایل اطمینان حاصل کنید.');
    }
  };

  const handleBulkSubmit = async () => {
    if (parsedRows.length === 0) {
      showToast('ابتدا یک فایل اکسل معتبر انتخاب کنید.');
      return;
    }

    setSubmittingBulk(true);
    try {
      const report = await api.bulkAddStudents(parsedRows);
      setBulkReport(report);
      showToast(
        `ثبت گروهی انجام شد: ${report.insertedCount} ثبت‌شده، ${report.duplicateCount} تکراری، ${report.errorCount} خطا`
      );
    } catch (err: any) {
      showToast(err?.message || 'خطا در ثبت گروهی دانشجویان');
    } finally {
      setSubmittingBulk(false);
    }
  };

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      showToast('لطفاً نام و نام خانوادگی دانشجو را وارد نمایید.');
      return;
    }

    const cleanNationalId = normalizeDigits(nationalId.trim());
    if (!/^\d{10}$/.test(cleanNationalId)) {
      showToast('کد ملی باید دقیقاً ۱۰ رقم باشد.');
      return;
    }

    const cleanStudentNumber = normalizeDigits(studentNumber.trim());
    if (!cleanStudentNumber) {
      showToast('لطفاً شماره دانشجویی را وارد نمایید.');
      return;
    }

    setSubmittingStudent(true);
    try {
      await api.addStudent({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        nationalId: cleanNationalId,
        studentNumber: cleanStudentNumber,
        phone: normalizeDigits(phone.trim()) || undefined,
        fieldId: selectedFieldId || null,
        groupId: selectedGroupId || null,
      });

      setFirstName('');
      setLastName('');
      setNationalId('');
      setStudentNumber('');
      setPhone('');
      setSelectedFieldId('');
      setSelectedGroupId('');
      clearStudentDraft();
      showToast('دانشجو جدید با موفقیت ثبت شد.');
    } catch (err: any) {
      showToast(err?.message || 'خطا در ثبت اطلاعات دانشجو');
    } finally {
      setSubmittingStudent(false);
    }
  };

  const handleDeleteStudent = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await api.deleteStudent(id);
      setConfirmDeleteId(null);
      showToast(res.message || 'دانشجو با موفقیت حذف شد.');
      await fetchStudents(debouncedQuery);
    } catch (err: any) {
      showToast(err?.message || 'خطا در حذف دانشجو');
    } finally {
      setDeletingId(null);
    }
  };

  const headerConfig =
    activeModal === 'student_bulk_register'
      ? {
          icon: <FileSpreadsheet className="w-6 h-6" />,
          title: 'ثبت نام اولیه (گروهی)',
          subtitle: 'بارگذاری فایل اکسل برای ثبت گروهی دانشجویان',
        }
      : activeModal === 'student_register'
      ? {
          icon: <UserPlus className="w-6 h-6" />,
          title: 'ثبت نام (انفرادی)',
          subtitle: 'ثبت دستی مشخصات دانشجوی جدید در سامانه',
        }
      : activeModal === 'student_delete'
      ? {
          icon: <UserMinus className="w-6 h-6" />,
          title: 'حذف دانشجو',
          subtitle: 'جستجو و حذف دانشجو با تأیید نهایی',
        }
      : {
          icon: <Search className="w-6 h-6" />,
          title: 'جستجوی دانشجو',
          subtitle: 'جستجوی زنده بر اساس نام، کد ملی، شماره دانشجویی، رشته و گروه',
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

          <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-[12px] pb-[12px] sm:px-6 sm:pb-6">
          {/* 1) BULK REGISTER MODAL */}
          {activeModal === 'student_bulk_register' && (
            <div className="mt-3 sm:mt-5 space-y-3.5 sm:space-y-5 min-w-0">
              <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3">
                <span className="text-xs text-slate-300">
                  فرمت‌های مجاز: <span className="font-bold text-indigo-300">.xlsx / .xls</span> (حداکثر ۵ مگابایت و ۵۰۰۰ ردیف)
                </span>
                <button
                  type="button"
                  onClick={handleDownloadSample}
                  className="px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                >
                  <Download className="w-4 h-4 text-indigo-400" />
                  <span>دانلود فایل نمونه</span>
                </button>
              </div>

              {/* Dropzone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  const file = e.dataTransfer.files?.[0];
                  if (file) {
                    processExcelFile(file);
                  }
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`p-4 sm:p-6 rounded-xl sm:rounded-2xl border-2 border-dashed text-center transition-all cursor-pointer ${
                  isDragging
                    ? 'border-indigo-400 bg-indigo-500/10'
                    : 'border-slate-700 bg-slate-900/60 hover:border-indigo-500/60 hover:bg-slate-900/90'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      processExcelFile(file);
                    }
                    e.target.value = '';
                  }}
                />
                <div className="w-12 h-12 mx-auto rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-3">
                  <Upload className="w-6 h-6" />
                </div>
                <p className="text-sm font-bold text-slate-200">
                  {selectedFileName
                    ? `فایل انتخاب‌شده: ${selectedFileName}`
                    : 'فایل اکسل را اینجا بکشید و رها کنید یا کلیک کنید'}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  ستون‌ها: نام، نام خانوادگی، کد ملی، شماره دانشجویی، شماره تماس، رشته تحصیلی، گروه آموزشی
                </p>
              </div>

              {/* Preview (First 10 rows) */}
              {parsedRows.length > 0 && (
                <div className="space-y-3 min-w-0">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-200">
                        پیش‌نمایش ۱۰ ردیف اول
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-bold">
                        کل ردیف‌ها: {parsedRows.length}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setParsedRows([]);
                        setSelectedFileName('');
                        setBulkReport(null);
                      }}
                      className="text-xs text-rose-400 hover:text-rose-300 cursor-pointer"
                    >
                      پاک کردن فایل
                    </button>
                  </div>

                  <div className="w-full overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/70">
                    <table className="w-full text-right text-xs whitespace-nowrap">
                      <thead className="bg-slate-900 text-slate-300 border-b border-slate-800">
                        <tr>
                          <th className="px-3 py-2.5 font-semibold">ردیف</th>
                          <th className="px-3 py-2.5 font-semibold">نام</th>
                          <th className="px-3 py-2.5 font-semibold">نام خانوادگی</th>
                          <th className="px-3 py-2.5 font-semibold">کد ملی</th>
                          <th className="px-3 py-2.5 font-semibold">شماره دانشجویی</th>
                          <th className="px-3 py-2.5 font-semibold">شماره تماس</th>
                          <th className="px-3 py-2.5 font-semibold">رشته تحصیلی</th>
                          <th className="px-3 py-2.5 font-semibold">گروه آموزشی</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/70 text-slate-200">
                        {parsedRows.slice(0, 10).map((r, idx) => (
                          <tr key={`${r.rowNumber}-${idx}`} className="hover:bg-slate-800/40">
                            <td className="px-3 py-2 text-slate-400">{r.rowNumber ?? idx + 2}</td>
                            <td className="px-3 py-2">{r.firstName || '—'}</td>
                            <td className="px-3 py-2">{r.lastName || '—'}</td>
                            <td className="px-3 py-2">{r.nationalId || '—'}</td>
                            <td className="px-3 py-2">{r.studentNumber || '—'}</td>
                            <td className="px-3 py-2">{r.phone || '—'}</td>
                            <td className="px-3 py-2">{r.fieldName || '—'}</td>
                            <td className="px-3 py-2">{r.groupName || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      disabled={submittingBulk}
                      onClick={handleBulkSubmit}
                      className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {submittingBulk ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4" />
                      )}
                      <span>ثبت نام</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Bulk Report */}
              {bulkReport && (
                <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-between">
                      <span className="text-xs text-emerald-300 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" />
                        تعداد ثبت‌شده
                      </span>
                      <span className="text-sm font-extrabold text-emerald-200">
                        {bulkReport.insertedCount}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-between">
                      <span className="text-xs text-amber-300 flex items-center gap-1.5">
                        <CopyCheck className="w-4 h-4" />
                        تعداد تکراری
                      </span>
                      <span className="text-sm font-extrabold text-amber-200">
                        {bulkReport.duplicateCount}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 flex items-center justify-between">
                      <span className="text-xs text-rose-300 flex items-center gap-1.5">
                        <AlertCircle className="w-4 h-4" />
                        ردیف‌های خطادار
                      </span>
                      <span className="text-sm font-extrabold text-rose-200">
                        {bulkReport.errorCount}
                      </span>
                    </div>
                  </div>

                  {bulkReport.errors.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-rose-300">جزئیات ردیف‌های خطادار:</h4>
                      <div className="max-h-44 overflow-y-auto space-y-1.5 pr-1">
                        {bulkReport.errors.map((err, index) => (
                          <div
                            key={`${err.rowNumber}-${index}`}
                            className="px-3 py-2 rounded-xl bg-rose-950/30 border border-rose-500/20 text-xs text-rose-200 flex items-start gap-2"
                          >
                            <span className="font-bold shrink-0">ردیف {err.rowNumber}:</span>
                            <span className="break-words min-w-0">{err.reason}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 2) INDIVIDUAL REGISTER MODAL */}
          {activeModal === 'student_register' && (
            <form onSubmit={handleCreateStudent} className="mt-3 sm:mt-5 space-y-3 sm:space-y-4">
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
                    شماره دانشجویی *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={studentNumber}
                      onChange={(e) => setStudentNumber(e.target.value)}
                      placeholder="401123456"
                      className="w-full bg-slate-900/90 border border-slate-700 focus:border-indigo-500 rounded-xl px-3 py-2 sm:px-3.5 sm:py-2.5 pr-9 text-sm text-white placeholder-slate-500 focus:outline-none transition-colors dir-ltr text-right"
                    />
                    <Hash className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <div className="sm:col-span-2">
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
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                    رشته تحصیلی (اختیاری)
                  </label>
                  <select
                    value={selectedFieldId}
                    onChange={(e) => setSelectedFieldId(e.target.value)}
                    className="w-full bg-slate-900/90 border border-slate-700 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none transition-colors"
                  >
                    <option value="">انتخاب رشته تحصیلی</option>
                    {groupedFields.bachelor.length > 0 && (
                      <optgroup label="کارشناسی">
                        {groupedFields.bachelor.map((fld) => (
                          <option key={fld.id} value={fld.id}>
                            {fld.name}
                          </option>
                        ))}
                      </optgroup>
                    )}
                    {groupedFields.master.length > 0 && (
                      <optgroup label="کارشناسی ارشد">
                        {groupedFields.master.map((fld) => (
                          <option key={fld.id} value={fld.id}>
                            {fld.name}
                          </option>
                        ))}
                      </optgroup>
                    )}
                    {groupedFields.other.length > 0 && (
                      <optgroup label="سایر مقاطع">
                        {groupedFields.other.map((fld) => (
                          <option key={fld.id} value={fld.id}>
                            {fld.name}
                          </option>
                        ))}
                      </optgroup>
                    )}
                  </select>
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
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end">
                <button
                  type="submit"
                  disabled={submittingStudent}
                  className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {submittingStudent ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  <span>ثبت دانشجو</span>
                </button>
              </div>
            </form>
          )}

          {/* 3) DELETE STUDENT MODAL */}
          {activeModal === 'student_delete' && (
            <div className="mt-3 sm:mt-5 space-y-3 sm:space-y-4 min-w-0">
              <div className="relative">
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="جستجو با نام، کد ملی یا شماره دانشجویی..."
                  className="w-full bg-slate-900/90 border border-slate-700 focus:border-indigo-500 rounded-xl px-3 py-2 sm:px-3.5 sm:py-2.5 pr-9 text-sm text-white placeholder-slate-500 focus:outline-none transition-colors"
                />
                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
              </div>

              {loadingStudents ? (
                <div className="py-10 flex items-center justify-center text-slate-400 gap-2 text-xs">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>در حال جستجو...</span>
                </div>
              ) : students.length === 0 ? (
                <div className="py-10 text-center text-xs text-slate-400 bg-slate-900/50 rounded-xl sm:rounded-2xl border border-slate-800">
                  {debouncedQuery.trim()
                    ? 'دانشجویی با مشخصات جستجو شده یافت نشد.'
                    : 'هنوز دانشجویی ثبت نشده است.'}
                </div>
              ) : (
                <div className="space-y-2 sm:space-y-2.5">
                  {students.map((stu) => (
                    <div
                      key={stu.id}
                      className="p-[12px] sm:p-4 bg-slate-900/80 border border-slate-800 rounded-xl sm:rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3"
                    >
                      <div className="min-w-0 space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold text-white break-words">
                            {stu.firstName} {stu.lastName}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-[11px] font-semibold">
                            شماره دانشجویی: {stu.studentNumber}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 flex-wrap text-xs text-slate-400">
                          <span>کد ملی: {stu.nationalId}</span>
                          {stu.fieldName && <span>• رشته: {stu.fieldName}</span>}
                          {stu.groupName && <span>• گروه: {stu.groupName}</span>}
                          {stu.phone && <span>• تماس: {stu.phone}</span>}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        {confirmDeleteId === stu.id ? (
                          <>
                            <button
                              type="button"
                              disabled={deletingId === stu.id}
                              onClick={() => handleDeleteStudent(stu.id)}
                              className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                            >
                              {deletingId === stu.id ? 'در حال حذف...' : 'تأیید حذف'}
                            </button>
                            <button
                              type="button"
                              disabled={deletingId === stu.id}
                              onClick={() => setConfirmDeleteId(null)}
                              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors cursor-pointer"
                            >
                              لغو
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(stu.id)}
                            className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 text-rose-400 transition-colors cursor-pointer"
                            title="حذف دانشجو"
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

          {/* 4) SEARCH STUDENT MODAL */}
          {activeModal === 'student_search' && (
            <div className="mt-3 sm:mt-5 space-y-3 sm:space-y-4 min-w-0">
              <div className="relative">
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="جستجوی زنده بر اساس نام، کد ملی، شماره دانشجویی، رشته و گروه..."
                  className="w-full bg-slate-900/90 border border-slate-700 focus:border-indigo-500 rounded-xl px-3 py-2 sm:px-3.5 sm:py-2.5 pr-9 text-sm text-white placeholder-slate-500 focus:outline-none transition-colors"
                />
                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
              </div>

              {loadingStudents ? (
                <div className="py-10 flex items-center justify-center text-slate-400 gap-2 text-xs">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>در حال جستجو...</span>
                </div>
              ) : students.length === 0 ? (
                <div className="py-10 text-center text-xs text-slate-400 bg-slate-900/50 rounded-xl sm:rounded-2xl border border-slate-800">
                  {debouncedQuery.trim()
                    ? 'هیچ دانشجویی مطابق جستجوی شما یافت نشد.'
                    : 'هنوز دانشجویی در سامانه ثبت نشده است.'}
                </div>
              ) : (
                <div className="space-y-2 sm:space-y-2.5">
                  {students.map((stu) => (
                    <div
                      key={stu.id}
                      className="p-[12px] sm:p-4 bg-slate-900/80 border border-slate-800 rounded-xl sm:rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3"
                    >
                      <div className="min-w-0 space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold text-white break-words">
                            {stu.firstName} {stu.lastName}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-[11px] font-semibold">
                            شماره دانشجویی: {stu.studentNumber}
                          </span>
                          {stu.fieldName && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[11px] font-semibold">
                              رشته: {stu.fieldName}
                            </span>
                          )}
                          {stu.groupName && (
                            <span className="px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[11px] font-semibold">
                              گروه: {stu.groupName}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 flex-wrap text-xs text-slate-400">
                          <span>کد ملی: {stu.nationalId}</span>
                          {stu.phone && <span>• تماس: {stu.phone}</span>}
                        </div>
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

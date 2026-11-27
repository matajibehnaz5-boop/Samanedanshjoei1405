import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileText, 
  X, 
  PlusCircle, 
  Send, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  Download, 
  RefreshCw, 
  AlertCircle, 
  ChevronRight, 
  CreditCard, 
  Award, 
  BookOpen, 
  GraduationCap,
  Filter,
  Check
} from 'lucide-react';
import { useDashboard } from '../../context/DashboardContext';
import { useFormAutosave } from '../../hooks/useFormAutosave';
import { api } from '../../lib/api';

export interface RequestItem {
  id: string;
  trackingCode: string;
  typeKey: string;
  typeTitleFa: string;
  typeTitleEn: string;
  dateFa: string;
  dateEn: string;
  status: 'pending' | 'approved' | 'rejected';
  currentStep: 1 | 2 | 3; // 1: Submitted, 2: Expert Review, 3: Final Approval
  details?: string;
  courseName?: string;
  rejectionReasonFa?: string;
  rejectionReasonEn?: string;
}

const INITIAL_REQUESTS: RequestItem[] = [
  {
    id: 'req-1',
    trackingCode: 'REQ-9482',
    typeKey: 'enrollment_cert',
    typeTitleFa: 'تأییدیه اشتغال به تحصیل',
    typeTitleEn: 'Enrollment Certificate',
    dateFa: '۱۴۰۵/۰۵/۰۲',
    dateEn: 'Jul 24, 2026',
    status: 'approved',
    currentStep: 3,
    details: 'جهت ارائه به بانک رفاه کارگران شعبه مرکزی'
  },
  {
    id: 'req-2',
    trackingCode: 'REQ-8310',
    typeKey: 'emergency_drop',
    typeTitleFa: 'حذف اضطراری درس',
    typeTitleEn: 'Emergency Course Drop',
    dateFa: '۱۴۰۵/۰۴/۲۸',
    dateEn: 'Jul 19, 2026',
    status: 'pending',
    currentStep: 2,
    courseName: 'ریاضی عمومی ۲',
    details: 'به دلیل عدم امکان حضور در جلسه امتحان پایانی'
  },
  {
    id: 'req-3',
    trackingCode: 'REQ-7104',
    typeKey: 'grade_appeal',
    typeTitleFa: 'تجدیدنظر نمره',
    typeTitleEn: 'Grade Appeal',
    dateFa: '۱۴۰۵/۰۴/۱۵',
    dateEn: 'Jul 6, 2026',
    status: 'rejected',
    currentStep: 2,
    courseName: 'فیزیک پایه ۲',
    details: 'بررسی مجدد برگه امتحان پایان‌ترم سوال ۳ بخش دوم',
    rejectionReasonFa: 'عدم تطابق با کلید تصحیح استاد و بررسی مجدد توسط مدیر گروه آموزشی.',
    rejectionReasonEn: 'Does not match exam answer key upon re-evaluation by department chair.'
  },
  {
    id: 'req-4',
    trackingCode: 'REQ-6209',
    typeKey: 'tuition_loan',
    typeTitleFa: 'درخواست وام شهریه',
    typeTitleEn: 'Tuition Loan Request',
    dateFa: '۱۴۰۵/۰۳/۳۰',
    dateEn: 'Jun 20, 2026',
    status: 'approved',
    currentStep: 3,
    details: 'وام صندوق رفاه دانشجویی نیمسال گذشته'
  },
  {
    id: 'req-5',
    trackingCode: 'REQ-5512',
    typeKey: 'duplicate_card',
    typeTitleFa: 'صدور کارت دانشجویی المثنی',
    typeTitleEn: 'Duplicate Student ID Card',
    dateFa: '۱۴۰۵/۰۳/۱۲',
    dateEn: 'Jun 2, 2026',
    status: 'pending',
    currentStep: 1,
    details: 'مفقودی کارت قبلی در پردیس دانشگاه'
  }
];

const SAMPLE_COURSES = [
  { id: 'c1', nameFa: 'ساختمان داده‌ها', nameEn: 'Data Structures', currentGrade: '۱۷.۵' },
  { id: 'c2', nameFa: 'طراحی پایگاه داده', nameEn: 'Database Design', currentGrade: '۱۶.۰' },
  { id: 'c3', nameFa: 'شبکه‌های کامپیوتر', nameEn: 'Computer Networks', currentGrade: '۱۴.۵' },
  { id: 'c4', nameFa: 'معادلات دیفرانسیل', nameEn: 'Differential Equations', currentGrade: '۱۲.۰' },
];

export const RequestsModal: React.FC = () => {
  const { activeModal, closeModal, showToast, language, t, isLoggedIn } = useDashboard();
  const isFa = language === 'fa';

  const [requestsList, setRequestsList] = useState<RequestItem[]>(INITIAL_REQUESTS);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  // Form State
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [detailsText, setDetailsText] = useState<string>('');

  const requestDraftValues = useMemo(
    () => ({
      selectedType,
      selectedCourseId,
      detailsText,
    }),
    [selectedType, selectedCourseId, detailsText]
  );

  const { clearDraft: clearRequestDraft } = useFormAutosave({
    formKey: 'student_requests',
    isOpen: activeModal === 'student_requests',
    values: requestDraftValues,
    onRestore: (draft) => {
      if (typeof draft.selectedType === 'string') setSelectedType(draft.selectedType);
      if (typeof draft.selectedCourseId === 'string') setSelectedCourseId(draft.selectedCourseId);
      if (typeof draft.detailsText === 'string') setDetailsText(draft.detailsText);
    },
  });

  if (activeModal !== 'student_requests') return null;

  const handleSelectTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedType(e.target.value);
    setSelectedCourseId('');
  };

  const handleSubmitNewRequest = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedType) {
      showToast(t('fillRequiredErrorToast'));
      return;
    }

    if ((selectedType === 'emergency_drop' || selectedType === 'grade_appeal') && !selectedCourseId) {
      showToast(t('fillRequiredErrorToast'));
      return;
    }

    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const trackingCode = `REQ-${randomNum}`;

    let titleFa = '';
    let titleEn = '';

    switch (selectedType) {
      case 'enrollment_cert':
        titleFa = t('reqEnrollmentCert');
        titleEn = 'Enrollment Certificate';
        break;
      case 'academic_leave':
        titleFa = t('reqAcademicLeave');
        titleEn = 'Academic Leave';
        break;
      case 'emergency_drop':
        titleFa = t('reqEmergencyDrop');
        titleEn = 'Emergency Course Drop';
        break;
      case 'grade_appeal':
        titleFa = t('reqGradeAppeal');
        titleEn = 'Grade Appeal';
        break;
      case 'duplicate_card':
        titleFa = t('reqDuplicateCard');
        titleEn = 'Duplicate Student ID Card';
        break;
      case 'tuition_loan':
        titleFa = t('reqTuitionLoan');
        titleEn = 'Tuition Loan Request';
        break;
      default:
        titleFa = t('requests');
        titleEn = 'Student Request';
    }

    const selectedCourseObj = SAMPLE_COURSES.find(c => c.id === selectedCourseId);

    const newReq: RequestItem = {
      id: `req-${Date.now()}`,
      trackingCode,
      typeKey: selectedType,
      typeTitleFa: titleFa,
      typeTitleEn: titleEn,
      dateFa: '۱۴۰۵/۰۵/۰۵',
      dateEn: 'Jul 27, 2026',
      status: 'pending',
      currentStep: 1,
      details: detailsText,
      courseName: selectedCourseObj ? (isFa ? selectedCourseObj.nameFa : selectedCourseObj.nameEn) : undefined
    };

    if (isLoggedIn) {
      void api
        .submitStudentRequest({
          trackingCode,
          typeTitle: titleFa,
          courseName: selectedCourseObj?.nameFa,
          details: detailsText.trim() || undefined,
        })
        .catch(() => {});
    }

    setRequestsList([newReq, ...requestsList]);
    setSelectedType('');
    setSelectedCourseId('');
    setDetailsText('');
    clearRequestDraft();

    showToast(t('requestSuccessToast', { code: trackingCode }));
  };

  const handleDownloadDoc = () => {
    showToast(t('downloadingDocToast'));
  };

  const filteredRequests = useMemo(() => {
    return requestsList.filter(req => {
      if (filter === 'pending') return req.status === 'pending';
      if (filter === 'approved') return req.status === 'approved';
      if (filter === 'rejected') return req.status === 'rejected';
      return true;
    });
  }, [requestsList, filter]);

  const selectedCourseObj = SAMPLE_COURSES.find(c => c.id === selectedCourseId);

  return (
    <AnimatePresence>
      <div
        dir={isFa ? 'rtl' : 'ltr'}
        data-modal-backdrop
        onClick={(e) => {
          if (e.target === e.currentTarget) closeModal();
        }}
        className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md"
      >
        <motion.div
          role="dialog"
          aria-modal="true"
          data-modal-panel
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="w-full max-w-3xl bg-[#1E293B] border border-slate-700/80 rounded-[28px] shadow-2xl text-slate-100 flex flex-col max-h-[calc(var(--vvh,100dvh)-16px)] max-w-[calc(100vw-16px)] overflow-hidden"
          dir={isFa ? 'rtl' : 'ltr'}
        >
          {/* Header */}
          <div className="p-5 sm:p-6 border-b border-white/[0.08] bg-[#172030] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-tr from-sky-500/20 to-emerald-500/20 text-sky-400 rounded-2xl border border-sky-500/30 shadow-md">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-extrabold text-white">
                  {t('studentRequestsTitle')}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {t('studentRequestsSub')}
                </p>
              </div>
            </div>

            <button
              onClick={closeModal}
              className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Scrollable Body */}
          <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-4 sm:p-6 space-y-6">

            {/* 1. Submit New Request Card Form */}
            <div className="p-4 sm:p-5 bg-[#151D2A] border border-sky-500/20 rounded-2xl space-y-4 shadow-lg">
              <div className="flex items-center gap-2 text-xs font-bold text-sky-400 uppercase tracking-wider">
                <PlusCircle className="w-4 h-4 text-sky-400" />
                <span>{t('newRequestSection')}</span>
              </div>

              <form onSubmit={handleSubmitNewRequest} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Select Request Type */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300 block">
                      {t('requestTypeLabel')} <span className="text-rose-400">*</span>
                    </label>
                    <select
                      value={selectedType}
                      onChange={handleSelectTypeChange}
                      className="w-full bg-[#1A2332] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-sky-500 cursor-pointer"
                    >
                      <option value="">{t('selectRequestTypePlaceholder')}</option>
                      <option value="enrollment_cert">{t('reqEnrollmentCert')}</option>
                      <option value="academic_leave">{t('reqAcademicLeave')}</option>
                      <option value="emergency_drop">{t('reqEmergencyDrop')}</option>
                      <option value="grade_appeal">{t('reqGradeAppeal')}</option>
                      <option value="duplicate_card">{t('reqDuplicateCard')}</option>
                      <option value="tuition_loan">{t('reqTuitionLoan')}</option>
                    </select>
                  </div>

                  {/* Dynamic Field: Course Select if emergency drop or grade appeal */}
                  {(selectedType === 'emergency_drop' || selectedType === 'grade_appeal') && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-300 block">
                        {t('selectCourseLabel')} <span className="text-rose-400">*</span>
                      </label>
                      <select
                        value={selectedCourseId}
                        onChange={(e) => setSelectedCourseId(e.target.value)}
                        className="w-full bg-[#1A2332] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-sky-500 cursor-pointer"
                      >
                        <option value="">{isFa ? 'یک درس انتخاب کنید...' : 'Select a course...'}</option>
                        {SAMPLE_COURSES.map(c => (
                          <option key={c.id} value={c.id}>
                            {isFa ? c.nameFa : c.nameEn}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Dynamic Field: Current Recorded Grade info for Grade Appeal */}
                  {selectedType === 'grade_appeal' && selectedCourseObj && (
                    <div className="space-y-1.5 sm:col-span-2 bg-sky-500/10 border border-sky-500/20 p-2.5 rounded-xl flex items-center justify-between text-xs">
                      <span className="text-slate-300 font-bold">{t('currentGradeLabel')}</span>
                      <span className="text-amber-400 font-black font-mono text-sm">{selectedCourseObj.currentGrade}</span>
                    </div>
                  )}
                </div>

                {/* Additional Details Textarea */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <label className="font-bold text-slate-300">{t('requestDetailsLabel')}</label>
                    <span className="text-[10px] text-slate-400 font-mono">{detailsText.length} / 250</span>
                  </div>
                  <textarea
                    rows={2}
                    maxLength={250}
                    value={detailsText}
                    onChange={(e) => setDetailsText(e.target.value)}
                    placeholder={isFa ? 'دلیل درخواست یا توضیح تکمیلی خود را وارد کنید...' : 'Enter details or explanation...'}
                    className="w-full bg-[#1A2332] border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-sky-500 resize-none"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-gradient-to-r from-sky-500 to-emerald-600 hover:from-sky-400 hover:to-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-sky-600/20 flex items-center gap-2 transition-all cursor-pointer active:scale-95"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{t('submitRequestBtn')}</span>
                  </button>
                </div>
              </form>
            </div>

            {/* 2. History & Tracking Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                  <Clock className="w-4 h-4 text-sky-400" />
                  <span>{t('requestHistorySection')}</span>
                  <span className="px-2 py-0.5 bg-slate-800 text-slate-400 rounded-md text-[10px] font-mono">
                    ({filteredRequests.length})
                  </span>
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center gap-1 p-1 bg-[#151D2A] rounded-xl border border-white/[0.06] text-xs">
                  <button
                    onClick={() => setFilter('all')}
                    className={`px-3 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                      filter === 'all' ? 'bg-sky-500 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {t('filterAll')}
                  </button>
                  <button
                    onClick={() => setFilter('pending')}
                    className={`px-3 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                      filter === 'pending' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {t('filterPending')}
                  </button>
                  <button
                    onClick={() => setFilter('approved')}
                    className={`px-3 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                      filter === 'approved' ? 'bg-emerald-500 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {t('filterApproved')}
                  </button>
                  <button
                    onClick={() => setFilter('rejected')}
                    className={`px-3 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                      filter === 'rejected' ? 'bg-rose-500 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {t('filterRejected')}
                  </button>
                </div>
              </div>

              {/* Requests Cards List */}
              <div className="space-y-3">
                {filteredRequests.map((req) => (
                  <div
                    key={req.id}
                    className="p-4 bg-[#151D2A] border border-white/[0.08] hover:border-white/20 rounded-2xl space-y-3 transition-all"
                  >
                    {/* Header line */}
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-slate-800 text-sky-400 rounded-xl shrink-0">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-white">
                              {isFa ? req.typeTitleFa : req.typeTitleEn}
                            </h4>
                            {req.courseName && (
                              <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-sky-300 font-semibold">
                                {req.courseName}
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                            <span>کد پیگیری: <strong className="font-mono text-sky-300">{req.trackingCode}</strong></span>
                            <span>•</span>
                            <span>{isFa ? req.dateFa : req.dateEn}</span>
                          </div>
                        </div>
                      </div>

                      {/* Status Badge */}
                      {req.status === 'pending' && (
                        <span className="px-2.5 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full text-[10px] font-bold flex items-center gap-1 shrink-0">
                          <Clock className="w-3 h-3" />
                          <span>{t('filterPending')}</span>
                        </span>
                      )}
                      {req.status === 'approved' && (
                        <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-[10px] font-bold flex items-center gap-1 shrink-0">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>{t('filterApproved')}</span>
                        </span>
                      )}
                      {req.status === 'rejected' && (
                        <span className="px-2.5 py-1 bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-full text-[10px] font-bold flex items-center gap-1 shrink-0">
                          <XCircle className="w-3 h-3" />
                          <span>{t('filterRejected')}</span>
                        </span>
                      )}
                    </div>

                    {req.details && (
                      <p className="text-xs text-slate-300 bg-slate-900/40 p-2.5 rounded-xl border border-white/[0.04]">
                        {req.details}
                      </p>
                    )}

                    {/* Timeline */}
                    <div className="pt-2 border-t border-white/[0.06]">
                      <div className="flex items-center justify-between text-[11px] relative max-w-md mx-auto py-1">
                        {/* Connecting Line */}
                        <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-slate-800 -translate-y-1/2 -z-0"></div>

                        {/* Step 1: Submitted */}
                        <div className="flex flex-col items-center gap-1 z-10 bg-[#151D2A] px-2">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center font-mono font-bold text-[10px] ${
                            req.currentStep >= 1 ? 'bg-sky-500 text-white shadow-md shadow-sky-500/30' : 'bg-slate-800 text-slate-500'
                          }`}>
                            ✓
                          </div>
                          <span className={`text-[10px] font-semibold ${req.currentStep >= 1 ? 'text-sky-300' : 'text-slate-500'}`}>
                            {t('timelineStep1')}
                          </span>
                        </div>

                        {/* Step 2: Expert Review */}
                        <div className="flex flex-col items-center gap-1 z-10 bg-[#151D2A] px-2">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center font-mono font-bold text-[10px] ${
                            req.status === 'rejected' 
                              ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30'
                              : req.currentStep >= 2 ? 'bg-sky-500 text-white shadow-md shadow-sky-500/30' : 'bg-slate-800 text-slate-500'
                          }`}>
                            {req.status === 'rejected' ? '✕' : '۲'}
                          </div>
                          <span className={`text-[10px] font-semibold ${
                            req.status === 'rejected' ? 'text-rose-400' : req.currentStep >= 2 ? 'text-sky-300' : 'text-slate-500'
                          }`}>
                            {t('timelineStep2')}
                          </span>
                        </div>

                        {/* Step 3: Final Approval */}
                        <div className="flex flex-col items-center gap-1 z-10 bg-[#151D2A] px-2">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center font-mono font-bold text-[10px] ${
                            req.currentStep === 3 && req.status === 'approved' 
                              ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30' 
                              : 'bg-slate-800 text-slate-500'
                          }`}>
                            {req.currentStep === 3 && req.status === 'approved' ? '✓' : '۳'}
                          </div>
                          <span className={`text-[10px] font-semibold ${
                            req.currentStep === 3 && req.status === 'approved' ? 'text-emerald-400' : 'text-slate-500'
                          }`}>
                            {t('timelineStep3')}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Rejection Details or Action buttons */}
                    {req.status === 'rejected' && (req.rejectionReasonFa || req.rejectionReasonEn) && (
                      <div className="bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl space-y-2 text-xs">
                        <div className="text-rose-300 font-bold flex items-center gap-1.5">
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          <span>{t('rejectionReasonLabel')}</span>
                        </div>
                        <p className="text-slate-300 text-[11px]">
                          {isFa ? req.rejectionReasonFa : req.rejectionReasonEn}
                        </p>
                      </div>
                    )}

                    {req.status === 'approved' && (
                      <div className="flex justify-end pt-1">
                        <button
                          type="button"
                          onClick={handleDownloadDoc}
                          className="px-3 py-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>{t('downloadDocBtn')}</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Modal Footer */}
          <div className="p-4 sm:p-5 border-t border-white/[0.08] bg-[#172030] flex items-center justify-end shrink-0">
            <button
              type="button"
              onClick={closeModal}
              className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl text-xs sm:text-sm font-bold transition-colors cursor-pointer"
            >
              {isFa ? 'بستن' : 'Close'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

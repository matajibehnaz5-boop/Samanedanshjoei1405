import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, 
  X, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Download, 
  FileCheck, 
  ExternalLink, 
  Loader2, 
  CreditCard,
  Award,
  Sparkles,
  ChevronLeft,
  Check
} from 'lucide-react';
import { useDashboard } from '../../context/DashboardContext';

export interface CertificateItem {
  id: string;
  titleKey: string;
  descKey: string;
  priceFa: string;
  priceEn: string;
  isFree: boolean;
  status: 'idle' | 'issuing' | 'ready';
}

const INITIAL_CERTIFICATES: CertificateItem[] = [
  {
    id: 'cert-1',
    titleKey: 'certPersianEnrollment',
    descKey: 'certPersianEnrollmentDesc',
    priceFa: 'رایگان',
    priceEn: 'Free',
    isFree: true,
    status: 'idle'
  },
  {
    id: 'cert-2',
    titleKey: 'certEnglishEnrollment',
    descKey: 'certEnglishEnrollmentDesc',
    priceFa: 'رایگان',
    priceEn: 'Free',
    isFree: true,
    status: 'idle'
  },
  {
    id: 'cert-3',
    titleKey: 'certOverallGpa',
    descKey: 'certOverallGpaDesc',
    priceFa: 'رایگان',
    priceEn: 'Free',
    isFree: true,
    status: 'idle'
  },
  {
    id: 'cert-4',
    titleKey: 'certMilitary',
    descKey: 'certMilitaryDesc',
    priceFa: 'رایگان',
    priceEn: 'Free',
    isFree: true,
    status: 'idle'
  },
  {
    id: 'cert-5',
    titleKey: 'certOfficialTranscript',
    descKey: 'certOfficialTranscriptDesc',
    priceFa: '۵۰,۰۰۰ تومان',
    priceEn: '50,000 IRR',
    isFree: false,
    status: 'idle'
  }
];

export const RegistrationCertificateModal: React.FC = () => {
  const { activeModal, closeModal, showToast, language, t } = useDashboard();
  const isFa = language === 'fa';

  const [certificates, setCertificates] = useState<CertificateItem[]>(INITIAL_CERTIFICATES);
  const [financialClearance, setFinancialClearance] = useState<boolean>(true);
  const [advisorApproval, setAdvisorApproval] = useState<boolean>(true);
  const [noRestriction, setNoRestriction] = useState<boolean>(true);

  if (activeModal !== 'registration_certificate') return null;

  const allCleared = financialClearance && advisorApproval && noRestriction;

  const handleRequestIssue = (id: string) => {
    // Set status to issuing
    setCertificates(prev => prev.map(c => c.id === id ? { ...c, status: 'issuing' } : c));

    // Simulate 2.5s generation
    setTimeout(() => {
      setCertificates(prev => prev.map(c => c.id === id ? { ...c, status: 'ready' } : c));
    }, 2500);
  };

  const handleDownloadPdf = (certTitle: string) => {
    showToast(t('downloadingCertToast'));
  };

  const handleGoToFinancials = () => {
    showToast(isFa ? 'هدایت به بخش پرداخت شهریه و صورت‌حساب مالی...' : 'Redirecting to tuition payment section...');
  };

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
              <div className="p-3 bg-gradient-to-tr from-emerald-500/20 to-sky-500/20 text-emerald-400 rounded-2xl border border-emerald-500/30 shadow-md">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-extrabold text-white">
                  {t('regCertModalTitle')}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {t('regCertModalSub')}
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

            {/* 1. Registration Status Card */}
            <div className="p-4 sm:p-5 bg-[#151D2A] border border-white/[0.08] rounded-2xl space-y-4 shadow-lg">
              <div className="flex items-center justify-between">
                <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-emerald-400" />
                  <span>{t('regStatusHeading')}</span>
                </h3>
                <span className="text-[11px] font-mono font-bold text-sky-400 bg-sky-500/10 border border-sky-500/20 px-2.5 py-0.5 rounded-full">
                  {t('currentSemesterName')}
                </span>
              </div>

              {/* Checklist items */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Check 1: Financial */}
                <div className={`p-3 rounded-xl border flex items-center justify-between transition-colors ${
                  financialClearance 
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
                    : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                }`}>
                  <div className="text-xs font-bold">
                    <span>{t('chkFinancialClearance')}</span>
                    <span className="block text-[10px] opacity-80 mt-0.5 font-normal">
                      {financialClearance ? t('statusCompleted') : t('statusPendingPay')}
                    </span>
                  </div>
                  {financialClearance ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  ) : (
                    <Clock className="w-5 h-5 text-amber-400 shrink-0" />
                  )}
                </div>

                {/* Check 2: Advisor */}
                <div className={`p-3 rounded-xl border flex items-center justify-between transition-colors ${
                  advisorApproval 
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
                    : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                }`}>
                  <div className="text-xs font-bold">
                    <span>{t('chkAdvisorApproval')}</span>
                    <span className="block text-[10px] opacity-80 mt-0.5 font-normal">
                      {advisorApproval ? t('statusCompleted') : (isFa ? 'در انتظار تأیید' : 'Pending')}
                    </span>
                  </div>
                  {advisorApproval ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  ) : (
                    <Clock className="w-5 h-5 text-amber-400 shrink-0" />
                  )}
                </div>

                {/* Check 3: Restriction */}
                <div className={`p-3 rounded-xl border flex items-center justify-between transition-colors ${
                  noRestriction 
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                }`}>
                  <div className="text-xs font-bold">
                    <span>{t('chkNoAcademicRestriction')}</span>
                    <span className="block text-[10px] opacity-80 mt-0.5 font-normal">
                      {noRestriction ? t('statusCompleted') : (isFa ? 'مشروطی' : 'Restricted')}
                    </span>
                  </div>
                  {noRestriction ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
                  )}
                </div>
              </div>

              {/* Status Banner Result */}
              {allCleared ? (
                <div className="p-3.5 bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-sky-500/20 border border-emerald-500/30 rounded-xl text-xs font-bold text-emerald-300 flex items-center justify-between gap-3 shadow-inner">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{t('allClearedBanner')}</span>
                  </div>
                  <span className="text-[10px] bg-emerald-500/30 text-emerald-200 px-2.5 py-0.5 rounded-full font-mono shrink-0">
                    STATUS: FINAL
                  </span>
                </div>
              ) : (
                <div className="p-3.5 bg-amber-500/20 border border-amber-500/30 rounded-xl text-xs font-bold text-amber-300 flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>{t('clearencePendingBanner')}</span>
                  </div>
                  <button
                    onClick={handleGoToFinancials}
                    className="px-3 py-1 bg-amber-500 text-slate-950 rounded-lg font-bold text-xs flex items-center gap-1 hover:bg-amber-400 cursor-pointer"
                  >
                    <span>{t('goToFinancialBtn')}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* 2. Certificates Request Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-sky-400">
                <Award className="w-4 h-4" />
                <span>{t('certificatesSection')}</span>
              </div>

              <div className="space-y-3">
                {certificates.map((cert) => (
                  <div
                    key={cert.id}
                    className="p-4 bg-[#151D2A] border border-white/[0.08] hover:border-white/20 rounded-2xl flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap transition-all"
                  >
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs sm:text-sm font-bold text-white truncate">
                          {t(cert.titleKey)}
                        </h4>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          cert.isFree 
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}>
                          {isFa ? cert.priceFa : cert.priceEn}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 line-clamp-1">
                        {t(cert.descKey)}
                      </p>
                    </div>

                    <div className="shrink-0">
                      {cert.status === 'idle' && (
                        <button
                          type="button"
                          onClick={() => handleRequestIssue(cert.id)}
                          className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-md shadow-sky-500/20 cursor-pointer active:scale-95"
                        >
                          {t('requestIssueBtn')}
                        </button>
                      )}

                      {cert.status === 'issuing' && (
                        <div className="px-4 py-2 bg-sky-500/20 border border-sky-500/30 text-sky-300 rounded-xl text-xs font-bold flex items-center gap-2">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>{t('issuingStatus')}</span>
                        </div>
                      )}

                      {cert.status === 'ready' && (
                        <button
                          type="button"
                          onClick={() => handleDownloadPdf(t(cert.titleKey))}
                          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-md shadow-emerald-500/20 flex items-center gap-1.5 cursor-pointer active:scale-95"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>{t('readyDownloadBtn')}</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Footer */}
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

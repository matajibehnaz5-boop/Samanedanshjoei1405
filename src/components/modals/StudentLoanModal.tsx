import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Coins, 
  X, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  FileText, 
  ChevronDown, 
  ChevronUp, 
  Wallet, 
  ShieldAlert, 
  Plus, 
  Send,
  Calendar,
  CreditCard
} from 'lucide-react';
import { useDashboard } from '../../context/DashboardContext';

export interface LoanItem {
  id: string;
  typeFa: string;
  typeEn: string;
  amountFa: string;
  amountEn: string;
  rawAmount: number;
  termFa: string;
  termEn: string;
  status: 'active' | 'cleared' | 'under_review';
  trackingCode: string;
}

const INITIAL_LOANS: LoanItem[] = [
  {
    id: '1',
    typeFa: 'وام شهریه',
    typeEn: 'Tuition Loan',
    amountFa: '۵۰,۰۰۰,۰۰۰ ریال',
    amountEn: '50,000,000 IRR',
    rawAmount: 50000000,
    termFa: 'نیمسال دوم ۱۴۰۴',
    termEn: 'Semester 2 (2025)',
    status: 'active',
    trackingCode: 'LOAN-8231'
  },
  {
    id: '2',
    typeFa: 'وام ضروری',
    typeEn: 'Emergency Loan',
    amountFa: '۲۵,۰۰۰,۰۰۰ ریال',
    amountEn: '25,000,000 IRR',
    rawAmount: 25000000,
    termFa: 'نیمسال اول ۱۴۰۳',
    termEn: 'Semester 1 (2024)',
    status: 'cleared',
    trackingCode: 'LOAN-4109'
  }
];

export const LoanHistoryItem = React.memo<{
  item: LoanItem;
  isFa: boolean;
  t: (key: string) => string;
}>(({ item, isFa, t }) => {
  const type = isFa ? item.typeFa : item.typeEn;
  const amount = isFa ? item.amountFa : item.amountEn;
  const term = isFa ? item.termFa : item.termEn;

  return (
    <div className="p-3 bg-[#151D2A] border border-white/[0.08] rounded-2xl flex items-center justify-between gap-3 flex-wrap text-xs hover:border-[#F59E0B]/40 transition-colors">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-[#F59E0B]/10 border border-[#F59E0B]/20 flex items-center justify-center text-[#F59E0B] shrink-0">
          <Wallet className="w-4.5 h-4.5" />
        </div>
        <div>
          <div className="font-bold text-white flex items-center gap-2">
            <span>{type}</span>
            <span className="text-[10px] text-[#BBC1D1] dir-ltr font-mono">({item.trackingCode})</span>
          </div>
          <div className="text-[11px] text-[#BBC1D1] mt-0.5 flex items-center gap-2">
            <span>{term}</span>
            <span>•</span>
            <span className="font-bold text-emerald-400">{amount}</span>
          </div>
        </div>
      </div>

      <div>
        {item.status === 'active' && (
          <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-bold flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>{t('repaymentActive')}</span>
          </span>
        )}
        {item.status === 'cleared' && (
          <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>{t('repaymentCleared')}</span>
          </span>
        )}
        {item.status === 'under_review' && (
          <span className="px-2.5 py-1 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30 text-[11px] font-bold flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>{t('dormStatusUnderReview')}</span>
          </span>
        )}
      </div>
    </div>
  );
});

export const StudentLoanModal: React.FC = () => {
  const { activeModal, closeModal, showToast, language, t } = useDashboard();
  const isFa = language === 'fa';

  const [loansList, setLoansList] = useState<LoanItem[]>(INITIAL_LOANS);
  const [showForm, setShowForm] = useState<boolean>(false);

  // Form State
  const [loanTypeKey, setLoanTypeKey] = useState<string>('tuition');
  const [requestedAmount, setRequestedAmount] = useState<string>('150000000');
  const [installments, setInstallments] = useState<string>('12');
  const [agreedTerms, setAgreedTerms] = useState<boolean>(false);
  const [openRulesAccordion, setOpenRulesAccordion] = useState<boolean>(false);

  // Loan Max Limits (in Rials)
  const LOAN_LIMITS: Record<string, { maxRials: number; titleFa: string; titleEn: string }> = {
    tuition: { maxRials: 150000000, titleFa: 'وام شهریه', titleEn: 'Tuition Loan' },
    emergency: { maxRials: 70000000, titleFa: 'وام ضروری', titleEn: 'Emergency Loan' },
    housing: { maxRials: 250000000, titleFa: 'وام مسکن دانشجویی', titleEn: 'Student Housing Loan' },
    marriage: { maxRials: 300000000, titleFa: 'وام ازدواج دانشجویی', titleEn: 'Student Marriage Loan' },
  };

  const selectedLimit = LOAN_LIMITS[loanTypeKey] || LOAN_LIMITS.tuition;

  const handleLoanTypeChange = (typeKey: string) => {
    setLoanTypeKey(typeKey);
    const newLimit = LOAN_LIMITS[typeKey]?.maxRials || 150000000;
    setRequestedAmount(newLimit.toString());
  };

  const formattedMaxLimit = useMemo(() => {
    return selectedLimit.maxRials.toLocaleString(isFa ? 'fa-IR' : 'en-US') + (isFa ? ' ریال' : ' IRR');
  }, [selectedLimit, isFa]);

  const handleSubmitLoan = (e: React.FormEvent) => {
    e.preventDefault();

    if (!agreedTerms) {
      showToast(isFa ? 'لطفاً ابتدا قوانین را مطالعه کرده و تیک موافقت را بزنید.' : 'Please read and accept the loan terms first.');
      return;
    }

    const numAmount = parseInt(requestedAmount.replace(/\D/g, ''), 10) || 0;
    if (numAmount <= 0) {
      showToast(isFa ? 'لطفاً مبلغ معتبری وارد نمایید.' : 'Please enter a valid amount.');
      return;
    }

    if (numAmount > selectedLimit.maxRials) {
      showToast(isFa ? `مبلغ درخواستی نمی‌تواند بیشتر از سقف ${formattedMaxLimit} باشد.` : `Amount cannot exceed max limit of ${formattedMaxLimit}.`);
      return;
    }

    const randomCode = `LOAN-${Math.floor(1000 + Math.random() * 9000)}`;

    const newLoan: LoanItem = {
      id: Date.now().toString(),
      typeFa: selectedLimit.titleFa,
      typeEn: selectedLimit.titleEn,
      amountFa: `${numAmount.toLocaleString('fa-IR')} ریال`,
      amountEn: `${numAmount.toLocaleString('en-US')} IRR`,
      rawAmount: numAmount,
      termFa: isFa ? 'نیمسال اول ۱۴۰۵' : 'Semester 1 (2026)',
      termEn: 'Semester 1 (2026)',
      status: 'under_review',
      trackingCode: randomCode
    };

    setLoansList(prev => [newLoan, ...prev]);
    setShowForm(false);
    setAgreedTerms(false);

    showToast(t('loanRequestSuccessToast', { code: randomCode }));
  };

  if (activeModal !== 'student_loan') return null;

  return (
    <AnimatePresence>
      <div
        dir={isFa ? 'rtl' : 'ltr'}
        data-modal-backdrop
        onClick={(e) => {
          if (e.target === e.currentTarget) closeModal();
        }}
        className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-md"
      >
        <motion.div
          role="dialog"
          aria-modal="true"
          data-modal-panel
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="relative w-full max-w-2xl bg-[#1A2332] border border-[#F59E0B]/30 rounded-3xl shadow-2xl max-h-[calc(var(--vvh,100dvh)-16px)] max-w-[calc(100vw-16px)] overflow-hidden flex flex-col text-white font-['Vazirmatn',sans-serif]"
          dir={isFa ? 'rtl' : 'ltr'}
        >
          {/* Top Decorative Amber Line */}
          <div className="h-1.5 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 w-full shrink-0" />

          {/* Modal Header */}
          <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between gap-3 bg-[#151D2A] shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#F59E0B]/20 border border-[#F59E0B]/40 flex items-center justify-center text-[#F59E0B]">
                <Coins className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  <span>{t('studentLoanTitle')}</span>
                </h2>
                <p className="text-xs text-[#BBC1D1] mt-0.5">{t('studentLoanSub')}</p>
              </div>
            </div>

            <button
              onClick={closeModal}
              className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-slate-300 hover:text-white transition-colors cursor-pointer shrink-0"
              title={t('close')}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="flex-1 min-h-0 p-4 sm:p-6 space-y-6 overflow-y-auto overflow-x-hidden custom-scrollbar">

            {/* PREVIOUS LOANS SECTION */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-white flex items-center gap-2">
                  <Coins className="w-4 h-4 text-amber-400" />
                  <span>{t('previousLoansTitle')}</span>
                </h3>

                <button
                  onClick={() => setShowForm(!showForm)}
                  className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 font-extrabold text-xs rounded-xl flex items-center gap-1 transition-all shadow-md cursor-pointer shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{showForm ? (isFa ? 'بستن فرم' : 'Close Form') : t('formNewLoanTitle')}</span>
                </button>
              </div>

              <div className="space-y-2">
                {loansList.map((loan) => (
                  <LoanHistoryItem
                    key={loan.id}
                    item={loan}
                    isFa={isFa}
                    t={t}
                  />
                ))}
              </div>
            </div>

            {/* FORM NEW LOAN REQUEST */}
            {showForm && (
              <motion.form
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                onSubmit={handleSubmitLoan}
                className="bg-[#151D2A] border border-amber-500/30 rounded-2xl p-4 sm:p-5 space-y-4 shadow-inner"
              >
                <div className="flex items-center gap-2 border-b border-white/10 pb-2.5">
                  <FileText className="w-4 h-4 text-amber-400" />
                  <h3 className="text-xs font-bold text-white">{t('formNewLoanTitle')}</h3>
                </div>

                {/* Loan Type Select */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#BBC1D1]">{t('loanTypeLabel')}</label>
                  <select
                    value={loanTypeKey}
                    onChange={(e) => handleLoanTypeChange(e.target.value)}
                    className="w-full bg-[#1E293B] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 cursor-pointer font-semibold"
                  >
                    <option value="tuition">{t('loanTypeTuition')}</option>
                    <option value="emergency">{t('loanTypeEmergency')}</option>
                    <option value="housing">{t('loanTypeHousing')}</option>
                    <option value="marriage">{t('loanTypeMarriage')}</option>
                  </select>
                </div>

                {/* Dynamic Max Limit Notice Card */}
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center gap-2.5 text-xs text-amber-300">
                  <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
                  <span>{t('maxLoanLimitNotice', { limit: formattedMaxLimit })}</span>
                </div>

                {/* Requested Amount Input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#BBC1D1]">{t('requestedLoanAmount')}</label>
                  <input
                    type="number"
                    value={requestedAmount}
                    onChange={(e) => setRequestedAmount(e.target.value)}
                    placeholder={t('requestedAmountPlaceholder')}
                    className="w-full bg-[#1E293B] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-mono dir-ltr"
                    required
                  />
                  {requestedAmount && !isNaN(Number(requestedAmount)) && (
                    <div className="text-[11px] text-emerald-400 font-semibold dir-rtl">
                      {isFa 
                        ? `معادل: ${Number(requestedAmount).toLocaleString('fa-IR')} ریال (${(Number(requestedAmount)/10).toLocaleString('fa-IR')} تومان)`
                        : `Equivalent: ${Number(requestedAmount).toLocaleString('en-US')} IRR`}
                    </div>
                  )}
                </div>

                {/* Installments Select */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#BBC1D1]">{t('installmentsCountLabel')}</label>
                  <select
                    value={installments}
                    onChange={(e) => setInstallments(e.target.value)}
                    className="w-full bg-[#1E293B] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 cursor-pointer"
                  >
                    <option value="6">{t('installments6Months')}</option>
                    <option value="12">{t('installments12Months')}</option>
                    <option value="18">{t('installments18Months')}</option>
                    <option value="24">{t('installments24Months')}</option>
                  </select>
                </div>

                {/* Terms Agreement Checkbox */}
                <div className="pt-2 border-t border-white/10">
                  <label className="flex items-start gap-2 text-xs text-slate-200 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={agreedTerms}
                      onChange={(e) => setAgreedTerms(e.target.checked)}
                      className="w-4 h-4 rounded text-amber-500 accent-amber-500 cursor-pointer mt-0.5 shrink-0"
                    />
                    <span className="leading-relaxed">{t('agreeLoanTermsCheckbox')}</span>
                  </label>
                </div>

                {/* Submit Actions */}
                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    {t('cancel')}
                  </button>

                  <button
                    type="submit"
                    disabled={!agreedTerms}
                    className={`px-5 py-2 rounded-xl font-extrabold text-xs flex items-center gap-1.5 shadow-lg transition-all ${
                      agreedTerms 
                        ? 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 cursor-pointer shadow-amber-500/20' 
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-white/5'
                    }`}
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{t('submitLoanRequestBtn')}</span>
                  </button>
                </div>
              </motion.form>
            )}

            {/* RULES ACCORDION SECTION */}
            <div className="pt-2 border-t border-white/10">
              <button
                onClick={() => setOpenRulesAccordion(!openRulesAccordion)}
                className="w-full p-3 rounded-2xl bg-[#151D2A] hover:bg-[#1E293B] border border-white/10 text-xs font-bold text-white flex items-center justify-between transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-400" />
                  <span>{t('loanRulesTitle')}</span>
                </div>
                {openRulesAccordion ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </button>

              <AnimatePresence>
                {openRulesAccordion && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-2 p-4 bg-[#151D2A]/60 border border-white/5 rounded-2xl space-y-3 text-xs text-slate-300"
                  >
                    <div className="space-y-1">
                      <div className="font-bold text-amber-300">{t('loanRule1Title')}</div>
                      <p className="text-[11px] leading-relaxed text-[#BBC1D1]">{t('loanRule1Text')}</p>
                    </div>

                    <div className="space-y-1 pt-2 border-t border-white/5">
                      <div className="font-bold text-amber-300">{t('loanRule2Title')}</div>
                      <p className="text-[11px] leading-relaxed text-[#BBC1D1]">{t('loanRule2Text')}</p>
                    </div>

                    <div className="space-y-1 pt-2 border-t border-white/5">
                      <div className="font-bold text-amber-300">{t('loanRule3Title')}</div>
                      <p className="text-[11px] leading-relaxed text-[#BBC1D1]">{t('loanRule3Text')}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

          </div>

          {/* Modal Footer */}
          <div className="p-3 sm:p-4 bg-[#151D2A] border-t border-white/10 flex items-center justify-end shrink-0">
            <button
              onClick={closeModal}
              className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-colors cursor-pointer"
            >
              {t('close')}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

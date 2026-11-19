import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CreditCard, 
  X, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Building2, 
  ArrowLeftRight, 
  Loader2, 
  DollarSign, 
  ShieldCheck, 
  ChevronLeft,
  Receipt,
  Check
} from 'lucide-react';
import { useDashboard } from '../../context/DashboardContext';

export interface Installment {
  id: string;
  numberFa: string;
  numberEn: string;
  amountFa: string;
  amountEn: string;
  amountVal: number;
  dueDateFa: string;
  dueDateEn: string;
  status: 'paid' | 'due' | 'upcoming';
}

const INITIAL_INSTALLMENTS: Installment[] = [
  {
    id: 'inst-1',
    numberFa: 'قسط اول',
    numberEn: '1st Installment',
    amountFa: '۴,۰۰۰,۰۰۰ تومان',
    amountEn: '4,000,000 IRR',
    amountVal: 4000000,
    dueDateFa: '۱۴۰۵/۰۳/۱۵',
    dueDateEn: 'Jun 5, 2026',
    status: 'paid'
  },
  {
    id: 'inst-2',
    numberFa: 'قسط دوم',
    numberEn: '2nd Installment',
    amountFa: '۴,۵۰۰,۰۰۰ تومان',
    amountEn: '4,500,000 IRR',
    amountVal: 4500000,
    dueDateFa: '۱۴۰۵/۰۵/۱۰',
    dueDateEn: 'Jul 31, 2026',
    status: 'due'
  },
  {
    id: 'inst-3',
    numberFa: 'قسط سوم',
    numberEn: '3rd Installment',
    amountFa: '۴,۰۰۰,۰۰۰ تومان',
    amountEn: '4,000,000 IRR',
    amountVal: 4000000,
    dueDateFa: '۱۴۰۵/۰۶/۳۰',
    dueDateEn: 'Sep 21, 2026',
    status: 'upcoming'
  }
];

export const InstallmentRow = React.memo<{
  item: Installment;
  isFa: boolean;
  t: (key: string) => string;
  onPayInstallment?: (inst: Installment) => void;
}>(({ item, isFa, t, onPayInstallment }) => {
  return (
    <div className="p-3 bg-[#151D2A] border border-white/[0.08] rounded-xl flex items-center justify-between gap-2 flex-wrap text-xs">
      <div className="flex items-center gap-3">
        <span className="font-bold text-white min-w-[70px]">
          {isFa ? item.numberFa : item.numberEn}
        </span>
        <span className="text-emerald-400 font-mono font-extrabold">
          {isFa ? item.amountFa : item.amountEn}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-slate-400 text-[11px] font-mono">
          {isFa ? item.dueDateFa : item.dueDateEn}
        </span>

        {item.status === 'paid' && (
          <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full font-bold text-[10px] flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span>{t('statusPaid')}</span>
          </span>
        )}

        {item.status === 'due' && (
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-full font-bold text-[10px] flex items-center gap-1">
              <AlertTriangle className="w-3 h-3 text-rose-400" />
              <span>{t('statusDue')}</span>
            </span>
            {onPayInstallment && (
              <button
                type="button"
                onClick={() => onPayInstallment(item)}
                className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-[10px] rounded-lg transition-all cursor-pointer shadow-sm active:scale-95"
              >
                {t('paySpecificInstallmentBtn')}
              </button>
            )}
          </div>
        )}

        {item.status === 'upcoming' && (
          <span className="px-2.5 py-0.5 bg-slate-800 text-slate-400 border border-slate-700 rounded-full font-semibold text-[10px] flex items-center gap-1">
            <Clock className="w-3 h-3 text-slate-400" />
            <span>{t('statusUpcoming')}</span>
          </span>
        )}
      </div>
    </div>
  );
});

export const PayTuitionModal: React.FC = () => {
  const { activeModal, closeModal, showToast, language, t } = useDashboard();
  const isFa = language === 'fa';

  const [paymentOption, setPaymentOption] = useState<'full' | 'installment'>('full');
  const [totalDebt, setTotalDebt] = useState<number>(12500000);
  const [installments, setInstallments] = useState<Installment[]>(INITIAL_INSTALLMENTS);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'melli' | 'satna'>('melli');
  const [cardNumber, setCardNumber] = useState<string>('۶۰۳۷ ۹۹۷۵ ۱۲۳۴ ۵۶۷۸');
  
  // Payment Gateway simulation state
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [lastTrackingCode, setLastTrackingCode] = useState<string>('');

  if (activeModal !== 'pay_tuition') return null;

  // Format card number with spaces every 4 digits
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.replace(/\D/g, '');
    if (raw.length > 16) raw = raw.slice(0, 16);
    const formatted = raw.replace(/(\d{4})(?=\d)/g, '$1 ');
    setCardNumber(formatted);
  };

  const handleExecutePayment = (amountToPay?: number) => {
    setIsProcessing(true);

    const amountPaid = amountToPay || (paymentOption === 'full' ? totalDebt : 4500000);

    setTimeout(() => {
      const randomCode = `TRX-${Math.floor(100000 + Math.random() * 900000)}`;
      setLastTrackingCode(randomCode);
      setIsProcessing(false);
      setIsSuccess(true);

      // Update remaining debt balance
      const newDebt = Math.max(0, totalDebt - amountPaid);
      setTotalDebt(newDebt);

      // Update installment status if applicable
      setInstallments(prev => prev.map(inst => {
        if (inst.status === 'due') {
          return { ...inst, status: 'paid' };
        }
        return inst;
      }));

      showToast(t('paymentSuccessTitle'));
    }, 2000);
  };

  const handleResetAndClose = () => {
    setIsSuccess(false);
    setIsProcessing(false);
    closeModal();
  };

  const formatMoney = (val: number) => {
    return isFa ? `${val.toLocaleString('fa-IR')} تومان` : `${val.toLocaleString('en-US')} IRR`;
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 pb-[12vh] sm:pb-[8vh] bg-slate-950/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="w-full max-w-2xl bg-[#1E293B] border border-slate-700/80 rounded-[28px] shadow-2xl text-slate-100 flex flex-col max-h-[85dvh] overflow-y-auto relative"
          dir={isFa ? 'rtl' : 'ltr'}
        >
          {/* Header */}
          <div className="p-5 sm:p-6 border-b border-white/[0.08] bg-[#172030] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 text-emerald-400 rounded-2xl border border-emerald-500/30 shadow-md">
                <CreditCard className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-extrabold text-white">
                  {t('payTuitionTitle')}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {t('payTuitionSub')}
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

          {/* Modal Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">

            {/* PROCESSING STATE SCREEN */}
            {isProcessing && (
              <div className="py-16 flex flex-col items-center justify-center text-center space-y-4">
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-emerald-400 shadow-xl">
                  <Loader2 className="w-12 h-12 animate-spin text-emerald-400" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-white">
                  {t('transferringToGateway')}
                </h3>
                <p className="text-xs text-slate-400 max-w-xs">
                  {isFa ? 'لطفاً چند لحظه شکیبا باشید. اتصال به درگاه بانکی شبکه شتاب در حال برقراری است...' : 'Connecting to the secure bank payment portal, please wait...'}
                </p>
              </div>
            )}

            {/* SUCCESS STATE SCREEN */}
            {isSuccess && !isProcessing && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-10 px-4 flex flex-col items-center justify-center text-center space-y-5 bg-[#151D2A] border border-emerald-500/30 rounded-2xl shadow-xl"
              >
                <div className="p-4 bg-emerald-500/20 text-emerald-400 rounded-full border-2 border-emerald-500 shadow-lg shadow-emerald-500/20">
                  <CheckCircle2 className="w-14 h-14" />
                </div>

                <div className="space-y-1">
                  <h3 className="text-lg sm:text-xl font-extrabold text-white">
                    {t('paymentSuccessTitle')}
                  </h3>
                  <p className="text-xs text-slate-300 max-w-md">
                    {t('paymentSuccessSub')}
                  </p>
                </div>

                {/* Tracking Code Box */}
                <div className="p-4 bg-slate-900/80 border border-white/10 rounded-xl space-y-1 w-full max-w-xs font-mono">
                  <span className="text-[11px] text-slate-400 block font-sans">
                    {t('trackingCodeLabel')}
                  </span>
                  <span className="text-lg font-black text-emerald-400 tracking-wider">
                    {lastTrackingCode}
                  </span>
                </div>

                <div className="pt-2">
                  <button
                    onClick={handleResetAndClose}
                    className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs rounded-xl transition-all cursor-pointer shadow-lg shadow-emerald-500/20 active:scale-95"
                  >
                    {t('backToDashboardBtn')}
                  </button>
                </div>
              </motion.div>
            )}

            {/* NORMAL FORM VIEW */}
            {!isProcessing && !isSuccess && (
              <>
                {/* 1. Debt Summary Highlight Card */}
                <div className="p-4 sm:p-5 bg-gradient-to-br from-[#151D2A] to-[#1A2536] border border-emerald-500/30 rounded-2xl space-y-4 shadow-xl relative overflow-hidden">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div>
                      <span className="text-xs text-slate-400 font-semibold block">
                        {t('totalDebtLabel')}
                      </span>
                      <div className="text-2xl sm:text-3xl font-black text-emerald-400 mt-1 font-mono">
                        {formatMoney(totalDebt)}
                      </div>
                    </div>

                    {/* Due Date Warning Badge */}
                    <div className="bg-rose-500/15 border border-rose-500/30 p-2.5 rounded-xl text-end space-y-0.5">
                      <span className="text-[10px] text-rose-300 font-bold block flex items-center justify-end gap-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                        <span>{t('dueDateLabel')}: {isFa ? '۱۴۰۵/۰۵/۱۰' : 'Jul 31, 2026'}</span>
                      </span>
                      <span className="text-[10px] text-rose-400 font-extrabold block">
                        {t('daysRemainingWarning', { days: 4 })}
                      </span>
                    </div>
                  </div>

                  {/* Toggle: Full Payment vs Installment */}
                  <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between gap-3 flex-wrap">
                    <span className="text-xs font-bold text-slate-300">
                      {t('paymentTypeLabel')}:
                    </span>

                    <div className="flex items-center gap-1.5 p-1 bg-slate-900/70 border border-white/10 rounded-xl">
                      <button
                        type="button"
                        onClick={() => setPaymentOption('full')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          paymentOption === 'full' 
                            ? 'bg-emerald-500 text-slate-950 shadow-md' 
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {t('fullPaymentOption')}
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentOption('installment')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          paymentOption === 'installment' 
                            ? 'bg-emerald-500 text-slate-950 shadow-md' 
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {t('installmentPaymentOption')}
                      </button>
                    </div>
                  </div>
                </div>

                {/* 2. Installments Schedule Table (Visible when installment mode active) */}
                {paymentOption === 'installment' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-3"
                  >
                    <h3 className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                      <Clock className="w-4 h-4" />
                      <span>{t('installmentTableTitle')}</span>
                    </h3>

                    <div className="space-y-2">
                      {installments.map((inst) => (
                        <InstallmentRow
                          key={inst.id}
                          item={inst}
                          isFa={isFa}
                          t={t}
                          onPayInstallment={() => handleExecutePayment(inst.amountVal)}
                        />
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* 3. Payment Gateway & Card Method Form */}
                <div className="p-4 sm:p-5 bg-[#151D2A] border border-white/[0.08] rounded-2xl space-y-4 shadow-lg">
                  <label className="text-xs font-bold text-slate-200 block">
                    {t('paymentMethodLabel')}
                  </label>

                  {/* Payment Method Selector Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {/* Method 1: Card */}
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('card')}
                      className={`p-3 rounded-xl border text-xs font-bold flex items-center gap-2.5 transition-all cursor-pointer ${
                        paymentMethod === 'card'
                          ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300 shadow-md'
                          : 'bg-slate-900/40 border-white/10 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <CreditCard className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span className="truncate">{t('methodBankCard')}</span>
                    </button>

                    {/* Method 2: Melli */}
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('melli')}
                      className={`p-3 rounded-xl border text-xs font-bold flex items-center gap-2.5 transition-all cursor-pointer ${
                        paymentMethod === 'melli'
                          ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300 shadow-md'
                          : 'bg-slate-900/40 border-white/10 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Building2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span className="truncate">{t('methodBankMelli')}</span>
                    </button>

                    {/* Method 3: Satna */}
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('satna')}
                      className={`p-3 rounded-xl border text-xs font-bold flex items-center gap-2.5 transition-all cursor-pointer ${
                        paymentMethod === 'satna'
                          ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300 shadow-md'
                          : 'bg-slate-900/40 border-white/10 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <ArrowLeftRight className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span className="truncate">{t('methodSatna')}</span>
                    </button>
                  </div>

                  {/* Decorative Card Number Input */}
                  <div className="space-y-1.5 pt-1">
                    <label className="text-xs font-semibold text-slate-300 block">
                      {t('cardNumberLabel')}
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={cardNumber}
                        onChange={handleCardNumberChange}
                        placeholder={t('cardNumberPlaceholder')}
                        className="w-full bg-[#1A2332] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono dir-ltr focus:outline-none focus:border-emerald-500 transition-colors"
                      />
                      <ShieldCheck className="w-4 h-4 text-emerald-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Submit Payment Big Button */}
                <button
                  type="button"
                  onClick={() => handleExecutePayment()}
                  className="w-full py-3.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm rounded-2xl shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
                >
                  <CreditCard className="w-5 h-5" />
                  <span>
                    {paymentOption === 'full' 
                      ? `${t('payNowBtn')} (${formatMoney(totalDebt)})`
                      : `${t('payNowBtn')} (${formatMoney(4500000)})`
                    }
                  </span>
                </button>
              </>
            )}

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

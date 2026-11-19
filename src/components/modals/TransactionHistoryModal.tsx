import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  History, 
  X, 
  Search, 
  ArrowUpRight, 
  ArrowDownLeft, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Filter, 
  ChevronDown, 
  ChevronUp, 
  CreditCard, 
  FileText,
  Building2,
  Calendar
} from 'lucide-react';
import { useDashboard } from '../../context/DashboardContext';

export interface Transaction {
  id: string;
  trackingCode: string;
  type: 'tuition' | 'loan' | 'refund' | 'fine';
  titleFa: string;
  titleEn: string;
  dateFa: string;
  dateEn: string;
  time: string;
  amountFa: string;
  amountEn: string;
  amountVal: number;
  isInflow: boolean; // true = green inflow, false = red outflow
  status: 'success' | 'failed' | 'pending';
  paymentMethodFa: string;
  paymentMethodEn: string;
  notesFa: string;
  notesEn: string;
  timestamp: number; // for sorting
}

const SAMPLE_TRANSACTIONS: Transaction[] = [
  {
    id: 'trx-1',
    trackingCode: 'TRX-948120',
    type: 'tuition',
    titleFa: 'پرداخت قسط اول شهریه نیمسال اول ۱۴۰۵',
    titleEn: 'Tuition Installment 1 Payment',
    dateFa: '۱۴۰۵/۰۵/۰۲',
    dateEn: 'Jul 24, 2026',
    time: '۱۴:۳۰',
    amountFa: '۴,۰۰۰,۰۰۰- تومان',
    amountEn: '-4,000,000 IRR',
    amountVal: 4000000,
    isInflow: false,
    status: 'success',
    paymentMethodFa: 'درگاه آنلاین بانک ملی',
    paymentMethodEn: 'Melli Bank Online Gateway',
    notesFa: 'پرداخت موفقیت‌آمیز از طریق کارت بانکی به شماره ****۶۰۳۷',
    notesEn: 'Successful payment via debit card ending in 6037',
    timestamp: 1784880000000
  },
  {
    id: 'trx-2',
    trackingCode: 'TRX-831902',
    type: 'loan',
    titleFa: 'واریز وام صندوق رفاه دانشجویی',
    titleEn: 'Student Welfare Fund Loan Deposit',
    dateFa: '۱۴۰۵/۰۴/۱۸',
    dateEn: 'Jul 9, 2026',
    time: '۱۰:۱۵',
    amountFa: '۱۰,۰۰۰,۰۰۰+ تومان',
    amountEn: '+10,000,000 IRR',
    amountVal: 10000000,
    isInflow: true,
    status: 'success',
    paymentMethodFa: 'واریز پایا/ساتنا به حساب دانشجویی',
    paymentMethodEn: 'Paya/Satna Direct Bank Transfer',
    notesFa: 'وام شهریه نیمسال گذشته مصوب صندوق رفاه وزارت علوم',
    notesEn: 'Approved Ministry Tuition Loan credited to student account',
    timestamp: 1783580000000
  },
  {
    id: 'trx-3',
    trackingCode: 'TRX-720411',
    type: 'refund',
    titleFa: 'بازگشت وجه اضافه پرداختی شهریه متغیر',
    titleEn: 'Variable Tuition Overpayment Refund',
    dateFa: '۱۴۰۵/۰۳/۲۵',
    dateEn: 'Jun 15, 2026',
    time: '۱۶:۴۵',
    amountFa: '۱,۲۰۰,۰۰۰+ تومان',
    amountEn: '+1,200,000 IRR',
    amountVal: 1200000,
    isInflow: true,
    status: 'success',
    paymentMethodFa: 'استرداد به کارت بانکی دانشجو',
    paymentMethodEn: 'Direct Card Refund',
    notesFa: 'بابت حذف اضافه درس ریاضی عمومی در مهلت حذف و اضافه',
    notesEn: 'Refund for dropped course during official drop/add week',
    timestamp: 1781510000000
  },
  {
    id: 'trx-4',
    trackingCode: 'TRX-611094',
    type: 'fine',
    titleFa: 'جریمه دیرکرد انتخاب واحد',
    titleEn: 'Late Course Registration Fine',
    dateFa: '۱۴۰۵/۰۲/۳۰',
    dateEn: 'May 20, 2026',
    time: '۱۱:۲۰',
    amountFa: '۳۰۰,۰۰۰- تومان',
    amountEn: '-300,000 IRR',
    amountVal: 300000,
    isInflow: false,
    status: 'success',
    paymentMethodFa: 'کسر مستقیم از کیف پول الکترونیکی',
    paymentMethodEn: 'Deducted from E-Wallet',
    notesFa: 'جریمه ثبت‌نام با تأخیر بر اساس مصوبه شورای آموزشی',
    notesEn: 'Late registration penalty per academic council rules',
    timestamp: 1779260000000
  },
  {
    id: 'trx-5',
    trackingCode: 'TRX-554102',
    type: 'tuition',
    titleFa: 'تلاش ناموفق پرداخت آنلاین شهریه',
    titleEn: 'Failed Online Tuition Payment',
    dateFa: '۱۴۰۵/۰۲/۱۵',
    dateEn: 'May 5, 2026',
    time: '۰۹:۰۵',
    amountFa: '۵,۰۰۰,۰۰۰- تومان',
    amountEn: '-5,000,000 IRR',
    amountVal: 5000000,
    isInflow: false,
    status: 'failed',
    paymentMethodFa: 'درگاه درگاه بانک صادرات',
    paymentMethodEn: 'Saderat Bank Gateway',
    notesFa: 'تراکنش به دلیل خطای شبکه شتاب ناپایدار لغو گردید.',
    notesEn: 'Transaction failed due to banking network timeout.',
    timestamp: 1777970000000
  },
  {
    id: 'trx-6',
    trackingCode: 'TRX-441298',
    type: 'tuition',
    titleFa: 'تسویه‌حساب کامل شهریه نیمسال دوم ۱۴۰۴',
    titleEn: 'Full Settlement Payment - Semester 2 2025',
    dateFa: '۱۴۰۴/۱۱/۱۲',
    dateEn: 'Feb 1, 2026',
    time: '۱۸:۱۵',
    amountFa: '۹,۰۰۰,۰۰۰- تومان',
    amountEn: '-9,000,000 IRR',
    amountVal: 9000000,
    isInflow: false,
    status: 'success',
    paymentMethodFa: 'درگاه آنلاین بانک ملی',
    paymentMethodEn: 'Melli Bank Online Gateway',
    notesFa: 'تسویه کامل مانده حساب نیمسال دوم با کد پیگیری بانک ملی',
    notesEn: 'Full balance settlement for Semester 2 2025',
    timestamp: 1770000000000
  },
  {
    id: 'trx-7',
    trackingCode: 'TRX-339812',
    type: 'loan',
    titleFa: 'درخواست وام واریزی در حال بررسی',
    titleEn: 'Loan Deposit Under Review',
    dateFa: '۱۴۰۴/۱۰/۰۵',
    dateEn: 'Dec 26, 2025',
    time: '۱۲:۰۰',
    amountFa: '۵,۰۰۰,۰۰۰+ تومان',
    amountEn: '+5,000,000 IRR',
    amountVal: 5000000,
    isInflow: true,
    status: 'pending',
    paymentMethodFa: 'حواله بین‌بانکی پایا',
    paymentMethodEn: 'Paya Interbank Transfer',
    notesFa: 'در حال انتظار برای تأیید نهایی امور مالی صندوق رفاه',
    notesEn: 'Awaiting final verification from welfare department',
    timestamp: 1766700000000
  },
  {
    id: 'trx-8',
    trackingCode: 'TRX-210455',
    type: 'tuition',
    titleFa: 'پرداخت قسط اول شهریه نیمسال اول ۱۴۰۴',
    titleEn: 'Tuition Installment 1 Payment - Semester 1 2025',
    dateFa: '۱۴۰۴/۰۷/۱۰',
    dateEn: 'Oct 2, 2025',
    time: '۱۳:۴۰',
    amountFa: '۳,۵۰۰,۰۰۰- تومان',
    amountEn: '-3,500,000 IRR',
    amountVal: 3500000,
    isInflow: false,
    status: 'success',
    paymentMethodFa: 'درگاه آنلاین بانک رفاه',
    paymentMethodEn: 'Refah Bank Online Gateway',
    notesFa: 'پرداخت اولیه ثبت‌نام نیمسال اول ۱۴۰۴',
    notesEn: 'Initial registration payment for Semester 1 2025',
    timestamp: 1759390000000
  }
];

export const TransactionRow = React.memo<{
  trx: Transaction;
  isFa: boolean;
  t: (key: string) => string;
}>(({ trx, isFa, t }) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  return (
    <div className="bg-[#151D2A] border border-white/[0.08] hover:border-white/20 rounded-2xl transition-all overflow-hidden">
      {/* Primary Visible Bar */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="p-3.5 sm:p-4 flex items-center justify-between gap-3 cursor-pointer select-none"
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* Directional Icon */}
          <div className={`p-2.5 rounded-xl shrink-0 font-bold ${
            trx.isInflow 
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
              : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
          }`}>
            {trx.isInflow ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
          </div>

          {/* Title & Info */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h5 className="text-xs sm:text-sm font-bold text-white truncate">
                {isFa ? trx.titleFa : trx.titleEn}
              </h5>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5 flex-wrap">
              <span>{isFa ? trx.dateFa : trx.dateEn}</span>
              <span>•</span>
              <span>{trx.time}</span>
              <span>•</span>
              <span className="font-mono text-slate-300">{trx.trackingCode}</span>
            </div>
          </div>
        </div>

        {/* Amount & Status Badge */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-end">
            <span className={`text-xs sm:text-sm font-black font-mono block ${
              trx.isInflow ? 'text-emerald-400' : 'text-rose-400'
            }`}>
              {isFa ? trx.amountFa : trx.amountEn}
            </span>

            {/* Status */}
            <div className="flex items-center justify-end gap-1 mt-0.5">
              {trx.status === 'success' && (
                <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-0.5">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>{t('trxStatusSuccess')}</span>
                </span>
              )}
              {trx.status === 'failed' && (
                <span className="text-[10px] text-rose-400 font-bold flex items-center gap-0.5">
                  <XCircle className="w-3 h-3" />
                  <span>{t('trxStatusFailed')}</span>
                </span>
              )}
              {trx.status === 'pending' && (
                <span className="text-[10px] text-amber-400 font-bold flex items-center gap-0.5">
                  <Clock className="w-3 h-3" />
                  <span>{t('trxStatusPending')}</span>
                </span>
              )}
            </div>
          </div>

          <button className="text-slate-400 hover:text-white p-1">
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expandable Details Pane */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-white/[0.06] bg-slate-900/60 p-4 space-y-3 text-xs text-slate-300"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <span className="text-[11px] text-slate-400 block font-semibold">
                  {t('trackingCodeLabel')}
                </span>
                <span className="font-mono text-emerald-400 font-extrabold text-sm block">
                  {trx.trackingCode}
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] text-slate-400 block font-semibold">
                  {t('paymentMethodUsed')}
                </span>
                <span className="text-white font-bold block">
                  {isFa ? trx.paymentMethodFa : trx.paymentMethodEn}
                </span>
              </div>
            </div>

            <div className="space-y-1 pt-1 border-t border-white/[0.04]">
              <span className="text-[11px] text-slate-400 block font-semibold">
                {t('transactionNotes')}
              </span>
              <p className="text-slate-200 text-xs leading-relaxed">
                {isFa ? trx.notesFa : trx.notesEn}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

export const TransactionHistoryModal: React.FC = () => {
  const { activeModal, closeModal, language, t } = useDashboard();
  const isFa = language === 'fa';

  const [typeFilter, setTypeFilter] = useState<'all' | 'tuition' | 'loan' | 'refund' | 'fine'>('all');
  const [timeRange, setTimeRange] = useState<'30' | '90' | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  if (activeModal !== 'transaction_history') return null;

  const filteredTransactions = useMemo(() => {
    return SAMPLE_TRANSACTIONS.filter((trx) => {
      // Type Filter
      if (typeFilter !== 'all' && trx.type !== typeFilter) return false;

      // Search Query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const title = (isFa ? trx.titleFa : trx.titleEn).toLowerCase();
        const code = trx.trackingCode.toLowerCase();
        if (!title.includes(query) && !code.includes(query)) return false;
      }

      return true;
    });
  }, [typeFilter, searchQuery, isFa]);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 pb-[12vh] sm:pb-[8vh] bg-slate-950/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="w-full max-w-3xl bg-[#1E293B] border border-slate-700/80 rounded-[28px] shadow-2xl text-slate-100 flex flex-col max-h-[85dvh] overflow-y-auto"
          dir={isFa ? 'rtl' : 'ltr'}
        >
          {/* Header */}
          <div className="p-5 sm:p-6 border-b border-white/[0.08] bg-[#172030] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 text-emerald-400 rounded-2xl border border-emerald-500/30 shadow-md">
                <History className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-extrabold text-white">
                  {t('transactionHistoryTitle')}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {t('transactionHistorySub')}
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
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">

            {/* Filter Controls Bar */}
            <div className="p-4 bg-[#151D2A] border border-white/[0.08] rounded-2xl space-y-3.5 shadow-lg">
              
              {/* Top Row: Search Input */}
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('filterSearchPlaceholder')}
                  className="w-full bg-[#1A2332] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 pl-9 transition-colors"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Bottom Row: Type Tabs & Timeframe Select */}
              <div className="flex items-center justify-between gap-2 flex-wrap">
                {/* Transaction Type Tabs */}
                <div className="flex items-center gap-1 p-1 bg-slate-900/60 border border-white/10 rounded-xl text-xs overflow-x-auto max-w-full">
                  <button
                    onClick={() => setTypeFilter('all')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap ${
                      typeFilter === 'all' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {t('filterTypeAll')}
                  </button>
                  <button
                    onClick={() => setTypeFilter('tuition')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap ${
                      typeFilter === 'tuition' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {t('filterTypeTuition')}
                  </button>
                  <button
                    onClick={() => setTypeFilter('loan')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap ${
                      typeFilter === 'loan' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {t('filterTypeLoan')}
                  </button>
                  <button
                    onClick={() => setTypeFilter('refund')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap ${
                      typeFilter === 'refund' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {t('filterTypeRefund')}
                  </button>
                  <button
                    onClick={() => setTypeFilter('fine')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap ${
                      typeFilter === 'fine' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {t('filterTypeFine')}
                  </button>
                </div>

                {/* Timeframe Select */}
                <select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value as any)}
                  className="bg-[#1A2332] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value="30">{t('timeRange30Days')}</option>
                  <option value="90">{t('timeRange3Months')}</option>
                  <option value="all">{t('timeRangeAll')}</option>
                </select>
              </div>

            </div>

            {/* Transactions List */}
            <div className="space-y-2.5">
              {filteredTransactions.length === 0 ? (
                <div className="py-12 text-center bg-[#151D2A] border border-white/[0.08] rounded-2xl space-y-2">
                  <History className="w-10 h-10 text-slate-500 mx-auto opacity-50" />
                  <h4 className="text-sm font-bold text-white">{t('noTransactionsFound')}</h4>
                  <p className="text-xs text-slate-400">{t('noTransactionsDesc')}</p>
                </div>
              ) : (
                filteredTransactions.map((trx) => (
                  <TransactionRow key={trx.id} trx={trx} isFa={isFa} t={t} />
                ))
              )}
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

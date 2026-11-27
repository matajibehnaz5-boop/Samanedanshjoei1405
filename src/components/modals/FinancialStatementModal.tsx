import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Receipt, 
  X, 
  Download, 
  DollarSign, 
  Coins, 
  Percent, 
  Filter, 
  Calendar, 
  CheckCircle2, 
  TrendingDown, 
  TrendingUp,
  FileSpreadsheet
} from 'lucide-react';
import { useDashboard } from '../../context/DashboardContext';

export interface BillingItem {
  id: string;
  titleFa: string;
  titleEn: string;
  termFa: string;
  termEn: string;
  termKey: string;
  amountFa: string;
  amountEn: string;
  amountVal: number;
  type: 'charge' | 'payment' | 'discount'; // charge = red (+debt), payment = green (-debt), discount = green (-debt)
  dateFa: string;
  dateEn: string;
}

const SAMPLE_BILLING_ITEMS: BillingItem[] = [
  {
    id: 'bill-1',
    titleFa: 'شهریه ثابت نیمسال اول ۱۴۰۵-۱۴۰۶',
    titleEn: 'Fixed Tuition - Semester 1 2026-2027',
    termFa: 'نیمسال اول ۱۴۰۵-۱۴۰۶',
    termEn: 'Semester 1 2026',
    termKey: '1405-1',
    amountFa: '۴,۵۰۰,۰۰۰ تومان',
    amountEn: '4,500,000 IRR',
    amountVal: 4500000,
    type: 'charge',
    dateFa: '۱۴۰۵/۰۵/۰۱',
    dateEn: 'Jul 22, 2026'
  },
  {
    id: 'bill-2',
    titleFa: 'شهریه متغیر (۱۸ واحد درسی)',
    titleEn: 'Variable Unit Tuition (18 Credits)',
    termFa: 'نیمسال اول ۱۴۰۵-۱۴۰۶',
    termEn: 'Semester 1 2026',
    termKey: '1405-1',
    amountFa: '۸,۰۰۰,۰۰۰ تومان',
    amountEn: '8,000,000 IRR',
    amountVal: 8000000,
    type: 'charge',
    dateFa: '۱۴۰۵/۰۵/۰۱',
    dateEn: 'Jul 22, 2026'
  },
  {
    id: 'bill-3',
    titleFa: 'واریز قسط اول شهریه آنلاین',
    titleEn: 'Installment 1 Tuition Payment',
    termFa: 'نیمسال اول ۱۴۰۵-۱۴۰۶',
    termEn: 'Semester 1 2026',
    termKey: '1405-1',
    amountFa: '۴,۰۰۰,۰۰۰- تومان',
    amountEn: '-4,000,000 IRR',
    amountVal: 4000000,
    type: 'payment',
    dateFa: '۱۴۰۵/۰۳/۱۵',
    dateEn: 'Jun 5, 2026'
  },
  {
    id: 'bill-4',
    titleFa: 'تخفیف فرزند هیأت علمی (۲۰٪)',
    titleEn: 'Faculty Dependent Discount (20%)',
    termFa: 'نیمسال دوم ۱۴۰۴-۱۴۰۵',
    termEn: 'Semester 2 2025',
    termKey: '1404-2',
    amountFa: '۲,۵۰۰,۰۰۰- تومان',
    amountEn: '-2,500,000 IRR',
    amountVal: 2500000,
    type: 'discount',
    dateFa: '۱۴۰۴/۱۱/۲۰',
    dateEn: 'Feb 9, 2026'
  },
  {
    id: 'bill-5',
    titleFa: 'شهریه ثابت نیمسال دوم ۱۴۰۴-۱۴۰۵',
    titleEn: 'Fixed Tuition - Semester 2 2025-2026',
    termFa: 'نیمسال دوم ۱۴۰۴-۱۴۰۵',
    termEn: 'Semester 2 2025',
    termKey: '1404-2',
    amountFa: '۴,۰۰۰,۰۰۰ تومان',
    amountEn: '4,000,000 IRR',
    amountVal: 4000000,
    type: 'charge',
    dateFa: '۱۴۰۴/۱۱/۱۰',
    dateEn: 'Jan 30, 2026'
  },
  {
    id: 'bill-6',
    titleFa: 'شهریه متغیر (۱۶ واحد درسی)',
    titleEn: 'Variable Unit Tuition (16 Credits)',
    termFa: 'نیمسال دوم ۱۴۰۴-۱۴۰۵',
    termEn: 'Semester 2 2025',
    termKey: '1404-2',
    amountFa: '۷,۵۰۰,۰۰۰ تومان',
    amountEn: '7,500,000 IRR',
    amountVal: 7500000,
    type: 'charge',
    dateFa: '۱۴۰۴/۱۱/۱۰',
    dateEn: 'Jan 30, 2026'
  },
  {
    id: 'bill-7',
    titleFa: 'پرداخت آنلاین کامل تسویه‌حساب',
    titleEn: 'Full Tuition Settlement Payment',
    termFa: 'نیمسال دوم ۱۴۰۴-۱۴۰۵',
    termEn: 'Semester 2 2025',
    termKey: '1404-2',
    amountFa: '۹,۰۰۰,۰۰۰- تومان',
    amountEn: '-9,000,000 IRR',
    amountVal: 9000000,
    type: 'payment',
    dateFa: '۱۴۰۴/۱۱/۱۲',
    dateEn: 'Feb 1, 2026'
  },
  {
    id: 'bill-8',
    titleFa: 'جریمه دیرکرد انتخاب واحد',
    titleEn: 'Late Registration Fine',
    termFa: 'نیمسال اول ۱۴۰۴-۱۴۰۵',
    termEn: 'Semester 1 2025',
    termKey: '1404-1',
    amountFa: '۳۰۰,۰۰۰ تومان',
    amountEn: '300,000 IRR',
    amountVal: 300000,
    type: 'charge',
    dateFa: '۱۴۰۴/۰۷/۰۵',
    dateEn: 'Sep 27, 2025'
  }
];

export const BillingItemRow = React.memo<{
  item: BillingItem;
  isFa: boolean;
}>(({ item, isFa }) => {
  const isCharge = item.type === 'charge';

  return (
    <div className="p-3 bg-[#151D2A] border border-white/[0.08] hover:border-white/20 rounded-xl flex items-center justify-between gap-3 text-xs transition-colors flex-wrap sm:flex-nowrap">
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        <div className={`p-2 rounded-lg shrink-0 ${
          isCharge 
            ? 'bg-rose-500/15 text-rose-400 border border-rose-500/20' 
            : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
        }`}>
          {isCharge ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
        </div>

        <div className="min-w-0 flex-1">
          <h5 className="font-bold text-white truncate">
            {isFa ? item.titleFa : item.titleEn}
          </h5>
          <span className="text-[10px] text-slate-400 block mt-0.5">
            {isFa ? item.termFa : item.termEn}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4 shrink-0 font-mono">
        <span className="text-slate-400 text-[11px]">
          {isFa ? item.dateFa : item.dateEn}
        </span>

        <span className={`font-black text-xs px-2.5 py-1 rounded-lg ${
          isCharge 
            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' 
            : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
        }`}>
          {isFa ? item.amountFa : item.amountEn}
        </span>
      </div>
    </div>
  );
});

export const FinancialStatementModal: React.FC = () => {
  const { activeModal, closeModal, showToast, language, t } = useDashboard();
  const isFa = language === 'fa';

  const [selectedTermFilter, setSelectedTermFilter] = useState<string>('all');

  if (activeModal !== 'financial_statement') return null;

  const handleDownloadStatement = () => {
    showToast(t('downloadingStatementToast'));
  };

  const filteredItems = useMemo(() => {
    return SAMPLE_BILLING_ITEMS.filter(item => {
      if (selectedTermFilter === 'all') return true;
      return item.termKey === selectedTermFilter;
    });
  }, [selectedTermFilter]);

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
              <div className="p-3 bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 text-emerald-400 rounded-2xl border border-emerald-500/30 shadow-md">
                <Receipt className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-extrabold text-white">
                  {t('financialStatementTitle')}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {t('financialStatementSub')}
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

            {/* 1. Top Stat Cards (3 Columns) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Stat 1: Total Paid */}
              <div className="p-4 bg-[#151D2A] border border-emerald-500/30 rounded-2xl space-y-1 shadow-lg">
                <div className="flex items-center justify-between text-emerald-400 text-xs font-bold">
                  <span>{t('totalPaidStat')}</span>
                  <Coins className="w-4 h-4" />
                </div>
                <div className="text-lg font-black text-white font-mono pt-1">
                  {isFa ? '۴۸,۵۰۰,۰۰۰ تومان' : '48,500,000 IRR'}
                </div>
                <span className="text-[10px] text-slate-400 block">
                  {isFa ? 'کل دوران تحصیل' : 'All-time total'}
                </span>
              </div>

              {/* Stat 2: Current Debt */}
              <div className="p-4 bg-[#151D2A] border border-rose-500/30 rounded-2xl space-y-1 shadow-lg">
                <div className="flex items-center justify-between text-rose-400 text-xs font-bold">
                  <span>{t('currentDebtStat')}</span>
                  <DollarSign className="w-4 h-4" />
                </div>
                <div className="text-lg font-black text-rose-400 font-mono pt-1">
                  {isFa ? '۱۲,۵۰۰,۰۰۰ تومان' : '12,500,000 IRR'}
                </div>
                <span className="text-[10px] text-slate-400 block">
                  {isFa ? 'سررسید ترم جاری' : 'Current semester balance'}
                </span>
              </div>

              {/* Stat 3: Total Discounts */}
              <div className="p-4 bg-[#151D2A] border border-sky-500/30 rounded-2xl space-y-1 shadow-lg">
                <div className="flex items-center justify-between text-sky-400 text-xs font-bold">
                  <span>{t('totalDiscountsStat')}</span>
                  <Percent className="w-4 h-4" />
                </div>
                <div className="text-lg font-black text-sky-300 font-mono pt-1">
                  {isFa ? '۶,۰۰۰,۰۰۰ تومان' : '6,000,000 IRR'}
                </div>
                <span className="text-[10px] text-slate-400 block">
                  {isFa ? 'کمک‌هزینه و تخفیف‌ها' : 'Scholarships & Grants'}
                </span>
              </div>
            </div>

            {/* 2. Itemized Statement Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <h3 className="text-xs font-bold text-slate-200 flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                  <span>{t('billingTableTitle')}</span>
                </h3>

                {/* Term Filter Select Tabs */}
                <div className="flex items-center gap-1 p-1 bg-[#151D2A] border border-white/10 rounded-xl text-xs">
                  <button
                    onClick={() => setSelectedTermFilter('all')}
                    className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                      selectedTermFilter === 'all' 
                        ? 'bg-emerald-500 text-slate-950' 
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {t('filterAllTerms')}
                  </button>
                  <button
                    onClick={() => setSelectedTermFilter('1405-1')}
                    className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                      selectedTermFilter === '1405-1' 
                        ? 'bg-emerald-500 text-slate-950' 
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    ۱۴۰۵-۱
                  </button>
                  <button
                    onClick={() => setSelectedTermFilter('1404-2')}
                    className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                      selectedTermFilter === '1404-2' 
                        ? 'bg-emerald-500 text-slate-950' 
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    ۱۴۰۴-۲
                  </button>
                  <button
                    onClick={() => setSelectedTermFilter('1404-1')}
                    className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                      selectedTermFilter === '1404-1' 
                        ? 'bg-emerald-500 text-slate-950' 
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    ۱۴۰۴-۱
                  </button>
                </div>
              </div>

              {/* List of Billing Items */}
              <div className="space-y-2">
                {filteredItems.map((item) => (
                  <BillingItemRow key={item.id} item={item} isFa={isFa} />
                ))}
              </div>
            </div>

          </div>

          {/* Footer with Download Statement Button */}
          <div className="p-4 sm:p-5 border-t border-white/[0.08] bg-[#172030] flex items-center justify-between shrink-0 gap-3">
            <button
              type="button"
              onClick={handleDownloadStatement}
              className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-black flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/20 cursor-pointer active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>{t('downloadStatementPdfBtn')}</span>
            </button>

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

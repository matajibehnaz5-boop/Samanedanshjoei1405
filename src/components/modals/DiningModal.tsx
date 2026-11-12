import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  UtensilsCrossed, 
  X, 
  Plus, 
  Wallet, 
  CheckCircle2, 
  CreditCard, 
  Calendar, 
  Clock, 
  Loader2, 
  Sparkles, 
  AlertCircle, 
  ChevronDown, 
  ChevronUp, 
  Send,
  Coffee,
  Check
} from 'lucide-react';
import { useDashboard } from '../../context/DashboardContext';

export interface DiningTransaction {
  id: string;
  type: 'recharge' | 'reservation';
  titleFa: string;
  titleEn: string;
  amount: number;
  dateFa: string;
  dateEn: string;
  status: 'completed' | 'pending';
}

const INITIAL_TRANSACTIONS: DiningTransaction[] = [
  {
    id: '1',
    type: 'reservation',
    titleFa: 'رزرو ناهار: زرشک‌پلو با مرغ',
    titleEn: 'Lunch Reservation: Zereshk Polo',
    amount: -45000,
    dateFa: '۱۴۰۵/۰۵/۰۵ - ۱۲:۳۰',
    dateEn: '2026-07-26 12:30',
    status: 'completed'
  },
  {
    id: '2',
    type: 'recharge',
    titleFa: 'شارژ حساب آنلاین',
    titleEn: 'Online Balance Recharge',
    amount: 200000,
    dateFa: '۱۴۰۵/۰۵/۰۴ - ۱۸:۱۵',
    dateEn: '2026-07-25 18:15',
    status: 'completed'
  },
  {
    id: '3',
    type: 'reservation',
    titleFa: 'رزرو شام: ماکارونی با گوشت',
    titleEn: 'Dinner Reservation: Spaghetti',
    amount: -30000,
    dateFa: '۱۴۰۵/۰۵/۰۳ - ۱۹:۰۰',
    dateEn: '2026-07-24 19:00',
    status: 'completed'
  },
  {
    id: '4',
    type: 'reservation',
    titleFa: 'رزرو ناهار: چلو خورشت قیمه',
    titleEn: 'Lunch Reservation: Gheimeh Stew',
    amount: -35000,
    dateFa: '۱۴۰۵/۰۵/۰۲ - ۱۳:۱۰',
    dateEn: '2026-07-23 13:10',
    status: 'completed'
  }
];

export interface MealOption {
  id: string;
  dayFa: string;
  dayEn: string;
  mealType: 'lunch' | 'dinner';
  dishFa: string;
  dishEn: string;
  price: number;
}

const WEEKLY_MEALS: MealOption[] = [
  // Saturday
  { id: 'sat_l', dayFa: 'شنبه', dayEn: 'Saturday', mealType: 'lunch', dishFa: 'چلو خورشت قیمه', dishEn: 'Gheimeh Stew with Rice', price: 35000 },
  { id: 'sat_d', dayFa: 'شنبه', dayEn: 'Saturday', mealType: 'dinner', dishFa: 'ماکارونی با گوشت', dishEn: 'Spaghetti with Meat', price: 30000 },

  // Sunday
  { id: 'sun_l', dayFa: 'یکشنبه', dayEn: 'Sunday', mealType: 'lunch', dishFa: 'زرشک‌پلو با مرغ', dishEn: 'Barberry Rice with Chicken', price: 45000 },
  { id: 'sun_d', dayFa: 'یکشنبه', dayEn: 'Sunday', mealType: 'dinner', dishFa: 'کوکو سبزی', dishEn: 'Herb Omelette (Kuku)', price: 22000 },

  // Monday
  { id: 'mon_l', dayFa: 'دوشنبه', dayEn: 'Monday', mealType: 'lunch', dishFa: 'چلو خورشت قورمه‌سبزی', dishEn: 'Ghormeh Sabzi Stew', price: 38000 },
  { id: 'mon_d', dayFa: 'دوشنبه', dayEn: 'Monday', mealType: 'dinner', dishFa: 'عدس‌پلو با کشمش', dishEn: 'Lentil Rice with Raisins', price: 28000 },

  // Tuesday
  { id: 'tue_l', dayFa: 'سه‌شنبه', dayEn: 'Tuesday', mealType: 'lunch', dishFa: 'چلو کباب کوبیده', dishEn: 'Kebab Kubideh with Rice', price: 55000 },
  { id: 'tue_d', dayFa: 'سه‌شنبه', dayEn: 'Tuesday', mealType: 'dinner', dishFa: 'خوراک مرغ و سبزیجات', dishEn: 'Chicken & Veggie Dish', price: 32000 },

  // Wednesday
  { id: 'wed_l', dayFa: 'چهارشنبه', dayEn: 'Wednesday', mealType: 'lunch', dishFa: 'چلو جوجه کباب', dishEn: 'Joojeh Kebab with Rice', price: 50000 },
  { id: 'wed_d', dayFa: 'چهارشنبه', dayEn: 'Wednesday', mealType: 'dinner', dishFa: 'شامی کباب', dishEn: 'Shami Kebab', price: 30000 },

  // Thursday
  { id: 'thu_l', dayFa: 'پنجشنبه', dayEn: 'Thursday', mealType: 'lunch', dishFa: 'چلو خورشت بادمجان', dishEn: 'Eggplant Stew with Rice', price: 35000 },
  { id: 'thu_d', dayFa: 'پنجشنبه', dayEn: 'Thursday', mealType: 'dinner', dishFa: 'آش رشته', dishEn: 'Ash Reshteh Noodle Soup', price: 20000 }
];

export const MealScheduleRow = React.memo<{
  meal: MealOption;
  isReserved: boolean;
  onReserve: (meal: MealOption) => void;
  isFa: boolean;
  t: (key: string) => string;
}>(({ meal, isReserved, onReserve, isFa, t }) => {
  const dish = isFa ? meal.dishFa : meal.dishEn;
  const day = isFa ? meal.dayFa : meal.dayEn;
  const mealTitle = meal.mealType === 'lunch' ? (isFa ? 'ناهار' : 'Lunch') : (isFa ? 'شام' : 'Dinner');
  const priceFormatted = meal.price.toLocaleString(isFa ? 'fa-IR' : 'en-US') + (isFa ? ' تومان' : ' Tomans');

  return (
    <div className="p-3 bg-[#151D2A] border border-white/[0.08] rounded-2xl flex items-center justify-between gap-3 text-xs hover:border-[#F59E0B]/40 transition-colors">
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${
          meal.mealType === 'lunch' 
            ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' 
            : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
        }`}>
          {meal.mealType === 'lunch' ? <UtensilsCrossed className="w-4 h-4" /> : <Coffee className="w-4 h-4" />}
        </div>

        <div>
          <div className="font-bold text-white flex items-center gap-2">
            <span className="text-amber-300">{day}</span>
            <span className="text-[10px] text-[#BBC1D1] px-1.5 py-0.5 rounded bg-white/5 font-semibold">
              {mealTitle}
            </span>
          </div>
          <div className="text-slate-200 mt-0.5 font-semibold">{dish}</div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span className="font-extrabold text-amber-400 text-xs">{priceFormatted}</span>

        <button
          onClick={() => !isReserved && onReserve(meal)}
          disabled={isReserved}
          className={`px-3 py-1.5 rounded-xl font-bold text-[11px] transition-all flex items-center gap-1 cursor-pointer shrink-0 ${
            isReserved
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 cursor-default'
              : 'bg-amber-500 hover:bg-amber-600 text-slate-950 hover:scale-105 active:scale-95 shadow-md shadow-amber-500/20'
          }`}
        >
          {isReserved ? (
            <>
              <Check className="w-3.5 h-3.5" />
              <span>{t('reservedSuccess')}</span>
            </>
          ) : (
            <span>{t('reserveBtn')}</span>
          )}
        </button>
      </div>
    </div>
  );
});

export const DiningHistoryItem = React.memo<{
  item: DiningTransaction;
  isFa: boolean;
}>(({ item, isFa }) => {
  const isRecharge = item.type === 'recharge';
  const title = isFa ? item.titleFa : item.titleEn;
  const date = isFa ? item.dateFa : item.dateEn;
  const absAmount = Math.abs(item.amount).toLocaleString(isFa ? 'fa-IR' : 'en-US') + (isFa ? ' تومان' : ' Tomans');

  return (
    <div className="p-3 bg-[#151D2A] border border-white/[0.08] rounded-2xl flex items-center justify-between gap-3 text-xs">
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${
          isRecharge 
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
            : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
        }`}>
          {isRecharge ? <Plus className="w-4 h-4" /> : <UtensilsCrossed className="w-4 h-4" />}
        </div>
        <div>
          <div className="font-bold text-white">{title}</div>
          <div className="text-[11px] text-[#BBC1D1] mt-0.5">{date}</div>
        </div>
      </div>

      <div className={`font-extrabold text-xs dir-ltr font-mono ${isRecharge ? 'text-emerald-400' : 'text-rose-400'}`}>
        {isRecharge ? `+${absAmount}` : `-${absAmount}`}
      </div>
    </div>
  );
});

export const DiningModal: React.FC = () => {
  const { activeModal, closeModal, showToast, language, t } = useDashboard();
  const isFa = language === 'fa';

  // State
  const [balance, setBalance] = useState<number>(250000);
  const [showRechargeForm, setShowRechargeForm] = useState<boolean>(false);
  const [customAmount, setCustomAmount] = useState<string>('100000');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'wallet'>('card');
  const [isProcessingPay, setIsProcessingPay] = useState<boolean>(false);

  // Reserved Meal IDs
  const [reservedMealIds, setReservedMealIds] = useState<Set<string>>(new Set(['sun_l']));

  // History List
  const [transactions, setTransactions] = useState<DiningTransaction[]>(INITIAL_TRANSACTIONS);

  const formattedBalance = useMemo(() => {
    return balance.toLocaleString(isFa ? 'fa-IR' : 'en-US') + (isFa ? ' تومان' : ' Tomans');
  }, [balance, isFa]);

  // Quick preset amounts
  const PRESET_AMOUNTS = [50000, 100000, 200000, 500000];

  const handleRechargeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseInt(customAmount.replace(/\D/g, ''), 10) || 0;

    if (amountNum <= 0) {
      showToast(isFa ? 'لطفاً مبلغ معتبری وارد کنید.' : 'Please enter a valid amount.');
      return;
    }

    setIsProcessingPay(true);

    setTimeout(() => {
      setIsProcessingPay(false);
      setBalance(prev => prev + amountNum);

      const newTx: DiningTransaction = {
        id: Date.now().toString(),
        type: 'recharge',
        titleFa: 'شارژ آنلاین کارت تغذیه',
        titleEn: 'Online Dining Card Recharge',
        amount: amountNum,
        dateFa: 'هم‌اکنون',
        dateEn: 'Just now',
        status: 'completed'
      };

      setTransactions(prev => [newTx, ...prev]);
      setShowRechargeForm(false);

      const formattedAmount = amountNum.toLocaleString(isFa ? 'fa-IR' : 'en-US');
      showToast(t('rechargeSuccessToast', { amount: formattedAmount }));
    }, 1500);
  };

  const handleReserveMeal = useCallback((meal: MealOption) => {
    if (balance < meal.price) {
      showToast(t('insufficientBalanceToast'));
      return;
    }

    setBalance(prev => prev - meal.price);
    setReservedMealIds(prev => new Set(prev).add(meal.id));

    const newTx: DiningTransaction = {
      id: Date.now().toString(),
      type: 'reservation',
      titleFa: `رزرو ${meal.mealType === 'lunch' ? 'ناهار' : 'شام'}: ${meal.dishFa}`,
      titleEn: `Meal Reservation: ${meal.dishEn}`,
      amount: -meal.price,
      dateFa: 'هم‌اکنون',
      dateEn: 'Just now',
      status: 'completed'
    };

    setTransactions(prev => [newTx, ...prev]);

    const formattedPrice = meal.price.toLocaleString(isFa ? 'fa-IR' : 'en-US');
    showToast(t('mealReservedToast', { price: formattedPrice }));
  }, [balance, isFa, showToast, t]);

  if (activeModal !== 'dining') return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="relative w-full max-w-2xl bg-[#1A2332] border border-[#F59E0B]/30 rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto text-white font-['Vazirmatn',sans-serif]"
          dir={isFa ? 'rtl' : 'ltr'}
        >
          {/* Top Decorative Amber Line */}
          <div className="h-1.5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 w-full" />

          {/* Modal Header */}
          <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between gap-3 bg-[#151D2A]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#F59E0B]/20 border border-[#F59E0B]/40 flex items-center justify-center text-[#F59E0B]">
                <UtensilsCrossed className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  <span>{t('diningTitle')}</span>
                </h2>
                <p className="text-xs text-[#BBC1D1] mt-0.5">{t('diningSub')}</p>
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
          <div className="p-4 sm:p-6 space-y-6 max-h-[78vh] overflow-y-auto custom-scrollbar">

            {/* TOP CARD: BALANCE DISPLAY */}
            <div className="bg-gradient-to-br from-[#232D42] to-[#1E293B] border border-amber-500/20 rounded-2xl p-4 sm:p-5 relative overflow-hidden shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3.5 text-center sm:text-start">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                  <Wallet className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs text-[#BBC1D1] block">{t('currentBalanceTitle')}</span>
                  <span className="text-xl sm:text-2xl font-black text-amber-300 mt-0.5 block font-mono">
                    {formattedBalance}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setShowRechargeForm(!showRechargeForm)}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-extrabold text-xs flex items-center gap-2 transition-all shadow-md cursor-pointer shrink-0 hover:scale-105 active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>{showRechargeForm ? (isFa ? 'بستن فرم شارژ' : 'Close Form') : t('quickRechargeBtn')}</span>
              </button>
            </div>

            {/* RECHARGE FORM */}
            {showRechargeForm && (
              <motion.form
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                onSubmit={handleRechargeSubmit}
                className="bg-[#151D2A] border border-amber-500/30 rounded-2xl p-4 sm:p-5 space-y-4 shadow-inner"
              >
                <div className="flex items-center gap-2 border-b border-white/10 pb-2.5">
                  <CreditCard className="w-4 h-4 text-amber-400" />
                  <h3 className="text-xs font-bold text-white">{t('rechargeFormTitle')}</h3>
                </div>

                {/* Quick Presets */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#BBC1D1]">{t('quickAmountSelect')}</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {PRESET_AMOUNTS.map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setCustomAmount(amt.toString())}
                        className={`p-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                          customAmount === amt.toString()
                            ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                            : 'bg-[#1E293B] border-white/10 text-slate-300 hover:bg-white/5'
                        }`}
                      >
                        {amt.toLocaleString(isFa ? 'fa-IR' : 'en-US')} {isFa ? 'تومان' : 'Tomans'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Amount Input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#BBC1D1]">{t('customAmountLabel')}</label>
                  <input
                    type="number"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    className="w-full bg-[#1E293B] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-mono dir-ltr"
                    required
                  />
                  {customAmount && !isNaN(Number(customAmount)) && (
                    <div className="text-[11px] text-emerald-400 font-semibold dir-rtl">
                      {isFa 
                        ? `معادل: ${Number(customAmount).toLocaleString('fa-IR')} تومان (${(Number(customAmount)*10).toLocaleString('fa-IR')} ریال)`
                        : `Equivalent: ${Number(customAmount).toLocaleString('en-US')} Tomans`}
                    </div>
                  )}
                </div>

                {/* Payment Method Select */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#BBC1D1]">{t('diningPaymentMethodLabel')}</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('card')}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                        paymentMethod === 'card'
                          ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                          : 'bg-[#1E293B] border-white/10 text-slate-300 hover:bg-white/5'
                      }`}
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>{t('paymentMethodCard')}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('wallet')}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                        paymentMethod === 'wallet'
                          ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                          : 'bg-[#1E293B] border-white/10 text-slate-300 hover:bg-white/5'
                      }`}
                    >
                      <Wallet className="w-4 h-4" />
                      <span>{t('paymentMethodWallet')}</span>
                    </button>
                  </div>
                </div>

                {/* Submit button */}
                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowRechargeForm(false)}
                    className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    {t('cancel')}
                  </button>

                  <button
                    type="submit"
                    disabled={isProcessingPay}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-extrabold text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
                  >
                    {isProcessingPay ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>{isFa ? 'در حال پرداخت...' : 'Processing...'}</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>{t('submitRechargeBtn')}</span>
                      </>
                    )}
                  </button>
                </div>
              </motion.form>
            )}

            {/* WEEKLY MEAL RESERVATION LIST */}
            <div className="space-y-3 pt-2 border-t border-white/10">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-white flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-amber-400" />
                  <span>{t('weeklyMenuTitle')}</span>
                </h3>
              </div>

              <div className="space-y-2">
                {WEEKLY_MEALS.map((meal) => (
                  <MealScheduleRow
                    key={meal.id}
                    meal={meal}
                    isReserved={reservedMealIds.has(meal.id)}
                    onReserve={handleReserveMeal}
                    isFa={isFa}
                    t={t}
                  />
                ))}
              </div>
            </div>

            {/* DINING TRANSACTIONS HISTORY */}
            <div className="space-y-3 pt-2 border-t border-white/10">
              <h3 className="text-xs font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>{t('diningHistoryTitle')}</span>
              </h3>

              <div className="space-y-2">
                {transactions.map((tx) => (
                  <DiningHistoryItem
                    key={tx.id}
                    item={tx}
                    isFa={isFa}
                  />
                ))}
              </div>
            </div>

          </div>

          {/* Modal Footer */}
          <div className="p-3 sm:p-4 bg-[#151D2A] border-t border-white/10 flex items-center justify-end">
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

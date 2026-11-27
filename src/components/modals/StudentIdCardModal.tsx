import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CreditCard, 
  X, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  FileText, 
  RefreshCw, 
  Sparkles, 
  Send, 
  User, 
  Calendar, 
  ShieldCheck, 
  Loader2,
  Check,
  Building
} from 'lucide-react';
import { useDashboard } from '../../context/DashboardContext';

export interface CardHistoryRecord {
  id: string;
  typeFa: string;
  typeEn: string;
  dateFa: string;
  dateEn: string;
  status: 'completed' | 'processing' | 'rejected';
  trackingCode: string;
}

const INITIAL_CARD_HISTORY: CardHistoryRecord[] = [
  {
    id: '1',
    typeFa: 'تمدید اعتبار سالانه',
    typeEn: 'Annual Validity Renewal',
    dateFa: '۱۴۰۳/۰۷/۱۰',
    dateEn: '2024-10-01',
    status: 'completed',
    trackingCode: 'CARD-1102'
  },
  {
    id: '2',
    typeFa: 'صدور کارت اولیه',
    typeEn: 'Initial Card Issuance',
    dateFa: '۱۴۰۱/۰۷/۰۱',
    dateEn: '2022-09-23',
    status: 'completed',
    trackingCode: 'CARD-0012'
  }
];

export const CardHistoryItem = React.memo<{
  item: CardHistoryRecord;
  isFa: boolean;
  t: (key: string) => string;
}>(({ item, isFa, t }) => {
  const type = isFa ? item.typeFa : item.typeEn;
  const date = isFa ? item.dateFa : item.dateEn;

  return (
    <div className="p-3 bg-[#151D2A] border border-white/[0.08] rounded-2xl flex items-center justify-between gap-3 text-xs hover:border-[#F59E0B]/40 transition-colors">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-[#F59E0B]/10 border border-[#F59E0B]/20 flex items-center justify-center text-[#F59E0B] shrink-0">
          <CreditCard className="w-4 h-4" />
        </div>
        <div>
          <div className="font-bold text-white flex items-center gap-2">
            <span>{type}</span>
            <span className="text-[10px] text-[#BBC1D1] font-mono">({item.trackingCode})</span>
          </div>
          <div className="text-[11px] text-[#BBC1D1] mt-0.5">{date}</div>
        </div>
      </div>

      <div>
        {item.status === 'completed' && (
          <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>{isFa ? 'تکمیل شده' : 'Completed'}</span>
          </span>
        )}
        {item.status === 'processing' && (
          <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-bold flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>{isFa ? 'در حال انجام' : 'Processing'}</span>
          </span>
        )}
      </div>
    </div>
  );
});

export const StudentIdCardModal: React.FC = () => {
  const { activeModal, closeModal, showToast, language, studentProfile, t } = useDashboard();
  const isFa = language === 'fa';

  const [activeTab, setActiveTab] = useState<'renewal' | 'duplicate'>('renewal');
  const [historyList, setHistoryList] = useState<CardHistoryRecord[]>(INITIAL_CARD_HISTORY);

  // Card Status State
  const [cardStatus, setCardStatus] = useState<'valid' | 'near_expiry' | 'expired' | 'renewing'>('near_expiry');
  const [issueDate, setIssueDate] = useState<string>('۱۴۰۱/۰۷/۰۱');
  const [expiryDate, setExpiryDate] = useState<string>('۱۴۰۵/۰۶/۳۱');
  const [daysLeft, setDaysLeft] = useState<number>(18);
  const [isRenewing, setIsRenewing] = useState<boolean>(false);

  // Duplicate Form State
  const [duplicateReason, setDuplicateReason] = useState<string>('lost');
  const [duplicateDesc, setDuplicateDesc] = useState<string>('');
  const [isPaying, setIsPaying] = useState<boolean>(false);

  const handleRequestRenewal = () => {
    setIsRenewing(true);
    setCardStatus('renewing');
    showToast(t('renewalSubmittedToast'));

    setTimeout(() => {
      setIsRenewing(false);
      setCardStatus('valid');
      setExpiryDate('۱۴۰۶/۰۶/۳۱');
      setDaysLeft(365);

      const newRecord: CardHistoryRecord = {
        id: Date.now().toString(),
        typeFa: 'تمدید اعتبار کارت',
        typeEn: 'Card Validity Extension',
        dateFa: '۱۴۰۵/۰۵/۰۶',
        dateEn: new Date().toISOString().split('T')[0],
        status: 'completed',
        trackingCode: `CARD-${Math.floor(1000 + Math.random() * 9000)}`
      };
      setHistoryList(prev => [newRecord, ...prev]);

      showToast(t('renewalSuccessToast'));
    }, 2500);
  };

  const handlePayDuplicate = (e: React.FormEvent) => {
    e.preventDefault();
    setIsPaying(true);

    setTimeout(() => {
      setIsPaying(false);
      const randomCode = `CARD-${Math.floor(1000 + Math.random() * 9000)}`;

      const newRecord: CardHistoryRecord = {
        id: Date.now().toString(),
        typeFa: 'صدور کارت المثنی',
        typeEn: 'Duplicate Card Issuance',
        dateFa: '۱۴۰۵/۰۵/۰۶',
        dateEn: new Date().toISOString().split('T')[0],
        status: 'processing',
        trackingCode: randomCode
      };
      setHistoryList(prev => [newRecord, ...prev]);

      showToast(t('duplicatePaidToast', { code: randomCode }));
      setDuplicateDesc('');
    }, 2000);
  };

  if (activeModal !== 'student_id_card') return null;

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
          <div className="h-1.5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 w-full shrink-0" />

          {/* Modal Header */}
          <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between gap-3 bg-[#151D2A] shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#F59E0B]/20 border border-[#F59E0B]/40 flex items-center justify-center text-[#F59E0B]">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  <span>{t('studentIdCardTitle')}</span>
                </h2>
                <p className="text-xs text-[#BBC1D1] mt-0.5">{t('studentIdCardSub')}</p>
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
          <div className="p-4 sm:p-6 space-y-6 flex-1 min-h-0 overflow-y-auto overflow-x-hidden custom-scrollbar">

            {/* VIRTUAL STUDENT ID CARD DISPLAY */}
            <div className="relative bg-gradient-to-br from-[#202B3C] via-[#1A2332] to-[#121824] border border-amber-500/30 rounded-2xl p-4 sm:p-5 shadow-xl overflow-hidden">
              {/* Background Watermark/Shine */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

              <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
                <div className="flex items-center gap-2">
                  <Building className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-amber-300">{studentProfile.institute || (isFa ? 'دانشگاه صنعتی وزیر' : 'Vazir University')}</span>
                </div>

                {/* Status Badges */}
                {cardStatus === 'valid' && (
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>{t('cardValid')}</span>
                  </span>
                )}
                {cardStatus === 'near_expiry' && (
                  <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>{t('cardNearExpiry')} {t('cardDaysLeft', { days: daysLeft })}</span>
                  </span>
                )}
                {cardStatus === 'renewing' && (
                  <span className="px-2.5 py-1 rounded-full bg-amber-500/30 text-amber-300 border border-amber-400 text-xs font-bold flex items-center gap-1 animate-pulse">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>{t('cardRenewing')}</span>
                  </span>
                )}
                {cardStatus === 'expired' && (
                  <span className="px-2.5 py-1 rounded-full bg-red-500/20 text-red-300 border border-red-500/30 text-xs font-bold flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>{t('cardExpired')}</span>
                  </span>
                )}
              </div>

              {/* Card Main Info */}
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-amber-500/10 border-2 border-amber-500/30 p-1 flex items-center justify-center shrink-0">
                  <div className="w-full h-full rounded-xl bg-slate-800 flex items-center justify-center text-amber-400 font-bold text-xl overflow-hidden">
                    <User className="w-10 h-10" />
                  </div>
                </div>

                <div className="flex-1 space-y-2 text-center sm:text-start w-full">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <h3 className="text-sm sm:text-base font-extrabold text-white">{studentProfile.name}</h3>
                    <div className="text-xs font-mono text-amber-300 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20 inline-block self-center sm:self-auto">
                      {isFa ? `شماره دانشجویی: ${studentProfile.studentId}` : `Student ID: ${studentProfile.studentId}`}
                    </div>
                  </div>

                  <p className="text-xs text-[#BBC1D1]">{studentProfile.field}</p>

                  <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                    <div className="bg-[#151D2A]/80 p-2 rounded-xl border border-white/5">
                      <span className="text-[#BBC1D1] block">{t('cardIssueDate')}</span>
                      <span className="font-bold text-white mt-0.5 block">{issueDate}</span>
                    </div>

                    <div className={`p-2 rounded-xl border ${cardStatus === 'near_expiry' ? 'bg-amber-500/10 border-amber-500/30 text-amber-300' : 'bg-[#151D2A]/80 border-white/5 text-white'}`}>
                      <span className="text-[#BBC1D1] block">{t('cardExpiryDate')}</span>
                      <span className="font-bold mt-0.5 block">{expiryDate}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* TAB SELECTION (RENEWAL / DUPLICATE) */}
            <div className="flex bg-[#151D2A] p-1 rounded-2xl border border-white/10 gap-1">
              <button
                onClick={() => setActiveTab('renewal')}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  activeTab === 'renewal'
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-md'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <RefreshCw className="w-4 h-4" />
                <span>{t('tabRenewal')}</span>
              </button>

              <button
                onClick={() => setActiveTab('duplicate')}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  activeTab === 'duplicate'
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-md'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span>{t('tabDuplicate')}</span>
              </button>
            </div>

            {/* TAB 1: CARD RENEWAL */}
            {activeTab === 'renewal' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#151D2A] border border-amber-500/20 rounded-2xl p-4 sm:p-5 space-y-4"
              >
                <div className="flex items-center gap-2 text-amber-400">
                  <Sparkles className="w-4 h-4" />
                  <span className="text-xs font-bold">{t('tabRenewal')}</span>
                </div>

                <p className="text-xs text-[#BBC1D1] leading-relaxed">
                  {t('renewalNoticeDesc')}
                </p>

                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300 leading-relaxed">
                  {isFa 
                    ? 'نکته: پس از تمدید، کارت شما به‌صورت خودکار در تمام گیت‌های ورود و خروج، تغذیه و کتابخانه به‌روزرسانی خواهد شد.'
                    : 'Note: After renewal, your card will automatically update across all access gates, dining, and library systems.'}
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={handleRequestRenewal}
                    disabled={isRenewing || cardStatus === 'valid'}
                    className={`px-5 py-2.5 rounded-xl font-extrabold text-xs flex items-center gap-2 transition-all ${
                      cardStatus === 'valid'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 cursor-not-allowed'
                        : isRenewing
                        ? 'bg-amber-500/50 text-slate-950 cursor-wait'
                        : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 cursor-pointer shadow-lg shadow-amber-500/20 hover:scale-105'
                    }`}
                  >
                    {isRenewing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>{t('cardRenewing')}</span>
                      </>
                    ) : cardStatus === 'valid' ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>{isFa ? 'کارت شما معتبر است' : 'Card is Valid'}</span>
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4" />
                        <span>{t('requestRenewalBtn')}</span>
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}

            {/* TAB 2: DUPLICATE CARD */}
            {activeTab === 'duplicate' && (
              <motion.form
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onSubmit={handlePayDuplicate}
                className="bg-[#151D2A] border border-amber-500/20 rounded-2xl p-4 sm:p-5 space-y-4"
              >
                <div className="flex items-center gap-2 text-amber-400">
                  <FileText className="w-4 h-4" />
                  <span className="text-xs font-bold">{t('tabDuplicate')}</span>
                </div>

                {/* Reason Select */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#BBC1D1]">{t('duplicateReasonLabel')}</label>
                  <select
                    value={duplicateReason}
                    onChange={(e) => setDuplicateReason(e.target.value)}
                    className="w-full bg-[#1E293B] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 cursor-pointer font-semibold"
                  >
                    <option value="lost">{t('reasonLost')}</option>
                    <option value="damaged">{t('reasonDamaged')}</option>
                    <option value="info_change">{t('reasonInfoChange')}</option>
                  </select>
                </div>

                {/* Description Textarea */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#BBC1D1]">{t('duplicateDescLabel')}</label>
                  <textarea
                    value={duplicateDesc}
                    onChange={(e) => setDuplicateDesc(e.target.value)}
                    rows={2}
                    placeholder={t('duplicateDescPlaceholder')}
                    className="w-full bg-[#1E293B] border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-500 resize-none"
                  />
                </div>

                {/* Fee Display */}
                <div className="p-3 bg-[#1E293B] border border-white/10 rounded-xl flex items-center justify-between text-xs">
                  <span className="text-[#BBC1D1] font-semibold">{t('duplicateFeeLabel')}</span>
                  <span className="font-extrabold text-amber-300 text-sm">
                    {isFa ? '۱۵۰,۰۰۰ تومان' : '150,000 Tomans'}
                  </span>
                </div>

                {/* Submit button */}
                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={isPaying}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-extrabold text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer hover:scale-105"
                  >
                    {isPaying ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>{isFa ? 'در حال اتصال به درگاه...' : 'Connecting to gateway...'}</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>{t('submitAndPayFeeBtn')}</span>
                      </>
                    )}
                  </button>
                </div>
              </motion.form>
            )}

            {/* CARD REQUEST HISTORY */}
            <div className="space-y-3 pt-2 border-t border-white/10">
              <h3 className="text-xs font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>{t('cardHistoryTitle')}</span>
              </h3>

              <div className="space-y-2">
                {historyList.map((item) => (
                  <CardHistoryItem
                    key={item.id}
                    item={item}
                    isFa={isFa}
                    t={t}
                  />
                ))}
              </div>
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

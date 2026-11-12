import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Home, 
  X, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  Building2, 
  AlertCircle, 
  ChevronDown, 
  ChevronUp, 
  Users, 
  FileText, 
  ShieldAlert, 
  Sparkles,
  Bed,
  Layers,
  Send
} from 'lucide-react';
import { useDashboard } from '../../context/DashboardContext';

interface DormCapacity {
  id: string;
  nameFa: string;
  nameEn: string;
  roomTypeFa: string;
  roomTypeEn: string;
  available: number;
  total: number;
}

const SAMPLE_DORM_CAPACITIES: DormCapacity[] = [
  { id: '1', nameFa: 'خوابگاه شهید بهشتی', nameEn: 'Shahid Beheshti Dorm', roomTypeFa: '۴ نفره', roomTypeEn: '4-Bed', available: 8, total: 40 },
  { id: '2', nameFa: 'خوابگاه امام علی (ع)', nameEn: 'Imam Ali Dorm', roomTypeFa: '۲ نفره', roomTypeEn: '2-Bed', available: 3, total: 20 },
  { id: '3', nameFa: 'خوابگاه مجتمع فاطمیه', nameEn: 'Fatemieh Complex', roomTypeFa: '۶ نفره', roomTypeEn: '6-Bed', available: 15, total: 60 },
  { id: '4', nameFa: 'خوابگاه متاهلی آفتاب', nameEn: 'Aftab Married Dorm', roomTypeFa: '۲ نفره (سوئیت)', roomTypeEn: '2-Bed Suite', available: 2, total: 10 },
];

export const DormCapacityRow = React.memo<{
  item: DormCapacity;
  isFa: boolean;
  t: (key: string) => string;
}>(({ item, isFa }) => {
  const name = isFa ? item.nameFa : item.nameEn;
  const roomType = isFa ? item.roomTypeFa : item.roomTypeEn;
  const fillPercentage = Math.round(((item.total - item.available) / item.total) * 100);

  return (
    <div className="p-3 bg-[#151D2A] border border-white/[0.08] rounded-2xl flex items-center justify-between gap-3 flex-wrap text-xs hover:border-[#F59E0B]/40 transition-colors">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-[#F59E0B]/10 border border-[#F59E0B]/20 flex items-center justify-center text-[#F59E0B] shrink-0">
          <Building2 className="w-4 h-4" />
        </div>
        <div>
          <div className="font-bold text-white">{name}</div>
          <div className="text-[11px] text-[#BBC1D1]">{roomType}</div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex flex-col items-end gap-1">
          <span className="text-[11px] text-amber-300 font-bold">
            {item.available} / {item.total} {isFa ? 'ظرفیت خالی' : 'available'}
          </span>
          <div className="w-24 sm:w-28 h-1.5 bg-slate-800 rounded-full overflow-hidden border border-white/10">
            <div 
              className="h-full bg-gradient-to-r from-emerald-500 to-amber-500 rounded-full"
              style={{ width: `${100 - fillPercentage}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
});

export const DormitoryModal: React.FC = () => {
  const { activeModal, closeModal, showToast, language, t } = useDashboard();
  const isFa = language === 'fa';

  // Request State
  const [requestStatus, setRequestStatus] = useState<'none' | 'under_review' | 'approved_waiting' | 'allocated' | 'rejected'>('allocated');
  const [showForm, setShowForm] = useState<boolean>(false);

  // Allocated details sample
  const [allocatedDetails] = useState({
    dormName: isFa ? 'خوابگاه شهید بهشتی' : 'Shahid Beheshti Dorm',
    block: 'ب',
    room: '۳۰۴',
    bed: '۲',
    semesterFee: isFa ? '۳۴,۰۰۰,۰۰۰ ریال' : '34,000,000 IRR',
    trackingCode: 'DORM-9281'
  });

  // Form State
  const [dormType, setDormType] = useState<'single' | 'married'>('single');
  const [dormPriority, setDormPriority] = useState<string>('');
  const [roomType, setRoomType] = useState<string>('4_bed');
  const [hasSpecialConditions, setHasSpecialConditions] = useState<boolean>(false);
  const [specialConditionsDesc, setSpecialConditionsDesc] = useState<string>('');
  const [openRulesAccordion, setOpenRulesAccordion] = useState<boolean>(false);

  const handleSubmitRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dormPriority) {
      showToast(isFa ? 'لطفاً اولویت خوابگاه را انتخاب کنید.' : 'Please select a dormitory priority.');
      return;
    }

    const randomCode = `DORM-${Math.floor(1000 + Math.random() * 9000)}`;
    setRequestStatus('under_review');
    setShowForm(false);
    showToast(t('dormRequestSuccessToast', { code: randomCode }));
  };

  if (activeModal !== 'dormitory') return null;

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
                <Home className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  <span>{t('dormitoryTitle')}</span>
                </h2>
                <p className="text-xs text-[#BBC1D1] mt-0.5">{t('dormitorySub')}</p>
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

            {/* STATUS SECTION (TOP CARD) */}
            <div className="bg-gradient-to-br from-[#232D42] to-[#1E293B] border border-amber-500/20 rounded-2xl p-4 sm:p-5 relative overflow-hidden shadow-lg">
              <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
                <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  <span>{t('dormStatusTitle')}</span>
                </span>

                {requestStatus === 'allocated' && (
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{t('dormStatusAllocated')}</span>
                  </span>
                )}
                {requestStatus === 'under_review' && (
                  <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{t('dormStatusUnderReview')}</span>
                  </span>
                )}
                {requestStatus === 'approved_waiting' && (
                  <span className="px-2.5 py-1 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30 text-xs font-bold flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{t('dormStatusApprovedWaiting')}</span>
                  </span>
                )}
                {requestStatus === 'rejected' && (
                  <span className="px-2.5 py-1 rounded-full bg-red-500/20 text-red-300 border border-red-500/30 text-xs font-bold flex items-center gap-1">
                    <XCircle className="w-3.5 h-3.5" />
                    <span>{t('dormStatusRejected')}</span>
                  </span>
                )}
                {requestStatus === 'none' && (
                  <span className="px-2.5 py-1 rounded-full bg-slate-700/50 text-slate-300 border border-slate-600/30 text-xs font-bold">
                    {isFa ? 'بدون درخواست' : 'No Request'}
                  </span>
                )}
              </div>

              {/* Status details content */}
              {requestStatus === 'none' && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-start pt-1">
                  <p className="text-xs text-[#BBC1D1]">
                    {t('noDormRequestYet')}
                  </p>
                  <button
                    onClick={() => setShowForm(true)}
                    className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-extrabold text-xs rounded-xl transition-all shadow-md hover:scale-105 active:scale-95 cursor-pointer shrink-0"
                  >
                    {t('newDormRequestBtn')}
                  </button>
                </div>
              )}

              {requestStatus === 'allocated' && (
                <div className="space-y-3 pt-1">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                    <div className="bg-[#151D2A]/80 p-2.5 rounded-xl border border-white/5">
                      <span className="text-[10px] text-[#BBC1D1] block">{t('allocatedDormName')}</span>
                      <span className="font-bold text-white mt-0.5 block">{allocatedDetails.dormName}</span>
                    </div>

                    <div className="bg-[#151D2A]/80 p-2.5 rounded-xl border border-white/5">
                      <span className="text-[10px] text-[#BBC1D1] block">{t('allocatedBlock')}</span>
                      <span className="font-bold text-amber-300 mt-0.5 block">{allocatedDetails.block}</span>
                    </div>

                    <div className="bg-[#151D2A]/80 p-2.5 rounded-xl border border-white/5">
                      <span className="text-[10px] text-[#BBC1D1] block">{t('allocatedRoom')}</span>
                      <span className="font-bold text-amber-300 mt-0.5 block">{allocatedDetails.room}</span>
                    </div>

                    <div className="bg-[#151D2A]/80 p-2.5 rounded-xl border border-white/5">
                      <span className="text-[10px] text-[#BBC1D1] block">{t('allocatedBed')}</span>
                      <span className="font-bold text-amber-300 mt-0.5 block">{allocatedDetails.bed}</span>
                    </div>

                    <div className="bg-[#151D2A]/80 p-2.5 rounded-xl border border-white/5 col-span-2 sm:col-span-2">
                      <span className="text-[10px] text-[#BBC1D1] block">{t('allocatedSemesterFee')}</span>
                      <span className="font-bold text-emerald-400 mt-0.5 block">{allocatedDetails.semesterFee}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-[#BBC1D1] pt-1">
                    <span>{isFa ? `کد پیگیری: ${allocatedDetails.trackingCode}` : `Tracking Code: ${allocatedDetails.trackingCode}`}</span>
                    <button
                      onClick={() => setShowForm(!showForm)}
                      className="text-amber-400 hover:underline font-bold cursor-pointer"
                    >
                      {showForm ? (isFa ? 'بستن فرم درخواست' : 'Close Form') : (isFa ? 'ثبت درخواست جدید / تغییر' : 'New Request / Change')}
                    </button>
                  </div>
                </div>
              )}

              {requestStatus === 'under_review' && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-start pt-1">
                  <div className="text-xs text-[#BBC1D1]">
                    <span className="text-amber-300 font-bold block">{isFa ? 'درخواست شما در کمیته اسکان در حال بررسی است.' : 'Your request is currently under review by the housing committee.'}</span>
                    <span className="text-[11px] opacity-80 mt-1 block">{isFa ? 'نتیجه بررسی ظرف ۳ روز کاری از طریق پیامک اطلاع‌رسانی خواهد شد.' : 'Results will be announced via SMS within 3 working days.'}</span>
                  </div>
                  <button
                    onClick={() => setShowForm(!showForm)}
                    className="px-3.5 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shrink-0"
                  >
                    {showForm ? (isFa ? 'بستن فرم' : 'Close Form') : (isFa ? 'ویرایش درخواست' : 'Edit Request')}
                  </button>
                </div>
              )}
            </div>

            {/* FORM NEW DORM REQUEST */}
            {showForm && (
              <motion.form
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                onSubmit={handleSubmitRequest}
                className="bg-[#151D2A] border border-amber-500/30 rounded-2xl p-4 sm:p-5 space-y-4 shadow-inner"
              >
                <div className="flex items-center gap-2 border-b border-white/10 pb-2.5">
                  <FileText className="w-4 h-4 text-amber-400" />
                  <h3 className="text-xs font-bold text-white">{t('formNewDormTitle')}</h3>
                </div>

                {/* Dorm Type Radio */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#BBC1D1]">{t('dormTypeLabel')}</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setDormType('single')}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                        dormType === 'single'
                          ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                          : 'bg-[#1E293B] border-white/10 text-slate-300 hover:bg-white/5'
                      }`}
                    >
                      <Users className="w-4 h-4" />
                      <span>{t('dormTypeSingle')}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDormType('married')}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                        dormType === 'married'
                          ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                          : 'bg-[#1E293B] border-white/10 text-slate-300 hover:bg-white/5'
                      }`}
                    >
                      <Home className="w-4 h-4" />
                      <span>{t('dormTypeMarried')}</span>
                    </button>
                  </div>
                </div>

                {/* Dorm Priority Select */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#BBC1D1]">{t('dormPriorityLabel')}</label>
                  <select
                    value={dormPriority}
                    onChange={(e) => setDormPriority(e.target.value)}
                    className="w-full bg-[#1E293B] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 cursor-pointer"
                    required
                  >
                    <option value="">{t('selectDormPlaceholder')}</option>
                    <option value="beheshti">{isFa ? 'خوابگاه شهید بهشتی (برادران / خواهران)' : 'Shahid Beheshti Dorm'}</option>
                    <option value="imam_ali">{isFa ? 'خوابگاه امام علی (ع)' : 'Imam Ali Dorm'}</option>
                    <option value="fatemieh">{isFa ? 'خوابگاه مجتمع دانشجویی فاطمیه' : 'Fatemieh Student Complex'}</option>
                    <option value="aftab">{isFa ? 'خوابگاه متاهلی آفتاب' : 'Aftab Married Dorm'}</option>
                  </select>
                </div>

                {/* Room Type Options */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#BBC1D1]">{t('roomTypeLabel')}</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setRoomType('2_bed')}
                      className={`p-2 rounded-xl border text-xs text-start transition-all cursor-pointer ${
                        roomType === '2_bed'
                          ? 'bg-amber-500/20 border-amber-500 text-white'
                          : 'bg-[#1E293B] border-white/10 text-slate-300 hover:bg-white/5'
                      }`}
                    >
                      <div className="font-bold">{t('roomType2Bed').split('(')[0]}</div>
                      <div className="text-[10px] text-amber-300/90 mt-0.5">({t('roomType2Bed').split('(')[1]}</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRoomType('4_bed')}
                      className={`p-2 rounded-xl border text-xs text-start transition-all cursor-pointer ${
                        roomType === '4_bed'
                          ? 'bg-amber-500/20 border-amber-500 text-white'
                          : 'bg-[#1E293B] border-white/10 text-slate-300 hover:bg-white/5'
                      }`}
                    >
                      <div className="font-bold">{t('roomType4Bed').split('(')[0]}</div>
                      <div className="text-[10px] text-amber-300/90 mt-0.5">({t('roomType4Bed').split('(')[1]}</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRoomType('6_bed')}
                      className={`p-2 rounded-xl border text-xs text-start transition-all cursor-pointer ${
                        roomType === '6_bed'
                          ? 'bg-amber-500/20 border-amber-500 text-white'
                          : 'bg-[#1E293B] border-white/10 text-slate-300 hover:bg-white/5'
                      }`}
                    >
                      <div className="font-bold">{t('roomType6Bed').split('(')[0]}</div>
                      <div className="text-[10px] text-amber-300/90 mt-0.5">({t('roomType6Bed').split('(')[1]}</div>
                    </button>
                  </div>
                </div>

                {/* Special Conditions Checkbox */}
                <div className="pt-2 border-t border-white/10 space-y-2">
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-200 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={hasSpecialConditions}
                      onChange={(e) => setHasSpecialConditions(e.target.checked)}
                      className="w-4 h-4 rounded text-amber-500 accent-amber-500 cursor-pointer"
                    />
                    <span>{t('hasSpecialConditions')}</span>
                  </label>

                  {hasSpecialConditions && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="space-y-1 pt-1"
                    >
                      <label className="text-[11px] text-[#BBC1D1]">{t('specialConditionsDescLabel')}</label>
                      <textarea
                        value={specialConditionsDesc}
                        onChange={(e) => setSpecialConditionsDesc(e.target.value)}
                        rows={2}
                        placeholder={t('specialConditionsDescPlaceholder')}
                        className="w-full bg-[#1E293B] border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-500 resize-none"
                      />
                    </motion.div>
                  )}
                </div>

                {/* Submit Action */}
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
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-extrabold text-xs flex items-center gap-1.5 shadow-lg transition-all cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{t('submitDormRequestBtn')}</span>
                  </button>
                </div>
              </motion.form>
            )}

            {/* CAPACITY TABLE SECTION */}
            <div className="space-y-3 pt-2 border-t border-white/10">
              <h3 className="text-xs font-bold text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-amber-400" />
                <span>{t('dormCapacityTitle')}</span>
              </h3>

              <div className="space-y-2">
                {SAMPLE_DORM_CAPACITIES.map((item) => (
                  <DormCapacityRow
                    key={item.id}
                    item={item}
                    isFa={isFa}
                    t={t}
                  />
                ))}
              </div>
            </div>

            {/* RULES ACCORDION SECTION */}
            <div className="pt-2 border-t border-white/10">
              <button
                onClick={() => setOpenRulesAccordion(!openRulesAccordion)}
                className="w-full p-3 rounded-2xl bg-[#151D2A] hover:bg-[#1E293B] border border-white/10 text-xs font-bold text-white flex items-center justify-between transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-400" />
                  <span>{t('dormRulesTitle')}</span>
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
                      <div className="font-bold text-amber-300">{t('dormRule1Title')}</div>
                      <p className="text-[11px] leading-relaxed text-[#BBC1D1]">{t('dormRule1Text')}</p>
                    </div>

                    <div className="space-y-1 pt-2 border-t border-white/5">
                      <div className="font-bold text-amber-300">{t('dormRule2Title')}</div>
                      <p className="text-[11px] leading-relaxed text-[#BBC1D1]">{t('dormRule2Text')}</p>
                    </div>

                    <div className="space-y-1 pt-2 border-t border-white/5">
                      <div className="font-bold text-amber-300">{t('dormRule3Title')}</div>
                      <p className="text-[11px] leading-relaxed text-[#BBC1D1]">{t('dormRule3Text')}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
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

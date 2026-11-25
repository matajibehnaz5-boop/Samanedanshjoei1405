import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  LayoutDashboard,
  X,
  Search,
  Loader2,
  CheckCircle2,
  XCircle,
  CheckCheck,
  Clock,
  FileText,
  GraduationCap,
  MessageSquare,
  Settings2,
  ArrowRight,
  ExternalLink,
  Inbox,
  User,
} from 'lucide-react';
import { useDashboard } from '../../context/DashboardContext';
import { api } from '../../lib/api';
import {
  AdminCartableCounts,
  AdminCartableItem,
  AdminCartableStatus,
  AdminCartableType,
} from '../../types';

type CartableTab = 'all' | 'pending' | 'done';

const TYPE_META: Record<
  AdminCartableType,
  {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badgeClass: string;
  }
> = {
  student_request: {
    label: 'درخواست دانشجو',
    icon: FileText,
    badgeClass: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
  },
  thesis: {
    label: 'پایان‌نامه',
    icon: GraduationCap,
    badgeClass: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
  },
  message: {
    label: 'پیام',
    icon: MessageSquare,
    badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  },
  system: {
    label: 'سیستم',
    icon: Settings2,
    badgeClass: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
  },
};

const STATUS_META: Record<
  AdminCartableStatus,
  {
    label: string;
    badgeClass: string;
  }
> = {
  pending: {
    label: 'در انتظار',
    badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/35',
  },
  approved: {
    label: 'تأیید شده',
    badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/35',
  },
  rejected: {
    label: 'رد شده',
    badgeClass: 'bg-rose-500/15 text-rose-300 border-rose-500/35',
  },
  done: {
    label: 'انجام‌شده',
    badgeClass: 'bg-sky-500/15 text-sky-300 border-sky-500/35',
  },
};

function toPersianDigits(val: number | string): string {
  const persian = '۰۱۲۳۴۵۶۷۸۹';
  return String(val).replace(/\d/g, (d) => persian[Number(d)] ?? d);
}

function formatRelativeTimeFa(isoString: string): string {
  const ts = Date.parse(isoString);
  if (isNaN(ts)) return '';
  const diffSec = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (diffSec < 60) return 'هم‌اکنون';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${toPersianDigits(diffMin)} دقیقه پیش`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${toPersianDigits(diffHours)} ساعت پیش`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'دیروز';
  if (diffDays < 7) return `${toPersianDigits(diffDays)} روز پیش`;
  try {
    return new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
      month: 'short',
      day: 'numeric',
    }).format(new Date(ts));
  } catch {
    return '';
  }
}

export const AdminCartableModal: React.FC = () => {
  const { activeModal, closeModal, setActiveModal, showToast, studentProfile } = useDashboard();
  const isOpen = activeModal === 'admin_cartable' && studentProfile.role === 'admin';

  const [tab, setTab] = useState<CartableTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [items, setItems] = useState<AdminCartableItem[]>([]);
  const [counts, setCounts] = useState<AdminCartableCounts>({ all: 0, pending: 0, done: 0 });
  const [isLoading, setIsLoading] = useState(false);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [decisionNote, setDecisionNote] = useState('');
  const [submittingAction, setSubmittingAction] = useState<'approve' | 'reject' | 'done' | null>(null);
  const noteInputRef = useRef<HTMLTextAreaElement | null>(null);

  const fetchCartable = useCallback(
    async (targetTab: CartableTab) => {
      setIsLoading(true);
      try {
        const res = await api.getAdminCartable(targetTab);
        const list = Array.isArray(res?.items) ? res.items : [];
        const nextCounts = res?.counts || { all: list.length, pending: 0, done: 0 };
        setItems(list);
        setCounts(nextCounts);
        window.dispatchEvent(
          new CustomEvent('admin-cartable-updated', {
            detail: { pendingCount: nextCounts.pending },
          })
        );
      } catch (err: any) {
        showToast(err?.message || 'خطا در دریافت موارد کارتابل');
      } finally {
        setIsLoading(false);
      }
    },
    [showToast]
  );

  useEffect(() => {
    if (!isOpen) return;
    fetchCartable(tab);
  }, [isOpen, tab, fetchCartable]);

  useEffect(() => {
    if (!isOpen) {
      setSelectedId(null);
      setDecisionNote('');
      setSearchQuery('');
      setTab('all');
    }
  }, [isOpen]);

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => {
      const typeLabel = TYPE_META[item.type]?.label || '';
      return (
        item.title.toLowerCase().includes(q) ||
        item.sender.toLowerCase().includes(q) ||
        item.body.toLowerCase().includes(q) ||
        typeLabel.toLowerCase().includes(q)
      );
    });
  }, [items, searchQuery]);

  const selectedItem = useMemo(
    () => items.find((item) => item.id === selectedId) || null,
    [items, selectedId]
  );

  const handleSelectItem = (item: AdminCartableItem) => {
    setSelectedId(item.id);
    setDecisionNote(item.decisionNote || '');
  };

  const handleDecision = async (action: 'approve' | 'reject' | 'done') => {
    if (!selectedItem || submittingAction) return;

    const cleanNote = decisionNote.trim();
    if (action === 'reject' && !cleanNote) {
      showToast('لطفاً توضیح یا دلیل رد را وارد کنید.');
      noteInputRef.current?.focus();
      return;
    }

    setSubmittingAction(action);
    try {
      const res = await api.updateAdminCartableItem(selectedItem.id, {
        action,
        decisionNote: cleanNote || undefined,
      });

      const updatedItem = res.item;
      const nextCounts = res.counts;

      setCounts(nextCounts);
      setItems((prev) => {
        const mapped = prev.map((it) => (it.id === updatedItem.id ? updatedItem : it));
        if (tab === 'pending' && updatedItem.status !== 'pending') {
          return mapped.filter((it) => it.id !== updatedItem.id);
        }
        return mapped;
      });
      setDecisionNote(updatedItem.decisionNote || '');
      if (tab === 'pending' && updatedItem.status !== 'pending') {
        setSelectedId(null);
      }

      window.dispatchEvent(
        new CustomEvent('admin-cartable-updated', {
          detail: { pendingCount: nextCounts.pending },
        })
      );
      showToast(res.message || 'تصمیم با موفقیت ثبت شد.');
    } catch (err: any) {
      showToast(err?.message || 'خطا در ثبت تصمیم');
    } finally {
      setSubmittingAction(null);
    }
  };

  const handleGoToTargetModal = (item: AdminCartableItem) => {
    if (!item.targetModal) return;
    setActiveModal(item.targetModal);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        dir="rtl"
        className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 pb-[10vh] sm:pb-[6vh] bg-[var(--backdrop)] backdrop-blur-sm"
      >
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40, scale: 0.97 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="w-full max-w-4xl bg-[var(--surface)] border border-[var(--border-strong)] rounded-[24px] sm:rounded-[28px] shadow-2xl text-[var(--text)] flex flex-col max-h-[86dvh] overflow-hidden"
        >
          {/* Header */}
          <div className="px-4 py-3.5 sm:px-6 sm:py-4 border-b border-[var(--border)] bg-[var(--surface-header)] flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              <div className="p-2 sm:p-2.5 bg-indigo-600/20 text-indigo-400 rounded-xl border border-indigo-500/30 shrink-0">
                <LayoutDashboard className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-bold text-[var(--text)] truncate">
                    کارتابل ادمین
                  </h2>
                  {counts.pending > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/35 text-[10px] sm:text-[11px] font-bold shrink-0">
                      {toPersianDigits(counts.pending)} در انتظار
                    </span>
                  )}
                </div>
                <p className="text-[11px] sm:text-xs text-[var(--text-2)] truncate mt-0.5">
                  بررسی، تأیید یا رد کارها و درخواست‌های رسیده به مدیریت
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={closeModal}
              aria-label="بستن"
              className="p-2 rounded-full hover:bg-[var(--surface-hover)] text-[var(--text-2)] hover:text-[var(--text)] transition-colors cursor-pointer shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Top Controls: Tabs & Search */}
          <div className="px-3.5 py-2.5 sm:px-6 sm:py-3 border-b border-[var(--border-subtle)] bg-[var(--surface-sub)] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shrink-0">
            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 sm:pb-0">
              <button
                type="button"
                onClick={() => {
                  setTab('all');
                  setSelectedId(null);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                  tab === 'all'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-[var(--surface-2)] text-[var(--text-2)] hover:bg-[var(--surface-hover)] hover:text-[var(--text)]'
                }`}
              >
                همه ({toPersianDigits(counts.all)})
              </button>
              <button
                type="button"
                onClick={() => {
                  setTab('pending');
                  setSelectedId(null);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                  tab === 'pending'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'bg-[var(--surface-2)] text-[var(--text-2)] hover:bg-[var(--surface-hover)] hover:text-[var(--text)]'
                }`}
              >
                در انتظار ({toPersianDigits(counts.pending)})
              </button>
              <button
                type="button"
                onClick={() => {
                  setTab('done');
                  setSelectedId(null);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                  tab === 'done'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-[var(--surface-2)] text-[var(--text-2)] hover:bg-[var(--surface-hover)] hover:text-[var(--text)]'
                }`}
              >
                انجام‌شده ({toPersianDigits(counts.done)})
              </button>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64 shrink-0">
              <Search className="w-4 h-4 text-[var(--text-muted)] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="جستجو در عنوان، فرستنده یا متن..."
                className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl pr-9 pl-3 py-1.5 sm:py-2 text-xs text-[var(--input-text)] placeholder-[var(--input-placeholder)] focus:outline-none focus:border-[var(--accent)]"
              />
            </div>
          </div>

          {/* Body: Master / Detail */}
          <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-3 sm:p-5">
            {isLoading && items.length === 0 ? (
              <div className="py-14 flex flex-col items-center justify-center gap-2.5 text-[var(--text-2)] text-xs sm:text-sm">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
                <span>در حال بارگذاری موارد کارتابل...</span>
              </div>
            ) : filteredItems.length === 0 && !selectedItem ? (
              <div className="py-14 flex flex-col items-center justify-center gap-3 text-center">
                <div className="w-12 h-12 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center text-[var(--text-muted)]">
                  <Inbox className="w-6 h-6" />
                </div>
                <p className="text-sm font-bold text-[var(--text)]">کارتابل شما خالی است</p>
                {searchQuery.trim() && (
                  <p className="text-xs text-[var(--text-2)]">
                    موردی مطابق با عبارت «{searchQuery.trim()}» یافت نشد.
                  </p>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-4 items-start">
                {/* Items List (hidden on mobile when an item is selected) */}
                <div
                  className={`${
                    selectedItem ? 'hidden md:block' : 'block'
                  } md:col-span-5 space-y-2`}
                >
                  {filteredItems.length === 0 ? (
                    <div className="p-6 rounded-2xl bg-[var(--surface-item)] border border-[var(--border)] text-center text-xs text-[var(--text-2)]">
                      کارتابل شما خالی است
                    </div>
                  ) : (
                    filteredItems.map((item) => {
                      const typeMeta = TYPE_META[item.type] || TYPE_META.system;
                      const statusMeta = STATUS_META[item.status] || STATUS_META.pending;
                      const TypeIcon = typeMeta.icon;
                      const relTime = formatRelativeTimeFa(item.createdAt);
                      const isSelected = selectedItem?.id === item.id;

                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleSelectItem(item)}
                          className={`w-full text-right p-3 rounded-2xl border transition-all cursor-pointer flex flex-col gap-2 ${
                            isSelected
                              ? 'bg-indigo-600/15 border-indigo-500/70 shadow-md'
                              : 'bg-[var(--surface-item)] border-[var(--border)] hover:border-[var(--accent)]/60 hover:bg-[var(--surface-hover)]'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-start gap-2 min-w-0">
                              <div
                                className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 ${typeMeta.badgeClass}`}
                              >
                                <TypeIcon className="w-3.5 h-3.5" />
                              </div>
                              <div className="min-w-0">
                                <h4 className="text-xs sm:text-[13px] font-bold text-[var(--text)] break-words leading-snug">
                                  {item.title}
                                </h4>
                                <div className="flex items-center gap-1.5 mt-1 text-[11px] text-[var(--text-2)]">
                                  <User className="w-3 h-3 shrink-0" />
                                  <span className="truncate">{item.sender}</span>
                                </div>
                              </div>
                            </div>

                            <span
                              className={`px-2 py-0.5 rounded-full border text-[10px] font-bold shrink-0 ${statusMeta.badgeClass}`}
                            >
                              {statusMeta.label}
                            </span>
                          </div>

                          <div className="flex items-center justify-between gap-2 pt-1 border-t border-[var(--border-subtle)]">
                            <span
                              className={`px-2 py-0.5 rounded-md border text-[10px] font-semibold ${typeMeta.badgeClass}`}
                            >
                              {typeMeta.label}
                            </span>
                            {relTime && (
                              <span className="text-[10px] text-[var(--text-muted)] flex items-center gap-1 shrink-0">
                                <Clock className="w-3 h-3" />
                                <span>{relTime}</span>
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>

                {/* Detail Panel */}
                <div
                  className={`${
                    selectedItem ? 'block' : 'hidden md:block'
                  } md:col-span-7`}
                >
                  {selectedItem ? (
                    (() => {
                      const typeMeta = TYPE_META[selectedItem.type] || TYPE_META.system;
                      const statusMeta = STATUS_META[selectedItem.status] || STATUS_META.pending;
                      const TypeIcon = typeMeta.icon;
                      const relTime = formatRelativeTimeFa(selectedItem.createdAt);

                      return (
                        <div className="p-3.5 sm:p-5 rounded-2xl bg-[var(--surface-item)] border border-[var(--border)] space-y-4">
                          {/* Mobile Back Button */}
                          <button
                            type="button"
                            onClick={() => setSelectedId(null)}
                            className="md:hidden inline-flex items-center gap-1.5 text-xs font-bold text-indigo-300 hover:text-indigo-200 cursor-pointer"
                          >
                            <ArrowRight className="w-4 h-4" />
                            <span>بازگشت به لیست</span>
                          </button>

                          {/* Detail Header */}
                          <div className="space-y-2.5 pb-3 border-b border-[var(--border)]">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[11px] font-semibold ${typeMeta.badgeClass}`}
                                >
                                  <TypeIcon className="w-3.5 h-3.5" />
                                  <span>{typeMeta.label}</span>
                                </span>
                                <span
                                  className={`px-2.5 py-0.5 rounded-full border text-[11px] font-bold ${statusMeta.badgeClass}`}
                                >
                                  {statusMeta.label}
                                </span>
                              </div>
                              {relTime && (
                                <span className="text-[11px] text-[var(--text-muted)] flex items-center gap-1">
                                  <Clock className="w-3.5 h-3.5" />
                                  <span>{relTime}</span>
                                </span>
                              )}
                            </div>

                            <h3 className="text-sm sm:text-base font-extrabold text-[var(--text)] break-words leading-relaxed">
                              {selectedItem.title}
                            </h3>

                            <div className="text-xs text-[var(--text-2)] flex items-center gap-1.5">
                              <User className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" />
                              <span className="text-[var(--text-2)]">فرستنده:</span>
                              <span className="font-bold text-[var(--text)]">{selectedItem.sender}</span>
                            </div>
                          </div>

                          {/* Body Description */}
                          <div className="p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-xs sm:text-[13px] text-[var(--text-strong)] leading-relaxed whitespace-pre-wrap break-words">
                            {selectedItem.body || 'توضیح اضافی ثبت نشده است.'}
                          </div>

                          {/* Decision Note Input */}
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-[var(--text-2)] block">
                              توضیح تصمیم (در صورت رد الزامی است)
                            </label>
                            <textarea
                              ref={noteInputRef}
                              rows={3}
                              maxLength={500}
                              value={decisionNote}
                              onChange={(e) => setDecisionNote(e.target.value)}
                              placeholder="یادداشت یا دلیل تأیید / رد را وارد کنید..."
                              className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl p-2.5 sm:p-3 text-xs text-[var(--input-text)] placeholder-[var(--input-placeholder)] focus:outline-none focus:border-[var(--accent)] resize-none"
                            />
                          </div>

                          {/* Action Buttons */}
                          <div className="flex flex-wrap items-center gap-2 pt-1">
                            <button
                              type="button"
                              disabled={submittingAction !== null}
                              onClick={() => handleDecision('approve')}
                              className="flex-1 min-w-[96px] px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                            >
                              {submittingAction === 'approve' ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              )}
                              <span>تأیید</span>
                            </button>

                            <button
                              type="button"
                              disabled={submittingAction !== null}
                              onClick={() => handleDecision('reject')}
                              className="flex-1 min-w-[96px] px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                            >
                              {submittingAction === 'reject' ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <XCircle className="w-3.5 h-3.5" />
                              )}
                              <span>رد</span>
                            </button>

                            <button
                              type="button"
                              disabled={submittingAction !== null}
                              onClick={() => handleDecision('done')}
                              className="flex-1 min-w-[135px] px-3 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                            >
                              {submittingAction === 'done' ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <CheckCheck className="w-3.5 h-3.5" />
                              )}
                              <span>علامت‌گذاری انجام‌شده</span>
                            </button>

                            {selectedItem.targetModal && (
                              <button
                                type="button"
                                onClick={() => handleGoToTargetModal(selectedItem)}
                                className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-400/40 text-indigo-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                                <span>رفتن به بخش</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })()
                  ) : (
                    <div className="p-8 rounded-2xl bg-[var(--surface-item)] border border-[var(--border)] flex flex-col items-center justify-center text-center gap-2 text-[var(--text-2)]">
                      <LayoutDashboard className="w-7 h-7 text-[var(--text-muted)]" />
                      <p className="text-xs sm:text-sm font-semibold text-[var(--text-strong)]">
                        یک مورد را برای مشاهده جزئیات انتخاب کنید
                      </p>
                      <p className="text-[11px] text-[var(--text-2)]">
                        با کلیک روی هر ردیف، امکان تأیید، رد با توضیح یا رفتن به بخش مربوطه نمایش داده می‌شود.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 sm:px-6 border-t border-[var(--border)] bg-[var(--surface-header)] flex items-center justify-end shrink-0">
            <button
              type="button"
              onClick={closeModal}
              className="px-5 py-2 bg-[var(--surface-2)] hover:bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--text-strong)] rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              بستن
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

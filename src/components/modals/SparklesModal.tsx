import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, X, Send, Bot, Lightbulb, FileText, CalendarCheck } from 'lucide-react';
import { useDashboard } from '../../context/DashboardContext';

export const SparklesModal: React.FC = () => {
  const { activeModal, closeModal } = useDashboard();
  const [promptInput, setPromptInput] = useState('');
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (activeModal !== 'sparkles') return null;

  const handleAskAi = (presetText?: string) => {
    const query = presetText || promptInput;
    if (!query.trim()) return;

    setIsLoading(true);
    setAiResponse(null);

    setTimeout(() => {
      setIsLoading(false);
      if (query.includes('برنامه‌ریزی') || query.includes('امتحانات')) {
        setAiResponse('برنامه‌ریزی امتحانات شما: تاریخ شروع امتحانات از ۱۵ دی‌ماه می‌باشد. میانگین فاصله بین امتحانات ۲ روز است.');
      } else if (query.includes('خلاصه') || query.includes('جزوه')) {
        setAiResponse('خلاصه مبحث برنامه‌نویسی پیشرفته: مفاهیم شی‌گرایی شامل کپسوله‌سازی، وراثت، چندریختی و انتزاع آماده مطالعه می‌باشد.');
      } else {
        setAiResponse(`پاسخ هوشمند برای "${query}": با توجه به سوابق تحصیلی و معدل ۱۸.۴۵، پیشنهاد می‌شود واحد مربوطه را در نیمسال جاری اخذ نمایید.`);
      }
    }, 1000);
  };

  return (
    <AnimatePresence>
      <div
        dir="rtl"
        data-modal-backdrop
        onClick={(e) => {
          if (e.target === e.currentTarget) closeModal();
        }}
        className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-sm"
      >
        <motion.div
          role="dialog"
          aria-modal="true"
          data-modal-panel
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          className="w-full max-w-lg bg-[#1E293B] border border-slate-700/80 rounded-[28px] shadow-2xl text-slate-100 flex flex-col max-h-[calc(var(--vvh,100dvh)-16px)] max-w-[calc(100vw-16px)] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 pt-4 pb-3 sm:px-6 sm:pt-6 sm:pb-4 border-b border-slate-700/60 shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
                <Sparkles className="w-6 h-6 fill-amber-400/20" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-100">دستیار هوشمند تحصیلی</h2>
                <p className="text-xs text-slate-400">پاسخ‌گویی هوشمند به سوالات دانشگاهی</p>
              </div>
            </div>
            <button
              type="button"
              onClick={closeModal}
              className="p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-4 py-4 sm:px-6 sm:py-5 space-y-4">
            <p className="text-sm text-slate-300 leading-relaxed">
              چه کمکی می‌توانم در برنامه‌ریزی دروس، خلاصه‌نویسی یا تحلیل عملکرد تحصیلی به شما بکنم؟
            </p>

            {/* Quick Prompts */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                onClick={() => handleAskAi('برنامه‌ریزی امتحانات پایان‌ترم')}
                className="p-3 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 rounded-xl text-xs text-right text-slate-200 flex items-center gap-2.5 transition-colors cursor-pointer"
              >
                <CalendarCheck className="w-4 h-4 text-amber-400 shrink-0" />
                <span>برنامه‌ریزی امتحانات</span>
              </button>
              <button
                onClick={() => handleAskAi('خلاصه جزوه درس هوش مصنوعی')}
                className="p-3 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 rounded-xl text-xs text-right text-slate-200 flex items-center gap-2.5 transition-colors cursor-pointer"
              >
                <FileText className="w-4 h-4 text-sky-400 shrink-0" />
                <span>خلاصه مباحث دروس</span>
              </button>
            </div>

            {/* Response Area */}
            {isLoading && (
              <div className="p-4 bg-slate-900/60 rounded-2xl border border-slate-800 flex items-center justify-center gap-3 text-sm text-amber-400">
                <Bot className="w-5 h-5 animate-spin" />
                <span>در حال پردازش پاسخ هوشمند...</span>
              </div>
            )}

            {aiResponse && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-4 bg-slate-900/90 rounded-2xl border border-amber-500/30 text-sm text-slate-200 space-y-2"
              >
                <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs">
                  <Lightbulb className="w-4 h-4" />
                  <span>پاسخ دستیار هوشمند:</span>
                </div>
                <p className="leading-relaxed">{aiResponse}</p>
              </motion.div>
            )}

          </div>

          {/* Input Box */}
          <div className="px-4 pb-4 pt-3 sm:px-6 sm:pb-6 sm:pt-3 border-t border-slate-700/60 flex items-center gap-2 shrink-0">
            <input
              type="text"
              value={promptInput}
              onChange={(e) => setPromptInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAskAi()}
              placeholder="سوال یا درخواست خود را بنویسید..."
              className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500/80 transition-colors"
            />
            <button
              type="button"
              onClick={() => handleAskAi()}
              className="p-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl transition-colors font-bold cursor-pointer"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

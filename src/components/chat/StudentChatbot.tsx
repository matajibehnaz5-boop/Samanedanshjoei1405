import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bot, 
  X, 
  Send, 
  Sparkles, 
  Trash2, 
  User, 
  Loader2, 
  MessageSquare,
  HelpCircle,
  RefreshCw,
  ChevronDown
} from 'lucide-react';
import { useDashboard } from '../../context/DashboardContext';

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
}

export const StudentChatbot: React.FC = () => {
  const { language, t } = useDashboard();
  const isFa = language === 'fa';

  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'welcome_1',
      role: 'model',
      text: t('chatbotWelcome'),
      timestamp: new Date().toLocaleTimeString(isFa ? 'fa-IR' : 'en-US', { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom on new message
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, messages, scrollToBottom]);

  // Suggested questions
  const SUGGESTED_QUESTIONS = [
    t('chatbotSuggestion1'),
    t('chatbotSuggestion2'),
    t('chatbotSuggestion3'),
    t('chatbotSuggestion4'),
  ];

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputMessage).trim();
    if (!query || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString(isFa ? 'fa-IR' : 'en-US', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Build conversation history for API (excluding initial welcome greeting)
      const apiMessages = [...messages.filter(m => m.id !== 'welcome_1'), userMsg].map(m => ({
        role: m.role,
        text: m.text
      }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: apiMessages,
          language
        })
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const serverMsg = typeof data?.message === 'string' && data.message.trim() ? data.message : t('chatbotError');
        const errorMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'model',
          text: serverMsg,
          timestamp: new Date().toLocaleTimeString(isFa ? 'fa-IR' : 'en-US', { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, errorMsg]);
        return;
      }

      const replyText = data.reply || t('chatbotError');

      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: replyText,
        timestamp: new Date().toLocaleTimeString(isFa ? 'fa-IR' : 'en-US', { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      console.error('Failed to communicate with Gemini chatbot:', err);
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: t('chatbotError'),
        timestamp: new Date().toLocaleTimeString(isFa ? 'fa-IR' : 'en-US', { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = () => {
    setMessages([
      {
        id: Date.now().toString(),
        role: 'model',
        text: t('chatbotWelcome'),
        timestamp: new Date().toLocaleTimeString(isFa ? 'fa-IR' : 'en-US', { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  // Simple renderer for formatting basic markdown/bold/lists
  const renderFormattedText = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      // Bold text replacements
      const parts = line.split(/(\*\*.*?\*\*)/g);
      const renderedParts = parts.map((part, pIdx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={pIdx} className="font-bold text-amber-300">{part.slice(2, -2)}</strong>;
        }
        return part;
      });

      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        return (
          <div key={idx} className="flex items-start gap-1.5 my-1 ps-2">
            <span className="text-amber-400 font-bold">•</span>
            <span>{renderedParts}</span>
          </div>
        );
      }

      return (
        <React.Fragment key={idx}>
          {renderedParts}
          {idx < lines.length - 1 && <br />}
        </React.Fragment>
      );
    });
  };

  return (
    <>
      {/* FLOATING ACTION BUTTON (FAB) */}
      <div 
        className={`fixed z-40 bottom-4 sm:bottom-6 ${isFa ? 'left-4 sm:left-6' : 'right-4 sm:right-6'}`}
        dir={isFa ? 'rtl' : 'ltr'}
      >
        <motion.button
          onClick={() => setIsOpen(!isOpen)}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          className="relative w-14 h-14 rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-slate-950 shadow-2xl shadow-amber-500/40 border-2 border-amber-300/40 flex items-center justify-center cursor-pointer transition-all group"
          aria-label={t('chatbotTitle')}
        >
          {/* Animated Glow Halo */}
          <span className="absolute -inset-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 opacity-40 blur-md group-hover:opacity-75 transition-opacity" />

          <div className="relative z-10 flex items-center justify-center">
            {isOpen ? (
              <X className="w-6 h-6 text-slate-950" />
            ) : (
              <>
                <Bot className="w-6 h-6 text-slate-950" />
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-[#101726] animate-pulse" />
              </>
            )}
          </div>
        </motion.button>
      </div>

      {/* FLOATING CHAT WINDOW */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className={`fixed z-50 bottom-20 sm:bottom-24 ${
              isFa ? 'left-3 sm:left-6' : 'right-3 sm:right-6'
            } w-[calc(100vw-1.5rem)] sm:w-[420px] max-w-full h-[540px] max-h-[80vh] bg-[#161F2E] border border-amber-500/30 rounded-3xl shadow-2xl overflow-hidden flex flex-col text-white font-['Vazirmatn',sans-serif]`}
            dir={isFa ? 'rtl' : 'ltr'}
          >
            {/* Top Amber Decorative Bar */}
            <div className="h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 w-full shrink-0" />

            {/* CHAT HEADER */}
            <div className="p-3.5 sm:p-4 bg-[#111827] border-b border-white/10 flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500/20 to-orange-500/30 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 shadow-inner">
                  <Sparkles className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                    <span>{t('chatbotTitle')}</span>
                    <span className="px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-[10px] font-mono border border-amber-500/30">
                      Gemini AI
                    </span>
                  </h3>
                  <p className="text-[11px] text-[#BBC1D1]">{t('chatbotSubtitle')}</p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={handleClearHistory}
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-white/5 transition-colors cursor-pointer"
                  title={t('chatbotClearHistory')}
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                  title={t('close')}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* CHAT THREAD MESSAGES */}
            <div className="flex-1 p-3.5 sm:p-4 overflow-y-auto space-y-4 custom-scrollbar bg-[#161F2E]">
              {messages.map((msg) => {
                const isUser = msg.role === 'user';

                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex items-start gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
                  >
                    {/* Avatar */}
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${
                      isUser
                        ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                        : 'bg-[#1E293B] border-white/10 text-amber-400'
                    }`}>
                      {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                    </div>

                    {/* Bubble */}
                    <div className={`max-w-[80%] rounded-2xl p-3 text-xs leading-relaxed ${
                      isUser
                        ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 text-white rounded-tr-none'
                        : 'bg-[#1E293B] border border-white/10 text-slate-200 rounded-tl-none shadow-md'
                    }`}>
                      <div className="whitespace-pre-wrap">
                        {renderFormattedText(msg.text)}
                      </div>

                      <div className={`text-[10px] text-slate-400 mt-1.5 flex items-center ${isUser ? 'justify-start' : 'justify-end'}`}>
                        <span>{msg.timestamp}</span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}

              {/* Typing Indicator */}
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-start gap-2.5"
                >
                  <div className="w-8 h-8 rounded-xl bg-[#1E293B] border border-white/10 flex items-center justify-center text-amber-400 shrink-0">
                    <Bot className="w-4 h-4 animate-spin" />
                  </div>

                  <div className="bg-[#1E293B] border border-white/10 rounded-2xl rounded-tl-none p-3 text-xs text-amber-300 flex items-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                    <span>{t('chatbotThinking')}</span>
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* SUGGESTED QUESTIONS PILLS */}
            {messages.length <= 3 && !isLoading && (
              <div className="p-2.5 bg-[#111827]/80 border-t border-white/5 space-y-1.5 shrink-0">
                <div className="text-[10px] font-bold text-amber-400 flex items-center gap-1">
                  <HelpCircle className="w-3 h-3" />
                  <span>{t('chatbotQuickQuestions')}</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {SUGGESTED_QUESTIONS.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => handleSendMessage(q)}
                      className="px-2.5 py-1 rounded-lg bg-[#1E293B] hover:bg-amber-500/20 border border-white/10 hover:border-amber-500/30 text-[11px] text-slate-300 hover:text-amber-300 transition-all cursor-pointer text-start truncate max-w-full"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* CHAT INPUT AREA */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="p-3 bg-[#111827] border-t border-white/10 flex items-center gap-2 shrink-0"
            >
              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder={t('chatbotInputPlaceholder')}
                disabled={isLoading}
                className="flex-1 bg-[#1E293B] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-amber-500 transition-colors"
              />

              <button
                type="submit"
                disabled={!inputMessage.trim() || isLoading}
                className={`w-9 h-9 rounded-xl flex items-center justify-center text-slate-950 font-bold transition-all shrink-0 cursor-pointer ${
                  inputMessage.trim() && !isLoading
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:scale-105 active:scale-95 shadow-md shadow-amber-500/20'
                    : 'bg-slate-700/50 text-slate-500 cursor-not-allowed'
                }`}
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

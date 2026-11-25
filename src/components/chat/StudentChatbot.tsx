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
import { useI18n } from '../../context/DashboardContext';

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
}

export const StudentChatbot: React.FC = React.memo(() => {
  const { language, t } = useI18n();
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
        className={`fixed z-40 bottom-3 sm:bottom-6 ${isFa ? 'left-3 sm:left-6' : 'right-3 sm:right-6'} will-change-transform [transform:translateZ(0)] [contain:layout_style]`}
        dir={isFa ? 'rtl' : 'ltr'}
      >
        <motion.button
          onClick={() => setIsOpen(!isOpen)}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          className="relative w-[44px] h-[44px] sm:w-14 sm:h-14 rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-slate-950 shadow-2xl shadow-amber-500/40 border-2 border-amber-300/40 flex items-center justify-center cursor-pointer transition-all group"
          aria-label={t('chatbotTitle')}
        >
          {/* Animated Glow Halo */}
          <span className="absolute -inset-0.5 sm:-inset-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 opacity-40 blur-md group-hover:opacity-75 transition-opacity" />

          <div className="relative z-10 flex items-center justify-center">
            {isOpen ? (
              <X className="w-[18px] h-[18px] sm:w-6 sm:h-6 text-slate-950" />
            ) : (
              <>
                <Bot className="w-[18px] h-[18px] sm:w-6 sm:h-6 text-slate-950" />
                <span className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 rounded-full bg-emerald-400 border-2 border-[#101726] animate-pulse" />
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
            className={`fixed z-50 bottom-16 sm:bottom-24 ${
              isFa ? 'left-2.5 sm:left-6' : 'right-2.5 sm:right-6'
            } w-[calc(100vw-1.25rem)] sm:w-[420px] max-w-full h-[460px] sm:h-[540px] max-h-[82dvh] bg-[var(--chat-window-bg)] border border-[var(--chat-window-border)] rounded-xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col text-[var(--text)] font-['Vazirmatn',sans-serif]`}
            dir={isFa ? 'rtl' : 'ltr'}
          >
            {/* Top Decorative Bar */}
            <div className="h-1 bg-[image:var(--chat-topbar-bg)] w-full shrink-0" />

            {/* CHAT HEADER */}
            <div className="p-2.5 sm:p-4 bg-[var(--surface-chat-header)] border-b border-[var(--border)] flex items-center justify-between gap-2 sm:gap-3 shrink-0">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-[var(--status-amber-bg)] border border-[var(--status-amber-border)] flex items-center justify-center text-[var(--status-amber-text)] shrink-0 shadow-inner">
                  <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 animate-pulse" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-[14px] sm:text-sm font-bold text-[var(--text)] flex items-center gap-1.5 truncate">
                    <span className="truncate">{t('chatbotTitle')}</span>
                    <span className="px-1.5 py-0.5 rounded-md bg-[var(--status-amber-bg)] text-[var(--status-amber-text)] text-[10px] font-mono border border-[var(--status-amber-border)] shrink-0">
                      Gemini AI
                    </span>
                  </h3>
                  <p className="text-[11px] text-[var(--text-2)] truncate">{t('chatbotSubtitle')}</p>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={handleClearHistory}
                  className="min-w-[32px] min-h-[32px] sm:min-w-0 sm:min-h-0 flex items-center justify-center p-1.5 sm:p-2 rounded-xl text-[var(--text-muted)] hover:text-rose-400 hover:bg-white/5 transition-colors cursor-pointer"
                  title={t('chatbotClearHistory')}
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setIsOpen(false)}
                  className="min-w-[32px] min-h-[32px] sm:min-w-0 sm:min-h-0 flex items-center justify-center p-1.5 sm:p-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-white/5 transition-colors cursor-pointer"
                  title={t('close')}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* CHAT THREAD MESSAGES */}
            <div className="flex-1 p-2.5 sm:p-4 overflow-y-auto space-y-2.5 sm:space-y-4 custom-scrollbar bg-[var(--chat-window-bg)]">
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
                        ? 'bg-[var(--status-info-bg)] border-[var(--status-info-border)] text-[var(--accent)]'
                        : 'bg-[var(--chat-bot-bg)] border-[var(--chat-bot-border)] text-amber-400'
                    }`}>
                      {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                    </div>

                    {/* Bubble */}
                    <div className={`max-w-[80%] rounded-2xl p-3 text-xs leading-relaxed ${
                      isUser
                        ? 'chat-user-bubble bg-[image:var(--chat-user-bg)] border border-[var(--chat-user-border)] text-[var(--chat-user-text)] rounded-tr-none'
                        : 'bg-[var(--chat-bot-bg)] border border-[var(--chat-bot-border)] text-[var(--chat-bot-text)] rounded-tl-none shadow-md'
                    }`}>
                      <div className="whitespace-pre-wrap">
                        {renderFormattedText(msg.text)}
                      </div>

                      <div className={`text-[10px] opacity-75 mt-1.5 flex items-center ${isUser ? 'justify-start' : 'justify-end'}`}>
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
                  <div className="w-8 h-8 rounded-xl bg-[var(--chat-bot-bg)] border border-[var(--chat-bot-border)] flex items-center justify-center text-amber-400 shrink-0">
                    <Bot className="w-4 h-4 animate-spin" />
                  </div>

                  <div className="bg-[var(--chat-bot-bg)] border border-[var(--chat-bot-border)] rounded-2xl rounded-tl-none p-3 text-xs text-amber-300 flex items-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                    <span>{t('chatbotThinking')}</span>
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* SUGGESTED QUESTIONS PILLS */}
            {messages.length <= 3 && !isLoading && (
              <div className="p-2.5 bg-[var(--surface-chat-header)] border-t border-[var(--border)] space-y-1.5 shrink-0">
                <div className="text-[10px] font-bold text-amber-400 flex items-center gap-1">
                  <HelpCircle className="w-3 h-3" />
                  <span>{t('chatbotQuickQuestions')}</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {SUGGESTED_QUESTIONS.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => handleSendMessage(q)}
                      className="px-2.5 py-1 rounded-lg bg-[var(--chat-bot-bg)] hover:bg-[var(--surface-hover)] border border-[var(--border)] text-[11px] text-[var(--text-2)] hover:text-[var(--text)] transition-all cursor-pointer text-start truncate max-w-full"
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
              className="p-2 sm:p-3 bg-[var(--surface-chat-header)] border-t border-[var(--border)] flex items-center gap-2 shrink-0"
            >
              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder={t('chatbotInputPlaceholder')}
                disabled={isLoading}
                className="flex-1 h-[36px] sm:h-auto bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl px-3 py-1.5 sm:px-3.5 sm:py-2.5 text-sm sm:text-xs text-[var(--input-text)] placeholder-[var(--input-placeholder)] focus:outline-none focus:border-[var(--accent)] transition-colors min-w-0"
              />

              <button
                type="submit"
                disabled={!inputMessage.trim() || isLoading}
                className={`w-[36px] h-[36px] sm:w-9 sm:h-9 rounded-xl flex items-center justify-center font-bold transition-all shrink-0 cursor-pointer ${
                  inputMessage.trim() && !isLoading
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:scale-105 active:scale-95 shadow-md shadow-amber-500/20'
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
});

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
  HelpCircle 
} from 'lucide-react';
import { useI18n, useLayerActions, useLayerState, useViewport } from '../../context/DashboardContext';

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
}

export const StudentChatbot: React.FC = React.memo(() => {
  const { language, t } = useI18n();
  const { activeLayer } = useLayerState();
  const { openChat, closeChat } = useLayerActions();
  const { isKeyboardOpen } = useViewport();
  const isFa = language === 'fa';

  const isOpen = activeLayer === 'chat';
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

  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll only the messages container to bottom on new message, open, or keyboard toggle
  const scrollToBottom = useCallback((smooth = true) => {
    const container = messagesContainerRef.current;
    if (!container) return;
    requestAnimationFrame(() => {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: smooth ? 'smooth' : 'auto',
      });
    });
  }, []);

  useEffect(() => {
    if (isOpen) {
      scrollToBottom(messages.length > 1);
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, messages.length, isLoading, isKeyboardOpen, scrollToBottom]);

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
    scrollToBottom();

    try {
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
        scrollToBottom();
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
      scrollToBottom();
    } catch (err) {
      console.error('Failed to communicate with Gemini chatbot:', err);
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: t('chatbotError'),
        timestamp: new Date().toLocaleTimeString(isFa ? 'fa-IR' : 'en-US', { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
      scrollToBottom();
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

  const renderFormattedText = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, idx) => {
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
      {/* FLOATING ACTION BUTTON (FAB) - shown only when no layer is open and keyboard is closed */}
      {activeLayer === 'none' && !isKeyboardOpen && (
        <div 
          className={`fixed z-[var(--z-fab)] bottom-[calc(0.75rem+env(safe-area-inset-bottom,0px))] sm:bottom-[calc(1.5rem+env(safe-area-inset-bottom,0px))] ${isFa ? 'left-3 sm:left-6' : 'right-3 sm:right-6'} will-change-transform [transform:translateZ(0)]`}
          dir={isFa ? 'rtl' : 'ltr'}
        >
          <motion.button
            onClick={openChat}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            className="relative w-[44px] h-[44px] sm:w-14 sm:h-14 rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-slate-950 shadow-2xl shadow-amber-500/40 border-2 border-amber-300/40 flex items-center justify-center cursor-pointer transition-all group"
            aria-label={t('chatbotTitle')}
          >
            <span className="absolute -inset-0.5 sm:-inset-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 opacity-40 blur-md group-hover:opacity-75 transition-opacity" />
            <div className="relative z-10 flex items-center justify-center">
              <Bot className="w-[18px] h-[18px] sm:w-6 sm:h-6 text-slate-950" />
              <span className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 rounded-full bg-emerald-400 border-2 border-[#101726] animate-pulse" />
            </div>
          </motion.button>
        </div>
      )}

      {/* FLOATING CHAT WINDOW + BACKDROP OVERLAY */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Independent Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={closeChat}
              className="fixed inset-x-0 top-[var(--vv-top,0px)] h-[var(--vvh,100dvh)] z-[var(--z-chat)] bg-[var(--backdrop)] backdrop-blur-sm"
            />

            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label={t('chatbotTitle')}
              data-chatbot-window
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              onClick={(e) => e.stopPropagation()}
              className={`fixed z-[var(--z-chat)] inset-x-[8px] sm:inset-x-auto ${
                isFa ? 'sm:left-6' : 'sm:right-6'
              } w-auto sm:w-[380px] max-w-[calc(100vw-16px)] bg-[var(--chat-window-bg)] border border-[var(--chat-window-border)] rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col text-[var(--text)] font-['Vazirmatn',sans-serif]`}
              dir={isFa ? 'rtl' : 'ltr'}
            >
              {/* Top Decorative Bar */}
              <div className="h-[3px] bg-[image:var(--chat-topbar-bg)] w-full shrink-0" />

              {/* CHAT HEADER (fixed compact ~56px) */}
              <div className="h-[53px] min-h-[53px] px-2.5 sm:px-3.5 bg-[var(--surface-chat-header)] border-b border-[var(--border)] flex items-center justify-between gap-2 shrink-0">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-[var(--status-amber-bg)] border border-[var(--status-amber-border)] flex items-center justify-center text-[var(--status-amber-text)] shrink-0 shadow-inner">
                    <Sparkles className="w-4 h-4 animate-pulse" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-xs sm:text-sm font-bold text-[var(--text)] flex items-center gap-1.5 truncate leading-tight">
                      <span className="truncate">{t('chatbotTitle')}</span>
                      <span className="px-1.5 py-0.2 rounded bg-[var(--status-amber-bg)] text-[var(--status-amber-text)] text-[9px] font-mono border border-[var(--status-amber-border)] shrink-0">
                        Gemini
                      </span>
                    </h3>
                    <p className="text-[10px] text-[var(--text-2)] truncate leading-tight mt-0.5">{t('chatbotSubtitle')}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={handleClearHistory}
                    className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-rose-400 hover:bg-white/5 transition-colors cursor-pointer"
                    title={t('chatbotClearHistory')}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={closeChat}
                    aria-label="بستن"
                    className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-white/5 transition-colors cursor-pointer"
                    title={t('close')}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* CHAT THREAD MESSAGES (flex: 1, min-height: 0, overflow-y: auto) */}
              <div
                ref={messagesContainerRef}
                data-chatbot-messages
                className={`flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-2.5 sm:p-3 space-y-2 custom-scrollbar bg-[var(--chat-window-bg)] ${
                  !isKeyboardOpen ? 'min-h-[140px]' : ''
                }`}
              >
                {messages.map((msg) => {
                  const isUser = msg.role === 'user';

                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex items-start gap-2 min-w-0 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
                    >
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border ${
                        isUser
                          ? 'bg-[var(--status-info-bg)] border-[var(--status-info-border)] text-[var(--accent)]'
                          : 'bg-[var(--chat-bot-bg)] border-[var(--chat-bot-border)] text-amber-400'
                      }`}>
                        {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                      </div>

                      <div className={`max-w-[82%] min-w-0 rounded-xl p-2 sm:p-2.5 text-xs leading-relaxed break-words [overflow-wrap:anywhere] ${
                        isUser
                          ? 'chat-user-bubble bg-[image:var(--chat-user-bg)] border border-[var(--chat-user-border)] text-[var(--chat-user-text)] rounded-tr-none'
                          : 'bg-[var(--chat-bot-bg)] border border-[var(--chat-bot-border)] text-[var(--chat-bot-text)] rounded-tl-none shadow-sm'
                      }`}>
                        <div className="whitespace-pre-wrap">
                          {renderFormattedText(msg.text)}
                        </div>

                        <div className={`text-[9px] opacity-75 mt-1 flex items-center ${isUser ? 'justify-start' : 'justify-end'}`}>
                          <span>{msg.timestamp}</span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}

                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-start gap-2"
                  >
                    <div className="w-7 h-7 rounded-lg bg-[var(--chat-bot-bg)] border border-[var(--chat-bot-border)] flex items-center justify-center text-amber-400 shrink-0">
                      <Bot className="w-3.5 h-3.5 animate-spin" />
                    </div>

                    <div className="bg-[var(--chat-bot-bg)] border border-[var(--chat-bot-border)] rounded-xl rounded-tl-none p-2 text-xs text-amber-300 flex items-center gap-1.5">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                      <span>{t('chatbotThinking')}</span>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* SUGGESTED QUESTIONS PILLS - single compact horizontal row, hidden when keyboard is open */}
              {messages.length <= 3 && !isLoading && !isKeyboardOpen && (
                <div
                  data-chatbot-suggestions
                  aria-label={t('chatbotQuickQuestions')}
                  className="px-2 py-1.5 bg-[var(--surface-chat-header)] border-t border-[var(--border)] shrink-0"
                >
                  <div className="flex items-center overflow-x-auto gap-1.5 no-scrollbar whitespace-nowrap">
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-400 shrink-0 pe-0.5">
                      <HelpCircle className="w-3 h-3 shrink-0" />
                    </span>
                    {SUGGESTED_QUESTIONS.map((q, i) => (
                      <button
                        key={i}
                        type="button"
                        data-compact-chip
                        onClick={() => handleSendMessage(q)}
                        className="h-[26px] px-2.5 py-1 rounded-lg bg-[var(--chat-bot-bg)] hover:bg-[var(--surface-hover)] border border-[var(--border)] text-[11px] leading-none text-[var(--text-2)] hover:text-[var(--text)] transition-all cursor-pointer shrink-0 flex items-center"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* CHAT INPUT AREA (fixed compact ~52px, flex-shrink: 0) */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="min-h-[52px] px-[8px] py-[7px] pb-[calc(7px+env(safe-area-inset-bottom,0px))] sm:px-2.5 sm:py-[7px] sm:pb-[calc(7px+env(safe-area-inset-bottom,0px))] bg-[var(--surface-chat-header)] border-t border-[var(--border)] flex items-center gap-2 shrink-0"
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder={t('chatbotInputPlaceholder')}
                  disabled={isLoading}
                  onFocus={() => setTimeout(() => scrollToBottom(false), 250)}
                  className="flex-1 h-[38px] bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl px-3 py-1.5 text-xs sm:text-sm text-[var(--input-text)] placeholder-[var(--input-placeholder)] focus:outline-none focus:border-[var(--accent)] transition-colors min-w-0"
                />

                <button
                  type="submit"
                  disabled={!inputMessage.trim() || isLoading}
                  className={`w-[38px] h-[38px] rounded-xl flex items-center justify-center font-bold transition-all shrink-0 cursor-pointer ${
                    inputMessage.trim() && !isLoading
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:scale-105 active:scale-95 shadow-md shadow-amber-500/20'
                      : 'bg-slate-700/50 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
});

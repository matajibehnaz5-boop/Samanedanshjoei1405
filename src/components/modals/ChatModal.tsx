import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, X, Send } from 'lucide-react';
import { useChat, useModalActions, useModalState } from '../../context/DashboardContext';
import { UserAvatar } from '../UserAvatar';

export const ChatModal: React.FC = React.memo(() => {
  const { activeModal } = useModalState();
  const { closeModal } = useModalActions();
  const { messages, addChatMessage } = useChat();
  const [inputText, setInputText] = useState('');

  if (activeModal !== 'chat') return null;

  const handleSend = () => {
    if (inputText.trim()) {
      addChatMessage(inputText);
      setInputText('');
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 pb-[12vh] sm:pb-[8vh] bg-[var(--backdrop)] backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          className="w-full max-w-lg bg-[var(--surface)] border border-[var(--border-strong)] rounded-[28px] p-6 shadow-2xl text-[var(--text)] max-h-[85dvh] overflow-y-auto flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-[var(--border)] shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-[var(--surface-2)] text-[var(--text-strong)] rounded-xl border border-[var(--border)]">
                <MessageSquare className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-[var(--text)]">گفتگو و پشتیبانی آموزشی</h2>
                <p className="text-xs text-[var(--text-2)]">ارتباط مستقیم با اساتید و آموزش</p>
              </div>
            </div>
            <button
              onClick={closeModal}
              className="p-2 rounded-full hover:bg-[var(--surface-hover)] text-[var(--text-muted)] hover:text-[var(--text)] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 my-4 space-y-3 overflow-y-auto max-h-[50vh] pr-1">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex items-start gap-2.5 ${msg.isMe ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <UserAvatar
                  size="xs"
                  avatarUrl={msg.isMe ? undefined : msg.avatar}
                  name={msg.sender}
                  className="mt-1"
                />
                <div
                  className={`max-w-[78%] p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                    msg.isMe
                      ? 'bg-[var(--accent-primary)] text-[var(--on-accent)] rounded-tr-none shadow-md'
                      : 'bg-[var(--surface-item)] border border-[var(--border)] text-[var(--text-strong)] rounded-tl-none'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span
                      className={`font-bold text-[11px] ${
                        msg.isMe ? 'text-white/90' : 'text-[var(--text)]'
                      }`}
                    >
                      {msg.sender} {msg.role && `(${msg.role})`}
                    </span>
                    <span
                      className={`text-[10px] dir-ltr ${
                        msg.isMe ? 'text-white/75' : 'text-[var(--text-muted)]'
                      }`}
                    >
                      {msg.time}
                    </span>
                  </div>
                  <p>{msg.text}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Send Input */}
          <div className="pt-3 border-t border-[var(--border)] flex items-center gap-2 shrink-0">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="پیام خود را ارسال کنید..."
              className="flex-1 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl px-4 py-2.5 text-sm text-[var(--input-text)] placeholder-[var(--input-placeholder)] focus:outline-none focus:border-[var(--accent)] transition-colors"
            />
            <button
              onClick={handleSend}
              className="p-2.5 bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-[var(--on-accent)] rounded-xl font-bold transition-colors cursor-pointer"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
});

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, X, Send } from 'lucide-react';
import { useDashboard } from '../../context/DashboardContext';
import { UserAvatar } from '../UserAvatar';

export const ChatModal: React.FC = () => {
  const { activeModal, closeModal, messages, addChatMessage } = useDashboard();
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
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          className="w-full max-w-lg bg-[#1E293B] border border-slate-700/80 rounded-t-[28px] sm:rounded-[28px] p-6 shadow-2xl text-slate-100 max-h-[85vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-700/60 shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-slate-800 text-slate-200 rounded-xl border border-slate-700">
                <MessageSquare className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-100">گفتگو و پشتیبانی آموزشی</h2>
                <p className="text-xs text-slate-400">ارتباط مستقیم با اساتید و آموزش</p>
              </div>
            </div>
            <button
              onClick={closeModal}
              className="p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
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
                      ? 'bg-indigo-600 text-white rounded-tr-none shadow-md'
                      : 'bg-slate-900/90 border border-slate-800 text-slate-200 rounded-tl-none'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-bold text-[11px] text-slate-300">
                      {msg.sender} {msg.role && `(${msg.role})`}
                    </span>
                    <span className="text-[10px] text-slate-400 dir-ltr">{msg.time}</span>
                  </div>
                  <p>{msg.text}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Send Input */}
          <div className="pt-3 border-t border-slate-800/80 flex items-center gap-2 shrink-0">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="پیام خود را ارسال کنید..."
              className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
            <button
              onClick={handleSend}
              className="p-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-colors cursor-pointer"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

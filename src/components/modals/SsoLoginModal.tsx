import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, X, CheckCircle2, Building2, Key, ArrowRight } from 'lucide-react';
import { useDashboard } from '../../context/DashboardContext';

export const SsoLoginModal: React.FC = () => {
  const { activeModal, closeModal, handleSsoLogin, studentProfile } = useDashboard();
  const [selectedIdP, setSelectedIdP] = useState('central');
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  if (activeModal !== 'sso') return null;

  const handleStartSso = () => {
    setIsAuthenticating(true);
    setTimeout(() => {
      setIsAuthenticating(false);
      handleSsoLogin(studentProfile.name);
    }, 1200);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-[#0F172A]/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="w-full max-w-lg bg-[#1C2436] border border-white/[0.08] rounded-t-[30px] sm:rounded-[30px] p-6 shadow-2xl text-white max-h-[85vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#232D42] rounded-2xl border border-white/[0.08] flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5 text-white stroke-[2] icon-white-glow" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">درگاه ورود (SSO)</h2>
                <p className="text-xs text-[#BBC1D1]">سامانه احراز هویت متمرکز دانشگاهی</p>
              </div>
            </div>
            <button
              onClick={closeModal}
              className="p-2 rounded-full hover:bg-white/10 text-[#BBC1D1] hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5 text-white stroke-[2] icon-white-glow" />
            </button>
          </div>

          {/* IdP Selection */}
          <div className="mt-5 space-y-3">
            <p className="text-xs font-bold text-[#BBC1D1] uppercase tracking-wider">
              سرویس‌دهنده هویت یکپارچه را انتخاب کنید:
            </p>

            <label
              onClick={() => setSelectedIdP('central')}
              className={`p-4 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                selectedIdP === 'central'
                  ? 'bg-[#35D07F]/15 border-[#35D07F]/50 text-white'
                  : 'bg-[#232D42] border-white/[0.08] text-[#BBC1D1] hover:bg-[#232D42]/80'
              }`}
            >
              <div className="flex items-center gap-3">
                <Building2 className="w-5 h-5 text-white shrink-0 stroke-[2] icon-white-glow" />
                <div>
                  <h4 className="text-sm font-bold text-white">سامانه مرکزی دولت و علوم (پنجره واحد)</h4>
                  <p className="text-xs text-[#BBC1D1]">ورود بدون نیاز به رمز عبور مجدد</p>
                </div>
              </div>
              <input
                type="radio"
                name="idp"
                checked={selectedIdP === 'central'}
                onChange={() => setSelectedIdP('central')}
                className="w-4 h-4 accent-[#35D07F]"
              />
            </label>

            <label
              onClick={() => setSelectedIdP('university')}
              className={`p-4 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                selectedIdP === 'university'
                  ? 'bg-[#35D07F]/15 border-[#35D07F]/50 text-white'
                  : 'bg-[#232D42] border-white/[0.08] text-[#BBC1D1] hover:bg-[#232D42]/80'
              }`}
            >
              <div className="flex items-center gap-3">
                <Key className="w-5 h-5 text-white shrink-0 stroke-[2] icon-white-glow" />
                <div>
                  <h4 className="text-sm font-bold text-white">سرور CAS دانشکده فنی و مهندسی</h4>
                  <p className="text-xs text-[#BBC1D1]">احراز هویت توکن امنیتی CAS/OAuth2</p>
                </div>
              </div>
              <input
                type="radio"
                name="idp"
                checked={selectedIdP === 'university'}
                onChange={() => setSelectedIdP('university')}
                className="w-4 h-4 accent-[#35D07F]"
              />
            </label>
          </div>

          {/* User Account Profile Preview (Only if logged in / profile exists) */}
          {studentProfile.name ? (
            <div className="mt-5 p-4 bg-[#232D42] rounded-2xl border border-white/[0.08] text-xs space-y-1.5">
              <span className="text-[#BBC1D1] block">پروفایل شناسایی شده:</span>
              <div className="font-bold text-white text-sm">{studentProfile.name}</div>
              <div className="text-[#BBC1D1]">{studentProfile.field} | {studentProfile.institute}</div>
            </div>
          ) : null}

          {/* Login Action Button */}
          <div className="mt-6 pt-4 border-t border-white/[0.08] flex items-center justify-between gap-3">
            <button
              onClick={closeModal}
              className="px-5 py-2.5 bg-[#232D42] hover:bg-[#232D42]/80 text-[#BBC1D1] hover:text-white rounded-full text-sm font-medium transition-colors cursor-pointer"
            >
              انصراف
            </button>

            <button
              onClick={handleStartSso}
              disabled={isAuthenticating}
              className="flex-1 py-2.5 bg-[#35D07F] hover:bg-[#35D07F]/90 text-white rounded-full text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#35D07F]/20 hover:scale-[1.03]"
            >
              {isAuthenticating ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>در حال تایید هویت...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5 text-white stroke-[2] icon-white-glow" />
                  <span>تأیید و ورود یکپارچه SSO</span>
                  <ArrowRight className="w-4 h-4 text-white stroke-[2] icon-white-glow rotate-180" />
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};


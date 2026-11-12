import React from 'react';
import { X, ChevronDown, MoreVertical } from 'lucide-react';
import { useDashboard } from '../context/DashboardContext';

export const AppBar: React.FC = () => {
  const { setActiveModal, showToast } = useDashboard();

  return (
    <header className="sticky top-0 z-30 w-full bg-[#0F172A] border-b border-white/[0.08] px-4 py-2.5 shadow-md">
      <div className="max-w-md mx-auto flex items-center justify-between">
        
        {/* Left Side: Close (X) Icon */}
        <button
          onClick={() => {
            showToast('پنل دانشجویی بازنشانی شد');
            setActiveModal('close_confirm');
          }}
          aria-label="بستن"
          className="p-2 rounded-full text-[#BBC1D1] hover:text-white hover:bg-white/10 active:scale-95 transition-all duration-200 cursor-pointer"
        >
          <X className="w-5 h-5 text-white stroke-[2] icon-white-glow" />
        </button>

        {/* Center: Subtitle Only */}
        <div className="flex items-center justify-center text-center">
          <span className="text-xs font-mono text-[#35D07F] tracking-wider dir-ltr select-none font-semibold">
            oneapp.dev
          </span>
        </div>

        {/* Right Side: Dropdown Arrow & Three-Dot Menu */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveModal('dropdown')}
            aria-label="انتخاب موسسه"
            className="p-2 rounded-full text-[#BBC1D1] hover:text-white hover:bg-white/10 active:scale-95 transition-all duration-200 cursor-pointer"
          >
            <ChevronDown className="w-5 h-5 text-white stroke-[2] icon-white-glow" />
          </button>

          <button
            onClick={() => setActiveModal('three_dot')}
            aria-label="منوی بیشتر"
            className="p-2 rounded-full text-[#BBC1D1] hover:text-white hover:bg-white/10 active:scale-95 transition-all duration-200 cursor-pointer"
          >
            <MoreVertical className="w-5 h-5 text-white stroke-[2] icon-white-glow" />
          </button>
        </div>

      </div>
    </header>
  );
};


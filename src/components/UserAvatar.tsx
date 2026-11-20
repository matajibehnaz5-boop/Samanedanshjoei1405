import React, { useState, useRef, useEffect } from 'react';
import { Camera, User as UserIcon } from 'lucide-react';
import { useAuth, useI18n, useToastActions } from '../context/DashboardContext';

export interface UserAvatarProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  avatarUrl?: string;
  name?: string;
  allowUpload?: boolean;
  showStatus?: boolean;
  className?: string;
  onClick?: () => void;
  title?: string;
}

export const UserAvatar: React.FC<UserAvatarProps> = React.memo(({
  size = 'md',
  avatarUrl,
  name,
  allowUpload = false,
  showStatus = false,
  className = '',
  onClick,
  title,
}) => {
  const { studentProfile, updateStudentProfile } = useAuth();
  const { showToast } = useToastActions();
  const { language } = useI18n();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageError, setImageError] = useState(false);

  // Determine current active avatar URL
  const currentAvatar = avatarUrl !== undefined ? avatarUrl : studentProfile?.avatar;
  const currentName = name !== undefined ? name : studentProfile?.name;

  // Reset image error if avatar URL changes
  useEffect(() => {
    setImageError(false);
  }, [currentAvatar]);

  // Compute size-specific styles
  const sizeMap = {
    xs: {
      box: 'w-[30px] h-[30px] min-w-[30px] min-h-[30px] sm:w-7 sm:h-7 sm:min-w-[28px] sm:min-h-[28px]',
      text: 'text-xs',
      icon: 'w-3.5 h-3.5',
      uploadBtn: 'w-4 h-4 -bottom-1 -left-1 p-0.5',
      uploadIcon: 'w-2.5 h-2.5',
      status: 'w-2 h-2 -bottom-0.5 -right-0.5',
    },
    sm: {
      box: 'w-[36px] h-[36px] sm:w-9 sm:h-9 min-w-[36px] min-h-[36px]',
      text: 'text-xs sm:text-sm',
      icon: 'w-4 h-4',
      uploadBtn: 'w-5 h-5 -bottom-1 -left-1 p-1',
      uploadIcon: 'w-3 h-3',
      status: 'w-2.5 h-2.5 -bottom-0.5 -right-0.5',
    },
    md: {
      box: 'w-[38px] h-[38px] sm:w-11 sm:h-11 min-w-[38px] min-h-[38px]',
      text: 'text-sm sm:text-base',
      icon: 'w-5 h-5',
      uploadBtn: 'w-6 h-6 -bottom-1 -left-1 p-1',
      uploadIcon: 'w-3.5 h-3.5',
      status: 'w-3 h-3 -bottom-0.5 -right-0.5',
    },
    lg: {
      box: 'w-[42px] h-[42px] sm:w-16 sm:h-16 min-w-[42px] min-h-[42px] sm:min-w-[64px] sm:min-h-[64px]',
      text: 'text-base sm:text-2xl',
      icon: 'w-5 h-5 sm:w-8 sm:h-8',
      uploadBtn: 'w-5 h-5 sm:w-7 sm:h-7 -bottom-1 -left-1 sm:-bottom-1.5 sm:-left-1.5 p-1 sm:p-1.5',
      uploadIcon: 'w-3 h-3 sm:w-4 sm:h-4',
      status: 'w-3 h-3 sm:w-4 sm:h-4 -bottom-0.5 -right-0.5',
    },
    xl: {
      box: 'w-20 h-20 sm:w-24 sm:h-24 min-w-[80px] min-h-[80px]',
      text: 'text-2xl sm:text-3xl',
      icon: 'w-10 h-10',
      uploadBtn: 'w-8 h-8 -bottom-2 -left-2 p-2',
      uploadIcon: 'w-4 h-4',
      status: 'w-5 h-5 -bottom-1 -right-1',
    },
  };

  const currentSize = sizeMap[size] || sizeMap.md;

  // Compute initial letter for neutral genderless avatar
  const getInitial = (rawName?: string): string => {
    if (!rawName) return 'د'; // «د» برای «دانشجوی گرامی»
    const trimmed = rawName.trim();
    if (trimmed === 'دانشجوی سامانه' || trimmed === 'دانشجوی جدید' || trimmed === 'کاربر جدید' || trimmed === 'دانشجو') {
      return 'د';
    }
    return trimmed.charAt(0).toUpperCase() || 'د';
  };

  // Image Upload handler with canvas downscale to preserve quality and ensure optimal storage
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast(language === 'fa' ? 'لطفاً یک فایل تصویری معتبر انتخاب کنید' : 'Please select a valid image file');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      showToast(language === 'fa' ? 'حجم تصویر نباید بیشتر از ۸ مگابایت باشد' : 'Image size must be less than 8MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Resize onto canvas (max 320x320)
        const canvas = document.createElement('canvas');
        const maxDim = 320;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

          // Check avatar size (max 200 KB)
          const approxBytes = Math.round((dataUrl.length * 3) / 4);
          if (approxBytes > 200 * 1024) {
            showToast(language === 'fa' ? 'حجم تصویر نباید بیشتر از ۲۰۰ کیلوبایت باشد' : 'Image size must not exceed 200 KB');
            return;
          }

          setImageError(false);
          updateStudentProfile({ avatar: dataUrl });
          showToast(language === 'fa' ? 'عکس پروفایل با موفقیت تغییر یافت' : 'Profile photo updated successfully');
        }
      };
      if (typeof event.target?.result === 'string') {
        img.src = event.target.result;
      }
    };
    reader.readAsDataURL(file);

    // Reset input so re-selecting same file triggers change
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const initialChar = getInitial(currentName);
  const hasValidPhoto = Boolean(currentAvatar && !imageError);

  return (
    <div className={`relative inline-block select-none shrink-0 ${className}`}>
      {/* Avatar Container */}
      <div
        onClick={onClick}
        title={title || currentName || (language === 'fa' ? 'کاربر' : 'User')}
        className={`
          ${currentSize.box}
          rounded-full overflow-hidden flex items-center justify-center
          border-2 border-indigo-400/40 shadow-md ring-1 ring-white/10
          ${onClick ? 'cursor-pointer hover:opacity-90 hover:scale-105 active:scale-95 transition-all' : ''}
          ${!hasValidPhoto ? 'bg-gradient-to-tr from-indigo-600 via-blue-600 to-sky-500 text-white font-extrabold shadow-indigo-600/25' : 'bg-slate-800'}
        `}
      >
        {hasValidPhoto ? (
          <img
            src={currentAvatar}
            alt={currentName || 'User Avatar'}
            onError={() => setImageError(true)}
            className="w-full h-full object-cover rounded-full"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <span className={`${currentSize.text} tracking-tight drop-shadow-sm`}>
            {initialChar}
          </span>
        )}
      </div>

      {/* Online Status Indicator */}
      {showStatus && (
        <span
          className={`absolute ${currentSize.status} bg-emerald-500 rounded-full border-2 border-[#1E293B] shadow-[0_0_8px_#10B981] pointer-events-none z-10`}
          title={language === 'fa' ? 'وضعیت: آنلاین' : 'Status: Online'}
        />
      )}

      {/* Upload Photo Button Badge */}
      {allowUpload && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
            title={language === 'fa' ? 'تغییر عکس پروفایل' : 'Change profile photo'}
            aria-label={language === 'fa' ? 'تغییر عکس پروفایل' : 'Change profile photo'}
            className={`
              absolute ${currentSize.uploadBtn}
              bg-indigo-600 hover:bg-indigo-500 text-white rounded-full
              border-2 border-[#1E293B] shadow-lg
              flex items-center justify-center cursor-pointer
              transition-transform hover:scale-115 active:scale-90 z-20 group
            `}
          >
            <Camera className={`${currentSize.uploadIcon} group-hover:rotate-12 transition-transform`} />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png, image/jpeg, image/jpg, image/webp"
            className="hidden"
            onChange={handleFileChange}
          />
        </>
      )}
    </div>
  );
});

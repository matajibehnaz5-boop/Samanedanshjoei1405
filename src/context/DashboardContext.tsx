import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { ActiveModal, DashboardContextType, NotificationItem, ChatMessage, StudentProfile } from '../types';
import { api, type ApiUser, type ApiChatMessage } from '../lib/api';
import { translations, Language } from '../lib/translations';

const defaultProfile: StudentProfile = {
  name: '',
  studentId: '',
  field: 'مهندسی کامپیوتر',
  term: 'ترم ۵ - نیمسال اول ۱۴۰۵-۱۴۰۶',
  gpa: 18.45,
  creditsPassed: 82,
  creditsTotal: 140,
  institute: 'موسسه آموزشی نمونه',
  email: '',
  phone: '',
  avatar: '',
  role: 'student',
};

const defaultNotifications: NotificationItem[] = [
  {
    id: '1',
    title: 'تغییر زمان کلاس ساختمان داده',
    message: 'کلاس ساختمان داده استاد رضایی به روز سه‌شنبه ساعت ۱۴ انتقال یافت.',
    time: '۱۰ دقیقه پیش',
    read: false,
    type: 'academic',
  },
  {
    id: '2',
    title: 'انتشار نمرات پایان‌ترم',
    message: 'نمره درس هوش مصنوعی در سامانه ثبت گردید.',
    time: '۱ ساعت پیش',
    read: false,
    type: 'exam',
  },
  {
    id: '3',
    title: 'تأیید درخواست گواهی اشتغال',
    message: 'گواهی اشتغال به تحصیل شما صادر شد.',
    time: 'دیروز',
    read: true,
    type: 'system',
  },
];

function mapApiUserToProfile(user: ApiUser, prev: StudentProfile): StudentProfile {
  return {
    ...prev,
    name: user.name || prev.name,
    studentId: user.studentId || prev.studentId,
    email: user.email || prev.email,
    field: user.field || prev.field,
    term: user.term || prev.term,
    institute: user.institute || prev.institute,
    phone: user.phone || prev.phone,
    avatar: user.avatar || prev.avatar,
    gpa: typeof user.gpa === 'number' ? user.gpa : prev.gpa,
    creditsPassed: typeof user.creditsPassed === 'number' ? user.creditsPassed : prev.creditsPassed,
    creditsTotal: typeof user.creditsTotal === 'number' ? user.creditsTotal : prev.creditsTotal,
    role: user.role === 'admin' ? 'admin' : 'student',
  };
}

function mapApiMsgToChatMsg(msg: ApiChatMessage, currentUserId?: string): ChatMessage {
  const isMe = currentUserId ? msg.userId === currentUserId : false;
  let formattedTime = '';
  try {
    formattedTime = new Date(msg.createdAt).toLocaleTimeString('fa-IR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    formattedTime = '';
  }

  let mappedRole: 'استاد' | 'دانشجو' | 'آموزش' = 'دانشجو';
  if (msg.role === 'admin' || msg.role === 'آموزش') {
    mappedRole = 'آموزش';
  } else if (msg.role === 'استاد') {
    mappedRole = 'استاد';
  }

  return {
    id: String(msg.id),
    sender: msg.sender || (isMe ? 'من' : 'دانشجو'),
    avatar: msg.avatar || '',
    text: msg.text,
    time: formattedTime,
    isMe,
    role: mappedRole,
  };
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export const DashboardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>(defaultNotifications);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [studentProfile, setStudentProfile] = useState<StudentProfile>(defaultProfile);

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [loginMethod, setLoginMethod] = useState<'SSO' | 'FORM' | 'GOOGLE' | 'EMAIL' | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [instituteName, setInstituteName] = useState<string>('موسسه آموزشی نمونه');
  const [isCompactFrame, setIsCompactFrame] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState<'login' | 'dashboard'>('login');

  const lastMessageIdRef = useRef<number>(0);

  // Language management
  const [language, setLanguage] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('app_language');
      return saved === 'en' || saved === 'fa' ? saved : 'fa';
    } catch {
      return 'fa';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('app_language', language);
    } catch {
      // ignore
    }
    document.documentElement.dir = language === 'fa' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === 'fa' ? 'en' : 'fa'));
  };

  const t = (key: string, params?: Record<string, string | number>) => {
    const langDict = translations[language] || translations.fa;
    let text = (langDict as any)[key] || (translations.fa as any)[key] || key;
    if (params) {
      Object.entries(params).forEach(([paramKey, val]) => {
        text = text.replace(`{${paramKey}}`, String(val));
      });
    }
    return text;
  };

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  }, []);

  const closeModal = useCallback(() => setActiveModal(null), []);

  // 1. Session Restoration on App Load (Call GET /api/me)
  useEffect(() => {
    let isMounted = true;

    async function checkSession() {
      try {
        const { user } = await api.getMe();
        if (!isMounted) return;
        setCurrentUserId(user.id);
        setStudentProfile((prev) => mapApiUserToProfile(user, prev));
        setIsLoggedIn(true);
        setLoginMethod('FORM');
        setCurrentPage('dashboard');
      } catch {
        if (!isMounted) return;
        setIsLoggedIn(false);
        setCurrentUserId(null);
        setCurrentPage('login');
      } finally {
        if (isMounted) {
          setIsAuthLoading(false);
        }
      }
    }

    checkSession();

    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Chat Polling: Poll every 3 seconds (?after=<id>) when logged in and tab visible
  useEffect(() => {
    if (!isLoggedIn) {
      return;
    }

    let isSubscribed = true;

    async function fetchNewMessages() {
      if (!isLoggedIn || document.visibilityState === 'hidden') {
        return;
      }

      try {
        const afterParam = lastMessageIdRef.current > 0 ? lastMessageIdRef.current : undefined;
        const { messages: fetched } = await api.getMessages(afterParam);

        if (!isSubscribed || !fetched || fetched.length === 0) return;

        // Update lastMessageId
        const maxId = Math.max(...fetched.map((m) => m.id), lastMessageIdRef.current);
        lastMessageIdRef.current = maxId;

        setMessages((prev) => {
          const existingIds = new Set(prev.map((m) => m.id));
          const newFormatted = fetched
            .filter((m) => !existingIds.has(String(m.id)))
            .map((m) => mapApiMsgToChatMsg(m, currentUserId || undefined));

          if (newFormatted.length === 0) return prev;
          return [...prev, ...newFormatted];
        });
      } catch {
        // Silent catch during periodic polling
      }
    }

    // Initial fetch
    fetchNewMessages();

    // Polling interval
    const interval = setInterval(fetchNewMessages, 3000);

    // Visibility change listener
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchNewMessages();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      isSubscribed = false;
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isLoggedIn, currentUserId]);

  // 3. Profile Update
  const updateStudentProfile = useCallback(
    async (updated: Partial<StudentProfile>) => {
      // Base64 avatar size check (Limit to 200 KB)
      if (updated.avatar && updated.avatar.startsWith('data:')) {
        const approxBytes = Math.round((updated.avatar.length * 3) / 4);
        if (approxBytes > 200 * 1024) {
          const err = new Error('حجم تصویر نباید بیشتر از ۲۰۰ کیلوبایت باشد.');
          showToast('حجم تصویر نباید بیشتر از ۲۰۰ کیلوبایت باشد.');
          throw err;
        }
      }

      // Filter only allowed fields to send to /api/me
      const { user } = await api.updateMe({
        name: updated.name,
        studentId: updated.studentId,
        field: updated.field,
        term: updated.term,
        institute: updated.institute,
        phone: updated.phone,
        avatar: updated.avatar,
        gpa: updated.gpa,
        creditsPassed: updated.creditsPassed,
        creditsTotal: updated.creditsTotal,
      });

      setStudentProfile((prev) => mapApiUserToProfile(user, prev));
    },
    [showToast]
  );

  // 4. Change Password
  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    await api.changePassword({ currentPassword, newPassword });
  }, []);

  // 5. Add Chat Message
  const addChatMessage = useCallback(
    async (text: string) => {
      if (!text.trim()) return;

      try {
        const { message } = await api.sendMessage(text.trim());
        if (message.id > lastMessageIdRef.current) {
          lastMessageIdRef.current = message.id;
        }

        const newMsg = mapApiMsgToChatMsg(message, currentUserId || undefined);
        setMessages((prev) => {
          if (prev.some((m) => m.id === String(message.id))) return prev;
          return [...prev, newMsg];
        });
      } catch (err: any) {
        showToast(err.message || 'خطا در ارسال پیام');
        throw err;
      }
    },
    [currentUserId, showToast]
  );

  // 6. Login with Email/Password
  const loginWithEmailPass = useCallback(
    async (email: string, pass: string) => {
      try {
        const { user } = await api.login({ email, password: pass });
        setCurrentUserId(user.id);
        setStudentProfile((prev) => mapApiUserToProfile(user, prev));
        setIsLoggedIn(true);
        setLoginMethod('FORM');
        setCurrentPage('dashboard');
        closeModal();
        showToast(
          user.role === 'admin'
            ? 'ورود به عنوان مدیر سیستم (ادمین) با موفقیت انجام شد'
            : `ورود با ایمیل ${user.email} انجام شد`
        );
      } catch (err: any) {
        throw new Error(err.message || 'خطا در ورود به حساب کاربری');
      }
    },
    [closeModal, showToast]
  );

  // 7. Register with Email/Password
  const registerWithEmailPass = useCallback(
    async (email: string, pass: string, name: string, studentId?: string) => {
      try {
        const { user } = await api.register({
          email,
          password: pass,
          name,
          studentId,
        });
        setCurrentUserId(user.id);
        setStudentProfile((prev) => mapApiUserToProfile(user, prev));
        setIsLoggedIn(true);
        setLoginMethod('FORM');
        setCurrentPage('dashboard');
        closeModal();
        showToast(`حساب جدید با موفقیت ایجاد شد (${user.name})`);
      } catch (err: any) {
        throw new Error(err.message || 'خطا در ثبت‌نام حساب جدید');
      }
    },
    [closeModal, showToast]
  );

  // 8. Logout
  const handleLogout = useCallback(async () => {
    try {
      await api.logout();
    } catch {
      // proceed with local cleanup
    }
    setIsLoggedIn(false);
    setCurrentUserId(null);
    setLoginMethod(null);
    setCurrentPage('login');
    setStudentProfile(defaultProfile);
    lastMessageIdRef.current = 0;
    showToast('از حساب کاربری با موفقیت خارج شدید');
  }, [showToast]);

  // 9. SSO Login simulation
  const handleSsoLogin = useCallback(
    async (ssoName?: string) => {
      const currentName =
        studentProfile.name && studentProfile.name !== 'دانشجوی سامانه' ? studentProfile.name : '';
      const nameToSet = ssoName?.trim() || currentName || 'دانشجوی گرامی';

      setStudentProfile((prev) => ({
        ...prev,
        name: nameToSet,
      }));
      setIsLoggedIn(true);
      setLoginMethod('SSO');
      setCurrentPage('dashboard');
      closeModal();
      showToast(`ورود با موفقیت از طریق SSO انجام شد (${nameToSet})`);
    },
    [studentProfile.name, closeModal, showToast]
  );

  // 10. Legacy Form login helper
  const handleFormLogin = useCallback(
    (id: string, pass: string, nameInput?: string) => {
      if (id && pass) {
        let newName = studentProfile.name;
        if (nameInput && nameInput.trim()) {
          newName = nameInput.trim();
        } else if (id && isNaN(Number(id))) {
          newName = id.trim();
        } else if (!newName || newName === 'دانشجوی سامانه') {
          newName = 'دانشجوی گرامی';
        }

        setStudentProfile((prev) => ({
          ...prev,
          name: newName,
          studentId: !isNaN(Number(id)) ? id.trim() : prev.studentId,
        }));
        setIsLoggedIn(true);
        setLoginMethod('FORM');
        setCurrentPage('dashboard');
        closeModal();
        showToast(`ورود با موفقیت انجام شد (${newName})`);
        return true;
      }
      return false;
    },
    [studentProfile.name, studentProfile.studentId, closeModal, showToast]
  );

  // Fallback helper for legacy Google button references if triggered
  const loginWithGoogle = useCallback(async () => {
    setActiveModal('form_login');
  }, []);

  const notificationCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );
  const chatCount = useMemo(() => messages.filter((m) => !m.isMe).length, [messages]);

  const markNotificationsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const contextValue = useMemo(
    () => ({
      activeModal,
      setActiveModal,
      closeModal,
      notificationCount,
      chatCount,
      notifications,
      markNotificationsRead,
      messages,
      addChatMessage,
      studentProfile,
      updateStudentProfile,
      isLoggedIn,
      loginMethod,
      handleSsoLogin,
      handleFormLogin,
      loginWithEmailPass,
      registerWithEmailPass,
      changePassword,
      loginWithGoogle,
      handleLogout,
      isAuthLoading,
      toastMessage,
      showToast,
      instituteName,
      setInstituteName,
      isCompactFrame,
      setIsCompactFrame,
      currentPage,
      setCurrentPage,
      language,
      setLanguage,
      toggleLanguage,
      t,
    }),
    [
      activeModal,
      closeModal,
      notificationCount,
      chatCount,
      notifications,
      markNotificationsRead,
      messages,
      addChatMessage,
      studentProfile,
      updateStudentProfile,
      isLoggedIn,
      loginMethod,
      handleSsoLogin,
      handleFormLogin,
      loginWithEmailPass,
      registerWithEmailPass,
      changePassword,
      loginWithGoogle,
      handleLogout,
      isAuthLoading,
      toastMessage,
      showToast,
      instituteName,
      isCompactFrame,
      currentPage,
      language,
      toggleLanguage,
      t,
    ]
  );

  return (
    <DashboardContext.Provider value={contextValue}>{children}</DashboardContext.Provider>
  );
};

export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
};

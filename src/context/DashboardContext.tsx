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

// --- Granular Sub-Contexts (isolate frequent updates like toast, modal, chat polling) ---

interface I18nContextType {
  language: 'fa' | 'en';
  setLanguage: (lang: 'fa' | 'en') => void;
  toggleLanguage: () => void;
  t: (key: any, params?: Record<string, string | number>) => string;
}

interface ToastActionsContextType {
  showToast: (msg: string) => void;
}

interface ToastStateContextType {
  toastMessage: string | null;
}

interface ModalActionsContextType {
  setActiveModal: (modal: ActiveModal) => void;
  closeModal: () => void;
}

interface ModalStateContextType {
  activeModal: ActiveModal;
}

interface LayoutSettingsContextType {
  instituteName: string;
  setInstituteName: (name: string) => void;
  isCompactFrame: boolean;
  setIsCompactFrame: (compact: boolean | ((prev: boolean) => boolean)) => void;
}

interface AuthContextType {
  studentProfile: StudentProfile;
  updateStudentProfile: (updated: Partial<StudentProfile>) => Promise<void> | void;
  isLoggedIn: boolean;
  loginMethod: 'SSO' | 'FORM' | 'GOOGLE' | 'EMAIL' | null;
  handleSsoLogin: (ssoName?: string) => void;
  handleFormLogin: (id: string, pass: string, nameInput?: string) => boolean;
  loginWithEmailPass: (email: string, pass: string) => Promise<void>;
  registerWithEmailPass: (email: string, pass: string, name: string, studentId?: string) => Promise<void>;
  changePassword?: (currentPassword: string, newPassword: string) => Promise<void>;
  loginWithGoogle?: () => Promise<void>;
  handleLogout: () => void;
  isAuthLoading: boolean;
  currentPage: 'login' | 'dashboard';
  setCurrentPage: (page: 'login' | 'dashboard') => void;
  currentUserId: string | null;
}

interface NotificationsContextType {
  notifications: NotificationItem[];
  notificationCount: number;
  markNotificationsRead: () => void;
}

interface ChatContextType {
  messages: ChatMessage[];
  chatCount: number;
  addChatMessage: (text: string) => void;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);
const ToastActionsContext = createContext<ToastActionsContextType | undefined>(undefined);
const ToastStateContext = createContext<ToastStateContextType | undefined>(undefined);
const ModalActionsContext = createContext<ModalActionsContextType | undefined>(undefined);
const ModalStateContext = createContext<ModalStateContextType | undefined>(undefined);
const LayoutSettingsContext = createContext<LayoutSettingsContextType | undefined>(undefined);
const AuthContext = createContext<AuthContextType | undefined>(undefined);
const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);
const ChatContext = createContext<ChatContextType | undefined>(undefined);

const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
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

  const toggleLanguage = useCallback(() => {
    setLanguage((prev) => (prev === 'fa' ? 'en' : 'fa'));
  }, []);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>) => {
      const langDict = translations[language] || translations.fa;
      let text = (langDict as any)[key] || (translations.fa as any)[key] || key;
      if (params) {
        Object.entries(params).forEach(([paramKey, val]) => {
          text = text.replace(`{${paramKey}}`, String(val));
        });
      }
      return text;
    },
    [language]
  );

  const value = useMemo(
    () => ({ language, setLanguage, toggleLanguage, t }),
    [language, toggleLanguage, t]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const showToast = useCallback((msg: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToastMessage(msg);
    timerRef.current = setTimeout(() => {
      setToastMessage(null);
      timerRef.current = null;
    }, 3000);
  }, []);

  const actionsValue = useMemo(() => ({ showToast }), [showToast]);
  const stateValue = useMemo(() => ({ toastMessage }), [toastMessage]);

  return (
    <ToastActionsContext.Provider value={actionsValue}>
      <ToastStateContext.Provider value={stateValue}>{children}</ToastStateContext.Provider>
    </ToastActionsContext.Provider>
  );
};

const ModalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  const closeModal = useCallback(() => setActiveModal(null), []);

  const actionsValue = useMemo(() => ({ setActiveModal, closeModal }), [closeModal]);
  const stateValue = useMemo(() => ({ activeModal }), [activeModal]);

  return (
    <ModalActionsContext.Provider value={actionsValue}>
      <ModalStateContext.Provider value={stateValue}>{children}</ModalStateContext.Provider>
    </ModalActionsContext.Provider>
  );
};

const LayoutSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [instituteName, setInstituteName] = useState<string>('موسسه آموزشی نمونه');
  const [isCompactFrame, setIsCompactFrame] = useState<boolean>(true);

  const value = useMemo(
    () => ({ instituteName, setInstituteName, isCompactFrame, setIsCompactFrame }),
    [instituteName, isCompactFrame]
  );

  return <LayoutSettingsContext.Provider value={value}>{children}</LayoutSettingsContext.Provider>;
};

const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { showToast } = useToastActions();
  const { setActiveModal, closeModal } = useModalActions();

  const [studentProfile, setStudentProfile] = useState<StudentProfile>(defaultProfile);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [loginMethod, setLoginMethod] = useState<'SSO' | 'FORM' | 'GOOGLE' | 'EMAIL' | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState<'login' | 'dashboard'>('login');

  const studentProfileRef = useRef(studentProfile);
  studentProfileRef.current = studentProfile;

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

  // 3. Profile Update
  const updateStudentProfile = useCallback(
    async (updated: Partial<StudentProfile>) => {
      if (updated.avatar && updated.avatar.startsWith('data:')) {
        const approxBytes = Math.round((updated.avatar.length * 3) / 4);
        if (approxBytes > 200 * 1024) {
          const err = new Error('حجم تصویر نباید بیشتر از ۲۰۰ کیلوبایت باشد.');
          showToast('حجم تصویر نباید بیشتر از ۲۰۰ کیلوبایت باشد.');
          throw err;
        }
      }

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
    showToast('از حساب کاربری با موفقیت خارج شدید');
  }, [showToast]);

  // 9. SSO Login simulation
  const handleSsoLogin = useCallback(
    async (ssoName?: string) => {
      const profile = studentProfileRef.current;
      const currentName =
        profile.name && profile.name !== 'دانشجوی سامانه' ? profile.name : '';
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
    [closeModal, showToast]
  );

  // 10. Legacy Form login helper
  const handleFormLogin = useCallback(
    (id: string, pass: string, nameInput?: string) => {
      if (id && pass) {
        const profile = studentProfileRef.current;
        let newName = profile.name;
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
    [closeModal, showToast]
  );

  const loginWithGoogle = useCallback(async () => {
    setActiveModal('form_login');
  }, [setActiveModal]);

  const value = useMemo(
    () => ({
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
      currentPage,
      setCurrentPage,
      currentUserId,
    }),
    [
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
      currentPage,
      currentUserId,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

const NotificationsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>(defaultNotifications);

  const notificationCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  const markNotificationsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const value = useMemo(
    () => ({ notifications, notificationCount, markNotificationsRead }),
    [notifications, notificationCount, markNotificationsRead]
  );

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
};

const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isLoggedIn, currentUserId } = useAuth();
  const { showToast } = useToastActions();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const lastMessageIdRef = useRef<number>(0);

  // 2. Chat Polling: Poll every 3 seconds (?after=<id>) ONLY while logged in AND tab is visible
  useEffect(() => {
    if (!isLoggedIn) {
      lastMessageIdRef.current = 0;
      return;
    }

    let isSubscribed = true;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    async function fetchNewMessages() {
      if (!isLoggedIn || document.visibilityState !== 'visible') {
        return;
      }

      try {
        const afterParam = lastMessageIdRef.current > 0 ? lastMessageIdRef.current : undefined;
        const { messages: fetched } = await api.getMessages(afterParam);

        if (!isSubscribed || !fetched || fetched.length === 0) return;

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

    const startPolling = () => {
      if (intervalId !== null) return;
      intervalId = setInterval(fetchNewMessages, 3000);
    };

    const stopPolling = () => {
      if (intervalId !== null) {
        clearInterval(intervalId);
        intervalId = null;
      }
    };

    if (document.visibilityState === 'visible') {
      fetchNewMessages();
      startPolling();
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchNewMessages();
        startPolling();
      } else {
        stopPolling();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      isSubscribed = false;
      stopPolling();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isLoggedIn, currentUserId]);

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

  const chatCount = useMemo(() => messages.filter((m) => !m.isMe).length, [messages]);

  const value = useMemo(
    () => ({ messages, chatCount, addChatMessage }),
    [messages, chatCount, addChatMessage]
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export const DashboardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <I18nProvider>
      <ToastProvider>
        <ModalProvider>
          <LayoutSettingsProvider>
            <AuthProvider>
              <NotificationsProvider>
                <ChatProvider>{children}</ChatProvider>
              </NotificationsProvider>
            </AuthProvider>
          </LayoutSettingsProvider>
        </ModalProvider>
      </ToastProvider>
    </I18nProvider>
  );
};

// --- Granular Hooks ---

export const useI18n = () => {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within a DashboardProvider');
  return ctx;
};

export const useToastActions = () => {
  const ctx = useContext(ToastActionsContext);
  if (!ctx) throw new Error('useToastActions must be used within a DashboardProvider');
  return ctx;
};

export const useToastState = () => {
  const ctx = useContext(ToastStateContext);
  if (!ctx) throw new Error('useToastState must be used within a DashboardProvider');
  return ctx;
};

export const useModalActions = () => {
  const ctx = useContext(ModalActionsContext);
  if (!ctx) throw new Error('useModalActions must be used within a DashboardProvider');
  return ctx;
};

export const useModalState = () => {
  const ctx = useContext(ModalStateContext);
  if (!ctx) throw new Error('useModalState must be used within a DashboardProvider');
  return ctx;
};

export const useLayoutSettings = () => {
  const ctx = useContext(LayoutSettingsContext);
  if (!ctx) throw new Error('useLayoutSettings must be used within a DashboardProvider');
  return ctx;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within a DashboardProvider');
  return ctx;
};

export const useNotifications = () => {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error('useNotifications must be used within a DashboardProvider');
  return ctx;
};

export const useChat = () => {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChat must be used within a DashboardProvider');
  return ctx;
};

// --- Backward-Compatible Unified Hook ---
export const useDashboard = (): DashboardContextType => {
  const i18n = useI18n();
  const toastActions = useToastActions();
  const toastState = useToastState();
  const modalActions = useModalActions();
  const modalState = useModalState();
  const layout = useLayoutSettings();
  const auth = useAuth();
  const notif = useNotifications();
  const chat = useChat();

  return useMemo(
    () => ({
      activeModal: modalState.activeModal,
      setActiveModal: modalActions.setActiveModal,
      closeModal: modalActions.closeModal,
      notificationCount: notif.notificationCount,
      chatCount: chat.chatCount,
      notifications: notif.notifications,
      markNotificationsRead: notif.markNotificationsRead,
      messages: chat.messages,
      addChatMessage: chat.addChatMessage,
      studentProfile: auth.studentProfile,
      updateStudentProfile: auth.updateStudentProfile,
      isLoggedIn: auth.isLoggedIn,
      loginMethod: auth.loginMethod,
      handleSsoLogin: auth.handleSsoLogin,
      handleFormLogin: auth.handleFormLogin,
      loginWithEmailPass: auth.loginWithEmailPass,
      registerWithEmailPass: auth.registerWithEmailPass,
      changePassword: auth.changePassword,
      loginWithGoogle: auth.loginWithGoogle,
      handleLogout: auth.handleLogout,
      isAuthLoading: auth.isAuthLoading,
      toastMessage: toastState.toastMessage,
      showToast: toastActions.showToast,
      instituteName: layout.instituteName,
      setInstituteName: layout.setInstituteName,
      isCompactFrame: layout.isCompactFrame,
      setIsCompactFrame: layout.setIsCompactFrame,
      currentPage: auth.currentPage,
      setCurrentPage: auth.setCurrentPage,
      language: i18n.language,
      setLanguage: i18n.setLanguage,
      toggleLanguage: i18n.toggleLanguage,
      t: i18n.t,
    }),
    [modalState, modalActions, notif, chat, auth, toastState, toastActions, layout, i18n]
  );
};

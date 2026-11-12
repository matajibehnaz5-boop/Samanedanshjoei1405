export type ActiveModal = 
  | null 
  | 'sparkles' 
  | 'settings' 
  | 'analytics' 
  | 'notifications' 
  | 'chat' 
  | 'sso' 
  | 'form_login' 
  | 'dropdown' 
  | 'three_dot' 
  | 'close_confirm'
  | 'profile'
  | 'change_password'
  | 'notice_board'
  | 'sms_notification'
  | 'course_registration'
  | 'transcript'
  | 'weekly_schedule'
  | 'student_requests'
  | 'registration_certificate'
  | 'pay_tuition'
  | 'financial_statement'
  | 'transaction_history'
  | 'dormitory'
  | 'student_loan'
  | 'student_id_card'
  | 'dining';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: 'academic' | 'exam' | 'system';
}

export interface ChatMessage {
  id: string;
  sender: string;
  avatar: string;
  text: string;
  time: string;
  isMe: boolean;
  role: 'استاد' | 'دانشجو' | 'آموزش';
}

export interface StudentProfile {
  name: string;
  studentId: string;
  field: string;
  term: string;
  gpa: number;
  creditsPassed: number;
  creditsTotal: number;
  institute: string;
  email?: string;
  phone?: string;
  avatar?: string;
  role?: 'admin' | 'student';
}

export interface DashboardContextType {
  activeModal: ActiveModal;
  setActiveModal: (modal: ActiveModal) => void;
  closeModal: () => void;
  notificationCount: number;
  chatCount: number;
  notifications: NotificationItem[];
  markNotificationsRead: () => void;
  messages: ChatMessage[];
  addChatMessage: (text: string) => void;
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
  toastMessage: string | null;
  showToast: (msg: string) => void;
  instituteName: string;
  setInstituteName: (name: string) => void;
  isCompactFrame: boolean;
  setIsCompactFrame: (compact: boolean | ((prev: boolean) => boolean)) => void;
  currentPage: 'login' | 'dashboard';
  setCurrentPage: (page: 'login' | 'dashboard') => void;
  language: 'fa' | 'en';
  setLanguage: (lang: 'fa' | 'en') => void;
  toggleLanguage: () => void;
  t: (key: any, params?: Record<string, string | number>) => string;
}

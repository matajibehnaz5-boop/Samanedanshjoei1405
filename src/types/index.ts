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
  | 'dining'
  | 'edu_groups'
  | 'edu_fields'
  | 'employee_register'
  | 'employee_list'
  | 'thesis_list'
  | 'professor_capacity'
  | 'defense_sessions'
  | 'professor_register'
  | 'professor_list'
  | 'professor_access'
  | 'professor_theses'
  | 'student_bulk_register'
  | 'student_register'
  | 'student_delete'
  | 'student_search'
  | 'thesis_affairs'
  | 'public_announcements'
  | 'admin_users'
  | 'users_manage'
  | 'admin_cartable'
  | 'forgot_password'
  | 'login_guide';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: 'academic' | 'exam' | 'system';
}

export type AdminNotificationType =
  | 'pending'
  | 'theses'
  | 'professors'
  | 'defense'
  | 'registrations'
  | 'system';

export interface AdminNotificationItem {
  id: string;
  type: AdminNotificationType;
  title: string;
  body: string;
  targetModal: ActiveModal | null;
  isRead: boolean;
  createdAt: string;
}

export type AdminCartableType = 'student_request' | 'thesis' | 'message' | 'system';
export type AdminCartableStatus = 'pending' | 'approved' | 'rejected' | 'done';

export interface AdminCartableItem {
  id: string;
  type: AdminCartableType;
  title: string;
  sender: string;
  body: string;
  status: AdminCartableStatus;
  decisionNote: string;
  targetModal: ActiveModal | null;
  createdAt: string;
  doneAt: string | null;
}

export interface AdminCartableCounts {
  all: number;
  pending: number;
  done: number;
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
  loginWithSso: (username: string, password: string) => Promise<void>;
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

import React, { Suspense, lazy } from 'react';
import { useModalState } from '../../context/DashboardContext';
import { Toast } from './Toast';

const AnalyticsModal = lazy(() => import('./AnalyticsModal').then((m) => ({ default: m.AnalyticsModal })));
const ChangePasswordModal = lazy(() => import('./ChangePasswordModal').then((m) => ({ default: m.ChangePasswordModal })));
const ChatModal = lazy(() => import('./ChatModal').then((m) => ({ default: m.ChatModal })));
const CloseConfirmModal = lazy(() => import('./CloseConfirmModal').then((m) => ({ default: m.CloseConfirmModal })));
const CourseRegistrationModal = lazy(() => import('./CourseRegistrationModal').then((m) => ({ default: m.CourseRegistrationModal })));
const FinancialStatementModal = lazy(() => import('./FinancialStatementModal').then((m) => ({ default: m.FinancialStatementModal })));
const FormLoginModal = lazy(() => import('./FormLoginModal').then((m) => ({ default: m.FormLoginModal })));
const NoticeBoardModal = lazy(() => import('./NoticeBoardModal').then((m) => ({ default: m.NoticeBoardModal })));
const NotificationsModal = lazy(() => import('./NotificationsModal').then((m) => ({ default: m.NotificationsModal })));
const PayTuitionModal = lazy(() => import('./PayTuitionModal').then((m) => ({ default: m.PayTuitionModal })));
const ProfileModal = lazy(() => import('./ProfileModal').then((m) => ({ default: m.ProfileModal })));
const RegistrationCertificateModal = lazy(() => import('./RegistrationCertificateModal').then((m) => ({ default: m.RegistrationCertificateModal })));
const RequestsModal = lazy(() => import('./RequestsModal').then((m) => ({ default: m.RequestsModal })));
const SettingsModal = lazy(() => import('./SettingsModal').then((m) => ({ default: m.SettingsModal })));
const SmsNotificationModal = lazy(() => import('./SmsNotificationModal').then((m) => ({ default: m.SmsNotificationModal })));
const SparklesModal = lazy(() => import('./SparklesModal').then((m) => ({ default: m.SparklesModal })));
const SsoLoginModal = lazy(() => import('./SsoLoginModal').then((m) => ({ default: m.SsoLoginModal })));
const TopMenuModal = lazy(() => import('./TopMenuModal').then((m) => ({ default: m.TopMenuModal })));
const TransactionHistoryModal = lazy(() => import('./TransactionHistoryModal').then((m) => ({ default: m.TransactionHistoryModal })));
const TranscriptModal = lazy(() => import('./TranscriptModal').then((m) => ({ default: m.TranscriptModal })));
const WeeklyScheduleModal = lazy(() => import('./WeeklyScheduleModal').then((m) => ({ default: m.WeeklyScheduleModal })));
const DormitoryModal = lazy(() => import('./DormitoryModal').then((m) => ({ default: m.DormitoryModal })));
const StudentLoanModal = lazy(() => import('./StudentLoanModal').then((m) => ({ default: m.StudentLoanModal })));
const StudentIdCardModal = lazy(() => import('./StudentIdCardModal').then((m) => ({ default: m.StudentIdCardModal })));
const DiningModal = lazy(() => import('./DiningModal').then((m) => ({ default: m.DiningModal })));
const EducationalAffairsModals = lazy(() => import('./EducationalAffairsModals').then((m) => ({ default: m.EducationalAffairsModals })));
const ProfessorAffairsModals = lazy(() => import('./ProfessorAffairsModals').then((m) => ({ default: m.ProfessorAffairsModals })));
const StudentAffairsModals = lazy(() => import('./StudentAffairsModals').then((m) => ({ default: m.StudentAffairsModals })));
const AdminManagementModals = lazy(() => import('./AdminManagementModals').then((m) => ({ default: m.AdminManagementModals })));
const AcademicPlaceholderModals = lazy(() => import('./AcademicPlaceholderModals').then((m) => ({ default: m.AcademicPlaceholderModals })));
const AdminCartableModal = lazy(() => import('./AdminCartableModal').then((m) => ({ default: m.AdminCartableModal })));
const LoginHelpModals = lazy(() => import('./LoginHelpModals').then((m) => ({ default: m.LoginHelpModals })));

export const ModalContainer: React.FC = React.memo(() => {
  const { activeModal } = useModalState();

  return (
    <>
      <Toast />
      {activeModal !== null && (
        <Suspense fallback={null}>
          {activeModal === 'sparkles' && <SparklesModal />}
          {activeModal === 'settings' && <SettingsModal />}
          {activeModal === 'analytics' && <AnalyticsModal />}
          {activeModal === 'notifications' && <NotificationsModal />}
          {activeModal === 'chat' && <ChatModal />}
          {activeModal === 'sso' && <SsoLoginModal />}
          {activeModal === 'form_login' && <FormLoginModal />}
          {(activeModal === 'dropdown' || activeModal === 'three_dot') && <TopMenuModal />}
          {activeModal === 'close_confirm' && <CloseConfirmModal />}
          {activeModal === 'profile' && <ProfileModal />}
          {activeModal === 'change_password' && <ChangePasswordModal />}
          {activeModal === 'notice_board' && <NoticeBoardModal />}
          {activeModal === 'sms_notification' && <SmsNotificationModal />}
          {activeModal === 'course_registration' && <CourseRegistrationModal />}
          {activeModal === 'transcript' && <TranscriptModal />}
          {activeModal === 'weekly_schedule' && <WeeklyScheduleModal />}
          {activeModal === 'student_requests' && <RequestsModal />}
          {activeModal === 'registration_certificate' && <RegistrationCertificateModal />}
          {activeModal === 'pay_tuition' && <PayTuitionModal />}
          {activeModal === 'financial_statement' && <FinancialStatementModal />}
          {activeModal === 'transaction_history' && <TransactionHistoryModal />}
          {activeModal === 'dormitory' && <DormitoryModal />}
          {activeModal === 'student_loan' && <StudentLoanModal />}
          {activeModal === 'student_id_card' && <StudentIdCardModal />}
          {activeModal === 'dining' && <DiningModal />}
          {(activeModal === 'edu_groups' ||
            activeModal === 'edu_fields' ||
            activeModal === 'employee_register' ||
            activeModal === 'employee_list') && <EducationalAffairsModals />}
          {(activeModal === 'professor_register' ||
            activeModal === 'professor_list' ||
            activeModal === 'professor_access' ||
            activeModal === 'professor_theses') && <ProfessorAffairsModals />}
          {(activeModal === 'student_bulk_register' ||
            activeModal === 'student_register' ||
            activeModal === 'student_delete' ||
            activeModal === 'student_search') && <StudentAffairsModals />}
          {(activeModal === 'thesis_list' ||
            activeModal === 'professor_capacity' ||
            activeModal === 'defense_sessions' ||
            activeModal === 'admin_users' ||
            activeModal === 'users_manage') && <AdminManagementModals />}
          {(activeModal === 'thesis_affairs' ||
            activeModal === 'public_announcements') && <AcademicPlaceholderModals />}
          {activeModal === 'admin_cartable' && <AdminCartableModal />}
          {(activeModal === 'forgot_password' ||
            activeModal === 'login_guide') && <LoginHelpModals />}
        </Suspense>
      )}
    </>
  );
});

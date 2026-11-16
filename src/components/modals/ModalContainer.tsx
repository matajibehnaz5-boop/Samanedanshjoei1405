import React from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { Toast } from './Toast';

import { AnalyticsModal } from './AnalyticsModal';
import { ChangePasswordModal } from './ChangePasswordModal';
import { ChatModal } from './ChatModal';
import { CloseConfirmModal } from './CloseConfirmModal';
import { CourseRegistrationModal } from './CourseRegistrationModal';
import { FinancialStatementModal } from './FinancialStatementModal';
import { FormLoginModal } from './FormLoginModal';
import { NoticeBoardModal } from './NoticeBoardModal';
import { NotificationsModal } from './NotificationsModal';
import { PayTuitionModal } from './PayTuitionModal';
import { ProfileModal } from './ProfileModal';
import { RegistrationCertificateModal } from './RegistrationCertificateModal';
import { RequestsModal } from './RequestsModal';
import { SettingsModal } from './SettingsModal';
import { SmsNotificationModal } from './SmsNotificationModal';
import { SparklesModal } from './SparklesModal';
import { SsoLoginModal } from './SsoLoginModal';
import { TopMenuModal } from './TopMenuModal';
import { TransactionHistoryModal } from './TransactionHistoryModal';
import { TranscriptModal } from './TranscriptModal';
import { WeeklyScheduleModal } from './WeeklyScheduleModal';
import { DormitoryModal } from './DormitoryModal';
import { StudentLoanModal } from './StudentLoanModal';
import { StudentIdCardModal } from './StudentIdCardModal';
import { DiningModal } from './DiningModal';
import { EducationalAffairsModals } from './EducationalAffairsModals';

export const ModalContainer: React.FC = React.memo(() => {
  const { activeModal } = useDashboard();

  return (
    <>
      <Toast />
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
    </>
  );
});

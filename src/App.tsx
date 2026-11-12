import React from 'react';
import { motion } from 'motion/react';
import { DashboardProvider, useDashboard } from './context/DashboardContext';
import { HeaderBar } from './components/HeaderBar';
import { MainDashboardCard } from './components/MainDashboardCard';
import { PracticeLoginCards } from './components/PracticeLoginCards';
import { Footer } from './components/Footer';
import { StudentDashboardPage } from './pages/StudentDashboardPage';
import { ModalContainer } from './components/modals/ModalContainer';
import { StudentChatbot } from './components/chat/StudentChatbot';

const DashboardContent: React.FC = () => {
  const { isCompactFrame } = useDashboard();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1e1b4b] via-[#1e293b] to-[#0f172a] text-white flex flex-col justify-between font-['Vazirmatn',sans-serif] selection:bg-[#5EA8FF] selection:text-white relative overflow-hidden">
      
      {/* Floating Animated Background Ambient Blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        {/* Blob 1: Light Blue / Cyan Top Right */}
        <motion.div
          animate={{
            y: [0, -30, 0],
            x: [0, 20, 0],
            scale: [1, 1.1, 1],
            opacity: [0.2, 0.3, 0.2],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute -top-16 -right-16 sm:right-10 w-[450px] h-[450px] sm:w-[550px] sm:h-[550px] bg-gradient-to-br from-[#6366F1] to-[#3B82F6] rounded-full blur-[130px] pointer-events-none"
        />

        {/* Blob 2: Deep Soft Blue / Indigo Bottom Left */}
        <motion.div
          animate={{
            y: [0, 35, 0],
            x: [0, -25, 0],
            scale: [1, 1.15, 1],
            opacity: [0.18, 0.28, 0.18],
          }}
          transition={{
            duration: 14,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 1,
          }}
          className="absolute bottom-10 -left-20 sm:left-10 w-[400px] h-[400px] sm:w-[500px] sm:h-[500px] bg-gradient-to-tr from-[#4F46E5] via-[#2563EB] to-[#0284C7] rounded-full blur-[140px] pointer-events-none"
        />

        {/* Optional subtle center glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#6366F1]/[0.08] rounded-full blur-[160px] pointer-events-none" />
      </div>

      {/* Main Layout Container */}
      <div className={`w-full transition-all duration-300 flex flex-col min-h-screen relative z-10 ${
        isCompactFrame 
          ? 'max-w-md mx-auto border-x border-white/[0.08] shadow-2xl bg-gradient-to-b from-[#1e1b4b]/80 via-[#1e293b]/80 to-[#0f172a]/80 backdrop-blur-xl' 
          : 'max-w-4xl mx-auto bg-gradient-to-b from-[#1e1b4b]/60 via-[#1e293b]/60 to-[#0f172a]/60 backdrop-blur-xl'
      }`}>

        {/* Top Header Bar */}
        <HeaderBar />

        {/* Main Body with clean vertically centered layout */}
        <main className="flex-1 px-4 sm:px-6 pt-2 pb-2 sm:pt-4 sm:pb-3 flex flex-col justify-center items-center">
          {/* Main Dashboard Card (Optional / Empty) */}
          <MainDashboardCard />

          {/* Practice Login Cards (Horizontal row, SSO on Right, Student Login on Left) */}
          <PracticeLoginCards />

          {/* Bottom Footer Text */}
          <Footer />
        </main>
      </div>

      {/* Interactive Modals & Drawers */}
      <ModalContainer />
    </div>
  );
};

const MainAppRouter: React.FC = () => {
  const { currentPage } = useDashboard();

  if (currentPage === 'dashboard') {
    return (
      <>
        <StudentDashboardPage />
        {/* Interactive Modals & Drawers */}
        <ModalContainer />
        {/* Global Floating Gemini Chatbot */}
        <StudentChatbot />
      </>
    );
  }

  return (
    <>
      <DashboardContent />
      {/* Global Floating Gemini Chatbot */}
      <StudentChatbot />
    </>
  );
};

export default function App() {
  return (
    <DashboardProvider>
      <MainAppRouter />
    </DashboardProvider>
  );
}

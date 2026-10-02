import React, { useEffect } from 'react';
import { useFinanceStore } from './store/useFinanceStore';
import { useTheme } from './hooks/useTheme';
import { Header } from './components/Header';
import { Navbar } from './components/Navbar';
import { AlertBanner } from './components/AlertBanner';
import { QuickAddModal } from './components/QuickAddModal';
import { AffordabilityModal } from './components/AffordabilityModal';
import { LockScreen } from './components/LockScreen';
import { AuthScreen } from './components/AuthScreen';
import { Onboarding } from './pages/Onboarding';
import { Home } from './pages/Home';
import { Ledger } from './pages/Ledger';
import { DayPlanner } from './pages/DayPlanner';
import { Goals } from './pages/Goals';
import { Insights } from './pages/Insights';
import { Settings } from './pages/Settings';

export const App: React.FC = () => {
  const currentUser = useFinanceStore((state) => state.currentUser);
  const profile = useFinanceStore((state) => state.profile);
  const isLocked = useFinanceStore((state) => state.isLocked);
  const activeTab = useFinanceStore((state) => state.activeTab);
  const setActiveTab = useFinanceStore((state) => state.setActiveTab);
  const { isDark } = useTheme();

  // If user is not logged in, show AuthScreen (Username + Password)
  if (!currentUser) {
    return <AuthScreen />;
  }

  // If user has not completed onboarding, show onboarding flow
  if (!profile.onboardingCompleted) {
    return <Onboarding />;
  }

  // If app is locked with PIN, show LockScreen
  if (isLocked) {
    return <LockScreen />;
  }

  return (
    <div
      className={`min-h-screen w-full flex flex-col items-center transition-colors duration-200 ${
        isDark ? 'bg-[#05070E] text-white' : 'bg-[#F8FAFC] text-[#0F172A]'
      }`}
    >
      {/* Desktop & Mobile Responsive Canvas */}
      <div className="w-full max-w-6xl min-h-screen flex flex-col relative md:border-x border-inherit shadow-xs">
        {/* Top Header */}
        <Header />

        {/* In-app Notification Alert Banner */}
        <div className="px-4 sm:px-6">
          <AlertBanner />
        </div>

        {/* Main Screen Content */}
        <main className="flex-1 px-4 sm:px-6 pt-3 md:pt-6">
          {activeTab === 'home' && <Home />}
          {activeTab === 'ledger' && <Ledger />}
          {activeTab === 'planner' && <DayPlanner />}
          {activeTab === 'goals' && <Goals />}
          {activeTab === 'insights' && <Insights />}
          {activeTab === 'settings' && <Settings />}
        </main>

        {/* Global Bottom Navigation Bar */}
        <Navbar />

        {/* Quick Add FAB Modal Sheet */}
        <QuickAddModal />

        {/* "Can I afford this?" Calculator Modal */}
        <AffordabilityModal />
      </div>
    </div>
  );
};

export default App;

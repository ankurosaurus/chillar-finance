import React, { useEffect } from 'react';
import { useFinanceStore } from './store/useFinanceStore';
import { useTheme } from './hooks/useTheme';
import { Header } from './components/Header';
import { Navbar } from './components/Navbar';
import { AlertBanner } from './components/AlertBanner';
import { QuickAddModal } from './components/QuickAddModal';
import { AffordabilityModal } from './components/AffordabilityModal';
import { LockScreen } from './components/LockScreen';
import { Onboarding } from './pages/Onboarding';
import { Home } from './pages/Home';
import { Ledger } from './pages/Ledger';
import { Budgets } from './pages/Budgets';
import { Goals } from './pages/Goals';
import { Insights } from './pages/Insights';
import { Settings } from './pages/Settings';
import { Sliders } from 'lucide-react';

export const App: React.FC = () => {
  const profile = useFinanceStore((state) => state.profile);
  const isLocked = useFinanceStore((state) => state.isLocked);
  const activeTab = useFinanceStore((state) => state.activeTab);
  const setActiveTab = useFinanceStore((state) => state.setActiveTab);
  const { isDark } = useTheme();

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
        isDark ? 'bg-[#0B0B0C] text-[#F4F2EE]' : 'bg-[#F7F5F1] text-[#111111]'
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
          {activeTab === 'budgets' && <Budgets />}
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

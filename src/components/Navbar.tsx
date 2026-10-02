import React from 'react';
import {
  Home,
  ReceiptText,
  CalendarCheck,
  Target,
  BarChart3,
  Plus,
} from 'lucide-react';
import { useFinanceStore } from '../store/useFinanceStore';
import { useTheme } from '../hooks/useTheme';

export const Navbar: React.FC = () => {
  const { isDark } = useTheme();
  const activeTab = useFinanceStore((state) => state.activeTab);
  const setActiveTab = useFinanceStore((state) => state.setActiveTab);
  const setQuickAddOpen = useFinanceStore((state) => state.setQuickAddOpen);

  const barBg = isDark ? 'bg-[#0B0F19]/95' : 'bg-[#FFFFFF]/95';
  const borderClass = isDark
    ? 'border-t border-white/10'
    : 'border-t border-slate-200';

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex justify-center pointer-events-none pb-safe">
      <nav
        className={`w-full max-w-[480px] pointer-events-auto backdrop-blur-lg ${barBg} ${borderClass} px-3 py-2 flex items-center justify-around relative`}
      >
        {/* Left items: Home, Ledger */}
        <button
          type="button"
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center gap-1 py-1 px-2.5 transition-colors ${
            activeTab === 'home'
              ? 'text-blue-400'
              : isDark
              ? 'text-slate-400 hover:text-white'
              : 'text-slate-600 hover:text-slate-900'
          }`}
          aria-label="Home"
        >
          <Home strokeWidth={1.5} className="w-5 h-5" />
          <span className="text-[10px] tracking-wide font-normal">Home</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('ledger')}
          className={`flex flex-col items-center gap-1 py-1 px-2.5 transition-colors ${
            activeTab === 'ledger'
              ? 'text-blue-400'
              : isDark
              ? 'text-slate-400 hover:text-white'
              : 'text-slate-600 hover:text-slate-900'
          }`}
          aria-label="Ledger"
        >
          <ReceiptText strokeWidth={1.5} className="w-5 h-5" />
          <span className="text-[10px] tracking-wide font-normal">Ledger</span>
        </button>

        {/* Centered Floating Quick Add "+" Button */}
        <div className="relative -top-4 flex justify-center px-1">
          <button
            type="button"
            onClick={() => setQuickAddOpen(true)}
            className="w-13 h-13 rounded-full bg-blue-600 hover:bg-blue-500 active:scale-95 text-white flex items-center justify-center shadow-lg shadow-blue-600/30 transition-all duration-150 border-2 border-[#05070E]"
            aria-label="Quick Add"
          >
            <Plus strokeWidth={2} className="w-6 h-6" />
          </button>
        </div>

        {/* Right items: Planner, Goals, Insights */}
        <button
          type="button"
          onClick={() => setActiveTab('planner')}
          className={`flex flex-col items-center gap-1 py-1 px-2.5 transition-colors ${
            activeTab === 'planner'
              ? 'text-blue-400'
              : isDark
              ? 'text-slate-400 hover:text-white'
              : 'text-slate-600 hover:text-slate-900'
          }`}
          aria-label="Day Planner"
        >
          <CalendarCheck strokeWidth={1.5} className="w-5 h-5" />
          <span className="text-[10px] tracking-wide font-normal">Planner</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('goals')}
          className={`flex flex-col items-center gap-1 py-1 px-2.5 transition-colors ${
            activeTab === 'goals'
              ? 'text-blue-400'
              : isDark
              ? 'text-slate-400 hover:text-white'
              : 'text-slate-600 hover:text-slate-900'
          }`}
          aria-label="Goals"
        >
          <Target strokeWidth={1.5} className="w-5 h-5" />
          <span className="text-[10px] tracking-wide font-normal">Goals</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('insights')}
          className={`flex flex-col items-center gap-1 py-1 px-2.5 transition-colors ${
            activeTab === 'insights'
              ? 'text-blue-400'
              : isDark
              ? 'text-slate-400 hover:text-white'
              : 'text-slate-600 hover:text-slate-900'
          }`}
          aria-label="Insights"
        >
          <BarChart3 strokeWidth={1.5} className="w-5 h-5" />
          <span className="text-[10px] tracking-wide font-normal">Insights</span>
        </button>
      </nav>
    </div>
  );
};

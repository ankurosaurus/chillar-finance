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

  const barBg = isDark ? 'bg-[#10121A]/95' : 'bg-[#FFFFFF]/95';
  const borderClass = isDark
    ? 'border-t border-[rgba(255,255,255,0.08)]'
    : 'border-t border-[rgba(15,23,42,0.08)]';

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
              ? 'text-[#D4AF37]'
              : isDark
              ? 'text-[#94A3B8] hover:text-[#F8FAFC]'
              : 'text-[#64748B] hover:text-[#0F172A]'
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
              ? 'text-[#D4AF37]'
              : isDark
              ? 'text-[#94A3B8] hover:text-[#F8FAFC]'
              : 'text-[#64748B] hover:text-[#0F172A]'
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
            className="w-13 h-13 rounded-full bg-[#D4AF37] hover:bg-[#E5C358] active:scale-95 text-[#08090C] flex items-center justify-center shadow-lg transition-transform duration-150 border-2 border-[#08090C]"
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
              ? 'text-[#D4AF37]'
              : isDark
              ? 'text-[#94A3B8] hover:text-[#F8FAFC]'
              : 'text-[#64748B] hover:text-[#0F172A]'
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
              ? 'text-[#D4AF37]'
              : isDark
              ? 'text-[#94A3B8] hover:text-[#F8FAFC]'
              : 'text-[#64748B] hover:text-[#0F172A]'
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
              ? 'text-[#D4AF37]'
              : isDark
              ? 'text-[#94A3B8] hover:text-[#F8FAFC]'
              : 'text-[#64748B] hover:text-[#0F172A]'
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

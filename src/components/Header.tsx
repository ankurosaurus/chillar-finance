import React from 'react';
import {
  Sun,
  Moon,
  Lock,
  Settings as SettingsIcon,
  Plus,
  Home,
  ReceiptText,
  CalendarCheck,
  Target,
  BarChart3,
  LogOut,
  User,
} from 'lucide-react';
import { useFinanceStore } from '../store/useFinanceStore';
import { useTheme } from '../hooks/useTheme';

export const Header: React.FC = () => {
  const { isDark, toggleTheme } = useTheme();
  const currentUser = useFinanceStore((state) => state.currentUser);
  const logout = useFinanceStore((state) => state.logout);
  const profile = useFinanceStore((state) => state.profile);
  const lockApp = useFinanceStore((state) => state.lockApp);
  const activeTab = useFinanceStore((state) => state.activeTab);
  const setActiveTab = useFinanceStore((state) => state.setActiveTab);
  const setQuickAddOpen = useFinanceStore((state) => state.setQuickAddOpen);
  const setAffordabilityModalOpen = useFinanceStore((state) => state.setAffordabilityModalOpen);

  const desktopNavItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'ledger', label: 'Ledger', icon: ReceiptText },
    { id: 'planner', label: 'Day Planner', icon: CalendarCheck },
    { id: 'goals', label: 'Goals', icon: Target },
    { id: 'insights', label: 'Insights', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ] as const;

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-inherit border-b border-inherit px-4 sm:px-6 py-3.5 transition-colors">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        {/* Brand Wordmark */}
        <div
          onClick={() => setActiveTab('home')}
          className="flex items-center gap-2 cursor-pointer group select-none"
        >
          <span className="font-serif-display text-2xl sm:text-3xl tracking-[0.04em] font-light text-inherit">
            Chillar
          </span>
          <span className="w-2 h-2 rounded-full bg-blue-500 shadow-sm shadow-blue-400 inline-block transition-transform group-hover:scale-125" />
        </div>

        {/* Desktop Navigation Links (Visible on PC: md and above) */}
        <nav className="hidden md:flex items-center gap-1 p-1 rounded-full border border-inherit bg-inherit">
          {desktopNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/40 shadow-xs'
                    : isDark
                    ? 'text-slate-400 hover:text-white hover:bg-white/5'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-black/5'
                }`}
              >
                <Icon strokeWidth={1.5} className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Desktop Quick Add Button */}
          <button
            type="button"
            onClick={() => setQuickAddOpen(true)}
            className="hidden md:flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-xs font-semibold shadow-md shadow-blue-600/20 transition-all"
          >
            <Plus strokeWidth={2} className="w-3.5 h-3.5" />
            <span>Add Rupee</span>
          </button>

          {/* "Can I afford this?" Quick Trigger button */}
          <button
            type="button"
            onClick={() => setAffordabilityModalOpen(true)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border flex items-center gap-1 transition-all ${
              isDark
                ? 'border-white/10 bg-[#0B0F19] text-slate-300 hover:text-blue-400 hover:border-blue-500/40'
                : 'border-slate-200 bg-slate-100 text-slate-700 hover:text-blue-600 hover:border-blue-500/40'
            }`}
            title="Can I afford this?"
          >
            <span className="hidden sm:inline">Can I</span>
            <span>Afford?</span>
          </button>

          {/* User Account Info Chip & Logout */}
          {currentUser && (
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs ${
                isDark ? 'border-white/10 bg-[#0B0F19] text-slate-300' : 'border-slate-200 bg-slate-50 text-slate-700'
              }`}
            >
              <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-semibold">
                {currentUser.username[0]?.toUpperCase()}
              </div>
              <span className="hidden lg:inline text-[11px] font-medium max-w-[80px] truncate">
                {currentUser.username}
              </span>
              <button
                type="button"
                onClick={logout}
                title={`Log out (${currentUser.username})`}
                className="p-1 hover:text-red-400 transition-colors ml-0.5"
                aria-label="Log out"
              >
                <LogOut className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Theme Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            className={`p-2 rounded-full border transition-all ${
              isDark
                ? 'border-white/10 hover:bg-white/5 text-slate-400'
                : 'border-slate-200 hover:bg-black/5 text-slate-600'
            }`}
            aria-label="Toggle theme"
          >
            {isDark ? (
              <Sun strokeWidth={1.5} className="w-4 h-4 text-blue-400" />
            ) : (
              <Moon strokeWidth={1.5} className="w-4 h-4 text-slate-600" />
            )}
          </button>

          {/* Settings Shortcut (Mobile only) */}
          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`md:hidden p-2 rounded-full border transition-all ${
              isDark
                ? 'border-white/10 hover:bg-white/5 text-slate-400'
                : 'border-slate-200 hover:bg-black/5 text-slate-600'
            }`}
            aria-label="Settings"
            title="Settings & Preferences"
          >
            <SettingsIcon strokeWidth={1.5} className="w-4 h-4" />
          </button>

          {/* PIN Lock button if enabled */}
          {profile.pinEnabled && (
            <button
              type="button"
              onClick={lockApp}
              className={`p-2 rounded-full border transition-all ${
                isDark
                  ? 'border-white/10 hover:bg-white/5 text-slate-400'
                  : 'border-slate-200 hover:bg-black/5 text-slate-600'
              }`}
              aria-label="Lock app"
              title="Lock Chillar"
            >
              <Lock strokeWidth={1.5} className="w-4 h-4 text-blue-400" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

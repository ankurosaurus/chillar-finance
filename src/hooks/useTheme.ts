import { useEffect } from 'react';
import { useFinanceStore } from '../store/useFinanceStore';

export function useTheme() {
  const theme = useFinanceStore((state) => state.profile.theme);
  const toggleTheme = useFinanceStore((state) => state.toggleTheme);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'light') {
      root.classList.remove('dark');
      root.classList.add('light');
      document.body.style.backgroundColor = '#F8FAFC';
      document.body.style.color = '#0F172A';
    } else {
      root.classList.remove('light');
      root.classList.add('dark');
      document.body.style.backgroundColor = '#05070E';
      document.body.style.color = '#F8FAFC';
    }
  }, [theme]);

  const isDark = theme === 'dark';

  return {
    theme,
    isDark,
    toggleTheme,
    themeClasses: {
      bg: isDark ? 'bg-[#05070E]' : 'bg-[#F8FAFC]',
      surface: isDark ? 'bg-[#0B0F19]' : 'bg-[#FFFFFF]',
      elevated: isDark ? 'bg-[#111827]' : 'bg-[#F1F5F9]',
      border: isDark ? 'border-white/10' : 'border-[rgba(15,23,42,0.08)]',
      borderSubtle: isDark ? 'border-white/5' : 'border-[rgba(15,23,42,0.04)]',
      text: isDark ? 'text-[#F8FAFC]' : 'text-[#0F172A]',
      muted: isDark ? 'text-[#94A3B8]' : 'text-[#64748B]',
      goldText: 'text-blue-500',
      goldBg: 'bg-blue-600',
      goldBorder: 'border-blue-500/35',
      emeraldText: 'text-[#10B981]',
      crimsonText: 'text-[#F43F5E]',
    },
  };
}

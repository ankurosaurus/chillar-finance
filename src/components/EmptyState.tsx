import React from 'react';
import { useTheme } from '../hooks/useTheme';

interface EmptyStateProps {
  sentence: string;
  actionText: string;
  onAction: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  sentence,
  actionText,
  onAction,
  className = '',
}) => {
  const { isDark } = useTheme();

  return (
    <div
      className={`flex flex-col items-center justify-center text-center py-10 px-4 rounded-3xl border border-dashed ${
        isDark
          ? 'border-white/10 bg-[#0B0F19]/40'
          : 'border-[rgba(15,23,42,0.08)] bg-[#FFFFFF]/40'
      } ${className}`}
    >
      <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mb-4" />
      <p
        className={`text-sm mb-4 max-w-xs ${
          isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'
        }`}
      >
        {sentence}
      </p>
      <button
        type="button"
        onClick={onAction}
        className="px-4 py-2 text-xs font-medium rounded-full border border-blue-500/40 text-blue-400 hover:bg-blue-500/10 transition-colors"
      >
        {actionText}
      </button>
    </div>
  );
};

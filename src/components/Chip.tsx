import React from 'react';
import { useTheme } from '../hooks/useTheme';

interface ChipProps {
  label: string;
  selected?: boolean;
  onClick?: () => void;
  dotColor?: string;
  badge?: React.ReactNode;
  size?: 'sm' | 'md';
  className?: string;
}

export const Chip: React.FC<ChipProps> = ({
  label,
  selected = false,
  onClick,
  dotColor,
  badge,
  size = 'md',
  className = '',
}) => {
  const { isDark } = useTheme();

  const basePadding = size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-3.5 py-2 text-xs md:text-sm';

  const defaultBorder = isDark ? 'border-[rgba(255,255,255,0.08)]' : 'border-[rgba(0,0,0,0.08)]';
  const defaultBg = isDark ? 'bg-[#131315]' : 'bg-[#FFFFFF]';
  const defaultText = isDark ? 'text-[#8A8A8F]' : 'text-[#75736E]';

  const selectedBorder = 'border-[#C9A96E]';
  const selectedBg = isDark ? 'bg-[#C9A96E]/15' : 'bg-[#C9A96E]/12';
  const selectedText = isDark ? 'text-[#F4F2EE] font-medium' : 'text-[#111111] font-medium';

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-full border transition-all duration-150 active:scale-[0.98] ${basePadding} ${
        selected
          ? `${selectedBorder} ${selectedBg} ${selectedText}`
          : `${defaultBorder} ${defaultBg} ${defaultText} hover:border-[#C9A96E]/40`
      } ${className}`}
    >
      {dotColor && (
        <span
          className="w-2 h-2 rounded-full shrink-0"
          style={{ backgroundColor: dotColor }}
        />
      )}
      <span className="whitespace-nowrap">{label}</span>
      {badge && <span className="opacity-80 text-[10px]">{badge}</span>}
    </button>
  );
};

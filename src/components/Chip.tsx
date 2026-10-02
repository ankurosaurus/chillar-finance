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

  const defaultBorder = isDark ? 'border-[rgba(255,255,255,0.08)]' : 'border-[rgba(15,23,42,0.08)]';
  const defaultBg = isDark ? 'bg-[#10121A]' : 'bg-[#FFFFFF]';
  const defaultText = isDark ? 'text-[#94A3B8]' : 'text-[#64748B]';

  const selectedBorder = 'border-[#D4AF37]';
  const selectedBg = isDark ? 'bg-[#D4AF37]/15' : 'bg-[#D4AF37]/12';
  const selectedText = isDark ? 'text-[#D4AF37] font-medium' : 'text-[#D4AF37] font-semibold';

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-full border transition-all duration-150 active:scale-[0.98] ${basePadding} ${
        selected
          ? `${selectedBorder} ${selectedBg} ${selectedText}`
          : `${defaultBorder} ${defaultBg} ${defaultText} hover:border-[#D4AF37]/40`
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

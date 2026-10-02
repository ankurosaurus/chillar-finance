import React from 'react';
import { useTheme } from '../hooks/useTheme';

interface StatProps {
  label: string;
  value: React.ReactNode;
  subtitle?: React.ReactNode;
  size?: 'hero' | 'large' | 'medium' | 'small';
  variant?: 'default' | 'gold' | 'sage' | 'terracotta';
  className?: string;
}

export const Stat: React.FC<StatProps> = ({
  label,
  value,
  subtitle,
  size = 'medium',
  variant = 'default',
  className = '',
}) => {
  const { isDark } = useTheme();

  const textColor =
    variant === 'gold'
      ? 'text-[#D4AF37]'
      : variant === 'sage'
      ? 'text-[#10B981]'
      : variant === 'terracotta'
      ? 'text-[#F43F5E]'
      : isDark
      ? 'text-[#F8FAFC]'
      : 'text-[#0F172A]';

  const sizeClass =
    size === 'hero'
      ? 'text-4xl md:text-5xl font-light tracking-tight'
      : size === 'large'
      ? 'text-3xl font-light tracking-tight'
      : size === 'medium'
      ? 'text-2xl font-normal tracking-tight'
      : 'text-lg font-medium';

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <span
        className={`meta-label ${
          isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'
        }`}
      >
        {label}
      </span>
      <div className={`font-serif-display tnum ${sizeClass} ${textColor}`}>
        {value}
      </div>
      {subtitle && (
        <div
          className={`text-xs mt-0.5 ${
            isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'
          }`}
        >
          {subtitle}
        </div>
      )}
    </div>
  );
};

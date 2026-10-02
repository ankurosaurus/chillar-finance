import React from 'react';
import { useTheme } from '../hooks/useTheme';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'surface' | 'elevated' | 'glass';
  className?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'surface',
  className = '',
  ...props
}) => {
  const { isDark } = useTheme();

  const bgClass =
    variant === 'elevated'
      ? isDark
        ? 'bg-[#181B26]'
        : 'bg-[#F1F5F9]'
      : variant === 'glass'
      ? isDark
        ? 'bg-[#10121A]/80 backdrop-blur-md'
        : 'bg-[#FFFFFF]/85 backdrop-blur-md'
      : isDark
      ? 'bg-[#10121A]'
      : 'bg-[#FFFFFF]';

  const borderClass = isDark
    ? 'border border-[rgba(255,255,255,0.08)]'
    : 'border border-[rgba(15,23,42,0.08)]';

  return (
    <div
      className={`rounded-3xl p-5 ${bgClass} ${borderClass} transition-colors duration-200 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

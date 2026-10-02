import React from 'react';
import { Delete } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

interface KeypadProps {
  value: string;
  onChange: (newValue: string) => void;
  onDone?: () => void;
  className?: string;
}

export const Keypad: React.FC<KeypadProps> = ({
  value,
  onChange,
  onDone,
  className = '',
}) => {
  const { isDark } = useTheme();

  const handleKeyPress = (char: string) => {
    // Vibrate haptic if supported
    if (typeof window !== 'undefined' && 'navigator' in window && 'vibrate' in navigator) {
      navigator.vibrate(8);
    }

    if (char === 'clear') {
      onChange('0');
      return;
    }

    if (char === 'backspace') {
      if (value.length <= 1 || (value.length === 2 && value.startsWith('-'))) {
        onChange('0');
      } else {
        onChange(value.slice(0, -1));
      }
      return;
    }

    if (char === '.') {
      if (!value.includes('.')) {
        onChange(value === '0' ? '0.' : `${value}.`);
      }
      return;
    }

    // Number key 0-9
    if (value === '0') {
      onChange(char);
    } else {
      // Limit length to 8 digits
      if (value.replace('.', '').length < 8) {
        onChange(`${value}${char}`);
      }
    }
  };

  const keyBg = isDark
    ? 'bg-[#181B26] hover:bg-[#202433] active:bg-[#282D40] text-[#F8FAFC]'
    : 'bg-[#F1F5F9] hover:bg-[#E2E8F0] active:bg-[#CBD5E1] text-[#0F172A]';

  const borderClass = isDark
    ? 'border-[rgba(255,255,255,0.08)]'
    : 'border-[rgba(15,23,42,0.08)]';

  const keys = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['.', '0', 'backspace'],
  ];

  return (
    <div className={`grid grid-cols-3 gap-2 w-full select-none ${className}`}>
      {keys.flat().map((k, idx) => (
        <button
          key={idx}
          type="button"
          onClick={() => handleKeyPress(k)}
          className={`h-14 md:h-16 rounded-2xl flex items-center justify-center font-serif-display text-xl transition-all duration-100 active:scale-[0.97] border ${borderClass} ${keyBg}`}
          aria-label={k === 'backspace' ? 'Backspace' : k}
        >
          {k === 'backspace' ? (
            <Delete strokeWidth={1.5} className="w-5 h-5 opacity-70" />
          ) : (
            <span>{k}</span>
          )}
        </button>
      ))}
    </div>
  );
};

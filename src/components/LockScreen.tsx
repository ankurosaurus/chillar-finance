import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Delete, Lock } from 'lucide-react';
import { useFinanceStore } from '../store/useFinanceStore';
import { useTheme } from '../hooks/useTheme';

export const LockScreen: React.FC = () => {
  const [pin, setPin] = useState('');
  const [isError, setIsError] = useState(false);
  const unlockWithPin = useFinanceStore((state) => state.unlockWithPin);
  const { isDark } = useTheme();

  const handleDigit = (digit: string) => {
    if (pin.length >= 4) return;
    const newPin = pin + digit;
    setPin(newPin);

    if (newPin.length === 4) {
      const success = unlockWithPin(newPin);
      if (!success) {
        setIsError(true);
        setTimeout(() => {
          setPin('');
          setIsError(false);
        }, 500);
      }
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
    setIsError(false);
  };

  const keyBg = isDark
    ? 'bg-[#1A1A1D] hover:bg-[#222226] active:bg-[#2A2A2F] text-[#F4F2EE]'
    : 'bg-[#EFECE6] hover:bg-[#E5E1D8] active:bg-[#DCD8CE] text-[#111111]';

  const borderClass = isDark
    ? 'border-[rgba(255,255,255,0.06)]'
    : 'border-[rgba(0,0,0,0.06)]';

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-between py-12 px-6 ${
        isDark ? 'bg-[#0B0B0C] text-[#F4F2EE]' : 'bg-[#F7F5F1] text-[#111111]'
      }`}
    >
      {/* Brand & Tagline */}
      <div className="flex flex-col items-center text-center pt-8">
        <div className="flex items-center gap-2 mb-2">
          <span className="font-serif-display text-4xl tracking-[0.05em] font-light">
            Chillar
          </span>
          <span className="w-2 h-2 rounded-full bg-[#C9A96E]" />
        </div>
        <p className={`text-xs ${isDark ? 'text-[#8A8A8F]' : 'text-[#75736E]'}`}>
          Every rupee, accounted for.
        </p>
      </div>

      {/* PIN Dots with shake on error */}
      <div className="flex flex-col items-center my-auto">
        <div className="flex items-center gap-2 mb-6 text-xs meta-label text-[#8A8A8F]">
          <Lock strokeWidth={1.5} className="w-3.5 h-3.5 text-[#C9A96E]" />
          <span>Enter 4-Digit Passcode</span>
        </div>

        <motion.div
          animate={isError ? { x: [-10, 10, -10, 10, 0] } : {}}
          transition={{ duration: 0.3 }}
          className="flex items-center gap-4"
        >
          {[0, 1, 2, 3].map((idx) => {
            const isFilled = pin.length > idx;
            return (
              <div
                key={idx}
                className={`w-3.5 h-3.5 rounded-full transition-all duration-200 border ${
                  isFilled
                    ? 'bg-[#C9A96E] border-[#C9A96E] scale-110'
                    : isError
                    ? 'border-[#C77D6B] bg-[#C77D6B]/20'
                    : isDark
                    ? 'border-white/20 bg-white/5'
                    : 'border-black/20 bg-black/5'
                }`}
              />
            );
          })}
        </motion.div>

        {isError && (
          <span className="text-xs text-[#C77D6B] mt-4 font-normal">
            Incorrect passcode
          </span>
        )}
      </div>

      {/* Keypad */}
      <div className="w-full max-w-[320px] pb-6">
        <div className="grid grid-cols-3 gap-3">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'delete'].map(
            (key, idx) => {
              if (key === '') {
                return <div key={idx} />;
              }

              if (key === 'delete') {
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={handleDelete}
                    className={`h-14 rounded-2xl flex items-center justify-center border transition-all active:scale-95 ${borderClass} ${keyBg}`}
                    aria-label="Delete"
                  >
                    <Delete strokeWidth={1.5} className="w-5 h-5 opacity-70" />
                  </button>
                );
              }

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleDigit(key)}
                  className={`h-14 rounded-2xl flex items-center justify-center font-serif-display text-xl border transition-all active:scale-95 ${borderClass} ${keyBg}`}
                >
                  {key}
                </button>
              );
            }
          )}
        </div>
      </div>
    </div>
  );
};

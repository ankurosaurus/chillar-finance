import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

interface SheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  maxHeight?: string;
}

export const Sheet: React.FC<SheetProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxHeight = 'max-h-[90vh]',
}) => {
  const { isDark } = useTheme();

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  const sheetBg = isDark ? 'bg-[#131315]' : 'bg-[#FFFFFF]';
  const borderClass = isDark
    ? 'border-t border-[rgba(255,255,255,0.08)]'
    : 'border-t border-[rgba(0,0,0,0.08)]';
  const handleBg = isDark ? 'bg-white/20' : 'bg-black/15';

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
          />

          {/* Sheet Container */}
          <motion.div
            initial={{ y: '100%', opacity: 0.9 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0.9 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className={`relative w-full max-w-[480px] rounded-t-[32px] sm:rounded-[32px] ${sheetBg} ${borderClass} ${maxHeight} overflow-hidden flex flex-col z-10 shadow-2xl`}
          >
            {/* Grab handle */}
            <div className="w-full flex justify-center pt-3 pb-1 cursor-grab">
              <div className={`w-10 h-1 rounded-full ${handleBg}`} />
            </div>

            {/* Header if title provided */}
            {(title || subtitle) && (
              <div className="px-6 py-3 flex items-center justify-between border-b border-inherit">
                <div>
                  {title && (
                    <h3 className="font-serif-display text-lg font-light tracking-tight">
                      {title}
                    </h3>
                  )}
                  {subtitle && (
                    <p className={`text-xs ${isDark ? 'text-[#8A8A8F]' : 'text-[#75736E]'}`}>
                      {subtitle}
                    </p>
                  )}
                </div>
                <button
                  onClick={onClose}
                  className={`p-1.5 rounded-full transition-colors ${
                    isDark ? 'hover:bg-white/10 text-[#8A8A8F]' : 'hover:bg-black/5 text-[#75736E]'
                  }`}
                  aria-label="Close"
                >
                  <X strokeWidth={1.5} className="w-5 h-5" />
                </button>
              </div>
            )}

            {/* Content area */}
            <div className="px-6 py-4 overflow-y-auto flex-1">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

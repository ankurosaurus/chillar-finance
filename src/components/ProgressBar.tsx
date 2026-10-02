import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../hooks/useTheme';

interface ProgressBarProps {
  value: number; // 0 to 100+
  max?: number;
  height?: number;
  color?: 'gold' | 'sage' | 'terracotta' | 'auto';
  showPaceMarker?: boolean;
  paceMarkerPosition?: number; // 0 to 100%
  className?: string;
  isOverCap?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  height = 6,
  color = 'gold',
  showPaceMarker = false,
  paceMarkerPosition = 0,
  className = '',
  isOverCap = false,
}) => {
  const { isDark } = useTheme();

  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  const markerPct = Math.min(100, Math.max(0, paceMarkerPosition));

  let barBg = 'bg-[#C9A96E]';
  if (color === 'sage') barBg = 'bg-[#7FA38A]';
  if (color === 'terracotta' || isOverCap || percentage >= 100) barBg = 'bg-[#C77D6B]';
  if (color === 'auto') {
    if (percentage > 90) barBg = 'bg-[#C77D6B]';
    else if (percentage > 70) barBg = 'bg-[#C9A96E]';
    else barBg = 'bg-[#7FA38A]';
  }

  const trackBg = isDark ? 'bg-white/[0.08]' : 'bg-black/[0.06]';

  return (
    <div className={`relative w-full ${className}`}>
      <div
        className={`w-full overflow-hidden rounded-full ${trackBg}`}
        style={{ height: `${height}px` }}
      >
        <motion.div
          className={`h-full rounded-full ${barBg}`}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>

      {showPaceMarker && (
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none"
          style={{ left: `${markerPct}%` }}
        >
          <div
            className={`w-[2px] rounded-full ${
              isDark ? 'bg-white/80' : 'bg-black/70'
            }`}
            style={{ height: `${height + 8}px` }}
          />
        </div>
      )}
    </div>
  );
};

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Award, Info, X } from 'lucide-react';
import { useFinanceStore } from '../store/useFinanceStore';
import { useTheme } from '../hooks/useTheme';

export const AlertBanner: React.FC = () => {
  const alerts = useFinanceStore((state) => state.alerts);
  const dismissAlert = useFinanceStore((state) => state.dismissAlert);
  const { isDark } = useTheme();

  if (alerts.length === 0) return null;

  return (
    <div className="w-full flex flex-col gap-2 my-2 px-1">
      <AnimatePresence>
        {alerts.slice(0, 3).map((alert) => {
          let accentColor = 'border-blue-500/30 bg-blue-500/10 text-blue-400';
          let IconComponent = Info;

          if (alert.type === 'category_100' || alert.type === 'week_exhausted') {
            accentColor = 'border-[#F43F5E]/30 bg-[#F43F5E]/10 text-[#F43F5E]';
            IconComponent = AlertTriangle;
          } else if (alert.type === 'goal_milestone') {
            accentColor = 'border-[#10B981]/30 bg-[#10B981]/10 text-[#10B981]';
            IconComponent = Award;
          }

          return (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className={`rounded-2xl border px-3.5 py-2.5 flex items-start justify-between gap-3 ${accentColor}`}
            >
              <div className="flex items-start gap-2.5">
                <IconComponent strokeWidth={1.5} className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <h5 className="text-xs font-medium tracking-wide">
                    {alert.title}
                  </h5>
                  <p
                    className={`text-[11px] leading-relaxed mt-0.5 ${
                      isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'
                    }`}
                  >
                    {alert.message}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => dismissAlert(alert.id)}
                className="opacity-60 hover:opacity-100 p-0.5 rounded-full transition-opacity"
                aria-label="Dismiss alert"
              >
                <X strokeWidth={1.5} className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

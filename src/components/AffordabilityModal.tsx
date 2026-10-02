import React, { useState } from 'react';
import { Sparkles, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { Sheet } from './Sheet';
import { Card } from './Card';
import { Keypad } from './Keypad';
import { useFinanceStore } from '../store/useFinanceStore';
import { analyzeAffordability } from '../lib/budgetMath';
import { formatINR } from '../lib/formatters';
import { useTheme } from '../hooks/useTheme';

export const AffordabilityModal: React.FC = () => {
  const isOpen = useFinanceStore((state) => state.isAffordabilityModalOpen);
  const setOpen = useFinanceStore((state) => state.setAffordabilityModalOpen);
  const profile = useFinanceStore((state) => state.profile);
  const transactions = useFinanceStore((state) => state.transactions);
  const goals = useFinanceStore((state) => state.goals);
  const { isDark } = useTheme();

  const [amountStr, setAmountStr] = useState('450');
  const [showKeypad, setShowKeypad] = useState(false);

  const amount = parseFloat(amountStr) || 0;
  const nearestGoal = goals.find((g) => !g.isCompleted);
  const analysis = analyzeAffordability(amount, profile, transactions, nearestGoal, new Date());

  const handleClose = () => {
    setOpen(false);
    setShowKeypad(false);
  };

  return (
    <Sheet
      isOpen={isOpen}
      onClose={handleClose}
      title="Can I afford this?"
      subtitle="Simulate the impact on your weekly cashflow & goals"
    >
      <div className="flex flex-col gap-5 pb-6">
        {/* Prospective Amount Entry */}
        <div className="flex flex-col items-center">
          <span className="meta-label text-[#94A3B8] mb-1">
            Prospective Expense
          </span>
          <button
            type="button"
            onClick={() => setShowKeypad(!showKeypad)}
            className="flex items-baseline gap-1 py-1 px-4 rounded-2xl hover:bg-white/5 transition-colors"
          >
            <span className="font-serif-display text-4xl md:text-5xl font-light tnum text-[#D4AF37]">
              {formatINR(amount)}
            </span>
          </button>
          <span className="text-[11px] text-[#94A3B8] mt-1">
            {showKeypad ? 'Tap amount to minimize keypad' : 'Tap amount to change'}
          </span>
        </div>

        {/* Quick presets */}
        {!showKeypad && (
          <div className="flex items-center justify-center gap-2">
            {[150, 350, 750, 1500].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setAmountStr(preset.toString())}
                className={`px-3 py-1 text-xs rounded-full border transition-all ${
                  amount === preset
                    ? 'border-[#D4AF37] bg-[#D4AF37]/15 text-[#D4AF37]'
                    : isDark
                    ? 'border-white/10 hover:border-white/20 text-[#94A3B8]'
                    : 'border-black/10 hover:border-black/20 text-[#64748B]'
                }`}
              >
                ₹{preset}
              </button>
            ))}
          </div>
        )}

        {/* Interactive Keypad */}
        {showKeypad && (
          <div className="pt-2">
            <Keypad
              value={amountStr}
              onChange={setAmountStr}
              onDone={() => setShowKeypad(false)}
            />
          </div>
        )}

        {/* Analysis Verdict Card */}
        <Card
          variant="elevated"
          className={
            analysis.weeklyBudgetStatus === 'exceeded'
              ? 'border-[#F43F5E]/40 bg-[#F43F5E]/10'
              : analysis.weeklyBudgetStatus === 'tight'
              ? 'border-[#D4AF37]/40 bg-[#D4AF37]/10'
              : 'border-[#10B981]/40 bg-[#10B981]/10'
          }
        >
          <div className="flex items-center gap-2 mb-1.5">
            {analysis.weeklyBudgetStatus === 'exceeded' ? (
              <AlertCircle className="w-5 h-5 text-[#F43F5E]" />
            ) : analysis.weeklyBudgetStatus === 'tight' ? (
              <Sparkles className="w-5 h-5 text-[#D4AF37]" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-[#10B981]" />
            )}
            <h4
              className={`font-serif-display text-lg ${
                analysis.weeklyBudgetStatus === 'exceeded'
                  ? 'text-[#F43F5E]'
                  : analysis.weeklyBudgetStatus === 'tight'
                  ? 'text-[#D4AF37]'
                  : 'text-[#10B981]'
              }`}
            >
              {analysis.verdict}
            </h4>
          </div>
          <p
            className={`text-xs leading-relaxed ${
              isDark ? 'text-[#F8FAFC]/90' : 'text-[#0F172A]/90'
            }`}
          >
            {analysis.recommendationNote}
          </p>
        </Card>

        {/* Breakdown Before vs After */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="flex flex-col gap-1 p-4">
            <span className="meta-label text-[#94A3B8]">Safe Today Now</span>
            <span className="font-serif-display text-2xl tnum">
              {formatINR(analysis.currentSafeToday)}
            </span>
            <span className="text-[11px] text-[#94A3B8]">
              ₹{analysis.currentWeeklyRemaining} left this week
            </span>
          </Card>

          <Card className="flex flex-col gap-1 p-4">
            <span className="meta-label text-[#94A3B8]">Safe After Spend</span>
            <span
              className={`font-serif-display text-2xl tnum ${
                analysis.newSafeToday < 100
                  ? 'text-[#F43F5E]'
                  : 'text-[#D4AF37]'
              }`}
            >
              {formatINR(analysis.newSafeToday)}
            </span>
            <span className="text-[11px] text-[#94A3B8]">
              ₹{analysis.newWeeklyRemaining} left this week
            </span>
          </Card>
        </div>

        {/* Goal Impact */}
        {analysis.goalImpact && (
          <Card className="p-4 flex items-start gap-3">
            <Clock strokeWidth={1.5} className="w-5 h-5 text-[#D4AF37] shrink-0 mt-0.5" />
            <div>
              <span className="meta-label text-[#94A3B8] block mb-1">
                Impact on "{analysis.goalImpact.goalName}"
              </span>
              <p
                className={`text-xs leading-relaxed ${
                  isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'
                }`}
              >
                Spending this amount equals{' '}
                <strong className={isDark ? 'text-[#F8FAFC]' : 'text-[#0F172A]'}>
                  ~{analysis.goalImpact.delayDaysEstimate} days
                </strong>{' '}
                of goal savings pace.
              </p>
            </div>
          </Card>
        )}
      </div>
    </Sheet>
  );
};

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  ArrowLeft,
  Sparkles,
  ShieldCheck,
  Check,
  Plus,
  Trash2,
  Utensils,
} from 'lucide-react';
import { Card } from '../components/Card';
import { useFinanceStore } from '../store/useFinanceStore';
import { formatINR } from '../lib/formatters';
import { useTheme } from '../hooks/useTheme';
import { FixedCost } from '../types/finance';

export const Onboarding: React.FC = () => {
  const profile = useFinanceStore((state) => state.profile);
  const setProfile = useFinanceStore((state) => state.setProfile);
  const addGoal = useFinanceStore((state) => state.addGoal);
  const loadDemoData = useFinanceStore((state) => state.loadDemoData);
  const { isDark } = useTheme();

  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1: Inflows
  const [allowance, setAllowance] = useState('');
  const [extraIncome, setExtraIncome] = useState('');
  const [payDay, setPayDay] = useState('1');

  // Step 2: Fixed Costs
  const [fixedCosts, setFixedCosts] = useState<FixedCost[]>([
    { id: 'fc-mess', name: 'Hostel Mess (Prepaid)', amount: 4500, isPrepaidMess: true },
  ]);
  const [customCostName, setCustomCostName] = useState('');
  const [customCostAmount, setCustomCostAmount] = useState('');
  const [customCostPrepaid, setCustomCostPrepaid] = useState(false);

  // Step 3: Savings Target & First Goal
  const [savingsRate, setSavingsRate] = useState(20);
  const [goalName, setGoalName] = useState('');
  const [goalTarget, setGoalTarget] = useState('');

  // Math preview
  const totalIncome = (parseFloat(allowance) || 0) + (parseFloat(extraIncome) || 0);
  const deductibleFixedCosts = fixedCosts
    .filter((f) => !f.isPrepaidMess)
    .reduce((sum, f) => sum + f.amount, 0);
  const savingsTargetAmount = Math.round((totalIncome * savingsRate) / 100);
  const spendable = Math.max(0, totalIncome - deductibleFixedCosts - savingsTargetAmount);
  const weeklyEstimate = Math.round(spendable / 4.3);

  const handleAddCost = () => {
    if (!customCostName.trim()) return;
    const amountVal = parseFloat(customCostAmount) || 0;
    setFixedCosts([
      ...fixedCosts,
      {
        id: `fc-${Date.now()}`,
        name: customCostName.trim(),
        amount: amountVal,
        isPrepaidMess: customCostPrepaid,
      },
    ]);
    setCustomCostName('');
    setCustomCostAmount('');
    setCustomCostPrepaid(false);
  };

  const handleRemoveCost = (id: string) => {
    setFixedCosts(fixedCosts.filter((f) => f.id !== id));
  };

  const handleFinish = () => {
    setProfile({
      monthlyIncome: parseFloat(allowance) || 12000,
      extraIncome: parseFloat(extraIncome) || 0,
      payDay: parseInt(payDay, 10) || 1,
      fixedCosts,
      savingsRatePct: savingsRate,
      onboardingCompleted: true,
    });

    if (goalName.trim() && parseFloat(goalTarget) > 0) {
      addGoal({
        name: goalName.trim(),
        target: parseFloat(goalTarget),
        targetDate: new Date(Date.now() + 60 * 86400000).toISOString().slice(0, 10),
        roundUpEnabled: true,
        coverColor: '#C9A96E',
      });
    }
  };

  return (
    <div
      className={`min-h-screen w-full flex flex-col justify-between p-6 ${
        isDark ? 'bg-[#0B0B0C] text-[#F4F2EE]' : 'bg-[#F7F5F1] text-[#111111]'
      }`}
    >
      {/* Brand Header */}
      <div className="flex flex-col items-center text-center pt-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-serif-display text-3xl font-light tracking-[0.05em]">
            Chillar
          </span>
          <span className="w-2 h-2 rounded-full bg-[#C9A96E]" />
        </div>
        <p className={`text-xs ${isDark ? 'text-[#8A8A8F]' : 'text-[#75736E]'}`}>
          Every rupee, accounted for.
        </p>

        {/* 3 Steps indicator */}
        <div className="flex items-center gap-2 mt-6">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                s === step
                  ? 'w-8 bg-[#C9A96E]'
                  : s < step
                  ? 'w-4 bg-[#7FA38A]'
                  : isDark
                  ? 'w-4 bg-white/10'
                  : 'w-4 bg-black/10'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Main Step Content */}
      <div className="my-auto py-6 max-w-[420px] mx-auto w-full">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step-1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col gap-5"
            >
              <div>
                <span className="meta-label text-[#C9A96E] block mb-1">Step 1 of 3</span>
                <h3 className="font-serif-display text-2xl font-light">
                  Your monthly money
                </h3>
                <p className={`text-xs ${isDark ? 'text-[#8A8A8F]' : 'text-[#75736E]'}`}>
                  How much allowance arrives each month, and when?
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <div>
                  <label className="text-[11px] meta-label text-[#8A8A8F] mb-1 block">
                    Pocket Money / Allowance (₹)
                  </label>
                  <input
                    type="number"
                    value={allowance}
                    placeholder="e.g. 10000"
                    onChange={(e) => setAllowance(e.target.value)}
                    className={`w-full px-4 py-3 rounded-2xl border font-serif-display text-2xl tnum outline-none ${
                      isDark
                        ? 'bg-[#131315] border-white/10 text-[#C9A96E]'
                        : 'bg-white border-black/10 text-[#C9A96E]'
                    }`}
                  />
                </div>

                <div>
                  <label className="text-[11px] meta-label text-[#8A8A8F] mb-1 block">
                    Side Income / Tutoring (Optional ₹)
                  </label>
                  <input
                    type="number"
                    value={extraIncome}
                    onChange={(e) => setExtraIncome(e.target.value)}
                    className={`w-full px-4 py-2.5 rounded-2xl border text-sm font-serif-display tnum outline-none ${
                      isDark ? 'bg-[#131315] border-white/10' : 'bg-white border-black/10'
                    }`}
                  />
                </div>

                <div>
                  <label className="text-[11px] meta-label text-[#8A8A8F] mb-1 block">
                    Day of month it arrives
                  </label>
                  <select
                    value={payDay}
                    onChange={(e) => setPayDay(e.target.value)}
                    className={`w-full px-4 py-2.5 rounded-2xl border text-xs outline-none ${
                      isDark ? 'bg-[#131315] border-white/10' : 'bg-white border-black/10'
                    }`}
                  >
                    {[1, 5, 10, 15, 20, 25, 30].map((d) => (
                      <option key={d} value={d}>
                        {d}st / {d}th of every month
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step-2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col gap-4"
            >
              <div>
                <span className="meta-label text-[#C9A96E] block mb-1">Step 2 of 3</span>
                <h3 className="font-serif-display text-2xl font-light">
                  Fixed Costs & Mess
                </h3>
                <p className={`text-xs ${isDark ? 'text-[#8A8A8F]' : 'text-[#75736E]'}`}>
                  Hostel mess is already prepaid and excluded from daily deductions.
                </p>
              </div>

              {/* Fixed Costs List */}
              <div className="flex flex-col gap-2 max-h-52 overflow-y-auto pr-1">
                {fixedCosts.map((fc) => (
                  <div
                    key={fc.id}
                    className={`p-3 rounded-2xl border flex items-center justify-between text-xs ${
                      fc.isPrepaidMess
                        ? 'border-[#7FA38A]/30 bg-[#7FA38A]/5'
                        : isDark
                        ? 'border-white/5 bg-[#131315]'
                        : 'border-black/5 bg-white'
                    }`}
                  >
                    <div>
                      <span className="font-medium block">{fc.name}</span>
                      {fc.isPrepaidMess && (
                        <span className="text-[10px] text-[#7FA38A]">
                          Prepaid Mess (No monthly deduction)
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-serif-display tnum">
                        {formatINR(fc.amount)}
                      </span>
                      {!fc.isPrepaidMess && (
                        <button
                          type="button"
                          onClick={() => handleRemoveCost(fc.id)}
                          className="p-1 text-[#C77D6B] opacity-60 hover:opacity-100"
                        >
                          <Trash2 strokeWidth={1.5} className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Custom Cost */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <input
                  type="text"
                  placeholder="Cost name"
                  value={customCostName}
                  onChange={(e) => setCustomCostName(e.target.value)}
                  className={`px-3 py-2 rounded-xl border text-xs outline-none ${
                    isDark ? 'bg-[#131315] border-white/10' : 'bg-white border-black/10'
                  }`}
                />
                <div className="flex gap-1">
                  <input
                    type="number"
                    placeholder="₹"
                    value={customCostAmount}
                    onChange={(e) => setCustomCostAmount(e.target.value)}
                    className={`flex-1 px-3 py-2 rounded-xl border text-xs outline-none ${
                      isDark ? 'bg-[#131315] border-white/10' : 'bg-white border-black/10'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={handleAddCost}
                    className="px-3 rounded-xl bg-[#C9A96E]/20 text-[#C9A96E] hover:bg-[#C9A96E]/30 text-xs font-medium"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step-3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col gap-4"
            >
              <div>
                <span className="meta-label text-[#C9A96E] block mb-1">Step 3 of 3</span>
                <h3 className="font-serif-display text-2xl font-light">
                  Savings & First Goal
                </h3>
                <p className={`text-xs ${isDark ? 'text-[#8A8A8F]' : 'text-[#75736E]'}`}>
                  Lock away funds first so you can travel or buy things guilt-free.
                </p>
              </div>

              {/* Savings Rate Buttons */}
              <div>
                <label className="text-[11px] meta-label text-[#8A8A8F] mb-1.5 block">
                  Savings Rate ({savingsRate}%)
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[10, 20, 25, 30].map((rate) => (
                    <button
                      key={rate}
                      type="button"
                      onClick={() => setSavingsRate(rate)}
                      className={`py-2 rounded-xl text-xs font-medium border transition-all ${
                        savingsRate === rate
                          ? 'border-[#C9A96E] bg-[#C9A96E]/20 text-[#C9A96E]'
                          : isDark
                          ? 'border-white/5 bg-[#131315] text-[#8A8A8F]'
                          : 'border-black/5 bg-white text-[#75736E]'
                      }`}
                    >
                      {rate}%
                    </button>
                  ))}
                </div>
              </div>

              {/* First Goal */}
              <div className="flex flex-col gap-2 pt-1">
                <label className="text-[11px] meta-label text-[#8A8A8F] block">
                  Name your first goal
                </label>
                <input
                  type="text"
                  value={goalName}
                  onChange={(e) => setGoalName(e.target.value)}
                  placeholder="e.g. Goa Trip, New Phone"
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none ${
                    isDark ? 'bg-[#131315] border-white/10' : 'bg-white border-black/10'
                  }`}
                />
                <input
                  type="number"
                  value={goalTarget}
                  onChange={(e) => setGoalTarget(e.target.value)}
                  placeholder="Target (₹)"
                  className={`w-full px-3.5 py-2.5 rounded-xl border font-serif-display text-lg tnum outline-none ${
                    isDark ? 'bg-[#131315] border-white/10' : 'bg-white border-black/10'
                  }`}
                />
              </div>

              {/* Calculated Spendable Summary */}
              <Card
                variant="elevated"
                className="border-[#C9A96E]/30 bg-[#C9A96E]/5 p-4 flex flex-col gap-1 text-center"
              >
                <span className="meta-label text-[#8A8A8F]">Auto-Computed Monthly Spendable</span>
                <span className="font-serif-display text-3xl text-[#C9A96E] tnum">
                  {formatINR(spendable)}
                </span>
                <span className="text-[11px] text-[#8A8A8F]">
                  ≈ {formatINR(weeklyEstimate)} per week ({formatINR(Math.round(weeklyEstimate / 7))}/day)
                </span>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer Navigation & Explore Demo Data */}
      <div className="flex flex-col gap-3 max-w-[420px] mx-auto w-full">
        <div className="flex items-center gap-2">
          {step > 1 && (
            <button
              type="button"
              onClick={() => setStep((s) => (s - 1) as 1 | 2)}
              className="px-4 py-3.5 rounded-2xl border border-inherit text-xs flex items-center justify-center transition-colors"
            >
              <ArrowLeft strokeWidth={1.5} className="w-4 h-4" />
            </button>
          )}

          {step < 3 ? (
            <button
              type="button"
              onClick={() => setStep((s) => (s + 1) as 2 | 3)}
              className="flex-1 py-3.5 rounded-2xl bg-[#C9A96E] hover:bg-[#D7BC88] text-[#0B0B0C] font-serif-display text-base tracking-wide font-medium flex items-center justify-center gap-2 transition-colors"
            >
              <span>Continue</span>
              <ArrowRight strokeWidth={1.5} className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinish}
              className="flex-1 py-3.5 rounded-2xl bg-[#C9A96E] hover:bg-[#D7BC88] text-[#0B0B0C] font-serif-display text-base tracking-wide font-medium flex items-center justify-center gap-2 transition-colors"
            >
              <span>Enter Chillar</span>
              <Check strokeWidth={1.5} className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Start Blank button */}
        <button
          type="button"
          onClick={handleFinish}
          className={`py-2 text-xs transition-colors flex items-center justify-center gap-1.5 ${
            isDark ? 'text-[#8A8A8F] hover:text-[#C9A96E]' : 'text-[#75736E] hover:text-[#C9A96E]'
          }`}
        >
          <span>Skip setup & start with blank ledger</span>
        </button>
      </div>
    </div>
  );
};

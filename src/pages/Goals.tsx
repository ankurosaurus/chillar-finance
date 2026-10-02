import React, { useState } from 'react';
import {
  Target,
  Plus,
  Sparkles,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  Check,
  Zap,
  History,
  TrendingUp,
} from 'lucide-react';
import { Card } from '../components/Card';
import { ProgressBar } from '../components/ProgressBar';
import { Sheet } from '../components/Sheet';
import { EmptyState } from '../components/EmptyState';
import { useFinanceStore } from '../store/useFinanceStore';
import { calculateGoalMetrics } from '../lib/budgetMath';
import { formatINR, formatDate } from '../lib/formatters';
import { useTheme } from '../hooks/useTheme';
import { Goal, GoalContribution } from '../types/finance';

export const Goals: React.FC = () => {
  const goals = useFinanceStore((state) => state.goals);
  const addGoal = useFinanceStore((state) => state.addGoal);
  const updateGoal = useFinanceStore((state) => state.updateGoal);
  const deleteGoal = useFinanceStore((state) => state.deleteGoal);
  const contributeToGoal = useFinanceStore((state) => state.contributeToGoal);
  const withdrawFromGoal = useFinanceStore((state) => state.withdrawFromGoal);
  const challenges = useFinanceStore((state) => state.challenges);
  const acceptChallenge = useFinanceStore((state) => state.acceptChallenge);
  const completeChallenge = useFinanceStore((state) => state.completeChallenge);
  const { isDark } = useTheme();

  // Create Goal State
  const [isCreatingGoal, setIsCreatingGoal] = useState(false);
  const [goalName, setGoalName] = useState('');
  const [goalTarget, setGoalTarget] = useState('');
  const [goalTargetDate, setGoalTargetDate] = useState('');
  const [goalRoundUp, setGoalRoundUp] = useState(false);
  const [goalColor, setGoalColor] = useState('#C9A96E');

  // Goal Details & Actions Sheet
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [actionType, setActionType] = useState<'contribute' | 'withdraw' | null>(null);
  const [actionAmount, setActionAmount] = useState('');
  const [actionNote, setActionNote] = useState('');

  const today = new Date();

  const handleCreateGoal = () => {
    const targetVal = parseFloat(goalTarget);
    if (!goalName.trim() || isNaN(targetVal) || targetVal <= 0) return;

    addGoal({
      name: goalName.trim(),
      target: targetVal,
      targetDate: goalTargetDate || new Date(Date.now() + 60 * 86400000).toISOString().slice(0, 10),
      roundUpEnabled: goalRoundUp,
      coverColor: goalColor,
    });

    setIsCreatingGoal(false);
    setGoalName('');
    setGoalTarget('');
    setGoalTargetDate('');
    setGoalRoundUp(false);
  };

  const handleExecuteAction = () => {
    if (!selectedGoal) return;
    const amountVal = parseFloat(actionAmount);
    if (isNaN(amountVal) || amountVal <= 0) return;

    if (actionType === 'contribute') {
      contributeToGoal(selectedGoal.id, amountVal, actionNote.trim() || undefined);
    } else if (actionType === 'withdraw') {
      withdrawFromGoal(selectedGoal.id, amountVal, actionNote.trim() || undefined);
    }

    // Refresh selectedGoal reference
    const updated = useFinanceStore.getState().goals.find((g) => g.id === selectedGoal.id);
    setSelectedGoal(updated || null);
    setActionType(null);
    setActionAmount('');
    setActionNote('');
  };

  const handleToggleRoundUp = (goalId: string, current: boolean) => {
    // If enabling on this goal, disable on other goals so only 1 goal receives roundups
    if (!current) {
      goals.forEach((g) => {
        if (g.id !== goalId && g.roundUpEnabled) {
          updateGoal(g.id, { roundUpEnabled: false });
        }
      });
    }
    updateGoal(goalId, { roundUpEnabled: !current });
    if (selectedGoal?.id === goalId) {
      setSelectedGoal((prev) => (prev ? { ...prev, roundUpEnabled: !current } : null));
    }
  };

  const paletteColors = ['#C9A96E', '#7FA38A', '#9585BA', '#C77D6B', '#7B92A8'];

  return (
    <div className="flex flex-col gap-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <h2 className="font-serif-display text-2xl font-light">Goals & Desires</h2>
          <span className="text-xs text-[#8A8A8F]">
            Dedicated funds for trips, movies, & tech
          </span>
        </div>

        <button
          type="button"
          onClick={() => setIsCreatingGoal(true)}
          className="p-2 rounded-2xl border border-[#C9A96E]/30 text-[#C9A96E] hover:bg-[#C9A96E]/10 transition-colors flex items-center gap-1 text-xs font-medium"
        >
          <Plus strokeWidth={1.5} className="w-4 h-4" />
          <span>New Goal</span>
        </button>
      </div>

      {/* Goal Cards Grid / List */}
      {goals.length === 0 ? (
        <EmptyState
          sentence="You haven't set any savings goals yet."
          actionText="Create your first goal"
          onAction={() => setIsCreatingGoal(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {goals.map((goal) => {
            const metrics = calculateGoalMetrics(goal, today);
            return (
              <Card
                key={goal.id}
                onClick={() => setSelectedGoal(goal)}
                className={`cursor-pointer transition-all relative overflow-hidden ${
                  metrics.isComplete
                    ? 'border-[#D4AF37]/50 animate-shimmer'
                    : 'hover:border-[#D4AF37]/35'
                }`}
              >
                {/* Minimal Top Color Indicator */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: goal.coverColor || '#D4AF37' }}
                    />
                    <h3 className="font-serif-display text-lg font-light tracking-wide">
                      {goal.name}
                    </h3>
                  </div>

                  {metrics.isComplete ? (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-[#D4AF37] text-[#08090C] tracking-wide uppercase">
                      Achieved
                    </span>
                  ) : (
                    <span className="text-[11px] text-[#94A3B8]">
                      Target: {formatDate(goal.targetDate, 'MMM yyyy')}
                    </span>
                  )}
                </div>

                {/* Amounts & Percentage */}
                <div className="flex items-baseline justify-between mb-2">
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-serif-display text-3xl font-light tnum text-[#D4AF37]">
                      {formatINR(goal.saved)}
                    </span>
                    <span className="text-xs text-[#94A3B8]">
                      / {formatINR(goal.target)}
                    </span>
                  </div>

                  <span className="meta-label text-[#94A3B8]">
                    {metrics.percentageSaved}%
                  </span>
                </div>

                <ProgressBar
                  value={goal.saved}
                  max={goal.target}
                  height={6}
                  color={metrics.isComplete ? 'gold' : 'gold'}
                />

                {/* Required Pace Indicators */}
                <div className="flex items-center justify-between mt-3 text-xs text-[#94A3B8]">
                  <span>
                    {metrics.isComplete
                      ? 'Fund fully accumulated'
                      : `Requires ${formatINR(metrics.requiredPerWeek)}/week`}
                  </span>
                  <span>
                    {metrics.isComplete ? 'Ready' : `${metrics.weeksRemaining} wks remaining`}
                  </span>
                </div>

                {/* Round Up Active Badge */}
                {goal.roundUpEnabled && !metrics.isComplete && (
                  <div className="mt-2.5 pt-2 border-t border-inherit flex items-center justify-between text-[11px] text-[#D4AF37]">
                    <div className="flex items-center gap-1.5">
                      <Zap strokeWidth={1.5} className="w-3.5 h-3.5" />
                      <span>Round-Up active (auto ₹10 micro-saves)</span>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Saving Challenges Strip */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="meta-label text-[#94A3B8]">Hostel Challenges</span>
          <span className="text-[11px] text-[#D4AF37] flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Frictionless Savings</span>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {challenges.map((ch) => {
            const linkedGoal = goals.find((g) => g.id === ch.goalId);
            return (
              <Card
                key={ch.id}
                className={`transition-colors ${
                  ch.completed
                    ? 'border-[#10B981]/30 bg-[#10B981]/5'
                    : ch.accepted
                    ? 'border-[#D4AF37]/30 bg-[#D4AF37]/5'
                    : ''
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-medium tracking-tight">
                        {ch.title}
                      </h4>
                      <span className="text-xs font-serif-display tnum text-[#D4AF37]">
                        +{formatINR(ch.savingsEstimate)}
                      </span>
                    </div>
                    <p className="text-xs text-[#94A3B8] mt-1 leading-relaxed">
                      {ch.description}
                    </p>
                    {linkedGoal && (
                      <span className="text-[11px] text-[#94A3B8] mt-1 block">
                        Towards: <strong className="font-normal text-[#D4AF37]">{linkedGoal.name}</strong>
                      </span>
                    )}
                  </div>

                  <div className="shrink-0 flex items-center">
                    {ch.completed ? (
                      <span className="text-xs text-[#10B981] font-medium flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#10B981]/15">
                        <Check className="w-3.5 h-3.5" />
                        Completed
                      </span>
                    ) : ch.accepted ? (
                      <button
                        type="button"
                        onClick={() => completeChallenge(ch.id)}
                        className="px-3 py-1.5 rounded-full text-xs font-medium bg-[#D4AF37] text-[#08090C] hover:bg-[#E5C358] transition-colors"
                      >
                        Claim ₹{ch.savingsEstimate}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => acceptChallenge(ch.id)}
                        className="px-3 py-1.5 rounded-full text-xs font-medium border border-[#D4AF37]/40 text-[#D4AF37] hover:bg-[#D4AF37]/10 transition-colors"
                      >
                        Accept
                      </button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Goal Details & Contribution Bottom Sheet */}
      <Sheet
        isOpen={!!selectedGoal}
        onClose={() => {
          setSelectedGoal(null);
          setActionType(null);
        }}
        title={selectedGoal?.name}
        subtitle={`Target: ${formatINR(selectedGoal?.target || 0)}`}
      >
        {selectedGoal && (
          <div className="flex flex-col gap-4 pb-6">
            {/* Goal Celebration Banner if completed */}
            {selectedGoal.saved >= selectedGoal.target && (
              <div className="p-4 rounded-2xl border border-[#C9A96E] bg-[#C9A96E]/10 animate-shimmer text-center flex flex-col items-center">
                <span className="font-serif-display text-xl text-[#C9A96E] mb-1">
                  Goal Accomplished
                </span>
                <p className="text-xs text-[#8A8A8F]">
                  You successfully saved {formatINR(selectedGoal.target)}. Ready to enjoy!
                </p>
              </div>
            )}

            {/* Current Status */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-inherit border border-inherit">
              <div>
                <span className="meta-label text-[#8A8A8F] block mb-1">Saved So Far</span>
                <span className="font-serif-display text-3xl tnum text-[#C9A96E]">
                  {formatINR(selectedGoal.saved)}
                </span>
              </div>
              <div className="text-right">
                <span className="meta-label text-[#8A8A8F] block mb-1">Remaining</span>
                <span className="font-serif-display text-2xl tnum text-[#8A8A8F]">
                  {formatINR(Math.max(0, selectedGoal.target - selectedGoal.saved))}
                </span>
              </div>
            </div>

            {/* Action Buttons: Add / Withdraw */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setActionType('contribute')}
                className={`py-3 rounded-2xl border text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${
                  actionType === 'contribute'
                    ? 'border-[#C9A96E] bg-[#C9A96E]/15 text-[#C9A96E]'
                    : 'border-inherit hover:border-[#C9A96E]/40'
                }`}
              >
                <ArrowDownLeft strokeWidth={1.5} className="w-4 h-4 text-[#7FA38A]" />
                <span>Add to Goal</span>
              </button>

              <button
                type="button"
                onClick={() => setActionType('withdraw')}
                className={`py-3 rounded-2xl border text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${
                  actionType === 'withdraw'
                    ? 'border-[#C9A96E] bg-[#C9A96E]/15 text-[#C9A96E]'
                    : 'border-inherit hover:border-[#C9A96E]/40'
                }`}
              >
                <ArrowUpRight strokeWidth={1.5} className="w-4 h-4 text-[#C77D6B]" />
                <span>Withdraw</span>
              </button>
            </div>

            {/* Action Input Form */}
            {actionType && (
              <div className="p-4 rounded-2xl border border-[#C9A96E]/30 bg-[#C9A96E]/5 flex flex-col gap-3">
                <span className="meta-label text-[#8A8A8F]">
                  {actionType === 'contribute' ? 'Amount to deposit (₹)' : 'Amount to withdraw (₹)'}
                </span>
                <input
                  type="number"
                  placeholder="e.g. 500"
                  value={actionAmount}
                  onChange={(e) => setActionAmount(e.target.value)}
                  className={`w-full px-4 py-2.5 rounded-xl border font-serif-display text-xl tnum outline-none ${
                    isDark
                      ? 'bg-[#1A1A1D] border-white/10 text-[#C9A96E]'
                      : 'bg-[#EFECE6] border-black/10 text-[#C9A96E]'
                  }`}
                />
                <input
                  type="text"
                  placeholder="Note (optional)"
                  value={actionNote}
                  onChange={(e) => setActionNote(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl border text-xs outline-none ${
                    isDark ? 'bg-[#1A1A1D] border-white/10' : 'bg-[#EFECE6] border-black/10'
                  }`}
                />
                <button
                  type="button"
                  onClick={handleExecuteAction}
                  className="py-2.5 rounded-xl bg-[#C9A96E] text-[#0B0B0C] text-xs font-medium hover:bg-[#D7BC88] transition-colors"
                >
                  Confirm {actionType === 'contribute' ? 'Deposit' : 'Withdrawal'}
                </button>
              </div>
            )}

            {/* Round-Up Toggle for this Goal */}
            <div
              onClick={() => handleToggleRoundUp(selectedGoal.id, selectedGoal.roundUpEnabled)}
              className={`flex items-center justify-between p-3.5 rounded-2xl border cursor-pointer transition-colors ${
                selectedGoal.roundUpEnabled
                  ? 'border-[#C9A96E]/30 bg-[#C9A96E]/5'
                  : 'border-inherit'
              }`}
            >
              <div className="flex items-center gap-2">
                <Zap strokeWidth={1.5} className="w-4 h-4 text-[#C9A96E]" />
                <div>
                  <h5 className="text-xs font-medium">Round-Up Micro Savings</h5>
                  <p className="text-[11px] text-[#8A8A8F]">
                    Round daily expenses up to ₹10 into this goal
                  </p>
                </div>
              </div>

              <div
                className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                  selectedGoal.roundUpEnabled
                    ? 'bg-[#C9A96E] border-[#C9A96E] text-[#0B0B0C]'
                    : 'border-[#8A8A8F]'
                }`}
              >
                {selectedGoal.roundUpEnabled && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </div>
            </div>

            {/* Contribution History */}
            <div className="flex flex-col gap-2 pt-2">
              <div className="flex items-center gap-1.5">
                <History strokeWidth={1.5} className="w-3.5 h-3.5 text-[#8A8A8F]" />
                <span className="meta-label text-[#8A8A8F]">History of Contributions</span>
              </div>

              {selectedGoal.contributions.length === 0 ? (
                <p className="text-xs text-[#8A8A8F] py-2">No contributions logged yet.</p>
              ) : (
                <div className="divide-y divide-inherit rounded-2xl border border-inherit overflow-hidden">
                  {selectedGoal.contributions.map((c) => (
                    <div key={c.id} className="p-3 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-medium block">{c.note || 'Contribution'}</span>
                        <span className="text-[10px] text-[#8A8A8F]">
                          {formatDate(c.date, 'd MMM yyyy')}
                        </span>
                      </div>
                      <span
                        className={`font-serif-display text-sm tnum ${
                          c.amount >= 0 ? 'text-[#7FA38A]' : 'text-[#C77D6B]'
                        }`}
                      >
                        {c.amount >= 0 ? `+${formatINR(c.amount)}` : formatINR(c.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Delete Goal Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  deleteGoal(selectedGoal.id);
                  setSelectedGoal(null);
                }}
                className="w-full py-2.5 rounded-2xl border border-[#C77D6B]/30 text-[#C77D6B] hover:bg-[#C77D6B]/10 text-xs transition-colors"
              >
                Delete this goal
              </button>
            </div>
          </div>
        )}
      </Sheet>

      {/* Create New Goal Sheet */}
      <Sheet
        isOpen={isCreatingGoal}
        onClose={() => setIsCreatingGoal(false)}
        title="Create New Goal"
        subtitle="Set a target for your next adventure or gadget"
      >
        <div className="flex flex-col gap-4 pb-4">
          <div>
            <span className="meta-label text-[#8A8A8F] mb-1 block">Goal Name</span>
            <input
              type="text"
              placeholder="e.g. Goa Trip, New Laptop, Concert"
              value={goalName}
              onChange={(e) => setGoalName(e.target.value)}
              className={`w-full px-3.5 py-2.5 rounded-2xl border text-sm outline-none ${
                isDark
                  ? 'bg-[#1A1A1D] border-white/10 text-[#F4F2EE]'
                  : 'bg-[#EFECE6] border-black/10 text-[#111111]'
              }`}
            />
          </div>

          <div>
            <span className="meta-label text-[#8A8A8F] mb-1 block">Target Amount (₹)</span>
            <input
              type="number"
              placeholder="e.g. 8000"
              value={goalTarget}
              onChange={(e) => setGoalTarget(e.target.value)}
              className={`w-full px-4 py-3 rounded-2xl border font-serif-display text-2xl tnum outline-none ${
                isDark
                  ? 'bg-[#1A1A1D] border-white/10 text-[#C9A96E]'
                  : 'bg-[#EFECE6] border-black/10 text-[#C9A96E]'
              }`}
            />
          </div>

          <div>
            <span className="meta-label text-[#8A8A8F] mb-1 block">Target Date</span>
            <input
              type="date"
              value={goalTargetDate}
              onChange={(e) => setGoalTargetDate(e.target.value)}
              className={`w-full px-3.5 py-2.5 rounded-2xl border text-xs outline-none ${
                isDark ? 'bg-[#1A1A1D] border-white/10' : 'bg-[#EFECE6] border-black/10'
              }`}
            />
          </div>

          {/* Palette Color Selection */}
          <div>
            <span className="meta-label text-[#8A8A8F] mb-2 block">Cover Accent</span>
            <div className="flex gap-3">
              {paletteColors.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setGoalColor(color)}
                  className={`w-7 h-7 rounded-full transition-transform ${
                    goalColor === color ? 'scale-125 ring-2 ring-[#C9A96E]' : 'opacity-80'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={handleCreateGoal}
            disabled={!goalName.trim() || !goalTarget}
            className="w-full py-3.5 rounded-2xl bg-[#C9A96E] hover:bg-[#D7BC88] text-[#0B0B0C] font-serif-display text-base tracking-wide font-medium transition-colors disabled:opacity-50"
          >
            Create Goal
          </button>
        </div>
      </Sheet>
    </div>
  );
};

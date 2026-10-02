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
  const [goalColor, setGoalColor] = useState('#3B82F6');

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

  const paletteColors = ['#3B82F6', '#2563EB', '#10B981', '#F43F5E', '#8B5CF6'];

  return (
    <div className="flex flex-col gap-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <h2 className="font-serif-display text-2xl font-light">Goals & Desires</h2>
          <span className="text-xs text-slate-400">
            Dedicated funds for trips, movies, & tech
          </span>
        </div>

        <button
          type="button"
          onClick={() => setIsCreatingGoal(true)}
          className="p-2 rounded-2xl border border-blue-500/30 text-blue-400 hover:bg-blue-600/10 transition-colors flex items-center gap-1 text-xs font-medium"
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
                    ? 'border-blue-500/50 animate-shimmer'
                    : 'hover:border-blue-500/35'
                }`}
              >
                {/* Minimal Top Color Indicator */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: goal.coverColor || '#3B82F6' }}
                    />
                    <h3 className="font-serif-display text-lg font-light tracking-wide">
                      {goal.name}
                    </h3>
                  </div>

                  {metrics.isComplete ? (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-blue-600 text-white tracking-wide uppercase">
                      Achieved
                    </span>
                  ) : (
                    <span className="text-[11px] text-slate-400">
                      Target: {formatDate(goal.targetDate, 'MMM yyyy')}
                    </span>
                  )}
                </div>

                {/* Amounts & Percentage */}
                <div className="flex items-baseline justify-between mb-2">
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-serif-display text-3xl font-light tnum text-blue-400">
                      {formatINR(goal.saved)}
                    </span>
                    <span className="text-xs text-slate-400">
                      / {formatINR(goal.target)}
                    </span>
                  </div>

                  <span className="meta-label text-slate-400">
                    {metrics.percentageSaved}%
                  </span>
                </div>

                <ProgressBar
                  value={goal.saved}
                  max={goal.target}
                  height={6}
                  color={metrics.isComplete ? 'sage' : 'blue'}
                />

                {/* Required Pace Indicators */}
                <div className="flex items-center justify-between mt-3 text-xs text-slate-400">
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
                  <div className="mt-2.5 pt-2 border-t border-inherit flex items-center justify-between text-[11px] text-blue-400">
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
          <span className="meta-label text-slate-400">Hostel Challenges</span>
          <span className="text-[11px] text-blue-400 flex items-center gap-1">
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
                    ? 'border-emerald-500/30 bg-emerald-500/5'
                    : ch.accepted
                    ? 'border-blue-500/30 bg-blue-600/5'
                    : ''
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-medium tracking-tight">
                        {ch.title}
                      </h4>
                      <span className="text-xs font-serif-display tnum text-blue-400">
                        +{formatINR(ch.savingsEstimate)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      {ch.description}
                    </p>
                    {linkedGoal && (
                      <span className="text-[11px] text-slate-400 mt-1 block">
                        Towards: <strong className="font-normal text-blue-400">{linkedGoal.name}</strong>
                      </span>
                    )}
                  </div>

                  <div className="shrink-0 flex items-center">
                    {ch.completed ? (
                      <span className="text-xs text-emerald-400 font-medium flex items-center gap-1 px-3 py-1.5 rounded-full bg-emerald-500/15">
                        <Check className="w-3.5 h-3.5" />
                        Completed
                      </span>
                    ) : ch.accepted ? (
                      <button
                        type="button"
                        onClick={() => completeChallenge(ch.id)}
                        className="px-3 py-1.5 rounded-full text-xs font-medium bg-blue-600 text-white hover:bg-blue-500 transition-colors"
                      >
                        Claim ₹{ch.savingsEstimate}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => acceptChallenge(ch.id)}
                        className="px-3 py-1.5 rounded-full text-xs font-medium border border-blue-500/40 text-blue-400 hover:bg-blue-600/10 transition-colors"
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
              <div className="p-4 rounded-2xl border border-blue-500 bg-blue-600/10 animate-shimmer text-center flex flex-col items-center">
                <span className="font-serif-display text-xl text-blue-400 mb-1">
                  Goal Accomplished
                </span>
                <p className="text-xs text-slate-400">
                  You successfully saved {formatINR(selectedGoal.target)}. Ready to enjoy!
                </p>
              </div>
            )}

            {/* Current Status */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-inherit border border-inherit">
              <div>
                <span className="meta-label text-slate-400 block mb-1">Saved So Far</span>
                <span className="font-serif-display text-3xl tnum text-blue-400">
                  {formatINR(selectedGoal.saved)}
                </span>
              </div>
              <div className="text-right">
                <span className="meta-label text-slate-400 block mb-1">Remaining</span>
                <span className="font-serif-display text-2xl tnum text-slate-400">
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
                    ? 'border-blue-500 bg-blue-600/15 text-blue-400'
                    : 'border-inherit hover:border-blue-500/40'
                }`}
              >
                <ArrowDownLeft strokeWidth={1.5} className="w-4 h-4 text-emerald-400" />
                <span>Add to Goal</span>
              </button>

              <button
                type="button"
                onClick={() => setActionType('withdraw')}
                className={`py-3 rounded-2xl border text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${
                  actionType === 'withdraw'
                    ? 'border-blue-500 bg-blue-600/15 text-blue-400'
                    : 'border-inherit hover:border-blue-500/40'
                }`}
              >
                <ArrowUpRight strokeWidth={1.5} className="w-4 h-4 text-rose-400" />
                <span>Withdraw</span>
              </button>
            </div>

            {/* Action Input Form */}
            {actionType && (
              <div className="p-4 rounded-2xl border border-blue-500/30 bg-blue-600/5 flex flex-col gap-3">
                <span className="meta-label text-slate-400">
                  {actionType === 'contribute' ? 'Amount to deposit (₹)' : 'Amount to withdraw (₹)'}
                </span>
                <input
                  type="number"
                  placeholder="e.g. 500"
                  value={actionAmount}
                  onChange={(e) => setActionAmount(e.target.value)}
                  className={`w-full px-4 py-2.5 rounded-xl border font-serif-display text-xl tnum outline-none ${
                    isDark
                      ? 'bg-[#0B0F19] border-white/10 text-blue-400'
                      : 'bg-slate-100 border-slate-200 text-blue-600'
                  }`}
                />
                <input
                  type="text"
                  placeholder="Note (optional)"
                  value={actionNote}
                  onChange={(e) => setActionNote(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl border text-xs outline-none ${
                    isDark ? 'bg-[#0B0F19] border-white/10 text-white' : 'bg-slate-100 border-slate-200 text-slate-900'
                  }`}
                />
                <button
                  type="button"
                  onClick={handleExecuteAction}
                  className="py-2.5 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-500 transition-colors shadow-md shadow-blue-600/20"
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
                  ? 'border-blue-500/30 bg-blue-600/5'
                  : 'border-inherit'
              }`}
            >
              <div className="flex items-center gap-2">
                <Zap strokeWidth={1.5} className="w-4 h-4 text-blue-400" />
                <div>
                  <h5 className="text-xs font-medium">Round-Up Micro Savings</h5>
                  <p className="text-[11px] text-slate-400">
                    Round daily expenses up to ₹10 into this goal
                  </p>
                </div>
              </div>

              <div
                className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                  selectedGoal.roundUpEnabled
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'border-slate-500'
                }`}
              >
                {selectedGoal.roundUpEnabled && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </div>
            </div>

            {/* Contribution History */}
            <div className="flex flex-col gap-2 pt-2">
              <div className="flex items-center gap-1.5">
                <History strokeWidth={1.5} className="w-3.5 h-3.5 text-slate-400" />
                <span className="meta-label text-slate-400">History of Contributions</span>
              </div>

              {selectedGoal.contributions.length === 0 ? (
                <p className="text-xs text-slate-400 py-2">No contributions logged yet.</p>
              ) : (
                <div className="divide-y divide-inherit rounded-2xl border border-inherit overflow-hidden">
                  {selectedGoal.contributions.map((c) => (
                    <div key={c.id} className="p-3 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-medium block">{c.note || 'Contribution'}</span>
                        <span className="text-[10px] text-slate-400">
                          {formatDate(c.date, 'd MMM yyyy')}
                        </span>
                      </div>
                      <span
                        className={`font-serif-display text-sm tnum ${
                          c.amount >= 0 ? 'text-emerald-400' : 'text-rose-400'
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
                className="w-full py-2.5 rounded-2xl border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 text-xs transition-colors"
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
            <span className="meta-label text-slate-400 mb-1 block">Goal Name</span>
            <input
              type="text"
              placeholder="e.g. Goa Trip, New Laptop, Concert"
              value={goalName}
              onChange={(e) => setGoalName(e.target.value)}
              className={`w-full px-3.5 py-2.5 rounded-2xl border text-sm outline-none ${
                isDark
                  ? 'bg-[#0B0F19] border-white/10 text-white'
                  : 'bg-slate-100 border-slate-200 text-slate-900'
              }`}
            />
          </div>

          <div>
            <span className="meta-label text-slate-400 mb-1 block">Target Amount (₹)</span>
            <input
              type="number"
              placeholder="e.g. 8000"
              value={goalTarget}
              onChange={(e) => setGoalTarget(e.target.value)}
              className={`w-full px-4 py-3 rounded-2xl border font-serif-display text-2xl tnum outline-none ${
                isDark
                  ? 'bg-[#0B0F19] border-white/10 text-blue-400'
                  : 'bg-slate-100 border-slate-200 text-blue-600'
              }`}
            />
          </div>

          <div>
            <span className="meta-label text-slate-400 mb-1 block">Target Date</span>
            <input
              type="date"
              value={goalTargetDate}
              onChange={(e) => setGoalTargetDate(e.target.value)}
              className={`w-full px-3.5 py-2.5 rounded-2xl border text-xs outline-none ${
                isDark ? 'bg-[#0B0F19] border-white/10 text-white' : 'bg-slate-100 border-slate-200 text-slate-900'
              }`}
            />
          </div>

          {/* Palette Color Selection */}
          <div>
            <span className="meta-label text-slate-400 mb-2 block">Cover Accent</span>
            <div className="flex gap-3">
              {paletteColors.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setGoalColor(color)}
                  className={`w-7 h-7 rounded-full transition-transform ${
                    goalColor === color ? 'scale-125 ring-2 ring-blue-400' : 'opacity-80'
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
            className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white font-serif-display text-base tracking-wide font-semibold shadow-md shadow-blue-600/30 transition-all disabled:opacity-50"
          >
            Create Goal
          </button>
        </div>
      </Sheet>
    </div>
  );
};

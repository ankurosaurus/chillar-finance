import React from 'react';
import { motion } from 'framer-motion';
import {
  ChevronRight,
  Flame,
  Utensils,
  ArrowUpRight,
  ArrowDownLeft,
} from 'lucide-react';
import { Card } from '../components/Card';
import { ProgressBar } from '../components/ProgressBar';
import { useFinanceStore } from '../store/useFinanceStore';
import {
  calculateWeeklyBudget,
  calculateMonthlyPace,
  calculateCategoryMonthlyStatus,
  calculateOutsideFoodStreak,
  calculateGoalMetrics,
} from '../lib/budgetMath';
import { formatINR, formatDate } from '../lib/formatters';
import { useTheme } from '../hooks/useTheme';

export const Home: React.FC = () => {
  const profile = useFinanceStore((state) => state.profile);
  const transactions = useFinanceStore((state) => state.transactions);
  const categories = useFinanceStore((state) => state.categories);
  const goals = useFinanceStore((state) => state.goals);
  const setActiveTab = useFinanceStore((state) => state.setActiveTab);
  const setQuickAddOpen = useFinanceStore((state) => state.setQuickAddOpen);
  const { isDark } = useTheme();

  const today = new Date();
  const weekly = calculateWeeklyBudget(profile, transactions, today);
  const monthlyPace = calculateMonthlyPace(profile, transactions, today);

  const outsideFoodCat = categories.find(
    (c) => c.id === 'cat-outside-food' || c.name.toLowerCase().includes('outside food')
  );
  const outsideFoodStatus = outsideFoodCat
    ? calculateCategoryMonthlyStatus(outsideFoodCat, transactions, today)
    : { spent: 0, limit: 2500, remaining: 2500, percentage: 0, isOverLimit: 0, isOverSoftCap: false };

  const outsideFoodStreak = outsideFoodCat
    ? calculateOutsideFoodStreak(transactions, outsideFoodCat.id, today)
    : 0;

  // Day of month pace marker position (0 to 100%)
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const paceMarkerPct = (today.getDate() / daysInMonth) * 100;

  // Recent 5 transactions
  const recentTransactions = transactions.slice(0, 5);

  return (
    <div className="flex flex-col gap-6 pb-24 md:pb-12">
      {/* Top Banner / Streak Chip */}
      <div className="flex items-center justify-between pt-1">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-blue-600/15 border border-blue-500/30 text-xs font-medium text-blue-400">
          <Flame strokeWidth={1.5} className="w-4 h-4 fill-blue-500/20 text-blue-400" />
          <span>No outside food: {outsideFoodStreak} day{outsideFoodStreak !== 1 ? 's' : ''}</span>
        </div>

        <button
          type="button"
          onClick={() => setActiveTab('planner')}
          className={`text-xs ${
            isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
          } flex items-center gap-0.5`}
        >
          <span>Day Planner</span>
          <ChevronRight strokeWidth={1.5} className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Top Dashboard Grid: Hero + Pace Bar + Outside Food */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* 1. Hero: "Safe to spend today" */}
        <Card variant="surface" className="text-center py-7 px-4 relative overflow-hidden flex flex-col justify-center">
          <span className="meta-label text-slate-400 tracking-widest mb-1.5 block">
            Safe to spend today
          </span>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="font-serif-display text-5xl md:text-6xl font-light tnum text-blue-400 my-1"
          >
            {formatINR(weekly.safeToSpendToday)}
          </motion.div>

          <p className={`text-xs mt-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            ₹{weekly.remainingThisWeek.toLocaleString('en-IN')} left this week · {weekly.daysRemainingInWeek} day{weekly.daysRemainingInWeek !== 1 ? 's' : ''} to go
          </p>

          {weekly.remainingThisWeek <= 0 && (
            <div className="mt-3 inline-block px-3 py-1 rounded-full bg-rose-500/15 text-rose-400 text-[11px]">
              Weekly budget exhausted. Rely on prepaid mess!
            </div>
          )}
        </Card>

        {/* 2. Month Spend Pace Bar */}
        <Card variant="surface" className="flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between text-xs">
            <span className="meta-label text-[#94A3B8]">Monthly Spend Pace</span>
            <span
              className={`font-medium ${
                monthlyPace.paceStatus === 'ahead'
                  ? 'text-[#10B981]'
                  : monthlyPace.paceStatus === 'behind'
                  ? 'text-[#F43F5E]'
                  : isDark
                  ? 'text-[#94A3B8]'
                  : 'text-[#64748B]'
              }`}
            >
              {monthlyPace.paceStatus === 'ahead'
                ? `₹${Math.abs(monthlyPace.paceDifference).toLocaleString('en-IN')} ahead`
                : monthlyPace.paceStatus === 'behind'
                ? `₹${Math.abs(monthlyPace.paceDifference).toLocaleString('en-IN')} behind`
                : 'On track'}
            </span>
          </div>

          <div className="py-2">
            <ProgressBar
              value={monthlyPace.totalSpentThisMonth}
              max={Math.max(1, monthlyPace.monthlySpendable)}
              height={6}
              color={monthlyPace.paceStatus === 'behind' ? 'terracotta' : 'gold'}
              showPaceMarker={true}
              paceMarkerPosition={paceMarkerPct}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-[#94A3B8] tnum">
            <span>Spent: {formatINR(monthlyPace.totalSpentThisMonth)}</span>
            <span className="text-[10px] opacity-75">| Today</span>
            <span>Budget: {formatINR(monthlyPace.monthlySpendable)}</span>
          </div>
        </Card>

        {/* 3. Outside Food Card */}
        <Card
          variant="surface"
          className={`flex flex-col justify-between transition-colors ${
            outsideFoodStatus.isOverSoftCap
              ? 'border-rose-500/40 bg-rose-500/5'
              : ''
          }`}
        >
          <div>
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-2xl ${outsideFoodStatus.isOverSoftCap ? 'bg-rose-500/20 text-rose-400' : 'bg-blue-600/15 text-blue-400'}`}>
                  <Utensils strokeWidth={1.5} className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-serif-display text-base font-light">Outside Food</h4>
                  <span className="text-[11px] text-slate-400">
                    Mess is paid. Optional spend.
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className={`font-serif-display text-lg tnum ${outsideFoodStatus.isOverSoftCap ? 'text-rose-400' : 'text-blue-400'}`}>
                  {formatINR(outsideFoodStatus.spent)}
                </span>
                <span className="text-[11px] text-slate-400 block">
                  / {formatINR(outsideFoodStatus.limit)}
                </span>
              </div>
            </div>

            <ProgressBar
              value={outsideFoodStatus.spent}
              max={Math.max(1, outsideFoodStatus.limit)}
              height={5}
              color={outsideFoodStatus.isOverSoftCap ? 'terracotta' : 'blue'}
              className="mt-1"
            />
          </div>

          <div className="flex items-center justify-between mt-3 text-[11px]">
            <span className={outsideFoodStatus.isOverSoftCap ? 'text-rose-400' : isDark ? 'text-slate-400' : 'text-slate-600'}>
              {outsideFoodStatus.percentage}% used
              {outsideFoodStatus.isOverSoftCap ? ' (soft cap alert)' : ''}
            </span>
            <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>
              {formatINR(outsideFoodStatus.remaining)} remaining
            </span>
          </div>
        </Card>
      </div>

      {/* Responsive 2-Column Desktop Grid: Goals Strip & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Goals Section */}
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <span className="meta-label text-slate-400">Savings Goals</span>
            <button
              type="button"
              onClick={() => setActiveTab('goals')}
              className={`text-xs ${
                isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              } flex items-center gap-0.5`}
            >
              <span>View All</span>
              <ChevronRight strokeWidth={1.5} className="w-3.5 h-3.5" />
            </button>
          </div>

          {goals.length === 0 ? (
            <div
              onClick={() => setActiveTab('goals')}
              className={`p-6 rounded-3xl border border-dashed cursor-pointer text-center text-xs transition-colors ${
                isDark ? 'border-white/10 hover:border-blue-500/40 text-slate-400' : 'border-slate-200 hover:border-blue-500/40 text-slate-600'
              }`}
            >
              <span>No savings goals yet.</span>
              <span className="text-blue-400 font-medium block mt-1">+ Create your first goal</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {goals.map((goal) => {
                const metrics = calculateGoalMetrics(goal, today);
                return (
                  <div
                    key={goal.id}
                    onClick={() => setActiveTab('goals')}
                    className={`p-4 rounded-3xl border cursor-pointer transition-all active:scale-[0.98] ${
                      isDark
                        ? 'bg-[#0B0F19] border-white/10 hover:border-blue-500/40'
                        : 'bg-white border-slate-200 hover:border-blue-500/40'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: goal.coverColor || '#3B82F6' }} />
                      <span className="text-[10px] text-slate-400">
                        {metrics.isComplete ? 'Completed' : `${metrics.weeksRemaining} wks left`}
                      </span>
                    </div>

                    <h5 className="font-serif-display text-sm font-light truncate mb-1">
                      {goal.name}
                    </h5>

                    <div className="flex items-baseline gap-1 mb-2">
                      <span className="font-serif-display text-lg tnum text-blue-400">
                        {formatINR(goal.saved)}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        / {formatINR(goal.target)}
                      </span>
                    </div>

                    <ProgressBar
                      value={goal.saved}
                      max={goal.target}
                      height={4}
                      color={metrics.isComplete ? 'sage' : 'blue'}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Activity Section */}
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <span className="meta-label text-slate-400">Recent Activity</span>
            {recentTransactions.length > 0 && (
              <button
                type="button"
                onClick={() => setActiveTab('ledger')}
                className={`text-xs ${
                  isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                } flex items-center gap-0.5`}
              >
                <span>See all</span>
                <ChevronRight strokeWidth={1.5} className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {recentTransactions.length === 0 ? (
            <div
              onClick={() => setQuickAddOpen(true)}
              className={`p-6 rounded-3xl border border-dashed cursor-pointer text-center text-xs transition-colors flex flex-col items-center gap-1.5 ${
                isDark ? 'border-white/10 hover:border-blue-500/40 text-slate-400' : 'border-slate-200 hover:border-blue-500/40 text-slate-600'
              }`}
            >
              <span>No transactions logged yet.</span>
              <span className="text-blue-400 font-medium">+ Log your first rupee</span>
            </div>
          ) : (
            <Card className="p-0 overflow-hidden divide-y divide-inherit">
              {recentTransactions.map((tx) => {
                const cat = categories.find((c) => c.id === tx.categoryId);
                const isExpense = tx.type === 'expense';
                return (
                  <div
                    key={tx.id}
                    onClick={() => setActiveTab('ledger')}
                    className={`p-3.5 sm:p-4 flex items-center justify-between cursor-pointer transition-colors ${
                      isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-black/[0.02]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 ${
                          isExpense
                            ? isDark
                              ? 'bg-[#181B26] text-[#94A3B8]'
                              : 'bg-[#F1F5F9] text-[#64748B]'
                            : 'bg-[#10B981]/15 text-[#10B981]'
                        }`}
                      >
                        {isExpense ? (
                          <ArrowUpRight strokeWidth={1.5} className="w-4 h-4" />
                        ) : (
                          <ArrowDownLeft strokeWidth={1.5} className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <h5 className="text-sm font-medium tracking-tight truncate max-w-[170px] sm:max-w-[240px]">
                          {tx.note || cat?.name || 'Transaction'}
                        </h5>
                        <div className="flex items-center gap-2 text-[11px] text-[#94A3B8]">
                          <span>{cat?.name}</span>
                          <span>·</span>
                          <span>{formatDate(tx.date, 'd MMM')}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div
                        className={`font-serif-display text-base tnum font-light ${
                          isExpense ? (isDark ? 'text-[#F8FAFC]' : 'text-[#0F172A]') : 'text-[#10B981]'
                        }`}
                      >
                        {isExpense ? `-${formatINR(tx.amount)}` : `+${formatINR(tx.amount)}`}
                      </div>
                      <span className="text-[10px] text-[#94A3B8] uppercase tracking-wider">
                        {tx.mode}
                      </span>
                    </div>
                  </div>
                );
              })}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

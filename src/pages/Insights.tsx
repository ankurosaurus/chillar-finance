import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  Sparkles,
  Flame,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { Card } from '../components/Card';
import { useFinanceStore } from '../store/useFinanceStore';
import {
  calculateCategoryBreakdown,
  calculateOutsideFoodDayOfWeek,
  calculateLeakReport,
  calculateMonthOverMonth,
  generateRuleBasedInsights,
} from '../lib/insights';
import { formatINR } from '../lib/formatters';
import { useTheme } from '../hooks/useTheme';
import { format, subDays } from 'date-fns';

export const Insights: React.FC = () => {
  const transactions = useFinanceStore((state) => state.transactions);
  const categories = useFinanceStore((state) => state.categories);
  const { isDark } = useTheme();

  const [trendView, setTrendView] = useState<'weekly' | 'monthly'>('weekly');
  const today = new Date();

  const outsideFoodCat = categories.find(
    (c) => c.id === 'cat-outside-food' || c.name.toLowerCase().includes('outside food')
  );
  const outsideFoodId = outsideFoodCat?.id || 'cat-outside-food';

  // Category breakdown
  const categoryBreakdown = useMemo(
    () => calculateCategoryBreakdown(transactions, categories, today),
    [transactions, categories]
  );

  // Day of week heatmap for outside food
  const heatmap = useMemo(
    () => calculateOutsideFoodDayOfWeek(transactions, outsideFoodId, today),
    [transactions, outsideFoodId]
  );

  // Leak report
  const leakReport = useMemo(
    () => calculateLeakReport(transactions, today),
    [transactions]
  );

  // Month-over-month comparison
  const mom = useMemo(
    () => calculateMonthOverMonth(transactions, outsideFoodId, today),
    [transactions, outsideFoodId]
  );

  // Rule-based insights cards
  const insightCards = useMemo(
    () => generateRuleBasedInsights(transactions, outsideFoodId, today),
    [transactions, outsideFoodId]
  );

  // Trend chart data (Last 7 days or Last 4 weeks)
  const trendData = useMemo(() => {
    if (trendView === 'weekly') {
      const data = [];
      for (let i = 6; i >= 0; i--) {
        const d = subDays(today, i);
        const dateStr = format(d, 'yyyy-MM-dd');
        const dayLabel = format(d, 'EEE');

        const spent = transactions
          .filter((t) => t.type === 'expense' && t.date.slice(0, 10) === dateStr)
          .reduce((sum, t) => sum + t.amount, 0);

        data.push({ label: dayLabel, spent, dateStr });
      }
      return data;
    } else {
      return [
        { label: 'Wk 1', spent: 0 },
        { label: 'Wk 2', spent: 0 },
        { label: 'Wk 3', spent: 0 },
        { label: 'Wk 4', spent: 0 },
      ];
    }
  }, [transactions, trendView]);

  return (
    <div className="flex flex-col gap-6 pb-24 md:pb-12">
      {/* Title */}
      <div className="pt-1">
        <h2 className="font-serif-display text-2xl sm:text-3xl font-light">Insights & Leaks</h2>
        <span className="text-xs text-[#94A3B8]">
          Hostel spend velocity, peak days, & leak reports
        </span>
      </div>

      {transactions.length === 0 ? (
        <Card className="text-center py-12 flex flex-col items-center gap-2 border-dashed">
          <Sparkles className="w-6 h-6 text-[#D4AF37] mb-1" />
          <h4 className="font-serif-display text-lg font-light">Awaiting First Transactions</h4>
          <p className={`text-xs max-w-sm ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>
            Charts, micro leak reports, and dining heatmaps will populate automatically as you record your daily expenses.
          </p>
        </Card>
      ) : (
        <>
          {/* Plain Language Insight Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {insightCards.map((ins) => (
              <Card
                key={ins.id}
                variant="surface"
                className="border-l-4 border-l-[#D4AF37] p-4 flex items-start justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <h4 className="text-xs font-medium tracking-wide">
                      {ins.title}
                    </h4>
                  </div>
                  <p
                    className={`text-xs leading-relaxed ${
                      isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'
                    }`}
                  >
                    {ins.description}
                  </p>
                </div>
                {ins.metric && (
                  <span className="meta-label shrink-0 px-2 py-1 rounded-full bg-[#D4AF37]/15 text-[#D4AF37]">
                    {ins.metric}
                  </span>
                )}
              </Card>
            ))}
          </div>

          {/* 2-Column Desktop Grid: Trend Chart & Donut */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Spending Trend Area Chart */}
            <Card variant="surface" className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="meta-label text-[#94A3B8] block">Spending Trend</span>
                  <span className="font-serif-display text-lg font-light">
                    Velocity Flow
                  </span>
                </div>

                <div
                  className={`p-1 rounded-full border flex items-center text-xs ${
                    isDark
                      ? 'bg-[#181B26] border-white/5'
                      : 'bg-[#F1F5F9] border-black/5'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setTrendView('weekly')}
                    className={`px-3 py-1 rounded-full font-medium transition-all ${
                      trendView === 'weekly'
                        ? 'bg-[#08090C] text-[#D4AF37]'
                        : 'text-[#94A3B8]'
                    }`}
                  >
                    7 Days
                  </button>
                  <button
                    type="button"
                    onClick={() => setTrendView('monthly')}
                    className={`px-3 py-1 rounded-full font-medium transition-all ${
                      trendView === 'monthly'
                        ? 'bg-[#08090C] text-[#D4AF37]'
                        : 'text-[#94A3B8]'
                    }`}
                  >
                    Month
                  </button>
                </div>
              </div>

              {/* Recharts Area Chart */}
              <div className="h-52 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#D4AF37" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="label"
                      stroke={isDark ? '#94A3B8' : '#64748B'}
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke={isDark ? '#94A3B8' : '#64748B'}
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(val) => `₹${val}`}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div
                              className={`p-2.5 rounded-xl text-xs border ${
                                isDark
                                  ? 'bg-[#10121A] border-white/10 text-white'
                                  : 'bg-white border-black/10 text-black'
                              }`}
                            >
                              <span className="text-[#94A3B8] block">{data.label}</span>
                              <span className="font-serif-display text-sm text-[#D4AF37]">
                                {formatINR(data.spent)}
                              </span>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="spent"
                      stroke="#D4AF37"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#goldGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Category Breakdown Donut */}
            <Card variant="surface" className="flex flex-col gap-4">
              <div>
                <span className="meta-label text-[#94A3B8] block">Portfolio Distribution</span>
                <span className="font-serif-display text-lg font-light">
                  Expense Breakdown
                </span>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="w-40 h-40 shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryBreakdown.length > 0 ? categoryBreakdown : [{ name: 'None', amount: 1, color: '#334155' }]}
                        dataKey="amount"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={68}
                        paddingAngle={3}
                      >
                        {categoryBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Clean Legend */}
                <div className="flex-1 flex flex-col gap-2 w-full">
                  {categoryBreakdown.slice(0, 5).map((item) => (
                    <div key={item.id} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="truncate max-w-[140px]">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-2 tnum">
                        <span className="text-[#94A3B8]">{item.percentage}%</span>
                        <span className="font-medium">{formatINR(item.amount)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>

          {/* 2-Column Desktop Grid: Leak Report & Heatmap */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Leak Report Card */}
            <Card variant="surface" className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="meta-label text-[#94A3B8] block">Micro Leak Report</span>
                  <span className="font-serif-display text-lg font-light">
                    Small Recurring Spends
                  </span>
                </div>
                <span className="meta-label text-[#F43F5E] bg-[#F43F5E]/10 px-2 py-0.5 rounded-full">
                  Tapri & Night Bites
                </span>
              </div>

              {leakReport.length === 0 ? (
                <p className="text-xs text-[#94A3B8] py-4">
                  No recurring micro leaks detected yet.
                </p>
              ) : (
                <div className="divide-y divide-inherit">
                  {leakReport.map((leak, idx) => (
                    <div key={idx} className="py-3 flex items-start justify-between gap-3">
                      <div>
                        <h4 className="text-xs font-medium tracking-tight">
                          {leak.name}
                        </h4>
                        <span className="text-[11px] text-[#94A3B8]">
                          {leak.count} times logged ({formatINR(leak.totalSpent)} total)
                        </span>
                        <div className="mt-1 inline-flex items-center gap-1 text-[11px] text-[#D4AF37] font-serif-display">
                          <span>Extrapolates to {formatINR(leak.extrapolatedMonthly)}/mo</span>
                          <span>{leak.equivalentComparison}</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="font-serif-display text-base tnum text-[#F43F5E]">
                          {formatINR(leak.totalSpent)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Day of Week Heatmap */}
            <Card variant="surface" className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="meta-label text-[#94A3B8] block">Dining Heatmap</span>
                  <span className="font-serif-display text-lg font-light">
                    Outside Food Weekly Rhythm
                  </span>
                </div>
                <Flame strokeWidth={1.5} className="w-4 h-4 text-[#D4AF37]" />
              </div>

              <div className="grid grid-cols-7 gap-1.5 pt-2 text-center">
                {heatmap.map((d) => {
                  const bg =
                    d.intensity === 0
                      ? isDark
                        ? 'bg-white/5'
                        : 'bg-black/5'
                      : d.intensity > 0.6
                      ? 'bg-[#D4AF37] text-[#08090C] font-semibold'
                      : d.intensity > 0.3
                      ? 'bg-[#D4AF37]/50 text-white'
                      : 'bg-[#D4AF37]/20 text-[#D4AF37]';

                  return (
                    <div key={d.shortDay} className="flex flex-col items-center gap-1.5">
                      <span className="text-[10px] text-[#94A3B8]">{d.shortDay}</span>
                      <div
                        className={`w-full h-12 rounded-xl flex flex-col items-center justify-center text-[11px] transition-colors ${bg}`}
                      >
                        <span className="font-serif-display tnum">
                          {d.amount > 0 ? `₹${d.amount}` : '-'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="text-[11px] text-[#94A3B8] text-center pt-1">
                Lustrous gold indicates peak outside food order volume
              </p>
            </Card>
          </div>

          {/* Month-vs-Month Comparison */}
          <Card variant="surface" className="flex flex-col gap-3">
            <div>
              <span className="meta-label text-[#94A3B8] block">Month-over-Month</span>
              <span className="font-serif-display text-lg font-light">
                {mom.prevMonthName} vs {mom.currentMonthName}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="p-3.5 rounded-2xl border border-inherit">
                <span className="meta-label text-[#94A3B8] block mb-1">
                  {mom.prevMonthName} Total
                </span>
                <span className="font-serif-display text-xl sm:text-2xl tnum">
                  {formatINR(mom.prevTotalSpent)}
                </span>
                <span className="text-[11px] text-[#94A3B8] block mt-0.5">
                  Outside: {formatINR(mom.outsideFoodPrev)}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl border border-inherit">
                <span className="meta-label text-[#94A3B8] block mb-1">
                  {mom.currentMonthName} Total
                </span>
                <span className="font-serif-display text-xl sm:text-2xl tnum text-[#D4AF37]">
                  {formatINR(mom.currentTotalSpent)}
                </span>
                <div className="flex items-center gap-1 text-[11px] mt-0.5">
                  {mom.diffAmount <= 0 ? (
                    <span className="text-[#10B981] flex items-center">
                      <ArrowDownRight className="w-3 h-3" />
                      {Math.abs(mom.diffPercentage)}% less spend
                    </span>
                  ) : (
                    <span className="text-[#F43F5E] flex items-center">
                      <ArrowUpRight className="w-3 h-3" />
                      +{mom.diffPercentage}% higher spend
                    </span>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </>
      )}
    </div>
  );
};

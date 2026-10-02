import {
  parseISO,
  format,
  subMonths,
  startOfMonth,
  endOfMonth,
  isWithinInterval,
} from 'date-fns';
import { Transaction, Category, LeakReportItem } from '../types/finance';

export interface DayOfWeekHeatmap {
  dayName: string;
  shortDay: string;
  dayIndex: number; // 0 = Sunday, 1 = Monday ... 6 = Saturday
  amount: number;
  transactionCount: number;
  intensity: number; // 0 to 1
}

export interface CategoryBreakdownItem {
  id: string;
  name: string;
  amount: number;
  percentage: number;
  color: string;
}

export interface MonthOverMonthComparison {
  currentMonthName: string;
  prevMonthName: string;
  currentTotalSpent: number;
  prevTotalSpent: number;
  diffAmount: number;
  diffPercentage: number;
  outsideFoodCurrent: number;
  outsideFoodPrev: number;
}

export interface RuleBasedInsight {
  id: string;
  type: 'highlight' | 'leak' | 'habit' | 'achievement';
  title: string;
  description: string;
  metric?: string;
}

/**
 * Calculates day of week heatmap for Outside Food spending.
 */
export function calculateOutsideFoodDayOfWeek(
  transactions: Transaction[],
  outsideFoodCategoryId: string,
  referenceDate: Date = new Date()
): DayOfWeekHeatmap[] {
  const mStart = startOfMonth(referenceDate);
  const mEnd = endOfMonth(referenceDate);

  const days = [
    { shortDay: 'Mon', dayName: 'Monday', dayIndex: 1, amount: 0, transactionCount: 0 },
    { shortDay: 'Tue', dayName: 'Tuesday', dayIndex: 2, amount: 0, transactionCount: 0 },
    { shortDay: 'Wed', dayName: 'Wednesday', dayIndex: 3, amount: 0, transactionCount: 0 },
    { shortDay: 'Thu', dayName: 'Thursday', dayIndex: 4, amount: 0, transactionCount: 0 },
    { shortDay: 'Fri', dayName: 'Friday', dayIndex: 5, amount: 0, transactionCount: 0 },
    { shortDay: 'Sat', dayName: 'Saturday', dayIndex: 6, amount: 0, transactionCount: 0 },
    { shortDay: 'Sun', dayName: 'Sunday', dayIndex: 0, amount: 0, transactionCount: 0 },
  ];

  transactions.forEach((t) => {
    if (t.type !== 'expense' || t.categoryId !== outsideFoodCategoryId) return;
    const tDate = parseISO(t.date);
    if (!isWithinInterval(tDate, { start: mStart, end: mEnd })) return;

    const dayOfWeek = tDate.getDay();
    const entry = days.find((d) => d.dayIndex === dayOfWeek);
    if (entry) {
      entry.amount += t.amount;
      entry.transactionCount += 1;
    }
  });

  const maxAmount = Math.max(1, ...days.map((d) => d.amount));
  return days.map((d) => ({
    ...d,
    intensity: Math.min(1, Math.round((d.amount / maxAmount) * 100) / 100),
  }));
}

/**
 * Computes category breakdown for current month expenses.
 */
export function calculateCategoryBreakdown(
  transactions: Transaction[],
  categories: Category[],
  referenceDate: Date = new Date()
): CategoryBreakdownItem[] {
  const mStart = startOfMonth(referenceDate);
  const mEnd = endOfMonth(referenceDate);

  const categoryMap = new Map<string, number>();

  transactions.forEach((t) => {
    if (t.type !== 'expense') return;
    const tDate = parseISO(t.date);
    if (!isWithinInterval(tDate, { start: mStart, end: mEnd })) return;

    const current = categoryMap.get(t.categoryId) || 0;
    categoryMap.set(t.categoryId, current + t.amount);
  });

  const total = Array.from(categoryMap.values()).reduce((sum, v) => sum + v, 0);

  const results: CategoryBreakdownItem[] = [];
  categories.forEach((cat) => {
    const amount = categoryMap.get(cat.id) || 0;
    if (amount > 0) {
      results.push({
        id: cat.id,
        name: cat.name,
        amount,
        percentage: total > 0 ? Math.round((amount / total) * 100) : 0,
        color: cat.color,
      });
    }
  });

  return results.sort((a, b) => b.amount - a.amount);
}

/**
 * Computes Leak Report: top recurring small spends under ₹150 (Chai, Maggi, auto, late night).
 */
export function calculateLeakReport(
  transactions: Transaction[],
  referenceDate: Date = new Date()
): LeakReportItem[] {
  const mStart = startOfMonth(referenceDate);
  const mEnd = endOfMonth(referenceDate);

  // Filter small repetitive spends <= ₹150
  const smallSpends = transactions.filter((t) => {
    if (t.type !== 'expense' || t.amount > 150) return false;
    const tDate = parseISO(t.date);
    return isWithinInterval(tDate, { start: mStart, end: mEnd });
  });

  // Group by note keyword or similar items
  const spendGroups: Record<string, { count: number; total: number }> = {};

  smallSpends.forEach((t) => {
    const rawNote = (t.note || '').toLowerCase().trim();
    let label = 'Tapri Chai & Coffee';
    if (rawNote.includes('chai') || rawNote.includes('tea') || rawNote.includes('coffee')) {
      label = 'Tapri Chai & Coffee';
    } else if (rawNote.includes('maggi') || rawNote.includes('roll') || rawNote.includes('puff') || rawNote.includes('samosa') || rawNote.includes('biscuit') || rawNote.includes('snack')) {
      label = 'Late Night Snacks & Maggi';
    } else if (rawNote.includes('auto') || rawNote.includes('metro') || rawNote.includes('bus') || rawNote.includes('cab')) {
      label = 'Campus Auto & Quick Rides';
    } else if (rawNote.includes('print') || rawNote.includes('xerox') || rawNote.includes('stationery')) {
      label = 'Xerox & Campus Prints';
    } else if (rawNote.length > 0) {
      label = t.note || 'Small Spends';
    }

    if (!spendGroups[label]) {
      spendGroups[label] = { count: 0, total: 0 };
    }
    spendGroups[label].count += 1;
    spendGroups[label].total += t.amount;
  });

  const dayOfMonth = Math.max(1, referenceDate.getDate());

  const items: LeakReportItem[] = Object.entries(spendGroups)
    .filter(([_, data]) => data.count >= 2)
    .map(([name, data]) => {
      // Extrapolate to 30 days
      const extrapolated = Math.round((data.total / dayOfMonth) * 30);
      let equivalent = '= 1 Cinepolis Movie Ticket';

      if (extrapolated >= 1200) {
        equivalent = '= 1 Weekend Trip Bus Ticket';
      } else if (extrapolated >= 750) {
        equivalent = '= 2 Premium Movie Tickets';
      } else if (extrapolated >= 400) {
        equivalent = '= 1 Month Spotify & Netflix';
      } else if (extrapolated >= 200) {
        equivalent = '= 1 High-speed Mobile Data Addon';
      }

      return {
        name,
        count: data.count,
        totalSpent: data.total,
        extrapolatedMonthly: extrapolated,
        equivalentComparison: equivalent,
      };
    })
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .slice(0, 3);

  return items;
}

/**
 * Month-over-month comparison.
 */
export function calculateMonthOverMonth(
  transactions: Transaction[],
  outsideFoodCategoryId: string,
  referenceDate: Date = new Date()
): MonthOverMonthComparison {
  const currentMonthStart = startOfMonth(referenceDate);
  const currentMonthEnd = endOfMonth(referenceDate);

  const prevMonthDate = subMonths(referenceDate, 1);
  const prevMonthStart = startOfMonth(prevMonthDate);
  const prevMonthEnd = endOfMonth(prevMonthDate);

  let currentTotalSpent = 0;
  let prevTotalSpent = 0;
  let outsideFoodCurrent = 0;
  let outsideFoodPrev = 0;

  transactions.forEach((t) => {
    if (t.type !== 'expense') return;
    const tDate = parseISO(t.date);

    if (isWithinInterval(tDate, { start: currentMonthStart, end: currentMonthEnd })) {
      currentTotalSpent += t.amount;
      if (t.categoryId === outsideFoodCategoryId) {
        outsideFoodCurrent += t.amount;
      }
    } else if (isWithinInterval(tDate, { start: prevMonthStart, end: prevMonthEnd })) {
      prevTotalSpent += t.amount;
      if (t.categoryId === outsideFoodCategoryId) {
        outsideFoodPrev += t.amount;
      }
    }
  });

  const diffAmount = currentTotalSpent - prevTotalSpent;
  const diffPercentage =
    prevTotalSpent > 0 ? Math.round((diffAmount / prevTotalSpent) * 100) : 0;

  return {
    currentMonthName: format(referenceDate, 'MMMM'),
    prevMonthName: format(prevMonthDate, 'MMMM'),
    currentTotalSpent,
    prevTotalSpent,
    diffAmount,
    diffPercentage,
    outsideFoodCurrent,
    outsideFoodPrev,
  };
}

/**
 * Generates rule-based plain-language insight cards.
 */
export function generateRuleBasedInsights(
  transactions: Transaction[],
  outsideFoodCategoryId: string,
  referenceDate: Date = new Date()
): RuleBasedInsight[] {
  const insights: RuleBasedInsight[] = [];
  const heatmap = calculateOutsideFoodDayOfWeek(transactions, outsideFoodCategoryId, referenceDate);
  const totalOutsideFood = heatmap.reduce((sum, d) => sum + d.amount, 0);

  // Check weekend proportion (Fri, Sat, Sun)
  const weekendSpend = heatmap
    .filter((d) => d.dayName === 'Friday' || d.dayName === 'Saturday' || d.dayName === 'Sunday')
    .reduce((sum, d) => sum + d.amount, 0);

  if (totalOutsideFood > 0) {
    const weekendPct = Math.round((weekendSpend / totalOutsideFood) * 100);
    if (weekendPct >= 50) {
      insights.push({
        id: 'ins-weekend',
        type: 'habit',
        title: 'Weekend Dining Spike',
        description: `You spend ${weekendPct}% of your outside-food money on Fri–Sun. Hostel mess dinner on weekends could save ~₹${Math.round(weekendSpend * 0.4)}.`,
        metric: `${weekendPct}% on Fri–Sun`,
      });
    }
  }

  // Peak day
  const peakDay = [...heatmap].sort((a, b) => b.amount - a.amount)[0];
  if (peakDay && peakDay.amount > 0) {
    insights.push({
      id: 'ins-peak-day',
      type: 'habit',
      title: `${peakDay.dayName} Food Spree`,
      description: `${peakDay.dayName}s are your highest outside food spending day with ₹${peakDay.amount} spent across ${peakDay.transactionCount} order${peakDay.transactionCount > 1 ? 's' : ''}.`,
      metric: `Peak: ${peakDay.shortDay}`,
    });
  }

  // UPI usage insight
  const upiCount = transactions.filter((t) => t.mode === 'UPI').length;
  const totalCount = transactions.length;
  if (totalCount > 0) {
    const upiPct = Math.round((upiCount / totalCount) * 100);
    insights.push({
      id: 'ins-upi',
      type: 'highlight',
      title: 'Digital First Spender',
      description: `${upiPct}% of your transactions happen via UPI tap-to-pay. Quick micro-payments are effortless to log.`,
      metric: `${upiPct}% UPI`,
    });
  }

  // Prepaid mess cushion reminder
  insights.push({
    id: 'ins-mess',
    type: 'achievement',
    title: 'Prepaid Mess Cushion',
    description: 'Your hostel mess covers all 3 meals. Every meal eaten at the mess keeps your travel & fun fund intact.',
    metric: 'Zero Food Risk',
  });

  return insights;
}

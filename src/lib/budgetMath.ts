import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  getDaysInMonth,
  differenceInDays,
  parseISO,
  isWithinInterval,
  format,
  subDays,
} from 'date-fns';
import {
  Profile,
  Transaction,
  Goal,
  Category,
  WeeklyBudgetSummary,
  MonthlyBudgetSummary,
} from '../types/finance';

/**
 * Calculates net monthly spendable allowance:
 * Spendable = Total Income - Non-Prepaid Fixed Costs - Savings Target
 */
export function calculateMonthlySpendable(profile: Profile): {
  totalIncome: number;
  totalFixedCosts: number;
  savingsTargetAmount: number;
  monthlySpendable: number;
} {
  const totalIncome = (profile.monthlyIncome || 0) + (profile.extraIncome || 0);

  // Exclude prepaid mess from deductible fixed costs
  const totalFixedCosts = (profile.fixedCosts || [])
    .filter((fc) => !fc.isPrepaidMess)
    .reduce((sum, fc) => sum + fc.amount, 0);

  const savingsRate = Math.min(100, Math.max(0, profile.savingsRatePct || 20));
  const savingsTargetAmount = Math.round((totalIncome * savingsRate) / 100);

  const monthlySpendable = Math.max(0, totalIncome - totalFixedCosts - savingsTargetAmount);

  return {
    totalIncome,
    totalFixedCosts,
    savingsTargetAmount,
    monthlySpendable,
  };
}

/**
 * Computes weekly budget numbers for a given date (Monday-Sunday cycle).
 */
export function calculateWeeklyBudget(
  profile: Profile,
  transactions: Transaction[],
  referenceDate: Date = new Date()
): WeeklyBudgetSummary {
  const { monthlySpendable } = calculateMonthlySpendable(profile);
  const daysInCurrentMonth = getDaysInMonth(referenceDate);

  // Average weekly allocation based on monthly spendable
  const spendablePerDay = monthlySpendable / daysInCurrentMonth;
  const weeklyAllocation = Math.round(spendablePerDay * 7);

  // Week starting on Monday (weekStartsOn: 1)
  const weekStart = startOfWeek(referenceDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(referenceDate, { weekStartsOn: 1 });

  // Sum of expense transactions in the current week
  const spentThisWeek = transactions
    .filter((t) => {
      if (t.type !== 'expense') return false;
      const tDate = parseISO(t.date);
      return isWithinInterval(tDate, { start: weekStart, end: weekEnd });
    })
    .reduce((sum, t) => sum + t.amount, 0);

  const remainingThisWeek = weeklyAllocation - spentThisWeek;

  // Days remaining in the week including today
  // Monday = 7, Tuesday = 6, ..., Sunday = 1
  const dayOfWeekIndex = referenceDate.getDay(); // 0 is Sunday, 1 is Monday
  const daysRemainingInWeek = dayOfWeekIndex === 0 ? 1 : 8 - dayOfWeekIndex;

  const safeToSpendToday =
    remainingThisWeek > 0
      ? Math.max(0, Math.floor(remainingThisWeek / daysRemainingInWeek))
      : 0;

  return {
    weekStart: format(weekStart, 'yyyy-MM-dd'),
    weekEnd: format(weekEnd, 'yyyy-MM-dd'),
    weeklyAllocation,
    spentThisWeek,
    remainingThisWeek,
    daysRemainingInWeek,
    safeToSpendToday,
  };
}

/**
 * Calculates current month spending pace (ahead vs behind).
 */
export function calculateMonthlyPace(
  profile: Profile,
  transactions: Transaction[],
  referenceDate: Date = new Date()
): MonthlyBudgetSummary {
  const { totalIncome, totalFixedCosts, savingsTargetAmount, monthlySpendable } =
    calculateMonthlySpendable(profile);

  const mStart = startOfMonth(referenceDate);
  const mEnd = endOfMonth(referenceDate);
  const daysInMonth = getDaysInMonth(referenceDate);
  const currentDayOfMonth = referenceDate.getDate();

  // Total expenses in the current month
  const totalSpentThisMonth = transactions
    .filter((t) => {
      if (t.type !== 'expense') return false;
      const tDate = parseISO(t.date);
      return isWithinInterval(tDate, { start: mStart, end: mEnd });
    })
    .reduce((sum, t) => sum + t.amount, 0);

  const remainingSpendable = monthlySpendable - totalSpentThisMonth;

  // Expected spend pace by today's date
  const expectedSpendByToday = Math.round(
    monthlySpendable * (currentDayOfMonth / daysInMonth)
  );

  const paceDifference = totalSpentThisMonth - expectedSpendByToday;
  let paceStatus: 'ahead' | 'on_track' | 'behind' = 'on_track';

  if (paceDifference < -100) {
    paceStatus = 'ahead'; // Spent less than expected
  } else if (paceDifference > 100) {
    paceStatus = 'behind'; // Spent more than expected
  }

  return {
    totalIncome,
    totalFixedCosts,
    savingsTargetAmount,
    monthlySpendable,
    totalSpentThisMonth,
    remainingSpendable,
    expectedSpendByToday,
    paceDifference,
    paceStatus,
  };
}

/**
 * Calculates Outside Food category status (spent vs limit, warning at 80%).
 */
export function calculateCategoryMonthlyStatus(
  category: Category,
  transactions: Transaction[],
  referenceDate: Date = new Date()
): {
  spent: number;
  limit: number;
  remaining: number;
  percentage: number;
  isOverLimit: number;
  isOverSoftCap: boolean;
} {
  const mStart = startOfMonth(referenceDate);
  const mEnd = endOfMonth(referenceDate);

  const spent = transactions
    .filter((t) => {
      if (t.type !== 'expense' || t.categoryId !== category.id) return false;
      const tDate = parseISO(t.date);
      return isWithinInterval(tDate, { start: mStart, end: mEnd });
    })
    .reduce((sum, t) => sum + t.amount, 0);

  const limit = category.monthlyLimit || 0;
  const remaining = Math.max(0, limit - spent);
  const percentage = limit > 0 ? Math.min(100, Math.round((spent / limit) * 100)) : 0;
  const isOverLimit = limit > 0 && spent >= limit ? 1 : 0;
  const isOverSoftCap = category.softCap && limit > 0 && spent >= limit * 0.8;

  return {
    spent,
    limit,
    remaining,
    percentage,
    isOverLimit,
    isOverSoftCap,
  };
}

/**
 * Calculates consecutive days streak with zero outside food spending.
 */
export function calculateOutsideFoodStreak(
  transactions: Transaction[],
  outsideFoodCategoryId: string,
  referenceDate: Date = new Date()
): number {
  if (!outsideFoodCategoryId) return 0;

  let streak = 0;
  const maxDaysToCheck = 60;

  for (let i = 0; i < maxDaysToCheck; i++) {
    const checkDate = subDays(referenceDate, i);
    const dateStr = format(checkDate, 'yyyy-MM-dd');

    // Check if there was any outside food expense on this date
    const hasOutsideFood = transactions.some((t) => {
      if (t.type !== 'expense' || t.categoryId !== outsideFoodCategoryId) return false;
      const tDateStr = t.date.slice(0, 10);
      return tDateStr === dateStr;
    });

    if (hasOutsideFood) {
      // Streak ends
      break;
    } else {
      streak += 1;
    }
  }

  return streak;
}

/**
 * Calculates savings goal metrics (required per week/month, pace, projected date).
 */
export function calculateGoalMetrics(
  goal: Goal,
  referenceDate: Date = new Date()
): {
  remainingAmount: number;
  percentageSaved: number;
  daysRemaining: number;
  weeksRemaining: number;
  monthsRemaining: number;
  requiredPerWeek: number;
  requiredPerMonth: number;
  isTargetPassed: boolean;
  isComplete: boolean;
} {
  const remainingAmount = Math.max(0, goal.target - goal.saved);
  const percentageSaved = goal.target > 0 ? Math.min(100, Math.round((goal.saved / goal.target) * 100)) : 0;
  const targetDateObj = parseISO(goal.targetDate);
  const daysRemaining = differenceInDays(targetDateObj, referenceDate);
  const isTargetPassed = daysRemaining < 0;
  const isComplete = goal.saved >= goal.target;

  const safeDays = Math.max(1, daysRemaining);
  const weeksRemaining = Math.max(1, Math.ceil(safeDays / 7));
  const monthsRemaining = Math.max(1, Math.ceil(safeDays / 30));

  const requiredPerWeek = Math.round(remainingAmount / weeksRemaining);
  const requiredPerMonth = Math.round(remainingAmount / monthsRemaining);

  return {
    remainingAmount,
    percentageSaved,
    daysRemaining,
    weeksRemaining,
    monthsRemaining,
    requiredPerWeek,
    requiredPerMonth,
    isTargetPassed,
    isComplete,
  };
}

/**
 * Calculates Round-Up amount to next ₹10.
 * Example: ₹42 -> rounds up to ₹50, roundUp is ₹8.
 * If already multiple of 10, returns 0.
 */
export function calculateRoundUp(amount: number): number {
  if (amount <= 0) return 0;
  const remainder = amount % 10;
  if (remainder === 0) return 0;
  return 10 - remainder;
}

/**
 * "Can I afford this?" impact simulator.
 */
export interface AffordabilityAnalysis {
  amount: number;
  currentSafeToday: number;
  newSafeToday: number;
  currentWeeklyRemaining: number;
  newWeeklyRemaining: number;
  weeklyBudgetStatus: 'comfortable' | 'tight' | 'exceeded';
  goalImpact?: {
    goalName: string;
    equivalentDaysOfWeeklyBudget: number;
    delayDaysEstimate: number;
  };
  verdict: string;
  recommendationNote: string;
}

export function analyzeAffordability(
  amount: number,
  profile: Profile,
  transactions: Transaction[],
  nearestGoal?: Goal,
  referenceDate: Date = new Date()
): AffordabilityAnalysis {
  const currentWeekly = calculateWeeklyBudget(profile, transactions, referenceDate);
  const newWeeklyRemaining = currentWeekly.remainingThisWeek - amount;
  
  const newSafeToday =
    newWeeklyRemaining > 0
      ? Math.max(0, Math.floor(newWeeklyRemaining / currentWeekly.daysRemainingInWeek))
      : 0;

  let weeklyBudgetStatus: 'comfortable' | 'tight' | 'exceeded' = 'comfortable';
  if (newWeeklyRemaining < 0) {
    weeklyBudgetStatus = 'exceeded';
  } else if (newSafeToday < 100) {
    weeklyBudgetStatus = 'tight';
  }

  // Goal delay estimate
  let goalImpact: AffordabilityAnalysis['goalImpact'];
  if (nearestGoal) {
    const goalMetrics = calculateGoalMetrics(nearestGoal, referenceDate);
    // Estimated days to save this amount at current weekly pace
    const weeklyRate = Math.max(50, goalMetrics.requiredPerWeek);
    const delayDaysEstimate = Math.round((amount / weeklyRate) * 7);

    goalImpact = {
      goalName: nearestGoal.name,
      equivalentDaysOfWeeklyBudget: Math.round(
        amount / Math.max(1, currentWeekly.weeklyAllocation / 7)
      ),
      delayDaysEstimate,
    };
  }

  let verdict = 'Safe to spend';
  let recommendationNote = 'Fits well within your current weekly spending room.';

  if (weeklyBudgetStatus === 'exceeded') {
    verdict = 'Exceeds weekly budget';
    recommendationNote = `This will put you ₹${Math.abs(newWeeklyRemaining)} in the red for this week.`;
  } else if (weeklyBudgetStatus === 'tight') {
    verdict = 'Tightens this week';
    recommendationNote = `Leaves only ₹${newSafeToday}/day for the remaining ${currentWeekly.daysRemainingInWeek} days.`;
  }

  return {
    amount,
    currentSafeToday: currentWeekly.safeToSpendToday,
    newSafeToday,
    currentWeeklyRemaining: currentWeekly.remainingThisWeek,
    newWeeklyRemaining,
    weeklyBudgetStatus,
    goalImpact,
    verdict,
    recommendationNote,
  };
}

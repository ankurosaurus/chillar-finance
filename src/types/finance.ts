export type TransactionType = 'expense' | 'income';

export type PaymentMode = 'UPI' | 'Cash' | 'Card';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  categoryId: string;
  note?: string;
  date: string; // ISO date string YYYY-MM-DD or full ISO
  mode: PaymentMode;
  isRoundUp?: boolean;
  roundUpAmount?: number;
}

export interface Category {
  id: string;
  name: string;
  monthlyLimit?: number;
  softCap: boolean; // warn at 80%
  color: string;
  isSystem?: boolean;
  iconName?: string;
}

export interface GoalContribution {
  id: string;
  date: string;
  amount: number;
  note?: string;
}

export interface Goal {
  id: string;
  name: string;
  target: number;
  saved: number;
  targetDate: string; // YYYY-MM-DD
  contributions: GoalContribution[];
  roundUpEnabled: boolean;
  coverColor?: string; // from palette
  isCompleted?: boolean;
}

export interface FixedCost {
  id: string;
  name: string;
  amount: number;
  isPrepaidMess?: boolean;
}

export interface SavingsChallenge {
  id: string;
  title: string;
  description: string;
  savingsEstimate: number;
  goalId?: string;
  accepted: boolean;
  acceptedDate?: string;
  completed: boolean;
}

export interface PlannedItem {
  id: string;
  title: string;
  plannedAmount: number;
  categoryId: string;
  actualAmount?: number;
  status: 'planned' | 'spent' | 'skipped';
  transactionId?: string;
  isPrepaidMess?: boolean;
  timeSlot?: 'Morning' | 'Afternoon' | 'Evening' | 'Night' | 'Anytime';
  note?: string;
}

export interface DayPlan {
  date: string; // YYYY-MM-DD
  targetBudget?: number;
  notes?: string;
  items: PlannedItem[];
}

export type ThemeMode = 'dark' | 'light';
export type AccentColor = 'gold' | 'emerald' | 'sapphire' | 'copper';

export interface Profile {
  monthlyIncome: number;
  extraIncome?: number;
  payDay: number; // 1-31
  fixedCosts: FixedCost[];
  savingsRatePct: number; // default 20
  theme: ThemeMode;
  accentColor?: AccentColor;
  pinHash?: string;
  pinEnabled?: boolean;
  currencyFormat?: 'INR_LAKH' | 'STANDARD';
  rolloverToFunOrGoals?: boolean;
  rolloverTarget?: 'fun' | 'goals';
  onboardingCompleted: boolean;
}

export interface InAppAlert {
  id: string;
  type: 'category_80' | 'category_100' | 'week_exhausted' | 'goal_behind' | 'goal_milestone';
  title: string;
  message: string;
  timestamp: number;
  category?: string;
  read: boolean;
}

export interface WeeklyBudgetSummary {
  weekStart: string;
  weekEnd: string;
  weeklyAllocation: number;
  spentThisWeek: number;
  remainingThisWeek: number;
  daysRemainingInWeek: number;
  safeToSpendToday: number;
}

export interface MonthlyBudgetSummary {
  totalIncome: number;
  totalFixedCosts: number;
  savingsTargetAmount: number;
  monthlySpendable: number;
  totalSpentThisMonth: number;
  remainingSpendable: number;
  expectedSpendByToday: number;
  paceDifference: number; // negative = ahead (spent less), positive = behind (spent more)
  paceStatus: 'ahead' | 'on_track' | 'behind';
}

export interface LeakReportItem {
  name: string;
  count: number;
  totalSpent: number;
  extrapolatedMonthly: number;
  equivalentComparison: string;
}

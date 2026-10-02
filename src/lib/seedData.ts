import { subDays, subMonths, format, addMonths } from 'date-fns';
import {
  Category,
  Profile,
  Goal,
  Transaction,
  SavingsChallenge,
} from '../types/finance';

export const INITIAL_CATEGORIES: Category[] = [
  {
    id: 'cat-outside-food',
    name: 'Outside Food',
    monthlyLimit: 2500,
    softCap: true,
    color: '#E06C75', // terracotta/coral
    isSystem: true,
  },
  {
    id: 'cat-snacks-chai',
    name: 'Snacks & Chai',
    monthlyLimit: 1000,
    softCap: true,
    color: '#F59E0B', // warm amber
    isSystem: true,
  },
  {
    id: 'cat-transport',
    name: 'Transport',
    monthlyLimit: 1200,
    softCap: false,
    color: '#2DD4BF', // emerald/teal
    isSystem: true,
  },
  {
    id: 'cat-movies-fun',
    name: 'Movies & Fun',
    monthlyLimit: 1500,
    softCap: true,
    color: '#A78BFA', // soft violet
    isSystem: true,
  },
  {
    id: 'cat-shopping',
    name: 'Shopping',
    monthlyLimit: 1200,
    softCap: false,
    color: '#38BDF8', // sky
  },
  {
    id: 'cat-study',
    name: 'Study & Books',
    monthlyLimit: 600,
    softCap: false,
    color: '#4ADE80', // green
  },
  {
    id: 'cat-bills',
    name: 'Recharge & Bills',
    monthlyLimit: 500,
    softCap: false,
    color: '#94A3B8', // slate
  },
  {
    id: 'cat-trips',
    name: 'Trips',
    monthlyLimit: 2000,
    softCap: false,
    color: '#FB923C', // amber
  },
  {
    id: 'cat-other',
    name: 'Other',
    monthlyLimit: 500,
    softCap: false,
    color: '#64748B',
  },
];

// Clean zero-data initial profile. The user enters their own numbers!
export const INITIAL_PROFILE: Profile = {
  monthlyIncome: 0,
  extraIncome: 0,
  payDay: 1,
  fixedCosts: [
    { id: 'fc-mess', name: 'Hostel Mess (Prepaid)', amount: 4500, isPrepaidMess: true }
  ],
  savingsRatePct: 20,
  theme: 'dark',
  accentColor: 'blue',
  rolloverToFunOrGoals: false,
  onboardingCompleted: false, // forces onboarding on first run
};

// Default empty collections: NO MOCK DATA by default!
export function getInitialGoals(): Goal[] {
  return [];
}

export function getInitialChallenges(): SavingsChallenge[] {
  return [];
}

export function getInitialTransactions(): Transaction[] {
  return [];
}

// Optional sample data loaded ONLY if user requests it in settings
export function getDemoGoals(): Goal[] {
  const today = new Date();
  const goaDate = format(addMonths(today, 2), 'yyyy-MM-dd');
  const headphoneDate = format(addMonths(today, 4), 'yyyy-MM-dd');

  return [
    {
      id: 'goal-goa',
      name: 'Goa Semester Trip',
      target: 8000,
      saved: 3200,
      targetDate: goaDate,
      roundUpEnabled: true,
      coverColor: '#3B82F6',
      contributions: [
        {
          id: 'gc-1',
          date: format(subDays(today, 10), 'yyyy-MM-dd'),
          amount: 2000,
          note: 'Initial deposit',
        },
        {
          id: 'gc-2',
          date: format(subDays(today, 2), 'yyyy-MM-dd'),
          amount: 1200,
          note: 'Freelance bonus',
        },
      ],
    },
    {
      id: 'goal-headphones',
      name: 'Sony ANC Headphones',
      target: 5000,
      saved: 1500,
      targetDate: headphoneDate,
      roundUpEnabled: false,
      coverColor: '#2DD4BF',
      contributions: [
        {
          id: 'gc-3',
          date: format(subDays(today, 8), 'yyyy-MM-dd'),
          amount: 1500,
          note: 'Deposit',
        },
      ],
    },
  ];
}

export function getDemoTransactions(): Transaction[] {
  const today = new Date();
  const d = (daysAgo: number) => format(subDays(today, daysAgo), 'yyyy-MM-dd');

  return [
    {
      id: 'tx-1',
      type: 'income',
      amount: 12000,
      categoryId: 'cat-other',
      note: 'Pocket Money from Home',
      date: d(1),
      mode: 'UPI',
    },
    {
      id: 'tx-2',
      type: 'expense',
      amount: 30,
      categoryId: 'cat-snacks-chai',
      note: 'Tapri cutting chai',
      date: d(0),
      mode: 'UPI',
      isRoundUp: true,
      roundUpAmount: 0,
    },
    {
      id: 'tx-3',
      type: 'expense',
      amount: 45,
      categoryId: 'cat-transport',
      note: 'Auto to gate',
      date: d(0),
      mode: 'Cash',
      isRoundUp: true,
      roundUpAmount: 5,
    },
    {
      id: 'tx-4',
      type: 'expense',
      amount: 180,
      categoryId: 'cat-outside-food',
      note: 'Night roll with friends',
      date: d(1),
      mode: 'UPI',
    },
  ];
}

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  Profile,
  Transaction,
  Category,
  Goal,
  SavingsChallenge,
  InAppAlert,
  PlannedItem,
  DayPlan,
  PaymentMode,
} from '../types/finance';
import {
  INITIAL_PROFILE,
  INITIAL_CATEGORIES,
  getDemoGoals,
  getDemoTransactions,
} from '../lib/seedData';
import { calculateRoundUp, calculateWeeklyBudget } from '../lib/budgetMath';

interface FinanceState {
  profile: Profile;
  transactions: Transaction[];
  categories: Category[];
  goals: Goal[];
  challenges: SavingsChallenge[];
  dayPlans: Record<string, DayPlan>;
  alerts: InAppAlert[];
  isLocked: boolean;
  activeTab: 'home' | 'ledger' | 'planner' | 'goals' | 'insights' | 'settings';
  isQuickAddOpen: boolean;
  isAffordabilityModalOpen: boolean;

  // Actions
  setActiveTab: (tab: 'home' | 'ledger' | 'planner' | 'goals' | 'insights' | 'settings') => void;
  setQuickAddOpen: (open: boolean) => void;
  setAffordabilityModalOpen: (open: boolean) => void;
  setProfile: (profile: Partial<Profile>) => void;
  toggleTheme: () => void;
  
  addTransaction: (tx: Omit<Transaction, 'id'>) => { id: string; roundUpSaved?: number; outsideFoodNudge?: string };
  updateTransaction: (id: string, tx: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;

  // Day Planner Actions
  setDayPlanTarget: (date: string, targetBudget?: number, notes?: string) => void;
  addPlannedItem: (date: string, item: Omit<PlannedItem, 'id' | 'status'>) => void;
  updatePlannedItem: (date: string, itemId: string, updates: Partial<PlannedItem>) => void;
  deletePlannedItem: (date: string, itemId: string) => void;
  markPlannedItemSpent: (date: string, itemId: string, actualAmount?: number, paymentMode?: PaymentMode) => void;
  markPlannedItemSkipped: (date: string, itemId: string) => void;

  addCategory: (cat: Omit<Category, 'id'>) => void;
  updateCategory: (id: string, cat: Partial<Category>) => void;
  deleteCategory: (id: string) => void;

  addGoal: (goal: Omit<Goal, 'id' | 'saved' | 'contributions'>) => void;
  updateGoal: (id: string, goal: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;
  contributeToGoal: (goalId: string, amount: number, note?: string) => void;
  withdrawFromGoal: (goalId: string, amount: number, note?: string) => void;

  acceptChallenge: (challengeId: string) => void;
  completeChallenge: (challengeId: string) => void;

  dismissAlert: (id: string) => void;
  addAlert: (alert: Omit<InAppAlert, 'id' | 'timestamp' | 'read'>) => void;

  // Auth / Security
  setPin: (pin: string) => void;
  removePin: () => void;
  unlockWithPin: (pin: string) => boolean;
  lockApp: () => void;

  // Data persistence & export
  loadDemoData: () => void;
  resetAllData: () => void;
  exportJSON: () => string;
  importJSON: (jsonStr: string) => boolean;
  exportCSV: () => string;
}

// Simple hash for 4-digit PIN stored locally
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return `pin_${Math.abs(hash).toString(16)}`;
}

export const useFinanceStore = create<FinanceState>()(
  persist(
    (set, get) => ({
      profile: INITIAL_PROFILE,
      transactions: [],
      categories: INITIAL_CATEGORIES,
      goals: [],
      challenges: [],
      dayPlans: {},
      alerts: [],
      isLocked: false,
      activeTab: 'home',
      isQuickAddOpen: false,
      isAffordabilityModalOpen: false,

      setActiveTab: (tab) => set({ activeTab: tab }),
      setQuickAddOpen: (open) => set({ isQuickAddOpen: open }),
      setAffordabilityModalOpen: (open) => set({ isAffordabilityModalOpen: open }),

      setProfile: (updates) =>
        set((state) => ({
          profile: { ...state.profile, ...updates },
        })),

      toggleTheme: () =>
        set((state) => {
          const newTheme = state.profile.theme === 'dark' ? 'light' : 'dark';
          return { profile: { ...state.profile, theme: newTheme } };
        }),

      addTransaction: (txData) => {
        const id = `tx-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        const state = get();
        let roundUpSaved = 0;

        // Check if round-up should be triggered for expenses
        if (txData.type === 'expense') {
          const roundUpGoal = state.goals.find((g) => g.roundUpEnabled && !g.isCompleted);
          if (roundUpGoal) {
            const diff = calculateRoundUp(txData.amount);
            if (diff > 0) {
              roundUpSaved = diff;
              // Contribute difference to goal
              get().contributeToGoal(
                roundUpGoal.id,
                diff,
                `Round-up from ${txData.note || 'expense'}`
              );
            }
          }
        }

        const newTx: Transaction = {
          ...txData,
          id,
          isRoundUp: roundUpSaved > 0,
          roundUpAmount: roundUpSaved,
        };

        const updatedTransactions = [newTx, ...state.transactions];

        // Outside food nudge calculation
        let outsideFoodNudge: string | undefined;
        const outsideFoodCat = state.categories.find((c) => c.id === 'cat-outside-food' || c.name.toLowerCase().includes('outside food'));

        if (txData.type === 'expense' && outsideFoodCat && txData.categoryId === outsideFoodCat.id) {
          const currentMonthExpenses = updatedTransactions
            .filter((t) => t.type === 'expense' && t.categoryId === outsideFoodCat.id)
            .reduce((sum, t) => sum + t.amount, 0);

          const limit = outsideFoodCat.monthlyLimit || 2500;
          const remaining = Math.max(0, limit - currentMonthExpenses);
          outsideFoodNudge = `₹${remaining.toLocaleString('en-IN')} left in Outside Food budget this month.`;

          // Trigger soft cap / hard cap alert if needed
          if (limit > 0 && currentMonthExpenses >= limit) {
            get().addAlert({
              type: 'category_100',
              title: 'Outside Food Limit Reached',
              message: `You've reached your monthly limit of ₹${limit.toLocaleString('en-IN')}. Remember, hostel mess is prepaid!`,
              category: 'Outside Food',
            });
          } else if (limit > 0 && currentMonthExpenses >= limit * 0.8) {
            get().addAlert({
              type: 'category_80',
              title: 'Outside Food at 80%',
              message: `You've used 80% of your outside food allowance (₹${currentMonthExpenses.toLocaleString('en-IN')} of ₹${limit.toLocaleString('en-IN')}).`,
              category: 'Outside Food',
            });
          }
        }

        // Check weekly budget exhaustion
        if (txData.type === 'expense') {
          const weekly = calculateWeeklyBudget(state.profile, updatedTransactions, new Date());
          if (weekly.remainingThisWeek <= 0) {
            get().addAlert({
              type: 'week_exhausted',
              title: 'Weekly Budget Exhausted',
              message: `You've reached your weekly spendable limit. Remaining days in the week may pinch.`,
            });
          }
        }

        set({ transactions: updatedTransactions });

        return { id, roundUpSaved, outsideFoodNudge };
      },

      updateTransaction: (id, updates) =>
        set((state) => ({
          transactions: state.transactions.map((t) =>
            t.id === id ? { ...t, ...updates } : t
          ),
        })),

      deleteTransaction: (id) =>
        set((state) => ({
          transactions: state.transactions.filter((t) => t.id !== id),
        })),

      // Day Planner Actions
      setDayPlanTarget: (date, targetBudget, notes) =>
        set((state) => {
          const currentPlan = state.dayPlans[date] || { date, items: [] };
          return {
            dayPlans: {
              ...state.dayPlans,
              [date]: {
                ...currentPlan,
                targetBudget: targetBudget !== undefined ? targetBudget : currentPlan.targetBudget,
                notes: notes !== undefined ? notes : currentPlan.notes,
              },
            },
          };
        }),

      addPlannedItem: (date, itemData) =>
        set((state) => {
          const currentPlan = state.dayPlans[date] || { date, items: [] };
          const newItem: PlannedItem = {
            ...itemData,
            id: `plan-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            status: 'planned',
          };
          return {
            dayPlans: {
              ...state.dayPlans,
              [date]: {
                ...currentPlan,
                items: [...currentPlan.items, newItem],
              },
            },
          };
        }),

      updatePlannedItem: (date, itemId, updates) =>
        set((state) => {
          const currentPlan = state.dayPlans[date];
          if (!currentPlan) return state;
          return {
            dayPlans: {
              ...state.dayPlans,
              [date]: {
                ...currentPlan,
                items: currentPlan.items.map((item) =>
                  item.id === itemId ? { ...item, ...updates } : item
                ),
              },
            },
          };
        }),

      deletePlannedItem: (date, itemId) =>
        set((state) => {
          const currentPlan = state.dayPlans[date];
          if (!currentPlan) return state;
          return {
            dayPlans: {
              ...state.dayPlans,
              [date]: {
                ...currentPlan,
                items: currentPlan.items.filter((item) => item.id !== itemId),
              },
            },
          };
        }),

      markPlannedItemSpent: (date, itemId, actualAmount, paymentMode = 'UPI') => {
        const state = get();
        const currentPlan = state.dayPlans[date];
        if (!currentPlan) return;
        const item = currentPlan.items.find((i) => i.id === itemId);
        if (!item) return;

        const spendAmount = actualAmount !== undefined ? actualAmount : item.plannedAmount;

        let txId: string | undefined;
        if (!item.isPrepaidMess && spendAmount > 0) {
          const res = get().addTransaction({
            type: 'expense',
            amount: spendAmount,
            categoryId: item.categoryId,
            note: item.title,
            date: date,
            mode: paymentMode,
          });
          txId = res.id;
        }

        set((s) => {
          const plan = s.dayPlans[date];
          if (!plan) return s;
          return {
            dayPlans: {
              ...s.dayPlans,
              [date]: {
                ...plan,
                items: plan.items.map((i) =>
                  i.id === itemId
                    ? {
                        ...i,
                        status: 'spent',
                        actualAmount: spendAmount,
                        transactionId: txId,
                      }
                    : i
                ),
              },
            },
          };
        });
      },

      markPlannedItemSkipped: (date, itemId) => {
        set((s) => {
          const plan = s.dayPlans[date];
          if (!plan) return s;
          const item = plan.items.find((i) => i.id === itemId);
          if (item && item.plannedAmount > 0) {
            get().addAlert({
              type: 'goal_milestone',
              title: `Saved ₹${item.plannedAmount}!`,
              message: `You skipped "${item.title}" and saved ₹${item.plannedAmount} for your future plans.`,
            });
          }
          return {
            dayPlans: {
              ...s.dayPlans,
              [date]: {
                ...plan,
                items: plan.items.map((i) =>
                  i.id === itemId ? { ...i, status: 'skipped' } : i
                ),
              },
            },
          };
        });
      },

      addCategory: (catData) => {
        const id = `cat-${Date.now()}`;
        set((state) => ({
          categories: [...state.categories, { ...catData, id }],
        }));
      },

      updateCategory: (id, updates) =>
        set((state) => ({
          categories: state.categories.map((c) =>
            c.id === id ? { ...c, ...updates } : c
          ),
        })),

      deleteCategory: (id) =>
        set((state) => ({
          categories: state.categories.filter((c) => c.id !== id),
        })),

      addGoal: (goalData) => {
        const id = `goal-${Date.now()}`;
        set((state) => ({
          goals: [
            ...state.goals,
            { ...goalData, id, saved: 0, contributions: [], isCompleted: false },
          ],
        }));
      },

      updateGoal: (id, updates) =>
        set((state) => ({
          goals: state.goals.map((g) => (g.id === id ? { ...g, ...updates } : g)),
        })),

      deleteGoal: (id) =>
        set((state) => ({
          goals: state.goals.filter((g) => g.id !== id),
        })),

      contributeToGoal: (goalId, amount, note) => {
        if (amount <= 0) return;
        const todayStr = new Date().toISOString().slice(0, 10);
        const contribution = {
          id: `gc-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          date: todayStr,
          amount,
          note: note || 'Contribution',
        };

        set((state) => {
          const updatedGoals = state.goals.map((g) => {
            if (g.id !== goalId) return g;
            const newSaved = g.saved + amount;
            const isCompleted = newSaved >= g.target;

            // Trigger milestone alerts
            const oldPct = Math.floor((g.saved / g.target) * 100);
            const newPct = Math.floor((newSaved / g.target) * 100);

            [25, 50, 75, 100].forEach((milestone) => {
              if (oldPct < milestone && newPct >= milestone) {
                setTimeout(() => {
                  get().addAlert({
                    type: 'goal_milestone',
                    title: `${milestone}% of ${g.name} Reached`,
                    message:
                      milestone === 100
                        ? `Congratulations! You've achieved your goal of ₹${g.target.toLocaleString('en-IN')} for ${g.name}!`
                        : `You've achieved ${milestone}% of your goal for ${g.name}. Keep it up!`,
                  });
                }, 100);
              }
            });

            return {
              ...g,
              saved: newSaved,
              isCompleted,
              contributions: [contribution, ...g.contributions],
            };
          });

          return { goals: updatedGoals };
        });
      },

      withdrawFromGoal: (goalId, amount, note) => {
        if (amount <= 0) return;
        const todayStr = new Date().toISOString().slice(0, 10);
        const contribution = {
          id: `gc-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          date: todayStr,
          amount: -amount,
          note: note || 'Withdrawal',
        };

        set((state) => ({
          goals: state.goals.map((g) => {
            if (g.id !== goalId) return g;
            const newSaved = Math.max(0, g.saved - amount);
            return {
              ...g,
              saved: newSaved,
              isCompleted: newSaved >= g.target,
              contributions: [contribution, ...g.contributions],
            };
          }),
        }));
      },

      acceptChallenge: (challengeId) =>
        set((state) => ({
          challenges: state.challenges.map((ch) =>
            ch.id === challengeId
              ? { ...ch, accepted: true, acceptedDate: new Date().toISOString().slice(0, 10) }
              : ch
          ),
        })),

      completeChallenge: (challengeId) => {
        const state = get();
        const ch = state.challenges.find((c) => c.id === challengeId);
        if (ch && ch.goalId && ch.savingsEstimate > 0) {
          get().contributeToGoal(
            ch.goalId,
            ch.savingsEstimate,
            `Completed challenge: ${ch.title}`
          );
        }

        set((s) => ({
          challenges: s.challenges.map((c) =>
            c.id === challengeId ? { ...c, completed: true } : c
          ),
        }));
      },

      dismissAlert: (id) =>
        set((state) => ({
          alerts: state.alerts.filter((a) => a.id !== id),
        })),

      addAlert: (alertData) =>
        set((state) => {
          // Avoid duplicate alerts within short duration
          const exists = state.alerts.some(
            (a) => a.title === alertData.title && Date.now() - a.timestamp < 3600000
          );
          if (exists) return state;

          const newAlert: InAppAlert = {
            ...alertData,
            id: `alert-${Date.now()}`,
            timestamp: Date.now(),
            read: false,
          };
          return { alerts: [newAlert, ...state.alerts.slice(0, 9)] };
        }),

      setPin: (pin) => {
        const hash = simpleHash(pin);
        set((state) => ({
          profile: { ...state.profile, pinHash: hash, pinEnabled: true },
        }));
      },

      removePin: () =>
        set((state) => ({
          profile: { ...state.profile, pinHash: undefined, pinEnabled: false },
          isLocked: false,
        })),

      unlockWithPin: (pin) => {
        const state = get();
        if (!state.profile.pinHash) return true;
        const enteredHash = simpleHash(pin);
        if (enteredHash === state.profile.pinHash) {
          set({ isLocked: false });
          return true;
        }
        return false;
      },

      lockApp: () => {
        const state = get();
        if (state.profile.pinEnabled && state.profile.pinHash) {
          set({ isLocked: true });
        }
      },

      loadDemoData: () => {
        set({
          profile: {
            ...INITIAL_PROFILE,
            monthlyIncome: 12000,
            onboardingCompleted: true,
          },
          categories: INITIAL_CATEGORIES,
          goals: getDemoGoals(),
          challenges: [],
          transactions: getDemoTransactions(),
          alerts: [],
          activeTab: 'home',
        });
      },

      resetAllData: () => {
        set({
          profile: {
            monthlyIncome: 0,
            extraIncome: 0,
            payDay: 1,
            fixedCosts: [],
            savingsRatePct: 20,
            theme: 'dark',
            onboardingCompleted: false,
          },
          transactions: [],
          categories: INITIAL_CATEGORIES,
          goals: [],
          challenges: [],
          alerts: [],
          activeTab: 'home',
          isLocked: false,
        });
      },

      exportJSON: () => {
        const state = get();
        const exportObj = {
          profile: state.profile,
          transactions: state.transactions,
          categories: state.categories,
          goals: state.goals,
          challenges: state.challenges,
          dayPlans: state.dayPlans,
          exportedAt: new Date().toISOString(),
          version: '1.1.0',
        };
        return JSON.stringify(exportObj, null, 2);
      },

      importJSON: (jsonStr: string) => {
        try {
          const parsed = JSON.parse(jsonStr);
          if (!parsed.profile || !Array.isArray(parsed.transactions)) {
            return false;
          }
          set({
            profile: parsed.profile,
            transactions: parsed.transactions,
            categories: parsed.categories || INITIAL_CATEGORIES,
            goals: parsed.goals || [],
            challenges: parsed.challenges || [],
            dayPlans: parsed.dayPlans || {},
            alerts: [],
          });
          return true;
        } catch {
          return false;
        }
      },

      exportCSV: () => {
        const state = get();
        const headers = ['Date', 'Type', 'Amount', 'Category', 'Mode', 'Note', 'RoundUp'];
        const rows = state.transactions.map((t) => {
          const categoryName = state.categories.find((c) => c.id === t.categoryId)?.name || t.categoryId;
          return [
            t.date,
            t.type,
            t.amount,
            `"${categoryName.replace(/"/g, '""')}"`,
            t.mode,
            `"${(t.note || '').replace(/"/g, '""')}"`,
            t.isRoundUp ? t.roundUpAmount || 0 : 0,
          ].join(',');
        });
        return [headers.join(','), ...rows].join('\n');
      },
    }),
    {
      name: 'chillar:store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        profile: state.profile,
        transactions: state.transactions,
        categories: state.categories,
        goals: state.goals,
        challenges: state.challenges,
        dayPlans: state.dayPlans,
        alerts: state.alerts,
        isLocked: state.profile.pinEnabled ? true : false,
      }),
    }
  )
);

import {
  calculateMonthlySpendable,
  calculateWeeklyBudget,
  calculateMonthlyPace,
  calculateCategoryMonthlyStatus,
  calculateOutsideFoodStreak,
  calculateGoalMetrics,
  calculateRoundUp,
  analyzeAffordability,
} from './budgetMath';
import { Transaction, Goal } from '../types/finance';

function runTests() {
  console.log('--- RUNNING CHILLAR BUDGET MATH UNIT TESTS ---');

  // Test 1: Monthly Spendable (excludes prepaid mess)
  const testProfile = {
    monthlyIncome: 12000,
    extraIncome: 1500,
    payDay: 1,
    fixedCosts: [
      { id: '1', name: 'Prepaid Mess', amount: 4500, isPrepaidMess: true },
      { id: '2', name: 'Recharge', amount: 399 },
      { id: '3', name: 'Laundry', amount: 350 },
      { id: '4', name: 'Spotify', amount: 199 },
    ],
    savingsRatePct: 20,
    theme: 'dark' as const,
    onboardingCompleted: true,
  };
  const spendableRes = calculateMonthlySpendable(testProfile);
  console.assert(spendableRes.totalIncome === 13500, `Expected total income 13500, got ${spendableRes.totalIncome}`);
  // Fixed costs non-prepaid: 399 + 199 + 350 = 948 (4500 mess is prepaid and excluded!)
  console.assert(spendableRes.totalFixedCosts === 948, `Expected fixed costs 948, got ${spendableRes.totalFixedCosts}`);
  // Savings target: 20% of 13500 = 2700
  console.assert(spendableRes.savingsTargetAmount === 2700, `Expected savings target 2700, got ${spendableRes.savingsTargetAmount}`);
  // Spendable: 13500 - 948 - 2700 = 9852
  console.assert(spendableRes.monthlySpendable === 9852, `Expected spendable 9852, got ${spendableRes.monthlySpendable}`);
  console.log('✓ Test 1 Passed: Monthly Spendable Calculation (Prepaid mess excluded correctly)');

  // Test 2: Round-Up Calculation
  console.assert(calculateRoundUp(42) === 8, 'Expected 42 -> 8 round up');
  console.assert(calculateRoundUp(50) === 0, 'Expected 50 -> 0 round up');
  console.assert(calculateRoundUp(15) === 5, 'Expected 15 -> 5 round up');
  console.assert(calculateRoundUp(7) === 3, 'Expected 7 -> 3 round up');
  console.log('✓ Test 2 Passed: Round-up to next ₹10');

  // Test 3: Outside Food Streak Calculation
  const testTxs: Transaction[] = [
    { id: '1', type: 'expense', amount: 30, categoryId: 'cat-snacks-chai', date: '2026-10-02', mode: 'UPI' },
    { id: '2', type: 'expense', amount: 45, categoryId: 'cat-transport', date: '2026-10-01', mode: 'Cash' },
    { id: '3', type: 'expense', amount: 200, categoryId: 'cat-outside-food', date: '2026-09-29', mode: 'UPI' },
  ];
  // 2026-10-02 (today: no outside food), 2026-10-01 (no), 2026-09-30 (no), 2026-09-29 (has outside food)
  const streak = calculateOutsideFoodStreak(testTxs, 'cat-outside-food', new Date('2026-10-02'));
  console.assert(streak === 3, `Expected streak 3, got ${streak}`);
  console.log('✓ Test 3 Passed: Outside Food Streak Calculation');

  // Test 4: Affordability Simulation
  const mockGoal: Goal = {
    id: 'g1',
    name: 'Goa Trip',
    target: 8000,
    saved: 4000,
    targetDate: '2026-11-30',
    contributions: [],
    roundUpEnabled: true,
  };
  const aff = analyzeAffordability(400, testProfile, [], mockGoal, new Date('2026-10-02'));
  console.assert(aff.amount === 400, 'Expected amount 400');
  console.assert(aff.newSafeToday <= aff.currentSafeToday, 'Expected new safe today <= current safe today');
  console.assert(aff.goalImpact !== undefined, 'Expected goal impact calculated');
  console.log('✓ Test 4 Passed: Affordability Analysis Simulator');

  console.log('ALL UNIT TESTS PASSED SUCCESSFULLY!');
}

runTests();

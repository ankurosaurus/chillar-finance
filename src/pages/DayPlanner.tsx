import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Shield,
  Utensils,
  Trash2,
  Edit2,
  CalendarCheck,
  Check,
} from 'lucide-react';
import { Card } from '../components/Card';
import { ProgressBar } from '../components/ProgressBar';
import { Sheet } from '../components/Sheet';
import { useFinanceStore } from '../store/useFinanceStore';
import { calculateWeeklyBudget } from '../lib/budgetMath';
import { formatINR, formatDate } from '../lib/formatters';
import { useTheme } from '../hooks/useTheme';
import { PaymentMode, PlannedItem } from '../types/finance';
import { format, addDays, subDays, parseISO, isToday, isTomorrow } from 'date-fns';

export const DayPlanner: React.FC = () => {
  const profile = useFinanceStore((state) => state.profile);
  const transactions = useFinanceStore((state) => state.transactions);
  const categories = useFinanceStore((state) => state.categories);
  const dayPlans = useFinanceStore((state) => state.dayPlans);
  const setDayPlanTarget = useFinanceStore((state) => state.setDayPlanTarget);
  const addPlannedItem = useFinanceStore((state) => state.addPlannedItem);
  const updatePlannedItem = useFinanceStore((state) => state.updatePlannedItem);
  const deletePlannedItem = useFinanceStore((state) => state.deletePlannedItem);
  const markPlannedItemSpent = useFinanceStore((state) => state.markPlannedItemSpent);
  const markPlannedItemSkipped = useFinanceStore((state) => state.markPlannedItemSkipped);
  const { isDark } = useTheme();

  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');
  const tomorrowStr = format(addDays(today, 1), 'yyyy-MM-dd');

  // Selected date for planning (defaults to Tomorrow if user wants to plan a day prior, or Today)
  const [selectedDateStr, setSelectedDateStr] = useState<string>(todayStr);

  // New planned item sheet
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [itemTitle, setItemTitle] = useState('');
  const [itemAmount, setItemAmount] = useState('');
  const [itemCategory, setItemCategory] = useState(categories[0]?.id || 'cat-snacks-chai');
  const [itemTimeSlot, setItemTimeSlot] = useState<PlannedItem['timeSlot']>('Evening');
  const [isPrepaidMess, setIsPrepaidMess] = useState(false);

  // Day notes edit
  const [dayNotes, setDayNotes] = useState('');
  const [isEditingNotes, setIsEditingNotes] = useState(false);

  // Selected date object
  const selectedDate = useMemo(() => {
    try {
      return parseISO(selectedDateStr);
    } catch {
      return new Date();
    }
  }, [selectedDateStr]);

  const isCurrentDayToday = isToday(selectedDate);
  const isCurrentDayTomorrow = isTomorrow(selectedDate);

  // Weekly budget for safe daily spend guidance
  const weekly = calculateWeeklyBudget(profile, transactions, today);
  const recommendedSafeDaily = weekly.safeToSpendToday;

  // Plan for the selected day
  const currentPlan = dayPlans[selectedDateStr] || { date: selectedDateStr, items: [] };

  // Calculate planned totals (excluding prepaid mess which is ₹0)
  const totalPlannedSpend = currentPlan.items
    .filter((i) => !i.isPrepaidMess && i.status !== 'skipped')
    .reduce((sum, i) => sum + i.plannedAmount, 0);

  const totalSpentSoFar = currentPlan.items
    .filter((i) => i.status === 'spent')
    .reduce((sum, i) => sum + (i.actualAmount !== undefined ? i.actualAmount : i.plannedAmount), 0);

  const totalSavedBySkipping = currentPlan.items
    .filter((i) => i.status === 'skipped')
    .reduce((sum, i) => sum + i.plannedAmount, 0);

  // Daily Headroom compared to safe spend
  const dailyHeadroom = recommendedSafeDaily - totalPlannedSpend;
  const isOverSafeLimit = recommendedSafeDaily > 0 && totalPlannedSpend > recommendedSafeDaily;

  // Quick hostel presets
  const quickPresets = [
    { title: 'Hostel Mess Lunch/Dinner', amount: 0, catId: 'cat-outside-food', isMess: true, slot: 'Afternoon' as const },
    { title: 'Tapri Cutting Chai & Biscuits', amount: 30, catId: 'cat-snacks-chai', isMess: false, slot: 'Evening' as const },
    { title: 'Shared Auto / Metro', amount: 50, catId: 'cat-transport', isMess: false, slot: 'Morning' as const },
    { title: 'Canteen Evening Snack', amount: 60, catId: 'cat-snacks-chai', isMess: false, slot: 'Evening' as const },
    { title: 'Study Manuals & Xerox', amount: 40, catId: 'cat-study', isMess: false, slot: 'Morning' as const },
    { title: 'Outside Dinner with Friends', amount: 220, catId: 'cat-outside-food', isMess: false, slot: 'Night' as const },
  ];

  const handleAddPreset = (p: typeof quickPresets[0]) => {
    addPlannedItem(selectedDateStr, {
      title: p.title,
      plannedAmount: p.amount,
      categoryId: p.catId,
      timeSlot: p.slot,
      isPrepaidMess: p.isMess,
    });
  };

  const handleSaveItem = () => {
    if (!itemTitle.trim()) return;
    const amountNum = isPrepaidMess ? 0 : parseFloat(itemAmount) || 0;

    addPlannedItem(selectedDateStr, {
      title: itemTitle.trim(),
      plannedAmount: amountNum,
      categoryId: itemCategory,
      timeSlot: itemTimeSlot,
      isPrepaidMess,
    });

    setIsAddingItem(false);
    setItemTitle('');
    setItemAmount('');
    setIsPrepaidMess(false);
  };

  const handleSaveNotes = () => {
    setDayPlanTarget(selectedDateStr, undefined, dayNotes);
    setIsEditingNotes(false);
  };

  const openNotesEditor = () => {
    setDayNotes(currentPlan.notes || '');
    setIsEditingNotes(true);
  };

  return (
    <div className="flex flex-col gap-6 pb-24 md:pb-12">
      {/* Top Banner with Today's Date and Day */}
      <div className="pt-1 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <CalendarCheck strokeWidth={1.5} className="w-5 h-5 text-blue-400" />
            <span className="meta-label text-blue-400">Financial Day Planner</span>
          </div>
          <h2 className="font-serif-display text-2xl sm:text-3xl font-light tracking-wide mt-0.5">
            {format(today, 'EEEE, d MMMM yyyy')}
          </h2>
          <span className="text-xs text-slate-400">
            Plan expenses a day prior to keep hostel spending effortless and controlled
          </span>
        </div>

        {/* Quick Date Tabs: Today vs Tomorrow (Plan Prior) */}
        <div
          className={`p-1.5 rounded-2xl border flex items-center gap-1.5 self-start md:self-auto text-xs ${
            isDark ? 'bg-[#0B0F19] border-white/10' : 'bg-[#FFFFFF] border-slate-200'
          }`}
        >
          <button
            type="button"
            onClick={() => setSelectedDateStr(todayStr)}
            className={`px-3.5 py-1.5 rounded-xl font-medium transition-all ${
              selectedDateStr === todayStr
                ? 'bg-blue-600 text-white font-semibold shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Today ({format(today, 'EEE, d')})
          </button>

          <button
            type="button"
            onClick={() => setSelectedDateStr(tomorrowStr)}
            className={`px-3.5 py-1.5 rounded-xl font-medium transition-all flex items-center gap-1.5 ${
              selectedDateStr === tomorrowStr
                ? 'bg-blue-600 text-white font-semibold shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>Tomorrow (Plan Prior)</span>
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                selectedDateStr === tomorrowStr ? 'bg-white' : 'bg-blue-400'
              }`}
            />
          </button>

          {/* Quick Date Steppers */}
          <div className="flex items-center pl-1 border-l border-inherit">
            <button
              type="button"
              onClick={() => setSelectedDateStr(format(subDays(selectedDate, 1), 'yyyy-MM-dd'))}
              className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400"
              title="Previous Day"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setSelectedDateStr(format(addDays(selectedDate, 1), 'yyyy-MM-dd'))}
              className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400"
              title="Next Day"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Selected Day Header Notice */}
      <div
        className={`px-4 py-3 rounded-2xl border flex items-center justify-between text-xs ${
          isCurrentDayTomorrow
            ? 'border-blue-500/35 bg-blue-600/10 text-blue-400'
            : isCurrentDayToday
            ? 'border-emerald-500/35 bg-emerald-500/10 text-emerald-400'
            : 'border-inherit bg-inherit text-slate-400'
        }`}
      >
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 shrink-0" />
          <span>
            {isCurrentDayTomorrow ? (
              <strong>Planning for Tomorrow: {format(selectedDate, 'EEEE, d MMMM')}</strong>
            ) : isCurrentDayToday ? (
              <strong>Executing Today's Plan: {format(selectedDate, 'EEEE, d MMMM')}</strong>
            ) : (
              <span>Planning for {format(selectedDate, 'EEEE, d MMMM yyyy')}</span>
            )}
          </span>
        </div>

        <input
          type="date"
          value={selectedDateStr}
          onChange={(e) => setSelectedDateStr(e.target.value)}
          className="bg-transparent text-xs outline-none cursor-pointer text-inherit"
        />
      </div>

      {/* Top 3-Card Summary Grid on Desktop */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Safe Daily Limit */}
        <Card variant="surface" className="flex flex-col justify-between">
          <div>
            <span className="meta-label text-slate-400 block mb-1">Safe Daily Benchmark</span>
            <span className="font-serif-display text-3xl tnum text-blue-400">
              {formatINR(recommendedSafeDaily)}
            </span>
          </div>
          <span className="text-[11px] text-slate-400 mt-2 block">
            Derived from ₹{weekly.remainingThisWeek.toLocaleString('en-IN')} remaining this week
          </span>
        </Card>

        {/* Card 2: Total Planned Spend */}
        <Card variant="surface" className="flex flex-col justify-between">
          <div>
            <span className="meta-label text-[#94A3B8] block mb-1">Total Planned Spend</span>
            <span
              className={`font-serif-display text-3xl tnum ${
                isOverSafeLimit ? 'text-[#F43F5E]' : 'text-inherit'
              }`}
            >
              {formatINR(totalPlannedSpend)}
            </span>
          </div>
          <div className="text-[11px] text-[#94A3B8] mt-2 flex items-center justify-between">
            <span>{currentPlan.items.length} item{currentPlan.items.length !== 1 ? 's' : ''} planned</span>
            {totalSpentSoFar > 0 && (
              <span className="text-[#10B981]">Spent: {formatINR(totalSpentSoFar)}</span>
            )}
          </div>
        </Card>

        {/* Card 3: Headroom / Deficit Forecast */}
        <Card
          variant="surface"
          className={`flex flex-col justify-between border ${
            isOverSafeLimit
              ? 'border-[#F43F5E]/40 bg-[#F43F5E]/5'
              : 'border-[#10B981]/30 bg-[#10B981]/5'
          }`}
        >
          <div>
            <span className="meta-label text-[#94A3B8] block mb-1">
              {dailyHeadroom >= 0 ? 'Projected Headroom' : 'Projected Deficit'}
            </span>
            <span
              className={`font-serif-display text-3xl tnum ${
                dailyHeadroom >= 0 ? 'text-[#10B981]' : 'text-[#F43F5E]'
              }`}
            >
              {dailyHeadroom >= 0 ? `+${formatINR(dailyHeadroom)}` : formatINR(dailyHeadroom)}
            </span>
          </div>
          <span className="text-[11px] text-[#94A3B8] mt-2 block">
            {dailyHeadroom >= 0
              ? 'Fits comfortably inside your daily spending ceiling.'
              : 'Exceeds daily safe spend. Consider hostel mess or skipping 1 item.'}
          </span>
        </Card>
      </div>

      {/* Main 2-Column Responsive Layout: Planned Items + Hostel Presets & Notes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 spans on desktop): Planned Items Checklist */}
        <div className="lg:col-span-2 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="meta-label text-slate-400">Day Expense Blueprint</span>
              <h3 className="font-serif-display text-lg font-light">
                Planned Spends for {isCurrentDayToday ? 'Today' : isCurrentDayTomorrow ? 'Tomorrow' : format(selectedDate, 'd MMM')}
              </h3>
            </div>

            <button
              type="button"
              onClick={() => setIsAddingItem(true)}
              className="px-3.5 py-1.5 rounded-full bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-blue-600/25 transition-all"
            >
              <Plus strokeWidth={2} className="w-3.5 h-3.5" />
              <span>Add Planned Spend</span>
            </button>
          </div>

          {currentPlan.items.length === 0 ? (
            <Card className="text-center py-12 flex flex-col items-center gap-3 border-dashed">
              <Calendar className="w-6 h-6 text-blue-400" />
              <div>
                <h4 className="font-serif-display text-base font-light">No expenses planned yet</h4>
                <p className="text-xs text-slate-400 max-w-xs mt-1">
                  Plan tomorrow's chai, canteen snacks, or travel a day prior so your wallet is never surprised.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddingItem(true)}
                className="px-4 py-2 rounded-full border border-blue-500/40 text-blue-400 hover:bg-blue-500/10 text-xs font-medium transition-colors"
              >
                + Plan an Expense
              </button>
            </Card>
          ) : (
            <div className="flex flex-col gap-2.5">
              {currentPlan.items.map((item) => {
                const cat = categories.find((c) => c.id === item.categoryId);
                const isSpent = item.status === 'spent';
                const isSkipped = item.status === 'skipped';

                return (
                  <Card
                    key={item.id}
                    className={`p-4 transition-colors flex items-center justify-between gap-3 ${
                      isSpent
                        ? 'border-emerald-500/30 bg-emerald-500/5'
                        : isSkipped
                        ? 'border-white/5 opacity-60 bg-inherit'
                        : 'hover:border-blue-500/40'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Status indicator button */}
                      <button
                        type="button"
                        onClick={() => {
                          if (!isSpent) {
                            markPlannedItemSpent(selectedDateStr, item.id);
                          }
                        }}
                        className={`w-6 h-6 rounded-full border flex items-center justify-center transition-colors ${
                          isSpent
                            ? 'bg-emerald-500 border-emerald-500 text-slate-900'
                            : isSkipped
                            ? 'border-slate-500 bg-transparent text-slate-500'
                            : 'border-white/20 hover:border-blue-400'
                        }`}
                        title={isSpent ? 'Spent (logged to ledger)' : 'Mark as Spent'}
                      >
                        {isSpent && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        {isSkipped && <span className="text-[10px]">✕</span>}
                      </button>

                      <div>
                        <div className="flex items-center gap-2">
                          <h4
                            className={`text-sm font-medium tracking-tight ${
                              isSkipped ? 'line-through text-slate-500' : ''
                            }`}
                          >
                            {item.title}
                          </h4>
                          {item.isPrepaidMess && (
                            <span className="text-[10px] px-2 py-0.2 rounded-full bg-emerald-500/15 text-emerald-400">
                              Prepaid Mess
                            </span>
                          )}
                          {item.timeSlot && (
                            <span className="text-[10px] text-slate-400">
                              · {item.timeSlot}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: cat?.color || '#3B82F6' }}
                          />
                          <span>{cat?.name || 'General'}</span>
                          {isSpent && <span className="text-emerald-400">· Logged to Ledger</span>}
                          {isSkipped && <span className="text-blue-400">· Skipped (Rupee Saved)</span>}
                        </div>
                      </div>
                    </div>

                    {/* Amount & Quick Actions */}
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span
                          className={`font-serif-display text-base tnum font-light ${
                            item.isPrepaidMess
                              ? 'text-emerald-400'
                              : isSkipped
                              ? 'text-slate-500'
                              : 'text-blue-400'
                          }`}
                        >
                          {item.isPrepaidMess ? '₹0' : formatINR(item.plannedAmount)}
                        </span>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1">
                        {!isSpent && !isSkipped && (
                          <>
                            <button
                              type="button"
                              onClick={() => markPlannedItemSpent(selectedDateStr, item.id)}
                              className="p-1.5 rounded-xl border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 text-xs transition-colors"
                              title="Mark as Spent"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => markPlannedItemSkipped(selectedDateStr, item.id)}
                              className="p-1.5 rounded-xl border border-white/10 hover:border-blue-500/40 text-slate-400 hover:text-blue-400 text-xs transition-colors"
                              title="Skip & Save this expense"
                            >
                              <Shield className="w-4 h-4" />
                            </button>
                          </>
                        )}

                        <button
                          type="button"
                          onClick={() => deletePlannedItem(selectedDateStr, item.id)}
                          className="p-1.5 text-rose-400 opacity-60 hover:opacity-100 rounded-lg transition-opacity"
                          title="Delete item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Quick Hostel Presets & Day Strategy Notes */}
        <div className="flex flex-col gap-5">
          {/* Quick Hostel Spends Presets */}
          <Card variant="surface" className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="meta-label text-slate-400">Quick Hostel Presets</span>
              <span className="text-[11px] text-blue-400">1-Tap Add</span>
            </div>
            <p className="text-xs text-slate-400">
              Common daily hostel expenses ready to schedule for tomorrow:
            </p>

            <div className="flex flex-col gap-1.5 pt-1">
              {quickPresets.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleAddPreset(preset)}
                  className={`p-2.5 rounded-2xl border text-xs text-left flex items-center justify-between transition-colors ${
                    isDark
                      ? 'border-white/5 bg-[#0B0F19] hover:border-blue-500/40 hover:bg-blue-600/5'
                      : 'border-slate-200 bg-slate-50 hover:border-blue-500/40 hover:bg-blue-50'
                  }`}
                >
                  <span className="truncate pr-2">{preset.title}</span>
                  <span className="font-serif-display tnum font-medium text-blue-400 shrink-0">
                    {preset.amount === 0 ? '₹0' : formatINR(preset.amount)}
                  </span>
                </button>
              ))}
            </div>
          </Card>

          {/* Day Strategy / Food Notes Card */}
          <Card variant="surface" className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="meta-label text-slate-400">Strategy & Notes</span>
              <button
                type="button"
                onClick={openNotesEditor}
                className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
              >
                <Edit2 className="w-3 h-3" />
                <span>Edit</span>
              </button>
            </div>

            {currentPlan.notes ? (
              <p className="text-xs text-inherit leading-relaxed italic bg-inherit p-3 rounded-2xl border border-inherit">
                "{currentPlan.notes}"
              </p>
            ) : (
              <p
                onClick={openNotesEditor}
                className="text-xs text-slate-400 cursor-pointer hover:text-white py-2"
              >
                + Add a note for this day (e.g. "Mess has special thali tomorrow—resist food delivery app temptation").
              </p>
            )}
          </Card>
        </div>
      </div>

      {/* Add Planned Spend Sheet Modal */}
      <Sheet
        isOpen={isAddingItem}
        onClose={() => setIsAddingItem(false)}
        title="Plan Expense Ahead"
        subtitle={`Schedule spend for ${format(selectedDate, 'EEEE, d MMMM')}`}
      >
        <div className="flex flex-col gap-4 pb-4">
          <div>
            <span className="meta-label text-slate-400 mb-1 block">Expense Title</span>
            <input
              type="text"
              placeholder="e.g. Evening tapri chai, Xerox, Canteen roll"
              value={itemTitle}
              onChange={(e) => setItemTitle(e.target.value)}
              className={`w-full px-3.5 py-2.5 rounded-2xl border text-sm outline-none ${
                isDark ? 'bg-[#0B0F19] border-white/10 text-white' : 'bg-slate-100 border-slate-200 text-slate-900'
              }`}
            />
          </div>

          <div>
            <span className="meta-label text-slate-400 mb-1 block">Planned Amount (₹)</span>
            <input
              type="number"
              placeholder="Amount in ₹"
              disabled={isPrepaidMess}
              value={isPrepaidMess ? '0' : itemAmount}
              onChange={(e) => setItemAmount(e.target.value)}
              className={`w-full px-4 py-3 rounded-2xl border font-serif-display text-2xl tnum outline-none ${
                isPrepaidMess ? 'opacity-50' : ''
              } ${
                isDark ? 'bg-[#0B0F19] border-white/10 text-blue-400' : 'bg-slate-100 border-slate-200 text-blue-600'
              }`}
            />
          </div>

          {/* Prepaid Mess Toggle */}
          <div
            onClick={() => setIsPrepaidMess(!isPrepaidMess)}
            className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition-colors ${
              isPrepaidMess ? 'border-emerald-500/40 bg-emerald-500/10' : 'border-inherit'
            }`}
          >
            <div className="flex items-center gap-2">
              <Utensils className="w-4 h-4 text-emerald-400" />
              <div>
                <h5 className="text-xs font-medium">Prepaid Hostel Mess Meal</h5>
                <span className="text-[11px] text-slate-400">Costs ₹0 (Already prepaid)</span>
              </div>
            </div>

            <div
              className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                isPrepaidMess ? 'bg-emerald-500 border-emerald-500 text-slate-900' : 'border-white/20'
              }`}
            >
              {isPrepaidMess && <Check className="w-3.5 h-3.5 stroke-[3]" />}
            </div>
          </div>

          {/* Time Slot Picker */}
          <div>
            <span className="meta-label text-slate-400 mb-1 block">Time Slot</span>
            <div className="grid grid-cols-4 gap-1.5">
              {(['Morning', 'Afternoon', 'Evening', 'Night'] as PlannedItem['timeSlot'][]).map((slot) => (
                <button
                  key={slot}
                  type="button"
                  onClick={() => setItemTimeSlot(slot)}
                  className={`py-2 text-xs rounded-xl border font-medium transition-all ${
                    itemTimeSlot === slot
                      ? 'border-blue-500 bg-blue-600/15 text-blue-400'
                      : 'border-inherit text-slate-400'
                  }`}
                >
                  {slot}
                </button>
              ))}
            </div>
          </div>

          {/* Category Picker */}
          <div>
            <span className="meta-label text-slate-400 mb-1 block">Category</span>
            <select
              value={itemCategory}
              onChange={(e) => setItemCategory(e.target.value)}
              className={`w-full px-3.5 py-2.5 rounded-2xl border text-xs outline-none ${
                isDark ? 'bg-[#0B0F19] border-white/10 text-white' : 'bg-slate-100 border-slate-200 text-slate-900'
              }`}
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={handleSaveItem}
            disabled={!itemTitle.trim()}
            className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white font-serif-display text-base font-semibold tracking-wide shadow-md shadow-blue-600/30 transition-all disabled:opacity-50"
          >
            Add to Day Plan
          </button>
        </div>
      </Sheet>

      {/* Edit Notes Sheet */}
      <Sheet
        isOpen={isEditingNotes}
        onClose={() => setIsEditingNotes(false)}
        title="Day Financial Strategy Note"
        subtitle={`Notes for ${format(selectedDate, 'd MMMM yyyy')}`}
      >
        <div className="flex flex-col gap-4 pb-4">
          <textarea
            rows={4}
            value={dayNotes}
            onChange={(e) => setDayNotes(e.target.value)}
            placeholder="e.g. Eat mess dinner tonight, keep evening spending under ₹50 for tea."
            className={`w-full p-3.5 rounded-2xl border text-xs leading-relaxed outline-none ${
              isDark ? 'bg-[#0B0F19] border-white/10 text-white' : 'bg-slate-100 border-slate-200 text-slate-900'
            }`}
          />
          <button
            type="button"
            onClick={handleSaveNotes}
            className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white font-serif-display text-base font-semibold shadow-md shadow-blue-600/30 transition-all"
          >
            Save Strategy Note
          </button>
        </div>
      </Sheet>
    </div>
  );
};

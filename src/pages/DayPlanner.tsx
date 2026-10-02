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
            <CalendarCheck strokeWidth={1.5} className="w-5 h-5 text-[#D4AF37]" />
            <span className="meta-label text-[#D4AF37]">Financial Day Planner</span>
          </div>
          <h2 className="font-serif-display text-2xl sm:text-3xl font-light tracking-wide mt-0.5">
            {format(today, 'EEEE, d MMMM yyyy')}
          </h2>
          <span className="text-xs text-[#94A3B8]">
            Plan expenses a day prior to keep hostel spending effortless and controlled
          </span>
        </div>

        {/* Quick Date Tabs: Today vs Tomorrow (Plan Prior) */}
        <div
          className={`p-1.5 rounded-2xl border flex items-center gap-1.5 self-start md:self-auto text-xs ${
            isDark ? 'bg-[#10121A] border-white/10' : 'bg-[#FFFFFF] border-black/10'
          }`}
        >
          <button
            type="button"
            onClick={() => setSelectedDateStr(todayStr)}
            className={`px-3.5 py-1.5 rounded-xl font-medium transition-all ${
              selectedDateStr === todayStr
                ? 'bg-[#D4AF37] text-[#08090C] font-semibold shadow-xs'
                : 'text-[#94A3B8] hover:text-inherit'
            }`}
          >
            Today ({format(today, 'EEE, d')})
          </button>

          <button
            type="button"
            onClick={() => setSelectedDateStr(tomorrowStr)}
            className={`px-3.5 py-1.5 rounded-xl font-medium transition-all flex items-center gap-1.5 ${
              selectedDateStr === tomorrowStr
                ? 'bg-[#D4AF37] text-[#08090C] font-semibold shadow-xs'
                : 'text-[#94A3B8] hover:text-inherit'
            }`}
          >
            <span>Tomorrow (Plan Prior)</span>
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                selectedDateStr === tomorrowStr ? 'bg-[#08090C]' : 'bg-[#D4AF37]'
              }`}
            />
          </button>

          {/* Quick Date Steppers */}
          <div className="flex items-center pl-1 border-l border-inherit">
            <button
              type="button"
              onClick={() => setSelectedDateStr(format(subDays(selectedDate, 1), 'yyyy-MM-dd'))}
              className="p-1.5 rounded-lg hover:bg-white/5 text-[#94A3B8]"
              title="Previous Day"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setSelectedDateStr(format(addDays(selectedDate, 1), 'yyyy-MM-dd'))}
              className="p-1.5 rounded-lg hover:bg-white/5 text-[#94A3B8]"
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
            ? 'border-[#D4AF37]/35 bg-[#D4AF37]/10 text-[#D4AF37]'
            : isCurrentDayToday
            ? 'border-[#10B981]/35 bg-[#10B981]/10 text-[#10B981]'
            : 'border-inherit bg-inherit text-[#94A3B8]'
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
            <span className="meta-label text-[#94A3B8] block mb-1">Safe Daily Benchmark</span>
            <span className="font-serif-display text-3xl tnum text-[#D4AF37]">
              {formatINR(recommendedSafeDaily)}
            </span>
          </div>
          <span className="text-[11px] text-[#94A3B8] mt-2 block">
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
              <span className="meta-label text-[#94A3B8]">Day Expense Blueprint</span>
              <h3 className="font-serif-display text-lg font-light">
                Planned Spends for {isCurrentDayToday ? 'Today' : isCurrentDayTomorrow ? 'Tomorrow' : format(selectedDate, 'd MMM')}
              </h3>
            </div>

            <button
              type="button"
              onClick={() => setIsAddingItem(true)}
              className="px-3.5 py-1.5 rounded-full bg-[#D4AF37] hover:bg-[#E5C358] text-[#08090C] text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Plus strokeWidth={2} className="w-3.5 h-3.5" />
              <span>Add Planned Spend</span>
            </button>
          </div>

          {currentPlan.items.length === 0 ? (
            <Card className="text-center py-12 flex flex-col items-center gap-3 border-dashed">
              <Calendar className="w-6 h-6 text-[#D4AF37]" />
              <div>
                <h4 className="font-serif-display text-base font-light">No expenses planned yet</h4>
                <p className="text-xs text-[#94A3B8] max-w-xs mt-1">
                  Plan tomorrow's chai, canteen snacks, or travel a day prior so your wallet is never surprised.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddingItem(true)}
                className="px-4 py-2 rounded-full border border-[#D4AF37]/40 text-[#D4AF37] hover:bg-[#D4AF37]/10 text-xs font-medium transition-colors"
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
                        ? 'border-[#10B981]/30 bg-[#10B981]/5'
                        : isSkipped
                        ? 'border-white/5 opacity-60 bg-inherit'
                        : 'hover:border-[#D4AF37]/40'
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
                            ? 'bg-[#10B981] border-[#10B981] text-[#08090C]'
                            : isSkipped
                            ? 'border-[#94A3B8] bg-transparent text-[#94A3B8]'
                            : 'border-white/20 hover:border-[#D4AF37]'
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
                              isSkipped ? 'line-through text-[#94A3B8]' : ''
                            }`}
                          >
                            {item.title}
                          </h4>
                          {item.isPrepaidMess && (
                            <span className="text-[10px] px-2 py-0.2 rounded-full bg-[#10B981]/15 text-[#10B981]">
                              Prepaid Mess
                            </span>
                          )}
                          {item.timeSlot && (
                            <span className="text-[10px] text-[#94A3B8]">
                              · {item.timeSlot}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-[11px] text-[#94A3B8] mt-0.5">
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: cat?.color || '#D4AF37' }}
                          />
                          <span>{cat?.name || 'General'}</span>
                          {isSpent && <span className="text-[#10B981]">· Logged to Ledger</span>}
                          {isSkipped && <span className="text-[#D4AF37]">· Skipped (Rupee Saved)</span>}
                        </div>
                      </div>
                    </div>

                    {/* Amount & Quick Actions */}
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span
                          className={`font-serif-display text-base tnum font-light ${
                            item.isPrepaidMess
                              ? 'text-[#10B981]'
                              : isSkipped
                              ? 'text-[#94A3B8]'
                              : 'text-[#D4AF37]'
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
                              className="p-1.5 rounded-xl border border-[#10B981]/40 text-[#10B981] hover:bg-[#10B981]/10 text-xs transition-colors"
                              title="Mark as Spent"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => markPlannedItemSkipped(selectedDateStr, item.id)}
                              className="p-1.5 rounded-xl border border-white/10 hover:border-[#D4AF37]/40 text-[#94A3B8] hover:text-[#D4AF37] text-xs transition-colors"
                              title="Skip & Save this expense"
                            >
                              <Shield className="w-4 h-4" />
                            </button>
                          </>
                        )}

                        <button
                          type="button"
                          onClick={() => deletePlannedItem(selectedDateStr, item.id)}
                          className="p-1.5 text-[#F43F5E] opacity-60 hover:opacity-100 rounded-lg transition-opacity"
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
              <span className="meta-label text-[#94A3B8]">Quick Hostel Presets</span>
              <span className="text-[11px] text-[#D4AF37]">1-Tap Add</span>
            </div>
            <p className="text-xs text-[#94A3B8]">
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
                      ? 'border-white/5 bg-[#181B26] hover:border-[#D4AF37]/40 hover:bg-[#D4AF37]/5'
                      : 'border-black/5 bg-[#F1F5F9] hover:border-[#D4AF37]/40 hover:bg-[#D4AF37]/5'
                  }`}
                >
                  <span className="truncate pr-2">{preset.title}</span>
                  <span className="font-serif-display tnum font-medium text-[#D4AF37] shrink-0">
                    {preset.amount === 0 ? '₹0' : formatINR(preset.amount)}
                  </span>
                </button>
              ))}
            </div>
          </Card>

          {/* Day Strategy / Food Notes Card */}
          <Card variant="surface" className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="meta-label text-[#94A3B8]">Strategy & Notes</span>
              <button
                type="button"
                onClick={openNotesEditor}
                className="text-xs text-[#D4AF37] flex items-center gap-1"
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
                className="text-xs text-[#94A3B8] cursor-pointer hover:text-inherit py-2"
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
            <span className="meta-label text-[#94A3B8] mb-1 block">Expense Title</span>
            <input
              type="text"
              placeholder="e.g. Evening tapri chai, Xerox, Canteen roll"
              value={itemTitle}
              onChange={(e) => setItemTitle(e.target.value)}
              className={`w-full px-3.5 py-2.5 rounded-2xl border text-sm outline-none ${
                isDark ? 'bg-[#181B26] border-white/10 text-white' : 'bg-[#F1F5F9] border-black/10 text-black'
              }`}
            />
          </div>

          <div>
            <span className="meta-label text-[#94A3B8] mb-1 block">Planned Amount (₹)</span>
            <input
              type="number"
              placeholder="Amount in ₹"
              disabled={isPrepaidMess}
              value={isPrepaidMess ? '0' : itemAmount}
              onChange={(e) => setItemAmount(e.target.value)}
              className={`w-full px-4 py-3 rounded-2xl border font-serif-display text-2xl tnum outline-none ${
                isPrepaidMess ? 'opacity-50' : ''
              } ${
                isDark ? 'bg-[#181B26] border-white/10 text-[#D4AF37]' : 'bg-[#F1F5F9] border-black/10 text-[#D4AF37]'
              }`}
            />
          </div>

          {/* Prepaid Mess Toggle */}
          <div
            onClick={() => setIsPrepaidMess(!isPrepaidMess)}
            className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition-colors ${
              isPrepaidMess ? 'border-[#10B981]/40 bg-[#10B981]/10' : 'border-inherit'
            }`}
          >
            <div className="flex items-center gap-2">
              <Utensils className="w-4 h-4 text-[#10B981]" />
              <div>
                <h5 className="text-xs font-medium">Prepaid Hostel Mess Meal</h5>
                <span className="text-[11px] text-[#94A3B8]">Costs ₹0 (Already prepaid)</span>
              </div>
            </div>

            <div
              className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                isPrepaidMess ? 'bg-[#10B981] border-[#10B981] text-[#08090C]' : 'border-white/20'
              }`}
            >
              {isPrepaidMess && <Check className="w-3.5 h-3.5 stroke-[3]" />}
            </div>
          </div>

          {/* Time Slot Picker */}
          <div>
            <span className="meta-label text-[#94A3B8] mb-1 block">Time Slot</span>
            <div className="grid grid-cols-4 gap-1.5">
              {(['Morning', 'Afternoon', 'Evening', 'Night'] as PlannedItem['timeSlot'][]).map((slot) => (
                <button
                  key={slot}
                  type="button"
                  onClick={() => setItemTimeSlot(slot)}
                  className={`py-2 text-xs rounded-xl border font-medium transition-all ${
                    itemTimeSlot === slot
                      ? 'border-[#D4AF37] bg-[#D4AF37]/15 text-[#D4AF37]'
                      : 'border-inherit text-[#94A3B8]'
                  }`}
                >
                  {slot}
                </button>
              ))}
            </div>
          </div>

          {/* Category Picker */}
          <div>
            <span className="meta-label text-[#94A3B8] mb-1 block">Category</span>
            <select
              value={itemCategory}
              onChange={(e) => setItemCategory(e.target.value)}
              className={`w-full px-3.5 py-2.5 rounded-2xl border text-xs outline-none ${
                isDark ? 'bg-[#181B26] border-white/10 text-white' : 'bg-[#F1F5F9] border-black/10 text-black'
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
            className="w-full py-3.5 rounded-2xl bg-[#D4AF37] hover:bg-[#E5C358] text-[#08090C] font-serif-display text-base font-semibold tracking-wide transition-colors disabled:opacity-50"
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
              isDark ? 'bg-[#181B26] border-white/10 text-white' : 'bg-[#F1F5F9] border-black/10 text-black'
            }`}
          />
          <button
            type="button"
            onClick={handleSaveNotes}
            className="w-full py-3 rounded-2xl bg-[#D4AF37] text-[#08090C] font-serif-display text-base font-semibold transition-colors"
          >
            Save Strategy Note
          </button>
        </div>
      </Sheet>
    </div>
  );
};

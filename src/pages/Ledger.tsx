import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Trash2,
  Edit2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
  ArrowDownLeft,
} from 'lucide-react';
import { Card } from '../components/Card';
import { Chip } from '../components/Chip';
import { Sheet } from '../components/Sheet';
import { EmptyState } from '../components/EmptyState';
import { useFinanceStore } from '../store/useFinanceStore';
import { formatINR, formatDayGrouping, formatDate } from '../lib/formatters';
import { useTheme } from '../hooks/useTheme';
import { Transaction, PaymentMode } from '../types/finance';
import {
  parseISO,
  format,
  subMonths,
  addMonths,
  startOfMonth,
  endOfMonth,
  isWithinInterval,
} from 'date-fns';

export const Ledger: React.FC = () => {
  const transactions = useFinanceStore((state) => state.transactions);
  const categories = useFinanceStore((state) => state.categories);
  const updateTransaction = useFinanceStore((state) => state.updateTransaction);
  const deleteTransaction = useFinanceStore((state) => state.deleteTransaction);
  const setQuickAddOpen = useFinanceStore((state) => state.setQuickAddOpen);
  const { isDark } = useTheme();

  // Current selected month view
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [selectedModeFilter, setSelectedModeFilter] = useState<string>('all');

  // Edit transaction state
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editNote, setEditNote] = useState('');
  const [editCategoryId, setEditCategoryId] = useState('');
  const [editMode, setEditMode] = useState<PaymentMode>('UPI');
  const [editDate, setEditDate] = useState('');

  // Navigate months
  const handlePrevMonth = () => setSelectedMonth((d) => subMonths(d, 1));
  const handleNextMonth = () => setSelectedMonth((d) => addMonths(d, 1));

  // Filtered transactions
  const monthStart = startOfMonth(selectedMonth);
  const monthEnd = endOfMonth(selectedMonth);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const txDate = parseISO(tx.date);
      if (!isWithinInterval(txDate, { start: monthStart, end: monthEnd })) {
        return false;
      }

      if (selectedCategoryFilter !== 'all' && tx.categoryId !== selectedCategoryFilter) {
        return false;
      }

      if (selectedModeFilter !== 'all' && tx.mode !== selectedModeFilter) {
        return false;
      }

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const noteMatch = (tx.note || '').toLowerCase().includes(query);
        const cat = categories.find((c) => c.id === tx.categoryId);
        const catMatch = (cat?.name || '').toLowerCase().includes(query);
        const amountMatch = tx.amount.toString().includes(query);
        if (!noteMatch && !catMatch && !amountMatch) return false;
      }

      return true;
    });
  }, [
    transactions,
    selectedMonth,
    selectedCategoryFilter,
    selectedModeFilter,
    searchQuery,
    categories,
    monthStart,
    monthEnd,
  ]);

  // Monthly summary metrics: Income, Spent, Saved
  const summary = useMemo(() => {
    let income = 0;
    let spent = 0;
    transactions.forEach((tx) => {
      const txDate = parseISO(tx.date);
      if (isWithinInterval(txDate, { start: monthStart, end: monthEnd })) {
        if (tx.type === 'income') income += tx.amount;
        else spent += tx.amount;
      }
    });
    const saved = Math.max(0, income - spent);
    return { income, spent, saved };
  }, [transactions, monthStart, monthEnd]);

  // Group transactions by day
  const groupedByDay = useMemo(() => {
    const groups: { dateStr: string; items: Transaction[]; dailyTotalExpense: number }[] = [];
    const map = new Map<string, Transaction[]>();

    filteredTransactions.forEach((tx) => {
      const dayKey = tx.date.slice(0, 10);
      const list = map.get(dayKey) || [];
      list.push(tx);
      map.set(dayKey, list);
    });

    const sortedDayKeys = Array.from(map.keys()).sort((a, b) => b.localeCompare(a));

    sortedDayKeys.forEach((key) => {
      const items = map.get(key) || [];
      const dailyTotalExpense = items
        .filter((t) => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
      groups.push({ dateStr: key, items, dailyTotalExpense });
    });

    return groups;
  }, [filteredTransactions]);

  const openEditModal = (tx: Transaction) => {
    setEditingTx(tx);
    setEditAmount(tx.amount.toString());
    setEditNote(tx.note || '');
    setEditCategoryId(tx.categoryId);
    setEditMode(tx.mode);
    setEditDate(tx.date.slice(0, 10));
  };

  const handleSaveEdit = () => {
    if (!editingTx) return;
    const amountVal = parseFloat(editAmount);
    if (isNaN(amountVal) || amountVal <= 0) return;

    updateTransaction(editingTx.id, {
      amount: amountVal,
      note: editNote.trim() || undefined,
      categoryId: editCategoryId,
      mode: editMode,
      date: editDate,
    });
    setEditingTx(null);
  };

  const handleDelete = (id: string) => {
    deleteTransaction(id);
    if (editingTx?.id === id) setEditingTx(null);
  };

  return (
    <div className="flex flex-col gap-5 pb-24">
      {/* Month Selector Header */}
      <div className="flex items-center justify-between pt-1">
        <button
          type="button"
          onClick={handlePrevMonth}
          className={`p-2 rounded-2xl border transition-colors ${
            isDark
              ? 'border-[rgba(255,255,255,0.07)] hover:bg-white/5 text-[#8A8A8F]'
              : 'border-[rgba(0,0,0,0.07)] hover:bg-black/5 text-[#75736E]'
          }`}
          aria-label="Previous Month"
        >
          <ChevronLeft strokeWidth={1.5} className="w-4 h-4" />
        </button>

        <div className="text-center">
          <h3 className="font-serif-display text-xl font-light tracking-wide">
            {format(selectedMonth, 'MMMM yyyy')}
          </h3>
        </div>

        <button
          type="button"
          onClick={handleNextMonth}
          className={`p-2 rounded-2xl border transition-colors ${
            isDark
              ? 'border-[rgba(255,255,255,0.07)] hover:bg-white/5 text-[#8A8A8F]'
              : 'border-[rgba(0,0,0,0.07)] hover:bg-black/5 text-[#75736E]'
          }`}
          aria-label="Next Month"
        >
          <ChevronRight strokeWidth={1.5} className="w-4 h-4" />
        </button>
      </div>

      {/* Summary Row: Income, Spent, Saved */}
      <Card variant="surface" className="grid grid-cols-3 gap-2 py-4 px-3 text-center">
        <div>
          <span className="meta-label text-[#8A8A8F] block mb-1">Income</span>
          <span className="font-serif-display text-base md:text-lg tnum text-[#7FA38A]">
            {formatINR(summary.income)}
          </span>
        </div>
        <div className="border-x border-inherit">
          <span className="meta-label text-[#8A8A8F] block mb-1">Spent</span>
          <span className="font-serif-display text-base md:text-lg tnum text-[#C9A96E]">
            {formatINR(summary.spent)}
          </span>
        </div>
        <div>
          <span className="meta-label text-[#8A8A8F] block mb-1">Saved</span>
          <span className="font-serif-display text-base md:text-lg tnum text-[#8A8A8F]">
            {formatINR(summary.saved)}
          </span>
        </div>
      </Card>

      {/* Search and Filters */}
      <div className="flex flex-col gap-2.5">
        <div
          className={`flex items-center gap-2 px-3.5 py-2.5 rounded-2xl border transition-colors ${
            isDark
              ? 'bg-[#131315] border-[rgba(255,255,255,0.07)] focus-within:border-[#C9A96E]'
              : 'bg-[#FFFFFF] border-[rgba(0,0,0,0.08)] focus-within:border-[#C9A96E]'
          }`}
        >
          <Search strokeWidth={1.5} className="w-4 h-4 text-[#8A8A8F] shrink-0" />
          <input
            type="text"
            placeholder="Search notes, categories, amounts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-xs outline-none"
          />
        </div>

        {/* Filter Chips */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          <Chip
            label="All Categories"
            selected={selectedCategoryFilter === 'all'}
            onClick={() => setSelectedCategoryFilter('all')}
            size="sm"
          />
          {categories.map((c) => (
            <Chip
              key={c.id}
              label={c.name}
              dotColor={c.color}
              selected={selectedCategoryFilter === c.id}
              onClick={() => setSelectedCategoryFilter(c.id)}
              size="sm"
            />
          ))}
        </div>

        {/* Payment mode filter chips */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {['all', 'UPI', 'Cash', 'Card'].map((mode) => (
            <Chip
              key={mode}
              label={mode === 'all' ? 'All Modes' : mode}
              selected={selectedModeFilter === mode}
              onClick={() => setSelectedModeFilter(mode)}
              size="sm"
            />
          ))}
        </div>
      </div>

      {/* Grouped Day list */}
      {groupedByDay.length === 0 ? (
        <EmptyState
          sentence="No ledger entries found for this period."
          actionText="Log first rupee"
          onAction={() => setQuickAddOpen(true)}
        />
      ) : (
        <div className="flex flex-col gap-4">
          {groupedByDay.map(({ dateStr, items, dailyTotalExpense }) => (
            <div key={dateStr} className="flex flex-col gap-1.5">
              {/* Day Header with Daily Total */}
              <div className="flex items-center justify-between px-2 text-xs">
                <span className="font-medium text-[#8A8A8F]">
                  {formatDayGrouping(dateStr)}
                </span>
                {dailyTotalExpense > 0 && (
                  <span className="tnum text-[#8A8A8F] text-[11px]">
                    Total: {formatINR(dailyTotalExpense)}
                  </span>
                )}
              </div>

              {/* Transactions in this Day */}
              <Card className="p-0 overflow-hidden divide-y divide-inherit">
                {items.map((tx) => {
                  const cat = categories.find((c) => c.id === tx.categoryId);
                  const isExpense = tx.type === 'expense';
                  return (
                    <div
                      key={tx.id}
                      onClick={() => openEditModal(tx)}
                      className={`p-3.5 flex items-center justify-between cursor-pointer transition-colors group ${
                        isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-black/[0.02]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                            isExpense
                              ? isDark
                                ? 'bg-[#1A1A1D] text-[#8A8A8F]'
                                : 'bg-[#EFECE6] text-[#75736E]'
                              : 'bg-[#7FA38A]/15 text-[#7FA38A]'
                          }`}
                        >
                          {isExpense ? (
                            <ArrowUpRight strokeWidth={1.5} className="w-3.5 h-3.5" />
                          ) : (
                            <ArrowDownLeft strokeWidth={1.5} className="w-3.5 h-3.5" />
                          )}
                        </div>

                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-medium tracking-tight">
                              {tx.note || cat?.name || 'Entry'}
                            </span>
                            {tx.isRoundUp && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#C9A96E]/15 text-[#C9A96E]">
                                +₹{tx.roundUpAmount} round-up
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-[#8A8A8F]">
                            <span>{cat?.name}</span>
                            <span>·</span>
                            <span>{tx.mode}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span
                          className={`font-serif-display text-base tnum font-light ${
                            isExpense
                              ? isDark
                                ? 'text-[#F4F2EE]'
                                : 'text-[#111111]'
                              : 'text-[#7FA38A]'
                          }`}
                        >
                          {isExpense ? `-${formatINR(tx.amount)}` : `+${formatINR(tx.amount)}`}
                        </span>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(tx.id);
                          }}
                          className="opacity-0 group-hover:opacity-60 hover:!opacity-100 p-1.5 text-[#C77D6B] rounded-full transition-opacity"
                          title="Delete entry"
                        >
                          <Trash2 strokeWidth={1.5} className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </Card>
            </div>
          ))}
        </div>
      )}

      {/* Edit Entry Bottom Sheet */}
      <Sheet
        isOpen={!!editingTx}
        onClose={() => setEditingTx(null)}
        title="Edit Entry"
        subtitle="Update amount, note, or category"
      >
        {editingTx && (
          <div className="flex flex-col gap-4 pb-4">
            <div>
              <span className="meta-label text-[#8A8A8F] mb-1 block">Amount</span>
              <input
                type="number"
                value={editAmount}
                onChange={(e) => setEditAmount(e.target.value)}
                className={`w-full px-4 py-3 rounded-2xl border font-serif-display text-2xl tnum outline-none ${
                  isDark
                    ? 'bg-[#181B26] border-[rgba(255,255,255,0.08)] text-[#D4AF37]'
                    : 'bg-[#F1F5F9] border-[rgba(15,23,42,0.08)] text-[#D4AF37]'
                }`}
              />
            </div>

            <div>
              <span className="meta-label text-[#8A8A8F] mb-1 block">Note</span>
              <input
                type="text"
                value={editNote}
                onChange={(e) => setEditNote(e.target.value)}
                placeholder="Description"
                className={`w-full px-3.5 py-2.5 rounded-2xl border text-sm outline-none ${
                  isDark
                    ? 'bg-[#1A1A1D] border-[rgba(255,255,255,0.08)] text-[#F4F2EE]'
                    : 'bg-[#EFECE6] border-[rgba(0,0,0,0.08)] text-[#111111]'
                }`}
              />
            </div>

            <div>
              <span className="meta-label text-[#8A8A8F] mb-1 block">Category</span>
              <select
                value={editCategoryId}
                onChange={(e) => setEditCategoryId(e.target.value)}
                className={`w-full px-3.5 py-2.5 rounded-2xl border text-sm outline-none ${
                  isDark
                    ? 'bg-[#1A1A1D] border-[rgba(255,255,255,0.08)] text-[#F4F2EE]'
                    : 'bg-[#EFECE6] border-[rgba(0,0,0,0.08)] text-[#111111]'
                }`}
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="meta-label text-[#8A8A8F] mb-1 block">Mode</span>
                <select
                  value={editMode}
                  onChange={(e) => setEditMode(e.target.value as PaymentMode)}
                  className={`w-full px-3 py-2 rounded-2xl border text-xs outline-none ${
                    isDark
                      ? 'bg-[#1A1A1D] border-[rgba(255,255,255,0.08)] text-[#F4F2EE]'
                      : 'bg-[#EFECE6] border-[rgba(0,0,0,0.08)] text-[#111111]'
                  }`}
                >
                  <option value="UPI">UPI</option>
                  <option value="Cash">Cash</option>
                  <option value="Card">Card</option>
                </select>
              </div>

              <div>
                <span className="meta-label text-[#8A8A8F] mb-1 block">Date</span>
                <input
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  className={`w-full px-3 py-2 rounded-2xl border text-xs outline-none ${
                    isDark
                      ? 'bg-[#1A1A1D] border-[rgba(255,255,255,0.08)] text-[#F4F2EE]'
                      : 'bg-[#EFECE6] border-[rgba(0,0,0,0.08)] text-[#111111]'
                  }`}
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => handleDelete(editingTx.id)}
                className="px-4 py-3 rounded-2xl border border-[#C77D6B]/40 text-[#C77D6B] hover:bg-[#C77D6B]/10 text-xs font-medium flex items-center gap-1.5 transition-colors"
              >
                <Trash2 strokeWidth={1.5} className="w-4 h-4" />
                <span>Delete</span>
              </button>

              <button
                type="button"
                onClick={handleSaveEdit}
                className="flex-1 py-3 rounded-2xl bg-[#C9A96E] hover:bg-[#D7BC88] text-[#0B0B0C] font-serif-display text-base tracking-wide font-medium transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        )}
      </Sheet>
    </div>
  );
};

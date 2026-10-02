import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sheet } from './Sheet';
import { Keypad } from './Keypad';
import { Chip } from './Chip';
import { useFinanceStore } from '../store/useFinanceStore';
import { formatINR } from '../lib/formatters';
import { PaymentMode, TransactionType } from '../types/finance';
import { useTheme } from '../hooks/useTheme';
import { Check, Sparkles, Calendar, CreditCard } from 'lucide-react';

export const QuickAddModal: React.FC = () => {
  const isOpen = useFinanceStore((state) => state.isQuickAddOpen);
  const setOpen = useFinanceStore((state) => state.setQuickAddOpen);
  const categories = useFinanceStore((state) => state.categories);
  const addTransaction = useFinanceStore((state) => state.addTransaction);
  const { isDark } = useTheme();

  const [amountStr, setAmountStr] = useState('0');
  const [txType, setTxType] = useState<TransactionType>('expense');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(
    categories[0]?.id || 'cat-outside-food'
  );
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('UPI');
  const [note, setNote] = useState('');
  const [dateStr, setDateStr] = useState(new Date().toISOString().slice(0, 10));
  const [showDetails, setShowDetails] = useState(false);
  const [feedbackNudge, setFeedbackNudge] = useState<string | null>(null);
  const [justSaved, setJustSaved] = useState(false);

  const amount = parseFloat(amountStr) || 0;

  const handleSave = () => {
    if (amount <= 0) return;

    // Haptic feedback if supported
    if (typeof window !== 'undefined' && 'navigator' in window && 'vibrate' in navigator) {
      navigator.vibrate([15, 30, 15]);
    }

    const result = addTransaction({
      type: txType,
      amount,
      categoryId: selectedCategoryId,
      mode: paymentMode,
      note: note.trim() || undefined,
      date: dateStr,
    });

    setJustSaved(true);

    if (result.outsideFoodNudge) {
      setFeedbackNudge(result.outsideFoodNudge);
    } else if (result.roundUpSaved && result.roundUpSaved > 0) {
      setFeedbackNudge(`₹${result.roundUpSaved} round-up auto-added to your goal.`);
    }

    // Auto close after brief gentle feedback
    setTimeout(() => {
      setJustSaved(false);
      setFeedbackNudge(null);
      setAmountStr('0');
      setNote('');
      setShowDetails(false);
      setOpen(false);
    }, 1200);
  };

  const handleClose = () => {
    setOpen(false);
    setAmountStr('0');
    setNote('');
    setShowDetails(false);
    setFeedbackNudge(null);
    setJustSaved(false);
  };

  return (
    <Sheet
      isOpen={isOpen}
      onClose={handleClose}
      title={txType === 'expense' ? 'Log Expense' : 'Log Income'}
      subtitle="Under 5 seconds quick entry"
    >
      <div className="flex flex-col gap-4 pb-4">
        {/* Income / Expense Toggle */}
        <div className="flex justify-center mb-1">
          <div
            className={`p-1 rounded-full border flex items-center gap-1 ${
              isDark
                ? 'bg-[#181B26] border-[rgba(255,255,255,0.08)]'
                : 'bg-[#F1F5F9] border-[rgba(15,23,42,0.08)]'
            }`}
          >
            <button
              type="button"
              onClick={() => setTxType('expense')}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                txType === 'expense'
                  ? 'bg-[#08090C] text-[#F8FAFC] shadow-sm'
                  : 'text-[#94A3B8]'
              }`}
            >
              Expense
            </button>
            <button
              type="button"
              onClick={() => setTxType('income')}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                txType === 'income'
                  ? 'bg-[#10B981] text-[#08090C] font-semibold shadow-sm'
                  : 'text-[#94A3B8]'
              }`}
            >
              Income
            </button>
          </div>
        </div>

        {/* Big Amount Display */}
        <div className="flex flex-col items-center justify-center py-2">
          <motion.div
            key={amountStr}
            initial={{ scale: 0.98 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.1 }}
            className="font-serif-display text-5xl md:text-6xl font-light tnum tracking-tight"
          >
            <span className={txType === 'income' ? 'text-[#10B981]' : 'text-[#D4AF37]'}>
              {formatINR(amount, { showSymbol: true })}
            </span>
          </motion.div>
        </div>

        {/* Nudge / Feedback Banner */}
        <AnimatePresence>
          {(feedbackNudge || justSaved) && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mx-auto text-center px-4 py-1.5 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-xs text-[#D4AF37] flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{feedbackNudge || 'Logged successfully'}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Category Chips Horizontal Scroll (One tap) */}
        {txType === 'expense' && (
          <div className="flex flex-col gap-1.5">
            <span className="meta-label text-[#94A3B8]">Category</span>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none -mx-2 px-2">
              {categories.map((cat) => (
                <Chip
                  key={cat.id}
                  label={cat.name}
                  dotColor={cat.color}
                  selected={selectedCategoryId === cat.id}
                  onClick={() => setSelectedCategoryId(cat.id)}
                  size="sm"
                />
              ))}
            </div>
          </div>
        )}

        {/* Big Numeric Keypad */}
        <div className="py-1">
          <Keypad value={amountStr} onChange={setAmountStr} />
        </div>

        {/* Optional note, date, payment mode expander */}
        <div>
          <button
            type="button"
            onClick={() => setShowDetails(!showDetails)}
            className={`text-xs ${
              isDark ? 'text-[#94A3B8] hover:text-[#F8FAFC]' : 'text-[#64748B] hover:text-[#0F172A]'
            } flex items-center gap-1 py-1`}
          >
            <span>{showDetails ? 'Hide extra details' : '+ Note, mode, or date'}</span>
          </button>

          {showDetails && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="flex flex-col gap-3 pt-3"
            >
              {/* Note input */}
              <input
                type="text"
                placeholder="Optional note (e.g. Chai, Tapri, Zomato)"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className={`w-full px-3.5 py-2.5 rounded-2xl border text-sm outline-none transition-colors ${
                  isDark
                    ? 'bg-[#181B26] border-[rgba(255,255,255,0.08)] text-[#F8FAFC] focus:border-[#D4AF37]'
                    : 'bg-[#F1F5F9] border-[rgba(15,23,42,0.08)] text-[#0F172A] focus:border-[#D4AF37]'
                }`}
              />

              {/* Mode and Date row */}
              <div className="grid grid-cols-2 gap-2">
                {/* Payment Mode */}
                <div className="flex items-center gap-1 p-1 rounded-2xl border border-inherit">
                  {(['UPI', 'Cash', 'Card'] as PaymentMode[]).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setPaymentMode(mode)}
                      className={`flex-1 py-1.5 text-xs rounded-xl font-medium transition-all ${
                        paymentMode === mode
                          ? 'bg-[#D4AF37] text-[#08090C]'
                          : 'text-[#94A3B8]'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>

                {/* Date input */}
                <input
                  type="date"
                  value={dateStr}
                  onChange={(e) => setDateStr(e.target.value)}
                  className={`px-3 py-1.5 rounded-2xl border text-xs outline-none ${
                    isDark
                      ? 'bg-[#181B26] border-[rgba(255,255,255,0.08)] text-[#F8FAFC]'
                      : 'bg-[#F1F5F9] border-[rgba(15,23,42,0.08)] text-[#0F172A]'
                  }`}
                />
              </div>
            </motion.div>
          )}
        </div>

        {/* Save Button */}
        <button
          type="button"
          onClick={handleSave}
          disabled={amount <= 0 || justSaved}
          className={`w-full py-4 rounded-2xl font-serif-display text-lg tracking-wide flex items-center justify-center gap-2 transition-all duration-150 active:scale-[0.98] ${
            amount > 0
              ? 'bg-[#D4AF37] text-[#08090C] shadow-md hover:bg-[#E5C358]'
              : 'bg-white/10 text-[#94A3B8] cursor-not-allowed'
          }`}
        >
          {justSaved ? (
            <>
              <Check className="w-5 h-5" />
              <span>Saved</span>
            </>
          ) : (
            <span>Save Rupee Entry</span>
          )}
        </button>
      </div>
    </Sheet>
  );
};

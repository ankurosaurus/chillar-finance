import React, { useState } from 'react';
import {
  Download,
  Upload,
  RotateCcw,
  Shield,
  Key,
  Check,
  Moon,
  Sun,
  FileSpreadsheet,
  Trash2,
  Plus,
  Sparkles,
} from 'lucide-react';
import { Card } from '../components/Card';
import { Sheet } from '../components/Sheet';
import { useFinanceStore } from '../store/useFinanceStore';
import { formatINR } from '../lib/formatters';
import { useTheme } from '../hooks/useTheme';
import { FixedCost } from '../types/finance';

export const Settings: React.FC = () => {
  const profile = useFinanceStore((state) => state.profile);
  const setProfile = useFinanceStore((state) => state.setProfile);
  const setPin = useFinanceStore((state) => state.setPin);
  const removePin = useFinanceStore((state) => state.removePin);
  const loadDemoData = useFinanceStore((state) => state.loadDemoData);
  const resetAllData = useFinanceStore((state) => state.resetAllData);
  const exportJSON = useFinanceStore((state) => state.exportJSON);
  const importJSON = useFinanceStore((state) => state.importJSON);
  const exportCSV = useFinanceStore((state) => state.exportCSV);
  const { isDark, toggleTheme } = useTheme();

  // Income & allowance edit state
  const [monthlyIncome, setMonthlyIncome] = useState(profile.monthlyIncome.toString());
  const [extraIncome, setExtraIncome] = useState((profile.extraIncome || 0).toString());
  const [savingsRate, setSavingsRate] = useState(profile.savingsRatePct.toString());
  const [payDay, setPayDay] = useState(profile.payDay.toString());

  // Fixed Costs edit state
  const [fixedCosts, setFixedCosts] = useState<FixedCost[]>(profile.fixedCosts || []);
  const [newFcName, setNewFcName] = useState('');
  const [newFcAmount, setNewFcAmount] = useState('');
  const [newFcPrepaid, setNewFcPrepaid] = useState(false);

  // PIN settings state
  const [pinInput, setPinInput] = useState('');
  const [showPinModal, setShowPinModal] = useState(false);

  // Export / Import feedback
  const [notification, setNotification] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleSaveBudgetProfile = () => {
    setProfile({
      monthlyIncome: parseFloat(monthlyIncome) || 0,
      extraIncome: parseFloat(extraIncome) || 0,
      savingsRatePct: parseInt(savingsRate, 10) || 20,
      payDay: parseInt(payDay, 10) || 1,
      fixedCosts,
    });
    showToast('Profile configuration updated.');
  };

  const handleAddFixedCost = () => {
    if (!newFcName.trim()) return;
    const amountNum = parseFloat(newFcAmount) || 0;
    const updated = [
      ...fixedCosts,
      {
        id: `fc-${Date.now()}`,
        name: newFcName.trim(),
        amount: amountNum,
        isPrepaidMess: newFcPrepaid,
      },
    ];
    setFixedCosts(updated);
    setProfile({ fixedCosts: updated });
    setNewFcName('');
    setNewFcAmount('');
    setNewFcPrepaid(false);
  };

  const handleRemoveFixedCost = (id: string) => {
    const updated = fixedCosts.filter((f) => f.id !== id);
    setFixedCosts(updated);
    setProfile({ fixedCosts: updated });
  };

  const handleSavePin = () => {
    if (pinInput.length === 4) {
      setPin(pinInput);
      setShowPinModal(false);
      setPinInput('');
      showToast('4-digit PIN passcode activated.');
    }
  };

  const handleExportJSON = () => {
    const dataStr = exportJSON();
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `chillar-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    showToast('Data exported to JSON file.');
  };

  const handleExportCSV = () => {
    const csvStr = exportCSV();
    const blob = new Blob([csvStr], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `chillar-ledger-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    showToast('Ledger exported to CSV.');
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = importJSON(content);
      if (success) {
        showToast('Backup restored successfully!');
      } else {
        alert('Invalid JSON backup file.');
      }
    };
    reader.readAsText(file);
  };

  const handleResetData = () => {
    if (window.confirm('Are you sure you want to erase all transactions and reset data?')) {
      resetAllData();
      showToast('All local data cleared.');
    }
  };

  return (
    <div className="flex flex-col gap-6 pb-28">
      {/* Title */}
      <div className="pt-1">
        <h2 className="font-serif-display text-2xl font-light">Preferences & Setup</h2>
        <span className="text-xs text-[#8A8A8F]">
          Income, fixed costs, security & backups
        </span>
      </div>

      {notification && (
        <div className="p-3 rounded-2xl bg-[#C9A96E]/15 border border-[#C9A96E]/30 text-xs text-[#C9A96E] text-center font-medium">
          {notification}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Monthly Allowance & Income Card */}
        <Card variant="surface" className="flex flex-col gap-4">
          <span className="meta-label text-[#94A3B8]">Monthly Allowance & Inflows</span>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-[#94A3B8] mb-1 block">Pocket Money (₹)</label>
              <input
                type="number"
                value={monthlyIncome}
                onChange={(e) => setMonthlyIncome(e.target.value)}
                className={`w-full px-3.5 py-2 rounded-xl border text-sm font-serif-display tnum outline-none ${
                  isDark ? 'bg-[#181B26] border-white/10' : 'bg-[#F1F5F9] border-black/10'
                }`}
              />
            </div>

            <div>
              <label className="text-[11px] text-[#94A3B8] mb-1 block">Extra Income (₹)</label>
              <input
                type="number"
                value={extraIncome}
                onChange={(e) => setExtraIncome(e.target.value)}
                placeholder="e.g. 1500"
                className={`w-full px-3.5 py-2 rounded-xl border text-sm font-serif-display tnum outline-none ${
                  isDark ? 'bg-[#181B26] border-white/10' : 'bg-[#F1F5F9] border-black/10'
                }`}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-[#94A3B8] mb-1 block">Savings Target (%)</label>
              <input
                type="number"
                value={savingsRate}
                min={0}
                max={100}
                onChange={(e) => setSavingsRate(e.target.value)}
                className={`w-full px-3.5 py-2 rounded-xl border text-sm font-serif-display tnum outline-none ${
                  isDark ? 'bg-[#181B26] border-white/10' : 'bg-[#F1F5F9] border-black/10'
                }`}
              />
            </div>

            <div>
              <label className="text-[11px] text-[#94A3B8] mb-1 block">Pocket Money Day</label>
              <input
                type="number"
                value={payDay}
                min={1}
                max={31}
                onChange={(e) => setPayDay(e.target.value)}
                className={`w-full px-3.5 py-2 rounded-xl border text-sm font-serif-display tnum outline-none ${
                  isDark ? 'bg-[#181B26] border-white/10' : 'bg-[#F1F5F9] border-black/10'
                }`}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={handleSaveBudgetProfile}
            className="py-2.5 rounded-xl bg-[#D4AF37] text-[#08090C] text-xs font-semibold hover:bg-[#E5C358] transition-colors"
          >
            Update Inflow Settings
          </button>
        </Card>

        {/* Security & PIN Lock Card */}
        <Card variant="surface" className="flex flex-col justify-between gap-3">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield strokeWidth={1.5} className="w-4 h-4 text-[#D4AF37]" />
                <h4 className="text-xs font-medium">4-Digit PIN Passcode</h4>
              </div>
              {profile.pinEnabled ? (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#10B981]/15 text-[#10B981]">
                  Active
                </span>
              ) : (
                <span className="text-[10px] text-[#94A3B8]">Disabled</span>
              )}
            </div>

            <p className="text-xs text-[#94A3B8] leading-relaxed">
              Lock Chillar with a private 4-digit PIN. Passcode is salted and stored locally on your device.
            </p>
          </div>

          <div className="flex gap-2 pt-1">
            {profile.pinEnabled ? (
              <button
                type="button"
                onClick={removePin}
                className="px-4 py-2 rounded-xl border border-[#F43F5E]/40 text-[#F43F5E] hover:bg-[#F43F5E]/10 text-xs font-medium transition-colors"
              >
                Disable Passcode
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setShowPinModal(true)}
                className="px-4 py-2 rounded-xl bg-[#D4AF37] text-[#08090C] text-xs font-semibold hover:bg-[#E5C358] transition-colors"
              >
                Set 4-Digit Passcode
              </button>
            )}
          </div>
        </Card>

        {/* Fixed Costs & Mess Card */}
        <Card variant="surface" className="flex flex-col gap-3 md:col-span-2">
          <div className="flex items-center justify-between">
            <span className="meta-label text-[#94A3B8]">Fixed Recurring Costs</span>
            <span className="text-[11px] text-[#94A3B8]">
              Prepaid mess is excluded from deduction
            </span>
          </div>

          {/* Existing Fixed Costs List */}
          <div className="divide-y divide-inherit">
            {fixedCosts.map((fc) => (
              <div key={fc.id} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <span className="font-medium">{fc.name}</span>
                  {fc.isPrepaidMess && (
                    <span className="ml-2 text-[10px] px-2 py-0.5 rounded-full bg-[#10B981]/15 text-[#10B981]">
                      Prepaid Mess (No monthly deduction)
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-serif-display tnum">
                    {formatINR(fc.amount)}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveFixedCost(fc.id)}
                    className="p-1 text-[#F43F5E] hover:opacity-100 opacity-60"
                    aria-label="Remove"
                  >
                    <Trash2 strokeWidth={1.5} className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Add Fixed Cost Row */}
          <div className="pt-2 border-t border-inherit flex flex-col gap-2">
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Name (e.g. WiFi, Laundry)"
                value={newFcName}
                onChange={(e) => setNewFcName(e.target.value)}
                className={`px-3 py-2 rounded-xl border text-xs outline-none ${
                  isDark ? 'bg-[#181B26] border-white/10' : 'bg-[#F1F5F9] border-black/10'
                }`}
              />
              <input
                type="number"
                placeholder="Amount (₹)"
                value={newFcAmount}
                onChange={(e) => setNewFcAmount(e.target.value)}
                className={`px-3 py-2 rounded-xl border text-xs outline-none ${
                  isDark ? 'bg-[#181B26] border-white/10' : 'bg-[#F1F5F9] border-black/10'
                }`}
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-1.5 text-xs text-[#94A3B8] cursor-pointer">
                <input
                  type="checkbox"
                  checked={newFcPrepaid}
                  onChange={(e) => setNewFcPrepaid(e.target.checked)}
                  className="rounded accent-[#D4AF37]"
                />
                <span>Mark as Prepaid Mess</span>
              </label>

              <button
                type="button"
                onClick={handleAddFixedCost}
                disabled={!newFcName.trim()}
                className="px-3.5 py-1.5 rounded-xl border border-[#D4AF37]/40 text-[#D4AF37] hover:bg-[#D4AF37]/10 text-xs font-medium disabled:opacity-40"
              >
                Add Item
              </button>
            </div>
          </div>
        </Card>

        {/* Appearance Card */}
        <Card variant="surface" className="flex items-center justify-between">
          <div>
            <h4 className="text-xs font-medium">Appearance & Palette</h4>
            <span className="text-xs text-[#94A3B8]">
              Deep Obsidian & Metallic Gold
            </span>
          </div>

          <button
            type="button"
            onClick={toggleTheme}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-inherit text-xs"
          >
            {isDark ? (
              <>
                <Sun strokeWidth={1.5} className="w-4 h-4 text-[#D4AF37]" />
                <span>Light Mode</span>
              </>
            ) : (
              <>
                <Moon strokeWidth={1.5} className="w-4 h-4 text-[#64748B]" />
                <span>Dark Mode</span>
              </>
            )}
          </button>
        </Card>

        {/* Danger Zone: Reset Data */}
        <Card variant="surface" className="border-[#F43F5E]/30 flex items-center justify-between">
          <div>
            <h4 className="text-xs font-medium text-[#F43F5E]">Clear App Ledger</h4>
            <span className="text-[11px] text-[#94A3B8]">
              Reset all saved transactions to zero
            </span>
          </div>

          <button
            type="button"
            onClick={handleResetData}
            className="px-3.5 py-2 rounded-xl border border-[#F43F5E]/40 text-[#F43F5E] hover:bg-[#F43F5E]/10 text-xs transition-colors"
          >
            Reset All
          </button>
        </Card>

        {/* Data Management: Export & Import */}
        <Card variant="surface" className="flex flex-col gap-3 md:col-span-2">
          <span className="meta-label text-[#94A3B8]">Data Portability & Backups</span>
          <p className="text-xs text-[#94A3B8]">
            Your private data stays entirely on your device in browser localStorage.
          </p>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={handleExportCSV}
              className="p-3 rounded-xl border border-inherit hover:border-[#D4AF37]/40 text-xs flex items-center justify-center gap-2 transition-colors"
            >
              <FileSpreadsheet strokeWidth={1.5} className="w-4 h-4 text-[#10B981]" />
              <span>Export CSV</span>
            </button>

            <button
              type="button"
              onClick={handleExportJSON}
              className="p-3 rounded-xl border border-inherit hover:border-[#D4AF37]/40 text-xs flex items-center justify-center gap-2 transition-colors"
            >
              <Download strokeWidth={1.5} className="w-4 h-4 text-[#D4AF37]" />
              <span>Export JSON</span>
            </button>
          </div>

          <div className="pt-2 flex items-center justify-between">
            <label className="px-3 py-2 rounded-xl border border-inherit hover:border-[#D4AF37]/40 text-xs flex items-center gap-2 cursor-pointer transition-colors">
              <Upload strokeWidth={1.5} className="w-4 h-4 text-[#94A3B8]" />
              <span>Restore JSON Backup</span>
              <input
                type="file"
                accept=".json"
                onChange={handleImportFile}
                className="hidden"
              />
            </label>

            <button
              type="button"
              onClick={loadDemoData}
              className="px-3 py-2 rounded-xl text-xs text-[#D4AF37] hover:bg-[#D4AF37]/10 transition-colors flex items-center gap-1"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Sample Data (Optional)</span>
            </button>
          </div>
        </Card>
      </div>

      {/* PIN Setup Sheet */}
      <Sheet
        isOpen={showPinModal}
        onClose={() => setShowPinModal(false)}
        title="Setup Passcode"
        subtitle="Enter 4-digit PIN for private access"
      >
        <div className="flex flex-col items-center gap-4 py-4">
          <input
            type="password"
            maxLength={4}
            value={pinInput}
            onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
            placeholder="••••"
            className={`w-36 text-center tracking-[1em] px-4 py-3 rounded-2xl border font-serif-display text-2xl outline-none ${
              isDark ? 'bg-[#1A1A1D] border-white/10' : 'bg-[#EFECE6] border-black/10'
            }`}
          />
          <button
            type="button"
            onClick={handleSavePin}
            disabled={pinInput.length !== 4}
            className="w-full py-3 rounded-2xl bg-[#C9A96E] text-[#0B0B0C] font-serif-display text-base font-medium disabled:opacity-50"
          >
            Set PIN
          </button>
        </div>
      </Sheet>
    </div>
  );
};

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
  FileText,
  Smartphone,
  ExternalLink,
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
import { generateMonthlyReportPDF } from '../lib/pdfReport';

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
  const transactions = useFinanceStore((state) => state.transactions);
  const categories = useFinanceStore((state) => state.categories);
  const goals = useFinanceStore((state) => state.goals);
  const dayPlans = useFinanceStore((state) => state.dayPlans);
  const currentUser = useFinanceStore((state) => state.currentUser);
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

  const handleExportPDF = () => {
    generateMonthlyReportPDF({
      monthDate: new Date(),
      profile,
      transactions,
      categories,
      goals,
      dayPlans,
      username: currentUser?.fullName || currentUser?.username || 'Hostel Student',
    });
    showToast('Monthly financial statement PDF generated & downloaded.');
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
        <span className="text-xs text-slate-400">
          Income, fixed costs, security, Android APK & monthly reports
        </span>
      </div>

      {notification && (
        <div className="p-3 rounded-2xl bg-blue-600/15 border border-blue-500/30 text-xs text-blue-400 text-center font-medium">
          {notification}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Monthly Allowance & Income Card */}
        <Card variant="surface" className="flex flex-col gap-4">
          <span className="meta-label text-slate-400">Monthly Allowance & Inflows</span>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-slate-400 mb-1 block">Pocket Money (₹)</label>
              <input
                type="number"
                value={monthlyIncome}
                onChange={(e) => setMonthlyIncome(e.target.value)}
                className={`w-full px-3.5 py-2 rounded-xl border text-sm font-serif-display tnum outline-none ${
                  isDark ? 'bg-[#0B0F19] border-white/10 text-white' : 'bg-slate-100 border-slate-200 text-slate-900'
                }`}
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-400 mb-1 block">Extra Income (₹)</label>
              <input
                type="number"
                value={extraIncome}
                onChange={(e) => setExtraIncome(e.target.value)}
                placeholder="e.g. 1500"
                className={`w-full px-3.5 py-2 rounded-xl border text-sm font-serif-display tnum outline-none ${
                  isDark ? 'bg-[#0B0F19] border-white/10 text-white' : 'bg-slate-100 border-slate-200 text-slate-900'
                }`}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-slate-400 mb-1 block">Savings Target (%)</label>
              <input
                type="number"
                value={savingsRate}
                min={0}
                max={100}
                onChange={(e) => setSavingsRate(e.target.value)}
                className={`w-full px-3.5 py-2 rounded-xl border text-sm font-serif-display tnum outline-none ${
                  isDark ? 'bg-[#0B0F19] border-white/10 text-white' : 'bg-slate-100 border-slate-200 text-slate-900'
                }`}
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-400 mb-1 block">Pocket Money Day</label>
              <input
                type="number"
                value={payDay}
                min={1}
                max={31}
                onChange={(e) => setPayDay(e.target.value)}
                className={`w-full px-3.5 py-2 rounded-xl border text-sm font-serif-display tnum outline-none ${
                  isDark ? 'bg-[#0B0F19] border-white/10 text-white' : 'bg-slate-100 border-slate-200 text-slate-900'
                }`}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={handleSaveBudgetProfile}
            className="py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-600/20 transition-all"
          >
            Update Inflow Settings
          </button>
        </Card>

        {/* Security & PIN Lock Card */}
        <Card variant="surface" className="flex flex-col justify-between gap-3">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield strokeWidth={1.5} className="w-4 h-4 text-blue-400" />
                <h4 className="text-xs font-medium">4-Digit PIN Passcode</h4>
              </div>
              {profile.pinEnabled ? (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400">
                  Active
                </span>
              ) : (
                <span className="text-[10px] text-slate-400">Disabled</span>
              )}
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Lock Chillar with a private 4-digit PIN. Passcode is salted and stored locally on your device.
            </p>
          </div>

          <div className="flex gap-2 pt-1">
            {profile.pinEnabled ? (
              <button
                type="button"
                onClick={removePin}
                className="px-4 py-2 rounded-xl border border-rose-500/40 text-rose-400 hover:bg-rose-500/10 text-xs font-medium transition-colors"
              >
                Disable Passcode
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setShowPinModal(true)}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-600/20 transition-all"
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
                  isDark ? 'bg-[#0B0F19] border-white/10' : 'bg-[#F1F5F9] border-black/10'
                }`}
              />
              <input
                type="number"
                placeholder="Amount (₹)"
                value={newFcAmount}
                onChange={(e) => setNewFcAmount(e.target.value)}
                className={`px-3 py-2 rounded-xl border text-xs outline-none ${
                  isDark ? 'bg-[#0B0F19] border-white/10' : 'bg-[#F1F5F9] border-black/10'
                }`}
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-1.5 text-xs text-[#94A3B8] cursor-pointer">
                <input
                  type="checkbox"
                  checked={newFcPrepaid}
                  onChange={(e) => setNewFcPrepaid(e.target.checked)}
                  className="rounded accent-blue-600"
                />
                <span>Mark as Prepaid Mess</span>
              </label>

              <button
                type="button"
                onClick={handleAddFixedCost}
                disabled={!newFcName.trim()}
                className="px-3.5 py-1.5 rounded-xl border border-blue-500/40 text-blue-400 hover:bg-blue-500/10 text-xs font-medium disabled:opacity-40"
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
            <span className="text-xs text-slate-400">
              Obsidian Black, Crisp White & Electric Blue
            </span>
          </div>

          <button
            type="button"
            onClick={toggleTheme}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-inherit text-xs"
          >
            {isDark ? (
              <>
                <Sun strokeWidth={1.5} className="w-4 h-4 text-blue-400" />
                <span>Light Mode</span>
              </>
            ) : (
              <>
                <Moon strokeWidth={1.5} className="w-4 h-4 text-slate-600" />
                <span>Dark Mode</span>
              </>
            )}
          </button>
        </Card>

        {/* Danger Zone: Reset Data */}
        <Card variant="surface" className="border-rose-500/30 flex items-center justify-between">
          <div>
            <h4 className="text-xs font-medium text-rose-400">Clear App Ledger</h4>
            <span className="text-[11px] text-slate-400">
              Reset all saved transactions to zero
            </span>
          </div>

          <button
            type="button"
            onClick={handleResetData}
            className="px-3.5 py-2 rounded-xl border border-rose-500/40 text-rose-400 hover:bg-rose-500/10 text-xs transition-colors"
          >
            Reset All
          </button>
        </Card>

        {/* Android APK Download Card */}
        <Card variant="surface" className="flex flex-col gap-3.5 md:col-span-2 border-blue-500/40 bg-gradient-to-br from-blue-950/20 via-transparent to-blue-900/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-md shadow-blue-500/10">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Chillar Android APK</h4>
                <p className="text-xs text-slate-400">Standalone native Android application (.apk)</p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-400 text-[10px] font-semibold tracking-wider uppercase">
              Production APK
            </span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Download and install the native Chillar Android app directly on your smartphone. Features username/password login, offline-first budgeting, instant day planning, and hostel dining leak tracking without requiring continuous internet.
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-1">
            <a
              href="https://github.com/ankurosaurus/chillar-finance/releases/download/v1.0.0/chillar-latest.apk"
              target="_blank"
              rel="noreferrer"
              className="flex-1 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Download Android APK (Direct Link)</span>
            </a>
            <a
              href="https://github.com/ankurosaurus/chillar-finance/releases"
              target="_blank"
              rel="noreferrer"
              className="px-4 py-3 rounded-xl border border-white/10 hover:border-blue-500/40 text-slate-300 hover:text-white text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              <span>GitHub Releases</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            </a>
          </div>
        </Card>

        {/* Data Management: PDF, Export & Import */}
        <Card variant="surface" className="flex flex-col gap-3 md:col-span-2">
          <span className="meta-label text-slate-400">Data Portability & Monthly Reports</span>
          <p className="text-xs text-slate-400">
            Export official monthly PDF statements or backup and restore your financial data.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
            <button
              type="button"
              onClick={handleExportPDF}
              className="p-3 rounded-xl border border-blue-500/30 bg-blue-600/10 hover:bg-blue-600/20 text-xs flex items-center justify-center gap-2 text-blue-400 font-medium transition-all"
            >
              <FileText strokeWidth={1.5} className="w-4 h-4 text-blue-400" />
              <span>Monthly Report (PDF)</span>
            </button>

            <button
              type="button"
              onClick={handleExportCSV}
              className="p-3 rounded-xl border border-inherit hover:border-blue-500/40 text-xs flex items-center justify-center gap-2 transition-colors"
            >
              <FileSpreadsheet strokeWidth={1.5} className="w-4 h-4 text-emerald-400" />
              <span>Export CSV</span>
            </button>

            <button
              type="button"
              onClick={handleExportJSON}
              className="p-3 rounded-xl border border-inherit hover:border-blue-500/40 text-xs flex items-center justify-center gap-2 transition-colors"
            >
              <Download strokeWidth={1.5} className="w-4 h-4 text-blue-400" />
              <span>Export JSON</span>
            </button>
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-inherit/40">
            <label className="px-3.5 py-2 rounded-xl border border-inherit hover:border-blue-500/40 text-xs flex items-center gap-2 cursor-pointer transition-colors">
              <Upload strokeWidth={1.5} className="w-4 h-4 text-slate-400" />
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
              className="px-3 py-2 rounded-xl text-xs text-blue-400 hover:bg-blue-500/10 transition-colors flex items-center gap-1"
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
              isDark ? 'bg-[#0B0F19] border-white/10 text-white' : 'bg-slate-100 border-slate-200 text-slate-900'
            }`}
          />
          <button
            type="button"
            onClick={handleSavePin}
            disabled={pinInput.length !== 4}
            className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-serif-display text-base font-semibold shadow-md shadow-blue-600/30 transition-all disabled:opacity-50"
          >
            Set PIN
          </button>
        </div>
      </Sheet>
    </div>
  );
};

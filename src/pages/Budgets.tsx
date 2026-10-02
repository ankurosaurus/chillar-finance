import React, { useState } from 'react';
import {
  SlidersHorizontal,
  Plus,
  AlertCircle,
  Sparkles,
  Edit2,
  Trash2,
  Repeat,
  Check,
} from 'lucide-react';
import { Card } from '../components/Card';
import { ProgressBar } from '../components/ProgressBar';
import { Sheet } from '../components/Sheet';
import { useFinanceStore } from '../store/useFinanceStore';
import {
  calculateMonthlySpendable,
  calculateCategoryMonthlyStatus,
} from '../lib/budgetMath';
import { formatINR } from '../lib/formatters';
import { useTheme } from '../hooks/useTheme';
import { Category } from '../types/finance';

export const Budgets: React.FC = () => {
  const profile = useFinanceStore((state) => state.profile);
  const setProfile = useFinanceStore((state) => state.setProfile);
  const categories = useFinanceStore((state) => state.categories);
  const transactions = useFinanceStore((state) => state.transactions);
  const updateCategory = useFinanceStore((state) => state.updateCategory);
  const addCategory = useFinanceStore((state) => state.addCategory);
  const deleteCategory = useFinanceStore((state) => state.deleteCategory);
  const { isDark } = useTheme();

  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editLimit, setEditLimit] = useState('');
  const [editSoftCap, setEditSoftCap] = useState(false);
  const [editName, setEditName] = useState('');

  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [newLimit, setNewLimit] = useState('');
  const [newSoftCap, setNewSoftCap] = useState(false);

  const today = new Date();
  const { monthlySpendable } = calculateMonthlySpendable(profile);

  // Sum of all category monthly limits
  const totalAllocated = categories.reduce((sum, c) => sum + (c.monthlyLimit || 0), 0);
  const unassigned = monthlySpendable - totalAllocated;

  const openEditModal = (cat: Category) => {
    setEditingCategory(cat);
    setEditName(cat.name);
    setEditLimit((cat.monthlyLimit || 0).toString());
    setEditSoftCap(cat.softCap);
  };

  const handleSaveEdit = () => {
    if (!editingCategory) return;
    const limitNum = parseFloat(editLimit) || 0;
    updateCategory(editingCategory.id, {
      name: editName.trim() || editingCategory.name,
      monthlyLimit: limitNum,
      softCap: editSoftCap,
    });
    setEditingCategory(null);
  };

  const handleSaveNew = () => {
    if (!newName.trim()) return;
    const limitNum = parseFloat(newLimit) || 0;
    const paletteColors = ['#C9A96E', '#7FA38A', '#C77D6B', '#9585BA', '#7B92A8', '#5C946E'];
    const randomColor = paletteColors[Math.floor(Math.random() * paletteColors.length)];

    addCategory({
      name: newName.trim(),
      monthlyLimit: limitNum,
      softCap: newSoftCap,
      color: randomColor,
    });
    setIsAddingNew(false);
    setNewName('');
    setNewLimit('');
    setNewSoftCap(false);
  };

  const toggleRollover = () => {
    setProfile({
      rolloverToFunOrGoals: !profile.rolloverToFunOrGoals,
    });
  };

  return (
    <div className="flex flex-col gap-5 pb-24">
      {/* Title & Add Category */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <h2 className="font-serif-display text-2xl font-light">Budgets & Envelopes</h2>
          <span className="text-xs text-[#8A8A8F]">
            Allocate monthly spendable allowance
          </span>
        </div>

        <button
          type="button"
          onClick={() => setIsAddingNew(true)}
          className="p-2 rounded-2xl border border-[#C9A96E]/30 text-[#C9A96E] hover:bg-[#C9A96E]/10 transition-colors flex items-center gap-1 text-xs font-medium"
        >
          <Plus strokeWidth={1.5} className="w-4 h-4" />
          <span>New</span>
        </button>
      </div>

      {/* Envelope Summary Card */}
      <Card variant="surface" className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <span className="meta-label text-[#8A8A8F]">Envelope Allocation</span>
          <span className="text-xs tnum text-[#8A8A8F]">
            Pool: {formatINR(monthlySpendable)}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 text-center">
          <div className="p-3 rounded-2xl bg-inherit border border-inherit">
            <span className="meta-label text-[#8A8A8F] block mb-1">Assigned</span>
            <span className="font-serif-display text-xl tnum text-[#C9A96E]">
              {formatINR(totalAllocated)}
            </span>
          </div>

          <div
            className={`p-3 rounded-2xl border ${
              unassigned < 0
                ? 'border-[#C77D6B]/40 bg-[#C77D6B]/10 text-[#C77D6B]'
                : 'border-inherit bg-inherit'
            }`}
          >
            <span className="meta-label text-[#8A8A8F] block mb-1">
              {unassigned >= 0 ? 'Unassigned' : 'Over-allocated'}
            </span>
            <span
              className={`font-serif-display text-xl tnum ${
                unassigned >= 0 ? 'text-[#7FA38A]' : 'text-[#C77D6B]'
              }`}
            >
              {formatINR(Math.abs(unassigned))}
            </span>
          </div>
        </div>

        {/* Rollover Option */}
        <div
          onClick={toggleRollover}
          className={`flex items-center justify-between p-3.5 rounded-2xl border cursor-pointer transition-colors ${
            profile.rolloverToFunOrGoals
              ? 'border-[#C9A96E]/30 bg-[#C9A96E]/5'
              : 'border-inherit bg-inherit'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Repeat strokeWidth={1.5} className="w-4 h-4 text-[#C9A96E]" />
            <div>
              <h5 className="text-xs font-medium">Weekly Rollover Pool</h5>
              <p className="text-[11px] text-[#8A8A8F]">
                Unspent weekly budget rolls into {profile.rolloverTarget || 'goals'}
              </p>
            </div>
          </div>

          <div
            className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
              profile.rolloverToFunOrGoals
                ? 'bg-[#C9A96E] border-[#C9A96E] text-[#0B0B0C]'
                : 'border-[#8A8A8F]'
            }`}
          >
            {profile.rolloverToFunOrGoals && <Check className="w-3.5 h-3.5 stroke-[3]" />}
          </div>
        </div>
      </Card>

      {/* Category Envelopes Responsive Grid */}
      <div className="flex flex-col gap-3">
        <span className="meta-label text-[#94A3B8]">Category Caps & Spending</span>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat) => {
            const status = calculateCategoryMonthlyStatus(cat, transactions, today);
            return (
              <Card
                key={cat.id}
                onClick={() => openEditModal(cat)}
                className={`cursor-pointer transition-colors ${
                  status.isOverSoftCap ? 'border-[#F43F5E]/40' : 'hover:border-[#D4AF37]/30'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: cat.color }}
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-serif-display text-base font-light">
                          {cat.name}
                        </h4>
                        {cat.softCap && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#D4AF37]/15 text-[#D4AF37] font-medium">
                            Soft cap (80%)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={`font-serif-display text-base tnum ${
                        status.isOverSoftCap ? 'text-[#F43F5E]' : 'text-[#D4AF37]'
                      }`}
                    >
                      {formatINR(status.spent)}
                    </span>
                    <span className="text-xs text-[#94A3B8] block">
                      / {formatINR(status.limit)}
                    </span>
                  </div>
                </div>

                <ProgressBar
                  value={status.spent}
                  max={Math.max(1, status.limit)}
                  height={5}
                  color={status.isOverSoftCap ? 'terracotta' : 'gold'}
                />

                <div className="flex items-center justify-between mt-2.5 text-[11px] text-[#94A3B8]">
                  <span>{status.percentage}% of cap spent</span>
                  <span>{formatINR(status.remaining)} remaining</span>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Edit Category Modal */}
      <Sheet
        isOpen={!!editingCategory}
        onClose={() => setEditingCategory(null)}
        title="Edit Category Envelope"
        subtitle="Manage limits and soft-cap warning threshold"
      >
        {editingCategory && (
          <div className="flex flex-col gap-4 pb-4">
            <div>
              <span className="meta-label text-[#8A8A8F] mb-1 block">Category Name</span>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className={`w-full px-3.5 py-2.5 rounded-2xl border text-sm outline-none ${
                  isDark
                    ? 'bg-[#1A1A1D] border-[rgba(255,255,255,0.08)] text-[#F4F2EE]'
                    : 'bg-[#EFECE6] border-[rgba(0,0,0,0.08)] text-[#111111]'
                }`}
              />
            </div>

            <div>
              <span className="meta-label text-[#8A8A8F] mb-1 block">Monthly Cap (₹)</span>
              <input
                type="number"
                value={editLimit}
                onChange={(e) => setEditLimit(e.target.value)}
                className={`w-full px-4 py-3 rounded-2xl border font-serif-display text-2xl tnum outline-none ${
                  isDark
                    ? 'bg-[#1A1A1D] border-[rgba(255,255,255,0.08)] text-[#C9A96E]'
                    : 'bg-[#EFECE6] border-[rgba(0,0,0,0.08)] text-[#C9A96E]'
                }`}
              />
            </div>

            {/* Soft Cap Toggle */}
            <div
              onClick={() => setEditSoftCap(!editSoftCap)}
              className={`flex items-center justify-between p-3.5 rounded-2xl border cursor-pointer transition-colors ${
                editSoftCap ? 'border-[#C9A96E]/30 bg-[#C9A96E]/5' : 'border-inherit'
              }`}
            >
              <div>
                <h5 className="text-xs font-medium">Soft Cap Warning at 80%</h5>
                <p className="text-[11px] text-[#8A8A8F]">
                  Gentle banner alert when 80% of limit is used
                </p>
              </div>

              <div
                className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                  editSoftCap
                    ? 'bg-[#C9A96E] border-[#C9A96E] text-[#0B0B0C]'
                    : 'border-[#8A8A8F]'
                }`}
              >
                {editSoftCap && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              {!editingCategory.isSystem && (
                <button
                  type="button"
                  onClick={() => {
                    deleteCategory(editingCategory.id);
                    setEditingCategory(null);
                  }}
                  className="px-4 py-3 rounded-2xl border border-[#C77D6B]/40 text-[#C77D6B] hover:bg-[#C77D6B]/10 text-xs font-medium transition-colors"
                >
                  <Trash2 strokeWidth={1.5} className="w-4 h-4" />
                </button>
              )}

              <button
                type="button"
                onClick={handleSaveEdit}
                className="flex-1 py-3 rounded-2xl bg-[#C9A96E] hover:bg-[#D7BC88] text-[#0B0B0C] font-serif-display text-base tracking-wide font-medium transition-colors"
              >
                Save Envelope
              </button>
            </div>
          </div>
        )}
      </Sheet>

      {/* Add New Category Modal */}
      <Sheet
        isOpen={isAddingNew}
        onClose={() => setIsAddingNew(false)}
        title="New Category Envelope"
        subtitle="Create custom category and spending cap"
      >
        <div className="flex flex-col gap-4 pb-4">
          <div>
            <span className="meta-label text-[#8A8A8F] mb-1 block">Category Name</span>
            <input
              type="text"
              placeholder="e.g. Gym & Supplements, Gaming"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className={`w-full px-3.5 py-2.5 rounded-2xl border text-sm outline-none ${
                isDark
                  ? 'bg-[#1A1A1D] border-[rgba(255,255,255,0.08)] text-[#F4F2EE]'
                  : 'bg-[#EFECE6] border-[rgba(0,0,0,0.08)] text-[#111111]'
              }`}
            />
          </div>

          <div>
            <span className="meta-label text-[#8A8A8F] mb-1 block">Monthly Cap (₹)</span>
            <input
              type="number"
              placeholder="e.g. 1000"
              value={newLimit}
              onChange={(e) => setNewLimit(e.target.value)}
              className={`w-full px-4 py-3 rounded-2xl border font-serif-display text-2xl tnum outline-none ${
                isDark
                  ? 'bg-[#1A1A1D] border-[rgba(255,255,255,0.08)] text-[#C9A96E]'
                  : 'bg-[#EFECE6] border-[rgba(0,0,0,0.08)] text-[#C9A96E]'
              }`}
            />
          </div>

          <div
            onClick={() => setNewSoftCap(!newSoftCap)}
            className={`flex items-center justify-between p-3.5 rounded-2xl border cursor-pointer transition-colors ${
              newSoftCap ? 'border-[#C9A96E]/30 bg-[#C9A96E]/5' : 'border-inherit'
            }`}
          >
            <div>
              <h5 className="text-xs font-medium">Soft Cap Warning at 80%</h5>
              <p className="text-[11px] text-[#8A8A8F]">
                Warn at 80% instead of strict cut-off
              </p>
            </div>

            <div
              className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                newSoftCap
                  ? 'bg-[#C9A96E] border-[#C9A96E] text-[#0B0B0C]'
                  : 'border-[#8A8A8F]'
              }`}
            >
              {newSoftCap && <Check className="w-3.5 h-3.5 stroke-[3]" />}
            </div>
          </div>

          <button
            type="button"
            onClick={handleSaveNew}
            disabled={!newName.trim()}
            className="w-full py-3.5 rounded-2xl bg-[#C9A96E] hover:bg-[#D7BC88] text-[#0B0B0C] font-serif-display text-base tracking-wide font-medium transition-colors disabled:opacity-50"
          >
            Create Category
          </button>
        </div>
      </Sheet>
    </div>
  );
};

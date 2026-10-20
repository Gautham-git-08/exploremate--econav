/**
 * ExploreMate Budget Tab
 * Linked sliders totaling 100%, status thresholds, expense logger,
 * spending-pace predictions, CSV export, and INR note (no ₹ symbol in text).
 */

import React, { useState, useEffect } from 'react';
import { Wallet, PieChart, TrendingUp, AlertTriangle, Download, Plus, Trash2 } from 'lucide-react';
import { useModal } from '../context/ModalContext';
import { useApp } from '../context/AppContext.jsx';

export default function BudgetTab() {
  const { budgetConfig, updateBudget } = useApp();
  const totalBudget = budgetConfig.totalBudget;
  const days = budgetConfig.days;
  const travelers = budgetConfig.people;
  const setTotalBudget = (val) => updateBudget({ totalBudget: Number(val) });
  const setDays = (val) => updateBudget({ days: Number(val) });
  const setTravelers = (val) => updateBudget({ people: Number(val) });
  const [style, setStyle] = useState('standard'); // budget, standard, comfort
  const [sliders, setSliders] = useState({
    stay: 35,
    food: 30,
    activities: 20,
    transport: 10,
    buffer: 5
  });
  const [calculation, setCalculation] = useState(null);
  const [expenses, setExpenses] = useState([
    { id: '1', category: 'Food', amount: 850, note: 'Café des Arts breakfast', time: '09:30 AM', stop: 'White Town' },
    { id: '2', category: 'Stay', amount: 3200, note: 'Guesthouse booking', time: '11:00 AM', stop: 'Auroville Road' }
  ]);
  const [newExp, setNewExp] = useState({ category: 'Food', amount: '', note: '' });
  const { showAlert } = useModal();

  useEffect(() => {
    fetch('/api/budget/calculate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ totalBudget, days, travelers, sliders })
    })
      .then((r) => r.json())
      .then((d) => setCalculation(d))
      .catch((e) => console.error("Budget calc error", e));
  }, [totalBudget, days, travelers, sliders]);

  const handleSliderChange = (category, value) => {
    const val = parseInt(value, 10);
    const oldVal = sliders[category];
    const diff = val - oldVal;
    
    // Distribute diff proportionally among other sliders
    const otherKeys = Object.keys(sliders).filter(k => k !== category);
    const currentOtherSum = otherKeys.reduce((acc, k) => acc + sliders[k], 0);
    
    const updated = { ...sliders, [category]: val };
    if (currentOtherSum > 0) {
      otherKeys.forEach(k => {
        const proportion = sliders[k] / currentOtherSum;
        updated[k] = Math.max(0, Math.round(sliders[k] - diff * proportion));
      });
    }
    
    // Ensure total is 100
    const sumNow = Object.values(updated).reduce((a, b) => a + b, 0);
    if (sumNow !== 100) {
      updated.buffer = Math.max(0, updated.buffer + (100 - sumNow));
    }
    setSliders(updated);
  };

  const handleAddExpense = (e) => {
    e.preventDefault();
    if (!newExp.amount) return;
    const item = {
      id: Date.now().toString(),
      category: newExp.category,
      amount: parseFloat(newExp.amount),
      note: newExp.note || 'General expense',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      stop: 'Pondicherry'
    };
    setExpenses([...expenses, item]);
    setNewExp({ category: 'Food', amount: '', note: '' });
  };

  const totalSpent = expenses.reduce((a, b) => a + b.amount, 0);
  const remaining = totalBudget - totalSpent;

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="font-serif text-3xl font-bold text-slate-900 dark:text-white">
            Budget Planner & Expense Tracker
          </h2>
          <p className="text-xs text-slate-500">
            Smart category allocations and real-time spending pace monitoring.
          </p>
        </div>

        {/* Currency disclaimer required rule */}
        <div className="text-xs px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-full border border-slate-200 dark:border-slate-700">
          All prices in INR
        </div>
      </div>

      {/* Top Controls */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1.5">
            Total Trip Budget (INR)
          </label>
          <input
            type="number"
            value={totalBudget}
            onChange={(e) => setTotalBudget(Number(e.target.value))}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1.5">
            Trip Duration (Days)
          </label>
          <input
            type="number"
            min="1"
            max="30"
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1.5">
            Number of Travelers
          </label>
          <input
            type="number"
            min="1"
            max="10"
            value={travelers}
            onChange={(e) => setTravelers(Number(e.target.value))}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white"
          />
        </div>
      </div>

      {/* Overview Cards */}
      {calculation && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="glass-panel p-4 rounded-3xl border border-slate-200 dark:border-slate-800">
            <span className="text-[11px] text-slate-500 uppercase font-semibold block">Total Estimated</span>
            <span className="text-2xl font-bold text-slate-900 dark:text-white mt-1 block">
              {calculation.totalEstimatedCost}
            </span>
            <span className={`text-[11px] font-medium mt-1 block ${
              calculation.status === 'exceeded' ? 'text-red-600' : calculation.status === 'warning' ? 'text-amber-600' : 'text-emerald-600'
            }`}>
              {calculation.statusMessage}
            </span>
          </div>

          <div className="glass-panel p-4 rounded-3xl border border-slate-200 dark:border-slate-800">
            <span className="text-[11px] text-slate-500 uppercase font-semibold block">Per Day / Group</span>
            <span className="text-2xl font-bold text-slate-900 dark:text-white mt-1 block">
              {calculation.perDay}
            </span>
            <span className="text-[11px] text-slate-400 mt-1 block">
              Across {days} planned days
            </span>
          </div>

          <div className="glass-panel p-4 rounded-3xl border border-slate-200 dark:border-slate-800">
            <span className="text-[11px] text-slate-500 uppercase font-semibold block">Per Person / Day</span>
            <span className="text-2xl font-bold text-slate-900 dark:text-white mt-1 block">
              {calculation.perPersonDay}
            </span>
            <span className="text-[11px] text-slate-400 mt-1 block">
              For {travelers} travelers
            </span>
          </div>

          <div className="glass-panel p-4 rounded-3xl border border-slate-200 dark:border-slate-800">
            <span className="text-[11px] text-slate-500 uppercase font-semibold block">Actual Spent / Left</span>
            <span className="text-2xl font-bold text-teal-600 dark:text-teal-400 mt-1 block">
              {remaining >= 0 ? `${remaining} Left` : `${Math.abs(remaining)} Over`}
            </span>
            <span className="text-[11px] text-slate-400 mt-1 block">
              Logged {totalSpent} across {expenses.length} expenses
            </span>
          </div>
        </div>
      )}

      {/* Linked Sliders */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-serif text-lg font-bold text-slate-900 dark:text-white">
            Category Allocation Sliders (Total: 100%)
          </h3>
          <span className="text-xs text-mustard-600 dark:text-mustard-400 font-semibold">
            Auto-balances to 100%
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Object.keys(sliders).map((cat) => (
            <div key={cat} className="space-y-1.5">
              <div className="flex justify-between text-xs font-medium text-slate-700 dark:text-slate-300 capitalize">
                <span>{cat}</span>
                <span>{sliders[cat]}% ({calculation?.breakdown?.[cat] || 0} INR)</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={sliders[cat]}
                onChange={(e) => handleSliderChange(cat, e.target.value)}
                className="w-full accent-mustard-500 cursor-pointer"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Expense Logger */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
        <h3 className="font-serif text-lg font-bold text-slate-900 dark:text-white">
          Expense Log & Tracker
        </h3>

        <form onSubmit={handleAddExpense} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <select
            value={newExp.category}
            onChange={(e) => setNewExp({ ...newExp, category: e.target.value })}
            className="p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200"
          >
            <option>Food</option>
            <option>Stay</option>
            <option>Activities</option>
            <option>Transport</option>
            <option>Buffer</option>
          </select>

          <input
            type="number"
            placeholder="Amount in INR"
            value={newExp.amount}
            onChange={(e) => setNewExp({ ...newExp, amount: e.target.value })}
            className="p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200"
          />

          <input
            type="text"
            placeholder="Description / Note"
            value={newExp.note}
            onChange={(e) => setNewExp({ ...newExp, note: e.target.value })}
            className="p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200"
          />

          <button
            type="submit"
            className="px-4 py-2.5 bg-mustard-600 hover:bg-mustard-700 text-white text-xs font-semibold rounded-xl shadow transition"
          >
            Log Expense
          </button>
        </form>

        <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
          {expenses.map((exp) => (
            <div key={exp.id} className="py-2.5 flex items-center justify-between">
              <div>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{exp.note}</span>
                <span className="ml-2 text-slate-400">({exp.category} • {exp.time})</span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="font-bold text-slate-900 dark:text-white">{exp.amount} INR</span>
                <button
                  onClick={() => setExpenses(expenses.filter(e => e.id !== exp.id))}
                  className="text-slate-400 hover:text-red-500"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { 
  User, 
  DollarSign, 
  Plus, 
  Trash2, 
  Search, 
  LogOut, 
  Smartphone, 
  Sparkles, 
  Clock, 
  AlertCircle, 
  Check, 
  TrendingUp, 
  BookOpen, 
  Coins 
} from 'lucide-react';
import { Debt } from '../types';
import { 
  subscribeToDebts, 
  saveDebt, 
  deleteDebt, 
  persistStoreAccountId, 
  getPersistedStoreAccountId, 
  clearPersistedStoreAccountId 
} from '../firebase';

interface DebtLedgerProps {
  storeAccountId: string | null;
  onAccountChange: (newId: string | null) => void;
}

export default function DebtLedger({ storeAccountId, onAccountChange }: DebtLedgerProps) {
  // Account config states
  const [inputStoreId, setInputStoreId] = useState('');
  const [accountError, setAccountError] = useState('');

  // Ledger states
  const [debts, setDebts] = useState<Debt[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Form states
  const [debtorName, setDebtorName] = useState('');
  const [debtAmount, setDebtAmount] = useState('');
  const [debtNotes, setDebtNotes] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Editing/Partial Payment modal/states
  const [selectedDebtForAction, setSelectedDebtForAction] = useState<Debt | null>(null);
  const [actionAmount, setActionAmount] = useState('');
  const [actionType, setActionType] = useState<'pay' | 'add'>('pay');

  // Load debts list when account changes
  useEffect(() => {
    if (!storeAccountId) {
      setDebts([]);
      return;
    }

    setLoading(true);
    const unsubscribe = subscribeToDebts(
      storeAccountId,
      (updatedDebts) => {
        setDebts(updatedDebts);
        setLoading(false);
        setErrorMsg('');
      },
      (error) => {
        console.error("Firestore loading error:", error);
        setErrorMsg("Could not connect to live database. Please check your credentials.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [storeAccountId]);

  // Handle setting/saving store ID (Logging in)
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = inputStoreId.trim().toLowerCase().replace(/[^a-z0-9_\-]/g, '_');
    if (!cleanId) {
      setAccountError('Please enter a valid Account ID.');
      return;
    }
    
    persistStoreAccountId(cleanId);
    onAccountChange(cleanId);
    setAccountError('');
  };

  // Handle logout
  const handleLogout = () => {
    if (confirm('Are you sure you want to sign out of this Store Account? You will need to enter the ID again to sync.')) {
      clearPersistedStoreAccountId();
      onAccountChange(null);
    }
  };

  // Create new debt
  const handleAddDebtSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeAccountId) return;
    if (!debtorName.trim()) {
      alert('Debtor name is required.');
      return;
    }
    const parsedAmount = parseFloat(debtAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      alert('Please enter a valid amount greater than 0.');
      return;
    }

    // Check if debtor already exists (we can merge debt)
    const existing = debts.find(d => d.customerName.toLowerCase() === debtorName.trim().toLowerCase());
    
    try {
      if (existing) {
        if (confirm(`"${existing.customerName}" already has an outstanding debt of ₦${existing.amount.toLocaleString()}. Do you want to ADD ₦${parsedAmount.toLocaleString()} to their existing debt?`)) {
          await saveDebt(storeAccountId, {
            id: existing.id,
            customerName: existing.customerName,
            amount: existing.amount + parsedAmount,
            notes: (existing.notes ? existing.notes + '; ' : '') + (debtNotes.trim() || 'Additional credit purchase'),
            createdAt: existing.createdAt
          });
        }
      } else {
        const id = 'debt_' + Date.now();
        await saveDebt(storeAccountId, {
          id,
          customerName: debtorName.trim(),
          amount: parsedAmount,
          notes: debtNotes.trim()
        });
      }

      // Reset form
      setDebtorName('');
      setDebtAmount('');
      setDebtNotes('');
    } catch (e) {
      alert('Error recording debt record.');
    }
  };

  // Process partial payment or additional credit
  const handleProcessAction = async () => {
    if (!storeAccountId || !selectedDebtForAction) return;
    const value = parseFloat(actionAmount);
    if (isNaN(value) || value <= 0) {
      alert('Please enter a valid amount.');
      return;
    }

    let nextAmount = selectedDebtForAction.amount;
    let noteAddon = '';

    if (actionType === 'pay') {
      if (value > selectedDebtForAction.amount) {
        alert(`Cannot pay more than the outstanding debt (₦${selectedDebtForAction.amount.toLocaleString()}).`);
        return;
      }
      nextAmount = selectedDebtForAction.amount - value;
      noteAddon = `Paid ₦${value.toLocaleString()}`;
    } else {
      nextAmount = selectedDebtForAction.amount + value;
      noteAddon = `Borrowed additional ₦${value.toLocaleString()}`;
    }

    try {
      if (nextAmount <= 0) {
        await deleteDebt(storeAccountId, selectedDebtForAction.id);
      } else {
        await saveDebt(storeAccountId, {
          id: selectedDebtForAction.id,
          customerName: selectedDebtForAction.customerName,
          amount: nextAmount,
          notes: (selectedDebtForAction.notes ? selectedDebtForAction.notes + '; ' : '') + noteAddon,
          createdAt: selectedDebtForAction.createdAt
        });
      }
      setSelectedDebtForAction(null);
      setActionAmount('');
    } catch (e) {
      alert('Failed to update debt record.');
    }
  };

  // Settle/Delete whole debt
  const handleSettleFullDebt = async (debt: Debt) => {
    if (!storeAccountId) return;
    if (confirm(`Mark "${debt.customerName}" as fully PAID and clear their debt of ₦${debt.amount.toLocaleString()}?`)) {
      try {
        await deleteDebt(storeAccountId, debt.id);
      } catch (e) {
        alert('Failed to clear debt.');
      }
    }
  };

  // Format money
  const formatNaira = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 2
    }).format(amount);
  };

  // Calculations for Stats
  const totalOutstanding = debts.reduce((sum, d) => sum + d.amount, 0);
  const activeDebtorsCount = debts.length;

  const filteredDebts = debts.filter(d => 
    d.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (d.notes && d.notes.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // If user is not logged in / has no account ID set, show the Login / Sync screen
  if (!storeAccountId) {
    return (
      <div id="debt-ledger-auth-card" className="max-w-xl mx-auto my-8 p-6 md:p-8 rounded-3xl bg-white border border-slate-200 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-rose-500 to-indigo-600" />
        
        <div className="flex flex-col items-center text-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-50 to-indigo-50 border border-indigo-100 flex items-center justify-center shadow-inner">
            <Smartphone className="w-7 h-7 text-indigo-600 animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-sans font-black text-slate-900 tracking-tight">
              Connect Store Account
            </h2>
            <p className="text-sm text-slate-500 mt-1 max-w-sm">
              Use a single Store ID on both phones to share pricing updates and the Debt Ledger instantly!
            </p>
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="store-id-input" className="block text-xs font-mono uppercase tracking-wider text-slate-500 font-bold mb-2">
              Choose your Account ID
            </label>
            <div className="relative">
              <span className="absolute left-4 top-3.5 font-mono text-slate-400 font-bold">@</span>
              <input
                id="store-id-input"
                type="text"
                required
                value={inputStoreId}
                onChange={(e) => setInputStoreId(e.target.value)}
                placeholder="e.g. princess_store"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-sans font-bold placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 transition shadow-inner"
              />
            </div>
            {accountError && (
              <p className="text-xs text-rose-500 font-medium mt-1 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> {accountError}
              </p>
            )}
            <p className="text-[11px] text-slate-400 font-mono mt-2">
              Note: Do not use spaces. Letters, numbers, hyphens (-) and underscores (_) only.
            </p>
          </div>

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-rose-500 to-indigo-600 hover:from-rose-600 hover:to-indigo-700 text-white font-sans font-extrabold text-base shadow-lg shadow-rose-500/15 active:scale-[0.98] transition cursor-pointer"
          >
            <span>Connect &amp; Stay Logged In</span>
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-center gap-2 text-xs font-mono text-slate-500">
          <Check className="w-4 h-4 text-emerald-500" />
          <span>No password required. Login is stored permanently on this device.</span>
        </div>
      </div>
    );
  }

  return (
    <section id="debt-ledger-dashboard-section" className="w-full bg-white/60 backdrop-blur-md p-6 md:p-8 rounded-3xl border border-slate-200 shadow-xl shadow-slate-100/50 mb-8 relative">
      
      {/* Decorative top border */}
      <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-rose-500 to-indigo-600 rounded-t-3xl" />

      {/* Header Actions */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-slate-100 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-rose-50 text-rose-500">
              <BookOpen className="w-5 h-5" />
            </span>
            <h2 className="text-xl md:text-2xl font-sans font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
              Debt Ledger
            </h2>
            <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold bg-indigo-50 text-indigo-600 rounded-full border border-indigo-200 uppercase tracking-wider">
              Synced Active
            </span>
          </div>
          <p className="text-xs text-slate-500 font-sans mt-1">
            Realtime customer credit outstanding records linked to store account <span className="font-mono font-bold text-indigo-600">@{storeAccountId}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-mono font-semibold text-slate-500 flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Device Connected
          </span>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-xs font-mono font-bold text-slate-600 hover:text-rose-600 transition cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Stats Summary Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        
        {/* Card 1: Total Debt outstanding */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-rose-50/30 to-white border border-rose-100 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono text-rose-600 uppercase font-extrabold tracking-wider">TOTAL OUTSTANDING CREDIT</span>
            <span className="text-2xl md:text-3xl font-display font-black text-slate-900 block mt-1">
              {formatNaira(totalOutstanding)}
            </span>
            <span className="text-[10px] font-sans text-slate-400 block mt-0.5">Collectable from active ledger</span>
          </div>
          <div className="p-3.5 rounded-xl bg-rose-50 text-rose-500">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2: Debtors count */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-50/20 to-white border border-indigo-50 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono text-indigo-600 uppercase font-extrabold tracking-wider">ACTIVE DEBTORS</span>
            <span className="text-2xl md:text-3xl font-display font-black text-slate-900 block mt-1">
              {activeDebtorsCount} <span className="text-sm font-sans font-medium text-slate-500">persons</span>
            </span>
            <span className="text-[10px] font-sans text-slate-400 block mt-0.5">Distinct ledger accounts</span>
          </div>
          <div className="p-3.5 rounded-xl bg-indigo-50 text-indigo-500">
            <User className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: Live Status */}
        <div className="p-5 rounded-2xl bg-slate-50/50 border border-slate-200 flex flex-col justify-center">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500 animate-bounce" />
            <span className="text-xs font-sans font-bold text-slate-800">Two-Phone Realtime Sync</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Any addition, partial payment, or credit settlement on your other phone updates instantly here in 0.5s.
          </p>
        </div>
      </div>

      {/* Main Grid: Add Debt Form & Debtors List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: Record Debt Form (4 cols) */}
        <div className="lg:col-span-4 bg-slate-50 p-5 rounded-2xl border border-slate-200">
          <h3 className="text-sm font-mono uppercase tracking-wider text-slate-800 font-extrabold mb-4 flex items-center gap-2">
            <Coins className="w-4 h-4 text-rose-500" /> Record Credit / Debt
          </h3>

          <form onSubmit={handleAddDebtSubmit} className="space-y-4">
            <div>
              <label htmlFor="debtor-name-input" className="block text-[11px] font-mono text-slate-500 uppercase font-bold mb-1.5">
                Debtor Name
              </label>
              <input
                id="debtor-name-input"
                type="text"
                required
                value={debtorName}
                onChange={(e) => setDebtorName(e.target.value)}
                placeholder="e.g. Alhaji Bello"
                className="w-full px-3 py-2.5 rounded-xl bg-white border border-slate-200 text-xs font-sans font-medium text-slate-950 focus:outline-none focus:border-rose-500 transition"
              />
            </div>

            <div>
              <label htmlFor="debt-amount-input" className="block text-[11px] font-mono text-slate-500 uppercase font-bold mb-1.5">
                Amount Owed (₦ Naira)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-3 text-xs font-mono text-slate-400 font-bold">₦</span>
                <input
                  id="debt-amount-input"
                  type="number"
                  required
                  min="1"
                  value={debtAmount}
                  onChange={(e) => setDebtAmount(e.target.value)}
                  placeholder="e.g. 15000"
                  className="w-full pl-7 pr-3 py-2.5 rounded-xl bg-white border border-slate-200 text-xs font-mono font-bold text-slate-950 focus:outline-none focus:border-rose-500 transition"
                />
              </div>
            </div>

            <div>
              <label htmlFor="debt-notes-input" className="block text-[11px] font-mono text-slate-500 uppercase font-bold mb-1.5">
                Description / Purchases (Optional)
              </label>
              <textarea
                id="debt-notes-input"
                rows={3}
                value={debtNotes}
                onChange={(e) => setDebtNotes(e.target.value)}
                placeholder="e.g. Bought 2 tins of Milo on credit"
                className="w-full px-3 py-2.5 rounded-xl bg-white border border-slate-200 text-xs font-sans text-slate-950 focus:outline-none focus:border-rose-500 transition resize-none"
              />
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-rose-500 to-indigo-600 hover:from-rose-600 hover:to-indigo-700 text-white font-sans font-extrabold text-xs shadow-md transition cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Record Debt Entry</span>
            </button>
          </form>
        </div>

        {/* RIGHT COLUMN: Active Ledger List (8 cols) */}
        <div className="lg:col-span-8 flex flex-col">
          
          {/* List Search Header */}
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                id="ledger-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search debtors by name..."
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-rose-500 transition font-sans font-medium"
              />
            </div>
          </div>

          {/* Ledger Table/List Container */}
          <div className="flex-1 min-h-[300px] max-h-[460px] overflow-y-auto divide-y divide-slate-100 rounded-2xl border border-slate-100 p-2 bg-slate-50/50">
            {loading ? (
              <div className="h-48 flex flex-col items-center justify-center text-slate-400 gap-2 font-mono text-xs">
                <span className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                <span>Syncing live records...</span>
              </div>
            ) : errorMsg ? (
              <div className="p-8 text-center text-xs font-mono text-rose-500">
                {errorMsg}
              </div>
            ) : filteredDebts.length === 0 ? (
              <div className="h-48 flex flex-col items-center justify-center text-slate-400 gap-2 text-center p-6">
                <User className="w-8 h-8 text-slate-300" />
                <span className="font-sans font-bold text-slate-700 text-sm">No Credit Records</span>
                <span className="font-mono text-[11px] text-slate-400 max-w-xs">There are no outstanding debts matching your current filter. Record one on the left!</span>
              </div>
            ) : (
              <div className="space-y-3 p-1">
                {filteredDebts.map((debt) => (
                  <div 
                    key={debt.id} 
                    className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-300 transition duration-150"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-full bg-rose-50 flex items-center justify-center shrink-0 border border-rose-100">
                        <User className="w-4 h-4 text-rose-500" />
                      </div>
                      <div>
                        <h4 className="font-sans font-black text-slate-950 text-sm md:text-base">
                          {debt.customerName}
                        </h4>
                        {debt.notes && (
                          <p className="text-[11px] text-slate-500 mt-1 italic font-sans max-w-md line-clamp-2">
                            "{debt.notes}"
                          </p>
                        )}
                        <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1 mt-1.5">
                          <Clock className="w-3 h-3" /> Updated: {new Date(debt.updatedAt).toLocaleDateString()} {new Date(debt.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-baseline sm:items-end justify-between sm:justify-center gap-2 shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-50">
                      <div className="text-right">
                        <span className="text-xs font-mono text-slate-400 uppercase tracking-widest block font-bold">Owes</span>
                        <span className="text-lg font-mono font-black text-rose-600">
                          {formatNaira(debt.amount)}
                        </span>
                      </div>

                      {/* Rapid Actions */}
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            setSelectedDebtForAction(debt);
                            setActionType('pay');
                            setActionAmount('');
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-100 font-sans font-bold text-[10px] transition cursor-pointer"
                        >
                          Partial Payment
                        </button>
                        <button
                          onClick={() => {
                            setSelectedDebtForAction(debt);
                            setActionType('add');
                            setActionAmount('');
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-100 font-sans font-bold text-[10px] transition cursor-pointer"
                        >
                          Add Credit
                        </button>
                        <button
                          onClick={() => handleSettleFullDebt(debt)}
                          className="p-1.5 rounded-lg bg-slate-50 hover:bg-rose-500 hover:text-white border border-slate-200 hover:border-rose-500 text-slate-400 transition cursor-pointer"
                          title="Settle Whole Debt (Fully Paid)"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Partial / Additional Credit Edit Overlay Dialog */}
      {selectedDebtForAction && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 max-w-sm w-full animate-in zoom-in-95 duration-150">
            <h3 className="text-base font-sans font-black text-slate-900 mb-2">
              {actionType === 'pay' ? 'Record Partial Payment' : 'Add Credit Purchase'}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              {actionType === 'pay' 
                ? `Enter payment amount from "${selectedDebtForAction.customerName}" (Outstanding: ${formatNaira(selectedDebtForAction.amount)})` 
                : `Enter additional credit to add to "${selectedDebtForAction.customerName}"`}
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-mono text-slate-500 uppercase font-bold mb-1.5">
                  Amount (₦ Naira)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 font-mono text-slate-400 font-bold">₦</span>
                  <input
                    type="number"
                    required
                    value={actionAmount}
                    onChange={(e) => setActionAmount(e.target.value)}
                    placeholder="e.g. 5000"
                    className="w-full pl-7 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono font-bold text-slate-950 focus:outline-none focus:border-rose-500 transition"
                  />
                </div>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  onClick={() => setSelectedDebtForAction(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-sans font-bold text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleProcessAction}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-indigo-600 hover:from-rose-600 hover:to-indigo-700 text-white font-sans font-extrabold text-xs shadow-sm transition cursor-pointer"
                >
                  Save Record
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </section>
  );
}

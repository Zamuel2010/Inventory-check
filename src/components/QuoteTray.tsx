import { QuoteItem } from '../types';
import { ShoppingCart, Trash2, CheckCircle2, ArrowRight, X, TrendingUp } from 'lucide-react';
import { useState } from 'react';

interface QuoteTrayProps {
  quoteItems: QuoteItem[];
  onRemoveItem: (productId: string) => void;
  onClearQuote: () => void;
  onCheckout?: () => void;
}

export function QuoteTray({ quoteItems, onRemoveItem, onClearQuote, onCheckout }: QuoteTrayProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCheckedOut, setIsCheckedOut] = useState(false);

  if (quoteItems.length === 0) return null;

  const totalCost = quoteItems.reduce((sum, item) => sum + item.totalCost, 0);
  const totalSelling = quoteItems.reduce((sum, item) => sum + item.totalSelling, 0);
  const totalProfit = totalSelling > totalCost ? totalSelling - totalCost : 0;
  const totalQty = quoteItems.reduce((sum, item) => sum + item.quantity, 0);

  const formatNaira = (amount: number) => {
    return '₦' + amount.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const handleDispatchOrder = () => {
    setIsCheckedOut(true);
    setTimeout(() => {
      setIsCheckedOut(false);
      onClearQuote();
      setIsExpanded(false);
    }, 3000);
  };

  return (
    <div id="floating-wholesale-quote-tray" className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-4xl">
      
      {/* Expanded Order Table */}
      {isExpanded && (
        <div className="mb-3 p-6 rounded-3xl bg-white/95 backdrop-blur-3xl border border-slate-200 shadow-2xl animate-in fade-in slide-in-from-bottom-6 duration-300">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200">
            <div>
              <h3 className="text-base font-sans font-extrabold text-slate-900 uppercase flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-rose-500" /> Active Order Estimate
              </h3>
              <p className="text-xs text-slate-500 font-mono">
                {totalQty} items across {quoteItems.length} unique goods ready for profit projections
              </p>
            </div>
            <button
              onClick={() => setIsExpanded(false)}
              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="max-h-60 overflow-y-auto my-4 space-y-2 pr-1 scrollbar-thin">
            {quoteItems.map((item, idx) => {
              const itemProfit = item.totalSelling > item.totalCost ? item.totalSelling - item.totalCost : 0;
              return (
                <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs font-mono">
                  <div className="flex items-center gap-3">
                    <img src={item.product.imageUrl} alt="" className="w-9 h-9 rounded-lg object-cover bg-slate-100 border border-slate-200" />
                    <div>
                      <span className="text-slate-900 font-sans font-bold block">{item.product.name}</span>
                      <span className="text-rose-500 font-bold">
                        {item.quantity} {item.sellType === 'carton' ? 'cartons' : `units (1 of ${item.unitsPerCarton} pcs)`}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="text-slate-900 font-bold block">Selling: {formatNaira(item.totalSelling)}</span>
                      <span className="text-emerald-600 font-bold text-[10px]">Profit: +{formatNaira(itemProfit)}</span>
                    </div>
                    <button
                      onClick={() => onRemoveItem(item.product.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-4 border-t border-slate-200 flex items-center justify-between flex-wrap gap-4">
            <button
              onClick={onClearQuote}
              className="text-xs font-mono text-slate-500 hover:text-rose-600 transition underline cursor-pointer font-bold"
            >
              CLEAR ALL
            </button>
            <button
              onClick={() => {
                if (onCheckout) {
                  onCheckout();
                } else {
                  handleDispatchOrder();
                }
              }}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-rose-500 to-indigo-600 hover:from-rose-600 hover:to-indigo-700 text-white font-sans font-extrabold text-sm shadow-lg shadow-rose-500/20 transition cursor-pointer flex items-center gap-2"
            >
              <span>GENERATE DIGITAL INVOICE</span>
              <ArrowRight className="w-4 h-4" />
            </button>

          </div>
        </div>
      )}

      {/* Collapsed Glass Tray Bar */}
      <div className="p-4 rounded-2xl bg-white/95 backdrop-blur-2xl border border-slate-200 shadow-2xl flex items-center justify-between gap-4 ring-1 ring-slate-900/5">
        <div className="flex items-center gap-3 cursor-pointer select-none" onClick={() => setIsExpanded(!isExpanded)}>
          <div className="relative w-10 h-10 rounded-xl bg-rose-500 text-white flex items-center justify-center shadow-md">
            <ShoppingCart className="w-5 h-5" />
            <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-emerald-500 text-white font-bold font-mono text-xs flex items-center justify-center shadow">
              {quoteItems.length}
            </span>
          </div>
          <div>
            <span className="text-xs font-mono uppercase tracking-wider text-rose-500 font-bold block">
              Active Order Summary
            </span>
            <span className="text-sm font-sans font-extrabold text-slate-900">
              {totalQty} Items // Cost: {formatNaira(totalCost)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 text-right font-mono">
            <TrendingUp className="w-4 h-4 text-emerald-600 shrink-0" />
            <div>
              <span className="text-[10px] text-slate-500 block font-semibold">EST. PROFIT</span>
              <span className="text-xs font-bold text-emerald-600">+{formatNaira(totalProfit)}</span>
            </div>
          </div>
          
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-4 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-mono text-xs font-bold transition cursor-pointer border border-slate-200"
          >
            {isExpanded ? 'COLLAPSE' : 'VIEW DETAILS'}
          </button>
        </div>
      </div>

    </div>
  );
}

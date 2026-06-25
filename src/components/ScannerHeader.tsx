import { useState, useEffect } from 'react';
import { Search, Sparkles, Store, ShoppingBag, ArrowRight } from 'lucide-react';
import { Product } from '../types';

interface ScannerHeaderProps {
  products: Product[];
  onSelectProduct: (product: Product) => void;
  activeSearchQuery: string;
  setSearchQuery: (q: string) => void;
}

export function ScannerHeader({ products, onSelectProduct, activeSearchQuery, setSearchQuery }: ScannerHeaderProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isSearchingAnim, setIsSearchingAnim] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const matchingResults = activeSearchQuery.trim()
    ? products.filter(p => p.name.toLowerCase().includes(activeSearchQuery.toLowerCase()))
    : products;

  const handleSelect = (prod: Product) => {
    setIsSearchingAnim(true);
    setSearchQuery(prod.name);
    setShowDropdown(false);
    onSelectProduct(prod);
    setTimeout(() => setIsSearchingAnim(false), 500);
  };

  const handleSearchSubmit = () => {
    if (matchingResults.length > 0) {
      handleSelect(matchingResults[0]);
    }
  };

  const formatNaira = (amount: number) => {
    return '₦' + amount.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <header className="relative z-30 w-full mb-8">
      {/* Elegantly Polished Top Glass Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between p-5 md:p-6 rounded-3xl bg-white/70 backdrop-blur-xl border border-slate-200 shadow-lg shadow-slate-100">
        
        {/* Brand Information */}
        <div className="flex items-center gap-4 w-full md:w-auto mb-4 md:mb-0">
          <div className="relative flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500 to-indigo-600 shadow-md border border-white shrink-0">
            <Store className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-display font-extrabold text-xl md:text-2xl tracking-tight text-slate-900">
                Princess Daniella Store
              </h1>
              <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold bg-rose-50 text-rose-700 rounded-full border border-rose-200 uppercase tracking-wider">
                Price Portal
              </span>
            </div>
            <p className="text-xs text-slate-500 font-sans mt-0.5">
              Wholesale Cost Directory &amp; Retail Margin Estimator
            </p>
          </div>
        </div>

        {/* Store Stats & Clock */}
        <div className="flex items-center gap-3 text-xs font-mono text-slate-600 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-4 md:pt-0 border-slate-100">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200">
            <ShoppingBag className="w-4 h-4 text-rose-500" />
            <span className="font-semibold text-slate-800">{products.length} PRODUCTS</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold">
            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </div>
        </div>
      </div>

      {/* Glass Search Panel */}
      <div className="mt-4 p-5 md:p-7 rounded-3xl bg-white/80 backdrop-blur-2xl border border-slate-200 shadow-xl shadow-slate-100 relative overflow-visible">
        
        {/* Soft, beautiful searching visual bar */}
        {isSearchingAnim && (
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-rose-500 to-indigo-500 rounded-t-3xl animate-pulse" />
        )}

        <div className="flex flex-col lg:flex-row gap-4 items-center">
          
          {/* Bigger and Better Search Input Box */}
          <div className="relative w-full flex-1">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="w-5 h-5 text-slate-400" />
            </div>
            <input
              id="goods-name-search-input"
              type="text"
              value={activeSearchQuery}
              onFocus={() => setShowDropdown(true)}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowDropdown(true);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSearchSubmit();
                } else if (e.key === 'Escape') {
                  setShowDropdown(false);
                }
              }}
              placeholder="Search store goods by name (e.g., Milo, Semovita, Gino Tomato, Peak Milk)..."
              className="w-full pl-12 pr-24 py-4 md:py-4.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 font-sans font-medium text-base md:text-lg placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 focus:bg-white transition-all shadow-inner"
            />
            {activeSearchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setShowDropdown(true);
                }}
                className="absolute inset-y-0 right-3 my-auto h-8 px-3 text-xs font-mono bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg transition"
              >
                CLEAR
              </button>
            )}

            {/* Instant Dropdown - Redesigned to be Larger and Better with Thumbnails */}
            {showDropdown && activeSearchQuery.trim().length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-2.5 bg-white/95 backdrop-blur-2xl border border-slate-200/90 rounded-2xl shadow-2xl z-50 max-h-96 overflow-y-auto divide-y divide-slate-100 overflow-hidden ring-1 ring-slate-900/5">
                <div className="px-5 py-3 bg-slate-50 text-[11px] font-mono font-bold text-slate-500 uppercase flex justify-between items-center sticky top-0 backdrop-blur-md border-b border-slate-100">
                  <span className="flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5 text-rose-500" /> MATCHING GOODS ({matchingResults.length})</span>
                  <span>Click to Inspect Pricing</span>
                </div>
                {matchingResults.length === 0 ? (
                  <div className="p-8 text-center text-sm font-sans text-slate-500">
                    No items found matching "{activeSearchQuery}".
                  </div>
                ) : (
                  matchingResults.map((prod) => (
                    <div
                      key={prod.id}
                      onClick={() => handleSelect(prod)}
                      className="p-4 hover:bg-slate-50 transition flex items-center justify-between cursor-pointer group"
                    >
                      <div className="flex items-center gap-4 pr-3">
                        {/* Larger Product Thumbnail Preview */}
                        <div className="w-12 h-12 rounded-xl overflow-hidden border border-slate-200/80 bg-slate-100 shrink-0 shadow-sm">
                          <img
                            src={prod.imageUrl}
                            alt=""
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
                          />
                        </div>
                        <div>
                          <span className="font-sans font-extrabold text-base text-slate-900 block group-hover:text-rose-600 transition">
                            {prod.name}
                          </span>
                          <span className="text-xs font-mono text-slate-500 flex items-center gap-2 mt-0.5">
                            <span className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-600 text-[10px] uppercase font-bold">{prod.category}</span>
                            <span>{prod.page}</span>
                          </span>
                        </div>
                      </div>
                      <div className="text-right shrink-0 flex flex-col gap-0.5 pl-2">
                        <div className="text-xs font-mono text-slate-500">
                          Cost: <span className="font-bold text-slate-900">{formatNaira(prod.cost_price)}</span>
                        </div>
                        <div className="text-xs font-mono">
                          Retail: <span className="font-bold text-emerald-600">{prod.selling_price > 0 ? formatNaira(prod.selling_price) : 'Not Set'}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Elegant Search Button */}
          <div className="flex items-center gap-2 w-full lg:w-auto">
            <button
              onClick={handleSearchSubmit}
              className="w-full lg:w-auto flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-rose-500 to-indigo-600 hover:from-rose-600 hover:to-indigo-700 text-white font-sans font-bold text-base shadow-lg shadow-rose-500/10 active:scale-[0.98] transition cursor-pointer border border-transparent whitespace-nowrap"
            >
              <span>View Product Price</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Quick Check Recommendation Chips */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 mr-1 flex items-center gap-1.5">
            Quick Check:
          </span>
          <button
            onClick={() => {
              setSearchQuery('Semovita 10kg');
              const found = products.find(p => p.name.toLowerCase().includes('semovita 10kg'));
              if (found) handleSelect(found);
            }}
            className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-mono text-slate-700 transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <span className="w-2 h-2 rounded-full bg-indigo-500" /> Semovita 10kg
          </button>
          <button
            onClick={() => {
              setSearchQuery('Milo');
              const found = products.find(p => p.name.toLowerCase() === 'milo');
              if (found) handleSelect(found);
            }}
            className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-mono text-slate-700 transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <span className="w-2 h-2 rounded-full bg-rose-500" /> Milo
          </button>
          <button
            onClick={() => {
              setSearchQuery('Indometable');
              const found = products.find(p => p.name.toLowerCase() === 'indometable');
              if (found) handleSelect(found);
            }}
            className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-mono text-slate-700 transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <span className="w-2 h-2 rounded-full bg-teal-500" /> Indometable
          </button>
          <button
            onClick={() => {
              setSearchQuery('Gino tomato');
              const found = products.find(p => p.name.toLowerCase() === 'gino tomato');
              if (found) handleSelect(found);
            }}
            className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-mono text-slate-700 transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <span className="w-2 h-2 rounded-full bg-amber-500" /> Gino Tomato
          </button>
          <button
            onClick={() => {
              setSearchQuery('Peak Milk');
              const found = products.find(p => p.name.toLowerCase() === 'peak milk');
              if (found) handleSelect(found);
            }}
            className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-mono text-slate-700 transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <span className="w-2 h-2 rounded-full bg-pink-500" /> Peak Milk
          </button>
        </div>
      </div>
    </header>
  );
}

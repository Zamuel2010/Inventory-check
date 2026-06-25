import { useState } from 'react';
import { Product } from '../types';
import { Search, Package, Check, ArrowUpRight, Percent, Sliders, RotateCcw, Sparkles } from 'lucide-react';
import { WHOLESALE_PRODUCTS } from '../data';
import { getProductPrices } from '../utils';

interface CatalogGridProps {
  products: Product[];
  selectedProduct: Product;
  onSelectProduct: (product: Product) => void;
  onUpdateProducts: (updatedList: Product[]) => void;
}

const CATEGORIES = [
  'All Departments',
  'Noodles & Grains',
  'Tomatoes & Spices',
  'Oil & Butter',
  'Beverages & Milk',
  'Snacks & Sweets'
];

export function CatalogGrid({ products, selectedProduct, onSelectProduct, onUpdateProducts }: CatalogGridProps) {
  const [selectedCat, setSelectedCat] = useState('All Departments');
  const [filterText, setFilterText] = useState('');
  const [isBulkEditMode, setIsBulkEditMode] = useState(false);
  const [marginFilter, setMarginFilter] = useState<'all' | 'high' | 'low'>('all');

  const filtered = products.filter(p => {
    const matchCat = selectedCat === 'All Departments' || p.category === selectedCat;
    const matchText = !filterText || 
      p.name.toLowerCase().includes(filterText.toLowerCase()) || 
      p.page.toLowerCase().includes(filterText.toLowerCase());
    
    const prices = getProductPrices(p);
    const profit = prices.profitPerCarton;
    const marginPercent = prices.marginPercentage;

    let matchMargin = true;
    if (marginFilter === 'high') {
      matchMargin = profit > 0 && marginPercent >= 5;
    } else if (marginFilter === 'low') {
      matchMargin = profit <= 0 || marginPercent < 5;
    }

    return matchCat && matchText && matchMargin;
  });

  const formatNaira = (amount: number) => {
    return '₦' + amount.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <section id="warehouse-catalog-grid-section" className="w-full relative z-10">
      
      {/* Section Header & Actions */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5 mb-8">
        <div>
          <h2 className="text-xl md:text-2xl font-sans font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
            <Package className="w-6 h-6 text-rose-500" />
            Store Goods Directory
          </h2>
          <p className="text-xs text-slate-500 font-sans mt-0.5">
            Select any item card below to inspect gross profit calculations or run instant purchase projections.
          </p>
        </div>

        {/* Local Search & Bulk Toggle Controls */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          {/* Local Search Filter */}
          <div className="relative w-full sm:w-60">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5 pointer-events-none" />
            <input
              id="catalog-filter-input"
              type="text"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              placeholder="Search catalog items..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/5 font-sans font-medium shadow-2xs"
            />
          </div>

          {/* Bulk Edit Toggle Button */}
          <button
            onClick={() => setIsBulkEditMode(!isBulkEditMode)}
            className={`w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-mono font-bold transition flex items-center justify-center gap-2 border cursor-pointer shrink-0 ${
              isBulkEditMode
                ? 'bg-amber-100 border-amber-300 text-amber-800 shadow-md shadow-amber-100/10'
                : 'bg-white hover:bg-slate-50 border-slate-250 text-slate-700 shadow-2xs'
            }`}
          >
            <Sliders className="w-4 h-4 text-rose-500" />
            <span>{isBulkEditMode ? 'EXIT BULK EDIT' : 'BULK EDIT PRICES'}</span>
          </button>
        </div>
      </div>

      {/* Advanced Filter Component (Department Categories & Profit Margins) */}
      <div className="flex flex-col gap-4 mb-8 bg-white/50 backdrop-blur-md p-4 rounded-2xl border border-slate-200">
        
        {/* Row 1: Categories list */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-mono text-slate-400 uppercase font-bold tracking-wider">Departments</span>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {CATEGORIES.map((cat, idx) => {
              const active = selectedCat === cat;
              return (
                <button
                  key={idx}
                  id={`category-filter-pill-${idx}`}
                  onClick={() => setSelectedCat(cat)}
                  className={`px-4 py-2 rounded-xl text-xs font-sans whitespace-nowrap transition cursor-pointer border ${
                    active
                      ? 'bg-rose-500 text-white font-extrabold border-rose-500 shadow-md shadow-rose-500/10'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Row 2: Margin Filters (Requested Feature!) */}
        <div className="flex flex-col gap-1.5 pt-3 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-slate-400 uppercase font-bold tracking-wider">Profit Margin Threshold</span>
            <span className="text-[10px] font-mono text-slate-500 font-semibold bg-slate-100 px-2 py-0.5 rounded border border-slate-200">Threshold: 5% Margin</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setMarginFilter('all')}
              className={`px-4 py-2 rounded-xl text-xs font-sans transition cursor-pointer border ${
                marginFilter === 'all'
                  ? 'bg-slate-900 text-white font-extrabold border-slate-900 shadow-xs'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              All Products ({products.filter(p => selectedCat === 'All Departments' || p.category === selectedCat).length})
            </button>
            <button
              onClick={() => setMarginFilter('high')}
              className={`px-4 py-2 rounded-xl text-xs font-sans transition cursor-pointer border flex items-center gap-1.5 ${
                marginFilter === 'high'
                  ? 'bg-emerald-600 text-white font-extrabold border-emerald-600 shadow-xs'
                  : 'bg-white text-emerald-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              High Margin (≥ 5%) ({products.filter(p => {
                const matchCat = selectedCat === 'All Departments' || p.category === selectedCat;
                const prices = getProductPrices(p);
                return matchCat && prices.profitPerCarton > 0 && prices.marginPercentage >= 5;
              }).length})
            </button>
            <button
              onClick={() => setMarginFilter('low')}
              className={`px-4 py-2 rounded-xl text-xs font-sans transition cursor-pointer border flex items-center gap-1.5 ${
                marginFilter === 'low'
                  ? 'bg-rose-500 text-white font-extrabold border-rose-500 shadow-xs'
                  : 'bg-white text-rose-500 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
              Low Margin (&lt; 5%) ({products.filter(p => {
                const matchCat = selectedCat === 'All Departments' || p.category === selectedCat;
                const prices = getProductPrices(p);
                return matchCat && (prices.profitPerCarton <= 0 || prices.marginPercentage < 5);
              }).length})
            </button>
          </div>
        </div>

      </div>

      {/* Bulk Global Adjustments Actions Drawer */}
      {isBulkEditMode && (
        <div className="mb-6 p-5 rounded-2xl bg-amber-50/50 border border-amber-200 shadow-inner">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div>
              <h4 className="text-sm font-sans font-bold text-amber-900 uppercase tracking-tight flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
                Bulk Pricing Action Desk
              </h4>
              <p className="text-xs text-amber-700 font-sans mt-0.5">
                Calculate or adjust pricing for the current filtered view ({filtered.length} products).
              </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
              
              {/* Apply Markup to All */}
              <div className="flex items-center gap-1.5 bg-white px-2 py-1.5 rounded-xl border border-slate-250 shadow-2xs">
                <span className="text-[10px] font-mono text-slate-500 font-bold uppercase">Markup</span>
                <input 
                  type="number" 
                  placeholder="10" 
                  className="w-12 text-center text-xs font-mono font-bold bg-slate-50 border-0 p-1 rounded-lg focus:outline-none focus:ring-1 focus:ring-rose-500"
                  id="bulk-markup-input"
                  defaultValue="10"
                />
                <span className="text-xs font-mono text-slate-500 pr-1">%</span>
                <button
                  onClick={() => {
                    const markupVal = parseFloat((document.getElementById('bulk-markup-input') as HTMLInputElement)?.value || '10') / 100;
                    const updated = products.map(p => {
                      const matchCat = selectedCat === 'All Departments' || p.category === selectedCat;
                      const matchText = !filterText || p.name.toLowerCase().includes(filterText.toLowerCase());
                      const prices = getProductPrices(p);
                      const profit = prices.profitPerCarton;
                      const marginPercent = prices.marginPercentage;
                      let matchMargin = true;
                      if (marginFilter === 'high') {
                        matchMargin = profit > 0 && marginPercent >= 5;
                      } else if (marginFilter === 'low') {
                        matchMargin = profit <= 0 || marginPercent < 5;
                      }

                      if (matchCat && matchText && matchMargin) {
                        return {
                          ...p,
                          selling_price: Math.round(p.cost_price * (1 + markupVal))
                        };
                      }
                      return p;
                    });
                    onUpdateProducts(updated);
                  }}
                  className="px-2.5 py-1 text-[11px] font-mono font-bold bg-rose-500 hover:bg-rose-600 text-white rounded-lg transition shadow-2xs cursor-pointer"
                >
                  Apply
                </button>
              </div>

              {/* Apply Inflation Cost Increase */}
              <div className="flex items-center gap-1.5 bg-white px-2 py-1.5 rounded-xl border border-slate-250 shadow-2xs">
                <span className="text-[10px] font-mono text-slate-500 font-bold uppercase">Inflation</span>
                <input 
                  type="number" 
                  placeholder="5" 
                  className="w-12 text-center text-xs font-mono font-bold bg-slate-50 border-0 p-1 rounded-lg focus:outline-none focus:ring-1 focus:ring-rose-500"
                  id="bulk-inflation-input"
                  defaultValue="5"
                />
                <span className="text-xs font-mono text-slate-500 pr-1">%</span>
                <button
                  onClick={() => {
                    const inflationVal = parseFloat((document.getElementById('bulk-inflation-input') as HTMLInputElement)?.value || '5') / 100;
                    const updated = products.map(p => {
                      const matchCat = selectedCat === 'All Departments' || p.category === selectedCat;
                      const matchText = !filterText || p.name.toLowerCase().includes(filterText.toLowerCase());
                      const prices = getProductPrices(p);
                      const profit = prices.profitPerCarton;
                      const marginPercent = prices.marginPercentage;
                      let matchMargin = true;
                      if (marginFilter === 'high') {
                        matchMargin = profit > 0 && marginPercent >= 5;
                      } else if (marginFilter === 'low') {
                        matchMargin = profit <= 0 || marginPercent < 5;
                      }

                      if (matchCat && matchText && matchMargin) {
                        const nextCost = Math.round(p.cost_price * (1 + inflationVal));
                        const nextSelling = p.selling_price > 0 ? Math.round(p.selling_price * (1 + inflationVal)) : 0;
                        return {
                          ...p,
                          cost_price: nextCost,
                          selling_price: nextSelling
                        };
                      }
                      return p;
                    });
                    onUpdateProducts(updated);
                  }}
                  className="px-2.5 py-1 text-[11px] font-mono font-bold bg-rose-500 hover:bg-rose-600 text-white rounded-lg transition shadow-2xs cursor-pointer"
                >
                  Apply
                </button>
              </div>

              {/* Reset to Defaults */}
              <button
                onClick={() => {
                  if (window.confirm("Restore entire catalog back to system defaults? This will discard any current custom adjustments.")) {
                    onUpdateProducts(WHOLESALE_PRODUCTS);
                  }
                }}
                className="px-3 py-1.5 text-xs font-mono font-bold text-slate-600 hover:text-rose-500 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition flex items-center gap-1 cursor-pointer shadow-2xs"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Catalog</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Grid of Product Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {filtered.map((prod) => {
          const isSelected = prod.id === selectedProduct.id;
          
          const prices = getProductPrices(prod);
          const marginVal = prices.marginPercentage;
          const hasMargin = prices.profitPerCarton > 0;

          return (
            <div
              key={prod.id}
              id={`catalog-product-card-${prod.id}`}
              onClick={() => {
                onSelectProduct(prod);
                document.getElementById('selected-product-bento-grid')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
              className={`group rounded-2xl bg-white border p-4.5 transition-all duration-300 cursor-pointer flex flex-col justify-between relative overflow-hidden shadow-sm ${
                isSelected
                  ? 'border-rose-500 bg-rose-50/20 ring-2 ring-rose-500/20 shadow-md scale-[1.01]'
                  : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/40 hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-100'
              }`}
            >
              {/* Active Selection Pin Indicator */}
              {isSelected && !isBulkEditMode && (
                <div className="absolute top-3 right-3 z-10 w-6 h-6 rounded-full bg-rose-500 text-white flex items-center justify-center shadow">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
              )}

              {/* Photo & Margin Badge */}
              <div className="relative w-full aspect-16/10 rounded-xl overflow-hidden bg-slate-50 mb-3.5 border border-slate-200">
                <img
                  src={prod.imageUrl}
                  alt={prod.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-103 transition duration-500 opacity-95 group-hover:opacity-100"
                />
                <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-white/95 backdrop-blur-md border border-slate-200 shadow-xs text-[10px] font-mono font-bold text-slate-600 uppercase">
                  {prod.page}
                </div>
                {prod.selling_price > 0 && hasMargin && marginVal > 0 && (
                  <div className="absolute bottom-2 right-2 px-2.5 py-0.5 rounded bg-emerald-600 text-white font-bold font-mono text-[10px] shadow-sm flex items-center gap-0.5">
                    <Percent className="w-3 h-3" />
                    <span>{marginVal.toFixed(0)}% Margin</span>
                  </div>
                )}
                {prod.selling_price > 0 && (!hasMargin || marginVal <= 0) && (
                  <div className="absolute bottom-2 right-2 px-2.5 py-0.5 rounded bg-rose-500 text-white font-bold font-mono text-[10px] shadow-sm flex items-center gap-0.5">
                    <span>No Margin</span>
                  </div>
                )}
              </div>

              {/* Text Meta */}
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block font-bold">
                    {prod.category}
                  </span>
                  <h3 className="text-sm font-sans font-extrabold text-slate-900 group-hover:text-rose-600 transition line-clamp-2 mt-0.5">
                    {prod.name}
                  </h3>
                </div>

                {isBulkEditMode ? (
                  /* Bulk Price Adjustment Mode Inputs */
                  <div 
                    className="mt-4 pt-3.5 border-t border-slate-100 grid grid-cols-2 gap-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div>
                      <label className="text-[9px] font-mono text-slate-400 uppercase block font-bold mb-1">Cost Price</label>
                      <input
                        type="number"
                        value={prod.cost_price}
                        onChange={(e) => {
                          const nextVal = Math.max(0, parseInt(e.target.value) || 0);
                          const updated = products.map(p => p.id === prod.id ? { ...p, cost_price: nextVal } : p);
                          onUpdateProducts(updated);
                        }}
                        className="w-full px-2 py-1 bg-slate-50 hover:bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-rose-500/10 focus:border-rose-500"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-mono text-slate-400 uppercase block font-bold mb-1">Selling Price</label>
                      <input
                        type="number"
                        value={prod.selling_price}
                        onChange={(e) => {
                          const nextVal = Math.max(0, parseInt(e.target.value) || 0);
                          const updated = products.map(p => p.id === prod.id ? { ...p, selling_price: nextVal } : p);
                          onUpdateProducts(updated);
                        }}
                        className="w-full px-2 py-1 bg-slate-50 hover:bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold text-emerald-600 focus:outline-none focus:ring-2 focus:ring-rose-500/10 focus:border-rose-500"
                      />
                    </div>
                  </div>
                ) : (
                  /* Standard Mode Static Text display */
                  <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-end justify-between">
                    <div>
                      <span className="text-[10px] font-mono text-slate-400 block uppercase font-bold">Cost &amp; Retail</span>
                      <div className="flex items-baseline gap-1.5 flex-wrap mt-0.5">
                        <span className="text-sm font-sans font-bold text-slate-900">
                          {formatNaira(prod.cost_price)}
                        </span>
                        <span className="text-xs font-mono font-bold text-emerald-600">
                          {prod.selling_price > 0 ? formatNaira(prod.selling_price) : 'Not Set'}
                        </span>
                      </div>
                    </div>

                    <div className="w-8 h-8 rounded-lg bg-slate-50 group-hover:bg-rose-500 border border-slate-200 group-hover:border-rose-500 flex items-center justify-center text-slate-600 group-hover:text-white transition shadow-3xs">
                      <ArrowUpRight className="w-4 h-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </div>
                  </div>
                )}
              </div>

            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="py-20 text-center rounded-2xl bg-white border border-slate-200 p-6 font-mono text-sm text-slate-400 shadow-2xs">
          No shop items match the current filters. Try resetting your search or toggling filter pills.
        </div>
      )}

    </section>
  );
}

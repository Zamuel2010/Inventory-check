import { useState } from 'react';
import { Product } from '../types';
import { Tag, CheckCircle2, ArrowRight, Calculator, Printer, Sparkles, Scale, Percent, Landmark, HelpCircle } from 'lucide-react';
import { getProductPrices } from '../utils';

interface ProductBentoViewProps {
  product: Product;
  onAddToQuote?: (quantity: number, sellType: 'carton' | 'unit', pricePerUnit: number) => void;
}

export function ProductBentoView({ product, onAddToQuote }: ProductBentoViewProps) {
  const [quantity, setQuantity] = useState<number>(1);
  const [isCopiedTag, setIsCopiedTag] = useState(false);
  const [sellType, setSellType] = useState<'carton' | 'unit'>('unit');
  const [unitsPerCarton, setUnitsPerCarton] = useState<number>(product.units_per_carton || 1);
  const [customPrice, setCustomPrice] = useState<number | null>(null);

  // Auto-sync state when product changes
  const [lastProdId, setLastProdId] = useState(product.id);
  if (product.id !== lastProdId) {
    setLastProdId(product.id);
    setSellType('unit');
    setUnitsPerCarton(product.units_per_carton || 1);
    setQuantity(1);
    setCustomPrice(null);
  }

  // Calculate prices based on the dynamic adaptive helper
  const prices = getProductPrices(product, unitsPerCarton);

  const defaultItemSellingPrice = sellType === 'carton' ? prices.cartonSelling : prices.unitSelling;
  const itemSellingPrice = customPrice ?? defaultItemSellingPrice;
  const itemCostPrice = sellType === 'carton' ? prices.cartonCost : prices.unitCost;

  const totalCost = quantity * itemCostPrice;
  const totalSelling = quantity * itemSellingPrice;
  const totalProfit = prices.cartonSelling > 0 ? totalSelling - totalCost : 0;

  // Margin = (Selling - Cost) / Selling
  const marginPercentage = prices.marginPercentage;

  // Markup = (Selling - Cost) / Cost
  const markupPercentage = prices.markupPercentage;

  const formatNaira = (amount: number) => {
    return '₦' + amount.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const handlePrintTag = () => {
    // Generate text template for copying
    const text = `PRODUCT: ${product.name}
TYPE: ${sellType === 'carton' ? 'Carton' : `Unit (1 of ${unitsPerCarton} pcs)`}
COST: ${formatNaira(itemCostPrice)}
SELLING: ${formatNaira(itemSellingPrice)}
QTY: ${quantity}
TOTAL COST: ${formatNaira(totalCost)}
EST. REVENUE: ${formatNaira(totalSelling)}
EST. NET PROFIT: ${formatNaira(totalProfit)}
CATEGORY: ${product.category}`;
    
    navigator.clipboard.writeText(text).then(() => {
      setIsCopiedTag(true);
      setTimeout(() => setIsCopiedTag(false), 2000);
    });
  };

  return (
    <div id="selected-product-bento-grid" className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 mb-10">
      
      {/* 1. LEFT BENTO: Product Photo & Shop Metadata (Col 1-5) */}
      <div id="bento-product-media-card" className="lg:col-span-5 rounded-3xl bg-white/80 backdrop-blur-2xl border border-slate-200/90 p-6 flex flex-col justify-between shadow-xl shadow-slate-200/50 relative overflow-hidden group">
        
        {/* Ambient background glow */}
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Top Badges */}
        <div className="flex items-center justify-between gap-2 z-10 mb-4">
          <span className="px-3 py-1 rounded-full bg-slate-50 border border-slate-200 text-xs font-mono text-slate-600 uppercase tracking-wider flex items-center gap-1.5 font-semibold">
            <Tag className="w-3.5 h-3.5 text-rose-500" />
            SKU ID: {product.id.toUpperCase()}
          </span>
          <span className="px-3 py-1 rounded-full bg-rose-50 border border-rose-100 text-xs font-mono text-rose-700 font-bold flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-rose-500" />
            {product.page}
          </span>
        </div>

        {/* Image Frame */}
        <div className="relative w-full aspect-4/3 rounded-2xl overflow-hidden border border-slate-200/80 shadow-inner bg-slate-50 my-auto">
          <img
            src={product.imageUrl}
            alt={product.name}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover group-hover:scale-103 transition duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 via-transparent to-transparent opacity-40" />
          
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
            <div className="px-3 py-1.5 rounded-xl bg-white/95 backdrop-blur-md border border-slate-200/60 text-xs text-slate-800 shadow-sm font-bold">
              Category: {product.category}
            </div>
          </div>
        </div>

        {/* Product Title & Category */}
        <div className="mt-5 z-10">
          <p className="text-xs uppercase tracking-widest font-mono text-rose-600 font-bold mb-1">
            Store Collection • {product.category}
          </p>
          <h2 className="text-xl md:text-2xl font-display font-black text-slate-900 leading-tight">
            {product.name}
          </h2>

          {product.notes && (
            <div className="mt-3 pt-3 border-t border-slate-100">
              <span className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200">
                ⚠️ {product.notes}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 2. RIGHT BENTO: Pricing & Profit Analytics (Col 6-12) */}
      <div id="bento-price-display-card" className="lg:col-span-7 flex flex-col gap-6">
        
        {/* Main Price Highlight Box */}
        <div className="rounded-3xl bg-gradient-to-br from-rose-50/50 via-white to-indigo-50/30 backdrop-blur-2xl border border-slate-200 p-6 md:p-8 shadow-xl shadow-slate-200/40 relative overflow-hidden flex flex-col justify-between">
          
          <div className="absolute top-0 right-0 w-80 h-80 bg-rose-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div>
              <span className="text-xs font-mono text-slate-400 font-bold uppercase tracking-widest block mb-1">
                Wholesale Cost Price
              </span>
              <div className="flex items-baseline gap-3">
                <span className="text-3xl md:text-4xl font-display font-black tracking-tight text-slate-900">
                  {formatNaira(product.cost_price)}
                </span>
                <span className="text-xs font-mono text-slate-400">/ unit</span>
              </div>
            </div>

            {/* Retail MSRP Comparison Badge */}
            <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm text-right w-full sm:w-auto">
              <span className="text-[11px] font-mono text-rose-600 uppercase tracking-wider block font-bold">
                Retail Selling Price
              </span>
              <div className="flex items-center sm:justify-end gap-2 mt-0.5">
                <span className="text-2xl font-mono font-bold text-slate-900">
                  {product.selling_price > 0 ? formatNaira(product.selling_price) : 'NOT SET'}
                </span>
              </div>
            </div>
          </div>

          {/* Margins and markup statistics */}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold font-mono">Gross Profit Margin</span>
                <span className={`text-xl font-display font-bold mt-1 block ${marginPercentage > 0 ? 'text-emerald-600' : 'text-slate-400'}`}>
                  {product.selling_price > 0 ? `${marginPercentage.toFixed(1)}%` : 'N/A'}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <Percent className="w-5 h-5 text-rose-500" />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold font-mono">Markup on Cost</span>
                <span className={`text-xl font-display font-bold mt-1 block ${markupPercentage > 0 ? 'text-rose-500' : 'text-slate-400'}`}>
                  {product.selling_price > 0 ? `${markupPercentage.toFixed(1)}%` : 'N/A'}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <Landmark className="w-5 h-5 text-rose-500" />
              </div>
            </div>

          </div>

          <p className="mt-4 text-xs font-sans text-slate-500 flex items-center gap-1.5 bg-slate-50 p-2.5 rounded-xl border border-slate-150">
            <HelpCircle className="w-4 h-4 text-slate-400 shrink-0" />
            Margin is profit relative to sales price; markup is profit relative to your wholesale cost.
          </p>
        </div>
      </div>

      {/* 3. BOTTOM BENTO: Interactive Shop Volume calculator */}
      <div id="bento-calculator-card" className="lg:col-span-12 rounded-3xl bg-white/80 backdrop-blur-2xl border border-slate-200 p-6 md:p-8 shadow-xl shadow-slate-100 relative overflow-hidden">
        
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
          
          {/* Quantity Input */}
          <div className="w-full lg:w-1/3">
            {/* Carton vs Unit Selector */}
            <div className="grid grid-cols-2 gap-2 mb-3 bg-slate-100 p-1 rounded-xl text-xs font-mono font-bold">
              <button
                type="button"
                onClick={() => setSellType('carton')}
                className={`py-2 rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer ${sellType === 'carton' ? 'bg-white text-rose-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
              >
                <span>📦 CARTON</span>
              </button>
              <button
                type="button"
                onClick={() => setSellType('unit')}
                className={`py-2 rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer ${sellType === 'unit' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
              >
                <span>✏️ SINGLE UNIT</span>
              </button>
            </div>

            {/* Manual Price Override */}
            <div className="mb-4 bg-amber-50/50 border border-amber-100 p-3 rounded-2xl text-xs">
              <div className="flex items-center justify-between font-mono text-[10px] text-amber-700 font-bold mb-2 uppercase tracking-wider">
                <span>Price Adjustment (₦)</span>
                {customPrice !== null && (
                  <button 
                    onClick={() => setCustomPrice(null)}
                    className="text-[9px] bg-amber-200 hover:bg-amber-300 px-1.5 py-0.5 rounded transition"
                  >
                    RESET TO DEFAULT
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  type="number"
                  value={itemSellingPrice}
                  onChange={(e) => setCustomPrice(parseFloat(e.target.value) || 0)}
                  className="w-full pl-8 pr-3 py-2 bg-white border border-amber-200 rounded-xl font-mono text-slate-800 font-bold focus:outline-amber-500 focus:border-amber-400"
                />
                <Tag className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-amber-500" />
              </div>
              <p className="text-[9px] text-amber-600 mt-1.5 font-mono italic">
                {customPrice === null ? 'Using default system price.' : 'Custom price applied for this sale.'}
              </p>
            </div>

            <label htmlFor="quote-quantity" className="flex items-center justify-between text-xs font-mono text-slate-600 font-bold uppercase tracking-wider mb-2">
              <span className="flex items-center gap-1.5 text-rose-500">
                <Calculator className="w-4 h-4" /> Calculate Volume Projections
              </span>
              <span className="text-slate-800">{quantity} {sellType === 'carton' ? 'cartons' : 'units'}</span>
            </label>

            <div className="flex items-center gap-3">
              <button
                id="qty-decrease-btn"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-12 h-12 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 font-mono text-xl font-bold border border-slate-250 transition flex items-center justify-center cursor-pointer active:scale-95 shadow-2xs"
              >
                -
              </button>
              <div className="relative flex-1">
                <input
                  id="quote-quantity"
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full py-3 text-center font-mono text-xl font-bold bg-slate-50 rounded-xl border border-rose-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500/10 focus:border-rose-300 focus:bg-white shadow-inner"
                />
                <span className="absolute right-3 top-3 text-xs font-mono font-bold text-slate-400 pointer-events-none">
                  QTY
                </span>
              </div>
              <button
                id="qty-increase-btn"
                onClick={() => setQuantity(quantity + 1)}
                className="w-12 h-12 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 font-mono text-xl font-bold border border-slate-250 transition flex items-center justify-center cursor-pointer active:scale-95 shadow-2xs"
              >
                +
              </button>
            </div>

            {/* Quick Presets */}
            <div className="flex items-center gap-2 mt-3 text-xs font-mono">
              <span className="text-slate-400 text-[10px] font-bold">PRESETS:</span>
              <button onClick={() => setQuantity(1)} className="px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 font-medium border border-slate-200 cursor-pointer">1</button>
              <button onClick={() => setQuantity(5)} className="px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 font-medium border border-slate-200 cursor-pointer">5</button>
              <button onClick={() => setQuantity(12)} className="px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 font-medium border border-slate-200 cursor-pointer">12 (Doz)</button>
              <button onClick={() => setQuantity(50)} className="px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 font-medium border border-slate-200 cursor-pointer">50</button>
            </div>
          </div>

          {/* Projection Stats */}
          <div className="w-full lg:w-1/3 grid grid-cols-2 gap-4 border-y lg:border-y-0 lg:border-x border-slate-200 py-4 lg:py-0 lg:px-6 font-mono">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Est. Revenue</span>
              <span className={`text-base font-bold block ${product.selling_price > 0 ? 'text-slate-900' : 'text-slate-400'}`}>
                {product.selling_price > 0 ? formatNaira(totalSelling) : 'NOT DETERMINED'}
              </span>
              <span className="text-[10px] text-slate-500 font-sans block">At selected rate</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Est. Net Profit</span>
              <span className="text-base font-bold text-emerald-600 block">
                {product.selling_price > 0 ? `+${formatNaira(totalProfit)}` : '₦0.00'}
              </span>
              <span className="text-[10px] text-slate-500 font-sans block">Margin gains</span>
            </div>
          </div>

          {/* Actions & Sums */}
          <div className="w-full lg:w-1/3 flex flex-col sm:flex-row lg:flex-col xl:flex-row items-center justify-between gap-4">
            <div className="text-center sm:text-left lg:text-center xl:text-left">
              <span className="text-[11px] font-mono text-slate-400 font-bold uppercase block">Total Cost</span>
              <div className="text-3xl font-display font-black text-slate-900">
                {formatNaira(totalCost)}
              </div>
              <span className="text-[10px] font-mono text-rose-500 font-semibold">
                ({quantity} {sellType === 'carton' ? 'cartons' : 'units'} @ {formatNaira(itemCostPrice)}/ea)
              </span>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                id="print-warehouse-tag-btn"
                onClick={handlePrintTag}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-250 text-slate-700 font-mono text-xs font-bold transition cursor-pointer active:scale-95 shadow-2xs"
              >
                <Printer className="w-4 h-4 text-slate-500" />
                <span>{isCopiedTag ? 'COPIED!' : 'COPY DATA'}</span>
              </button>

              <button
                id="add-to-wholesale-quote-btn"
                onClick={() => onAddToQuote && onAddToQuote(quantity, sellType, itemSellingPrice)}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-rose-500 to-indigo-600 hover:from-rose-600 hover:to-indigo-700 text-white font-sans font-extrabold text-sm shadow-md transition cursor-pointer active:scale-95"
              >
                <span>ADD TO ORDER</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>
      </div>


    </div>
  );
}

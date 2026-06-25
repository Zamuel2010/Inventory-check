/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Product, QuoteItem } from './types';
import { WHOLESALE_PRODUCTS } from './data';
import { ScannerHeader } from './components/ScannerHeader';
import { ProductBentoView } from './components/ProductBentoView';
import { CatalogGrid } from './components/CatalogGrid';
import { QuoteTray } from './components/QuoteTray';
import { getPersistedStoreAccountId } from './firebase';
import DebtLedger from './components/DebtLedger';
import DigitalInvoices from './components/DigitalInvoices';
import { getProductPrices } from './utils';

export default function App() {
  const [products, setProducts] = useState<Product[]>(WHOLESALE_PRODUCTS);
  // Default selected product ID is the first item (Mimi 70g)
  const [selectedProductId, setSelectedProductId] = useState<string>(WHOLESALE_PRODUCTS[0].id);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [quoteItems, setQuoteItems] = useState<QuoteItem[]>([]);
  const [scanToast, setScanToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  // Sync / navigation states
  const [storeAccountId, setStoreAccountId] = useState<string | null>(getPersistedStoreAccountId());
  const [activeTab, setActiveTab] = useState<'calculator' | 'ledger' | 'invoices'>('calculator');

  const selectedProduct = products.find(p => p.id === selectedProductId) || products[0];

  // Handle adding units/cartons to the active manifest
  const handleAddToQuote = (quantity: number, sellType: 'carton' | 'unit', pricePerUnitSelling: number) => {
    const prices = getProductPrices(selectedProduct);
    const pricePerUnitCost = sellType === 'carton' ? prices.cartonCost : prices.unitCost;
    const currentUnitsPerCarton = selectedProduct.units_per_carton || 1;

    const totalCost = quantity * pricePerUnitCost;
    const totalSelling = quantity * pricePerUnitSelling;

    setQuoteItems(prev => {
      const existingIdx = prev.findIndex(item => item.product.id === selectedProduct.id && item.sellType === sellType);
      if (existingIdx >= 0) {
        // Update existing item quantity
        const newQty = prev[existingIdx].quantity + quantity;
        const newCost = newQty * pricePerUnitCost;
        const newSelling = newQty * pricePerUnitSelling;

        const updated = [...prev];
        updated[existingIdx] = {
          product: selectedProduct,
          quantity: newQty,
          sellType,
          unitsPerCarton: currentUnitsPerCarton,
          pricePerItem: pricePerUnitSelling,
          totalCost: newCost,
          totalSelling: newSelling
        };
        return updated;
      } else {
        // Add fresh item
        return [...prev, {
          product: selectedProduct,
          quantity,
          sellType,
          unitsPerCarton: currentUnitsPerCarton,
          pricePerItem: pricePerUnitSelling,
          totalCost,
          totalSelling
        }];
      }
    });

    setScanToast({
      msg: `Added to Estimate: ${quantity} ${sellType === 'carton' ? 'carton(s)' : 'unit(s)'} of ${selectedProduct.name}`,
      type: 'success'
    });
    setTimeout(() => setScanToast(null), 3000);
  };

  const handleRemoveQuoteItem = (productId: string) => {
    setQuoteItems(prev => prev.filter(item => item.product.id !== productId));
  };

  const handleClearQuote = () => {
    setQuoteItems([]);
  };

  return (
    <div className="min-h-screen bg-[#faf8f7] bg-grid-pattern relative overflow-x-hidden pb-24 text-slate-900">
      
      {/* Ambient warm glassmorphic glowing blobs */}
      <div className="fixed top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-gradient-to-r from-rose-500/10 via-amber-500/5 to-indigo-500/10 blur-[120px] rounded-full pointer-events-none z-0" />

      {/* Instant Scan Toast Alert */}
      {scanToast && (
        <div className="fixed top-6 right-6 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className={`px-5 py-3.5 rounded-2xl backdrop-blur-2xl border font-mono text-xs font-semibold shadow-2xl flex items-center gap-2.5 ${
            scanToast.type === 'success'
              ? 'bg-white/90 border-emerald-500/50 text-emerald-800 ring-1 ring-emerald-500/30 shadow-emerald-500/10'
              : 'bg-white/90 border-rose-500/50 text-rose-800 ring-1 ring-rose-500/30 shadow-rose-500/10'
          }`}>
            <span className={`w-2.5 h-2.5 rounded-full ${scanToast.type === 'success' ? 'bg-emerald-500 animate-ping' : 'bg-rose-500'}`} />
            <span>{scanToast.msg}</span>
          </div>
        </div>
      )}

      {/* Main Container Layout */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 relative z-10">
        
        {/* 1. Header & Goods Name Search */}
        <ScannerHeader
          products={products}
          onSelectProduct={(prod) => setSelectedProductId(prod.id)}
          activeSearchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />

        {/* Tab Switcher - Added for Debt Ledger & Digital Invoice Navigation */}
        <div className="flex items-center justify-center gap-2 mb-8 bg-white/60 backdrop-blur-md p-1.5 rounded-2xl border border-slate-200/80 max-w-lg mx-auto relative z-10 shadow-xs print:hidden">
          <button
            onClick={() => setActiveTab('calculator')}
            className={`flex-1 py-2.5 px-3 rounded-xl text-[11px] font-sans font-extrabold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
              activeTab === 'calculator'
                ? 'bg-rose-500 text-white shadow-md shadow-rose-500/15'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white'
            }`}
          >
            Price Checker
          </button>
          <button
            onClick={() => setActiveTab('invoices')}
            className={`flex-1 py-2.5 px-3 rounded-xl text-[11px] font-sans font-extrabold uppercase tracking-wider transition-all duration-200 cursor-pointer relative ${
              activeTab === 'invoices'
                ? 'bg-rose-500 text-white shadow-md shadow-rose-500/15'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white'
            }`}
          >
            Invoices &amp; Billing
            {quoteItems.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-indigo-600 text-white font-mono text-[9px] font-bold w-4.5 h-4.5 rounded-full flex items-center justify-center shadow-md animate-bounce">
                {quoteItems.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('ledger')}
            className={`flex-1 py-2.5 px-3 rounded-xl text-[11px] font-sans font-extrabold uppercase tracking-wider transition-all duration-200 cursor-pointer relative ${
              activeTab === 'ledger'
                ? 'bg-rose-500 text-white shadow-md shadow-rose-500/15'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white'
            }`}
          >
            Debt Ledger
            {storeAccountId && (
              <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
              </span>
            )}
          </button>
        </div>

        {activeTab === 'calculator' ? (
          <>
            {/* 2. Glassmorphic Bento Grid (Selected Item details, Price breakdown, & Markup/Margin Calculator) */}
            <ProductBentoView
              product={selectedProduct}
              onAddToQuote={handleAddToQuote}
            />

            {/* 3. Catalog Inventory Deck */}
            <CatalogGrid
              products={products}
              selectedProduct={selectedProduct}
              onSelectProduct={(prod) => setSelectedProductId(prod.id)}
              onUpdateProducts={setProducts}
            />
          </>
        ) : activeTab === 'invoices' ? (
          /* Digital Invoices Section */
          <DigitalInvoices
            storeAccountId={storeAccountId}
            quoteItems={quoteItems}
            onUpdateQuote={setQuoteItems}
            onClearQuote={handleClearQuote}
            onAccountChange={setStoreAccountId}
          />
        ) : (
          /* 4. Live-Synced Debt Ledger Section */
          <DebtLedger
            storeAccountId={storeAccountId}
            onAccountChange={setStoreAccountId}
          />
        )}

      </main>

      {/* 4. Active Floating Order Manifest Tray */}
      <QuoteTray
        quoteItems={quoteItems}
        onRemoveItem={handleRemoveQuoteItem}
        onClearQuote={handleClearQuote}
        onCheckout={() => setActiveTab('invoices')}
      />


    </div>
  );
}

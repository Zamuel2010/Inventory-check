import { useState, useEffect, FormEvent } from 'react';
import { QuoteItem, Invoice, InvoiceItem } from '../types';
import { 
  saveInvoice, 
  subscribeToInvoices, 
  deleteInvoice, 
  saveDebt 
} from '../firebase';
import { 
  FileText, 
  Search, 
  Printer, 
  Trash2, 
  Check, 
  CheckCircle2, 
  User, 
  Phone, 
  Coins, 
  Copy, 
  Calendar, 
  TrendingUp, 
  AlertCircle, 
  Clock, 
  HeartHandshake, 
  Share2 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface DigitalInvoicesProps {
  storeAccountId: string | null;
  quoteItems: QuoteItem[];
  onUpdateQuote?: (items: QuoteItem[] | ((prev: QuoteItem[]) => QuoteItem[])) => void;
  onClearQuote: () => void;
  onAccountChange: (storeId: string | null) => void;
}

export default function DigitalInvoices({ 
  storeAccountId, 
  quoteItems, 
  onUpdateQuote,
  onClearQuote,
  onAccountChange 
}: DigitalInvoicesProps) {
  // Sync states
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form states for new Invoice
  const [customerName, setCustomerName] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<'fully_paid' | 'unpaid' | 'partial_paid'>('fully_paid');
  const [amountPaidInput, setAmountPaidInput] = useState('');
  const [autoAddDebt, setAutoAddDebt] = useState(true);
  const [invoiceNotes, setInvoiceNotes] = useState('');

  // Invoice Layout Customization (persisted in localStorage)
  const [shopName, setShopName] = useState(() => localStorage.getItem('princess_inv_shop_name') || 'Princess Daniella Store');
  const [shopPhone, setShopPhone] = useState(() => localStorage.getItem('princess_inv_shop_phone') || '+234 803 000 0000');
  const [receiptFooter, setReceiptFooter] = useState(() => localStorage.getItem('princess_inv_footer') || 'Thank you for your patronage! Goods sold in good condition are not returnable.');

  // List filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'yesterday' | 'month'>('all');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  
  // Account settings state
  const [accountInput, setAccountInput] = useState('');
  const [showSettings, setShowSettings] = useState(false);

  // Copy/Print feedbacks
  const [copiedInvoiceId, setCopiedInvoiceId] = useState<string | null>(null);

  // Save shop configuration to local storage on changes
  useEffect(() => {
    localStorage.setItem('princess_inv_shop_name', shopName);
  }, [shopName]);
  
  useEffect(() => {
    localStorage.setItem('princess_inv_shop_phone', shopPhone);
  }, [shopPhone]);
  
  useEffect(() => {
    localStorage.setItem('princess_inv_footer', receiptFooter);
  }, [receiptFooter]);

  // Subscribe to real-time invoices when storeAccountId is available
  useEffect(() => {
    if (!storeAccountId) return;

    setLoading(true);
    const unsubscribe = subscribeToInvoices(
      storeAccountId,
      (fetchedInvoices) => {
        setInvoices(fetchedInvoices);
        setLoading(false);
        setErrorMsg(null);
      },
      (err) => {
        setErrorMsg('Could not fetch invoices. Check permissions.');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [storeAccountId]);

  const totalCost = quoteItems.reduce((sum, item) => sum + item.totalCost, 0);
  const totalSelling = quoteItems.reduce((sum, item) => sum + item.totalSelling, 0);
  const totalProfit = totalSelling > totalCost ? totalSelling - totalCost : 0;

  // Handle amount paid calculation
  const amountPaid = paymentStatus === 'fully_paid' 
    ? totalSelling 
    : paymentStatus === 'unpaid' 
      ? 0 
      : Math.min(totalSelling, Number(amountPaidInput) || 0);

  const outstandingBalance = totalSelling - amountPaid;

  const formatNaira = (amount: number) => {
    return '₦' + amount.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const handleLogin = (e: FormEvent) => {
    e.preventDefault();
    if (accountInput.trim()) {
      const cleanId = accountInput.trim().toLowerCase().replace(/[^a-z0-9_\-]/g, '_');
      onAccountChange(cleanId);
    }
  };

  const handleCreateInvoice = async (e: FormEvent) => {
    e.preventDefault();
    if (!storeAccountId) return;
    if (quoteItems.length === 0) return;

    const trimmedCustomer = customerName.trim() || 'Walk-in Customer';
    const invoiceId = 'INV_' + Date.now().toString().slice(-8) + Math.floor(Math.random() * 10);

    const invoiceItems: InvoiceItem[] = quoteItems.map(item => ({
      productId: item.product.id,
      productName: item.product.name,
      sellType: item.sellType,
      quantity: item.quantity,
      unitsPerCarton: item.unitsPerCarton,
      pricePerItem: item.pricePerItem,
      costPricePerItem: item.sellType === 'carton' ? item.product.cost_price : (item.product.cost_price / item.unitsPerCarton),
      totalCost: item.totalCost,
      totalSelling: item.totalSelling
    }));

    const newInvoice: Omit<Invoice, 'createdAt' | 'updatedAt'> = {
      id: invoiceId,
      customerName: trimmedCustomer,
      items: invoiceItems,
      totalCost,
      totalSelling,
      totalProfit,
      amountPaid,
      paymentStatus,
      notes: invoiceNotes,
      shopName,
      shopPhone
    };

    try {
      // 1. Save digital invoice in Firestore
      await saveInvoice(storeAccountId, newInvoice);

      // 2. If unpaid or partial, auto-add to Debt Ledger if checked
      if ((paymentStatus === 'unpaid' || paymentStatus === 'partial_paid') && autoAddDebt && outstandingBalance > 0) {
        const debtId = 'DEBT_' + Date.now().toString().slice(-8);
        await saveDebt(storeAccountId, {
          id: debtId,
          customerName: trimmedCustomer,
          amount: outstandingBalance,
          notes: `Created automatically from Invoice ${invoiceId} (${invoiceItems.map(i => `${i.quantity} ${i.sellType === 'carton' ? 'ctn' : 'pcs'} of ${i.productName}`).join(', ')})`
        });
      }

      // 3. Clear quote, reset state, and show success
      onClearQuote();
      setCustomerName('');
      setPaymentStatus('fully_paid');
      setAmountPaidInput('');
      setInvoiceNotes('');
      
      // Auto-open the generated invoice for viewing/sharing
      const tempInv: Invoice = {
        ...newInvoice,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      setSelectedInvoice(tempInv);
      
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error(err);
      setErrorMsg('Error generating digital invoice.');
    }
  };

  const handleDeleteInvoice = async (id: string) => {
    if (!storeAccountId) return;
    if (confirm('Are you sure you want to permanently delete this invoice record?')) {
      try {
        await deleteInvoice(storeAccountId, id);
        if (selectedInvoice?.id === id) {
          setSelectedInvoice(null);
        }
      } catch (err) {
        setErrorMsg('Error deleting invoice.');
      }
    }
  };

  const handleCopyTextInvoice = (inv: Invoice) => {
    const header = `📝 RECEIPT: ${inv.shopName || 'Princess Daniella Store'}\n📞 Contact: ${inv.shopPhone || ''}\n----------------------------------\nInvoice ID: ${inv.id}\nDate: ${new Date(inv.createdAt).toLocaleString()}\nCustomer: ${inv.customerName}\n----------------------------------\n`;
    
    const itemsText = inv.items.map((item, idx) => {
      const typeLabel = item.sellType === 'carton' ? 'Carton' : 'Unit';
      return `${idx + 1}. ${item.productName}\n   ${item.quantity} ${typeLabel}(s) @ ${formatNaira(item.pricePerItem)}/ea\n   Subtotal: ${formatNaira(item.totalSelling)}`;
    }).join('\n\n');

    const summary = `\n----------------------------------\nTOTAL: ${formatNaira(inv.totalSelling)}\nAMOUNT PAID: ${formatNaira(inv.amountPaid)}\nOUTSTANDING: ${formatNaira(inv.totalSelling - inv.amountPaid)}\nSTATUS: ${inv.paymentStatus === 'fully_paid' ? 'Paid' : inv.paymentStatus === 'unpaid' ? 'Unpaid' : 'Partially Paid'}\n----------------------------------\n${receiptFooter}`;

    const textToCopy = header + itemsText + summary;

    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopiedInvoiceId(inv.id);
      setTimeout(() => setCopiedInvoiceId(null), 2500);
    });
  };

  const handlePrint = () => {
    window.print();
  };

  // Filter invoices
  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = inv.customerName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          inv.id.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;

    if (dateFilter === 'all') return true;

    const invDate = new Date(inv.createdAt);
    const today = new Date();
    
    if (dateFilter === 'today') {
      return invDate.toDateString() === today.toDateString();
    } else if (dateFilter === 'yesterday') {
      const yesterday = new Date();
      yesterday.setDate(today.getDate() - 1);
      return invDate.toDateString() === yesterday.toDateString();
    } else if (dateFilter === 'month') {
      return invDate.getMonth() === today.getMonth() && invDate.getFullYear() === today.getFullYear();
    }

    return true;
  });

  // Calculate day metrics
  const todayInvoices = invoices.filter(inv => {
    return new Date(inv.createdAt).toDateString() === new Date().toDateString();
  });

  const todayRevenue = todayInvoices.reduce((sum, inv) => sum + inv.totalSelling, 0);
  const todayProfit = todayInvoices.reduce((sum, inv) => sum + inv.totalProfit, 0);
  const todayOutstanding = todayInvoices.reduce((sum, inv) => sum + (inv.totalSelling - inv.amountPaid), 0);

  if (!storeAccountId) {
    return (
      <div id="invoice-login-screen" className="max-w-md mx-auto my-12 p-8 rounded-3xl bg-white border border-slate-200 shadow-2xl relative overflow-hidden text-center">
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-rose-500 to-indigo-600" />
        
        <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-rose-100">
          <FileText className="w-8 h-8 text-rose-500" />
        </div>

        <h2 className="text-2xl font-display font-black text-slate-950 mb-2">Connect Store Account</h2>
        <p className="text-sm text-slate-500 mb-6 leading-relaxed">
          Invoices are safely synchronized on the cloud so you can view, edit, and account for your sales from any phone. Enter your store account name below.
        </p>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-mono font-bold text-slate-600 text-left uppercase mb-1.5">Store Account ID</label>
            <input
              type="text"
              required
              placeholder="e.g. princess"
              value={accountInput}
              onChange={(e) => setAccountInput(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-250 rounded-xl font-mono text-center text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/10 focus:border-rose-400"
            />
          </div>
          <button
            type="submit"
            className="w-full py-3.5 bg-gradient-to-r from-rose-500 to-indigo-600 text-white rounded-xl font-sans font-extrabold text-sm shadow-md hover:from-rose-600 hover:to-indigo-700 transition cursor-pointer"
          >
            CONFIRM STORE ACCESS
          </button>
        </form>
      </div>
    );
  }

  return (
    <div id="digital-invoice-ledger-module" className="space-y-8 relative z-10 print:bg-white print:p-0">
      
      {/* 1. SHOP LEDGER METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 print:hidden">
        
        <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-lg shadow-slate-100/50 flex items-center justify-between">
          <div>
            <span className="text-slate-500 text-[10px] uppercase font-bold font-mono tracking-wider block">Today's Total Sales</span>
            <span className="text-2xl font-display font-black text-slate-900 mt-1 block">
              {formatNaira(todayRevenue)}
            </span>
            <span className="text-xs text-slate-500 font-sans mt-0.5 block">
              {todayInvoices.length} invoices generated
            </span>
          </div>
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-100/50">
            <Coins className="w-6 h-6 text-rose-500" />
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-lg shadow-slate-100/50 flex items-center justify-between">
          <div>
            <span className="text-slate-500 text-[10px] uppercase font-bold font-mono tracking-wider block">Today's Estimated Profit</span>
            <span className="text-2xl font-display font-black text-emerald-600 mt-1 block">
              +{formatNaira(todayProfit)}
            </span>
            <span className="text-xs text-slate-500 font-sans mt-0.5 block">
              Net margin gains
            </span>
          </div>
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-100/50">
            <TrendingUp className="w-6 h-6 text-emerald-600" />
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-lg shadow-slate-100/50 flex items-center justify-between">
          <div>
            <span className="text-slate-500 text-[10px] uppercase font-bold font-mono tracking-wider block">Today's Pending Credit</span>
            <span className={`text-2xl font-display font-black mt-1 block ${todayOutstanding > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
              {formatNaira(todayOutstanding)}
            </span>
            <span className="text-xs text-slate-500 font-sans mt-0.5 block">
              Outstanding payments
            </span>
          </div>
          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-100/50">
            <AlertCircle className="w-6 h-6 text-amber-500" />
          </div>
        </div>

      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-100 text-rose-800 text-xs font-mono flex items-center gap-2">
          <AlertCircle className="w-4 h-4" /> {errorMsg}
        </div>
      )}

      {/* 2. LIVE SCREEN LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: ACTIVE INVOICE CREATION OR SELECTED PREVIEW */}
        <div className="lg:col-span-7 space-y-6 print:col-span-12">
          
          <AnimatePresence mode="wait">
            
            {/* INVOICE DISPLAY MODE */}
            {selectedInvoice ? (
              <motion.div
                key="invoice-viewer"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="rounded-3xl bg-white border border-slate-250 p-6 md:p-8 shadow-2xl relative overflow-hidden print:border-none print:shadow-none print:p-0"
              >
                {/* Print Banner indicator */}
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-rose-500 via-amber-500 to-indigo-600 print:hidden" />
                
                {/* Printable Invoice Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
                  <div>
                    <h2 className="text-2xl font-sans font-black text-slate-900 tracking-tight uppercase">
                      {selectedInvoice.shopName || 'PRINCESS DANIELLA STORE'}
                    </h2>
                    {selectedInvoice.shopPhone && (
                      <p className="text-xs font-mono text-slate-500 mt-1 flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400 shrink-0" /> {selectedInvoice.shopPhone}
                      </p>
                    )}
                  </div>
                  <div className="text-left md:text-right font-mono">
                    <span className="px-3 py-1 text-[10px] font-bold uppercase rounded-full bg-slate-100 text-slate-700 border border-slate-200 inline-block mb-1.5">
                      DIGITAL INVOICE
                    </span>
                    <p className="text-xs font-bold text-slate-900">ID: {selectedInvoice.id}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {new Date(selectedInvoice.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Customer Details block */}
                <div className="my-6 p-4 rounded-2xl bg-slate-50/70 border border-slate-150 flex flex-col sm:flex-row justify-between gap-4 font-mono text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider">BILLED TO</span>
                    <span className="text-sm font-sans font-extrabold text-slate-900 mt-1 block uppercase flex items-center gap-1.5">
                      <User className="w-4 h-4 text-slate-400" /> {selectedInvoice.customerName}
                    </span>
                  </div>
                  <div className="sm:text-right">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider">PAYMENT STATUS</span>
                    <span className={`inline-block mt-1 px-3 py-1 font-bold uppercase rounded-lg text-[10px] ${
                      selectedInvoice.paymentStatus === 'fully_paid'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : selectedInvoice.paymentStatus === 'unpaid'
                          ? 'bg-rose-50 text-rose-800 border border-rose-200'
                          : 'bg-amber-50 text-amber-800 border border-amber-200'
                    }`}>
                      {selectedInvoice.paymentStatus === 'fully_paid' ? 'FULLY PAID' : selectedInvoice.paymentStatus === 'unpaid' ? 'UNPAID / DEBT' : 'PARTIALLY PAID'}
                    </span>
                  </div>
                </div>

                {/* Items List Table */}
                <div className="space-y-3 font-mono text-xs my-6">
                  <div className="hidden sm:grid grid-cols-12 pb-2 text-[10px] font-bold uppercase text-slate-400 tracking-wider border-b border-slate-200">
                    <span className="col-span-6">Product Description</span>
                    <span className="col-span-2 text-center">Unit Price</span>
                    <span className="col-span-2 text-center">Qty</span>
                    <span className="col-span-2 text-right">Subtotal</span>
                  </div>

                  <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                    {selectedInvoice.items.map((item, idx) => (
                      <div key={idx} className="grid grid-cols-1 sm:grid-cols-12 items-center gap-2 pb-3 border-b border-slate-100 sm:border-b-0">
                        <div className="col-span-6 flex items-start gap-2">
                          <span className="text-[10px] font-bold text-slate-400 w-4 shrink-0 mt-0.5">{idx + 1}.</span>
                          <div>
                            <span className="text-slate-900 font-sans font-bold block">{item.productName}</span>
                            <span className="text-[10px] text-indigo-600 font-bold uppercase block mt-0.5">
                              {item.sellType === 'carton' ? '📦 Carton Sale' : `✏️ Unit Sale (1 of ${item.unitsPerCarton} pcs)`}
                            </span>
                          </div>
                        </div>
                        <div className="col-span-2 text-left sm:text-center text-slate-600 font-semibold">
                          <span className="sm:hidden text-slate-400 mr-1">Price:</span>{formatNaira(item.pricePerItem)}
                        </div>
                        <div className="col-span-2 text-left sm:text-center text-slate-800 font-bold">
                          <span className="sm:hidden text-slate-400 mr-1">Qty:</span>{item.quantity}
                        </div>
                        <div className="col-span-2 text-left sm:text-right text-slate-900 font-black">
                          <span className="sm:hidden text-slate-400 mr-1">Total:</span>{formatNaira(item.totalSelling)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Calculations Summary block */}
                <div className="border-t border-slate-200 pt-5 space-y-2.5 font-mono text-xs">
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Invoice Subtotal</span>
                    <span>{formatNaira(selectedInvoice.totalSelling)}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Amount Paid by Customer</span>
                    <span className="text-emerald-600 font-bold">{formatNaira(selectedInvoice.amountPaid)}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600 pb-2.5 border-b border-slate-100">
                    <span>Outstanding Debt Balance</span>
                    <span className={selectedInvoice.totalSelling - selectedInvoice.amountPaid > 0 ? 'text-rose-500 font-bold' : 'text-slate-400'}>
                      {formatNaira(selectedInvoice.totalSelling - selectedInvoice.amountPaid)}
                    </span>
                  </div>
                  
                  {/* Master Total */}
                  <div className="flex items-center justify-between pt-1 font-sans">
                    <span className="text-sm font-extrabold text-slate-900 uppercase">Grand Total (Due)</span>
                    <span className="text-2xl font-display font-black text-indigo-600">
                      {formatNaira(selectedInvoice.totalSelling)}
                    </span>
                  </div>

                  {/* Owner-Only Profit calculations (hidden on Print via CSS) */}
                  <div className="mt-4 p-3.5 bg-indigo-50/40 rounded-xl border border-indigo-100 flex items-center justify-between text-[11px] font-mono print:hidden">
                    <div className="flex items-center gap-1.5 text-indigo-800 font-bold">
                      <Clock className="w-4 h-4" /> STORE OWNER PROFIT AUDIT:
                    </div>
                    <div className="text-right">
                      <span className="text-indigo-900 block font-bold">Wholesale Cost: {formatNaira(selectedInvoice.totalCost)}</span>
                      <span className="text-emerald-700 block font-black">Net Markup Profit: +{formatNaira(selectedInvoice.totalProfit)}</span>
                    </div>
                  </div>
                </div>

                {/* Optional invoice notes */}
                {selectedInvoice.notes && (
                  <div className="mt-5 p-3.5 rounded-xl bg-amber-50/50 border border-amber-100 text-[11px] text-slate-700 font-mono italic leading-relaxed">
                    <span className="font-bold text-amber-800 uppercase not-italic block mb-0.5">NOTES:</span>
                    "{selectedInvoice.notes}"
                  </div>
                )}

                {/* Receipt Footer */}
                <div className="mt-8 pt-6 border-t border-dashed border-slate-250 text-center text-[10px] font-mono text-slate-400 uppercase tracking-wide leading-relaxed">
                  <p>{receiptFooter}</p>
                </div>

                {/* Action Buttons */}
                <div className="mt-8 flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200 print:hidden">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedInvoice(null)}
                      className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-sans font-bold text-xs cursor-pointer transition active:scale-95"
                    >
                      CLOSE VIEWER
                    </button>
                    <button
                      onClick={() => handleCopyTextInvoice(selectedInvoice)}
                      className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 font-sans font-bold text-xs flex items-center gap-1.5 cursor-pointer transition active:scale-95"
                    >
                      <Copy className="w-4 h-4 text-slate-500" />
                      <span>{copiedInvoiceId === selectedInvoice.id ? 'COPIED TO CLIPBOARD!' : 'COPY WHATSAPP RECEIPT'}</span>
                    </button>
                  </div>
                  
                  <button
                    onClick={handlePrint}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-sans font-extrabold text-xs flex items-center gap-1.5 cursor-pointer transition shadow-sm active:scale-95"
                  >
                    <Printer className="w-4 h-4" />
                    <span>PRINT / SAVE PDF</span>
                  </button>
                </div>

              </motion.div>
            ) : quoteItems.length > 0 ? (
              
              /* ACTIVE BILLING FORM */
              <motion.div
                key="billing-form"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="rounded-3xl bg-white border border-slate-200 p-6 md:p-8 shadow-xl relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-500 via-rose-500 to-amber-500" />
                
                <h2 className="text-xl font-sans font-black text-slate-950 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-500" /> GENERATE CUSTOM INVOICE
                </h2>
                <p className="text-xs text-slate-500 mt-1 font-mono">
                  Review the items added from the price checker and complete customer details to save.
                </p>

                {/* Items summary - EDITABLE LIST */}
                <div className="my-5 p-4 rounded-2xl bg-indigo-50/30 border border-indigo-100/60 font-mono text-xs">
                  <div className="flex items-center justify-between text-indigo-900 font-bold pb-2 border-b border-indigo-100/50 mb-3">
                    <span>Invoice Items Ledger</span>
                    <span>{quoteItems.length} categories</span>
                  </div>
                  <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                    {quoteItems.map((item, idx) => (
                      <div key={idx} className="bg-white p-3 rounded-xl border border-indigo-100/50 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-sans font-bold text-slate-900 truncate flex-1">{item.product.name}</span>
                          <button 
                            type="button"
                            onClick={() => onUpdateQuote && onUpdateQuote(prev => prev.filter((_, i) => i !== idx))}
                            className="p-1 text-rose-400 hover:text-rose-600 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[9px] uppercase text-slate-400 block mb-1">Qty ({item.sellType === 'carton' ? 'ctn' : 'pcs'})</label>
                            <input 
                              type="number"
                              min={1}
                              value={item.quantity}
                              onChange={(e) => {
                                if (!onUpdateQuote) return;
                                const val = parseInt(e.target.value) || 1;
                                onUpdateQuote(prev => {
                                  const next = [...prev];
                                  next[idx] = { 
                                    ...next[idx], 
                                    quantity: val,
                                    totalCost: val * (item.totalCost / item.quantity),
                                    totalSelling: val * item.pricePerItem
                                  };
                                  return next;
                                });
                              }}
                              className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded text-slate-800 font-bold"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] uppercase text-slate-400 block mb-1">Price (₦)</label>
                            <input 
                              type="number"
                              value={item.pricePerItem}
                              onChange={(e) => {
                                if (!onUpdateQuote) return;
                                const val = parseFloat(e.target.value) || 0;
                                onUpdateQuote(prev => {
                                  const next = [...prev];
                                  next[idx] = { 
                                    ...next[idx], 
                                    pricePerItem: val,
                                    totalSelling: item.quantity * val
                                  };
                                  return next;
                                });
                              }}
                              className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded text-slate-800 font-bold"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <form onSubmit={handleCreateInvoice} className="space-y-5">
                  {/* Customer Name */}
                  <div>
                    <label className="block text-xs font-mono font-bold text-slate-600 uppercase mb-1.5">
                      Customer Name
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="e.g. Mummy Faith, Abubakar, Walk-in"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-250 rounded-xl text-sm text-slate-900 font-sans focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-400"
                      />
                      <User className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                    </div>
                  </div>

                  {/* Payment Status */}
                  <div>
                    <label className="block text-xs font-mono font-bold text-slate-600 uppercase mb-1.5">
                      Payment Status
                    </label>
                    <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 rounded-xl text-xs font-mono font-bold">
                      <button
                        type="button"
                        onClick={() => setPaymentStatus('fully_paid')}
                        className={`py-2 rounded-lg transition ${paymentStatus === 'fully_paid' ? 'bg-white text-emerald-600 shadow-xs' : 'text-slate-600 hover:text-slate-900 cursor-pointer'}`}
                      >
                        FULLY PAID
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentStatus('partial_paid')}
                        className={`py-2 rounded-lg transition ${paymentStatus === 'partial_paid' ? 'bg-white text-amber-600 shadow-xs' : 'text-slate-600 hover:text-slate-900 cursor-pointer'}`}
                      >
                        PARTIAL
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentStatus('unpaid')}
                        className={`py-2 rounded-lg transition ${paymentStatus === 'unpaid' ? 'bg-white text-rose-600 shadow-xs' : 'text-slate-600 hover:text-slate-900 cursor-pointer'}`}
                      >
                        UNPAID (DEBT)
                      </button>
                    </div>
                  </div>

                  {/* Amount Paid custom Input (if partial) */}
                  {paymentStatus === 'partial_paid' && (
                    <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-100 animate-in fade-in duration-200">
                      <label className="block text-xs font-mono font-bold text-amber-800 uppercase mb-1.5">
                        Amount Paid by Customer (₦)
                      </label>
                      <input
                        type="number"
                        required
                        min={1}
                        max={totalSelling}
                        placeholder="e.g. 5000"
                        value={amountPaidInput}
                        onChange={(e) => setAmountPaidInput(e.target.value)}
                        className="w-full px-4 py-3 bg-white border border-amber-200 rounded-xl text-sm font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/15 focus:border-amber-400"
                      />
                      <p className="text-[10px] text-amber-700 font-mono mt-1.5">
                        Outstanding Debt Balance: <span className="font-bold">{formatNaira(outstandingBalance)}</span>
                      </p>
                    </div>
                  )}

                  {/* Auto-Add to Ledger option if there's credit/debt */}
                  {(paymentStatus === 'unpaid' || paymentStatus === 'partial_paid') && outstandingBalance > 0 && (
                    <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-start gap-3 animate-in fade-in duration-200">
                      <input
                        id="auto-debt-check"
                        type="checkbox"
                        checked={autoAddDebt}
                        onChange={(e) => setAutoAddDebt(e.target.checked)}
                        className="mt-1 h-4 w-4 rounded-sm border-indigo-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <div>
                        <label htmlFor="auto-debt-check" className="font-sans font-bold text-xs text-indigo-950 cursor-pointer block select-none">
                          Automatically record this debt balance in the Debt Ledger
                        </label>
                        <p className="text-[10px] text-indigo-700 font-mono mt-0.5">
                          Will instantly create a synced ledger entry of <span className="font-black">{formatNaira(outstandingBalance)}</span> for {customerName.trim() || 'Walk-in Customer'}.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Optional invoice notes */}
                  <div>
                    <label className="block text-xs font-mono font-bold text-slate-600 uppercase mb-1.5">
                      Invoice Note / Comment (Optional)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Goods to be delivered tomorrow evening"
                      value={invoiceNotes}
                      onChange={(e) => setInvoiceNotes(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-250 rounded-xl text-xs text-slate-900 font-sans focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-400"
                    />
                  </div>

                  {/* Calculations total */}
                  <div className="pt-4 border-t border-slate-200 flex items-center justify-between font-mono">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Grand Total due</span>
                      <span className="text-2xl font-sans font-black text-slate-900">{formatNaira(totalSelling)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block uppercase text-right">Est. Profit</span>
                      <span className="text-xl font-sans font-black text-emerald-600 text-right block">+{formatNaira(totalProfit)}</span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-4 bg-gradient-to-r from-rose-500 to-indigo-600 text-white rounded-xl font-sans font-extrabold text-sm shadow-lg shadow-indigo-500/15 hover:from-rose-600 hover:to-indigo-700 transition cursor-pointer flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    <span>GENERATE &amp; RECORD DIGITAL INVOICE</span>
                  </button>
                </form>
              </motion.div>

            ) : (
              
              /* PLACEHOLDER WHEN LIST IS CLEAN AND NOTHING SELECTED */
              <motion.div
                key="welcome-placeholder"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="rounded-3xl border-2 border-dashed border-slate-200 bg-white/50 p-12 text-center flex flex-col items-center justify-center min-h-[350px]"
              >
                <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center mb-4 border border-indigo-100">
                  <FileText className="w-7 h-7 text-indigo-500 animate-pulse" />
                </div>
                <h3 className="font-sans font-black text-slate-800 text-sm uppercase">No Selected Invoice</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm leading-relaxed">
                  Select an invoice from the history list on the right, or add products from the <strong>Price Checker</strong> to compile a new digital bill.
                </p>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* RIGHT COLUMN: HISTORICAL INVOICES LEDGER & LOOKUP */}
        <div className="lg:col-span-5 space-y-6 print:hidden">
          
          <div className="rounded-3xl bg-white border border-slate-200 p-6 shadow-xl space-y-5">
            
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-sans font-black text-slate-950 uppercase flex items-center gap-2">
                  <Clock className="w-4.5 h-4.5 text-indigo-500" /> Invoice History
                </h3>
                <p className="text-[10px] text-slate-400 font-mono">
                  {filteredInvoices.length} entries of synced shop records
                </p>
              </div>

              {/* Toggle configuration panel */}
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-500 font-mono text-xs cursor-pointer transition active:scale-95"
              >
                {showSettings ? 'CLOSE CONFIG' : '🔧 SHOP PARAMS'}
              </button>
            </div>

            {/* EXPANDABLE SHOP DETAILS SETUP */}
            {showSettings && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="p-4 bg-slate-50 rounded-2xl border border-slate-250 text-xs space-y-3.5"
              >
                <h4 className="font-sans font-bold text-slate-900 uppercase text-[10px]">Customize Invoice Header &amp; Footer</h4>
                
                <div>
                  <label className="block font-mono font-bold text-slate-600 uppercase text-[9px] mb-1">Shop/Store Name</label>
                  <input
                    type="text"
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-250 rounded-lg focus:outline-rose-500 text-xs text-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-mono font-bold text-slate-600 uppercase text-[9px] mb-1">Store Phone Line(s)</label>
                  <input
                    type="text"
                    value={shopPhone}
                    onChange={(e) => setShopPhone(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-250 rounded-lg focus:outline-rose-500 text-xs text-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-mono font-bold text-slate-600 uppercase text-[9px] mb-1">Footer/Disclaimers Statement</label>
                  <textarea
                    rows={2}
                    value={receiptFooter}
                    onChange={(e) => setReceiptFooter(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-250 rounded-lg focus:outline-rose-500 text-xs text-slate-800"
                  />
                </div>
              </motion.div>
            )}

            {/* Filter inputs */}
            <div className="space-y-2.5 font-mono text-xs">
              {/* Search customer/ID */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search Customer or Invoice ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-250 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-400 text-xs"
                />
                <Search className="absolute left-3 top-3 w-3.5 h-3.5 text-slate-400" />
              </div>

              {/* Date filters */}
              <div className="flex flex-wrap gap-1.5">
                {[
                  { id: 'all', label: 'All Time' },
                  { id: 'today', label: 'Today' },
                  { id: 'yesterday', label: 'Yesterday' },
                  { id: 'month', label: 'This Month' }
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setDateFilter(item.id as any)}
                    className={`px-3 py-1.5 rounded-lg border text-[10px] font-bold uppercase transition cursor-pointer ${dateFilter === item.id ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Invoices List view */}
            <div className="space-y-2 max-h-[450px] overflow-y-auto pr-1">
              {loading ? (
                <div className="py-8 text-center text-xs font-mono text-slate-400 animate-pulse">
                  Synching database invoices...
                </div>
              ) : filteredInvoices.length === 0 ? (
                <div className="py-8 text-center text-xs font-mono text-slate-400">
                  No invoice records found matching filters.
                </div>
              ) : (
                filteredInvoices.map((inv) => {
                  const isSelected = selectedInvoice?.id === inv.id;
                  const balance = inv.totalSelling - inv.amountPaid;
                  
                  return (
                    <div
                      key={inv.id}
                      onClick={() => setSelectedInvoice(inv)}
                      className={`p-3.5 rounded-2xl border text-xs font-mono transition cursor-pointer flex items-center justify-between gap-3 ${isSelected ? 'bg-indigo-50/50 border-indigo-300 ring-1 ring-indigo-300' : 'bg-slate-50 border-slate-200 hover:bg-slate-100/70'}`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-900 font-sans font-extrabold block uppercase">
                            {inv.customerName}
                          </span>
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${
                            inv.paymentStatus === 'fully_paid'
                              ? 'bg-emerald-100 text-emerald-800'
                              : inv.paymentStatus === 'unpaid'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-amber-100 text-amber-800'
                          }`}>
                            {inv.paymentStatus === 'fully_paid' ? 'PAID' : inv.paymentStatus === 'unpaid' ? 'DUE' : 'PARTIAL'}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500">ID: {inv.id} • {new Date(inv.createdAt).toLocaleDateString()}</p>
                        <p className="text-[10px] text-slate-400">Items: {inv.items.length} goods types</p>
                      </div>

                      <div className="text-right space-y-1 shrink-0">
                        <span className="text-slate-900 font-black block">
                          {formatNaira(inv.totalSelling)}
                        </span>
                        {balance > 0 && (
                          <span className="text-rose-500 text-[9px] font-bold block">
                            Due: {formatNaira(balance)}
                          </span>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteInvoice(inv.id);
                          }}
                          className="p-1 text-slate-300 hover:text-rose-600 transition inline-block cursor-pointer align-middle"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}

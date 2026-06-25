export interface Product {
  id: string;
  name: string;
  cost_price: number;
  selling_price: number;
  category: 'Noodles & Grains' | 'Tomatoes & Spices' | 'Oil & Butter' | 'Beverages & Milk' | 'Snacks & Sweets';
  page: string;
  imageUrl: string;
  notes?: string;
  units_per_carton?: number;
}

export interface QuoteItem {
  product: Product;
  quantity: number;
  sellType: 'carton' | 'unit';
  unitsPerCarton: number;
  pricePerItem: number;
  totalCost: number;
  totalSelling: number;
}

export interface Debt {
  id: string;
  customerName: string;
  amount: number;
  notes?: string;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}

export interface InvoiceItem {
  productId: string;
  productName: string;
  sellType: 'carton' | 'unit';
  quantity: number;
  unitsPerCarton: number;
  pricePerItem: number;
  costPricePerItem: number;
  totalCost: number;
  totalSelling: number;
}

export interface Invoice {
  id: string;
  customerName: string;
  items: InvoiceItem[];
  totalCost: number;
  totalSelling: number;
  totalProfit: number;
  amountPaid: number;
  paymentStatus: 'fully_paid' | 'unpaid' | 'partial_paid';
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  notes?: string;
  shopName?: string;
  shopPhone?: string;
}


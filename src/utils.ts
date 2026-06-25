import { Product } from './types';

export interface ProductPriceBreakdown {
  unitCost: number;
  cartonCost: number;
  unitSelling: number;
  cartonSelling: number;
  marginPercentage: number;
  markupPercentage: number;
  profitPerUnit: number;
  profitPerCarton: number;
}

export function getProductPrices(
  product: Pick<Product, 'cost_price' | 'selling_price' | 'units_per_carton'>,
  unitsPerCartonOverride?: number
): ProductPriceBreakdown {
  // Use override or product value, default to 1 if not provided (since user says it's unnecessary)
  const unitsPerCarton = unitsPerCartonOverride ?? product.units_per_carton ?? 1;
  
  const cartonCost = product.cost_price;
  const unitCost = unitsPerCarton > 0 ? product.cost_price / unitsPerCarton : product.cost_price;
  
  // By default, treat selling_price as the UNIT price (Retail/Roll) 
  // unless it looks like a carton price (greater than cost)
  // However, user said: "The single unit price should be the retail price... It’s roll which is equal to retail price"
  
  let unitSelling = product.selling_price;
  let cartonSelling = product.selling_price * unitsPerCarton;

  // If the selling_price is very high (greater than cost), it's likely a carton price
  if (product.selling_price >= product.cost_price && product.cost_price > 0) {
    cartonSelling = product.selling_price;
    unitSelling = unitsPerCarton > 0 ? product.selling_price / unitsPerCarton : product.selling_price;
  }
  
  const profitPerUnit = unitSelling > 0 ? unitSelling - unitCost : 0;
  const profitPerCarton = cartonSelling > 0 ? cartonSelling - cartonCost : 0;
  
  const marginPercentage = cartonSelling > 0
    ? ((cartonSelling - cartonCost) / cartonSelling) * 100
    : 0;
    
  const markupPercentage = cartonSelling > 0 && cartonCost > 0
    ? ((cartonSelling - cartonCost) / cartonCost) * 100
    : 0;
    
  return {
    unitCost,
    cartonCost,
    unitSelling,
    cartonSelling,
    marginPercentage,
    markupPercentage,
    profitPerUnit,
    profitPerCarton
  };
}

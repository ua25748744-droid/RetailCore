/**
 * Inventory Service
 * =================
 * Handles all inventory-related database transactions
 * Implements Weighted Average Cost (WAC) calculations
 */

import { calculateWAC } from '../index';
import type { Product, StockMovement } from '../schema';

// Types for stock-in operations
export interface StockInParams {
    productId: number;
    quantity: number;
    unitCost: number;
    supplierId?: number;
    userId: number;
    notes?: string;
}

export interface StockInResult {
    success: boolean;
    product: Product;
    stockMovement: StockMovement;
    previousStock: number;
    previousWAC: number;
    newStock: number;
    newWAC: number;
}

/**
 * Calculate new WAC after stock-in
 * Formula: ((CurrentStock * CurrentWAC) + (NewQty * NewCost)) / TotalStock
 */
export function calculateNewWAC(
    currentStock: number,
    currentWAC: number,
    newQuantity: number,
    newCost: number
): number {
    const totalStock = currentStock + newQuantity;
    if (totalStock <= 0) return 0;

    return calculateWAC(currentStock, currentWAC, newQuantity, newCost);
}

/**
 * Perform stock-in operation with WAC calculation
 * This is an in-memory implementation for the demo
 * In production, this will execute SQL transactions
 */
export function performStockIn(
    products: Product[],
    params: StockInParams
): { updatedProducts: Product[]; result: StockInResult } {
    const { productId, quantity, unitCost, userId, notes } = params;

    const product = products.find(p => p.id === productId);
    if (!product) {
        throw new Error(`Product with ID ${productId} not found`);
    }

    const previousStock = product.quantity;
    const previousWAC = product.wac_cost;
    const newStock = previousStock + quantity;
    const newWAC = calculateNewWAC(previousStock, previousWAC, quantity, unitCost);

    // Create updated product
    const updatedProduct: Product = {
        ...product,
        quantity: newStock,
        wac_cost: Math.round(newWAC * 100) / 100, // Round to 2 decimal places
        cost_price: unitCost, // Update last cost price
        updated_at: new Date().toISOString(),
    };

    // Create stock movement record
    const stockMovement: StockMovement = {
        id: Date.now(), // Temporary ID for demo
        product_id: productId,
        type: 'purchase',
        quantity: quantity,
        unit_cost: unitCost,
        reference_id: params.supplierId,
        reference_type: 'PURCHASE',
        notes: notes,
        user_id: userId,
        created_at: new Date().toISOString(),
    };

    // Update products array
    const updatedProducts = products.map(p =>
        p.id === productId ? updatedProduct : p
    );

    return {
        updatedProducts,
        result: {
            success: true,
            product: updatedProduct,
            stockMovement,
            previousStock,
            previousWAC,
            newStock,
            newWAC,
        },
    };
}

/**
 * Reduce stock after sale
 */
export function reduceStock(
    products: Product[],
    productId: number,
    quantity: number
): Product[] {
    return products.map(p => {
        if (p.id !== productId) return p;

        return {
            ...p,
            quantity: Math.max(0, p.quantity - quantity),
            updated_at: new Date().toISOString(),
        };
    });
}

/**
 * Get low stock products
 */
export function getLowStockProducts(products: Product[]): Product[] {
    return products
        .filter(p => p.is_active && p.quantity <= p.min_stock_level)
        .sort((a, b) => a.quantity - b.quantity);
}

/**
 * Calculate total inventory value using WAC
 */
export function calculateInventoryValue(products: Product[]): number {
    return products
        .filter(p => p.is_active)
        .reduce((total, p) => total + (p.quantity * p.wac_cost), 0);
}

// SQL Query generators for when wa-sqlite is ready
export const SQL_QUERIES = {
    stockIn: (params: StockInParams) => `
    BEGIN TRANSACTION;
    
    UPDATE products
    SET 
      quantity = quantity + ${params.quantity},
      wac_cost = CASE 
        WHEN quantity = 0 OR quantity + ${params.quantity} = 0 
        THEN ${params.unitCost}
        ELSE ROUND(
          ((quantity * wac_cost) + (${params.quantity} * ${params.unitCost})) 
          / (quantity + ${params.quantity}),
          2
        )
      END,
      cost_price = ${params.unitCost},
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ${params.productId};
    
    INSERT INTO stock_movements (
      product_id, type, quantity, unit_cost, reference_id, 
      reference_type, notes, user_id
    ) VALUES (
      ${params.productId}, 'purchase', ${params.quantity}, ${params.unitCost},
      ${params.supplierId || 'NULL'}, 'PURCHASE', 
      ${params.notes ? `'${params.notes}'` : 'NULL'}, ${params.userId}
    );
    
    COMMIT;
  `,

    getLowStock: `
    SELECT * FROM products
    WHERE is_active = 1 AND quantity <= min_stock_level
    ORDER BY quantity ASC;
  `,

    getInventoryValue: `
    SELECT SUM(quantity * wac_cost) as total_value
    FROM products
    WHERE is_active = 1;
  `,
};

// Product repository - CRUD operations for inventory management
import { query, queryOne, execute, transaction } from './index';
import type { Product, StockMovement } from './schema';
import { calculateWAC } from './index';

// Get all products
export function getAllProducts(includeInactive = false): Product[] {
    const sql = includeInactive
        ? 'SELECT * FROM products ORDER BY name'
        : 'SELECT * FROM products WHERE is_active = 1 ORDER BY name';
    return query<Product>(sql);
}

// Get product by ID
export function getProductById(id: number): Product | null {
    return queryOne<Product>('SELECT * FROM products WHERE id = ?', [id]);
}

// Get product by SKU
export function getProductBySku(sku: string): Product | null {
    return queryOne<Product>('SELECT * FROM products WHERE sku = ?', [sku]);
}

// Get product by barcode
export function getProductByBarcode(barcode: string): Product | null {
    return queryOne<Product>('SELECT * FROM products WHERE barcode = ?', [barcode]);
}

// Search products by name
export function searchProducts(searchTerm: string): Product[] {
    return query<Product>(
        'SELECT * FROM products WHERE is_active = 1 AND (name LIKE ? OR name_ur LIKE ? OR sku LIKE ? OR barcode LIKE ?) ORDER BY name',
        [`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`]
    );
}

// Get low stock products
export function getLowStockProducts(): Product[] {
    return query<Product>(
        'SELECT * FROM products WHERE is_active = 1 AND quantity <= min_stock_level ORDER BY quantity ASC'
    );
}

// Get products by category
export function getProductsByCategory(categoryId: number): Product[] {
    return query<Product>(
        'SELECT * FROM products WHERE is_active = 1 AND category_id = ? ORDER BY name',
        [categoryId]
    );
}

// Create product
export interface CreateProductInput {
    name: string;
    name_ur?: string;
    sku?: string;
    barcode?: string;
    category_id?: number;
    supplier_id?: number;
    cost_price: number;
    selling_price: number;
    quantity?: number;
    min_stock_level?: number;
    unit?: string;
    description?: string;
}

export function createProduct(input: CreateProductInput): Product {
    const result = execute(
        `INSERT INTO products (
      name, name_ur, sku, barcode, category_id, supplier_id,
      cost_price, selling_price, quantity, min_stock_level, wac_cost, unit, description
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            input.name,
            input.name_ur || null,
            input.sku || null,
            input.barcode || null,
            input.category_id || null,
            input.supplier_id || null,
            input.cost_price,
            input.selling_price,
            input.quantity || 0,
            input.min_stock_level || 5,
            input.cost_price, // Initial WAC = cost price
            input.unit || 'piece',
            input.description || null,
        ]
    );

    return getProductById(result.lastInsertRowId)!;
}

// Update product
export interface UpdateProductInput {
    id: number;
    name?: string;
    name_ur?: string;
    sku?: string;
    barcode?: string;
    category_id?: number;
    supplier_id?: number;
    cost_price?: number;
    selling_price?: number;
    min_stock_level?: number;
    unit?: string;
    description?: string;
    is_active?: boolean;
}

export function updateProduct(input: UpdateProductInput): Product | null {
    const product = getProductById(input.id);
    if (!product) return null;

    execute(
        `UPDATE products SET
      name = ?,
      name_ur = ?,
      sku = ?,
      barcode = ?,
      category_id = ?,
      supplier_id = ?,
      cost_price = ?,
      selling_price = ?,
      min_stock_level = ?,
      unit = ?,
      description = ?,
      is_active = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?`,
        [
            input.name ?? product.name,
            input.name_ur ?? product.name_ur,
            input.sku ?? product.sku,
            input.barcode ?? product.barcode,
            input.category_id ?? product.category_id,
            input.supplier_id ?? product.supplier_id,
            input.cost_price ?? product.cost_price,
            input.selling_price ?? product.selling_price,
            input.min_stock_level ?? product.min_stock_level,
            input.unit ?? product.unit,
            input.description ?? product.description,
            input.is_active !== undefined ? (input.is_active ? 1 : 0) : product.is_active,
            input.id,
        ]
    );

    return getProductById(input.id);
}

// Delete product (soft delete)
export function deleteProduct(id: number): boolean {
    const result = execute(
        'UPDATE products SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [id]
    );
    return result.changes > 0;
}

// Hard delete product (permanent)
export function hardDeleteProduct(id: number): boolean {
    const result = execute('DELETE FROM products WHERE id = ?', [id]);
    return result.changes > 0;
}

// Stock In - Add stock with Weighted Average Costing (WAC)
export interface StockInInput {
    product_id: number;
    quantity: number;
    unit_cost: number;
    user_id: number;
    notes?: string;
}

export async function stockIn(input: StockInInput): Promise<{ product: Product; movement: StockMovement }> {
    return await transaction(async () => {
        const product = getProductById(input.product_id);
        if (!product) {
            throw new Error('Product not found');
        }

        // Calculate new WAC
        const newWAC = calculateWAC(
            product.quantity,
            product.wac_cost,
            input.quantity,
            input.unit_cost
        );

        // Update product quantity and WAC
        const newQuantity = product.quantity + input.quantity;
        execute(
            `UPDATE products SET
        quantity = ?,
        wac_cost = ?,
        cost_price = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?`,
            [newQuantity, newWAC, input.unit_cost, input.product_id]
        );

        // Record stock movement
        const movementResult = execute(
            `INSERT INTO stock_movements (
        product_id, type, quantity, unit_cost, notes, user_id
      ) VALUES (?, 'purchase', ?, ?, ?, ?)`,
            [input.product_id, input.quantity, input.unit_cost, input.notes || null, input.user_id]
        );

        const updatedProduct = getProductById(input.product_id)!;
        const movement = queryOne<StockMovement>(
            'SELECT * FROM stock_movements WHERE id = ?',
            [movementResult.lastInsertRowId]
        )!;

        return { product: updatedProduct, movement };
    });
}

// Stock Out - Reduce stock (for sales or adjustments)
export interface StockOutInput {
    product_id: number;
    quantity: number;
    type: 'sale' | 'adjustment' | 'damage' | 'return';
    reference_id?: number;
    reference_type?: string;
    user_id: number;
    notes?: string;
}

export async function stockOut(input: StockOutInput): Promise<{ product: Product; movement: StockMovement }> {
    return await transaction(async () => {
        const product = getProductById(input.product_id);
        if (!product) {
            throw new Error('Product not found');
        }

        if (product.quantity < input.quantity) {
            throw new Error('Insufficient stock');
        }

        // Update product quantity
        const newQuantity = product.quantity - input.quantity;
        execute(
            'UPDATE products SET quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [newQuantity, input.product_id]
        );

        // Record stock movement (negative quantity for stock out)
        const movementResult = execute(
            `INSERT INTO stock_movements (
        product_id, type, quantity, unit_cost, reference_id, reference_type, notes, user_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                input.product_id,
                input.type,
                -input.quantity,
                product.wac_cost,
                input.reference_id || null,
                input.reference_type || null,
                input.notes || null,
                input.user_id,
            ]
        );

        const updatedProduct = getProductById(input.product_id)!;
        const movement = queryOne<StockMovement>(
            'SELECT * FROM stock_movements WHERE id = ?',
            [movementResult.lastInsertRowId]
        )!;

        return { product: updatedProduct, movement };
    });
}

// Get stock movements for a product
export function getProductStockMovements(productId: number, limit = 50): StockMovement[] {
    return query<StockMovement>(
        'SELECT * FROM stock_movements WHERE product_id = ? ORDER BY created_at DESC LIMIT ?',
        [productId, limit]
    );
}

// Get inventory value (total cost based on WAC)
export function getInventoryValue(): { totalItems: number; totalValue: number } {
    const result = queryOne<{ totalItems: number; totalValue: number }>(
        'SELECT SUM(quantity) as totalItems, SUM(quantity * wac_cost) as totalValue FROM products WHERE is_active = 1'
    );
    return {
        totalItems: result?.totalItems || 0,
        totalValue: result?.totalValue || 0,
    };
}

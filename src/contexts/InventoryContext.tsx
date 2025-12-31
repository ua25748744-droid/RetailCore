import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { Product } from '../db/schema';
import { getAllProducts, isDatabaseReady, addProduct as dbAddProduct, updateProduct as dbUpdateProduct, deleteProduct as dbDeleteProduct } from '../db/database';

// Cart item type
export interface CartItem {
    product: Product;
    quantity: number;
    discount: number;
}

// Inventory context type
interface InventoryContextType {
    // Products state
    products: Product[];
    setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
    refreshProducts: () => Promise<void>;
    isLoading: boolean;

    // Cart state for POS
    cart: CartItem[];
    addToCart: (product: Product, quantity?: number) => void;
    removeFromCart: (productId: number) => void;
    updateCartItemQuantity: (productId: number, quantity: number) => void;
    updateCartItemDiscount: (productId: number, discount: number) => void;
    clearCart: () => void;

    // Cart calculations
    cartSubtotal: number;
    cartDiscount: number;
    cartTotal: number;
    cartItemCount: number;

    // Selected product for editing
    selectedProduct: Product | null;
    setSelectedProduct: (product: Product | null) => void;

    // UI state
    isProductModalOpen: boolean;
    setIsProductModalOpen: (open: boolean) => void;
    isStockInModalOpen: boolean;
    setIsStockInModalOpen: (open: boolean) => void;

    // Database operations
    saveProduct: (product: Partial<Product>) => Promise<void>;
    removeProduct: (productId: number) => Promise<void>;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

// Demo products fallback (used when database is not ready)
const DEMO_PRODUCTS: Product[] = [
    {
        id: 1,
        name: 'Basmati Rice 5kg',
        name_ur: 'باسمتی چاول 5 کلو',
        sku: 'RICE-001',
        barcode: '8901234567890',
        category_id: 1,
        cost_price: 850,
        selling_price: 950,
        quantity: 50,
        min_stock_level: 10,
        wac_cost: 850,
        unit: 'bag',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
    {
        id: 2,
        name: 'Cooking Oil 5L',
        name_ur: 'کھانا پکانے کا تیل 5 لیٹر',
        sku: 'OIL-001',
        barcode: '8901234567891',
        category_id: 1,
        cost_price: 2200,
        selling_price: 2450,
        quantity: 30,
        min_stock_level: 5,
        wac_cost: 2200,
        unit: 'bottle',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
    {
        id: 3,
        name: 'Sugar 1kg',
        name_ur: 'چینی 1 کلو',
        sku: 'SUG-001',
        barcode: '8901234567892',
        category_id: 1,
        cost_price: 140,
        selling_price: 160,
        quantity: 100,
        min_stock_level: 20,
        wac_cost: 140,
        unit: 'pack',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
    {
        id: 4,
        name: 'Tea 200g',
        name_ur: 'چائے 200 گرام',
        sku: 'TEA-001',
        barcode: '8901234567893',
        category_id: 2,
        cost_price: 380,
        selling_price: 420,
        quantity: 45,
        min_stock_level: 10,
        wac_cost: 380,
        unit: 'pack',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
    {
        id: 5,
        name: 'Flour 10kg',
        name_ur: 'آٹا 10 کلو',
        sku: 'FLR-001',
        barcode: '8901234567894',
        category_id: 1,
        cost_price: 950,
        selling_price: 1100,
        quantity: 8,
        min_stock_level: 15,
        wac_cost: 950,
        unit: 'bag',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
    {
        id: 6,
        name: 'Milk Powder 400g',
        name_ur: 'دودھ پاؤڈر 400 گرام',
        sku: 'MLK-001',
        barcode: '8901234567895',
        category_id: 2,
        cost_price: 650,
        selling_price: 750,
        quantity: 25,
        min_stock_level: 8,
        wac_cost: 650,
        unit: 'tin',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
];

const STORAGE_KEY = 'retailcore_products';

// Load from localStorage as fallback
const loadFromLocalStorage = (): Product[] | null => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            const products = JSON.parse(stored) as Product[];
            console.log(`Loaded ${products.length} products from localStorage`);
            return products;
        }
    } catch (error) {
        console.error('Failed to load from localStorage:', error);
    }
    return null;
};

// Save to localStorage as backup
const saveToLocalStorage = (products: Product[]) => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
        console.log(`Saved ${products.length} products to localStorage`);
    } catch (error) {
        console.error('Failed to save to localStorage:', error);
    }
};

export const InventoryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // Initialize from localStorage or demo products
    const [products, setProducts] = useState<Product[]>(() => {
        const stored = loadFromLocalStorage();
        return stored !== null && stored.length > 0 ? stored : DEMO_PRODUCTS;
    });
    const [isLoading, setIsLoading] = useState(false);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [isStockInModalOpen, setIsStockInModalOpen] = useState(false);

    // Save to localStorage whenever products change
    useEffect(() => {
        saveToLocalStorage(products);
    }, [products]);

    // Load products from database
    const refreshProducts = useCallback(async () => {
        if (!isDatabaseReady()) {
            console.log('Database not ready, using localStorage/demo products');
            return;
        }

        setIsLoading(true);
        try {
            const dbProducts = await getAllProducts();
            if (dbProducts && dbProducts.length > 0) {
                // Map database fields to Product type
                const mappedProducts: Product[] = (dbProducts as Record<string, unknown>[]).map((p) => ({
                    id: p.id as number,
                    name: p.name as string,
                    name_ur: p.name_ur as string | undefined,
                    sku: p.sku as string | undefined,
                    barcode: p.barcode as string | undefined,
                    category_id: p.category_id as number | undefined,
                    supplier_id: p.supplier_id as number | undefined,
                    cost_price: (p.cost_price as number) ?? 0,
                    selling_price: (p.selling_price as number) ?? 0,
                    quantity: (p.quantity as number) ?? 0,
                    min_stock_level: (p.min_stock_level as number) ?? 5,
                    wac_cost: (p.wac_cost as number) ?? (p.cost_price as number) ?? 0,
                    unit: (p.unit as string) ?? 'piece',
                    description: p.description as string | undefined,
                    is_active: Boolean(p.is_active),
                    created_at: p.created_at as string,
                    updated_at: p.updated_at as string,
                }));
                setProducts(mappedProducts);
                console.log(`Loaded ${mappedProducts.length} products from database`);
            }
        } catch (error) {
            console.error('Failed to load products from database:', error);
            // Fallback to localStorage is already in the initial state
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Try to load from database on mount (but localStorage is already loaded)
    useEffect(() => {
        const checkAndLoad = async () => {
            // Small delay to ensure database is initialized
            await new Promise(resolve => setTimeout(resolve, 1000));
            if (isDatabaseReady()) {
                refreshProducts();
            }
        };
        checkAndLoad();
    }, [refreshProducts]);

    // Add to cart
    const addToCart = useCallback((product: Product, quantity = 1) => {
        setCart((prev) => {
            const existing = prev.find((item) => item.product.id === product.id);
            if (existing) {
                return prev.map((item) =>
                    item.product.id === product.id
                        ? { ...item, quantity: item.quantity + quantity }
                        : item
                );
            }
            return [...prev, { product, quantity, discount: 0 }];
        });
    }, []);

    // Remove from cart
    const removeFromCart = useCallback((productId: number) => {
        setCart((prev) => prev.filter((item) => item.product.id !== productId));
    }, []);

    // Update cart item quantity
    const updateCartItemQuantity = useCallback((productId: number, quantity: number) => {
        if (quantity <= 0) {
            removeFromCart(productId);
            return;
        }
        setCart((prev) =>
            prev.map((item) =>
                item.product.id === productId ? { ...item, quantity } : item
            )
        );
    }, [removeFromCart]);

    // Update cart item discount
    const updateCartItemDiscount = useCallback((productId: number, discount: number) => {
        setCart((prev) =>
            prev.map((item) =>
                item.product.id === productId ? { ...item, discount } : item
            )
        );
    }, []);

    // Save product to database
    const saveProduct = useCallback(async (productData: Partial<Product>) => {
        try {
            if (productData.id) {
                // Update existing product
                if (isDatabaseReady()) {
                    await dbUpdateProduct(productData.id, {
                        name: productData.name,
                        name_ur: productData.name_ur,
                        sku: productData.sku,
                        barcode: productData.barcode,
                        category_id: productData.category_id,
                        cost_price: productData.cost_price,
                        selling_price: productData.selling_price,
                        quantity: productData.quantity,
                        min_stock_level: productData.min_stock_level,
                        unit: productData.unit,
                        description: productData.description,
                    });
                    console.log('Product updated in database:', productData.id);
                }
                // Update local state
                setProducts((prev) =>
                    prev.map((p) =>
                        p.id === productData.id
                            ? { ...p, ...productData, updated_at: new Date().toISOString() }
                            : p
                    )
                );
            } else {
                // Create new product
                if (isDatabaseReady()) {
                    await dbAddProduct({
                        name: productData.name || '',
                        name_ur: productData.name_ur,
                        sku: productData.sku,
                        barcode: productData.barcode,
                        category_id: productData.category_id,
                        cost_price: productData.cost_price || 0,
                        selling_price: productData.selling_price || 0,
                        quantity: productData.quantity || 0,
                        min_stock_level: productData.min_stock_level,
                        unit: productData.unit,
                    });
                    console.log('Product added to database');
                    // Refresh from database to get the new ID
                    await refreshProducts();
                } else {
                    // Fallback to in-memory when database is not ready
                    const maxId = products.length > 0
                        ? Math.max(...products.map((p) => p.id ?? 0))
                        : 0;
                    const newProduct: Product = {
                        id: maxId + 1,
                        name: productData.name || '',
                        name_ur: productData.name_ur,
                        sku: productData.sku,
                        barcode: productData.barcode,
                        category_id: productData.category_id,
                        cost_price: productData.cost_price || 0,
                        selling_price: productData.selling_price || 0,
                        quantity: productData.quantity || 0,
                        min_stock_level: productData.min_stock_level || 5,
                        wac_cost: productData.cost_price || 0,
                        unit: productData.unit || 'piece',
                        description: productData.description,
                        is_active: true,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                    };
                    setProducts((prev) => [...prev, newProduct]);
                    console.log('Product added to local state with ID:', newProduct.id);
                }
            }
        } catch (error) {
            console.error('Failed to save product:', error);
            throw error;
        }
    }, [products, refreshProducts]);

    // Remove product from database
    const removeProduct = useCallback(async (productId: number) => {
        try {
            if (isDatabaseReady()) {
                await dbDeleteProduct(productId);
                console.log('Product deleted from database:', productId);
            }
            // Update local state
            setProducts((prev) => prev.filter((p) => p.id !== productId));
        } catch (error) {
            console.error('Failed to delete product:', error);
            throw error;
        }
    }, []);

    // Clear cart
    const clearCart = useCallback(() => {
        setCart([]);
    }, []);

    // Cart calculations
    const cartSubtotal = useMemo(() => {
        return cart.reduce(
            (total, item) => total + item.product.selling_price * item.quantity,
            0
        );
    }, [cart]);

    const cartDiscount = useMemo(() => {
        return cart.reduce((total, item) => total + item.discount, 0);
    }, [cart]);

    const cartTotal = useMemo(() => {
        return cartSubtotal - cartDiscount;
    }, [cartSubtotal, cartDiscount]);

    const cartItemCount = useMemo(() => {
        return cart.reduce((count, item) => count + item.quantity, 0);
    }, [cart]);

    const value = useMemo(
        () => ({
            products,
            setProducts,
            refreshProducts,
            isLoading,
            cart,
            addToCart,
            removeFromCart,
            updateCartItemQuantity,
            updateCartItemDiscount,
            clearCart,
            cartSubtotal,
            cartDiscount,
            cartTotal,
            cartItemCount,
            selectedProduct,
            setSelectedProduct,
            isProductModalOpen,
            setIsProductModalOpen,
            isStockInModalOpen,
            setIsStockInModalOpen,
            saveProduct,
            removeProduct,
        }),
        [
            products,
            refreshProducts,
            isLoading,
            cart,
            addToCart,
            removeFromCart,
            updateCartItemQuantity,
            updateCartItemDiscount,
            clearCart,
            cartSubtotal,
            cartDiscount,
            cartTotal,
            cartItemCount,
            selectedProduct,
            isProductModalOpen,
            isStockInModalOpen,
            saveProduct,
            removeProduct,
        ]
    );

    return (
        <InventoryContext.Provider value={value}>
            {children}
        </InventoryContext.Provider>
    );
};

export const useInventory = (): InventoryContextType => {
    const context = useContext(InventoryContext);
    if (!context) {
        throw new Error('useInventory must be used within an InventoryProvider');
    }
    return context;
};

export default InventoryContext;

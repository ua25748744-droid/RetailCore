import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../contexts/LanguageContext';
import { useInventory } from '../contexts/InventoryContext';
import { ProductList, ProductForm, StockInForm } from '../components/inventory';
import type { Product } from '../db/schema';

export const InventoryPage: React.FC = () => {
    const { t } = useTranslation();
    const { isRTL } = useLanguage();
    const { products: _products, setProducts, selectedProduct, setSelectedProduct, saveProduct, removeProduct } = useInventory();

    const [showProductForm, setShowProductForm] = useState(false);
    const [showStockInForm, setShowStockInForm] = useState(false);
    const [stockInProduct, setStockInProduct] = useState<Product | null>(null);
    const [_isSaving, setIsSaving] = useState(false);

    // Handle edit product
    const handleEdit = (product: Product) => {
        setSelectedProduct(product);
        setShowProductForm(true);
    };

    // Handle stock in
    const handleStockIn = (product: Product) => {
        setStockInProduct(product);
        setShowStockInForm(true);
    };

    // Handle delete product - now persists to database
    const handleDelete = async (product: Product) => {
        if (window.confirm(isRTL ? 'کیا آپ واقعی اس مصنوعات کو حذف کرنا چاہتے ہیں؟' : 'Are you sure you want to delete this product?')) {
            try {
                await removeProduct(product.id);
                console.log('Product deleted successfully');
            } catch (error) {
                console.error('Failed to delete product:', error);
                alert(isRTL ? 'حذف کرنے میں ناکام' : 'Failed to delete product');
            }
        }
    };

    // Handle save product (create or update) - now persists to database
    const handleSaveProduct = async (productData: Partial<Product>) => {
        setIsSaving(true);
        try {
            await saveProduct(productData);
            console.log('Product saved successfully');
            setShowProductForm(false);
            setSelectedProduct(null);
        } catch (error) {
            console.error('Failed to save product:', error);
            alert(isRTL ? 'محفوظ کرنے میں ناکام' : 'Failed to save product');
        } finally {
            setIsSaving(false);
        }
    };

    // Handle stock in submit
    const handleStockInSubmit = (productId: number, quantity: number, unitCost: number) => {
        setProducts((prev) =>
            prev.map((p) => {
                if (p.id !== productId) return p;

                // Calculate new WAC
                const totalQuantity = p.quantity + quantity;
                const newWAC = totalQuantity > 0
                    ? ((p.quantity * p.wac_cost) + (quantity * unitCost)) / totalQuantity
                    : 0;

                return {
                    ...p,
                    quantity: totalQuantity,
                    wac_cost: newWAC,
                    cost_price: unitCost,
                    updated_at: new Date().toISOString(),
                };
            })
        );

        setShowStockInForm(false);
        setStockInProduct(null);
    };

    return (
        <div className="min-h-screen py-8 px-6" style={{ backgroundColor: 'rgb(var(--color-bg-primary))' }}>
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold" style={{ color: 'rgb(var(--color-brand-primary))' }}>
                            {t('navigation.inventory')}
                        </h1>
                        <p className="mt-1" style={{ color: 'rgb(var(--color-text-secondary))' }}>
                            {isRTL ? 'اپنی مصنوعات اور اسٹاک کا انتظام کریں' : 'Manage your products and stock levels'}
                        </p>
                    </div>

                    <button
                        onClick={() => {
                            setSelectedProduct(null);
                            setShowProductForm(true);
                        }}
                        className="btn-primary flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        {t('product.add_product')}
                    </button>
                </div>

                {/* Product List */}
                <ProductList
                    onEdit={handleEdit}
                    onStockIn={handleStockIn}
                    onDelete={handleDelete}
                />
            </div>

            {/* Product Form Modal */}
            {showProductForm && (
                <ProductForm
                    product={selectedProduct}
                    onClose={() => {
                        setShowProductForm(false);
                        setSelectedProduct(null);
                    }}
                    onSave={handleSaveProduct}
                />
            )}

            {/* Stock In Form Modal */}
            {showStockInForm && stockInProduct && (
                <StockInForm
                    product={stockInProduct}
                    onClose={() => {
                        setShowStockInForm(false);
                        setStockInProduct(null);
                    }}
                    onStockIn={handleStockInSubmit}
                />
            )}
        </div>
    );
};

export default InventoryPage;

import React from 'react';
import { AlertTriangle, X, Package } from 'lucide-react';
import { useInventory } from '../contexts/InventoryContext';
import { useLanguage } from '../contexts/LanguageContext';
import type { Product } from '../db/schema';

interface InventoryAlertsProps {
    isOpen: boolean;
    onClose: () => void;
}

export const InventoryAlerts: React.FC<InventoryAlertsProps> = ({ isOpen, onClose }) => {
    const { products } = useInventory();
    const { isRTL, currentLanguage } = useLanguage();

    // Get products with low stock
    const lowStockProducts = products.filter(
        (p) => p.is_active && p.quantity <= p.min_stock_level
    );

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div
                className="w-full max-w-md rounded-2xl shadow-2xl border max-h-[80vh] flex flex-col"
                style={{
                    backgroundColor: 'rgb(var(--color-bg-card))',
                    borderColor: 'rgb(var(--color-border))',
                }}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'rgb(var(--color-border))' }}>
                    <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-amber-500/10">
                            <AlertTriangle className="w-5 h-5 text-amber-500" />
                        </div>
                        <div>
                            <h2 className="font-semibold" style={{ color: 'rgb(var(--color-text-primary))' }}>
                                {isRTL ? 'انوینٹری الرٹس' : 'Inventory Alerts'}
                            </h2>
                            <p className="text-xs" style={{ color: 'rgb(var(--color-text-secondary))' }}>
                                {isRTL
                                    ? `${lowStockProducts.length} آئٹمز کم اسٹاک میں`
                                    : `${lowStockProducts.length} items low in stock`}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-surface transition-colors"
                        style={{ color: 'rgb(var(--color-text-secondary))' }}
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {lowStockProducts.length === 0 ? (
                        <div className="text-center py-8">
                            <Package className="w-12 h-12 mx-auto mb-3 opacity-30" style={{ color: 'rgb(var(--color-text-secondary))' }} />
                            <p style={{ color: 'rgb(var(--color-text-secondary))' }}>
                                {isRTL ? 'کوئی کم اسٹاک الرٹ نہیں' : 'No low stock alerts'}
                            </p>
                        </div>
                    ) : (
                        lowStockProducts.map((product: Product) => (
                            <div
                                key={product.id}
                                className="flex items-center justify-between p-3 rounded-xl border"
                                style={{
                                    backgroundColor: 'rgb(var(--color-bg-secondary))',
                                    borderColor: product.quantity === 0 ? 'rgb(239 68 68 / 0.5)' : 'rgb(var(--color-border))',
                                }}
                            >
                                <div className="flex items-center gap-3">
                                    <div
                                        className={`p-2 rounded-lg ${product.quantity === 0 ? 'bg-red-500/10' : 'bg-amber-500/10'
                                            }`}
                                    >
                                        <Package
                                            className={`w-4 h-4 ${product.quantity === 0 ? 'text-red-500' : 'text-amber-500'
                                                }`}
                                        />
                                    </div>
                                    <div>
                                        <p className="font-medium text-sm" style={{ color: 'rgb(var(--color-text-primary))' }}>
                                            {currentLanguage === 'ur' && product.name_ur ? product.name_ur : product.name}
                                        </p>
                                        <p className="text-xs" style={{ color: 'rgb(var(--color-text-secondary))' }}>
                                            SKU: {product.sku || 'N/A'}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p
                                        className={`font-bold text-lg ${product.quantity === 0 ? 'text-red-500' : 'text-amber-500'
                                            }`}
                                    >
                                        {product.quantity}
                                    </p>
                                    <p className="text-[10px]" style={{ color: 'rgb(var(--color-text-secondary))' }}>
                                        {isRTL ? `کم از کم: ${product.min_stock_level}` : `Min: ${product.min_stock_level}`}
                                    </p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

/**
 * Hook to get low stock count
 */
export const useLowStockCount = () => {
    const { products } = useInventory();
    return products.filter((p) => p.is_active && p.quantity <= p.min_stock_level).length;
};

export default InventoryAlerts;

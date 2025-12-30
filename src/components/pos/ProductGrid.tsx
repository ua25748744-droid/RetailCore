import React, { useState, useMemo } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useInventory } from '../../contexts/InventoryContext';
import type { Product } from '../../db/schema';
import { Package, Droplets, Coffee, Wheat, Milk, Search, AlertTriangle } from 'lucide-react';

interface ProductGridProps {
    onAddToCart: (product: Product) => void;
}

// Product category icons and colors
const getCategoryStyle = (_categoryId?: number, sku?: string) => {
    // Determine style based on SKU prefix or category
    const skuLower = sku?.toLowerCase() || '';

    if (skuLower.includes('rice') || skuLower.includes('flr')) {
        return {
            icon: Wheat,
            gradient: 'from-amber-500/20 to-yellow-500/10',
            hoverGradient: 'group-hover:from-amber-500/30 group-hover:to-yellow-500/20',
            iconColor: 'text-amber-400',
        };
    }
    if (skuLower.includes('oil')) {
        return {
            icon: Droplets,
            gradient: 'from-yellow-500/20 to-orange-500/10',
            hoverGradient: 'group-hover:from-yellow-500/30 group-hover:to-orange-500/20',
            iconColor: 'text-yellow-400',
        };
    }
    if (skuLower.includes('tea') || skuLower.includes('sug')) {
        return {
            icon: Coffee,
            gradient: 'from-rose-500/20 to-pink-500/10',
            hoverGradient: 'group-hover:from-rose-500/30 group-hover:to-pink-500/20',
            iconColor: 'text-rose-400',
        };
    }
    if (skuLower.includes('mlk') || skuLower.includes('milk')) {
        return {
            icon: Milk,
            gradient: 'from-blue-500/20 to-cyan-500/10',
            hoverGradient: 'group-hover:from-blue-500/30 group-hover:to-cyan-500/20',
            iconColor: 'text-blue-400',
        };
    }
    // Default
    return {
        icon: Package,
        gradient: 'from-primary-500/20 to-indigo-500/10',
        hoverGradient: 'group-hover:from-primary-500/30 group-hover:to-indigo-500/20',
        iconColor: 'text-primary-400',
    };
};

export const ProductGrid: React.FC<ProductGridProps> = ({ onAddToCart }) => {
    const { isRTL, currentLanguage } = useLanguage();
    const { products } = useInventory();
    const [searchTerm, setSearchTerm] = useState('');

    // Filter products
    const filteredProducts = useMemo(() => {
        return products.filter((p) => {
            if (!p.is_active || p.quantity <= 0) return false;

            if (searchTerm) {
                const term = searchTerm.toLowerCase();
                const matchesSearch =
                    p.name.toLowerCase().includes(term) ||
                    p.name_ur?.includes(searchTerm) ||
                    p.barcode?.includes(searchTerm) ||
                    p.sku?.toLowerCase().includes(term);
                if (!matchesSearch) return false;
            }

            return true;
        });
    }, [products, searchTerm]);

    return (
        <div className="flex flex-col h-full">
            {/* Search Bar */}
            <div className="mb-4">
                <div className="relative">
                    <Search
                        className={`absolute top-1/2 -translate-y-1/2 w-5 h-5 text-muted ${isRTL ? 'right-4' : 'left-4'}`}
                    />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={`input-field w-full ${isRTL ? 'pr-12' : 'pl-12'}`}
                        placeholder={isRTL ? 'مصنوعات تلاش کریں یا بارکوڈ اسکین کریں...' : 'Search products or scan barcode...'}
                        autoFocus
                    />
                </div>
            </div>

            {/* Product Grid */}
            <div className="flex-1 overflow-y-auto">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {filteredProducts.map((product) => {
                        const style = getCategoryStyle(product.category_id, product.sku);
                        const IconComponent = style.icon;
                        const isLowStock = product.quantity <= product.min_stock_level;

                        return (
                            <button
                                key={product.id}
                                onClick={() => onAddToCart(product)}
                                className="group card p-3 text-start hover:border-primary-500/50 transition-all active:scale-95 relative overflow-hidden"
                            >
                                {/* Low Stock Badge */}
                                {isLowStock && (
                                    <div className="absolute top-2 right-2 z-10">
                                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 text-[10px] font-medium">
                                            <AlertTriangle className="w-3 h-3" />
                                            Low
                                        </div>
                                    </div>
                                )}

                                {/* Product Icon */}
                                <div className={`aspect-square rounded-xl bg-gradient-to-br ${style.gradient} ${style.hoverGradient} mb-3 flex items-center justify-center transition-all duration-300 relative overflow-hidden`}>
                                    {/* Decorative ring */}
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <div className="w-16 h-16 rounded-full border-2 border-dashed border-current opacity-20" />
                                    </div>
                                    <IconComponent className={`w-10 h-10 ${style.iconColor} transition-transform group-hover:scale-110 relative z-10`} />
                                </div>

                                {/* Product Info */}
                                <div>
                                    <h3 className="font-medium text-foreground text-sm leading-tight mb-1 line-clamp-2">
                                        {currentLanguage === 'ur' && product.name_ur ? product.name_ur : product.name}
                                    </h3>
                                    <p className="text-primary-400 font-bold text-lg">
                                        Rs. {product.selling_price.toLocaleString()}
                                    </p>
                                    <div className="flex items-center justify-between mt-1">
                                        <p className={`text-xs ${isLowStock ? 'text-rose-400' : 'text-muted'}`}>
                                            {isRTL ? `اسٹاک: ${product.quantity}` : `Stock: ${product.quantity}`}
                                        </p>
                                        {product.unit && (
                                            <span className="text-[10px] text-muted bg-surface px-1.5 py-0.5 rounded">
                                                {product.unit}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>

                {filteredProducts.length === 0 && (
                    <div className="py-12 text-center text-muted">
                        <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>{isRTL ? 'کوئی مصنوعات نہیں ملیں' : 'No products found'}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProductGrid;

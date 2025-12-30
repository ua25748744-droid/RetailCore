import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../contexts/LanguageContext';
import { useInventory } from '../../contexts/InventoryContext';
import type { Product } from '../../db/schema';

interface ProductListProps {
    onEdit: (product: Product) => void;
    onStockIn: (product: Product) => void;
    onDelete: (product: Product) => void;
}

export const ProductList: React.FC<ProductListProps> = ({ onEdit, onStockIn, onDelete }) => {
    const { t } = useTranslation();
    const { isRTL, currentLanguage } = useLanguage();
    const { products } = useInventory();

    const [searchTerm, setSearchTerm] = useState('');
    const [filterLowStock, setFilterLowStock] = useState(false);

    // Filtered products
    const filteredProducts = useMemo(() => {
        let result = products;

        // Search filter
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            result = result.filter(
                (p) =>
                    p.name.toLowerCase().includes(term) ||
                    p.name_ur?.includes(searchTerm) ||
                    p.sku?.toLowerCase().includes(term) ||
                    p.barcode?.includes(searchTerm)
            );
        }

        // Low stock filter
        if (filterLowStock) {
            result = result.filter((p) => p.quantity <= p.min_stock_level);
        }

        return result;
    }, [products, searchTerm, filterLowStock]);

    // Stats - with defensive null checks
    const totalProducts = products.length;
    const lowStockCount = products.filter((p) => (p.quantity ?? 0) <= (p.min_stock_level ?? 5)).length;
    const totalValue = products.reduce((sum, p) => sum + (p.quantity ?? 0) * (p.wac_cost ?? p.cost_price ?? 0), 0);

    const getStockStatus = (product: Product) => {
        const quantity = product.quantity ?? 0;
        const minLevel = product.min_stock_level ?? 5;
        if (quantity === 0) {
            return { label: t('product.out_of_stock'), class: 'bg-red-500/20 text-red-400 border-red-500/30' };
        }
        if (quantity <= minLevel) {
            return { label: t('product.low_stock_alert'), class: 'bg-amber-500/20 text-amber-400 border-amber-500/30' };
        }
        return { label: t('product.in_stock'), class: 'bg-green-500/20 text-green-400 border-green-500/30' };
    };

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="card bg-gradient-to-br from-primary-500/10 to-primary-600/5 border-primary-500/20">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-primary-500/20">
                            <svg className="w-6 h-6 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-sm text-slate-400">{t('navigation.products')}</p>
                            <p className="text-2xl font-bold text-white">{totalProducts}</p>
                        </div>
                    </div>
                </div>

                <div className="card bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/20">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-amber-500/20">
                            <svg className="w-6 h-6 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-sm text-slate-400">{t('product.low_stock_alert')}</p>
                            <p className="text-2xl font-bold text-white">{lowStockCount}</p>
                        </div>
                    </div>
                </div>

                <div className="card bg-gradient-to-br from-accent-500/10 to-accent-600/5 border-accent-500/20">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-accent-500/20">
                            <svg className="w-6 h-6 text-accent-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-sm text-slate-400">{isRTL ? 'کل قیمت' : 'Inventory Value'}</p>
                            <p className="text-2xl font-bold text-white">Rs. {totalValue.toLocaleString()}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Search & Filters */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <svg
                        className={`absolute top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 ${isRTL ? 'right-4' : 'left-4'}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={`input-field w-full ${isRTL ? 'pr-12' : 'pl-12'}`}
                        placeholder={t('common.search')}
                    />
                </div>

                <button
                    onClick={() => setFilterLowStock(!filterLowStock)}
                    className={`px-4 py-2 rounded-xl border transition-all ${filterLowStock
                        ? 'bg-amber-500/20 border-amber-500/50 text-amber-400'
                        : 'bg-slate-800/50 border-slate-700/50 text-slate-400 hover:border-slate-600/50'
                        }`}
                >
                    {t('product.low_stock_alert')} ({lowStockCount})
                </button>
            </div>

            {/* Product Table */}
            <div className="card overflow-hidden p-0">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-slate-700/50 bg-slate-800/30">
                                <th className={`px-4 py-3 text-sm font-semibold text-slate-300 ${isRTL ? 'text-right' : 'text-left'}`}>
                                    {t('product.product_name')}
                                </th>
                                <th className={`px-4 py-3 text-sm font-semibold text-slate-300 ${isRTL ? 'text-right' : 'text-left'}`}>
                                    {t('product.sku')}
                                </th>
                                <th className="px-4 py-3 text-sm font-semibold text-slate-300 text-center">
                                    {t('product.stock_quantity')}
                                </th>
                                <th className="px-4 py-3 text-sm font-semibold text-slate-300 text-center">
                                    {t('product.cost_price')}
                                </th>
                                <th className="px-4 py-3 text-sm font-semibold text-slate-300 text-center">
                                    {t('product.selling_price')}
                                </th>
                                <th className="px-4 py-3 text-sm font-semibold text-slate-300 text-center">
                                    {t('common.status')}
                                </th>
                                <th className="px-4 py-3 text-sm font-semibold text-slate-300 text-center">
                                    {t('common.actions')}
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/30">
                            {filteredProducts.map((product) => {
                                const status = getStockStatus(product);
                                return (
                                    <tr key={product.id} className="hover:bg-slate-800/30 transition-colors">
                                        <td className="px-4 py-3">
                                            <div>
                                                <p className="font-medium text-white">
                                                    {currentLanguage === 'ur' && product.name_ur ? product.name_ur : product.name}
                                                </p>
                                                {currentLanguage === 'en' && product.name_ur && (
                                                    <p className="text-xs text-slate-500 font-urdu">{product.name_ur}</p>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-slate-400 font-mono text-sm">
                                            {product.sku || '-'}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className="font-semibold text-white">{product.quantity ?? 0}</span>
                                            <span className="text-slate-500 text-xs ml-1">{product.unit ?? 'piece'}</span>
                                        </td>
                                        <td className="px-4 py-3 text-center text-slate-400">
                                            Rs. {(product.cost_price ?? 0).toLocaleString()}
                                        </td>
                                        <td className="px-4 py-3 text-center text-white font-medium">
                                            Rs. {(product.selling_price ?? 0).toLocaleString()}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`inline-block px-2 py-1 text-xs rounded-full border ${status.class}`}>
                                                {status.label}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-center gap-1">
                                                <button
                                                    onClick={() => onStockIn(product)}
                                                    className="p-1.5 rounded-lg hover:bg-accent-500/20 text-slate-400 hover:text-accent-400 transition-colors"
                                                    title={isRTL ? 'اسٹاک شامل کریں' : 'Stock In'}
                                                >
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => onEdit(product)}
                                                    className="p-1.5 rounded-lg hover:bg-primary-500/20 text-slate-400 hover:text-primary-400 transition-colors"
                                                    title={t('common.edit')}
                                                >
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => onDelete(product)}
                                                    className="p-1.5 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
                                                    title={t('common.delete')}
                                                >
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>

                    {filteredProducts.length === 0 && (
                        <div className="py-12 text-center text-slate-500">
                            <svg className="w-12 h-12 mx-auto mb-3 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                            <p>{isRTL ? 'کوئی مصنوعات نہیں ملیں' : 'No products found'}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProductList;

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../contexts/LanguageContext';
import type { Product } from '../../db/schema';

interface ProductFormProps {
    product?: Product | null;
    onClose: () => void;
    onSave: (product: Partial<Product>) => void;
}

export const ProductForm: React.FC<ProductFormProps> = ({ product, onClose, onSave }) => {
    const { t } = useTranslation();
    const { isRTL } = useLanguage();

    const [formData, setFormData] = useState({
        name: product?.name || '',
        name_ur: product?.name_ur || '',
        sku: product?.sku || '',
        barcode: product?.barcode || '',
        cost_price: product?.cost_price?.toString() || '',
        selling_price: product?.selling_price?.toString() || '',
        quantity: product?.quantity?.toString() || '0',
        min_stock_level: product?.min_stock_level?.toString() || '5',
        unit: product?.unit || 'piece',
        description: product?.description || '',
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        // Clear error on change
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: '' }));
        }
    };

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.name.trim()) {
            newErrors.name = t('common.error');
        }
        if (!formData.cost_price || parseFloat(formData.cost_price) < 0) {
            newErrors.cost_price = t('common.error');
        }
        if (!formData.selling_price || parseFloat(formData.selling_price) < 0) {
            newErrors.selling_price = t('common.error');
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!validate()) return;

        onSave({
            id: product?.id,
            name: formData.name,
            name_ur: formData.name_ur || undefined,
            sku: formData.sku || undefined,
            barcode: formData.barcode || undefined,
            cost_price: parseFloat(formData.cost_price),
            selling_price: parseFloat(formData.selling_price),
            quantity: parseInt(formData.quantity) || 0,
            min_stock_level: parseInt(formData.min_stock_level) || 5,
            unit: formData.unit,
            description: formData.description || undefined,
        });
    };

    const units = [
        { value: 'piece', label: isRTL ? 'عدد' : 'Piece' },
        { value: 'pack', label: isRTL ? 'پیکٹ' : 'Pack' },
        { value: 'bag', label: isRTL ? 'بیگ' : 'Bag' },
        { value: 'bottle', label: isRTL ? 'بوتل' : 'Bottle' },
        { value: 'tin', label: isRTL ? 'ڈبہ' : 'Tin' },
        { value: 'kg', label: isRTL ? 'کلو' : 'Kg' },
        { value: 'g', label: isRTL ? 'گرام' : 'Gram' },
        { value: 'l', label: isRTL ? 'لیٹر' : 'Liter' },
        { value: 'ml', label: isRTL ? 'ملی لیٹر' : 'mL' },
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="card w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-700/50">
                    <h2 className="text-xl font-bold text-white">
                        {product ? t('product.edit_product') : t('product.add_product')}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-slate-700/50 transition-colors"
                    >
                        <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Product Names */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                {t('product.product_name')} (English) *
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                className={`input-field ${errors.name ? 'border-red-500/50 ring-red-500/50' : ''}`}
                                placeholder="Product name in English"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                {t('product.product_name')} (اردو)
                            </label>
                            <input
                                type="text"
                                name="name_ur"
                                value={formData.name_ur}
                                onChange={handleChange}
                                className="input-field font-urdu"
                                placeholder="مصنوعات کا نام"
                                dir="rtl"
                            />
                        </div>
                    </div>

                    {/* SKU & Barcode */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                {t('product.sku')}
                            </label>
                            <input
                                type="text"
                                name="sku"
                                value={formData.sku}
                                onChange={handleChange}
                                className="input-field"
                                placeholder="SKU-001"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                {t('product.barcode')}
                            </label>
                            <input
                                type="text"
                                name="barcode"
                                value={formData.barcode}
                                onChange={handleChange}
                                className="input-field"
                                placeholder="8901234567890"
                            />
                        </div>
                    </div>

                    {/* Prices */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                {t('product.cost_price')} (Rs.) *
                            </label>
                            <input
                                type="number"
                                name="cost_price"
                                value={formData.cost_price}
                                onChange={handleChange}
                                className={`input-field ${errors.cost_price ? 'border-red-500/50 ring-red-500/50' : ''}`}
                                placeholder="0.00"
                                min="0"
                                step="0.01"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                {t('product.selling_price')} (Rs.) *
                            </label>
                            <input
                                type="number"
                                name="selling_price"
                                value={formData.selling_price}
                                onChange={handleChange}
                                className={`input-field ${errors.selling_price ? 'border-red-500/50 ring-red-500/50' : ''}`}
                                placeholder="0.00"
                                min="0"
                                step="0.01"
                            />
                        </div>
                    </div>

                    {/* Quantity & Min Stock */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                {t('product.stock_quantity')}
                            </label>
                            <input
                                type="number"
                                name="quantity"
                                value={formData.quantity}
                                onChange={handleChange}
                                className="input-field"
                                placeholder="0"
                                min="0"
                                disabled={!!product} // Can't edit quantity directly, use stock in/out
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                {t('product.min_stock')}
                            </label>
                            <input
                                type="number"
                                name="min_stock_level"
                                value={formData.min_stock_level}
                                onChange={handleChange}
                                className="input-field"
                                placeholder="5"
                                min="0"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                {isRTL ? 'یونٹ' : 'Unit'}
                            </label>
                            <select
                                name="unit"
                                value={formData.unit}
                                onChange={handleChange}
                                className="input-field"
                            >
                                {units.map((unit) => (
                                    <option key={unit.value} value={unit.value}>
                                        {unit.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            {isRTL ? 'تفصیل' : 'Description'}
                        </label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            className="input-field min-h-[80px] resize-y"
                            placeholder={isRTL ? 'مصنوعات کی تفصیل...' : 'Product description...'}
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-700/50">
                        <button
                            type="button"
                            onClick={onClose}
                            className="btn-secondary"
                        >
                            {t('common.cancel')}
                        </button>
                        <button
                            type="submit"
                            className="btn-primary"
                        >
                            {t('common.save')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProductForm;

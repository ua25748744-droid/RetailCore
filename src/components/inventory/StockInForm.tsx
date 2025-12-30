import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../contexts/LanguageContext';
import type { Product } from '../../db/schema';

interface StockInFormProps {
    product: Product;
    onClose: () => void;
    onStockIn: (productId: number, quantity: number, unitCost: number) => void;
}

export const StockInForm: React.FC<StockInFormProps> = ({ product, onClose, onStockIn }) => {
    const { t } = useTranslation();
    const { isRTL, currentLanguage } = useLanguage();

    const [quantity, setQuantity] = useState('');
    const [unitCost, setUnitCost] = useState(product.cost_price.toString());
    const [notes, setNotes] = useState('');

    // Calculate new WAC preview
    const newQuantity = parseInt(quantity) || 0;
    const newCost = parseFloat(unitCost) || 0;
    const totalQuantity = product.quantity + newQuantity;
    const newWAC = totalQuantity > 0
        ? ((product.quantity * product.wac_cost) + (newQuantity * newCost)) / totalQuantity
        : 0;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (newQuantity <= 0 || newCost <= 0) return;

        onStockIn(product.id, newQuantity, newCost);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="card w-full max-w-lg">
                {/* Header */}
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-700/50">
                    <div>
                        <h2 className="text-xl font-bold text-white">
                            {isRTL ? 'اسٹاک شامل کریں' : 'Stock In'}
                        </h2>
                        <p className="text-sm text-slate-400 mt-1">
                            {currentLanguage === 'ur' && product.name_ur ? product.name_ur : product.name}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-slate-700/50 transition-colors"
                    >
                        <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Current Stock Info */}
                <div className="glass p-4 mb-6">
                    <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                            <p className="text-xs text-slate-400 mb-1">
                                {isRTL ? 'موجودہ اسٹاک' : 'Current Stock'}
                            </p>
                            <p className="text-lg font-bold text-white">{product.quantity}</p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-400 mb-1">
                                {isRTL ? 'موجودہ WAC' : 'Current WAC'}
                            </p>
                            <p className="text-lg font-bold text-primary-400">Rs. {product.wac_cost.toFixed(2)}</p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-400 mb-1">
                                {isRTL ? 'لاگت قیمت' : 'Cost Price'}
                            </p>
                            <p className="text-lg font-bold text-slate-300">Rs. {product.cost_price.toFixed(2)}</p>
                        </div>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                {t('common.quantity')} *
                            </label>
                            <input
                                type="number"
                                value={quantity}
                                onChange={(e) => setQuantity(e.target.value)}
                                className="input-field"
                                placeholder="0"
                                min="1"
                                autoFocus
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                {isRTL ? 'فی یونٹ لاگت' : 'Cost per Unit'} (Rs.) *
                            </label>
                            <input
                                type="number"
                                value={unitCost}
                                onChange={(e) => setUnitCost(e.target.value)}
                                className="input-field"
                                placeholder="0.00"
                                min="0"
                                step="0.01"
                            />
                        </div>
                    </div>

                    {/* WAC Preview */}
                    {newQuantity > 0 && newCost > 0 && (
                        <div className="bg-accent-500/10 border border-accent-500/30 rounded-xl p-4">
                            <h4 className="text-sm font-semibold text-accent-400 mb-3">
                                {isRTL ? 'اپڈیٹ کے بعد' : 'After Update'}
                            </h4>
                            <div className="grid grid-cols-3 gap-4 text-center">
                                <div>
                                    <p className="text-xs text-slate-400 mb-1">
                                        {isRTL ? 'نیا اسٹاک' : 'New Stock'}
                                    </p>
                                    <p className="text-lg font-bold text-white">{totalQuantity}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-400 mb-1">
                                        {isRTL ? 'نیا WAC' : 'New WAC'}
                                    </p>
                                    <p className="text-lg font-bold text-accent-400">Rs. {newWAC.toFixed(2)}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-400 mb-1">
                                        {isRTL ? 'کل لاگت' : 'Total Cost'}
                                    </p>
                                    <p className="text-lg font-bold text-slate-300">
                                        Rs. {(newQuantity * newCost).toFixed(2)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            {isRTL ? 'نوٹس' : 'Notes'}
                        </label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="input-field min-h-[60px] resize-y"
                            placeholder={isRTL ? 'اختیاری نوٹس...' : 'Optional notes...'}
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
                            disabled={newQuantity <= 0 || newCost <= 0}
                            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isRTL ? 'اسٹاک شامل کریں' : 'Add Stock'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default StockInForm;

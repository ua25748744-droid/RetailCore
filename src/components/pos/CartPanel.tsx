import React from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../contexts/LanguageContext';
import { useInventory } from '../../contexts/InventoryContext';
import type { CartItem } from '../../contexts/InventoryContext';

interface CartPanelProps {
    onCheckout: () => void;
}

export const CartPanel: React.FC<CartPanelProps> = ({ onCheckout }) => {
    const { t } = useTranslation();
    const { isRTL } = useLanguage();
    const {
        cart,
        removeFromCart,
        updateCartItemQuantity,
        clearCart,
        cartSubtotal,
        cartDiscount,
        cartTotal,
        cartItemCount,
    } = useInventory();

    return (
        <div className="flex flex-col h-full bg-slate-800/30 rounded-2xl border border-slate-700/50">
            {/* Header */}
            <div className="px-4 py-3 border-b border-slate-700/50">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <h2 className="font-semibold text-white">
                            {isRTL ? 'ٹوکری' : 'Cart'}
                        </h2>
                        {cartItemCount > 0 && (
                            <span className="px-2 py-0.5 rounded-full bg-primary-500/20 text-primary-400 text-xs font-medium">
                                {cartItemCount}
                            </span>
                        )}
                    </div>
                    {cart.length > 0 && (
                        <button
                            onClick={clearCart}
                            className="text-xs text-red-400 hover:text-red-300 transition-colors"
                        >
                            {t('sale.clear_cart')}
                        </button>
                    )}
                </div>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {cart.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-500 py-8">
                        <svg className="w-16 h-16 mb-3 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <p className="text-sm">{isRTL ? 'ٹوکری خالی ہے' : 'Cart is empty'}</p>
                        <p className="text-xs text-slate-600 mt-1">
                            {isRTL ? 'مصنوعات شامل کرنے کے لیے کلک کریں' : 'Click products to add'}
                        </p>
                    </div>
                ) : (
                    cart.map((item) => (
                        <CartItemCard
                            key={item.product.id}
                            item={item}
                            onQuantityChange={(qty) => updateCartItemQuantity(item.product.id, qty)}
                            onRemove={() => removeFromCart(item.product.id)}
                        />
                    ))
                )}
            </div>

            {/* Totals & Checkout */}
            <div className="p-4 border-t border-slate-700/50 space-y-3">
                {/* Subtotal */}
                <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">{t('common.subtotal')}</span>
                    <span className="text-white">Rs. {cartSubtotal.toLocaleString()}</span>
                </div>

                {/* Discount */}
                {cartDiscount > 0 && (
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-400">{t('common.discount')}</span>
                        <span className="text-green-400">- Rs. {cartDiscount.toLocaleString()}</span>
                    </div>
                )}

                {/* Total */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-700/50">
                    <span className="font-semibold text-white">{t('common.total')}</span>
                    <span className="text-2xl font-bold text-primary-400">
                        Rs. {cartTotal.toLocaleString()}
                    </span>
                </div>

                {/* Checkout Button */}
                <button
                    onClick={onCheckout}
                    disabled={cart.length === 0}
                    className="w-full btn-primary py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {t('sale.checkout')}
                </button>
            </div>
        </div>
    );
};

// Cart Item Card Component
const CartItemCard: React.FC<{
    item: CartItem;
    onQuantityChange: (quantity: number) => void;
    onRemove: () => void;
}> = ({ item, onQuantityChange, onRemove }) => {
    const { currentLanguage } = useLanguage();
    const { product, quantity } = item;
    const itemTotal = product.selling_price * quantity;

    return (
        <div className="bg-slate-700/30 rounded-xl p-3 group">
            <div className="flex items-start gap-3">
                {/* Product Image Placeholder */}
                <div className="w-12 h-12 rounded-lg bg-slate-600/50 flex items-center justify-center flex-shrink-0">
                    <span className="text-lg font-bold text-slate-400">
                        {product.name.charAt(0)}
                    </span>
                </div>

                {/* Product Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                        <h4 className="font-medium text-white text-sm leading-tight line-clamp-1">
                            {currentLanguage === 'ur' && product.name_ur ? product.name_ur : product.name}
                        </h4>
                        <button
                            onClick={onRemove}
                            className="p-1 rounded hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <p className="text-xs text-slate-500 mt-0.5">
                        Rs. {product.selling_price.toLocaleString()} × {quantity}
                    </p>

                    <div className="flex items-center justify-between mt-2">
                        {/* Quantity Controls - Touch-friendly */}
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => onQuantityChange(quantity - 1)}
                                className="w-9 h-9 md:w-7 md:h-7 rounded-lg bg-slate-600/50 hover:bg-slate-600 active:bg-slate-500 text-white flex items-center justify-center transition-colors touch-target"
                            >
                                <svg className="w-5 h-5 md:w-4 md:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                                </svg>
                            </button>
                            <span className="w-10 text-center text-white font-medium text-lg">{quantity}</span>
                            <button
                                onClick={() => onQuantityChange(quantity + 1)}
                                disabled={quantity >= product.quantity}
                                className="w-9 h-9 md:w-7 md:h-7 rounded-lg bg-slate-600/50 hover:bg-slate-600 active:bg-slate-500 text-white flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed touch-target"
                            >
                                <svg className="w-5 h-5 md:w-4 md:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                            </button>
                        </div>

                        {/* Item Total */}
                        <span className="font-semibold text-primary-400">
                            Rs. {itemTotal.toLocaleString()}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CartPanel;

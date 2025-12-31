import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../contexts/LanguageContext';
import { useInventory } from '../contexts/InventoryContext';
import type { CartItem } from '../contexts/InventoryContext';
import { ProductGrid, CartPanel, CheckoutModal, ReceiptModal } from '../components/pos';
import type { Product } from '../db/schema';
import { ShoppingCart, X } from 'lucide-react';

interface ReceiptData {
    invoiceNumber: string;
    date: Date;
    items: CartItem[];
    subtotal: number;
    discount: number;
    total: number;
    paymentMethod: string;
    amountPaid: number;
    change: number;
}

export const POSPage: React.FC = () => {
    const { t } = useTranslation();
    const { isRTL } = useLanguage();
    const { addToCart, cart, cartTotal, cartSubtotal, cartDiscount, clearCart, setProducts, cartItemCount } = useInventory();

    const [showCheckout, setShowCheckout] = useState(false);
    const [showReceipt, setShowReceipt] = useState(false);
    const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
    const [showMobileCart, setShowMobileCart] = useState(false);

    // Generate invoice number
    const generateInvoiceNumber = () => {
        const date = new Date();
        const num = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `INV-${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}-${num}`;
    };

    // Handle add to cart
    const handleAddToCart = (product: Product) => {
        addToCart(product, 1);
    };

    // Handle checkout complete
    const handleCheckoutComplete = (paymentMethod: string, amountPaid: number) => {
        // Generate receipt data
        const receipt: ReceiptData = {
            invoiceNumber: generateInvoiceNumber(),
            date: new Date(),
            items: [...cart],
            subtotal: cartSubtotal,
            discount: cartDiscount,
            total: cartTotal,
            paymentMethod,
            amountPaid,
            change: Math.max(0, amountPaid - cartTotal),
        };

        // Update product quantities (simulate stock reduction)
        setProducts((prev) =>
            prev.map((p) => {
                const cartItem = cart.find((item) => item.product.id === p.id);
                if (cartItem) {
                    return { ...p, quantity: p.quantity - cartItem.quantity };
                }
                return p;
            })
        );

        // Clear cart and show receipt
        clearCart();
        setReceiptData(receipt);
        setShowCheckout(false);
        setShowMobileCart(false);
        setShowReceipt(true);
    };

    // Handle checkout from mobile cart
    const handleMobileCheckout = () => {
        setShowMobileCart(false);
        setShowCheckout(true);
    };

    return (
        <div className="h-[calc(100vh-8rem)] md:h-[calc(100vh-4rem)] p-4 md:p-6" style={{ backgroundColor: 'rgb(var(--color-bg-primary))' }}>
            <div className="h-full max-w-7xl mx-auto">
                {/* POS Layout - Stacked on mobile, side-by-side on desktop */}
                <div className={`h-full flex flex-col lg:flex-row gap-4 ${isRTL ? 'lg:flex-row-reverse' : ''}`}>
                    {/* Products Section - Full width on mobile */}
                    <div className="flex-1 flex flex-col min-w-0">
                        {/* Header */}
                        <div className="mb-4 flex items-center justify-between">
                            <h1 className="text-2xl font-bold" style={{ color: 'rgb(var(--color-brand-primary))' }}>
                                {t('navigation.pos')}
                            </h1>
                            <div className="flex items-center gap-2 text-sm" style={{ color: 'rgb(var(--color-text-secondary))' }}>
                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                {isRTL ? 'فعال' : 'Active'}
                            </div>
                        </div>

                        {/* Product Grid */}
                        <div className="flex-1 overflow-hidden">
                            <ProductGrid onAddToCart={handleAddToCart} />
                        </div>
                    </div>

                    {/* Cart Section - Hidden on mobile, visible on desktop */}
                    <div className="hidden lg:block w-96 flex-shrink-0">
                        <CartPanel onCheckout={() => setShowCheckout(true)} />
                    </div>
                </div>
            </div>

            {/* Mobile Cart FAB (Floating Action Button) */}
            <button
                onClick={() => setShowMobileCart(true)}
                className="fab lg:hidden"
                aria-label="Open cart"
            >
                <ShoppingCart className="w-6 h-6 text-white" />
                {cartItemCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[22px] h-[22px] flex items-center justify-center rounded-full bg-red-500 text-white text-xs font-bold px-1">
                        {cartItemCount > 99 ? '99+' : cartItemCount}
                    </span>
                )}
            </button>

            {/* Mobile Cart Modal */}
            {showMobileCart && (
                <>
                    {/* Backdrop */}
                    <div
                        className="mobile-modal-overlay"
                        onClick={() => setShowMobileCart(false)}
                    />

                    {/* Cart Panel */}
                    <div className="mobile-modal-content safe-area-bottom">
                        {/* Handle bar */}
                        <div className="flex justify-center pt-3 pb-2">
                            <div className="w-10 h-1 rounded-full bg-muted/50" />
                        </div>

                        {/* Close button */}
                        <button
                            onClick={() => setShowMobileCart(false)}
                            className="absolute top-4 right-4 p-2 rounded-full hover:bg-surface transition-colors touch-target"
                            aria-label="Close cart"
                        >
                            <X className="w-5 h-5 text-muted" />
                        </button>

                        {/* Cart content */}
                        <div className="h-[80vh] overflow-y-auto hide-scrollbar">
                            <CartPanel onCheckout={handleMobileCheckout} />
                        </div>
                    </div>
                </>
            )}

            {/* Checkout Modal */}
            {showCheckout && (
                <CheckoutModal
                    onClose={() => setShowCheckout(false)}
                    onComplete={handleCheckoutComplete}
                />
            )}

            {/* Receipt Modal */}
            {showReceipt && receiptData && (
                <ReceiptModal
                    receipt={receiptData}
                    onClose={() => {
                        setShowReceipt(false);
                        setReceiptData(null);
                    }}
                    onPrint={() => {
                        // Print handled in modal
                    }}
                />
            )}
        </div>
    );
};

export default POSPage;


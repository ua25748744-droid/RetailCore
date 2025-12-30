import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../contexts/LanguageContext';
import { useInventory } from '../contexts/InventoryContext';
import type { CartItem } from '../contexts/InventoryContext';
import { ProductGrid, CartPanel, CheckoutModal, ReceiptModal } from '../components/pos';
import type { Product } from '../db/schema';

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
    const { addToCart, cart, cartTotal, cartSubtotal, cartDiscount, clearCart, setProducts } = useInventory();

    const [showCheckout, setShowCheckout] = useState(false);
    const [showReceipt, setShowReceipt] = useState(false);
    const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);

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
        setShowReceipt(true);
    };

    return (
        <div className="h-[calc(100vh-8rem)] md:h-[calc(100vh-4rem)] p-4 md:p-6" style={{ backgroundColor: 'rgb(var(--color-bg-primary))' }}>
            <div className="h-full max-w-7xl mx-auto">
                {/* POS Layout - RTL aware */}
                <div className={`h-full flex gap-4 ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}>
                    {/* Products Section - Left in LTR, Right in RTL */}
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

                    {/* Cart Section - Right in LTR, Left in RTL */}
                    <div className="w-full md:w-96 flex-shrink-0">
                        <CartPanel onCheckout={() => setShowCheckout(true)} />
                    </div>
                </div>
            </div>

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

import React, { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import type { CartItem } from '../../contexts/InventoryContext';

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

interface ReceiptModalProps {
    receipt: ReceiptData;
    onClose: () => void;
    onPrint: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ receipt, onClose, onPrint }) => {
    const { t } = useTranslation();
    const receiptRef = useRef<HTMLDivElement>(null);

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-PK', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const handlePrint = () => {
        if (receiptRef.current) {
            const printWindow = window.open('', '_blank');
            if (printWindow) {
                printWindow.document.write(`
          <html>
            <head>
              <title>Receipt - ${receipt.invoiceNumber}</title>
              <style>
                body { font-family: 'Courier New', monospace; max-width: 300px; margin: 0 auto; padding: 20px; }
                .receipt { text-align: center; }
                .header { font-size: 18px; font-weight: bold; margin-bottom: 10px; }
                .divider { border-top: 1px dashed #000; margin: 10px 0; }
                .item { display: flex; justify-content: space-between; font-size: 12px; margin: 5px 0; }
                .total { font-size: 16px; font-weight: bold; }
                .footer { font-size: 11px; margin-top: 20px; }
                .urdu { font-family: 'Noto Nastaliq Urdu', serif; direction: rtl; }
              </style>
            </head>
            <body>
              ${receiptRef.current.innerHTML}
            </body>
          </html>
        `);
                printWindow.document.close();
                printWindow.print();
            }
        }
        onPrint();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="card w-full max-w-sm bg-white text-gray-900">
                {/* Receipt Content */}
                <div ref={receiptRef} className="receipt-content p-4">
                    {/* Header */}
                    <div className="text-center mb-4">
                        <h2 className="text-xl font-bold">RetailCore</h2>
                        <p className="text-sm text-gray-600">Invoice # {receipt.invoiceNumber}</p>
                        <p className="text-xs text-gray-500">{formatDate(receipt.date)}</p>
                    </div>

                    <div className="border-t border-dashed border-gray-300 my-3"></div>

                    {/* Items */}
                    <div className="space-y-2">
                        {receipt.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between text-sm">
                                <div className="flex-1">
                                    <span>{item.product.name}</span>
                                    <span className="text-gray-500 text-xs block">
                                        {item.quantity} × Rs. {item.product.selling_price.toLocaleString()}
                                    </span>
                                </div>
                                <span className="font-medium">
                                    Rs. {(item.product.selling_price * item.quantity).toLocaleString()}
                                </span>
                            </div>
                        ))}
                    </div>

                    <div className="border-t border-dashed border-gray-300 my-3"></div>

                    {/* Totals */}
                    <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-600">Subtotal</span>
                            <span>Rs. {receipt.subtotal.toLocaleString()}</span>
                        </div>
                        {receipt.discount > 0 && (
                            <div className="flex justify-between text-green-600">
                                <span>Discount</span>
                                <span>- Rs. {receipt.discount.toLocaleString()}</span>
                            </div>
                        )}
                        <div className="flex justify-between font-bold text-base pt-2 border-t border-gray-200">
                            <span>Total</span>
                            <span>Rs. {receipt.total.toLocaleString()}</span>
                        </div>
                    </div>

                    <div className="border-t border-dashed border-gray-300 my-3"></div>

                    {/* Payment Info */}
                    <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-600">Payment</span>
                            <span className="capitalize">{receipt.paymentMethod}</span>
                        </div>
                        {receipt.paymentMethod === 'cash' && (
                            <>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Received</span>
                                    <span>Rs. {receipt.amountPaid.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between font-medium">
                                    <span className="text-gray-600">Change</span>
                                    <span>Rs. {receipt.change.toLocaleString()}</span>
                                </div>
                            </>
                        )}
                    </div>

                    <div className="border-t border-dashed border-gray-300 my-3"></div>

                    {/* Footer with Urdu Greeting */}
                    <div className="text-center space-y-2">
                        <p className="text-sm">{t('receipt.thank_you')}</p>
                        <p className="text-sm font-urdu text-gray-600" style={{ direction: 'rtl' }}>
                            خریداری کا شکریہ! دوبارہ تشریف لائیں
                        </p>
                        <p className="text-xs text-gray-400 mt-4">www.retailcore.pk</p>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 p-4 border-t border-gray-200">
                    <button
                        onClick={onClose}
                        className="flex-1 py-2.5 px-4 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                    >
                        {t('common.close')}
                    </button>
                    <button
                        onClick={handlePrint}
                        className="flex-1 py-2.5 px-4 rounded-xl bg-gray-900 text-white font-medium hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                        </svg>
                        {t('sale.print_receipt')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ReceiptModal;

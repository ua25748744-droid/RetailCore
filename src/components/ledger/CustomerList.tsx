import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../contexts/LanguageContext';
import { useLedger } from '../../contexts/LedgerContext';
import type { Customer } from '../../db/schema';

interface CustomerListProps {
    onSelectCustomer: (customer: Customer) => void;
    onAddCustomer: () => void;
}

export const CustomerList: React.FC<CustomerListProps> = ({ onSelectCustomer, onAddCustomer }) => {
    const { t } = useTranslation();
    const { isRTL } = useLanguage();
    const { customers, totalReceivables, customersWithCredit } = useLedger();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterWithCredit, setFilterWithCredit] = useState(false);

    // Filtered customers
    const filteredCustomers = useMemo(() => {
        let result = customers.filter(c => c.is_active);

        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            result = result.filter(c =>
                c.name.toLowerCase().includes(term) ||
                c.phone?.includes(searchTerm)
            );
        }

        if (filterWithCredit) {
            result = result.filter(c => c.credit_balance > 0);
        }

        return result.sort((a, b) => b.credit_balance - a.credit_balance);
    }, [customers, searchTerm, filterWithCredit]);

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="card bg-gradient-to-br from-red-500/10 to-red-600/5 border-red-500/20">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-red-500/20">
                            <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-sm text-slate-400">
                                {isRTL ? 'کل ادھار (بقایا)' : 'Total Receivables'}
                            </p>
                            <p className="text-2xl font-bold text-white">Rs. {totalReceivables.toLocaleString()}</p>
                        </div>
                    </div>
                </div>

                <div className="card bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/20">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-amber-500/20">
                            <svg className="w-6 h-6 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-sm text-slate-400">
                                {isRTL ? 'ادھار والے گاہک' : 'Customers with Credit'}
                            </p>
                            <p className="text-2xl font-bold text-white">{customersWithCredit}</p>
                        </div>
                    </div>
                </div>

                <div className="card bg-gradient-to-br from-primary-500/10 to-primary-600/5 border-primary-500/20">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-primary-500/20">
                            <svg className="w-6 h-6 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-sm text-slate-400">
                                {isRTL ? 'کل گاہک' : 'Total Customers'}
                            </p>
                            <p className="text-2xl font-bold text-white">{customers.filter(c => c.is_active).length}</p>
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
                        placeholder={isRTL ? 'گاہک تلاش کریں...' : 'Search customers...'}
                    />
                </div>

                <button
                    onClick={() => setFilterWithCredit(!filterWithCredit)}
                    className={`px-4 py-2 rounded-xl border transition-all ${filterWithCredit
                            ? 'bg-red-500/20 border-red-500/50 text-red-400'
                            : 'bg-slate-800/50 border-slate-700/50 text-slate-400 hover:border-slate-600/50'
                        }`}
                >
                    {isRTL ? 'صرف ادھار والے' : 'With Credit Only'}
                </button>

                <button onClick={onAddCustomer} className="btn-primary flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    {t('customer.add_customer')}
                </button>
            </div>

            {/* Customer Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCustomers.map((customer) => (
                    <button
                        key={customer.id}
                        onClick={() => onSelectCustomer(customer)}
                        className="card text-start hover:border-primary-500/50 transition-all group"
                    >
                        <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500/20 to-accent-500/20 flex items-center justify-center">
                                    <span className="text-lg font-bold text-primary-400">
                                        {customer.name.charAt(0)}
                                    </span>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-white group-hover:text-primary-400 transition-colors">
                                        {customer.name}
                                    </h3>
                                    <p className="text-xs text-slate-500">{customer.phone}</p>
                                </div>
                            </div>
                            <svg className="w-5 h-5 text-slate-600 group-hover:text-primary-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-slate-700/50">
                            <div>
                                <p className="text-xs text-slate-500">{isRTL ? 'ادھار بقایا' : 'Credit Balance'}</p>
                                <p className={`text-lg font-bold ${customer.credit_balance > 0 ? 'text-red-400' : 'text-green-400'}`}>
                                    Rs. {customer.credit_balance.toLocaleString()}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-slate-500">{isRTL ? 'ادھار حد' : 'Credit Limit'}</p>
                                <p className="text-sm text-slate-400">Rs. {customer.credit_limit.toLocaleString()}</p>
                            </div>
                        </div>

                        {/* Credit usage bar */}
                        {customer.credit_limit > 0 && (
                            <div className="mt-3">
                                <div className="h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full ${customer.credit_balance / customer.credit_limit > 0.8
                                                ? 'bg-red-500'
                                                : customer.credit_balance / customer.credit_limit > 0.5
                                                    ? 'bg-amber-500'
                                                    : 'bg-green-500'
                                            }`}
                                        style={{ width: `${Math.min(100, (customer.credit_balance / customer.credit_limit) * 100)}%` }}
                                    />
                                </div>
                            </div>
                        )}
                    </button>
                ))}
            </div>

            {filteredCustomers.length === 0 && (
                <div className="card py-12 text-center text-slate-500">
                    <svg className="w-12 h-12 mx-auto mb-3 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <p>{isRTL ? 'کوئی گاہک نہیں ملا' : 'No customers found'}</p>
                </div>
            )}
        </div>
    );
};

export default CustomerList;

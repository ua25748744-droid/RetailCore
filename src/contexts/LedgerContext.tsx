import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { Customer, LedgerEntry } from '../db/schema';
import { getAllCustomers, executeSQL, isDatabaseReady } from '../db/database';

// Ledger context type
interface LedgerContextType {
    customers: Customer[];
    setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
    ledgerEntries: LedgerEntry[];
    setLedgerEntries: React.Dispatch<React.SetStateAction<LedgerEntry[]>>;
    isLoading: boolean;
    refreshCustomers: () => Promise<void>;

    // Customer operations
    addCustomer: (customer: Omit<Customer, 'id' | 'created_at' | 'updated_at'>) => Promise<Customer>;
    updateCustomer: (id: number, updates: Partial<Customer>) => Promise<void>;

    // Ledger operations
    addLedgerEntry: (entry: Omit<LedgerEntry, 'id' | 'created_at'>) => Promise<LedgerEntry>;
    getCustomerLedger: (customerId: number) => LedgerEntry[];
    getCustomerBalance: (customerId: number) => number;

    // Stats
    totalReceivables: number;
    customersWithCredit: number;
}

const LedgerContext = createContext<LedgerContextType | undefined>(undefined);

// Demo customers with Urdu names (fallback)
const DEMO_CUSTOMERS: Customer[] = [
    {
        id: 1,
        name: 'Ahmed Khan',
        phone: '0300-1234567',
        address: 'Shop #12, Main Bazaar',
        credit_limit: 50000,
        credit_balance: 15000,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
    {
        id: 2,
        name: 'Muhammad Ali',
        phone: '0321-9876543',
        address: 'House #45, Street 3',
        credit_limit: 30000,
        credit_balance: 8500,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
    {
        id: 3,
        name: 'Fatima Bibi',
        phone: '0333-5551234',
        address: 'Mohalla Noor, Near Masjid',
        credit_limit: 20000,
        credit_balance: 0,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
    {
        id: 4,
        name: 'Usman Traders',
        phone: '0345-1112233',
        address: 'Commercial Area, Block B',
        credit_limit: 100000,
        credit_balance: 45000,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
];

// Demo ledger entries (fallback)
const DEMO_LEDGER_ENTRIES: LedgerEntry[] = [
    {
        id: 1,
        customer_id: 1,
        type: 'credit',
        amount: 5000,
        balance: 5000,
        description: 'Sale on credit - Invoice #001',
        user_id: 1,
        created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
        id: 2,
        customer_id: 1,
        type: 'debit',
        amount: 2000,
        balance: 3000,
        description: 'Payment received',
        user_id: 1,
        created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
        id: 3,
        customer_id: 1,
        type: 'credit',
        amount: 12000,
        balance: 15000,
        description: 'Sale on credit - Invoice #015',
        user_id: 1,
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
        id: 4,
        customer_id: 2,
        type: 'credit',
        amount: 8500,
        balance: 8500,
        description: 'Sale on credit - Invoice #008',
        user_id: 1,
        created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
        id: 5,
        customer_id: 4,
        type: 'credit',
        amount: 50000,
        balance: 50000,
        description: 'Bulk order on credit',
        user_id: 1,
        created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
        id: 6,
        customer_id: 4,
        type: 'debit',
        amount: 5000,
        balance: 45000,
        description: 'Partial payment',
        user_id: 1,
        created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    },
];

export const LedgerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [customers, setCustomers] = useState<Customer[]>(DEMO_CUSTOMERS);
    const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>(DEMO_LEDGER_ENTRIES);
    const [isLoading, setIsLoading] = useState(false);

    // Load customers from database
    const refreshCustomers = useCallback(async () => {
        if (!isDatabaseReady()) {
            console.log('Database not ready, using demo customers');
            return;
        }

        setIsLoading(true);
        try {
            const dbCustomers = await getAllCustomers();
            if (dbCustomers && dbCustomers.length > 0) {
                const mappedCustomers: Customer[] = (dbCustomers as Record<string, unknown>[]).map((c) => ({
                    id: c.id as number,
                    name: c.name as string,
                    phone: c.phone as string | undefined,
                    email: c.email as string | undefined,
                    address: c.address as string | undefined,
                    credit_limit: c.credit_limit as number,
                    credit_balance: c.credit_balance as number,
                    notes: c.notes as string | undefined,
                    is_active: Boolean(c.is_active),
                    created_at: c.created_at as string,
                    updated_at: c.updated_at as string,
                }));
                setCustomers(mappedCustomers);
                console.log(`Loaded ${mappedCustomers.length} customers from database`);
            }
        } catch (error) {
            console.error('Failed to load customers from database:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Load customers on mount
    useEffect(() => {
        const checkAndLoad = async () => {
            await new Promise(resolve => setTimeout(resolve, 600));
            if (isDatabaseReady()) {
                refreshCustomers();
            }
        };
        checkAndLoad();
    }, [refreshCustomers]);

    // Add new customer
    const addCustomer = useCallback(async (customerData: Omit<Customer, 'id' | 'created_at' | 'updated_at'>): Promise<Customer> => {
        if (isDatabaseReady()) {
            try {
                await executeSQL(`
                    INSERT INTO customers (name, phone, email, address, credit_limit, credit_balance, notes, is_active)
                    VALUES (?, ?, ?, ?, ?, ?, ?, 1)
                `, [
                    customerData.name,
                    customerData.phone || null,
                    customerData.email || null,
                    customerData.address || null,
                    customerData.credit_limit || 0,
                    customerData.credit_balance || 0,
                    customerData.notes || null
                ]);
                await refreshCustomers();
                return customers[customers.length - 1];
            } catch (error) {
                console.error('Failed to add customer to database:', error);
            }
        }

        // Fallback to in-memory
        const newCustomer: Customer = {
            ...customerData,
            id: Math.max(...customers.map(c => c.id), 0) + 1,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };
        setCustomers(prev => [...prev, newCustomer]);
        return newCustomer;
    }, [customers, refreshCustomers]);

    // Update customer
    const updateCustomer = useCallback(async (id: number, updates: Partial<Customer>) => {
        if (isDatabaseReady()) {
            try {
                const updateFields: string[] = [];
                const values: (string | number | null)[] = [];

                if (updates.name !== undefined) { updateFields.push('name = ?'); values.push(updates.name); }
                if (updates.phone !== undefined) { updateFields.push('phone = ?'); values.push(updates.phone || null); }
                if (updates.email !== undefined) { updateFields.push('email = ?'); values.push(updates.email || null); }
                if (updates.address !== undefined) { updateFields.push('address = ?'); values.push(updates.address || null); }
                if (updates.credit_limit !== undefined) { updateFields.push('credit_limit = ?'); values.push(updates.credit_limit); }
                if (updates.credit_balance !== undefined) { updateFields.push('credit_balance = ?'); values.push(updates.credit_balance); }

                if (updateFields.length > 0) {
                    updateFields.push('updated_at = CURRENT_TIMESTAMP');
                    values.push(id);
                    await executeSQL(`UPDATE customers SET ${updateFields.join(', ')} WHERE id = ?`, values);
                    await refreshCustomers();
                    return;
                }
            } catch (error) {
                console.error('Failed to update customer in database:', error);
            }
        }

        // Fallback to in-memory
        setCustomers(prev => prev.map(c =>
            c.id === id ? { ...c, ...updates, updated_at: new Date().toISOString() } : c
        ));
    }, [refreshCustomers]);

    // Add ledger entry
    const addLedgerEntry = useCallback(async (entryData: Omit<LedgerEntry, 'id' | 'created_at'>): Promise<LedgerEntry> => {
        if (isDatabaseReady()) {
            try {
                await executeSQL(`
                    INSERT INTO ledgers (customer_id, type, amount, balance, reference_id, reference_type, description, user_id)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                `, [
                    entryData.customer_id,
                    entryData.type,
                    entryData.amount,
                    entryData.balance,
                    entryData.reference_id || null,
                    entryData.reference_type || null,
                    entryData.description || null,
                    entryData.user_id
                ]);

                // Update customer balance
                const balanceChange = entryData.type === 'credit' ? entryData.amount : -entryData.amount;
                await executeSQL(`
                    UPDATE customers 
                    SET credit_balance = credit_balance + ?, updated_at = CURRENT_TIMESTAMP 
                    WHERE id = ?
                `, [balanceChange, entryData.customer_id]);

                await refreshCustomers();
            } catch (error) {
                console.error('Failed to add ledger entry to database:', error);
            }
        }

        // Also update in-memory for immediate UI feedback
        const newEntry: LedgerEntry = {
            ...entryData,
            id: Math.max(...ledgerEntries.map(e => e.id), 0) + 1,
            created_at: new Date().toISOString(),
        };
        setLedgerEntries(prev => [...prev, newEntry]);

        // Update customer balance in memory
        const customer = customers.find(c => c.id === entryData.customer_id);
        if (customer) {
            const balanceChange = entryData.type === 'credit' ? entryData.amount : -entryData.amount;
            setCustomers(prev => prev.map(c =>
                c.id === entryData.customer_id
                    ? { ...c, credit_balance: c.credit_balance + balanceChange, updated_at: new Date().toISOString() }
                    : c
            ));
        }

        return newEntry;
    }, [ledgerEntries, customers, refreshCustomers]);

    // Get ledger entries for a customer
    const getCustomerLedger = useCallback((customerId: number): LedgerEntry[] => {
        return ledgerEntries
            .filter(e => e.customer_id === customerId)
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }, [ledgerEntries]);

    // Get customer balance
    const getCustomerBalance = useCallback((customerId: number): number => {
        const customer = customers.find(c => c.id === customerId);
        return customer?.credit_balance || 0;
    }, [customers]);

    // Stats
    const totalReceivables = useMemo(() => {
        return customers.reduce((sum, c) => sum + c.credit_balance, 0);
    }, [customers]);

    const customersWithCredit = useMemo(() => {
        return customers.filter(c => c.credit_balance > 0).length;
    }, [customers]);

    const value = useMemo(() => ({
        customers,
        setCustomers,
        ledgerEntries,
        setLedgerEntries,
        isLoading,
        refreshCustomers,
        addCustomer,
        updateCustomer,
        addLedgerEntry,
        getCustomerLedger,
        getCustomerBalance,
        totalReceivables,
        customersWithCredit,
    }), [
        customers,
        ledgerEntries,
        isLoading,
        refreshCustomers,
        addCustomer,
        updateCustomer,
        addLedgerEntry,
        getCustomerLedger,
        getCustomerBalance,
        totalReceivables,
        customersWithCredit,
    ]);

    return (
        <LedgerContext.Provider value={value}>
            {children}
        </LedgerContext.Provider>
    );
};

export const useLedger = (): LedgerContextType => {
    const context = useContext(LedgerContext);
    if (!context) {
        throw new Error('useLedger must be used within a LedgerProvider');
    }
    return context;
};

export default LedgerContext;

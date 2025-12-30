/**
 * Database Context Provider
 * =========================
 * React context for managing SQLite database lifecycle
 * Provides database state and initialization to the app
 * Falls back to in-memory demo data if SQLite fails to load
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import { initDatabase, isDatabaseReady, closeDatabase } from '../db/database';

// Database state types
type DatabaseStatus = 'initializing' | 'ready' | 'fallback' | 'error';

interface DatabaseContextType {
    status: DatabaseStatus;
    error: Error | null;
    isReady: boolean;
    isFallback: boolean; // True if using in-memory demo data
    retry: () => void;
}

const DatabaseContext = createContext<DatabaseContextType | undefined>(undefined);

interface DatabaseProviderProps {
    children: ReactNode;
    fallback?: ReactNode;
}

export const DatabaseProvider: React.FC<DatabaseProviderProps> = ({
    children,
    fallback
}) => {
    const [status, setStatus] = useState<DatabaseStatus>('initializing');
    const [error, setError] = useState<Error | null>(null);

    const initialize = useCallback(async () => {
        setStatus('initializing');
        setError(null);

        try {
            await initDatabase();
            setStatus('ready');
            console.log('✅ SQLite database initialized successfully');
        } catch (err) {
            console.warn('⚠️ SQLite initialization failed, falling back to demo data:', err);
            // Instead of showing an error, fall back to demo mode
            setError(err instanceof Error ? err : new Error('SQLite not available'));
            setStatus('fallback');
        }
    }, []);

    // Initialize on mount
    useEffect(() => {
        initialize();

        // Cleanup on unmount
        return () => {
            closeDatabase().catch(console.error);
        };
    }, [initialize]);

    const retry = useCallback(() => {
        initialize();
    }, [initialize]);

    const value = useMemo(() => ({
        status,
        error,
        isReady: status === 'ready' && isDatabaseReady(),
        isFallback: status === 'fallback',
        retry,
    }), [status, error, retry]);

    // Show loading state while initializing
    if (status === 'initializing') {
        return (
            <>
                {fallback || (
                    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'rgb(var(--color-bg-primary))' }}>
                        <div className="text-center">
                            <div className="relative w-16 h-16 mx-auto mb-4">
                                <div className="absolute inset-0 border-4 border-primary-500/30 rounded-full"></div>
                                <div className="absolute inset-0 border-4 border-transparent border-t-primary-500 rounded-full animate-spin"></div>
                            </div>
                            <h2 className="text-xl font-semibold text-foreground mb-2">
                                Loading RetailCore
                            </h2>
                            <p className="text-muted text-sm">
                                Setting up your store...
                            </p>
                        </div>
                    </div>
                )}
            </>
        );
    }

    // For both 'ready' and 'fallback' status, render children
    // The app will use demo data from contexts when in fallback mode
    return (
        <DatabaseContext.Provider value={value}>
            {children}
        </DatabaseContext.Provider>
    );
};

/**
 * Hook to access database context
 */
export const useDatabase = (): DatabaseContextType => {
    const context = useContext(DatabaseContext);
    if (!context) {
        throw new Error('useDatabase must be used within a DatabaseProvider');
    }
    return context;
};

export default DatabaseContext;

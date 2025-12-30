// Database initialization and connection management
// Using wa-sqlite for WebAssembly-based SQLite

// TODO: Uncomment when database module is installed
// import { SCHEMA, INDEXES, INITIAL_SETTINGS, DB_NAME } from './schema';

// Database instance singleton
let db: any = null;
let sqlite3: any = null;

// Initialize the database
export async function initDatabase(): Promise<void> {
    if (db) return;

    try {
        // Dynamic import of wa-sqlite
        // Note: In production, you may need to configure the WASM file path
        // TODO: Install and configure @aspect-build/aspect-sqlite3-wasm
        // const SQLiteModule = await import('@aspect-build/aspect-sqlite3-wasm');
        // TODO: Install and configure @aspect-build/aspect-sqlite3-wasm for production
        // For now, the app uses in-memory demo data from context providers
        console.warn('Database module not installed. Using in-memory demo data.');
        return;

        /* Uncomment when @aspect-build/aspect-sqlite3-wasm is installed:
        sqlite3 = await SQLiteModule.default();

        // Open or create the database
        db = new sqlite3.Database(DB_NAME);

        // Create all tables
        for (const [tableName, createSQL] of Object.entries(SCHEMA)) {
            db.exec(createSQL);
            console.log(`Table ${tableName} initialized`);
        }

        // Create indexes
        for (const indexSQL of INDEXES) {
            db.exec(indexSQL);
        }

        // Insert initial settings if not exist
        const stmt = db.prepare('SELECT COUNT(*) as count FROM settings');
        stmt.step();
        const result = stmt.getAsObject();
        stmt.free();

        if (result.count === 0) {
            for (const setting of INITIAL_SETTINGS) {
                db.run(
                    'INSERT INTO settings (key, value) VALUES (?, ?)',
                    [setting.key, setting.value]
                );
            }
            console.log('Initial settings inserted');
        }

        console.log('Database initialized successfully');
        */
    } catch (error) {
        console.error('Database initialization failed:', error);
        throw error;
    }
}

// Get database instance
export function getDatabase(): any {
    if (!db) {
        throw new Error('Database not initialized. Call initDatabase() first.');
    }
    return db;
}

// Execute a query and return results
export function query<T>(sql: string, params: any[] = []): T[] {
    const database = getDatabase();
    const stmt = database.prepare(sql);

    if (params.length > 0) {
        stmt.bind(params);
    }

    const results: T[] = [];
    while (stmt.step()) {
        results.push(stmt.getAsObject() as T);
    }
    stmt.free();

    return results;
}

// Execute a query and return a single result
export function queryOne<T>(sql: string, params: any[] = []): T | null {
    const results = query<T>(sql, params);
    return results.length > 0 ? results[0] : null;
}

// Execute a mutation (INSERT, UPDATE, DELETE)
export function execute(sql: string, params: any[] = []): { lastInsertRowId: number; changes: number } {
    const database = getDatabase();
    database.run(sql, params);

    return {
        lastInsertRowId: database.lastInsertRowId(),
        changes: database.changes(),
    };
}

// Transaction helper
export async function transaction<T>(callback: () => T): Promise<T> {
    const database = getDatabase();

    try {
        database.exec('BEGIN TRANSACTION');
        const result = callback();
        database.exec('COMMIT');
        return result;
    } catch (error) {
        database.exec('ROLLBACK');
        throw error;
    }
}

// Export database to file (for backup)
export function exportDatabase(): Uint8Array {
    const database = getDatabase();
    return database.export();
}

// Import database from file (for restore)
export async function importDatabase(data: Uint8Array): Promise<void> {
    if (!sqlite3) {
        throw new Error('SQLite not initialized');
    }

    // Close existing connection
    if (db) {
        db.close();
    }

    // Create new database from imported data
    db = new sqlite3.Database(data);
    console.log('Database imported successfully');
}

// Close database connection
export function closeDatabase(): void {
    if (db) {
        db.close();
        db = null;
        console.log('Database connection closed');
    }
}

// Helper function to calculate Weighted Average Cost (WAC)
export function calculateWAC(
    currentQuantity: number,
    currentWAC: number,
    newQuantity: number,
    newCost: number
): number {
    const totalQuantity = currentQuantity + newQuantity;
    if (totalQuantity === 0) return 0;

    const totalValue = (currentQuantity * currentWAC) + (newQuantity * newCost);
    return totalValue / totalQuantity;
}

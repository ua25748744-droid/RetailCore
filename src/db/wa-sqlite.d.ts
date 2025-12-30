// Type declarations for wa-sqlite
declare module 'wa-sqlite/dist/wa-sqlite-async.mjs' {
    const factory: () => Promise<any>;
    export default factory;
}

declare module 'wa-sqlite/src/examples/IDBBatchAtomicVFS.js' {
    export class IDBBatchAtomicVFS {
        constructor(name: string);
        isReady: Promise<void>;
    }
}

declare module 'wa-sqlite' {
    export function Factory(module: any): {
        open_v2: (filename: string, flags?: number, vfs?: string) => Promise<number>;
        exec: (db: number, sql: string, callback?: (row: any, columns: string[]) => void) => Promise<number>;
        close: (db: number) => Promise<number>;
        changes: (db: number) => number;
        vfs_register: (vfs: any, makeDefault?: boolean) => void;
    };
    export const SQLITE_OPEN_CREATE: number;
    export const SQLITE_OPEN_READWRITE: number;
}

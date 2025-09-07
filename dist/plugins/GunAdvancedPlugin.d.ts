import { ShogunCore, BasePlugin } from "shogun-core";
export interface GunAdvancedPluginConfig {
    enableDebug?: boolean;
    enableConnectionMonitoring?: boolean;
    defaultPageSize?: number;
    connectionTimeout?: number;
    debounceInterval?: number;
}
export interface GunCollectionOptions<T> {
    pageSize?: number;
    sortBy?: keyof T | ((a: T, b: T) => number);
    sortOrder?: 'asc' | 'desc';
    filter?: (item: T) => boolean;
    enableRealtime?: boolean;
}
export interface GunCollectionResult<T> {
    items: T[];
    currentPage: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    nextPage: () => void;
    prevPage: () => void;
    goToPage: (page: number) => void;
    isLoading: boolean;
    error: string | null;
    refresh: () => void;
    addItem: (item: T) => Promise<void>;
    updateItem: (id: string, updates: Partial<T>) => Promise<void>;
    removeItem: (id: string) => Promise<void>;
}
export interface GunStateResult<T> {
    data: T | null;
    isLoading: boolean;
    error: string | null;
    update: (updates: Partial<T>) => Promise<void>;
    set: (data: T) => Promise<void>;
    remove: () => Promise<void>;
    refresh: () => void;
}
export declare class GunAdvancedPlugin extends BasePlugin {
    version: string;
    readonly name = "gun-advanced";
    core: ShogunCore;
    private config;
    private debugEnabled;
    private connectionMonitors;
    private collectionCache;
    constructor(core: ShogunCore, config?: GunAdvancedPluginConfig);
    setDebugEnabled(enabled: boolean): void;
    private log;
    createHooks(): {
        useGunState: any;
        useGunCollection: any;
        useGunConnection: any;
        useGunDebug: any;
        useGunRealtime: any;
    };
    useGunState<T>(path: string, defaultValue?: T): GunStateResult<T>;
    useGunCollection<T>(path: string, options?: GunCollectionOptions<T>): GunCollectionResult<T>;
    useGunConnection(path: string): {
        isConnected: boolean;
        lastSeen: Date;
        error: string;
    };
    useGunDebug(path: string, enabled?: boolean): void;
    useGunRealtime<T>(path: string, callback?: (data: T, key: string) => void): {
        data: T;
        key: string;
    };
    put(path: string, data: any): Promise<void>;
    get(path: string): import("gun").IGunChain<any, import("gun").IGunInstance<any>, import("gun").IGunInstance<any>, string>;
    remove(path: string): Promise<void>;
    cleanup(): void;
    getStats(): {
        activeConnections: number;
        cachedCollections: number;
        debugEnabled: boolean;
        config: GunAdvancedPluginConfig;
    };
}

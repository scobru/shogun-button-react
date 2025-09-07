import React from 'react';
import { BasePlugin } from "shogun-core";
export class GunAdvancedPlugin extends BasePlugin {
    constructor(core, config = {}) {
        super();
        this.name = "gun-advanced";
        this.connectionMonitors = new Map();
        this.collectionCache = new Map();
        this.core = core;
        this.config = {
            enableDebug: true,
            enableConnectionMonitoring: true,
            defaultPageSize: 20,
            connectionTimeout: 10000,
            debounceInterval: 100,
            ...config
        };
        this.debugEnabled = this.config.enableDebug;
    }
    setDebugEnabled(enabled) {
        this.debugEnabled = enabled;
        this.log('Debug mode:', enabled ? 'enabled' : 'disabled');
    }
    log(...args) {
        if (this.debugEnabled) {
            console.log('[GunAdvancedPlugin]', ...args);
        }
    }
    createHooks() {
        return {
            useGunState: this.useGunState.bind(this),
            useGunCollection: this.useGunCollection.bind(this),
            useGunConnection: this.useGunConnection.bind(this),
            useGunDebug: this.useGunDebug.bind(this),
            useGunRealtime: this.useGunRealtime.bind(this),
        };
    }
    useGunState(path, defaultValue) {
        const [data, setData] = React.useState(defaultValue || null);
        const [isLoading, setIsLoading] = React.useState(true);
        const [error, setError] = React.useState(null);
        const isMounted = React.useRef(true);
        React.useEffect(() => {
            var _a;
            if (!((_a = this.core) === null || _a === void 0 ? void 0 : _a.gun) || !this.core.isLoggedIn())
                return;
            setIsLoading(true);
            setError(null);
            const chain = this.core.gun.get(path);
            const handler = (item) => {
                if (!isMounted.current)
                    return;
                if (item) {
                    setData(item);
                    setIsLoading(false);
                    setError(null);
                    this.log(`State updated for ${path}:`, item);
                }
            };
            chain.on(handler);
            const timeoutId = setTimeout(() => {
                if (isLoading) {
                    setError('Connection timeout - no data received');
                    setIsLoading(false);
                }
            }, this.config.connectionTimeout);
            return () => {
                isMounted.current = false;
                chain.off();
                clearTimeout(timeoutId);
            };
        }, [path]);
        const update = async (updates) => {
            var _a;
            if (!((_a = this.core) === null || _a === void 0 ? void 0 : _a.gun) || !this.core.isLoggedIn()) {
                throw new Error('SDK not initialized or user not logged in');
            }
            try {
                setError(null);
                const newData = { ...data, ...updates };
                await new Promise((resolve, reject) => {
                    this.core.gun.get(path).put(newData, (ack) => {
                        if (ack.err) {
                            reject(new Error(ack.err));
                        }
                        else {
                            resolve();
                        }
                    });
                });
                this.log(`State updated for ${path}:`, newData);
            }
            catch (err) {
                const errorMsg = err.message || 'Failed to update state';
                setError(errorMsg);
                this.log(`Error updating state for ${path}:`, errorMsg);
                throw err;
            }
        };
        const set = async (newData) => {
            var _a;
            if (!((_a = this.core) === null || _a === void 0 ? void 0 : _a.gun) || !this.core.isLoggedIn()) {
                throw new Error('SDK not initialized or user not logged in');
            }
            try {
                setError(null);
                await new Promise((resolve, reject) => {
                    this.core.gun.get(path).put(newData, (ack) => {
                        if (ack.err) {
                            reject(new Error(ack.err));
                        }
                        else {
                            resolve();
                        }
                    });
                });
                this.log(`State set for ${path}:`, newData);
            }
            catch (err) {
                const errorMsg = err.message || 'Failed to set state';
                setError(errorMsg);
                this.log(`Error setting state for ${path}:`, errorMsg);
                throw err;
            }
        };
        const remove = async () => {
            var _a;
            if (!((_a = this.core) === null || _a === void 0 ? void 0 : _a.gun) || !this.core.isLoggedIn()) {
                throw new Error('SDK not initialized or user not logged in');
            }
            try {
                setError(null);
                await new Promise((resolve, reject) => {
                    this.core.gun.get(path).put(null, (ack) => {
                        if (ack.err) {
                            reject(new Error(ack.err));
                        }
                        else {
                            resolve();
                        }
                    });
                });
                setData(null);
                this.log(`State removed for ${path}`);
            }
            catch (err) {
                const errorMsg = err.message || 'Failed to remove state';
                setError(errorMsg);
                this.log(`Error removing state for ${path}:`, errorMsg);
                throw err;
            }
        };
        const refresh = () => {
            var _a;
            setIsLoading(true);
            setError(null);
            if ((_a = this.core) === null || _a === void 0 ? void 0 : _a.gun) {
                this.core.gun.get(path).once(() => { });
            }
        };
        return {
            data,
            isLoading,
            error,
            update,
            set,
            remove,
            refresh
        };
    }
    useGunCollection(path, options = {}) {
        const { pageSize = this.config.defaultPageSize, sortBy, sortOrder = 'desc', filter, enableRealtime = true } = options;
        const [items, setItems] = React.useState([]);
        const [currentPage, setCurrentPage] = React.useState(0);
        const [isLoading, setIsLoading] = React.useState(true);
        const [error, setError] = React.useState(null);
        const [allItems, setAllItems] = React.useState([]);
        const isMounted = React.useRef(true);
        const cacheKey = `${path}-${JSON.stringify(options)}`;
        React.useEffect(() => {
            var _a;
            if (!((_a = this.core) === null || _a === void 0 ? void 0 : _a.gun) || !this.core.isLoggedIn())
                return;
            setIsLoading(true);
            setError(null);
            const chain = this.core.gun.get(path);
            const tempItems = [];
            const processItems = (items) => {
                if (!isMounted.current)
                    return;
                let processedItems = filter ? items.filter(filter) : items;
                if (sortBy) {
                    processedItems = [...processedItems].sort((a, b) => {
                        if (typeof sortBy === 'function') {
                            return sortOrder === 'asc' ? sortBy(a, b) : sortBy(b, a);
                        }
                        const aVal = a[sortBy];
                        const bVal = b[sortBy];
                        let comparison = 0;
                        if (aVal < bVal)
                            comparison = -1;
                        else if (aVal > bVal)
                            comparison = 1;
                        return sortOrder === 'asc' ? comparison : -comparison;
                    });
                }
                const startIndex = currentPage * pageSize;
                const endIndex = startIndex + pageSize;
                const pageItems = processedItems.slice(startIndex, endIndex);
                setAllItems(processedItems);
                setItems(pageItems);
                setIsLoading(false);
                setError(null);
                this.collectionCache.set(cacheKey, {
                    items: processedItems,
                    timestamp: Date.now()
                });
            };
            const mapHandler = (item, key) => {
                if (item) {
                    const itemWithKey = { ...item, _key: key };
                    tempItems.push(itemWithKey);
                    if (enableRealtime) {
                        processItems(tempItems);
                    }
                }
            };
            chain.map().on(mapHandler);
            const timeoutId = setTimeout(() => {
                if (isLoading) {
                    setError('Connection timeout - no data received');
                    setIsLoading(false);
                }
            }, this.config.connectionTimeout);
            return () => {
                isMounted.current = false;
                chain.off();
                clearTimeout(timeoutId);
            };
        }, [path, currentPage, pageSize, sortBy, sortOrder, filter, enableRealtime]);
        const totalPages = Math.ceil(allItems.length / pageSize);
        const hasNextPage = currentPage < totalPages - 1;
        const hasPrevPage = currentPage > 0;
        const nextPage = () => {
            if (hasNextPage)
                setCurrentPage(prev => prev + 1);
        };
        const prevPage = () => {
            if (hasPrevPage)
                setCurrentPage(prev => prev - 1);
        };
        const goToPage = (page) => {
            if (page >= 0 && page < totalPages)
                setCurrentPage(page);
        };
        const refresh = () => {
            var _a;
            setIsLoading(true);
            setError(null);
            this.collectionCache.delete(cacheKey);
            if ((_a = this.core) === null || _a === void 0 ? void 0 : _a.gun) {
                this.core.gun.get(path).once(() => { });
            }
        };
        const addItem = async (item) => {
            var _a;
            if (!((_a = this.core) === null || _a === void 0 ? void 0 : _a.gun) || !this.core.isLoggedIn()) {
                throw new Error('SDK not initialized or user not logged in');
            }
            try {
                setError(null);
                await new Promise((resolve, reject) => {
                    this.core.gun.get(path).set(item, (ack) => {
                        if (ack.err) {
                            reject(new Error(ack.err));
                        }
                        else {
                            resolve();
                        }
                    });
                });
                this.log(`Item added to collection ${path}:`, item);
                refresh();
            }
            catch (err) {
                const errorMsg = err.message || 'Failed to add item';
                setError(errorMsg);
                this.log(`Error adding item to collection ${path}:`, errorMsg);
                throw err;
            }
        };
        const updateItem = async (id, updates) => {
            var _a;
            if (!((_a = this.core) === null || _a === void 0 ? void 0 : _a.gun) || !this.core.isLoggedIn()) {
                throw new Error('SDK not initialized or user not logged in');
            }
            try {
                setError(null);
                await new Promise((resolve, reject) => {
                    this.core.gun.get(path).get(id).put(updates, (ack) => {
                        if (ack.err) {
                            reject(new Error(ack.err));
                        }
                        else {
                            resolve();
                        }
                    });
                });
                this.log(`Item updated in collection ${path}:`, { id, updates });
                refresh();
            }
            catch (err) {
                const errorMsg = err.message || 'Failed to update item';
                setError(errorMsg);
                this.log(`Error updating item in collection ${path}:`, errorMsg);
                throw err;
            }
        };
        const removeItem = async (id) => {
            var _a;
            if (!((_a = this.core) === null || _a === void 0 ? void 0 : _a.gun) || !this.core.isLoggedIn()) {
                throw new Error('SDK not initialized or user not logged in');
            }
            try {
                setError(null);
                await new Promise((resolve, reject) => {
                    this.core.gun.get(path).get(id).put(null, (ack) => {
                        if (ack.err) {
                            reject(new Error(ack.err));
                        }
                        else {
                            resolve();
                        }
                    });
                });
                this.log(`Item removed from collection ${path}:`, id);
                refresh();
            }
            catch (err) {
                const errorMsg = err.message || 'Failed to remove item';
                setError(errorMsg);
                this.log(`Error removing item from collection ${path}:`, errorMsg);
                throw err;
            }
        };
        return {
            items,
            currentPage,
            totalPages,
            hasNextPage,
            hasPrevPage,
            nextPage,
            prevPage,
            goToPage,
            isLoading,
            error,
            refresh,
            addItem,
            updateItem,
            removeItem
        };
    }
    useGunConnection(path) {
        const [isConnected, setIsConnected] = React.useState(false);
        const [lastSeen, setLastSeen] = React.useState(null);
        const [error, setError] = React.useState(null);
        React.useEffect(() => {
            var _a;
            if (!this.config.enableConnectionMonitoring || !((_a = this.core) === null || _a === void 0 ? void 0 : _a.gun) || !this.core.isLoggedIn())
                return;
            let timeoutId;
            const chain = this.core.gun.get(path);
            const resetTimeout = () => {
                clearTimeout(timeoutId);
                timeoutId = window.setTimeout(() => {
                    setIsConnected(false);
                    setError('Connection timeout');
                    this.log(`Connection timeout for ${path}`);
                }, this.config.connectionTimeout);
            };
            const handler = () => {
                setIsConnected(true);
                setLastSeen(new Date());
                setError(null);
                resetTimeout();
                this.log(`Connection active for ${path}`);
            };
            chain.on(handler);
            resetTimeout();
            this.connectionMonitors.set(path, { off: () => chain.off(), timeoutId });
            return () => {
                clearTimeout(timeoutId);
                chain.off();
                this.connectionMonitors.delete(path);
            };
        }, [path]);
        return { isConnected, lastSeen, error };
    }
    useGunDebug(path, enabled = true) {
        React.useEffect(() => {
            var _a;
            if (!enabled || !this.debugEnabled || !((_a = this.core) === null || _a === void 0 ? void 0 : _a.gun) || !this.core.isLoggedIn())
                return;
            this.log(`Debug mode enabled for ${path}`);
            const chain = this.core.gun.get(path);
            const handler = (data, key) => {
                this.log(`[${path}] Update:`, {
                    key,
                    data,
                    timestamp: new Date().toISOString(),
                });
            };
            chain.on(handler);
            return () => {
                chain.off();
                this.log(`Debug mode disabled for ${path}`);
            };
        }, [path, enabled]);
    }
    useGunRealtime(path, callback) {
        const [data, setData] = React.useState(null);
        const [key, setKey] = React.useState(null);
        React.useEffect(() => {
            var _a;
            if (!((_a = this.core) === null || _a === void 0 ? void 0 : _a.gun) || !this.core.isLoggedIn())
                return;
            const chain = this.core.gun.get(path);
            const handler = (item, itemKey) => {
                if (item) {
                    setData(item);
                    setKey(itemKey);
                    if (callback) {
                        callback(item, itemKey);
                    }
                    this.log(`Realtime update for ${path}:`, { data: item, key: itemKey });
                }
            };
            chain.on(handler);
            return () => {
                chain.off();
            };
        }, [path, callback]);
        return { data, key };
    }
    async put(path, data) {
        var _a;
        if (!((_a = this.core) === null || _a === void 0 ? void 0 : _a.gun) || !this.core.isLoggedIn()) {
            throw new Error('SDK not initialized or user not logged in');
        }
        return new Promise((resolve, reject) => {
            this.core.gun.get(path).put(data, (ack) => {
                if (ack.err) {
                    reject(new Error(ack.err));
                }
                else {
                    resolve();
                }
            });
        });
    }
    get(path) {
        var _a;
        if (!((_a = this.core) === null || _a === void 0 ? void 0 : _a.gun) || !this.core.isLoggedIn())
            return null;
        return this.core.gun.get(path);
    }
    async remove(path) {
        var _a;
        if (!((_a = this.core) === null || _a === void 0 ? void 0 : _a.gun) || !this.core.isLoggedIn()) {
            throw new Error('SDK not initialized or user not logged in');
        }
        return new Promise((resolve, reject) => {
            this.core.gun.get(path).put(null, (ack) => {
                if (ack.err) {
                    reject(new Error(ack.err));
                }
                else {
                    resolve();
                }
            });
        });
    }
    cleanup() {
        this.connectionMonitors.forEach(({ off, timeoutId }) => {
            clearTimeout(timeoutId);
            if (typeof off === 'function')
                off();
        });
        this.connectionMonitors.clear();
        this.collectionCache.clear();
        this.log('Plugin cleanup completed');
    }
    getStats() {
        return {
            activeConnections: this.connectionMonitors.size,
            cachedCollections: this.collectionCache.size,
            debugEnabled: this.debugEnabled,
            config: this.config
        };
    }
}

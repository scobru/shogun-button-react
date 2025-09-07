import React from 'react';
import { ShogunCore , BasePlugin} from "shogun-core";

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

export class GunAdvancedPlugin extends BasePlugin {
  version: string;
  public readonly name = "gun-advanced";
  public core: ShogunCore;
  private config: GunAdvancedPluginConfig;
  private debugEnabled: boolean;
  private connectionMonitors: Map<string, any> = new Map();
  private collectionCache: Map<string, any> = new Map();

  constructor(core: ShogunCore, config: GunAdvancedPluginConfig = {}) {
    super( );
    this.core = core;
    this.config = {
      enableDebug: true,
      enableConnectionMonitoring: true,
      defaultPageSize: 20,
      connectionTimeout: 10000,
      debounceInterval: 100,
      ...config
    };
    this.debugEnabled = this.config.enableDebug!;
  }

  setDebugEnabled(enabled: boolean): void {
    this.debugEnabled = enabled;
    this.log('Debug mode:', enabled ? 'enabled' : 'disabled');
  }

  private log(...args: any[]): void {
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

  useGunState<T>(path: string, defaultValue?: T): GunStateResult<T> {
    const [data, setData] = React.useState<T | null>(defaultValue || null);
    const [isLoading, setIsLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const isMounted = React.useRef(true);

    React.useEffect(() => {
      if (!this.core?.gun || !this.core.isLoggedIn()) return;

      setIsLoading(true);
      setError(null);

      const chain = this.core.gun.get(path);

      const handler = (item: any) => {
        if (!isMounted.current) return;

        if (item) {
          setData(item as T);
          setIsLoading(false);
          setError(null);
          this.log(`State updated for ${path}:`, item);
        }
      };
      chain.on(handler as any);

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

    const update = async (updates: Partial<T>): Promise<void> => {
      if (!this.core?.gun || !this.core.isLoggedIn()) {
        throw new Error('SDK not initialized or user not logged in');
      }

      try {
        setError(null);
        const newData = { ...data, ...updates } as T;
        
        await new Promise<void>((resolve, reject) => {
          this.core.gun.get(path).put(newData, (ack: any) => {
            if (ack.err) {
              reject(new Error(ack.err));
            } else {
              resolve();
            }
          });
        });
        
        this.log(`State updated for ${path}:`, newData);
      } catch (err: any) {
        const errorMsg = err.message || 'Failed to update state';
        setError(errorMsg);
        this.log(`Error updating state for ${path}:`, errorMsg);
        throw err;
      }
    };

    const set = async (newData: T): Promise<void> => {
      if (!this.core?.gun || !this.core.isLoggedIn()) {
        throw new Error('SDK not initialized or user not logged in');
      }

      try {
        setError(null);
        
        await new Promise<void>((resolve, reject) => {
          this.core.gun.get(path).put(newData, (ack: any) => {
            if (ack.err) {
              reject(new Error(ack.err));
            } else {
              resolve();
            }
          });
        });
        
        this.log(`State set for ${path}:`, newData);
      } catch (err: any) {
        const errorMsg = err.message || 'Failed to set state';
        setError(errorMsg);
        this.log(`Error setting state for ${path}:`, errorMsg);
        throw err;
      }
    };

    const remove = async (): Promise<void> => {
      if (!this.core?.gun || !this.core.isLoggedIn()) {
        throw new Error('SDK not initialized or user not logged in');
      }

      try {
        setError(null);
        
        await new Promise<void>((resolve, reject) => {
          this.core.gun.get(path).put(null, (ack: any) => {
            if (ack.err) {
              reject(new Error(ack.err));
            } else {
              resolve();
            }
          });
        });
        
        setData(null);
        this.log(`State removed for ${path}`);
      } catch (err: any) {
        const errorMsg = err.message || 'Failed to remove state';
        setError(errorMsg);
        this.log(`Error removing state for ${path}:`, errorMsg);
        throw err;
      }
    };

    const refresh = () => {
      setIsLoading(true);
      setError(null);
      if (this.core?.gun) {
        this.core.gun.get(path).once(() => {});
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

  useGunCollection<T>(
    path: string, 
    options: GunCollectionOptions<T> = {}
  ): GunCollectionResult<T> {
    const {
      pageSize = this.config.defaultPageSize,
      sortBy,
      sortOrder = 'desc',
      filter,
      enableRealtime = true
    } = options;

    const [items, setItems] = React.useState<T[]>([]);
    const [currentPage, setCurrentPage] = React.useState(0);
    const [isLoading, setIsLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const [allItems, setAllItems] = React.useState<T[]>([]);
    const isMounted = React.useRef(true);
    const cacheKey = `${path}-${JSON.stringify(options)}`;

    React.useEffect(() => {
      if (!this.core?.gun || !this.core.isLoggedIn()) return;

      setIsLoading(true);
      setError(null);

      const chain = this.core.gun.get(path);
      const tempItems: T[] = [];

      const processItems = (items: T[]) => {
        if (!isMounted.current) return;

        let processedItems = filter ? items.filter(filter) : items;

        if (sortBy) {
          processedItems = [...processedItems].sort((a, b) => {
            if (typeof sortBy === 'function') {
              return sortOrder === 'asc' ? sortBy(a, b) : sortBy(b, a);
            }
            const aVal = a[sortBy];
            const bVal = b[sortBy];
            let comparison = 0;
            if (aVal < bVal) comparison = -1;
            else if (aVal > bVal) comparison = 1;
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

      const mapHandler = (item: any, key: string) => {
        if (item) {
          const itemWithKey = { ...(item as T), _key: key } as T;
          tempItems.push(itemWithKey);

          if (enableRealtime) {
            processItems(tempItems);
          }
        }
      };
      chain.map().on(mapHandler as any);

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
      if (hasNextPage) setCurrentPage(prev => prev + 1);
    };

    const prevPage = () => {
      if (hasPrevPage) setCurrentPage(prev => prev - 1);
    };

    const goToPage = (page: number) => {
      if (page >= 0 && page < totalPages) setCurrentPage(page);
    };

    const refresh = () => {
      setIsLoading(true);
      setError(null);
      this.collectionCache.delete(cacheKey);
      if (this.core?.gun) {
        this.core.gun.get(path).once(() => {});
      }
    };

    const addItem = async (item: T): Promise<void> => {
      if (!this.core?.gun || !this.core.isLoggedIn()) {
        throw new Error('SDK not initialized or user not logged in');
      }

      try {
        setError(null);
        
        await new Promise<void>((resolve, reject) => {
          this.core.gun.get(path).set(item, (ack: any) => {
            if (ack.err) {
              reject(new Error(ack.err));
            } else {
              resolve();
            }
          });
        });
        
        this.log(`Item added to collection ${path}:`, item);
        refresh();
      } catch (err: any) {
        const errorMsg = err.message || 'Failed to add item';
        setError(errorMsg);
        this.log(`Error adding item to collection ${path}:`, errorMsg);
        throw err;
      }
    };

    const updateItem = async (id: string, updates: Partial<T>): Promise<void> => {
      if (!this.core?.gun || !this.core.isLoggedIn()) {
        throw new Error('SDK not initialized or user not logged in');
      }

      try {
        setError(null);
        
        await new Promise<void>((resolve, reject) => {
          this.core.gun.get(path).get(id).put(updates, (ack: any) => {
            if (ack.err) {
              reject(new Error(ack.err));
            } else {
              resolve();
            }
          });
        });
        
        this.log(`Item updated in collection ${path}:`, { id, updates });
        refresh();
      } catch (err: any) {
        const errorMsg = err.message || 'Failed to update item';
        setError(errorMsg);
        this.log(`Error updating item in collection ${path}:`, errorMsg);
        throw err;
      }
    };

    const removeItem = async (id: string): Promise<void> => {
      if (!this.core?.gun || !this.core.isLoggedIn()) {
        throw new Error('SDK not initialized or user not logged in');
      }

      try {
        setError(null);
        
        await new Promise<void>((resolve, reject) => {
          this.core.gun.get(path).get(id).put(null, (ack: any) => {
            if (ack.err) {
              reject(new Error(ack.err));
            } else {
              resolve();
            }
          });
        });
        
        this.log(`Item removed from collection ${path}:`, id);
        refresh();
      } catch (err: any) {
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

  useGunConnection(path: string) {
    const [isConnected, setIsConnected] = React.useState(false);
    const [lastSeen, setLastSeen] = React.useState<Date | null>(null);
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => {
      if (!this.config.enableConnectionMonitoring || !this.core?.gun || !this.core.isLoggedIn()) return;

      let timeoutId: number;
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
      chain.on(handler as any);

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

  useGunDebug(path: string, enabled: boolean = true) {
    React.useEffect(() => {
      if (!enabled || !this.debugEnabled || !this.core?.gun || !this.core.isLoggedIn()) return;

      this.log(`Debug mode enabled for ${path}`);
      const chain = this.core.gun.get(path);

      const handler = (data: any, key: string) => {
        this.log(`[${path}] Update:`, {
          key,
          data,
          timestamp: new Date().toISOString(),
        });
      };
      chain.on(handler as any);

      return () => {
        chain.off();
        this.log(`Debug mode disabled for ${path}`);
      };
    }, [path, enabled]);
  }

  useGunRealtime<T>(path: string, callback?: (data: T, key: string) => void) {
    const [data, setData] = React.useState<T | null>(null);
    const [key, setKey] = React.useState<string | null>(null);

    React.useEffect(() => {
      if (!this.core?.gun || !this.core.isLoggedIn()) return;

      const chain = this.core.gun.get(path);

      const handler = (item: any, itemKey: string) => {
        if (item) {
          setData(item as T);
          setKey(itemKey);

          if (callback) {
            callback(item as T, itemKey);
          }

          this.log(`Realtime update for ${path}:`, { data: item, key: itemKey });
        }
      };
      chain.on(handler as any);

      return () => {
        chain.off();
      };
    }, [path, callback]);

    return { data, key };
  }

  async put(path: string, data: any): Promise<void> {
    if (!this.core?.gun || !this.core.isLoggedIn()) {
      throw new Error('SDK not initialized or user not logged in');
    }

    return new Promise((resolve, reject) => {
      this.core.gun.get(path).put(data, (ack: any) => {
        if (ack.err) {
          reject(new Error(ack.err));
        } else {
          resolve();
        }
      });
    });
  }

  get(path: string) {
    if (!this.core?.gun || !this.core.isLoggedIn()) return null;
    return this.core.gun.get(path);
  }

  async remove(path: string): Promise<void> {
    if (!this.core?.gun || !this.core.isLoggedIn()) {
      throw new Error('SDK not initialized or user not logged in');
    }

    return new Promise((resolve, reject) => {
      this.core.gun.get(path).put(null, (ack: any) => {
        if (ack.err) {
          reject(new Error(ack.err));
        } else {
          resolve();
        }
      });
    });
  }

  cleanup(): void {
    this.connectionMonitors.forEach(({ off, timeoutId }) => {
      clearTimeout(timeoutId);
      if (typeof off === 'function') off();
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
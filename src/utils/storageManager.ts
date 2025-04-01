/**
 * Storage Manager for handling persistent data
 * Supports Chrome Extension Storage API with localStorage fallback
 */

type StorageValue = string | number | boolean | object | null | undefined;

interface StorageOptions {
  /** Use Chrome extension storage when available */
  useExtensionStorage?: boolean;
  /** Log performance metrics */
  debug?: boolean;
}

class StorageManager {
  private useExtensionStorage: boolean;
  private debug: boolean;

  constructor(options: StorageOptions = {}) {
    const { useExtensionStorage = true, debug = false } = options;
    this.useExtensionStorage = useExtensionStorage && this.isExtensionStorageAvailable();
    this.debug = debug;
  }

  /**
   * Check if Chrome extension storage is available
   */
  private isExtensionStorageAvailable(): boolean {
    return typeof chrome !== 'undefined' && 
           chrome.storage !== undefined && 
           chrome.storage.local !== undefined;
  }

  /**
   * Get data from storage
   * @param key The key to retrieve
   * @returns Promise resolving to the stored value or undefined if not found
   */
  async get<T = any>(key: string): Promise<T | undefined> {
    if (this.debug) console.time(`storage-get-${key}`);

    try {
      if (this.useExtensionStorage) {
        return new Promise<T | undefined>((resolve) => {
          chrome.storage.local.get(key, (result) => {
            const value = result[key] === undefined ? undefined : result[key];
            if (this.debug) {
              console.log(
                `Chrome storage get: ${key} →`,
                value !== undefined 
                  ? `(${JSON.stringify(value).length} bytes)` 
                  : "(not found)"
              );
              console.timeEnd(`storage-get-${key}`);
            }
            resolve(value);
          });
        });
      } else {
        const item = localStorage.getItem(key);
        const value = item !== null ? JSON.parse(item) as T : undefined;
        
        if (this.debug) {
          console.log(
            `Local storage get: ${key} →`,
            value !== undefined 
              ? `(${JSON.stringify(value).length} bytes)` 
              : "(not found)"
          );
          console.timeEnd(`storage-get-${key}`);
        }
        
        return value;
      }
    } catch (error) {
      console.error(`Error getting ${key} from storage:`, error);
      if (this.debug) console.timeEnd(`storage-get-${key}`);
      return undefined;
    }
  }

  /**
   * Save data to storage
   * @param key The key to store under
   * @param value The value to store
   * @returns Promise resolving when data is stored
   */
  async set<T extends StorageValue>(key: string, value: T): Promise<void> {
    if (this.debug) console.time(`storage-set-${key}`);
    
    try {
      if (this.useExtensionStorage) {
        return new Promise<void>((resolve) => {
          chrome.storage.local.set({ [key]: value }, () => {
            if (this.debug) {
              console.log(
                `Chrome storage set: ${key} →`,
                `(${JSON.stringify(value).length} bytes)`
              );
              console.timeEnd(`storage-set-${key}`);
            }
            resolve();
          });
        });
      } else {
        localStorage.setItem(key, JSON.stringify(value));
        
        if (this.debug) {
          console.log(
            `Local storage set: ${key} →`,
            `(${JSON.stringify(value).length} bytes)`
          );
          console.timeEnd(`storage-set-${key}`);
        }
      }
    } catch (error) {
      console.error(`Error setting ${key} in storage:`, error);
      if (this.debug) console.timeEnd(`storage-set-${key}`);
    }
  }

  /**
   * Remove data from storage
   * @param key The key to remove
   * @returns Promise resolving when data is removed
   */
  async remove(key: string): Promise<void> {
    if (this.debug) console.time(`storage-remove-${key}`);
    
    try {
      if (this.useExtensionStorage) {
        return new Promise<void>((resolve) => {
          chrome.storage.local.remove(key, () => {
            if (this.debug) {
              console.log(`Chrome storage remove: ${key}`);
              console.timeEnd(`storage-remove-${key}`);
            }
            resolve();
          });
        });
      } else {
        localStorage.removeItem(key);
        
        if (this.debug) {
          console.log(`Local storage remove: ${key}`);
          console.timeEnd(`storage-remove-${key}`);
        }
      }
    } catch (error) {
      console.error(`Error removing ${key} from storage:`, error);
      if (this.debug) console.timeEnd(`storage-remove-${key}`);
    }
  }

  /**
   * Clear all storage data
   * @returns Promise resolving when storage is cleared
   */
  async clear(): Promise<void> {
    if (this.debug) console.time('storage-clear');
    
    try {
      if (this.useExtensionStorage) {
        return new Promise<void>((resolve) => {
          chrome.storage.local.clear(() => {
            if (this.debug) {
              console.log('Chrome storage cleared');
              console.timeEnd('storage-clear');
            }
            resolve();
          });
        });
      } else {
        localStorage.clear();
        
        if (this.debug) {
          console.log('Local storage cleared');
          console.timeEnd('storage-clear');
        }
      }
    } catch (error) {
      console.error('Error clearing storage:', error);
      if (this.debug) console.timeEnd('storage-clear');
    }
  }

  /**
   * Get all keys in storage
   * @returns Promise resolving to array of keys
   */
  async getAllKeys(): Promise<string[]> {
    if (this.debug) console.time('storage-get-all-keys');
    
    try {
      if (this.useExtensionStorage) {
        return new Promise<string[]>((resolve) => {
          chrome.storage.local.get(null, (result) => {
            const keys = Object.keys(result);
            if (this.debug) {
              console.log(`Chrome storage keys: ${keys.length} found`);
              console.timeEnd('storage-get-all-keys');
            }
            resolve(keys);
          });
        });
      } else {
        const keys = Object.keys(localStorage);
        
        if (this.debug) {
          console.log(`Local storage keys: ${keys.length} found`);
          console.timeEnd('storage-get-all-keys');
        }
        
        return keys;
      }
    } catch (error) {
      console.error('Error getting all keys from storage:', error);
      if (this.debug) console.timeEnd('storage-get-all-keys');
      return [];
    }
  }
}

// Create and export a default instance with debug mode based on environment
const storageManager = new StorageManager({ 
  debug: process.env.NODE_ENV === 'development' 
});

export default storageManager;
export { StorageManager };

// Unified localStorage service for all data persistence
// Replaces MongoDB and file-based stores with localStorage + in-memory fallback

const PREFIX = "petromanage:";

export interface StorageItem {
  id: string;
  [key: string]: any;
}

class LocalStorageService {
  private cache: Map<string, StorageItem[]> = new Map();

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    if (typeof window === "undefined") return;
    try {
      const keys = Object.keys(localStorage);
      for (const key of keys) {
        if (key.startsWith(PREFIX)) {
          const collectionName = key.substring(PREFIX.length);
          const data = localStorage.getItem(key);
          if (data) {
            try {
              this.cache.set(collectionName, JSON.parse(data));
            } catch {
              // Skip invalid entries
            }
          }
        }
      }
    } catch {
      // localStorage not available
    }
  }

  private persist(collection: string, data: StorageItem[]) {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(PREFIX + collection, JSON.stringify(data));
      // Dispatch event for other tabs/components
      window.dispatchEvent(
        new CustomEvent("storage-updated", {
          detail: { collection, data },
        })
      );
    } catch {
      // localStorage quota exceeded or not available
    }
  }

  private getCollection(collection: string): StorageItem[] {
    if (!this.cache.has(collection)) {
      this.cache.set(collection, []);
    }
    return this.cache.get(collection)!;
  }

  create(collection: string, item: StorageItem): StorageItem {
    const items = this.getCollection(collection);
    items.push(item);
    this.persist(collection, items);
    return item;
  }

  read(collection: string, id: string): StorageItem | null {
    const items = this.getCollection(collection);
    return items.find((item) => item.id === id) || null;
  }

  readAll(collection: string): StorageItem[] {
    return this.getCollection(collection);
  }

  update(collection: string, id: string, updates: Partial<StorageItem>): StorageItem | null {
    const items = this.getCollection(collection);
    const index = items.findIndex((item) => item.id === id);
    if (index === -1) return null;

    const updated = { ...items[index], ...updates };
    items[index] = updated;
    this.persist(collection, items);
    return updated;
  }

  delete(collection: string, id: string): boolean {
    const items = this.getCollection(collection);
    const index = items.findIndex((item) => item.id === id);
    if (index === -1) return false;

    items.splice(index, 1);
    this.persist(collection, items);
    return true;
  }

  deleteAll(collection: string): void {
    this.cache.set(collection, []);
    if (typeof window !== "undefined") {
      localStorage.removeItem(PREFIX + collection);
    }
  }

  query(
    collection: string,
    predicate: (item: StorageItem) => boolean
  ): StorageItem[] {
    return this.getCollection(collection).filter(predicate);
  }

  findOne(
    collection: string,
    predicate: (item: StorageItem) => boolean
  ): StorageItem | null {
    return this.getCollection(collection).find(predicate) || null;
  }

  clear(): void {
    if (typeof window === "undefined") return;
    try {
      const keys = Object.keys(localStorage);
      for (const key of keys) {
        if (key.startsWith(PREFIX)) {
          localStorage.removeItem(key);
        }
      }
      this.cache.clear();
    } catch {
      // localStorage not available
    }
  }
}

// Singleton instance
let instance: LocalStorageService;

export function getStorageService(): LocalStorageService {
  if (typeof window === "undefined") {
    // Server-side: return a no-op service
    return new LocalStorageService();
  }
  if (!instance) {
    instance = new LocalStorageService();
  }
  return instance;
}

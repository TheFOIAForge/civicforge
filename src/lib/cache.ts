interface CacheEntry<T> {
  data: T;
  expiry: number;
}

class APICache {
  private store = new Map<string, CacheEntry<unknown>>();

  get<T>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiry) {
      this.store.delete(key);
      return null;
    }
    return entry.data as T;
  }

  set<T>(key: string, data: T, ttlSeconds: number): void {
    this.store.set(key, {
      data,
      expiry: Date.now() + ttlSeconds * 1000,
    });
  }

  clear(): void {
    this.store.clear();
  }
}

// Singleton — lives for the lifetime of the server process
export const cache = new APICache();

// TTL constants in seconds
export const TTL = {
  MEMBER_LIST: 3600,       // 1 hour
  MEMBER_DETAIL: 3600,     // 1 hour
  FINANCE: 86400,          // 24 hours
  VOTES: 21600,            // 6 hours
  ADDRESS_LOOKUP: 300,     // 5 minutes
  BILLS: 3600,             // 1 hour
  LOBBYING: 86400,         // 24 hours
  NONPROFITS: 86400,       // 24 hours
  FED_REGISTER: 3600,      // 1 hour
  GAO: 21600,              // 6 hours
  HEARINGS: 3600,          // 1 hour
  SPENDING: 86400,         // 24 hours
} as const;

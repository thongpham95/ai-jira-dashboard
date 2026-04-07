// Simple in-memory cache with TTL support
// For production, consider using Redis or similar

interface CacheEntry<T> {
    data: T;
    expiry: number;
    createdAt: number;
}

interface CacheOptions {
    ttlMs?: number; // Time-to-live in milliseconds
    maxSize?: number; // Maximum number of entries
}

const DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 minutes
const DEFAULT_MAX_SIZE = 100;

class MemoryCache {
    private cache: Map<string, CacheEntry<any>> = new Map();
    private maxSize: number;

    constructor(maxSize: number = DEFAULT_MAX_SIZE) {
        this.maxSize = maxSize;
    }

    /**
     * Get a value from cache
     * Returns undefined if not found or expired
     */
    get<T>(key: string): T | undefined {
        const entry = this.cache.get(key);
        if (!entry) return undefined;

        // Check if expired
        if (Date.now() > entry.expiry) {
            this.cache.delete(key);
            return undefined;
        }

        return entry.data as T;
    }

    /**
     * Set a value in cache with optional TTL
     */
    set<T>(key: string, data: T, ttlMs: number = DEFAULT_TTL_MS): void {
        // Evict oldest entries if at capacity
        if (this.cache.size >= this.maxSize) {
            this.evictOldest();
        }

        this.cache.set(key, {
            data,
            expiry: Date.now() + ttlMs,
            createdAt: Date.now(),
        });
    }

    /**
     * Check if key exists and is not expired
     */
    has(key: string): boolean {
        return this.get(key) !== undefined;
    }

    /**
     * Delete a specific key
     */
    delete(key: string): boolean {
        return this.cache.delete(key);
    }

    /**
     * Clear all cache entries
     */
    clear(): void {
        this.cache.clear();
    }

    /**
     * Clear entries matching a pattern (prefix)
     */
    clearByPrefix(prefix: string): number {
        let cleared = 0;
        for (const key of this.cache.keys()) {
            if (key.startsWith(prefix)) {
                this.cache.delete(key);
                cleared++;
            }
        }
        return cleared;
    }

    /**
     * Get cache stats
     */
    getStats(): { size: number; maxSize: number; keys: string[] } {
        // Clean expired entries first
        this.cleanExpired();
        return {
            size: this.cache.size,
            maxSize: this.maxSize,
            keys: Array.from(this.cache.keys()),
        };
    }

    /**
     * Evict the oldest entry
     */
    private evictOldest(): void {
        let oldestKey: string | null = null;
        let oldestTime = Infinity;

        for (const [key, entry] of this.cache.entries()) {
            if (entry.createdAt < oldestTime) {
                oldestTime = entry.createdAt;
                oldestKey = key;
            }
        }

        if (oldestKey) {
            this.cache.delete(oldestKey);
        }
    }

    /**
     * Clean all expired entries
     */
    private cleanExpired(): void {
        const now = Date.now();
        for (const [key, entry] of this.cache.entries()) {
            if (now > entry.expiry) {
                this.cache.delete(key);
            }
        }
    }
}

// Singleton cache instance
const globalCache = new MemoryCache(200);

/**
 * Cache helper with automatic key generation
 */
export async function withCache<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: CacheOptions = {}
): Promise<T> {
    const { ttlMs = DEFAULT_TTL_MS } = options;

    // Check cache first
    const cached = globalCache.get<T>(key);
    if (cached !== undefined) {
        console.log(`[CACHE HIT] ${key}`);
        return cached;
    }

    console.log(`[CACHE MISS] ${key}`);

    // Fetch fresh data
    const data = await fetcher();

    // Store in cache
    globalCache.set(key, data, ttlMs);

    return data;
}

/**
 * Generate cache key from parameters
 */
export function createCacheKey(prefix: string, params: Record<string, any>): string {
    const sortedParams = Object.keys(params)
        .sort()
        .filter((k) => params[k] !== undefined && params[k] !== null)
        .map((k) => `${k}=${JSON.stringify(params[k])}`)
        .join("&");
    return `${prefix}:${sortedParams}`;
}

/**
 * Clear cache by prefix
 */
export function clearCache(prefix?: string): number {
    if (prefix) {
        return globalCache.clearByPrefix(prefix);
    }
    globalCache.clear();
    return -1; // All cleared
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
    return globalCache.getStats();
}

// TTL constants for different data types
export const CACHE_TTL = {
    PROJECTS: 10 * 60 * 1000, // 10 minutes - project list rarely changes
    USERS: 10 * 60 * 1000, // 10 minutes
    ISSUES: 2 * 60 * 1000, // 2 minutes - issues change more frequently
    WORKLOGS: 5 * 60 * 1000, // 5 minutes
    ACTIVE_TASKS: 30 * 1000, // 30 seconds - real-time data
    PERFORMANCE: 5 * 60 * 1000, // 5 minutes - performance metrics
    TEAM_COMPARISON: 5 * 60 * 1000, // 5 minutes
    AI_SUMMARY: 15 * 60 * 1000, // 15 minutes - AI responses are expensive
};

export { globalCache };

// Server-side data fetching utilities for improved SSR performance
// These utilities are designed for use in Server Components

import { headers, cookies } from 'next/headers';

/**
 * Configuration for server-side fetch operations
 */
export interface ServerFetchOptions extends RequestInit {
    /**
     * Cache control options
     */
    cacheOptions?: {
        /**
         * Revalidation time in seconds
         */
        revalidate?: number | false;
        /**
         * Cache tags for on-demand revalidation
         */
        tags?: string[];
    };
    /**
     * Timeout in milliseconds
     */
    timeout?: number;
}

/**
 * Enhanced fetch for server components with proper caching and error handling
 */
export async function serverFetch<T>(
    url: string,
    options: ServerFetchOptions = {}
): Promise<T> {
    const { cacheOptions, timeout = 30000, ...fetchOptions } = options;

    // Set up abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
        const res = await fetch(url, {
            ...fetchOptions,
            signal: controller.signal,
            next: cacheOptions ? {
                revalidate: cacheOptions.revalidate,
                tags: cacheOptions.tags,
            } : undefined,
        });

        if (!res.ok) {
            throw new Error(`Fetch failed: ${res.status} ${res.statusText}`);
        }

        return await res.json() as T;
    } finally {
        clearTimeout(timeoutId);
    }
}

/**
 * Get the base URL for internal API calls
 */
export function getBaseUrl(): string {
    // In development, use localhost
    if (process.env.NODE_ENV === 'development') {
        return 'http://localhost:3000';
    }

    // In production, construct from headers or use env
    if (process.env.NEXTAUTH_URL) {
        return process.env.NEXTAUTH_URL;
    }

    // Fallback
    return 'http://localhost:3000';
}

/**
 * Make an internal API call from a server component
 */
export async function internalApi<T>(
    path: string,
    options: ServerFetchOptions = {}
): Promise<T> {
    const baseUrl = getBaseUrl();
    const url = `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;

    // Forward cookies for authentication
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.getAll()
        .map(c => `${c.name}=${c.value}`)
        .join('; ');

    return serverFetch<T>(url, {
        ...options,
        headers: {
            ...options.headers,
            Cookie: cookieHeader,
        },
    });
}

/**
 * Prefetch hints for client navigation
 */
export function getPrefetchHeaders() {
    return {
        'X-Prefetch': 'true',
        'Cache-Control': 'max-age=300', // 5 minute cache
    };
}

/**
 * Generate static params for common pages (for static generation)
 */
export async function generateCommonStaticParams() {
    // This can be extended to pre-generate pages for common routes
    return [];
}

/**
 * Streaming helper for large data sets
 * Returns data in chunks for progressive rendering
 */
export async function* streamData<T>(
    items: T[],
    chunkSize: number = 10
): AsyncGenerator<T[], void, unknown> {
    for (let i = 0; i < items.length; i += chunkSize) {
        yield items.slice(i, i + chunkSize);
        // Small delay to allow React to render
        await new Promise(resolve => setTimeout(resolve, 0));
    }
}

/**
 * Parallel data fetching with proper error handling
 */
export async function parallelFetch<T extends Record<string, Promise<any>>>(
    fetchers: T
): Promise<{ [K in keyof T]: Awaited<T[K]> | null }> {
    const keys = Object.keys(fetchers) as (keyof T)[];
    const promises = keys.map(key => fetchers[key]);

    const results = await Promise.allSettled(promises);

    const output = {} as { [K in keyof T]: Awaited<T[K]> | null };
    keys.forEach((key, index) => {
        const result = results[index];
        output[key] = result.status === 'fulfilled' ? result.value : null;
    });

    return output;
}

// Pagination utilities for optimized data fetching

export interface PaginationParams {
    page: number;
    pageSize: number;
}

export interface PaginatedResponse<T> {
    data: T[];
    pagination: {
        page: number;
        pageSize: number;
        totalItems: number;
        totalPages: number;
        hasNextPage: boolean;
        hasPrevPage: boolean;
    };
}

/**
 * Default pagination settings
 */
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

/**
 * Parse pagination params from request URL
 */
export function parsePaginationParams(url: string | URL): PaginationParams {
    const searchParams = typeof url === 'string' ? new URL(url).searchParams : url.searchParams;

    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const pageSize = Math.min(
        MAX_PAGE_SIZE,
        Math.max(1, parseInt(searchParams.get('pageSize') || String(DEFAULT_PAGE_SIZE), 10))
    );

    return { page, pageSize };
}

/**
 * Create pagination params for URL
 */
export function createPaginationQuery(params: Partial<PaginationParams>): URLSearchParams {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set('page', String(params.page));
    if (params.pageSize) searchParams.set('pageSize', String(params.pageSize));
    return searchParams;
}

/**
 * Paginate an array of items (client-side pagination)
 */
export function paginateArray<T>(
    items: T[],
    params: PaginationParams
): PaginatedResponse<T> {
    const { page, pageSize } = params;
    const totalItems = items.length;
    const totalPages = Math.ceil(totalItems / pageSize);

    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const data = items.slice(startIndex, endIndex);

    return {
        data,
        pagination: {
            page,
            pageSize,
            totalItems,
            totalPages,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1,
        },
    };
}

/**
 * Calculate offset for database/API queries
 */
export function calculateOffset(params: PaginationParams): { offset: number; limit: number } {
    return {
        offset: (params.page - 1) * params.pageSize,
        limit: params.pageSize,
    };
}

/**
 * Create a paginated response from total count and data
 */
export function createPaginatedResponse<T>(
    data: T[],
    totalItems: number,
    params: PaginationParams
): PaginatedResponse<T> {
    const totalPages = Math.ceil(totalItems / params.pageSize);

    return {
        data,
        pagination: {
            page: params.page,
            pageSize: params.pageSize,
            totalItems,
            totalPages,
            hasNextPage: params.page < totalPages,
            hasPrevPage: params.page > 1,
        },
    };
}

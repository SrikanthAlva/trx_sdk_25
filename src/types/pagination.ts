/**
 * Pagination options for fetching transactions
 */
export interface PaginationOptions {
	/** Maximum number of transactions to return */
	readonly limit?: number
	/** Page number (for page-based pagination like Etherscan) */
	readonly page?: number
	/** Cursor/token for cursor-based pagination (like Solana) */
	readonly cursor?: string
	/** Start timestamp (in milliseconds) */
	readonly startTime?: number
	/** End timestamp (in milliseconds) */
	readonly endTime?: number
}

/**
 * Pagination metadata in response
 */
export interface PaginationMetadata {
	/** Total number of transactions (if available) */
	readonly total?: number
	/** Current page (for page-based pagination) */
	readonly page?: number
	/** Total pages (for page-based pagination) */
	readonly totalPages?: number
	/** Next cursor/token (for cursor-based pagination) */
	readonly nextCursor?: string
	/** Has more results */
	readonly hasMore: boolean
}

/**
 * Paginated response wrapper
 */
export interface PaginatedResponse<T> {
	/** The data items */
	readonly data: readonly T[]
	/** Pagination metadata */
	readonly pagination: PaginationMetadata
}


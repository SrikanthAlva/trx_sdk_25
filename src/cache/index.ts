/**
 * Cache entry with metadata
 */
interface CacheEntry<T> {
	readonly value: T
	readonly expiresAt: number
	readonly createdAt: number
}

/**
 * Cache interface
 */
export interface ICache<T = unknown> {
	/**
	 * Get a value from cache
	 * @param key - Cache key
	 * @returns Cached value or undefined if not found/expired
	 */
	get(key: string): T | undefined

	/**
	 * Set a value in cache
	 * @param key - Cache key
	 * @param value - Value to cache
	 * @param ttl - Time to live in milliseconds
	 */
	set(key: string, value: T, ttl?: number): void

	/**
	 * Delete a value from cache
	 * @param key - Cache key
	 */
	delete(key: string): void

	/**
	 * Clear all cache entries
	 */
	clear(): void

	/**
	 * Check if a key exists in cache
	 * @param key - Cache key
	 * @returns true if key exists and is not expired
	 */
	has(key: string): boolean

	/**
	 * Get cache size
	 * @returns Number of entries in cache
	 */
	size(): number
}

/**
 * Cache configuration
 */
export interface CacheConfig {
	/** Default TTL in milliseconds */
	readonly defaultTtl?: number
	/** Maximum cache size */
	readonly maxSize?: number
	/** Enable cache */
	readonly enabled?: boolean
}


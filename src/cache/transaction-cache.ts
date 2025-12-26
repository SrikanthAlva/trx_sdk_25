import { Transaction } from '../types/transaction.js'
import { PaginatedResponse } from '../types/pagination.js'
import { MemoryCache } from './memory-cache.js'
import { CacheConfig } from './index.js'

/**
 * Cache key generator for transaction queries
 */
export class TransactionCacheKeyGenerator {
	/**
	 * Generate cache key for transaction query
	 * @param network - Network name
	 * @param address - Address/public key
	 * @param options - Query options
	 * @returns Cache key
	 */
	static generateKey(
		network: string,
		address: string,
		options?: {
			limit?: number
			page?: number
			cursor?: string
			startTime?: number
			endTime?: number
		}
	): string {
		const parts = [
			'tx',
			network,
			address.toLowerCase(),
			options?.limit?.toString() || '100',
			options?.page?.toString() || '1',
			options?.cursor || '',
			options?.startTime?.toString() || '',
			options?.endTime?.toString() || '',
		]
		return parts.join(':')
	}
}

/**
 * Transaction cache wrapper
 */
export class TransactionCache {
	private cache: MemoryCache<PaginatedResponse<Transaction>>

	constructor(config: CacheConfig = {}) {
		this.cache = new MemoryCache<PaginatedResponse<Transaction>>({
			defaultTtl: config.defaultTtl || 30000, // 30 seconds default
			maxSize: config.maxSize || 100, // Cache up to 100 queries
			enabled: config.enabled !== false,
		})
	}

	/**
	 * Get cached transactions
	 * @param network - Network name
	 * @param address - Address/public key
	 * @param options - Query options
	 * @returns Cached response or undefined
	 */
	get(
		network: string,
		address: string,
		options?: {
			limit?: number
			page?: number
			cursor?: string
			startTime?: number
			endTime?: number
		}
	): PaginatedResponse<Transaction> | undefined {
		const key = TransactionCacheKeyGenerator.generateKey(network, address, options)
		return this.cache.get(key)
	}

	/**
	 * Cache transactions
	 * @param network - Network name
	 * @param address - Address/public key
	 * @param response - Transaction response to cache
	 * @param options - Query options
	 * @param ttl - Time to live in milliseconds (optional)
	 */
	set(
		network: string,
		address: string,
		response: PaginatedResponse<Transaction>,
		options?: {
			limit?: number
			page?: number
			cursor?: string
			startTime?: number
			endTime?: number
		},
		ttl?: number
	): void {
		const key = TransactionCacheKeyGenerator.generateKey(network, address, options)
		this.cache.set(key, response, ttl)
	}

	/**
	 * Invalidate cache for an address
	 * @param network - Network name
	 * @param address - Address/public key
	 */
	invalidate(network: string, address: string): void {
		// Since we can't easily delete by prefix, we'll clear all cache
		// In a production system, you'd want a more sophisticated invalidation strategy
		this.cache.clear()
	}

	/**
	 * Clear all cached transactions
	 */
	clear(): void {
		this.cache.clear()
	}

	/**
	 * Get cache statistics
	 */
	getStats() {
		return this.cache.getStats()
	}
}


import { ICache, CacheConfig } from './index.js'

/**
 * In-memory cache entry
 */
interface MemoryCacheEntry<T> {
	readonly value: T
	readonly expiresAt: number
	readonly createdAt: number
}

/**
 * In-memory cache implementation
 */
export class MemoryCache<T = unknown> implements ICache<T> {
	private readonly defaultTtl: number
	private readonly maxSize: number
	private readonly enabled: boolean
	private cache: Map<string, MemoryCacheEntry<T>> = new Map()

	constructor(config: CacheConfig = {}) {
		this.defaultTtl = config.defaultTtl || 60000 // 1 minute default
		this.maxSize = config.maxSize || Infinity
		this.enabled = config.enabled !== false
	}

	/**
	 * Check if entry is expired
	 */
	private isExpired(entry: MemoryCacheEntry<T>): boolean {
		return Date.now() > entry.expiresAt
	}

	/**
	 * Evict expired entries
	 */
	private evictExpired(): void {
		const now = Date.now()
		for (const [key, entry] of this.cache.entries()) {
			if (now > entry.expiresAt) {
				this.cache.delete(key)
			}
		}
	}

	/**
	 * Evict oldest entries if cache is full
	 */
	private evictOldest(): void {
		if (this.cache.size < this.maxSize) {
			return
		}

		// Sort entries by creation time and remove oldest
		const entries = Array.from(this.cache.entries()).sort(
			([, a], [, b]) => a.createdAt - b.createdAt
		)

		const toRemove = this.cache.size - this.maxSize + 1
		for (let i = 0; i < toRemove; i++) {
			this.cache.delete(entries[i][0])
		}
	}

	get(key: string): T | undefined {
		if (!this.enabled) {
			return undefined
		}

		this.evictExpired()

		const entry = this.cache.get(key)
		if (!entry) {
			return undefined
		}

		if (this.isExpired(entry)) {
			this.cache.delete(key)
			return undefined
		}

		return entry.value
	}

	set(key: string, value: T, ttl?: number): void {
		if (!this.enabled) {
			return
		}

		this.evictExpired()
		this.evictOldest()

		const now = Date.now()
		const expiresAt = now + (ttl || this.defaultTtl)

		this.cache.set(key, {
			value,
			expiresAt,
			createdAt: now,
		})
	}

	delete(key: string): void {
		this.cache.delete(key)
	}

	clear(): void {
		this.cache.clear()
	}

	has(key: string): boolean {
		if (!this.enabled) {
			return false
		}

		this.evictExpired()

		const entry = this.cache.get(key)
		if (!entry) {
			return false
		}

		if (this.isExpired(entry)) {
			this.cache.delete(key)
			return false
		}

		return true
	}

	size(): number {
		this.evictExpired()
		return this.cache.size
	}

	/**
	 * Get cache statistics
	 */
	getStats(): {
		size: number
		maxSize: number
		enabled: boolean
		defaultTtl: number
	} {
		return {
			size: this.size(),
			maxSize: this.maxSize,
			enabled: this.enabled,
			defaultTtl: this.defaultTtl,
		}
	}
}


/**
 * Rate limiter configuration
 */
export interface RateLimiterConfig {
	/** Maximum requests per second */
	readonly requestsPerSecond?: number
	/** Maximum requests per minute */
	readonly requestsPerMinute?: number
	/** Enable rate limiting */
	readonly enabled?: boolean
}

/**
 * Rate limiter implementation using token bucket algorithm
 */
export class RateLimiter {
	private readonly requestsPerSecond: number
	private readonly requestsPerMinute: number
	private readonly enabled: boolean

	// Token bucket for per-second limiting
	private secondTokens: number
	private secondLastRefill: number

	// Token bucket for per-minute limiting
	private minuteTokens: number
	private minuteLastRefill: number

	// Request queue
	private queue: Array<{
		resolve: () => void
		reject: (error: Error) => void
	}> = []
	private processing = false

	constructor(config: RateLimiterConfig = {}) {
		this.requestsPerSecond = config.requestsPerSecond || Infinity
		this.requestsPerMinute = config.requestsPerMinute || Infinity
		this.enabled = config.enabled !== false

		// Initialize token buckets
		this.secondTokens = this.requestsPerSecond
		this.secondLastRefill = Date.now()
		this.minuteTokens = this.requestsPerMinute
		this.minuteLastRefill = Date.now()
	}

	/**
	 * Refill tokens based on elapsed time
	 */
	private refillTokens(): void {
		const now = Date.now()

		// Refill per-second tokens
		const secondsElapsed = (now - this.secondLastRefill) / 1000
		if (secondsElapsed >= 1) {
			this.secondTokens = this.requestsPerSecond
			this.secondLastRefill = now
		} else {
			const tokensToAdd = secondsElapsed * this.requestsPerSecond
			this.secondTokens = Math.min(this.requestsPerSecond, this.secondTokens + tokensToAdd)
		}

		// Refill per-minute tokens
		const minutesElapsed = (now - this.minuteLastRefill) / 60000
		if (minutesElapsed >= 1) {
			this.minuteTokens = this.requestsPerMinute
			this.minuteLastRefill = now
		} else {
			const tokensToAdd = minutesElapsed * this.requestsPerMinute
			this.minuteTokens = Math.min(this.requestsPerMinute, this.minuteTokens + tokensToAdd)
		}
	}

	/**
	 * Check if a request can be made immediately
	 */
	private canMakeRequest(): boolean {
		if (!this.enabled) {
			return true
		}

		this.refillTokens()

		return this.secondTokens >= 1 && this.minuteTokens >= 1
	}

	/**
	 * Consume tokens for a request
	 */
	private consumeTokens(): void {
		if (!this.enabled) {
			return
		}

		this.secondTokens = Math.max(0, this.secondTokens - 1)
		this.minuteTokens = Math.max(0, this.minuteTokens - 1)
	}

	/**
	 * Calculate delay until next request can be made
	 */
	private calculateDelay(): number {
		if (!this.enabled) {
			return 0
		}

		this.refillTokens()

		const now = Date.now()
		let maxDelay = 0

		// Calculate delay for per-second limit
		if (this.secondTokens < 1) {
			const secondsUntilRefill = 1 - (now - this.secondLastRefill) / 1000
			const delay = Math.max(0, secondsUntilRefill * 1000)
			maxDelay = Math.max(maxDelay, delay)
		}

		// Calculate delay for per-minute limit
		if (this.minuteTokens < 1) {
			const minutesUntilRefill = 1 - (now - this.minuteLastRefill) / 60000
			const delay = Math.max(0, minutesUntilRefill * 60000)
			maxDelay = Math.max(maxDelay, delay)
		}

		// Ensure minimum delay to prevent tight loops when tokens aren't available
		// If tokens are available, return 0; otherwise ensure at least 10ms delay
		if (maxDelay === 0 && (this.secondTokens < 1 || this.minuteTokens < 1)) {
			return 10 // Minimum delay to prevent tight loops
		}

		return Math.ceil(maxDelay)
	}

	/**
	 * Process queued requests
	 */
	private async processQueue(): Promise<void> {
		if (this.processing || this.queue.length === 0) {
			return
		}

		this.processing = true
		let iterations = 0
		const maxIterations = 1000 // Prevent infinite loops

		while (this.queue.length > 0 && iterations < maxIterations) {
			iterations++

			if (this.canMakeRequest()) {
				const item = this.queue.shift()
				if (item) {
					this.consumeTokens()
					item.resolve()
				}
			} else {
				const delay = Math.max(this.calculateDelay(), 10) // Minimum 10ms delay
				await new Promise((resolve) => setTimeout(resolve, delay))
			}
		}

		this.processing = false

		// If we hit max iterations, reject remaining items to prevent deadlock
		if (iterations >= maxIterations && this.queue.length > 0) {
			while (this.queue.length > 0) {
				const item = this.queue.shift()
				if (item) {
					item.reject(
						new Error(
							'Rate limiter timeout: too many iterations. This may indicate a bug in the rate limiter.'
						)
					)
				}
			}
		}
	}

	/**
	 * Acquire permission to make a request (waits if rate limit is exceeded)
	 * @returns Promise that resolves when request can be made
	 */
	async acquire(): Promise<void> {
		if (!this.enabled) {
			return Promise.resolve()
		}

		return new Promise<void>((resolve, reject) => {
			this.queue.push({ resolve, reject })
			this.processQueue().catch(reject)
		})
	}

	/**
	 * Try to acquire permission without waiting
	 * @returns true if permission granted, false if rate limit exceeded
	 */
	tryAcquire(): boolean {
		if (!this.enabled) {
			return true
		}

		if (this.canMakeRequest()) {
			this.consumeTokens()
			return true
		}

		return false
	}

	/**
	 * Reset rate limiter state
	 */
	reset(): void {
		this.secondTokens = this.requestsPerSecond
		this.secondLastRefill = Date.now()
		this.minuteTokens = this.requestsPerMinute
		this.minuteLastRefill = Date.now()
		this.queue = []
		this.processing = false
	}
}

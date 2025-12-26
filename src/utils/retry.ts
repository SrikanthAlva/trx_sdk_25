import { NetworkError, RateLimitError } from '../errors/index.js'

/**
 * Retry configuration
 */
export interface RetryConfig {
	/** Maximum number of retry attempts */
	readonly maxRetries?: number
	/** Initial delay in milliseconds */
	readonly initialDelay?: number
	/** Maximum delay in milliseconds */
	readonly maxDelay?: number
	/** Exponential backoff multiplier */
	readonly backoffMultiplier?: number
	/** Retry on these error codes */
	readonly retryableStatusCodes?: number[]
}

/**
 * Default retry configuration
 */
const DEFAULT_RETRY_CONFIG: Required<RetryConfig> = {
	maxRetries: 3,
	initialDelay: 1000, // 1 second
	maxDelay: 10000, // 10 seconds
	backoffMultiplier: 2,
	retryableStatusCodes: [408, 429, 500, 502, 503, 504],
}

/**
 * Calculate delay for exponential backoff
 * @param attempt - Current attempt number (0-indexed)
 * @param config - Retry configuration
 * @returns Delay in milliseconds
 */
function calculateDelay(attempt: number, config: Required<RetryConfig>): number {
	const delay = config.initialDelay * Math.pow(config.backoffMultiplier, attempt)
	return Math.min(delay, config.maxDelay)
}

/**
 * Check if error is retryable
 * @param error - Error to check
 * @param config - Retry configuration
 * @returns true if error is retryable
 */
function isRetryableError(error: unknown, config: Required<RetryConfig>): boolean {
	// Network errors are always retryable
	if (error instanceof NetworkError) {
		return true
	}

	// Rate limit errors are retryable
	if (error instanceof RateLimitError) {
		return true
	}

	// Check status codes for provider errors
	// Note: This would require ProviderError to be checked, but we'll handle it in the retry function

	return false
}

/**
 * Retry a function with exponential backoff
 * @param fn - Function to retry
 * @param config - Retry configuration
 * @returns Result of the function
 */
export async function retryWithBackoff<T>(
	fn: () => Promise<T>,
	config: RetryConfig = {}
): Promise<T> {
	const retryConfig: Required<RetryConfig> = {
		...DEFAULT_RETRY_CONFIG,
		...config,
	}

	let lastError: unknown
	let attempt = 0

	while (attempt <= retryConfig.maxRetries) {
		try {
			return await fn()
		} catch (error) {
			lastError = error

			// Don't retry if error is not retryable
			if (!isRetryableError(error, retryConfig)) {
				throw error
			}

			// Don't retry if we've exhausted attempts
			if (attempt >= retryConfig.maxRetries) {
				break
			}

			// Calculate delay
			let delay = calculateDelay(attempt, retryConfig)

			// If it's a rate limit error, use retry-after if available
			if (error instanceof RateLimitError && error.retryAfter) {
				delay = error.retryAfter * 1000 // Convert to milliseconds
			}

			// Wait before retrying
			await new Promise((resolve) => setTimeout(resolve, delay))

			attempt++
		}
	}

	// All retries exhausted
	throw lastError
}


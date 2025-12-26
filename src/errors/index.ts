/**
 * Base error class for SDK errors
 */
export class SDKError extends Error {
	readonly code: string
	readonly context?: Record<string, unknown>

	constructor(message: string, code: string, context?: Record<string, unknown>) {
		super(message)
		this.name = 'SDKError'
		this.code = code
		this.context = context
		// Capture stack trace if available (Node.js)
		const ErrorConstructor = Error as unknown as {
			captureStackTrace?: (error: Error, constructor: Function) => void
		}
		if (typeof ErrorConstructor.captureStackTrace === 'function') {
			ErrorConstructor.captureStackTrace(this, this.constructor)
		}
	}
}

/**
 * Network-related errors (connection issues, timeouts, etc.)
 */
export class NetworkError extends SDKError {
	constructor(message: string, context?: Record<string, unknown>) {
		super(message, 'NETWORK_ERROR', context)
		this.name = 'NetworkError'
	}
}

/**
 * Validation errors (invalid addresses, malformed input, etc.)
 */
export class ValidationError extends SDKError {
	constructor(message: string, context?: Record<string, unknown>) {
		super(message, 'VALIDATION_ERROR', context)
		this.name = 'ValidationError'
	}
}

/**
 * Rate limiting errors
 */
export class RateLimitError extends SDKError {
	readonly retryAfter?: number

	constructor(message: string, retryAfter?: number, context?: Record<string, unknown>) {
		super(message, 'RATE_LIMIT_ERROR', { ...context, retryAfter })
		this.name = 'RateLimitError'
		this.retryAfter = retryAfter
	}
}

/**
 * Provider-specific errors (API errors, RPC errors, etc.)
 */
export class ProviderError extends SDKError {
	readonly statusCode?: number
	readonly provider?: string

	constructor(
		message: string,
		provider?: string,
		statusCode?: number,
		context?: Record<string, unknown>
	) {
		super(message, 'PROVIDER_ERROR', { ...context, provider, statusCode })
		this.name = 'ProviderError'
		this.provider = provider
		this.statusCode = statusCode
	}
}

/**
 * Configuration errors
 */
export class ConfigurationError extends SDKError {
	constructor(message: string, context?: Record<string, unknown>) {
		super(message, 'CONFIGURATION_ERROR', context)
		this.name = 'ConfigurationError'
	}
}

/**
 * Error codes enum for reference
 */
export enum ErrorCode {
	NETWORK_ERROR = 'NETWORK_ERROR',
	VALIDATION_ERROR = 'VALIDATION_ERROR',
	RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
	PROVIDER_ERROR = 'PROVIDER_ERROR',
	CONFIGURATION_ERROR = 'CONFIGURATION_ERROR',
}


import { NetworkError, ProviderError, RateLimitError } from '../errors/index.js'

/**
 * HTTP request options
 */
export interface HttpRequestOptions {
	readonly method?: 'GET' | 'POST'
	readonly headers?: Record<string, string>
	readonly body?: string | Record<string, unknown>
	readonly timeout?: number
	readonly signal?: AbortSignal
}

/**
 * HTTP response
 */
export interface HttpResponse<T = unknown> {
	readonly status: number
	readonly statusText: string
	readonly headers: Record<string, string>
	readonly data: T
}

/**
 * Make HTTP request with error handling
 * @param url - Request URL
 * @param options - Request options
 * @returns HTTP response
 * @throws NetworkError, ProviderError, or RateLimitError
 */
export async function httpRequest<T = unknown>(
	url: string,
	options: HttpRequestOptions = {}
): Promise<HttpResponse<T>> {
	const {
		method = 'GET',
		headers = {},
		body,
		timeout = 30000,
		signal,
	} = options

	const controller = new AbortController()
	const timeoutId = timeout > 0 ? setTimeout(() => controller.abort(), timeout) : null

	// Use AbortSignal.any if available, otherwise combine signals
	const abortSignal = signal
		? typeof AbortSignal.any === 'function'
			? AbortSignal.any([signal, controller.signal])
			: controller.signal
		: controller.signal

	try {
		const requestBody = body
			? typeof body === 'string'
				? body
				: JSON.stringify(body)
			: undefined

		const response = await fetch(url, {
			method,
			headers: {
				'Content-Type': 'application/json',
				...headers,
			},
			body: requestBody,
			signal: abortSignal,
		})

		if (timeoutId) {
			clearTimeout(timeoutId)
		}

		// Handle rate limiting
		if (response.status === 429) {
			const retryAfter = response.headers.get('Retry-After')
			const retryAfterSeconds = retryAfter ? parseInt(retryAfter, 10) : undefined
			throw new RateLimitError(
				`Rate limit exceeded. ${retryAfterSeconds ? `Retry after ${retryAfterSeconds} seconds` : 'Please retry later.'}`,
				retryAfterSeconds,
				{ url, method }
			)
		}

		// Parse response headers
		const responseHeaders: Record<string, string> = {}
		response.headers.forEach((value, key) => {
			responseHeaders[key] = value
		})

		// Parse response body
		let data: T
		const contentType = response.headers.get('content-type') || ''
		if (contentType.includes('application/json')) {
			data = (await response.json()) as T
		} else {
			data = (await response.text()) as unknown as T
		}

		// Handle error status codes
		if (!response.ok) {
			throw new ProviderError(
				`HTTP ${response.status}: ${response.statusText}`,
				undefined,
				response.status,
				{ url, method, data }
			)
		}

		return {
			status: response.status,
			statusText: response.statusText,
			headers: responseHeaders,
			data,
		}
	} catch (error) {
		if (timeoutId) {
			clearTimeout(timeoutId)
		}

		// Handle abort (timeout)
		if (error instanceof Error && error.name === 'AbortError') {
			throw new NetworkError(`Request timeout after ${timeout}ms`, { url, method, timeout })
		}

		// Re-throw SDK errors
		if (
			error instanceof NetworkError ||
			error instanceof ProviderError ||
			error instanceof RateLimitError
		) {
			throw error
		}

		// Handle network errors
		if (error instanceof TypeError && error.message.includes('fetch')) {
			throw new NetworkError(`Network error: ${error.message}`, { url, method, originalError: error.message })
		}

		// Unknown error
		throw new NetworkError(
			`Unexpected error: ${error instanceof Error ? error.message : String(error)}`,
			{ url, method, error }
		)
	}
}


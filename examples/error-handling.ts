/**
 * Error handling examples
 */

import {
	BlockchainSDK,
	ValidationError,
	ConfigurationError,
	RateLimitError,
	NetworkError,
	ProviderError,
} from '../src/index.js'

async function errorHandlingExample() {
	const sdk = new BlockchainSDK({
		ethereum: {
			etherscanApiKey: process.env.ETHERSCAN_API_KEY || 'your-api-key',
		},
	})

	// Example 1: Validation Error
	console.log('=== Example 1: Validation Error ===')
	try {
		await sdk.getTransactions('invalid-address')
	} catch (error) {
		if (error instanceof ValidationError) {
			console.log('Caught ValidationError:')
			console.log(`  Message: ${error.message}`)
			console.log(`  Code: ${error.code}`)
			console.log(`  Context:`, error.context)
		}
	}

	// Example 2: Configuration Error
	console.log('\n=== Example 2: Configuration Error ===')
	const sdkWithoutConfig = new BlockchainSDK({})
	try {
		await sdkWithoutConfig.getEthereumTransactions('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb')
	} catch (error) {
		if (error instanceof ConfigurationError) {
			console.log('Caught ConfigurationError:')
			console.log(`  Message: ${error.message}`)
			console.log(`  Code: ${error.code}`)
		}
	}

	// Example 3: Rate Limit Error (if encountered)
	console.log('\n=== Example 3: Rate Limit Error ===')
	console.log('Rate limit errors are automatically handled by the SDK')
	console.log('The SDK includes built-in rate limiting to prevent hitting API limits')

	// Example 4: Network Error
	console.log('\n=== Example 4: Network Error ===')
	console.log('Network errors occur when there are connection issues')
	console.log('The SDK includes automatic retry logic with exponential backoff')

	// Example 5: Provider Error
	console.log('\n=== Example 5: Provider Error ===')
	console.log('Provider errors occur when the API/RPC endpoint returns an error')
	console.log('These are automatically transformed into SDK errors with context')

	// Example 6: Comprehensive Error Handling
	console.log('\n=== Example 6: Comprehensive Error Handling ===')
	async function fetchWithErrorHandling(address: string) {
		try {
			return await sdk.getTransactions(address)
		} catch (error) {
			if (error instanceof ValidationError) {
				console.error('Invalid address format:', error.message)
				throw new Error('Please provide a valid Ethereum address or Solana public key')
			} else if (error instanceof ConfigurationError) {
				console.error('Configuration issue:', error.message)
				throw new Error('Please check your SDK configuration')
			} else if (error instanceof RateLimitError) {
				console.error('Rate limit exceeded')
				if (error.retryAfter) {
					console.log(`Retry after ${error.retryAfter} seconds`)
				}
				throw error
			} else if (error instanceof NetworkError) {
				console.error('Network error:', error.message)
				throw new Error('Please check your internet connection')
			} else if (error instanceof ProviderError) {
				console.error('Provider error:', error.message)
				console.error('Provider:', error.provider)
				console.error('Status code:', error.statusCode)
				throw error
			} else {
				console.error('Unknown error:', error)
				throw error
			}
		}
	}

	try {
		await fetchWithErrorHandling('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb')
	} catch (error) {
		console.log('Final error:', error)
	}
}

// Run example
if (import.meta.url === `file://${process.argv[1]}`) {
	errorHandlingExample().catch(console.error)
}


import { Network } from './network.js'

/**
 * Ethereum provider configuration
 */
export interface EthereumProviderConfig {
	/** Etherscan API key (required for Etherscan API) */
	readonly etherscanApiKey?: string
	/** Custom Etherscan API URL (default: https://api.etherscan.io/v2/api) */
	readonly etherscanApiUrl?: string
	/** JSON-RPC endpoint URL (alternative to Etherscan API) */
	readonly rpcUrl?: string
	/** Request timeout in milliseconds */
	readonly timeout?: number
}

/**
 * Solana provider configuration
 */
export interface SolanaProviderConfig {
	/** JSON-RPC endpoint URL (required) */
	readonly rpcUrl: string
	/** Request timeout in milliseconds */
	readonly timeout?: number
	/** Commitment level for Solana requests */
	readonly commitment?: 'finalized' | 'confirmed' | 'processed'
}

/**
 * SDK configuration
 */
export interface SDKConfig {
	/** Ethereum provider configuration */
	readonly ethereum?: EthereumProviderConfig
	/** Solana provider configuration */
	readonly solana?: SolanaProviderConfig
	/** Enable request logging */
	readonly enableLogging?: boolean
	/** Log level */
	readonly logLevel?: 'debug' | 'info' | 'warn' | 'error'
	/** Cache configuration */
	readonly cache?: SDKCacheConfig
	/** Rate limiting configuration */
	readonly rateLimit?: RateLimitConfig
}

/**
 * SDK cache configuration
 */
export interface SDKCacheConfig {
	/** Enable caching */
	readonly enabled: boolean
	/** Cache TTL in milliseconds */
	readonly ttl?: number
	/** Maximum cache size */
	readonly maxSize?: number
}

/**
 * Rate limiting configuration
 */
export interface RateLimitConfig {
	/** Maximum requests per second */
	readonly requestsPerSecond?: number
	/** Maximum requests per minute */
	readonly requestsPerMinute?: number
	/** Enable rate limiting */
	readonly enabled?: boolean
}

/**
 * Default configuration values
 */
export const DEFAULT_CONFIG: Required<Pick<SDKConfig, 'enableLogging' | 'logLevel'>> = {
	enableLogging: false,
	logLevel: 'info',
}

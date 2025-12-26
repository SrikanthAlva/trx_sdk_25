import { Network } from '../types/network.js'
import { Transaction } from '../types/transaction.js'
import { PaginationOptions, PaginatedResponse } from '../types/pagination.js'

/**
 * Base interface for blockchain providers
 * Providers handle the low-level communication with blockchain APIs/RPC endpoints
 */
export interface IProvider {
	/** Network this provider supports */
	readonly network: Network

	/**
	 * Fetch transactions for an address
	 * @param address - The address/public key to fetch transactions for
	 * @param options - Pagination and filtering options
	 * @returns Paginated transaction response
	 */
	getTransactions(
		address: string,
		options?: PaginationOptions
	): Promise<PaginatedResponse<Transaction>>

	/**
	 * Check if the provider is properly configured
	 * @returns true if configured, false otherwise
	 */
	isConfigured(): boolean

	/**
	 * Get provider name for logging/debugging
	 */
	getName(): string
}

/**
 * Provider configuration validation result
 */
export interface ProviderConfigValidation {
	readonly valid: boolean
	readonly errors: string[]
}


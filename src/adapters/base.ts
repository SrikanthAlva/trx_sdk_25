import { Network } from '../types/network.js'
import { Transaction } from '../types/transaction.js'
import { PaginationOptions, PaginatedResponse } from '../types/pagination.js'
import { IProvider } from '../providers/base.js'

/**
 * Base interface for network adapters
 * Adapters transform provider-specific responses into unified transaction format
 */
export interface IAdapter {
	/** Network this adapter supports */
	readonly network: Network

	/** Provider instance used by this adapter */
	readonly provider: IProvider

	/**
	 * Fetch and normalize transactions for an address
	 * @param address - The address/public key to fetch transactions for
	 * @param options - Pagination and filtering options
	 * @returns Paginated transaction response with normalized transactions
	 */
	getTransactions(
		address: string,
		options?: PaginationOptions
	): Promise<PaginatedResponse<Transaction>>

	/**
	 * Validate an address/public key for this network
	 * @param address - Address to validate
	 * @returns true if valid, false otherwise
	 */
	validateAddress(address: string): boolean

	/**
	 * Detect network from address format
	 * @param address - Address to analyze
	 * @returns Network if detected, null otherwise
	 */
	detectNetwork(address: string): Network | null
}


import { Network } from '../types/network.js'
import { EthereumTransaction } from '../types/transaction.js'
import { PaginationOptions, PaginatedResponse } from '../types/pagination.js'
import { IAdapter } from './base.js'
import { EthereumProvider } from '../providers/ethereum.js'
import { validateAddressForNetwork, normalizeEthereumAddress } from '../utils/validation.js'
import { ValidationError } from '../errors/index.js'

/**
 * Ethereum adapter - transforms Ethereum provider responses to unified format
 */
export class EthereumAdapter implements IAdapter {
	readonly network = Network.ETHEREUM_MAINNET
	readonly provider: EthereumProvider

	constructor(provider: EthereumProvider) {
		this.provider = provider
	}

	/**
	 * Validate Ethereum address
	 */
	validateAddress(address: string): boolean {
		try {
			validateAddressForNetwork(address, Network.ETHEREUM_MAINNET)
			return true
		} catch {
			return false
		}
	}

	/**
	 * Detect network from address format
	 */
	detectNetwork(address: string): Network | null {
		if (this.validateAddress(address)) {
			return Network.ETHEREUM_MAINNET
		}
		return null
	}

	/**
	 * Get transactions for an Ethereum address
	 */
	async getTransactions(
		address: string,
		options: PaginationOptions = {}
	): Promise<PaginatedResponse<EthereumTransaction>> {
		// Validate address
		if (!this.validateAddress(address)) {
			throw new ValidationError('Invalid Ethereum address format', { address })
		}

		// Normalize address (lowercase)
		const normalizedAddress = normalizeEthereumAddress(address)

		// Apply time range filtering if provided
		const filteredOptions = this.applyTimeRangeFilter(options)

		// Fetch transactions from provider
		const response = await this.provider.getTransactions(normalizedAddress, filteredOptions)

		// Apply additional filtering if needed
		const filteredTransactions = this.filterTransactions(response.data, options)

		return {
			data: filteredTransactions,
			pagination: response.pagination,
		}
	}

	/**
	 * Apply time range filter to pagination options
	 */
	private applyTimeRangeFilter(options: PaginationOptions): PaginationOptions {
		// Etherscan API doesn't support time range filtering directly,
		// so we'll filter after fetching
		return {
			limit: options.limit,
			page: options.page,
			cursor: options.cursor,
		}
	}

	/**
	 * Filter transactions based on options
	 */
	private filterTransactions(
		transactions: readonly EthereumTransaction[],
		options: PaginationOptions
	): EthereumTransaction[] {
		let filtered = [...transactions]

		// Apply time range filter
		if (options.startTime !== undefined) {
			filtered = filtered.filter((tx) => tx.timestamp >= options.startTime!)
		}

		if (options.endTime !== undefined) {
			filtered = filtered.filter((tx) => tx.timestamp <= options.endTime!)
		}

		return filtered
	}
}


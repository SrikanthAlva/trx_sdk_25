import { Network } from '../types/network.js'
import { SolanaTransaction } from '../types/transaction.js'
import { PaginationOptions, PaginatedResponse } from '../types/pagination.js'
import { IAdapter } from './base.js'
import { SolanaProvider } from '../providers/solana.js'
import { validateAddressForNetwork, normalizeSolanaPublicKey } from '../utils/validation.js'
import { ValidationError } from '../errors/index.js'

/**
 * Solana adapter - transforms Solana provider responses to unified format
 */
export class SolanaAdapter implements IAdapter {
	readonly network = Network.SOLANA_MAINNET
	readonly provider: SolanaProvider

	constructor(provider: SolanaProvider) {
		this.provider = provider
	}

	/**
	 * Validate Solana public key
	 */
	validateAddress(publicKey: string): boolean {
		try {
			validateAddressForNetwork(publicKey, Network.SOLANA_MAINNET)
			return true
		} catch {
			return false
		}
	}

	/**
	 * Detect network from public key format
	 */
	detectNetwork(publicKey: string): Network | null {
		if (this.validateAddress(publicKey)) {
			return Network.SOLANA_MAINNET
		}
		return null
	}

	/**
	 * Get transactions for a Solana public key
	 */
	async getTransactions(
		publicKey: string,
		options: PaginationOptions = {}
	): Promise<PaginatedResponse<SolanaTransaction>> {
		// Validate public key
		if (!this.validateAddress(publicKey)) {
			throw new ValidationError('Invalid Solana public key format', { publicKey })
		}

		// Normalize public key
		const normalizedPublicKey = normalizeSolanaPublicKey(publicKey)

		// Fetch transactions from provider
		const response = await this.provider.getTransactions(normalizedPublicKey, options)

		// Apply time range filtering if provided (Solana doesn't support it natively)
		const filteredTransactions = this.filterTransactions(response.data, options)

		return {
			data: filteredTransactions,
			pagination: response.pagination,
		}
	}

	/**
	 * Filter transactions based on options
	 */
	private filterTransactions(
		transactions: readonly SolanaTransaction[],
		options: PaginationOptions
	): SolanaTransaction[] {
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

import { Network } from '../types/network.js'
import { EthereumTransaction, TransactionStatus } from '../types/transaction.js'
import { PaginationOptions, PaginatedResponse } from '../types/pagination.js'
import { EthereumProviderConfig } from '../types/config.js'
import { IProvider, ProviderConfigValidation } from './base.js'
import { httpRequest } from '../utils/http.js'
import { retryWithBackoff } from '../utils/retry.js'
import { ProviderError, ConfigurationError } from '../errors/index.js'
import { RateLimiter } from '../utils/rate-limiter.js'
import { Logger, getLogger } from '../utils/logger.js'

/**
 * Etherscan API response for transaction list
 */
interface EtherscanTransactionResponse {
	readonly status: string
	readonly message: string
	readonly result: EtherscanTransaction[] | string
}

/**
 * Raw Etherscan transaction data
 */
interface EtherscanTransaction {
	readonly blockNumber: string
	readonly timeStamp: string
	readonly hash: string
	readonly nonce: string
	readonly blockHash: string
	readonly transactionIndex: string
	readonly from: string
	readonly to: string
	readonly value: string
	readonly gas: string
	readonly gasPrice: string
	readonly isError: string
	readonly txreceipt_status: string
	readonly input: string
	readonly contractAddress: string
	readonly cumulativeGasUsed: string
	readonly gasUsed: string
	readonly confirmations: string
	readonly methodId?: string
	readonly functionName?: string
}

/**
 * Ethereum provider using Etherscan API
 */
export class EthereumProvider implements IProvider {
	readonly network = Network.ETHEREUM_MAINNET
	private readonly config: EthereumProviderConfig
	private readonly apiKey?: string
	private readonly apiUrl: string
	private readonly timeout: number
	private readonly rateLimiter: RateLimiter
	private readonly logger: Logger

	constructor(config: EthereumProviderConfig) {
		if (!config.etherscanApiKey && !config.rpcUrl) {
			throw new ConfigurationError(
				'Ethereum provider requires either etherscanApiKey or rpcUrl',
				{ config }
			)
		}

		this.config = config
		this.apiKey = config.etherscanApiKey
		// Use V2 API endpoint (default) or allow custom URL override
		this.apiUrl = config.etherscanApiUrl || 'https://api.etherscan.io/v2/api'
		this.timeout = config.timeout || 30000
		this.logger = getLogger()

		// Initialize rate limiter (Etherscan free tier: 5 calls/sec)
		this.rateLimiter = new RateLimiter({
			requestsPerSecond: 4, // Conservative limit to avoid hitting rate limits
			requestsPerMinute: 300, // 5 per second * 60
			enabled: true,
		})
	}

	getName(): string {
		return 'EthereumProvider (Etherscan)'
	}

	isConfigured(): boolean {
		return !!(this.apiKey || this.config.rpcUrl)
	}

	/**
	 * Validate provider configuration
	 */
	static validateConfig(config: EthereumProviderConfig): ProviderConfigValidation {
		const errors: string[] = []

		if (!config.etherscanApiKey && !config.rpcUrl) {
			errors.push('Either etherscanApiKey or rpcUrl must be provided')
		}

		if (config.timeout && config.timeout < 0) {
			errors.push('Timeout must be a positive number')
		}

		return {
			valid: errors.length === 0,
			errors,
		}
	}

	/**
	 * Fetch transactions from Etherscan API
	 */
	async getTransactions(
		address: string,
		options: PaginationOptions = {}
	): Promise<PaginatedResponse<EthereumTransaction>> {
		if (!this.apiKey) {
			throw new ConfigurationError('Etherscan API key is required', { address })
		}

		// Acquire rate limit permission
		await this.rateLimiter.acquire()
		this.logger.debug('Rate limit acquired for Ethereum request', { address })

		const limit = options.limit || 100
		const page = options.page || 1

		const params = new URLSearchParams({
			chainid: '1', // Ethereum Mainnet chain ID (required for V2 API)
			module: 'account',
			action: 'txlist',
			address: address,
			startblock: '0',
			endblock: '99999999',
			page: page.toString(),
			offset: limit.toString(),
			sort: 'desc',
			apikey: this.apiKey,
		})

		const url = `${this.apiUrl}?${params.toString()}`

		try {
			this.logger.debug('Fetching transactions from Etherscan', { address, page, limit })
			const response = await retryWithBackoff(
				() =>
					httpRequest<EtherscanTransactionResponse>(url, {
						method: 'GET',
						timeout: this.timeout,
					}),
				{
					maxRetries: 3,
					retryableStatusCodes: [429, 500, 502, 503, 504],
				}
			)

			const data = response.data

			// Handle API errors
			if (data.status === '0' && typeof data.result === 'string') {
				// "No transactions found" is not an error, return empty result
				if (data.result.includes('No transactions found')) {
					return {
						data: [],
						pagination: {
							hasMore: false,
							page,
							totalPages: 0,
							total: 0,
						},
					}
				}
				throw new ProviderError(
					`Etherscan API error: ${data.result}`,
					'Etherscan',
					undefined,
					{ address, response: data }
				)
			}

			if (!Array.isArray(data.result)) {
				throw new ProviderError(
					'Unexpected response format from Etherscan API',
					'Etherscan',
					undefined,
					{ address, response: data }
				)
			}

			// Transform Etherscan transactions to our format
			const transactions = data.result.map((tx) => this.transformTransaction(tx))

			// Determine pagination info
			const hasMore = transactions.length === limit
			const totalPages = hasMore ? undefined : page

			return {
				data: transactions,
				pagination: {
					hasMore,
					page,
					totalPages,
					total: undefined, // Etherscan doesn't provide total count
				},
			}
		} catch (error) {
			if (error instanceof ProviderError) {
				throw error
			}
			throw new ProviderError(
				`Failed to fetch Ethereum transactions: ${
					error instanceof Error ? error.message : String(error)
				}`,
				'Etherscan',
				undefined,
				{ address, originalError: error }
			)
		}
	}

	/**
	 * Transform Etherscan transaction to EthereumTransaction
	 */
	private transformTransaction(tx: EtherscanTransaction): EthereumTransaction {
		const timestamp = parseInt(tx.timeStamp, 10) * 1000 // Convert to milliseconds
		const isError = tx.isError === '1' || tx.txreceipt_status === '0'
		const status = isError ? TransactionStatus.FAILED : TransactionStatus.SUCCESS

		return {
			network: Network.ETHEREUM_MAINNET,
			hash: tx.hash,
			blockNumber: parseInt(tx.blockNumber, 10),
			timestamp,
			status,
			from: tx.from,
			to: tx.to || null,
			value: tx.value,
			gasPrice: tx.gasPrice,
			gasLimit: tx.gas,
			gasUsed: tx.gasUsed,
			fee:
				tx.gasUsed && tx.gasPrice
					? (BigInt(tx.gasUsed) * BigInt(tx.gasPrice)).toString()
					: undefined,
			nonce: parseInt(tx.nonce, 10),
			input: tx.input || undefined,
			isContractInteraction: !!(tx.contractAddress || (tx.input && tx.input !== '0x')),
		}
	}
}

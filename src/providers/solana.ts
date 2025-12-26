import { Network } from '../types/network.js'
import { SolanaTransaction, TransactionStatus } from '../types/transaction.js'
import { PaginationOptions, PaginatedResponse } from '../types/pagination.js'
import { SolanaProviderConfig } from '../types/config.js'
import { IProvider, ProviderConfigValidation } from './base.js'
import { httpRequest } from '../utils/http.js'
import { retryWithBackoff } from '../utils/retry.js'
import { ProviderError, ConfigurationError } from '../errors/index.js'
import { RateLimiter } from '../utils/rate-limiter.js'
import { Logger, getLogger } from '../utils/logger.js'

/**
 * Solana JSON-RPC request
 */
interface SolanaRpcRequest {
	readonly jsonrpc: '2.0'
	readonly id: number
	readonly method: string
	readonly params: unknown[]
}

/**
 * Solana JSON-RPC response
 */
interface SolanaRpcResponse<T = unknown> {
	readonly jsonrpc: '2.0'
	readonly id: number
	readonly result?: T
	readonly error?: {
		readonly code: number
		readonly message: string
	}
}

/**
 * Solana signature information
 */
interface SolanaSignatureInfo {
	readonly signature: string
	readonly slot: number
	readonly err: unknown | null
	readonly memo: string | null
	readonly blockTime: number | null
}

/**
 * Solana transaction details
 */
interface SolanaTransactionDetails {
	readonly slot: number
	readonly transaction: {
		readonly message: {
			readonly accountKeys: string[]
			readonly instructions: Array<{
				readonly programId: string
				readonly accounts?: number[]
				readonly data?: string
			}>
			readonly recentBlockhash: string
		}
		readonly signatures: string[]
	}
	readonly meta: {
		readonly err: unknown | null
		readonly fee: number
		readonly preBalances: number[]
		readonly postBalances: number[]
		readonly preTokenBalances?: Array<{
			readonly accountIndex: number
			readonly mint: string
			readonly owner?: string
			readonly uiTokenAmount: {
				readonly amount: string
			}
		}>
		readonly postTokenBalances?: Array<{
			readonly accountIndex: number
			readonly mint: string
			readonly owner?: string
			readonly uiTokenAmount: {
				readonly amount: string
			}
		}>
	}
	readonly blockTime: number | null
}

/**
 * Solana provider using JSON-RPC
 */
export class SolanaProvider implements IProvider {
	readonly network = Network.SOLANA_MAINNET
	private readonly config: SolanaProviderConfig
	private readonly rpcUrl: string
	private readonly timeout: number
	private readonly commitment: 'finalized' | 'confirmed' | 'processed'
	private requestId = 0
	private readonly rateLimiter: RateLimiter
	private readonly logger: Logger

	constructor(config: SolanaProviderConfig) {
		if (!config.rpcUrl) {
			throw new ConfigurationError('Solana provider requires rpcUrl', { config })
		}

		this.config = config
		this.rpcUrl = config.rpcUrl
		this.timeout = config.timeout || 30000
		this.commitment = config.commitment || 'confirmed'
		this.logger = getLogger()

		// Initialize rate limiter (conservative limits for public RPC endpoints)
		this.rateLimiter = new RateLimiter({
			requestsPerSecond: 10, // Conservative limit
			requestsPerMinute: 600, // 10 per second * 60
			enabled: true,
		})
	}

	getName(): string {
		return 'SolanaProvider (JSON-RPC)'
	}

	isConfigured(): boolean {
		return !!this.rpcUrl
	}

	/**
	 * Validate provider configuration
	 */
	static validateConfig(config: SolanaProviderConfig): ProviderConfigValidation {
		const errors: string[] = []

		if (!config.rpcUrl) {
			errors.push('rpcUrl is required')
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
	 * Make JSON-RPC request
	 */
	private async rpcRequest<T>(method: string, params: unknown[]): Promise<T> {
		// Acquire rate limit permission
		await this.rateLimiter.acquire()
		this.logger.debug('Rate limit acquired for Solana RPC request', { method })

		const request: SolanaRpcRequest = {
			jsonrpc: '2.0',
			id: this.requestId++,
			method,
			params,
		}

		try {
			this.logger.debug('Making Solana RPC request', { method, params })
			const response = await retryWithBackoff(
				() =>
					httpRequest<SolanaRpcResponse<T>>(this.rpcUrl, {
						method: 'POST',
						body: request as unknown as Record<string, unknown>,
						timeout: this.timeout,
					}),
				{
					maxRetries: 3,
					retryableStatusCodes: [429, 500, 502, 503, 504],
				}
			)

			const data = response.data

			if (data.error) {
				throw new ProviderError(
					`Solana RPC error: ${data.error.message}`,
					'Solana RPC',
					data.error.code,
					{ method, params, error: data.error }
				)
			}

			if (data.result === undefined) {
				throw new ProviderError('Unexpected response format from Solana RPC', 'Solana RPC', undefined, {
					method,
					params,
					response: data,
				})
			}

			return data.result
		} catch (error) {
			if (error instanceof ProviderError) {
				throw error
			}
			throw new ProviderError(
				`Failed to make Solana RPC request: ${error instanceof Error ? error.message : String(error)}`,
				'Solana RPC',
				undefined,
				{ method, params, originalError: error }
			)
		}
	}

	/**
	 * Fetch transactions for an address
	 */
	async getTransactions(
		publicKey: string,
		options: PaginationOptions = {}
	): Promise<PaginatedResponse<SolanaTransaction>> {
		const limit = options.limit || 100
		const before = options.cursor || undefined

		// Step 1: Get signatures for the address
		const signatures = await this.rpcRequest<SolanaSignatureInfo[]>(
			'getSignaturesForAddress',
			[
				publicKey,
				{
					limit,
					before,
					commitment: this.commitment,
				},
			]
		)

		if (!signatures || signatures.length === 0) {
			return {
				data: [],
				pagination: {
					hasMore: false,
					nextCursor: undefined,
				},
			}
		}

		// Step 2: Get transaction details for each signature
		const signatureStrings = signatures.map((sig) => sig.signature)
		const transactionDetails = await this.getTransactionDetails(signatureStrings)

		// Step 3: Transform to our format
		const transactions = signatures
			.map((sig, index) => {
				const details = transactionDetails[index]
				return this.transformTransaction(sig, details)
			})
			.filter((tx): tx is SolanaTransaction => tx !== null)

		// Determine pagination
		const hasMore = signatures.length === limit
		const nextCursor = hasMore ? signatures[signatures.length - 1].signature : undefined

		return {
			data: transactions,
			pagination: {
				hasMore,
				nextCursor,
			},
		}
	}

	/**
	 * Get transaction details for signatures
	 */
	private async getTransactionDetails(
		signatures: string[]
	): Promise<(SolanaTransactionDetails | null)[]> {
		// Fetch transactions in parallel (Solana RPC supports batch requests)
		const requests = signatures.map((signature) =>
			this.rpcRequest<SolanaTransactionDetails | null>('getTransaction', [
				signature,
				{
					encoding: 'jsonParsed',
					commitment: this.commitment,
					maxSupportedTransactionVersion: 0, // Required for versioned transactions
				},
			])
		)

		return Promise.all(requests)
	}

	/**
	 * Transform Solana transaction to SolanaTransaction
	 */
	private transformTransaction(
		sigInfo: SolanaSignatureInfo,
		details: SolanaTransactionDetails | null
	): SolanaTransaction | null {
		if (!details) {
			return null
		}

		const status = sigInfo.err || details.meta.err ? TransactionStatus.FAILED : TransactionStatus.SUCCESS
		const timestamp = sigInfo.blockTime ? sigInfo.blockTime * 1000 : Date.now() // Convert to milliseconds

		// Extract fee payer (first account)
		const feePayer = details.transaction.message.accountKeys[0] || ''

		// Extract instructions
		const instructions =
			details.transaction.message.instructions?.map((ix) => ({
				programId: ix.programId,
				data: ix.data,
				accounts: ix.accounts?.map((idx) => details.transaction.message.accountKeys[idx] || ''),
			})) || []

		// Extract token balances
		const tokenBalances =
			details.meta.preTokenBalances && details.meta.postTokenBalances
				? details.meta.preTokenBalances.map((pre, index) => {
						const post = details.meta.postTokenBalances?.[index]
						return {
							accountIndex: pre.accountIndex,
							mint: pre.mint,
							owner: pre.owner,
							preBalance: pre.uiTokenAmount.amount,
							postBalance: post?.uiTokenAmount.amount,
						}
					})
				: undefined

		return {
			network: Network.SOLANA_MAINNET,
			hash: sigInfo.signature,
			signature: sigInfo.signature,
			blockNumber: sigInfo.slot,
			slot: sigInfo.slot,
			timestamp,
			status,
			fee: details.meta.fee.toString(),
			feePayer,
			accountKeys: details.transaction.message.accountKeys,
			instructions,
			tokenBalances,
		}
	}
}


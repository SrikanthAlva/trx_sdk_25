import { SDKConfig } from './types/config.js'
import { Network } from './types/network.js'
import { Transaction, EthereumTransaction, SolanaTransaction } from './types/transaction.js'
import { PaginationOptions, PaginatedResponse } from './types/pagination.js'
import { ConfigManager } from './config/index.js'
import { EthereumProvider } from './providers/ethereum.js'
import { SolanaProvider } from './providers/solana.js'
import { EthereumAdapter } from './adapters/ethereum.js'
import { SolanaAdapter } from './adapters/solana.js'
import { getNetworkFromAddress } from './utils/network.js'
import { ValidationError, ConfigurationError } from './errors/index.js'
import { createLogger, Logger } from './utils/logger.js'
import { TransactionCache } from './cache/transaction-cache.js'
import { CacheConfig } from './cache/index.js'
import { SDKCacheConfig } from './types/config.js'

/**
 * Main SDK client for fetching blockchain transaction history.
 *
 * Supports fetching transaction history for:
 * - Ethereum addresses on Ethereum Mainnet
 * - Solana public keys on Solana Mainnet
 *
 * @example
 * ```typescript
 * import { BlockchainSDK } from 'ts_sdk';
 *
 * const sdk = new BlockchainSDK({
 *   ethereum: {
 *     etherscanApiKey: 'your-api-key'
 *   },
 *   solana: {
 *     rpcUrl: 'https://mainnet.helius-rpc.com/?api-key=your-api-key'
 *   }
 * });
 *
 * // Auto-detect network from address
 * const transactions = await sdk.getTransactions('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb');
 * ```
 */
export class BlockchainSDK {
	private readonly configManager: ConfigManager
	private ethereumAdapter?: EthereumAdapter
	private solanaAdapter?: SolanaAdapter
	private readonly logger: Logger
	private readonly cache?: TransactionCache

	constructor(config: SDKConfig = {}) {
		this.configManager = new ConfigManager(config)

		// Initialize logger
		const loggingConfig = this.configManager.getLoggingConfig()
		this.logger = createLogger(loggingConfig.enabled, loggingConfig.level)

		// Initialize cache if enabled
		if (config.cache?.enabled) {
			const cacheConfig: CacheConfig = {
				enabled: config.cache.enabled,
				defaultTtl: config.cache.ttl,
				maxSize: config.cache.maxSize,
			}
			this.cache = new TransactionCache(cacheConfig)
			this.logger.debug('Transaction cache enabled', { config: config.cache })
		}

		this.initializeAdapters()
	}

	/**
	 * Initialize adapters based on configuration
	 */
	private initializeAdapters(): void {
		const ethereumConfig = this.configManager.getEthereumConfig()
		if (ethereumConfig) {
			const provider = new EthereumProvider(ethereumConfig)
			this.ethereumAdapter = new EthereumAdapter(provider)
		}

		const solanaConfig = this.configManager.getSolanaConfig()
		if (solanaConfig) {
			const provider = new SolanaProvider(solanaConfig)
			this.solanaAdapter = new SolanaAdapter(provider)
		}
	}

	/**
	 * Get transactions for an address (auto-detects network from address format).
	 *
	 * Automatically detects whether the address is an Ethereum address or Solana public key
	 * and routes to the appropriate provider.
	 *
	 * @param address - Ethereum address (0x...) or Solana public key (base58)
	 * @param options - Pagination and filtering options
	 * @returns Promise resolving to paginated transaction response
	 * @throws {ValidationError} If address format is invalid or network cannot be detected
	 * @throws {ConfigurationError} If the detected network's provider is not configured
	 *
	 * @example
	 * ```typescript
	 * // Auto-detect Ethereum
	 * const ethTxs = await sdk.getTransactions('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb', {
	 *   limit: 10,
	 *   page: 1
	 * });
	 *
	 * // Auto-detect Solana
	 * const solTxs = await sdk.getTransactions('9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM', {
	 *   limit: 10,
	 *   cursor: 'previous-cursor'
	 * });
	 * ```
	 */
	async getTransactions(
		address: string,
		options?: PaginationOptions
	): Promise<PaginatedResponse<Transaction>> {
		this.logger.debug('Fetching transactions', { address, options })

		// Auto-detect network from address format
		const network = getNetworkFromAddress(address)

		if (!network) {
			this.logger.error('Unable to detect network from address', undefined, { address })
			throw new ValidationError(
				'Unable to detect network from address format. Please use a valid Ethereum address (0x...) or Solana public key.',
				{ address }
			)
		}

		// Check cache first
		if (this.cache) {
			const cached = this.cache.get(network, address, options)
			if (cached) {
				this.logger.debug('Cache hit', { address, network })
				return cached
			}
		}

		// Route to appropriate adapter
		let result: PaginatedResponse<Transaction>
		switch (network) {
			case Network.ETHEREUM_MAINNET:
				result = await this.getEthereumTransactions(address, options)
				break
			case Network.SOLANA_MAINNET:
				result = await this.getSolanaTransactions(address, options)
				break
			default:
				throw new ValidationError('Unsupported network', { address, network })
		}

		// Cache the result
		if (this.cache) {
			this.cache.set(network, address, result, options)
			this.logger.debug('Cached transaction response', { address, network })
		}

		return result
	}

	/**
	 * Get Ethereum transactions for an address.
	 *
	 * Fetches transaction history from Etherscan API for the specified Ethereum address.
	 *
	 * @param address - Ethereum address (must start with 0x)
	 * @param options - Pagination and filtering options
	 * @param options.limit - Maximum number of transactions to return (default: 100)
	 * @param options.page - Page number for pagination (default: 1)
	 * @param options.startTime - Start timestamp in milliseconds (optional)
	 * @param options.endTime - End timestamp in milliseconds (optional)
	 * @returns Promise resolving to paginated Ethereum transaction response
	 * @throws {ValidationError} If address format is invalid
	 * @throws {ConfigurationError} If Ethereum provider is not configured
	 *
	 * @example
	 * ```typescript
	 * const transactions = await sdk.getEthereumTransactions(
	 *   '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
	 *   { limit: 20, page: 1 }
	 * );
	 *
	 * console.log(`Found ${transactions.data.length} transactions`);
	 * ```
	 */
	async getEthereumTransactions(
		address: string,
		options?: PaginationOptions
	): Promise<PaginatedResponse<EthereumTransaction>> {
		if (!this.ethereumAdapter) {
			this.logger.error('Ethereum adapter not configured', undefined, { address })
			throw new ConfigurationError(
				'Ethereum provider is not configured. Please provide ethereum configuration in SDK config.',
				{ address }
			)
		}

		try {
			this.logger.debug('Fetching Ethereum transactions', { address, options })
			const result = await this.ethereumAdapter.getTransactions(address, options)
			this.logger.info('Fetched Ethereum transactions', {
				address,
				count: result.data.length,
			})
			return result
		} catch (error) {
			this.logger.error('Failed to fetch Ethereum transactions', error as Error, {
				address,
				options,
			})
			throw error
		}
	}

	/**
	 * Get Solana transactions for a public key.
	 *
	 * Fetches transaction history from Solana RPC endpoint for the specified public key.
	 *
	 * @param publicKey - Solana public key (base58 encoded)
	 * @param options - Pagination and filtering options
	 * @param options.limit - Maximum number of transactions to return (default: 100)
	 * @param options.cursor - Cursor for pagination (signature of last transaction from previous page)
	 * @param options.startTime - Start timestamp in milliseconds (optional)
	 * @param options.endTime - End timestamp in milliseconds (optional)
	 * @returns Promise resolving to paginated Solana transaction response
	 * @throws {ValidationError} If public key format is invalid
	 * @throws {ConfigurationError} If Solana provider is not configured
	 *
	 * @example
	 * ```typescript
	 * const transactions = await sdk.getSolanaTransactions(
	 *   '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
	 *   { limit: 20 }
	 * );
	 *
	 * // Use cursor for next page
	 * if (transactions.pagination.nextCursor) {
	 *   const nextPage = await sdk.getSolanaTransactions(
	 *     '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
	 *     { limit: 20, cursor: transactions.pagination.nextCursor }
	 *   );
	 * }
	 * ```
	 */
	async getSolanaTransactions(
		publicKey: string,
		options?: PaginationOptions
	): Promise<PaginatedResponse<SolanaTransaction>> {
		if (!this.solanaAdapter) {
			this.logger.error('Solana adapter not configured', undefined, { publicKey })
			throw new ConfigurationError(
				'Solana provider is not configured. Please provide solana configuration in SDK config.',
				{ publicKey }
			)
		}

		try {
			this.logger.debug('Fetching Solana transactions', { publicKey, options })
			const result = await this.solanaAdapter.getTransactions(publicKey, options)
			this.logger.info('Fetched Solana transactions', {
				publicKey,
				count: result.data.length,
			})
			return result
		} catch (error) {
			this.logger.error('Failed to fetch Solana transactions', error as Error, {
				publicKey,
				options,
			})
			throw error
		}
	}

	/**
	 * Check if a network is configured.
	 *
	 * @param network - Network to check (Network.ETHEREUM_MAINNET or Network.SOLANA_MAINNET)
	 * @returns true if the network provider is configured, false otherwise
	 *
	 * @example
	 * ```typescript
	 * if (sdk.isNetworkConfigured(Network.ETHEREUM_MAINNET)) {
	 *   console.log('Ethereum is configured');
	 * }
	 * ```
	 */
	isNetworkConfigured(network: Network): boolean {
		return this.configManager.isNetworkConfigured(network)
	}

	/**
	 * Get current SDK configuration.
	 *
	 * @returns A copy of the current SDK configuration
	 */
	getConfig(): SDKConfig {
		return this.configManager.getConfig()
	}

	/**
	 * Invalidate cache for a specific address on a network.
	 *
	 * Removes all cached transaction data for the specified address.
	 *
	 * @param network - Network (Network.ETHEREUM_MAINNET or Network.SOLANA_MAINNET)
	 * @param address - Address or public key to invalidate
	 *
	 * @example
	 * ```typescript
	 * // Invalidate cache after a new transaction
	 * sdk.invalidateCache(Network.ETHEREUM_MAINNET, '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb');
	 * ```
	 */
	invalidateCache(network: Network, address: string): void {
		if (this.cache) {
			this.cache.invalidate(network, address)
			this.logger.debug('Cache invalidated', { network, address })
		}
	}

	/**
	 * Clear all cached transactions.
	 *
	 * Removes all cached transaction data from memory.
	 *
	 * @example
	 * ```typescript
	 * // Clear cache periodically or on user logout
	 * sdk.clearCache();
	 * ```
	 */
	clearCache(): void {
		if (this.cache) {
			this.cache.clear()
			this.logger.debug('Cache cleared')
		}
	}
}

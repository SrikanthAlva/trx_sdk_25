import {
	SDKConfig,
	EthereumProviderConfig,
	SolanaProviderConfig,
	DEFAULT_CONFIG,
} from '../types/config.js'
import { ConfigurationError } from '../errors/index.js'
import { Network } from '../types/network.js'

/**
 * Default Ethereum provider configuration
 */
const DEFAULT_ETHEREUM_CONFIG: Required<
	Pick<EthereumProviderConfig, 'etherscanApiUrl' | 'timeout'>
> = {
	etherscanApiUrl: 'https://api.etherscan.io/v2/api',
	timeout: 30000, // 30 seconds
}

/**
 * Default Solana provider configuration
 */
const DEFAULT_SOLANA_CONFIG: Required<Pick<SolanaProviderConfig, 'timeout' | 'commitment'>> = {
	timeout: 30000, // 30 seconds
	commitment: 'confirmed',
}

/**
 * Configuration manager for the SDK
 */
export class ConfigManager {
	private config: SDKConfig

	constructor(config: SDKConfig = {}) {
		this.config = this.mergeWithDefaults(config)
		this.validateConfig()
	}

	/**
	 * Merge user config with defaults
	 */
	private mergeWithDefaults(config: SDKConfig): SDKConfig {
		return {
			...config,
			enableLogging: config.enableLogging ?? DEFAULT_CONFIG.enableLogging,
			logLevel: config.logLevel ?? DEFAULT_CONFIG.logLevel,
			ethereum: config.ethereum
				? {
						...config.ethereum,
						etherscanApiUrl:
							config.ethereum.etherscanApiUrl ??
							DEFAULT_ETHEREUM_CONFIG.etherscanApiUrl,
						timeout: config.ethereum.timeout ?? DEFAULT_ETHEREUM_CONFIG.timeout,
				  }
				: undefined,
			solana: config.solana
				? {
						...config.solana,
						timeout: config.solana.timeout ?? DEFAULT_SOLANA_CONFIG.timeout,
						commitment: config.solana.commitment ?? DEFAULT_SOLANA_CONFIG.commitment,
				  }
				: undefined,
		}
	}

	/**
	 * Validate configuration
	 * @throws ConfigurationError if configuration is invalid
	 */
	private validateConfig(): void {
		const errors: string[] = []

		// Validate Ethereum config if provided
		if (this.config.ethereum) {
			if (!this.config.ethereum.etherscanApiKey && !this.config.ethereum.rpcUrl) {
				errors.push(
					'Ethereum configuration requires either etherscanApiKey or rpcUrl to be provided'
				)
			}
			if (this.config.ethereum.timeout && this.config.ethereum.timeout < 0) {
				errors.push('Ethereum timeout must be a positive number')
			}
		}

		// Validate Solana config if provided
		if (this.config.solana) {
			if (!this.config.solana.rpcUrl) {
				errors.push('Solana configuration requires rpcUrl to be provided')
			}
			if (this.config.solana.timeout && this.config.solana.timeout < 0) {
				errors.push('Solana timeout must be a positive number')
			}
		}

		if (errors.length > 0) {
			throw new ConfigurationError(`Invalid configuration: ${errors.join('; ')}`, { errors })
		}
	}

	/**
	 * Get Ethereum provider configuration
	 * @returns Ethereum config or undefined
	 */
	getEthereumConfig(): EthereumProviderConfig | undefined {
		return this.config.ethereum
	}

	/**
	 * Get Solana provider configuration
	 * @returns Solana config or undefined
	 */
	getSolanaConfig(): SolanaProviderConfig | undefined {
		return this.config.solana
	}

	/**
	 * Get full SDK configuration
	 * @returns SDK config
	 */
	getConfig(): SDKConfig {
		return { ...this.config }
	}

	/**
	 * Check if network is configured
	 * @param network - Network to check
	 * @returns true if configured
	 */
	isNetworkConfigured(network: Network): boolean {
		switch (network) {
			case Network.ETHEREUM_MAINNET:
				return !!this.config.ethereum
			case Network.SOLANA_MAINNET:
				return !!this.config.solana
			default:
				return false
		}
	}

	/**
	 * Get logging configuration
	 */
	getLoggingConfig(): { enabled: boolean; level: 'debug' | 'info' | 'warn' | 'error' } {
		return {
			enabled: this.config.enableLogging ?? false,
			level: this.config.logLevel ?? 'info',
		}
	}
}

import { describe, expect, test, vi, beforeEach } from 'vitest'
import { BlockchainSDK } from '../../src/client.js'
import { Network, ValidationError, ConfigurationError } from '../../src/index.js'
import { mockEtherscanSuccessResponse } from '../mocks/ethereum.js'
import { mockSolanaSignaturesResponse, mockSolanaTransactionResponse } from '../mocks/solana.js'

// Mock fetch globally
globalThis.fetch = vi.fn()

describe('BlockchainSDK', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	describe('Initialization', () => {
		test('should initialize with empty config', () => {
			const sdk = new BlockchainSDK()
			expect(sdk).toBeInstanceOf(BlockchainSDK)
		})

		test('should initialize with Ethereum config', () => {
			const sdk = new BlockchainSDK({
				ethereum: {
					etherscanApiKey: 'test-key',
				},
			})
			expect(sdk.isNetworkConfigured(Network.ETHEREUM_MAINNET)).toBe(true)
			expect(sdk.isNetworkConfigured(Network.SOLANA_MAINNET)).toBe(false)
		})

		test('should initialize with Solana config', () => {
			const sdk = new BlockchainSDK({
				solana: {
					rpcUrl: 'https://api.mainnet-beta.solana.com',
				},
			})
			expect(sdk.isNetworkConfigured(Network.SOLANA_MAINNET)).toBe(true)
			expect(sdk.isNetworkConfigured(Network.ETHEREUM_MAINNET)).toBe(false)
		})

		test('should initialize with both configs', () => {
			const sdk = new BlockchainSDK({
				ethereum: {
					etherscanApiKey: 'test-key',
				},
				solana: {
					rpcUrl: 'https://api.mainnet-beta.solana.com',
				},
			})
			expect(sdk.isNetworkConfigured(Network.ETHEREUM_MAINNET)).toBe(true)
			expect(sdk.isNetworkConfigured(Network.SOLANA_MAINNET)).toBe(true)
		})
	})

	describe('getTransactions', () => {
		test('should auto-detect Ethereum and fetch transactions', async () => {
			const sdk = new BlockchainSDK({
				ethereum: {
					etherscanApiKey: 'IS5J45WTWP2M1QGV53X9RVS6M48SW36B2C',
				},
			})

			;(globalThis.fetch as any).mockResolvedValueOnce({
				ok: true,
				status: 200,
				headers: new Map(),
				json: async () => mockEtherscanSuccessResponse,
			})

			const result = await sdk.getTransactions('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0')

			expect(result.data.length).toBeGreaterThan(0)
			expect(result.data[0].network).toBe(Network.ETHEREUM_MAINNET)
		})

		test('should throw ValidationError for invalid address', async () => {
			const sdk = new BlockchainSDK({
				ethereum: {
					etherscanApiKey: 'IS5J45WTWP2M1QGV53X9RVS6M48SW36B2C',
				},
			})

			await expect(sdk.getTransactions('invalid-address')).rejects.toThrow(ValidationError)
		})

		test('should throw ConfigurationError if network not configured', async () => {
			const sdk = new BlockchainSDK()

			await expect(
				sdk.getTransactions('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0')
			).rejects.toThrow(ConfigurationError)
		})
	})

	describe('getEthereumTransactions', () => {
		test('should fetch Ethereum transactions', async () => {
			const sdk = new BlockchainSDK({
				ethereum: {
					etherscanApiKey: 'IS5J45WTWP2M1QGV53X9RVS6M48SW36B2C',
				},
			})

			;(globalThis.fetch as any).mockResolvedValueOnce({
				ok: true,
				status: 200,
				headers: new Map(),
				json: async () => mockEtherscanSuccessResponse,
			})

			const result = await sdk.getEthereumTransactions('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0')

			expect(result.data.length).toBeGreaterThan(0)
		})

		test('should throw ConfigurationError if Ethereum not configured', async () => {
			const sdk = new BlockchainSDK()

			await expect(
				sdk.getEthereumTransactions('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0')
			).rejects.toThrow(ConfigurationError)
		})
	})

	describe('getSolanaTransactions', () => {
		test('should fetch Solana transactions', async () => {
			const sdk = new BlockchainSDK({
				solana: {
					rpcUrl: 'https://api.mainnet-beta.solana.com',
				},
			})

			// Mock getSignaturesForAddress
			;(globalThis.fetch as any).mockResolvedValueOnce({
				ok: true,
				status: 200,
				headers: new Map(),
				json: async () => ({
					jsonrpc: '2.0',
					id: 1,
					result: mockSolanaSignaturesResponse,
				}),
			})

			// Mock getTransaction
			;(globalThis.fetch as any).mockResolvedValue({
				ok: true,
				status: 200,
				headers: new Map(),
				json: async () => ({
					jsonrpc: '2.0',
					id: 2,
					result: mockSolanaTransactionResponse,
				}),
			})

			const result = await sdk.getSolanaTransactions('9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM')

			expect(result.data.length).toBeGreaterThan(0)
		})

		test('should throw ConfigurationError if Solana not configured', async () => {
			const sdk = new BlockchainSDK()

			await expect(
				sdk.getSolanaTransactions('9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM')
			).rejects.toThrow(ConfigurationError)
		})
	})

	describe('Cache Management', () => {
		test('should cache transactions when cache is enabled', async () => {
			const sdk = new BlockchainSDK({
				ethereum: {
					etherscanApiKey: 'IS5J45WTWP2M1QGV53X9RVS6M48SW36B2C',
				},
				cache: {
					enabled: true,
					ttl: 30000,
				},
			})

			;(globalThis.fetch as any).mockResolvedValue({
				ok: true,
				status: 200,
				headers: new Map(),
				json: async () => mockEtherscanSuccessResponse,
			})

			const address = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0'

			// First call
			await sdk.getTransactions(address)
			expect(globalThis.fetch).toHaveBeenCalledTimes(1)

			// Second call should use cache
			await sdk.getTransactions(address)
			expect(globalThis.fetch).toHaveBeenCalledTimes(1) // Still 1, cache hit
		})

		test('should invalidate cache', () => {
			const sdk = new BlockchainSDK({
				ethereum: {
					etherscanApiKey: 'IS5J45WTWP2M1QGV53X9RVS6M48SW36B2C',
				},
				cache: {
					enabled: true,
				},
			})

			expect(() => {
				sdk.invalidateCache(Network.ETHEREUM_MAINNET, '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0')
			}).not.toThrow()
		})

		test('should clear cache', () => {
			const sdk = new BlockchainSDK({
				cache: {
					enabled: true,
				},
			})

			expect(() => {
				sdk.clearCache()
			}).not.toThrow()
		})
	})
})


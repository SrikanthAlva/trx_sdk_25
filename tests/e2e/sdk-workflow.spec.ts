import { describe, expect, test, vi, beforeEach } from 'vitest'
import { BlockchainSDK } from '../../src/client.js'
import { Network, ValidationError, ConfigurationError } from '../../src/index.js'
import { mockEtherscanSuccessResponse } from '../mocks/ethereum.js'
import { mockSolanaSignaturesResponse, mockSolanaTransactionResponse } from '../mocks/solana.js'

// Mock fetch globally
global.fetch = vi.fn()

describe('E2E SDK Workflow Tests', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	describe('Full SDK Workflow', () => {
		test('should complete full workflow: init -> configure -> fetch -> cache', async () => {
			const sdk = new BlockchainSDK({
				ethereum: {
					etherscanApiKey: 'test-key',
				},
				solana: {
					rpcUrl: 'https://api.mainnet-beta.solana.com',
				},
				cache: {
					enabled: true,
					ttl: 30000,
				},
				enableLogging: true,
				logLevel: 'info',
			})

			// Verify configuration
			expect(sdk.isNetworkConfigured(Network.ETHEREUM_MAINNET)).toBe(true)
			expect(sdk.isNetworkConfigured(Network.SOLANA_MAINNET)).toBe(true)

			// Mock Ethereum response
			;(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				status: 200,
				headers: new Map(),
				json: async () => mockEtherscanSuccessResponse,
			})

			// Fetch Ethereum transactions
			const ethResult = await sdk.getTransactions('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0')
			expect(ethResult.data.length).toBeGreaterThan(0)

			// Verify cache hit on second call
			const ethResultCached = await sdk.getTransactions('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0')
			expect(ethResultCached.data.length).toBe(ethResult.data.length)

			// Mock Solana responses
			;(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				status: 200,
				headers: new Map(),
				json: async () => ({
					jsonrpc: '2.0',
					id: 1,
					result: mockSolanaSignaturesResponse,
				}),
			})

			;(global.fetch as any).mockResolvedValue({
				ok: true,
				status: 200,
				headers: new Map(),
				json: async () => ({
					jsonrpc: '2.0',
					id: 2,
					result: mockSolanaTransactionResponse,
				}),
			})

			// Fetch Solana transactions
			const solResult = await sdk.getTransactions('9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM')
			expect(solResult.data.length).toBeGreaterThan(0)
		})

		test('should handle configuration scenarios', () => {
			// Empty config
			const sdk1 = new BlockchainSDK()
			expect(sdk1.isNetworkConfigured(Network.ETHEREUM_MAINNET)).toBe(false)

			// Ethereum only
			const sdk2 = new BlockchainSDK({
				ethereum: {
					etherscanApiKey: 'test-key',
				},
			})
			expect(sdk2.isNetworkConfigured(Network.ETHEREUM_MAINNET)).toBe(true)
			expect(sdk2.isNetworkConfigured(Network.SOLANA_MAINNET)).toBe(false)

			// Solana only
			const sdk3 = new BlockchainSDK({
				solana: {
					rpcUrl: 'https://api.mainnet-beta.solana.com',
				},
			})
			expect(sdk3.isNetworkConfigured(Network.SOLANA_MAINNET)).toBe(true)
			expect(sdk3.isNetworkConfigured(Network.ETHEREUM_MAINNET)).toBe(false)

			// Both
			const sdk4 = new BlockchainSDK({
				ethereum: {
					etherscanApiKey: 'test-key',
				},
				solana: {
					rpcUrl: 'https://api.mainnet-beta.solana.com',
				},
			})
			expect(sdk4.isNetworkConfigured(Network.ETHEREUM_MAINNET)).toBe(true)
			expect(sdk4.isNetworkConfigured(Network.SOLANA_MAINNET)).toBe(true)
		})

		test('should handle error scenarios', async () => {
			const sdk = new BlockchainSDK({
				ethereum: {
					etherscanApiKey: 'test-key',
				},
			})

			// Invalid address
			await expect(sdk.getTransactions('invalid-address')).rejects.toThrow(ValidationError)

			// Network not configured
			const sdkNoConfig = new BlockchainSDK()
			await expect(
				sdkNoConfig.getTransactions('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0')
			).rejects.toThrow(ConfigurationError)
		})

		test('should handle cache invalidation workflow', async () => {
			const sdk = new BlockchainSDK({
				ethereum: {
					etherscanApiKey: 'test-key',
				},
				cache: {
					enabled: true,
				},
			})

			const address = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0'

			;(global.fetch as any).mockResolvedValue({
				ok: true,
				status: 200,
				headers: new Map(),
				json: async () => mockEtherscanSuccessResponse,
			})

			// First fetch
			await sdk.getTransactions(address)
			expect(global.fetch).toHaveBeenCalledTimes(1)

			// Cache hit
			await sdk.getTransactions(address)
			expect(global.fetch).toHaveBeenCalledTimes(1)

			// Invalidate cache
			sdk.invalidateCache(Network.ETHEREUM_MAINNET, address)

			// Should fetch again after invalidation
			await sdk.getTransactions(address)
			expect(global.fetch).toHaveBeenCalledTimes(2)
		})
	})
})


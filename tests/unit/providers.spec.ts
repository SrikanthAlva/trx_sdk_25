import { describe, expect, test, vi, beforeEach } from 'vitest'
import { EthereumProvider } from '../../src/providers/ethereum.js'
import { SolanaProvider } from '../../src/providers/solana.js'
import { ConfigurationError, ProviderError } from '../../src/errors/index.js'
import { Network } from '../../src/types/network.js'
import { mockEtherscanSuccessResponse, mockEtherscanErrorResponse } from '../mocks/ethereum.js'
import { mockSolanaSignaturesResponse, mockSolanaTransactionResponse } from '../mocks/solana.js'

// Mock fetch globally
global.fetch = vi.fn()

describe('EthereumProvider', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	test('should throw ConfigurationError if no API key or RPC URL provided', () => {
		expect(() => {
			new EthereumProvider({} as any)
		}).toThrow(ConfigurationError)
	})

	test('should initialize with API key', () => {
		const provider = new EthereumProvider({
			etherscanApiKey: 'test-key',
		})
		expect(provider.network).toBe(Network.ETHEREUM_MAINNET)
		expect(provider.isConfigured()).toBe(true)
	})

	test('should fetch transactions successfully', async () => {
		const provider = new EthereumProvider({
			etherscanApiKey: 'test-key',
		})

		;(global.fetch as any).mockResolvedValueOnce({
			ok: true,
			status: 200,
			headers: new Map(),
			json: async () => mockEtherscanSuccessResponse,
		})

		const result = await provider.getTransactions('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0', {
			limit: 10,
		})

		expect(result.data).toHaveLength(2)
		expect(result.data[0].network).toBe(Network.ETHEREUM_MAINNET)
		expect(result.data[0].hash).toBe('0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef')
		expect(result.pagination.hasMore).toBe(false)
	})

	test('should handle API errors', async () => {
		const provider = new EthereumProvider({
			etherscanApiKey: 'test-key',
		})

		;(global.fetch as any).mockResolvedValueOnce({
			ok: true,
			status: 200,
			headers: new Map(),
			json: async () => mockEtherscanErrorResponse,
		})

		await expect(
			provider.getTransactions('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0')
		).rejects.toThrow(ProviderError)
	})

	test('should validate config', () => {
		const validConfig = EthereumProvider.validateConfig({
			etherscanApiKey: 'test-key',
		})
		expect(validConfig.valid).toBe(true)

		const invalidConfig = EthereumProvider.validateConfig({} as any)
		expect(invalidConfig.valid).toBe(false)
		expect(invalidConfig.errors.length).toBeGreaterThan(0)
	})
})

describe('SolanaProvider', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	test('should throw ConfigurationError if no RPC URL provided', () => {
		expect(() => {
			new SolanaProvider({} as any)
		}).toThrow(ConfigurationError)
	})

	test('should initialize with RPC URL', () => {
		const provider = new SolanaProvider({
			rpcUrl: 'https://api.mainnet-beta.solana.com',
		})
		expect(provider.network).toBe(Network.SOLANA_MAINNET)
		expect(provider.isConfigured()).toBe(true)
	})

	test('should fetch transactions successfully', async () => {
		const provider = new SolanaProvider({
			rpcUrl: 'https://api.mainnet-beta.solana.com',
		})

		// Mock getSignaturesForAddress
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

		// Mock getTransaction for each signature
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

		const result = await provider.getTransactions('9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM', {
			limit: 10,
		})

		expect(result.data.length).toBeGreaterThan(0)
		expect(result.data[0].network).toBe(Network.SOLANA_MAINNET)
	})

	test('should handle RPC errors', async () => {
		const provider = new SolanaProvider({
			rpcUrl: 'https://api.mainnet-beta.solana.com',
		})

		;(global.fetch as any).mockResolvedValueOnce({
			ok: true,
			status: 200,
			headers: new Map(),
			json: async () => ({
				jsonrpc: '2.0',
				id: 1,
				error: {
					code: -32602,
					message: 'Invalid params',
				},
			}),
		})

		await expect(
			provider.getTransactions('9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM')
		).rejects.toThrow(ProviderError)
	})

	test('should validate config', () => {
		const validConfig = SolanaProvider.validateConfig({
			rpcUrl: 'https://api.mainnet-beta.solana.com',
		})
		expect(validConfig.valid).toBe(true)

		const invalidConfig = SolanaProvider.validateConfig({} as any)
		expect(invalidConfig.valid).toBe(false)
		expect(invalidConfig.errors.length).toBeGreaterThan(0)
	})
})


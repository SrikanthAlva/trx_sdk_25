import { describe, expect, test, vi, beforeEach } from 'vitest'
import { EthereumAdapter } from '../../src/adapters/ethereum.js'
import { SolanaAdapter } from '../../src/adapters/solana.js'
import { EthereumProvider } from '../../src/providers/ethereum.js'
import { SolanaProvider } from '../../src/providers/solana.js'
import { ValidationError } from '../../src/errors/index.js'
import { Network } from '../../src/types/network.js'
import { mockEtherscanSuccessResponse } from '../mocks/ethereum.js'
import { mockSolanaSignaturesResponse, mockSolanaTransactionResponse } from '../mocks/solana.js'

// Mock fetch globally
global.fetch = vi.fn()

describe('EthereumAdapter', () => {
	let adapter: EthereumAdapter
	let provider: EthereumProvider

	beforeEach(() => {
		vi.clearAllMocks()
		provider = new EthereumProvider({
			etherscanApiKey: 'test-key',
		})
		adapter = new EthereumAdapter(provider)
	})

	test('should validate Ethereum address', () => {
		expect(adapter.validateAddress('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0')).toBe(true)
		expect(adapter.validateAddress('invalid')).toBe(false)
	})

	test('should detect Ethereum network', () => {
		expect(adapter.detectNetwork('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0')).toBe(
			Network.ETHEREUM_MAINNET
		)
		expect(adapter.detectNetwork('invalid')).toBe(null)
	})

	test('should throw ValidationError for invalid address', async () => {
		await expect(adapter.getTransactions('invalid')).rejects.toThrow(ValidationError)
	})

	test('should fetch and transform transactions', async () => {
		;(global.fetch as any).mockResolvedValueOnce({
			ok: true,
			status: 200,
			headers: new Map(),
			json: async () => mockEtherscanSuccessResponse,
		})

		const result = await adapter.getTransactions('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0', {
			limit: 10,
		})

		expect(result.data).toHaveLength(2)
		expect(result.data[0].network).toBe(Network.ETHEREUM_MAINNET)
		expect(result.data[0].from).toBe('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0')
	})

	test('should apply time range filtering', async () => {
		;(global.fetch as any).mockResolvedValueOnce({
			ok: true,
			status: 200,
			headers: new Map(),
			json: async () => mockEtherscanSuccessResponse,
		})

		const startTime = new Date('2021-01-01').getTime()
		const endTime = new Date('2021-01-02').getTime()

		const result = await adapter.getTransactions('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0', {
			startTime,
			endTime,
		})

		// All transactions should be within the time range
		result.data.forEach((tx) => {
			expect(tx.timestamp).toBeGreaterThanOrEqual(startTime)
			expect(tx.timestamp).toBeLessThanOrEqual(endTime)
		})
	})
})

describe('SolanaAdapter', () => {
	let adapter: SolanaAdapter
	let provider: SolanaProvider

	beforeEach(() => {
		vi.clearAllMocks()
		provider = new SolanaProvider({
			rpcUrl: 'https://api.mainnet-beta.solana.com',
		})
		adapter = new SolanaAdapter(provider)
	})

	test('should validate Solana public key', () => {
		expect(adapter.validateAddress('9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM')).toBe(true)
		expect(adapter.validateAddress('invalid')).toBe(false)
	})

	test('should detect Solana network', () => {
		expect(adapter.detectNetwork('9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM')).toBe(
			Network.SOLANA_MAINNET
		)
		expect(adapter.detectNetwork('invalid')).toBe(null)
	})

	test('should throw ValidationError for invalid public key', async () => {
		await expect(adapter.getTransactions('invalid')).rejects.toThrow(ValidationError)
	})

	test('should fetch and transform transactions', async () => {
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

		// Mock getTransaction
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

		const result = await adapter.getTransactions('9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM', {
			limit: 10,
		})

		expect(result.data.length).toBeGreaterThan(0)
		expect(result.data[0].network).toBe(Network.SOLANA_MAINNET)
	})
})


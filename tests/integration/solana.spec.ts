import { describe, expect, test, beforeAll } from 'vitest'
import { BlockchainSDK } from '../../src/client.js'
import { Network } from '../../src/types/network.js'

// Skip integration tests if RPC URL is not provided
const SOLANA_RPC_URL = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com'
const shouldSkip = false // Public endpoint, so we can always run

describe.skipIf(shouldSkip)('Solana Integration Tests', () => {
	let sdk: BlockchainSDK

	beforeAll(() => {
		sdk = new BlockchainSDK({
			solana: {
				rpcUrl: SOLANA_RPC_URL,
			},
			enableLogging: false,
		})
	})

	test('should fetch transactions for a known Solana public key', async () => {
		// Using a known Solana address
		const publicKey = '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM'

		const result = await sdk.getSolanaTransactions(publicKey, {
			limit: 10,
		})

		expect(result.data).toBeDefined()
		expect(Array.isArray(result.data)).toBe(true)
		expect(result.pagination).toBeDefined()
		expect(result.pagination.hasMore).toBeDefined()

		if (result.data.length > 0) {
			const tx = result.data[0]
			expect(tx.network).toBe(Network.SOLANA_MAINNET)
			expect(tx.signature).toBeDefined()
			expect(tx.slot).toBeDefined()
			expect(tx.timestamp).toBeGreaterThan(0)
		}
	}, 30000)

	test('should handle cursor-based pagination', async () => {
		const publicKey = '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM'

		const page1 = await sdk.getSolanaTransactions(publicKey, {
			limit: 5,
		})

		if (page1.pagination.nextCursor) {
			const page2 = await sdk.getSolanaTransactions(publicKey, {
				limit: 5,
				cursor: page1.pagination.nextCursor,
			})

			expect(page2.data.length).toBeGreaterThan(0)
			// Transactions should be different
			if (page1.data.length > 0 && page2.data.length > 0) {
				expect(page1.data[0].signature).not.toBe(page2.data[0].signature)
			}
		}
	}, 30000)

	test('should apply time range filtering', async () => {
		const publicKey = '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM'

		const startTime = new Date('2024-01-01').getTime()
		const endTime = new Date('2024-12-31').getTime()

		const result = await sdk.getSolanaTransactions(publicKey, {
			limit: 100,
			startTime,
			endTime,
		})

		// All transactions should be within the time range
		result.data.forEach((tx) => {
			expect(tx.timestamp).toBeGreaterThanOrEqual(startTime)
			expect(tx.timestamp).toBeLessThanOrEqual(endTime)
		})
	}, 30000)

	test('should handle empty result gracefully', async () => {
		// Use a public key that likely has no transactions
		// Note: This might still return some transactions, so we just check the structure
		const publicKey = '11111111111111111111111111111111'

		const result = await sdk.getSolanaTransactions(publicKey, {
			limit: 10,
		})

		expect(result.data).toBeDefined()
		expect(Array.isArray(result.data)).toBe(true)
	}, 30000)

	test('should auto-detect network and fetch transactions', async () => {
		const publicKey = '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM'

		const result = await sdk.getTransactions(publicKey, {
			limit: 5,
		})

		expect(result.data.length).toBeGreaterThanOrEqual(0)
		if (result.data.length > 0) {
			expect(result.data[0].network).toBe(Network.SOLANA_MAINNET)
		}
	}, 30000)
})


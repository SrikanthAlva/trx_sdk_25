import { describe, expect, test, beforeAll } from 'vitest'
import { BlockchainSDK } from '../../src/client.js'
import { Network } from '../../src/types/network.js'

// Skip integration tests if API key is not provided
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY
const shouldSkip = !ETHERSCAN_API_KEY

describe.skipIf(shouldSkip)('Ethereum Integration Tests', () => {
	let sdk: BlockchainSDK

	beforeAll(() => {
		sdk = new BlockchainSDK({
			ethereum: {
				etherscanApiKey: ETHERSCAN_API_KEY!,
			},
			enableLogging: false,
		})
	})

	test('should fetch transactions for a known Ethereum address', async () => {
		// Using Vitalik's address as a test address (has many transactions)
		const address = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'

		const result = await sdk.getEthereumTransactions(address, {
			limit: 10,
			page: 1,
		})

		expect(result.data).toBeDefined()
		expect(Array.isArray(result.data)).toBe(true)
		expect(result.pagination).toBeDefined()
		expect(result.pagination.hasMore).toBeDefined()

		if (result.data.length > 0) {
			const tx = result.data[0]
			expect(tx.network).toBe(Network.ETHEREUM_MAINNET)
			expect(tx.hash).toBeDefined()
			expect(tx.from).toBeDefined()
			expect(tx.timestamp).toBeGreaterThan(0)
		}
	}, 30000)

	test('should handle pagination', async () => {
		const address = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'

		const page1 = await sdk.getEthereumTransactions(address, {
			limit: 5,
			page: 1,
		})

		if (page1.pagination.hasMore) {
			const page2 = await sdk.getEthereumTransactions(address, {
				limit: 5,
				page: 2,
			})

			expect(page2.data.length).toBeGreaterThan(0)
			// Transactions should be different
			if (page1.data.length > 0 && page2.data.length > 0) {
				expect(page1.data[0].hash).not.toBe(page2.data[0].hash)
			}
		}
	}, 30000)

	test('should apply time range filtering', async () => {
		const address = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'

		const startTime = new Date('2024-01-01').getTime()
		const endTime = new Date('2024-12-31').getTime()

		const result = await sdk.getEthereumTransactions(address, {
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
		// Use an address that likely has no transactions
		const address = '0x0000000000000000000000000000000000000000'

		const result = await sdk.getEthereumTransactions(address, {
			limit: 10,
		})

		expect(result.data).toBeDefined()
		expect(Array.isArray(result.data)).toBe(true)
		expect(result.pagination.hasMore).toBe(false)
	}, 30000)

	test('should auto-detect network and fetch transactions', async () => {
		const address = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'

		const result = await sdk.getTransactions(address, {
			limit: 5,
		})

		expect(result.data.length).toBeGreaterThanOrEqual(0)
		if (result.data.length > 0) {
			expect(result.data[0].network).toBe(Network.ETHEREUM_MAINNET)
		}
	}, 30000)
})


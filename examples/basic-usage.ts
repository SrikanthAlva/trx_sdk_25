/**
 * Basic usage examples for the Blockchain Transaction History SDK
 */

import { BlockchainSDK, Network } from '../src/index.js'

async function basicExample() {
	// Initialize SDK
	const sdk = new BlockchainSDK({
		ethereum: {
			etherscanApiKey: process.env.ETHERSCAN_API_KEY || 'your-api-key',
		},
		solana: {
			rpcUrl: process.env.SOLANA_RPC_URL || 'https://mainnet.helius-rpc.com/?api-key=faf2058f-9e53-4cf8-acae-5be5f61d8a7c',
		},
		enableLogging: true,
		logLevel: 'info',
		cache: {
			enabled: true,
			ttl: 30000, // 30 seconds
		},
	})

	// Example 1: Auto-detect network
	console.log('=== Example 1: Auto-detect Network ===')
	try {
		const ethAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb'
		const transactions = await sdk.getTransactions(ethAddress, { limit: 5 })
		console.log(`Found ${transactions.data.length} transactions`)
		console.log(`Has more: ${transactions.pagination.hasMore}`)
	} catch (error) {
		console.error('Error:', error)
	}

	// Example 2: Ethereum-specific
	console.log('\n=== Example 2: Ethereum Transactions ===')
	try {
		const ethTxs = await sdk.getEthereumTransactions(
			'0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
			{ limit: 3, page: 1 }
		)

		ethTxs.data.forEach((tx, index) => {
			console.log(`\nTransaction ${index + 1}:`)
			console.log(`  Hash: ${tx.hash}`)
			console.log(`  From: ${tx.from}`)
			console.log(`  To: ${tx.to || 'Contract Creation'}`)
			console.log(`  Value: ${tx.value} Wei`)
			console.log(`  Status: ${tx.status}`)
			console.log(`  Timestamp: ${new Date(tx.timestamp).toISOString()}`)
		})
	} catch (error) {
		console.error('Error:', error)
	}

	// Example 3: Solana-specific
	console.log('\n=== Example 3: Solana Transactions ===')
	try {
		const solTxs = await sdk.getSolanaTransactions(
			'9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
			{ limit: 3 }
		)

		solTxs.data.forEach((tx, index) => {
			console.log(`\nTransaction ${index + 1}:`)
			console.log(`  Signature: ${tx.signature}`)
			console.log(`  Slot: ${tx.slot}`)
			console.log(`  Fee Payer: ${tx.feePayer}`)
			console.log(`  Status: ${tx.status}`)
			console.log(`  Timestamp: ${new Date(tx.timestamp).toISOString()}`)
		})

		// Pagination example
		if (solTxs.pagination.nextCursor) {
			console.log(`\nNext cursor: ${solTxs.pagination.nextCursor}`)
		}
	} catch (error) {
		console.error('Error:', error)
	}

	// Example 4: Error handling
	console.log('\n=== Example 4: Error Handling ===')
	try {
		await sdk.getTransactions('invalid-address')
	} catch (error) {
		if (error instanceof Error) {
			console.log(`Error type: ${error.constructor.name}`)
			console.log(`Error message: ${error.message}`)
			if ('context' in error) {
				console.log(`Error context:`, (error as any).context)
			}
		}
	}

	// Example 5: Cache management
	console.log('\n=== Example 5: Cache Management ===')
	const address = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb'

	// First call - will fetch from API
	console.log('First call (cache miss)...')
	const start1 = Date.now()
	await sdk.getTransactions(address, { limit: 10 })
	console.log(`Time: ${Date.now() - start1}ms`)

	// Second call - will use cache
	console.log('Second call (cache hit)...')
	const start2 = Date.now()
	await sdk.getTransactions(address, { limit: 10 })
	console.log(`Time: ${Date.now() - start2}ms`)

	// Invalidate cache
	sdk.invalidateCache(Network.ETHEREUM_MAINNET, address)
	console.log('Cache invalidated')
}

// Run example
if (import.meta.url === `file://${process.argv[1]}`) {
	basicExample().catch(console.error)
}


/**
 * Mock Solana RPC responses
 */

export const mockSolanaSignaturesResponse = [
	{
		signature: '5VERv8NMvzbJMEkV8xnrLkEaWRtSz9CosKDYjCJjBRnbJLgp8uirBgmQpjKhoR4tjF3ZpRzrFmBV6UjKdiSZkQUW',
		slot: 123456789,
		err: null,
		memo: null,
		blockTime: 1609459200,
	},
	{
		signature: '2V7FshZJv8XHjG1YpQZzJv8XHjG1YpQZzJv8XHjG1YpQZzJv8XHjG1YpQZzJv8XHjG1YpQZzJv8XHjG1',
		slot: 123456790,
		err: null,
		memo: null,
		blockTime: 1609459300,
	},
]

export const mockSolanaTransactionResponse = {
	slot: 123456789,
	transaction: {
		message: {
			accountKeys: [
				'9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
				'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
			],
			instructions: [
				{
					programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
					accounts: [0, 1],
					data: 'AQAAAA==',
				},
			],
			recentBlockhash: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
		},
		signatures: ['5VERv8NMvzbJMEkV8xnrLkEaWRtSz9CosKDYjCJjBRnbJLgp8uirBgmQpjKhoR4tjF3ZpRzrFmBV6UjKdiSZkQUW'],
	},
	meta: {
		err: null,
		fee: 5000,
		preBalances: [1000000000, 500000000],
		postBalances: [995000000, 505000000],
		preTokenBalances: [],
		postTokenBalances: [],
	},
	blockTime: 1609459200,
}

export const mockSolanaPublicKey = '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM'
export const mockInvalidSolanaPublicKey = 'invalid-key'


/**
 * Mock Ethereum/Etherscan API responses
 */

export const mockEtherscanSuccessResponse = {
	status: '1',
	message: 'OK',
	result: [
		{
			blockNumber: '12345678',
			timeStamp: '1609459200',
			hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
			nonce: '42',
			blockHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
			transactionIndex: '0',
			from: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0',
			to: '0x8ba1f109551bD432803012645Hac136c22C9',
			value: '1000000000000000000',
			gas: '21000',
			gasPrice: '20000000000',
			isError: '0',
			txreceipt_status: '1',
			input: '0x',
			contractAddress: '',
			cumulativeGasUsed: '21000',
			gasUsed: '21000',
			confirmations: '1000000',
		},
		{
			blockNumber: '12345679',
			timeStamp: '1609459300',
			hash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
			nonce: '43',
			blockHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
			transactionIndex: '1',
			from: '0x8ba1f109551bD432803012645Hac136c22C9',
			to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0',
			value: '500000000000000000',
			gas: '21000',
			gasPrice: '20000000000',
			isError: '0',
			txreceipt_status: '1',
			input: '0x',
			contractAddress: '',
			cumulativeGasUsed: '21000',
			gasUsed: '21000',
			confirmations: '999999',
		},
	],
}

export const mockEtherscanNoTransactionsResponse = {
	status: '0',
	message: 'No transactions found',
	result: 'No transactions found',
}

export const mockEtherscanErrorResponse = {
	status: '0',
	message: 'NOTOK',
	result: 'Invalid API Key',
}

export const mockEthereumAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb00' // 42 chars
export const mockInvalidEthereumAddress = '0xinvalid'


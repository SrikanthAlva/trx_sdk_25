import { describe, expect, test } from 'vitest'
import {
	isEthereumTransaction,
	isSolanaTransaction,
	isNetwork,
	isEthereumAddress,
	isSolanaPublicKey,
} from '../../src/utils/type-guards.js'
import { TransactionStatus } from '../../src/types/transaction.js'
import { Network } from '../../src/types/network.js'
import { EthereumTransaction, SolanaTransaction } from '../../src/types/transaction.js'

describe('Type Guards', () => {
	describe('isEthereumTransaction', () => {
		test('should return true for Ethereum transaction', () => {
			const tx: EthereumTransaction = {
				network: Network.ETHEREUM_MAINNET,
				hash: '0x123',
				timestamp: Date.now(),
				status: TransactionStatus.SUCCESS,
				from: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0',
				to: '0x8ba1f109551bD432803012645Hac136c22C9',
				value: '1000000000000000000',
			}

			expect(isEthereumTransaction(tx)).toBe(true)
		})

		test('should return false for Solana transaction', () => {
			const tx: SolanaTransaction = {
				network: Network.SOLANA_MAINNET,
				hash: 'signature',
				signature: 'signature',
				slot: 123,
				timestamp: Date.now(),
				status: TransactionStatus.SUCCESS,
				feePayer: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
				accountKeys: [],
			}

			expect(isEthereumTransaction(tx)).toBe(false)
		})
	})

	describe('isSolanaTransaction', () => {
		test('should return true for Solana transaction', () => {
			const tx: SolanaTransaction = {
				network: Network.SOLANA_MAINNET,
				hash: 'signature',
				signature: 'signature',
				slot: 123,
				timestamp: Date.now(),
				status: TransactionStatus.SUCCESS,
				feePayer: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
				accountKeys: [],
			}

			expect(isSolanaTransaction(tx)).toBe(true)
		})

		test('should return false for Ethereum transaction', () => {
			const tx: EthereumTransaction = {
				network: Network.ETHEREUM_MAINNET,
				hash: '0x123',
				timestamp: Date.now(),
				status: TransactionStatus.SUCCESS,
				from: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0',
				to: '0x8ba1f109551bD432803012645Hac136c22C9',
				value: '1000000000000000000',
			}

			expect(isSolanaTransaction(tx)).toBe(false)
		})
	})

	describe('isNetwork', () => {
		test('should return true for valid Network values', () => {
			expect(isNetwork(Network.ETHEREUM_MAINNET)).toBe(true)
			expect(isNetwork(Network.SOLANA_MAINNET)).toBe(true)
		})

		test('should return false for invalid values', () => {
			expect(isNetwork('invalid')).toBe(false)
			expect(isNetwork(123)).toBe(false)
			expect(isNetwork(null)).toBe(false)
			expect(isNetwork(undefined)).toBe(false)
		})
	})

	describe('isEthereumAddress', () => {
		test('should return true for valid Ethereum address', () => {
			expect(isEthereumAddress('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0')).toBe(true)
		})

		test('should return false for invalid values', () => {
			expect(isEthereumAddress('invalid')).toBe(false)
			expect(isEthereumAddress('9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM')).toBe(false)
			expect(isEthereumAddress(123)).toBe(false)
		})
	})

	describe('isSolanaPublicKey', () => {
		test('should return true for valid Solana public key', () => {
			expect(isSolanaPublicKey('9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM')).toBe(true)
		})

		test('should return false for invalid values', () => {
			expect(isSolanaPublicKey('invalid')).toBe(false)
			expect(isSolanaPublicKey('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb00')).toBe(false)
			expect(isSolanaPublicKey(123)).toBe(false)
		})
	})
})


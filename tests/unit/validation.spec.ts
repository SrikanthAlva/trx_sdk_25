import { describe, expect, test } from 'vitest'
import {
	isValidEthereumAddress,
	isValidSolanaPublicKey,
	detectNetwork,
	validateAddressForNetwork,
	normalizeEthereumAddress,
	normalizeSolanaPublicKey,
} from '../../src/utils/validation.js'
import { Network } from '../../src/types/network.js'
import { ValidationError } from '../../src/errors/index.js'

describe('Validation Utilities', () => {
	describe('isValidEthereumAddress', () => {
		test('should validate correct Ethereum address', () => {
			expect(isValidEthereumAddress('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0')).toBe(true)
			expect(isValidEthereumAddress('0x0000000000000000000000000000000000000000')).toBe(true)
		})

		test('should reject invalid Ethereum addresses', () => {
			expect(isValidEthereumAddress('0x742d35Cc6634C0532925a3b844Bc9e7595f0bE')).toBe(false) // Too short
			expect(isValidEthereumAddress('742d35Cc6634C0532925a3b844Bc9e7595f0bEb')).toBe(false) // No 0x
			expect(isValidEthereumAddress('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEbg')).toBe(false) // Invalid hex
			expect(isValidEthereumAddress('')).toBe(false)
			expect(isValidEthereumAddress('invalid')).toBe(false)
		})
	})

	describe('isValidSolanaPublicKey', () => {
		test('should validate correct Solana public key', () => {
			expect(isValidSolanaPublicKey('9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM')).toBe(
				true
			)
			expect(isValidSolanaPublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v')).toBe(
				true
			)
		})

		test('should reject invalid Solana public keys', () => {
			expect(isValidSolanaPublicKey('9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsG')).toBe(false) // Too short (31 chars, < 32)
			expect(isValidSolanaPublicKey('0x9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM')).toBe(
				false
			) // Has 0x
			expect(isValidSolanaPublicKey('')).toBe(false)
			expect(isValidSolanaPublicKey('invalid')).toBe(false)
		})
	})

	describe('detectNetwork', () => {
		test('should detect Ethereum network', () => {
			expect(detectNetwork('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0')).toBe(
				Network.ETHEREUM_MAINNET
			)
		})

		test('should detect Solana network', () => {
			expect(detectNetwork('9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM')).toBe(
				Network.SOLANA_MAINNET
			)
		})

		test('should return null for unknown format', () => {
			expect(detectNetwork('invalid')).toBe(null)
			expect(detectNetwork('')).toBe(null)
		})
	})

	describe('validateAddressForNetwork', () => {
		test('should validate Ethereum address for Ethereum network', () => {
			expect(() => {
				validateAddressForNetwork(
					'0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0',
					Network.ETHEREUM_MAINNET
				)
			}).not.toThrow()
		})

		test('should validate Solana public key for Solana network', () => {
			expect(() => {
				validateAddressForNetwork(
					'9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
					Network.SOLANA_MAINNET
				)
			}).not.toThrow()
		})

		test('should throw ValidationError for invalid Ethereum address', () => {
			expect(() => {
				validateAddressForNetwork('invalid', Network.ETHEREUM_MAINNET)
			}).toThrow(ValidationError)
		})

		test('should throw ValidationError for invalid Solana public key', () => {
			expect(() => {
				validateAddressForNetwork('invalid', Network.SOLANA_MAINNET)
			}).toThrow(ValidationError)
		})

		test('should throw ValidationError for empty string', () => {
			expect(() => {
				validateAddressForNetwork('', Network.ETHEREUM_MAINNET)
			}).toThrow(ValidationError)
		})
	})

	describe('normalizeEthereumAddress', () => {
		test('should normalize valid Ethereum address', () => {
			const normalized = normalizeEthereumAddress(
				'0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0'
			)
			expect(normalized).toBe('0x742d35cc6634c0532925a3b844bc9e7595f0beb0')
		})

		test('should throw ValidationError for invalid address', () => {
			expect(() => {
				normalizeEthereumAddress('invalid')
			}).toThrow(ValidationError)
		})
	})

	describe('normalizeSolanaPublicKey', () => {
		test('should normalize valid Solana public key', () => {
			const normalized = normalizeSolanaPublicKey(
				'9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM'
			)
			expect(normalized).toBe('9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM')
		})

		test('should throw ValidationError for invalid public key', () => {
			expect(() => {
				normalizeSolanaPublicKey('invalid')
			}).toThrow(ValidationError)
		})
	})
})

import { describe, expect, test } from 'vitest'
import { getNetworkName, getNetworkFromAddress, isSupportedNetwork } from '../../src/utils/network.js'
import { Network } from '../../src/types/network.js'

describe('Network Utilities', () => {
	describe('getNetworkName', () => {
		test('should return correct network name for Ethereum', () => {
			expect(getNetworkName(Network.ETHEREUM_MAINNET)).toBe('Ethereum Mainnet')
		})

		test('should return correct network name for Solana', () => {
			expect(getNetworkName(Network.SOLANA_MAINNET)).toBe('Solana Mainnet')
		})
	})

	describe('getNetworkFromAddress', () => {
		test('should detect Ethereum network from address', () => {
			expect(getNetworkFromAddress('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0')).toBe(
				Network.ETHEREUM_MAINNET
			)
		})

		test('should detect Solana network from public key', () => {
			expect(getNetworkFromAddress('9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM')).toBe(
				Network.SOLANA_MAINNET
			)
		})

		test('should return null for unknown format', () => {
			expect(getNetworkFromAddress('invalid')).toBe(null)
		})
	})

	describe('isSupportedNetwork', () => {
		test('should return true for supported networks', () => {
			expect(isSupportedNetwork(Network.ETHEREUM_MAINNET)).toBe(true)
			expect(isSupportedNetwork(Network.SOLANA_MAINNET)).toBe(true)
		})
	})
})


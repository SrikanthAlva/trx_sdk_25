import { Network } from '../types/network.js'
import { detectNetwork } from './validation.js'

/**
 * Get network name as string
 * @param network - Network enum value
 * @returns Human-readable network name
 */
export function getNetworkName(network: Network): string {
	switch (network) {
		case Network.ETHEREUM_MAINNET:
			return 'Ethereum Mainnet'
		case Network.SOLANA_MAINNET:
			return 'Solana Mainnet'
		default:
			return 'Unknown Network'
	}
}

/**
 * Get network from address (auto-detect)
 * @param address - Address or public key
 * @returns Network or null if cannot detect
 */
export function getNetworkFromAddress(address: string): Network | null {
	return detectNetwork(address)
}

/**
 * Check if network is supported
 * @param network - Network to check
 * @returns true if supported
 */
export function isSupportedNetwork(network: Network): boolean {
	return Object.values(Network).includes(network)
}


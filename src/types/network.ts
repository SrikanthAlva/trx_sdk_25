/**
 * Supported blockchain networks
 */
export enum Network {
	ETHEREUM_MAINNET = 'ethereum-mainnet',
	SOLANA_MAINNET = 'solana-mainnet',
}

/**
 * Network type discriminator for type narrowing
 */
export type NetworkType = Network.ETHEREUM_MAINNET | Network.SOLANA_MAINNET

/**
 * Network configuration metadata
 */
export interface NetworkConfig {
	readonly network: Network
	readonly name: string
	readonly chainId?: number
	readonly rpcUrl?: string
}


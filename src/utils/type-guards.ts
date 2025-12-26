import { Transaction, EthereumTransaction, SolanaTransaction } from '../types/transaction.js'
import { Network } from '../types/network.js'

/**
 * Type guard to check if a transaction is an Ethereum transaction
 * @param transaction - Transaction to check
 * @returns true if transaction is an Ethereum transaction
 */
export function isEthereumTransaction(
	transaction: Transaction
): transaction is EthereumTransaction {
	return transaction.network === Network.ETHEREUM_MAINNET
}

/**
 * Type guard to check if a transaction is a Solana transaction
 * @param transaction - Transaction to check
 * @returns true if transaction is a Solana transaction
 */
export function isSolanaTransaction(transaction: Transaction): transaction is SolanaTransaction {
	return transaction.network === Network.SOLANA_MAINNET
}

/**
 * Type guard to check if a value is a valid Network enum value
 * @param value - Value to check
 * @returns true if value is a valid Network
 */
export function isNetwork(value: unknown): value is Network {
	return typeof value === 'string' && Object.values(Network).includes(value as Network)
}

/**
 * Type guard to check if a value is a valid Ethereum address
 * @param value - Value to check
 * @returns true if value is a valid Ethereum address
 */
export function isEthereumAddress(value: unknown): value is string {
	return typeof value === 'string' && /^0x[a-fA-F0-9]{40}$/.test(value)
}

/**
 * Type guard to check if a value is a valid Solana public key
 * @param value - Value to check
 * @returns true if value is a valid Solana public key
 */
export function isSolanaPublicKey(value: unknown): value is string {
	return typeof value === 'string' && /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(value)
}


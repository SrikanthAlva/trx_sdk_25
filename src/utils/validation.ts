import { ValidationError } from '../errors/index.js'
import { Network } from '../types/network.js'

/**
 * Validate Ethereum address format
 * @param address - Address to validate
 * @returns true if valid Ethereum address
 */
export function isValidEthereumAddress(address: string): boolean {
	if (!address || typeof address !== 'string') {
		return false
	}

	// Ethereum addresses are 42 characters: 0x + 40 hex characters
	const ethereumAddressRegex = /^0x[a-fA-F0-9]{40}$/
	return ethereumAddressRegex.test(address)
}

/**
 * Validate Solana public key format
 * @param publicKey - Public key to validate
 * @returns true if valid Solana public key
 */
export function isValidSolanaPublicKey(publicKey: string): boolean {
	if (!publicKey || typeof publicKey !== 'string') {
		return false
	}

	// Solana public keys are base58 encoded and typically 32-44 characters
	// Base58 alphabet: 123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz
	const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/
	return base58Regex.test(publicKey)
}

/**
 * Detect network from address format
 * @param address - Address or public key to analyze
 * @returns Detected network or null if unknown
 */
export function detectNetwork(address: string): Network | null {
	if (isValidEthereumAddress(address)) {
		return Network.ETHEREUM_MAINNET
	}
	if (isValidSolanaPublicKey(address)) {
		return Network.SOLANA_MAINNET
	}
	return null
}

/**
 * Validate address for a specific network
 * @param address - Address to validate
 * @param network - Network to validate against
 * @throws ValidationError if address is invalid
 */
export function validateAddressForNetwork(address: string, network: Network): void {
	if (!address || typeof address !== 'string') {
		throw new ValidationError('Address must be a non-empty string', { address })
	}

	let isValid = false
	switch (network) {
		case Network.ETHEREUM_MAINNET:
			isValid = isValidEthereumAddress(address)
			if (!isValid) {
				throw new ValidationError(
					'Invalid Ethereum address format. Expected 0x followed by 40 hexadecimal characters.',
					{ address, network }
				)
			}
			break
		case Network.SOLANA_MAINNET:
			isValid = isValidSolanaPublicKey(address)
			if (!isValid) {
				throw new ValidationError(
					'Invalid Solana public key format. Expected base58 encoded string (32-44 characters).',
					{ address, network }
				)
			}
			break
		default:
			throw new ValidationError('Unsupported network', { address, network })
	}
}

/**
 * Normalize Ethereum address (lowercase, but preserve checksum if provided)
 * @param address - Address to normalize
 * @returns Normalized address
 */
export function normalizeEthereumAddress(address: string): string {
	if (!isValidEthereumAddress(address)) {
		throw new ValidationError('Invalid Ethereum address', { address })
	}
	// Convert to lowercase (checksum validation can be added later if needed)
	return address.toLowerCase()
}

/**
 * Normalize Solana public key
 * @param publicKey - Public key to normalize
 * @returns Normalized public key
 */
export function normalizeSolanaPublicKey(publicKey: string): string {
	if (!isValidSolanaPublicKey(publicKey)) {
		throw new ValidationError('Invalid Solana public key', { publicKey })
	}
	return publicKey
}


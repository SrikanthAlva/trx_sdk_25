import { Network } from './network.js'

/**
 * Transaction status
 */
export enum TransactionStatus {
	SUCCESS = 'success',
	FAILED = 'failed',
	PENDING = 'pending',
}

/**
 * Common transaction type that applies to all networks
 */
export interface BaseTransaction {
	/** Transaction hash (Ethereum) or signature (Solana) */
	readonly hash: string
	/** Block number (Ethereum) or slot (Solana) */
	readonly blockNumber?: number | string
	/** Transaction timestamp in milliseconds */
	readonly timestamp: number
	/** Transaction status */
	readonly status: TransactionStatus
	/** Network this transaction belongs to */
	readonly network: Network
	/** Transaction fee in native currency */
	readonly fee?: string
	/** Gas used (Ethereum) or compute units (Solana) */
	readonly gasUsed?: string
}

/**
 * Ethereum-specific transaction fields
 */
export interface EthereumTransaction extends BaseTransaction {
	readonly network: Network.ETHEREUM_MAINNET
	/** From address */
	readonly from: string
	/** To address (null for contract creation) */
	readonly to: string | null
	/** Value transferred in Wei */
	readonly value: string
	/** Gas price in Wei */
	readonly gasPrice?: string
	/** Gas limit */
	readonly gasLimit?: string
	/** Transaction nonce */
	readonly nonce?: number
	/** Input data */
	readonly input?: string
	/** Is this a contract interaction? */
	readonly isContractInteraction?: boolean
	/** Token transfers in this transaction (ERC-20, ERC-721, etc.) */
	readonly tokenTransfers?: TokenTransfer[]
}

/**
 * Solana-specific transaction fields
 */
export interface SolanaTransaction extends BaseTransaction {
	readonly network: Network.SOLANA_MAINNET
	/** Transaction signature */
	readonly signature: string
	/** Slot number */
	readonly slot: number
	/** Fee payer public key */
	readonly feePayer: string
	/** Account keys involved in the transaction */
	readonly accountKeys: string[]
	/** Instructions in the transaction */
	readonly instructions?: SolanaInstruction[]
	/** Pre and post token balances */
	readonly tokenBalances?: TokenBalance[]
}

/**
 * Unified transaction type (discriminated union)
 */
export type Transaction = EthereumTransaction | SolanaTransaction

/**
 * Token transfer information (for Ethereum)
 */
export interface TokenTransfer {
	/** Token contract address */
	readonly contractAddress: string
	/** Token symbol */
	readonly symbol?: string
	/** Token name */
	readonly name?: string
	/** Token decimals */
	readonly decimals?: number
	/** From address */
	readonly from: string
	/** To address */
	readonly to: string
	/** Amount transferred */
	readonly value: string
	/** Token type (ERC-20, ERC-721, ERC-1155) */
	readonly tokenType?: 'ERC-20' | 'ERC-721' | 'ERC-1155'
}

/**
 * Solana instruction information
 */
export interface SolanaInstruction {
	/** Program ID */
	readonly programId: string
	/** Instruction data */
	readonly data?: string
	/** Accounts involved */
	readonly accounts?: string[]
}

/**
 * Token balance information (for Solana)
 */
export interface TokenBalance {
	/** Account address */
	readonly accountIndex: number
	/** Mint address */
	readonly mint: string
	/** Owner address */
	readonly owner?: string
	/** Pre-transaction balance */
	readonly preBalance?: string
	/** Post-transaction balance */
	readonly postBalance?: string
}


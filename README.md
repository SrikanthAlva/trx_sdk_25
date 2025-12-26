# Blockchain Transaction History SDK

A production-grade TypeScript SDK for fetching transaction history from **Ethereum Mainnet** and **Solana Mainnet**. Built with TypeScript, featuring automatic network detection, rate limiting, caching, and comprehensive error handling.

## Features

- 🔍 **Auto-detect Network**: Automatically detects Ethereum addresses or Solana public keys
- ⚡ **Rate Limiting**: Built-in rate limiting to prevent API throttling
- 💾 **Caching**: Configurable in-memory caching with TTL support
- 📝 **TypeScript**: Full TypeScript support with comprehensive type definitions
- 🛡️ **Error Handling**: Detailed error classes with context and troubleshooting hints
- 🔄 **Pagination**: Support for both page-based (Ethereum) and cursor-based (Solana) pagination
- 📊 **Logging**: Optional structured logging with multiple log levels
- 🎯 **Production-Ready**: Built with production-grade patterns and best practices

## Installation

```bash
npm install ts_sdk
# or
yarn add ts_sdk
```

## Quick Start

### Basic Usage

```typescript
import { BlockchainSDK } from 'ts_sdk';

// Initialize SDK with configuration
const sdk = new BlockchainSDK({
  ethereum: {
    etherscanApiKey: 'your-etherscan-api-key'
  },
  solana: {
    rpcUrl: 'https://mainnet.helius-rpc.com/?api-key=your-api-key'
  }
});

// Auto-detect network and fetch transactions
const transactions = await sdk.getTransactions('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb');

console.log(`Found ${transactions.data.length} transactions`);
```

### Ethereum Example

```typescript
import { BlockchainSDK, Network } from 'ts_sdk';

const sdk = new BlockchainSDK({
  ethereum: {
    etherscanApiKey: 'your-etherscan-api-key'
  }
});

// Fetch Ethereum transactions
const result = await sdk.getEthereumTransactions(
  '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
  {
    limit: 20,
    page: 1
  }
);

result.data.forEach(tx => {
  console.log(`Tx: ${tx.hash}`);
  console.log(`From: ${tx.from} -> To: ${tx.to}`);
  console.log(`Value: ${tx.value} Wei`);
  console.log(`Status: ${tx.status}`);
});
```

### Solana Example

```typescript
import { BlockchainSDK } from 'ts_sdk';

const sdk = new BlockchainSDK({
  solana: {
    rpcUrl: 'https://mainnet.helius-rpc.com/?api-key=your-api-key'
  }
});

// Fetch Solana transactions
const result = await sdk.getSolanaTransactions(
  '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
  {
    limit: 20
  }
);

// Use cursor for pagination
if (result.pagination.nextCursor) {
  const nextPage = await sdk.getSolanaTransactions(
    '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
    {
      limit: 20,
      cursor: result.pagination.nextCursor
    }
  );
}
```

## Configuration

### Full Configuration Options

```typescript
import { BlockchainSDK } from 'ts_sdk';

const sdk = new BlockchainSDK({
  // Ethereum configuration
  ethereum: {
    etherscanApiKey: 'your-api-key',        // Required for Etherscan API
    etherscanApiUrl: 'https://api.etherscan.io/v2/api', // Optional, defaults to Etherscan V2 API
    rpcUrl: 'https://eth-mainnet.g.alchemy.com/v2/...', // Alternative to Etherscan
    timeout: 30000 // Request timeout in milliseconds
  },
  
  // Solana configuration
  solana: {
    rpcUrl: 'https://mainnet.helius-rpc.com/?api-key=your-api-key', // Required
    timeout: 30000, // Request timeout in milliseconds
    commitment: 'confirmed' // 'finalized' | 'confirmed' | 'processed'
  },
  
  // Logging configuration
  enableLogging: true,
  logLevel: 'info', // 'debug' | 'info' | 'warn' | 'error'
  
  // Cache configuration
  cache: {
    enabled: true,
    ttl: 30000, // Cache TTL in milliseconds (default: 30 seconds)
    maxSize: 100 // Maximum number of cached queries
  },
  
  // Rate limiting configuration (future use)
  rateLimit: {
    enabled: true,
    requestsPerSecond: 5,
    requestsPerMinute: 300
  }
});
```

### Environment Variables

For easier configuration, you can use environment variables. Copy `env.example` to `.env` and fill in your values:

```bash
cp env.example .env
```

Then use environment variables in your code:

```typescript
const sdk = new BlockchainSDK({
  ethereum: {
    etherscanApiKey: process.env.ETHERSCAN_API_KEY
  },
  solana: {
    rpcUrl: process.env.SOLANA_RPC_URL
  }
});
```

**Important**: Never commit your `.env` file to version control. It's already included in `.gitignore`.

### Getting API Keys

#### Ethereum (Etherscan)

1. Visit [Etherscan.io](https://etherscan.io/)
2. Create a free account
3. Navigate to API-KEYs section
4. Create a new API key
5. Use the API key in your configuration or `.env` file

**Note**: Free tier allows 5 calls per second. The SDK automatically rate limits to stay within these limits.

#### Solana RPC

You can use public RPC endpoints or set up your own:

- **Helius**: `https://mainnet.helius-rpc.com/?api-key=your-api-key` (recommended)
- **Alchemy**: `https://solana-mainnet.g.alchemy.com/v2/YOUR-API-KEY`
- **QuickNode**: `https://YOUR-ENDPOINT.solana-mainnet.quiknode.pro/YOUR-TOKEN/`
- **Public Endpoints**: `https://api.mainnet-beta.solana.com` (rate limited)

## API Reference

### BlockchainSDK

Main SDK client class.

#### Constructor

```typescript
new BlockchainSDK(config?: SDKConfig)
```

#### Methods

##### `getTransactions(address, options?)`

Auto-detects network and fetches transactions.

```typescript
const result = await sdk.getTransactions(address, {
  limit?: number,
  page?: number,        // For Ethereum
  cursor?: string,      // For Solana
  startTime?: number,  // Timestamp in milliseconds
  endTime?: number     // Timestamp in milliseconds
});
```

##### `getEthereumTransactions(address, options?)`

Fetches Ethereum transactions for an address.

```typescript
const result = await sdk.getEthereumTransactions(address, {
  limit?: number,
  page?: number,
  startTime?: number,
  endTime?: number
});
```

##### `getSolanaTransactions(publicKey, options?)`

Fetches Solana transactions for a public key.

```typescript
const result = await sdk.getSolanaTransactions(publicKey, {
  limit?: number,
  cursor?: string,
  startTime?: number,
  endTime?: number
});
```

##### `isNetworkConfigured(network)`

Check if a network provider is configured.

```typescript
const isConfigured = sdk.isNetworkConfigured(Network.ETHEREUM_MAINNET);
```

##### `invalidateCache(network, address)`

Invalidate cache for a specific address.

```typescript
sdk.invalidateCache(Network.ETHEREUM_MAINNET, '0x...');
```

##### `clearCache()`

Clear all cached transactions.

```typescript
sdk.clearCache();
```

### Types

#### Transaction Types

```typescript
// Unified transaction type (discriminated union)
type Transaction = EthereumTransaction | SolanaTransaction;

// Ethereum transaction
interface EthereumTransaction {
  network: Network.ETHEREUM_MAINNET;
  hash: string;
  blockNumber: number;
  timestamp: number;
  status: TransactionStatus;
  from: string;
  to: string | null;
  value: string; // Wei
  gasPrice?: string;
  gasLimit?: string;
  gasUsed?: string;
  fee?: string;
  // ... more fields
}

// Solana transaction
interface SolanaTransaction {
  network: Network.SOLANA_MAINNET;
  hash: string;
  signature: string;
  slot: number;
  timestamp: number;
  status: TransactionStatus;
  feePayer: string;
  accountKeys: string[];
  // ... more fields
}
```

#### Pagination

```typescript
interface PaginatedResponse<T> {
  data: readonly T[];
  pagination: {
    hasMore: boolean;
    page?: number;           // For Ethereum
    totalPages?: number;     // For Ethereum
    nextCursor?: string;     // For Solana
    total?: number;
  };
}
```

### Error Handling

The SDK provides custom error classes for better error handling:

```typescript
import {
  SDKError,
  NetworkError,
  ValidationError,
  RateLimitError,
  ProviderError,
  ConfigurationError
} from 'ts_sdk';

try {
  const transactions = await sdk.getTransactions(address);
} catch (error) {
  if (error instanceof ValidationError) {
    console.error('Invalid address:', error.message);
    console.error('Context:', error.context);
  } else if (error instanceof RateLimitError) {
    console.error('Rate limited. Retry after:', error.retryAfter, 'seconds');
  } else if (error instanceof NetworkError) {
    console.error('Network error:', error.message);
  }
}
```

### Type Guards

Use type guards for runtime type checking:

```typescript
import { isEthereumTransaction, isSolanaTransaction } from 'ts_sdk';

const transactions = await sdk.getTransactions(address);

transactions.data.forEach(tx => {
  if (isEthereumTransaction(tx)) {
    console.log('Ethereum tx:', tx.from, '->', tx.to);
  } else if (isSolanaTransaction(tx)) {
    console.log('Solana tx:', tx.signature);
  }
});
```

## Advanced Usage

### Custom Logger

```typescript
import { BlockchainSDK, createLogger, Logger } from 'ts_sdk';

class CustomLogger implements Logger {
  debug(message: string, context?: Record<string, unknown>): void {
    // Your logging implementation
  }
  // ... implement other methods
}

const logger = createLogger(true, 'debug');
const sdk = new BlockchainSDK({
  // ... config
});
```

### Error Handling with Retry

```typescript
import { RateLimitError } from 'ts_sdk';

async function fetchWithRetry(address: string, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await sdk.getTransactions(address);
    } catch (error) {
      if (error instanceof RateLimitError && i < retries - 1) {
        const delay = error.retryAfter ? error.retryAfter * 1000 : 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
}
```

### Time Range Filtering

```typescript
const startTime = new Date('2024-01-01').getTime();
const endTime = new Date('2024-12-31').getTime();

const transactions = await sdk.getTransactions(address, {
  startTime,
  endTime,
  limit: 100
});
```

## Supported Networks

- ✅ **Ethereum Mainnet** - Via Etherscan API or JSON-RPC
- ✅ **Solana Mainnet** - Via JSON-RPC

## Requirements

- Node.js 18+ (for native `fetch` support)
- TypeScript 5.0+ (for type definitions)

## Development

```bash
# Install dependencies
yarn install

# Build
yarn build

# Run tests
yarn test

# Generate documentation
yarn docs
```

## License

ISC

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

For issues and questions, please open an issue on GitHub.

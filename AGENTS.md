# Development Guidelines - Jupiter CLI

## Build, Lint & Test Commands

```bash
npm run build          # Compile TypeScript to dist/
npm run dev            # Run in development mode with ts-node
npm run start          # Run compiled version
npm run lint           # Run ESLint on src/**/*.ts
npm run lint:fix       # Run ESLint and auto-fix issues
npm run format         # Format code with Prettier
npm run format:check   # Check code formatting without writing
npm run typecheck      # Run TypeScript type checking (no emit)
npm run test           # Run all tests
npm run test:watch     # Run tests in watch mode

# Run a single test file
npx jest tests/unit/entities/wallet.entity.test.ts
npx jest tests/integration/cli-integration.test.ts --testNamePattern="should create wallet"

# Prisma commands
npm run prisma:generate   # Generate Prisma client
npm run prisma:migrate    # Create and apply migration
npm run prisma:deploy     # Apply migrations (production)
npm run prisma:studio     # Open Prisma Studio GUI
```

## Architecture

This project follows Domain-Driven Design (DDD):

```
src/
├── core/           # Cross-cutting concerns (crypto, config, errors, logger)
├── domain/         # Entities, value objects, repository interfaces
├── application/    # Business services, ports (interfaces for external deps)
├── infrastructure/ # Implementations (Prisma, Solana RPC, Jupiter API)
└── interface/      # CLI commands (Commander.js)
```

**Dependency Rule**: Inner layers never depend on outer layers.

- `domain` has no dependencies on other layers
- `application` depends only on `domain` and `core`
- `infrastructure` implements interfaces from `application/ports`
- `interface` orchestrates everything via dependency injection

## Code Style Guidelines

### Imports

Use ES6 top-level imports only. Never use `require()`. Group imports in this order:

```typescript
// 1. Node.js built-ins
import { randomBytes } from 'crypto';
import * as path from 'path';

// 2. External packages
import { Keypair } from '@solana/web3.js';
import { Command } from 'commander';
import { PrismaClient, Wallet as PrismaWallet } from '@prisma/client';

// 3. Internal modules (use path aliases when available)
import { Wallet } from '../../../domain/entities/wallet.entity';
import { WalletRepository } from '../../../domain/repositories/wallet.repository';
import { logger } from '../../../core/logger/logger.service';
```

### Naming Conventions

| Element             | Convention               | Example                                             |
| ------------------- | ------------------------ | --------------------------------------------------- |
| Files               | kebab-case               | `wallet-creator.service.ts`                         |
| Classes             | PascalCase               | `WalletCreatorService`                              |
| Interfaces          | PascalCase               | `WalletRepository`                                  |
| Functions/Methods   | camelCase                | `createWallet()`                                    |
| Constants           | SCREAMING_SNAKE          | `ALGORITHM`, `KEY_LENGTH`                           |
| Private properties  | camelCase with `private` | `private walletRepo`                                |
| Singleton instances | camelCase export         | `export const aesService = new Aes256GcmService();` |

### Types

- Avoid `any`. Use specific types or `unknown` with type guards
- Use Prisma-generated types for database entities: `Wallet as PrismaWallet`
- Prefer explicit return types for public functions
- Handle `null` vs `undefined`: Prisma returns `null`, entities use `undefined`

```typescript
// Correct: use Prisma type and convert null to undefined
private toEntity(data: PrismaWallet): Wallet {
  return new Wallet(
    data.id,
    data.name,
    data.lastUsed ?? undefined  // Convert null to undefined
  );
}
```

### Error Handling

Use custom error classes from `src/core/errors/`. Never expose stack traces to users.

```typescript
// Define custom errors
export class WalletNotFoundError extends WalletError {
  constructor(walletId: string) {
    super(`Wallet "${walletId}" not found`, 'WALLET_NOT_FOUND', { walletId });
    this.name = 'WalletNotFoundError';
  }
}

// Throw with context
throw new WalletNotFoundError(id);

// Catch and re-throw known errors
try {
  await operation();
} catch (error) {
  if (error instanceof WalletNotFoundError) {
    throw error;
  }
  throw new EncryptionError('Operation failed', 'OPERATION_FAILED');
}
```

### Security

- **Private keys**: Always zero out buffers containing secrets after use
- **Key derivation**: Use Argon2id (`argon2Service.deriveKey()`), never SHA-256 directly
- **Never commit secrets**: No API keys, passwords, or private keys in code
- **Validate all input**: Use Zod schemas or validation functions

```typescript
// Correct: zero out secret key buffer
const secretKey = keypair.secretKey;
try {
  // ... use secretKey ...
} finally {
  secretKey.fill(0);
}
```

### Async/Await

Prefer `async/await` over `.then()/.catch()`:

```typescript
// Good
async function processWallet(id: string): Promise<Wallet> {
  const wallet = await repo.findById(id);
  if (!wallet) throw new WalletNotFoundError(id);
  return wallet;
}

// Bad
function processWallet(id: string): Promise<Wallet> {
  return repo.findById(id).then((wallet) => {
    if (!wallet) throw new WalletNotFoundError(id);
    return wallet;
  });
}
```

## Design Patterns

### Singleton

```typescript
export class ConfigurationService {
  private static instance: ConfigurationService | null = null;

  private constructor(private dataDir?: string) {}

  static getInstance(dataDir?: string): ConfigurationService {
    if (!ConfigurationService.instance || dataDir) {
      ConfigurationService.instance = new ConfigurationService(dataDir);
    }
    return ConfigurationService.instance;
  }

  static resetInstance(): void {
    ConfigurationService.instance = null;
  }
}
```

### Repository Pattern

Interface in `domain/`, implementation in `infrastructure/`:

```typescript
// domain/repositories/wallet.repository.ts
export interface WalletRepository {
  findById(id: string): Promise<Wallet | null>;
  findAll(): Promise<Wallet[]>;
  create(wallet: Wallet): Promise<Wallet>;
  update(wallet: Wallet): Promise<Wallet>;
  delete(id: string): Promise<void>;
}

// infrastructure/repositories/prisma-wallet.repository.ts
export class PrismaWalletRepository implements WalletRepository {
  constructor(private prisma: PrismaClient) {}
  // ... implementations
}
```

### CLI Command Factory

Commands receive factory functions for dependency injection:

```typescript
export function createWalletCommands(
  getPrisma: () => PrismaClient,
  getDataDir: () => string | undefined
): Command {
  const wallet = new Command('wallet');

  wallet.command('list').action(async () => {
    const prisma = getPrisma();
    const repo = new PrismaWalletRepository(prisma);
    const service = new WalletManagerService(repo);
    // ...
  });

  return wallet;
}
```

## Testing

- Unit tests in `tests/unit/`
- Integration tests in `tests/integration/`
- Use Jest with ts-jest preset
- Test file naming: `*.test.ts`

```bash
# Run specific test
npx jest tests/unit/entities/wallet.entity.test.ts

# Run tests matching pattern
npx jest --testNamePattern="should create"
```

## Before Committing

Always run these commands after making changes:

```bash
npm run typecheck && npm run lint && npm run format:check && npm run build
```

Or to auto-fix formatting issues:

```bash
npm run format && npm run lint:fix && npm run typecheck && npm run build
```

## Session Model for Agent Autonomy

The CLI supports a session-based authentication model that allows agents to operate autonomously without the master password.

### Session Overview

- **Session Key**: 64-byte key stored encrypted in `~/.jupiter/session/key`
- **Scope**: Global (one session for all wallets)
- **Expiration**: Never (until manually regenerated)

### Commands by Authorization Level

#### Agent Operations (Session allowed, no password needed)

```bash
jupiter wallet list              # List wallets
jupiter wallet show <id>         # View wallet details
jupiter wallet create            # Create wallet (uses session if available)
jupiter price get SOL USDC       # Get token prices
jupiter trade swap USDC SOL 0.1 -w <id> -y  # Execute swap
jupiter session status           # Check session status
```

#### Protected Operations (Password required, session rejected)

```bash
jupiter wallet export <id>       # Export private key
jupiter wallet delete <id>       # Delete wallet
jupiter transfer <...>           # Transfer funds (future)
jupiter session regenerate       # Regenerate session
```

### Session Management

```bash
# Check session status
jupiter session status

# Regenerate session (requires password)
jupiter session regenerate --password <pwd>

# Clear session
jupiter session clear
```

### Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│  HUMAN (setup)                                                  │
├─────────────────────────────────────────────────────────────────┤
│  $ jupiter init --password <pwd>                                │
│      → Creates session key at ~/.jupiter/session/key            │
│                                                                  │
│  $ jupiter wallet create --name Trading                         │
│      → Wallet encrypted with session key                        │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  AGENT (autonomous)                                             │
├─────────────────────────────────────────────────────────────────┤
│  $ jupiter trade swap USDC SOL 0.1 -w <id> -y                   │
│      → Uses session to sign transaction                         │
│      → No password required                                     │
│                                                                  │
│  $ jupiter wallet export <id>                                   │
│      → Blocked: "This is a protected command"                   │
│      → Password required                                        │
└─────────────────────────────────────────────────────────────────┘
```

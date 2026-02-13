# Jup CLI Architecture

## Overview

This Jupiter CLI follows **Clean Architecture** principles with a clear separation of responsibilities across concentric layers. The goal is to provide a secure interface for interacting with Jupiter APIs, with multi-wallet management and precise PnL tracking.

## Core Security Principle

**Golden Rule: The LLM/Agent must NEVER have access to plaintext private keys**

### Global Session Model

```
┌─────────────────────────────────────────────────────────────────┐
│                    SETUP (human with password)                    │
├─────────────────────────────────────────────────────────────────┤
│  $ jupiter init --password <pwd>                                 │
│      → Creates the database                                      │
│      → Generates a SESSION_KEY stored in ~/.jupiter/session      │
│                                                                  │
│  $ jupiter wallet create --name Trading --password <pwd>         │
│      → Wallet encrypted, accessible via session                  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    AGENT (autonomous, no password)                │
├─────────────────────────────────────────────────────────────────┤
│  Allowed operations with session:                                │
│     - jupiter wallet list                                        │
│     - jupiter wallet show <id>                                   │
│     - jupiter price get SOL USDC                                 │
│     - jupiter trade swap USDC SOL 0.1 -w <id> -y                │
│     - jupiter session status                                     │
│                                                                  │
│  Protected operations (password required):                       │
│     - jupiter wallet export <id>    → Exposes private key        │
│     - jupiter wallet delete <id>    → Irreversible deletion      │
│     - jupiter transfer <...>        → Outbound fund transfer     │
└─────────────────────────────────────────────────────────────────┘
```

### Session Characteristics

| Property   | Value                                         |
| ---------- | --------------------------------------------- |
| Scope      | Global (one session for all wallets)          |
| Expiration | Never (until manual regeneration)             |
| Storage    | `~/.jupiter/session/key` (permissions 600)    |
| Regenerate | `jupiter session regenerate --password <pwd>` |

### Commands by Authorization Level

#### Level 1: Agent-Accessible (Session or Password)

| Command                | Description               |
| ---------------------- | ------------------------- |
| `wallet list`          | List wallets              |
| `wallet show <id>`     | Show details and balances |
| `price get <tokens>`   | Get prices                |
| `price search <query>` | Search for a token        |
| `trade swap <...>`     | Execute a swap            |
| `config show`          | Show configuration        |
| `session status`       | Session status            |

#### Level 2: Protected (Password Required, Session Rejected)

| Command              | Description        | Reason                 |
| -------------------- | ------------------ | ---------------------- |
| `wallet export <id>` | Export private key | Exposes funds          |
| `wallet delete <id>` | Delete a wallet    | Irreversible           |
| `transfer <...>`     | Transfer funds     | Outbound fund movement |
| `session regenerate` | Regenerate session | Security access        |

#### Level 3: Setup (Password Required)

| Command         | Description        |
| --------------- | ------------------ |
| `init`          | Initialize the CLI |
| `wallet create` | Create a wallet    |
| `wallet import` | Import a wallet    |

## Project Structure

```
jup-cli/
├── src/
│   ├── core/                           # Cross-cutting concerns
│   │   ├── config/
│   │   │   ├── configuration.service.ts # YAML configuration management
│   │   │   ├── path-manager.ts          # Path management
│   │   │   └── project-config.service.ts # Project configuration
│   │   ├── errors/
│   │   │   ├── wallet.errors.ts        # Wallet-specific errors
│   │   │   └── api.errors.ts           # Jupiter API errors
│   │   ├── logger/
│   │   │   └── logger.service.ts       # Structured logging service
│   │   ├── crypto/
│   │   │   ├── encryption.service.ts   # AES-256-GCM (IV 12 bytes)
│   │   │   └── key-derivation.service.ts # Argon2id
│   │   └── session/
│   │       └── session.service.ts      # Global session management
│   │
│   ├── domain/                         # Domain layer
│   │   ├── entities/
│   │   │   ├── wallet.entity.ts        # Wallet entity
│   │   │   └── cost-basis.entity.ts    # Cost basis calculation
│   │   └── repositories/
│   │       └── wallet.repository.ts    # Repository interface
│   │
│   ├── application/                    # Application layer
│   │   ├── ports/
│   │   │   ├── jupiter-api.port.ts     # Jupiter API interface
│   │   │   └── blockchain.port.ts      # Blockchain interface
│   │   └── services/
│   │       ├── wallet/
│   │       │   ├── wallet-manager.service.ts
│   │       │   ├── wallet-creator.service.ts
│   │       │   ├── wallet-importer.service.ts
│   │       │   ├── wallet-exporter.service.ts
│   │       │   ├── wallet-sync.service.ts
│   │       │   └── wallet-validation.util.ts
│   │       └── security/
│   │           ├── master-password.service.ts
│   │           └── key-encryption.service.ts
│   │
│   ├── infrastructure/                 # Infrastructure layer
│   │   ├── repositories/
│   │   │   └── prisma-wallet.repository.ts
│   │   ├── jupiter-api/
│   │   │   ├── ultra/ultra-api.service.ts
│   │   │   └── shared/jupiter-client.ts
│   │   └── solana/
│   │       ├── connection.service.ts
│   │       └── solana-rpc.service.ts
│   │
│   └── interface/                      # CLI layer
│       └── cli/commands/
│           ├── init/init.cmd.ts
│           ├── wallet/wallet.cmd.ts
│           ├── price/price.cmd.ts
│           ├── trade/trade.cmd.ts
│           ├── config/config.cmd.ts
│           └── session/session.cmd.ts
│
├── prisma/
│   └── schema.prisma
│
└── tests/
    ├── integration/
    └── unit/
```

## Detailed Security Model

### Initialization Flow

```
jupiter init --password <pwd>
    │
    ├── 1. Create ~/.jupiter/ (data, logs, session)
    ├── 2. Create SQLite database
    ├── 3. Hash the password (Argon2id)
    ├── 4. Generate SESSION_KEY (64 random bytes)
    ├── 5. Encrypt SESSION_KEY with password
    ├── 6. Store in ~/.jupiter/session/key
    └── 7. Configure API key if provided
```

### Protected Command Flow (wallet export)

```
jupiter wallet export <id>
    │
    ├── 1. Check if session exists → ERROR if yes
    │      "This command requires password. Session not allowed."
    │
    ├── 2. Prompt for password (interactive or --password)
    │
    ├── 3. Verify the Argon2id hash
    │
    ├── 4. Decrypt the private key
    │
    └── 5. Display the key (with warning)
```

### Agent-Accessible Command Flow (trade swap)

```
jupiter trade swap USDC SOL 0.1 -w <id> -y
    │
    ├── 1. Load SESSION_KEY from ~/.jupiter/session/key
    │
    ├── 2. Decrypt the wallet private key with SESSION_KEY
    │
    ├── 3. Get the swap order (Jupiter Ultra API)
    │
    ├── 4. Sign the transaction
    │
    ├── 5. Execute via Jupiter Ultra
    │
    └── 6. Zero-out the private key in memory
```

## Data Schema (Prisma)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model MasterPassword {
  id                  Int      @id @default(1)
  hash                String   // Argon2id hash of the master password
  salt                String   // Salt used for hashing
  encryptedSessionKey String   // Session key encrypted with password
  sessionNonce        String   // AES-256-GCM nonce
  sessionSalt         String   // Derivation salt
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
}

model Wallet {
  id           String    @id @default(uuid())
  name         String
  address      String    @unique
  encryptedKey String    // Private key encrypted with session key
  keyNonce     String
  keySalt      String
  keyAuthTag   String    // AES-256-GCM auth tag
  isActive     Boolean   @default(true)
  createdAt    DateTime  @default(now())
  lastUsed     DateTime?

  @@index([address])
}

model CostBasis {
  id             String   @id @default(uuid())
  walletId       String
  mint           String
  symbol         String?
  avgPriceUsd    String
  totalAcquired  String
  totalCostUsd   String
  updatedAt      DateTime  @updatedAt

  wallet Wallet @relation(fields: [walletId], references: [id], onDelete: Cascade)

  @@unique([walletId, mint])
  @@index([walletId])
}
```

## Jupiter APIs Used

### Ultra Swap API (Recommended)

| Endpoint            | Method | Description                  |
| ------------------- | ------ | ---------------------------- |
| `/ultra/v1/order`   | GET    | Get a swap order             |
| `/ultra/v1/execute` | POST   | Execute a signed transaction |
| `/ultra/v1/search`  | GET    | Search for a token           |

### Price API V3

| Endpoint    | Method | Description                    |
| ----------- | ------ | ------------------------------ |
| `/price/v3` | GET    | Get prices for multiple tokens |

## Technologies

| Category   | Technology                     |
| ---------- | ------------------------------ |
| Runtime    | Node.js 20+                    |
| Language   | TypeScript 5.3+                |
| CLI        | Commander.js                   |
| ORM        | Prisma                         |
| Database   | SQLite                         |
| Crypto     | argon2, tweetnacl, Node crypto |
| HTTP       | axios                          |
| Validation | Zod                            |

## CLI Commands

### Session Management

```bash
# View session status
jupiter session status

# Regenerate session (password required)
jupiter session regenerate --password <pwd>

# Clear session
jupiter session clear
```

### Wallets

```bash
# Create (password required)
jupiter wallet create --name "Trading" --password <pwd>

# List (session OK)
jupiter wallet list

# View details (session OK)
jupiter wallet show <id>

# Import (password required)
jupiter wallet import --name "Main" --private-key <key> --password <pwd>

# Export (password REQUIRED, session rejected)
jupiter wallet export <id> --password <pwd>

# Delete (password REQUIRED, session rejected)
jupiter wallet delete <id> --password <pwd>
```

### Trading (session OK)

```bash
# Get prices
jupiter price get SOL USDC

# Swap (dry-run)
jupiter trade swap USDC SOL 0.1 -w <id> --dry-run

# Swap (execute)
jupiter trade swap USDC SOL 0.1 -w <id> -y
```

## Tests

### Required Integration Tests

```typescript
describe('Session Workflow', () => {
  describe('Setup', () => {
    it('should create session on init');
    it('should store session key in file');
  });

  describe('Agent Operations (with session)', () => {
    it('should list wallets without password');
    it('should show wallet without password');
    it('should get prices without password');
    it('should execute swap without password');
  });

  describe('Protected Operations', () => {
    it('should require password for wallet export');
    it('should reject session for wallet export');
    it('should require password for wallet delete');
    it('should reject session for wallet delete');
  });

  describe('Session Management', () => {
    it('should show session status');
    it('should regenerate session with password');
    it('should clear session');
  });

  describe('Password Fallback', () => {
    it('should allow swap with --password');
  });
});
```

## Security - Technical Measures

| Measure            | Implementation                      |
| ------------------ | ----------------------------------- |
| Key encryption     | AES-256-GCM (IV 12 bytes)           |
| Key derivation     | Argon2id                            |
| Session storage    | File with permissions 600           |
| Memory zero-out    | Buffer.fill(0) after use            |
| Protected commands | Session rejected, password required |

## Roadmap

### v1.0 (Current)

- [x] DDD Architecture
- [x] Global session system
- [x] Wallet CRUD commands
- [x] Trade swap via Jupiter Ultra
- [x] Sensitive command protection
- [ ] Complete integration tests
- [ ] API documentation

### v1.1 (Future)

- [ ] Outbound transfers
- [ ] PnL calculation
- [ ] Limit orders
- [ ] Multi-wallet portfolio

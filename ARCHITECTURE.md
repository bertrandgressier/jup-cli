# Architecture Jupiter CLI

## Vue d'ensemble

Cette CLI Jupiter suit les principes de la **Clean Architecture** avec une séparation claire des responsabilités en couches concentriques. L'objectif est de fournir une interface sécurisée pour interagir avec les API Jupiter, avec une gestion multi-wallets et un suivi précis du PnL.

## Principe de Sécurité Fondamental

**Règle d'or : Le LLM/Agent ne doit JAMAIS avoir accès aux clés privées en clair**

### Modèle de Session Globale

```
┌─────────────────────────────────────────────────────────────────┐
│                    SETUP (humain avec mot de passe)              │
├─────────────────────────────────────────────────────────────────┤
│  $ jupiter init --password <pwd>                                 │
│      → Crée la base de données                                   │
│      → Génère une SESSION_KEY stockée dans ~/.jupiter/session    │
│                                                                  │
│  $ jupiter wallet create --name Trading --password <pwd>         │
│      → Wallet chiffré, accessible via session                    │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    AGENT (autonome, sans mot de passe)           │
├─────────────────────────────────────────────────────────────────┤
│  ✅ Opérations AUTORISÉES avec session:                          │
│     - jupiter wallet list                                        │
│     - jupiter wallet show <id>                                   │
│     - jupiter price get SOL USDC                                 │
│     - jupiter trade swap USDC SOL 0.1 -w <id> -y                 │
│     - jupiter session status                                     │
│                                                                  │
│  ❌ Opérations PROTÉGÉES (mot de passe obligatoire):             │
│     - jupiter wallet export <id>    → Expose la clé privée       │
│     - jupiter wallet delete <id>    → Suppression irréversible   │
│     - jupiter transfer <...>        → Transfert de fonds         │
└─────────────────────────────────────────────────────────────────┘
```

### Caractéristiques de la Session

| Propriété    | Valeur                                        |
| ------------ | --------------------------------------------- |
| Portée       | Globale (une session pour tous les wallets)   |
| Expiration   | Jamais (jusqu'à régénération manuelle)        |
| Stockage     | `~/.jupiter/session/key` (permissions 600)    |
| Régénération | `jupiter session regenerate --password <pwd>` |

### Commandes par Niveau d'Autorisation

#### Niveau 1: Accessible à l'Agent (Session ou Password)

| Commande               | Description                |
| ---------------------- | -------------------------- |
| `wallet list`          | Lister les wallets         |
| `wallet show <id>`     | Afficher détails et soldes |
| `price get <tokens>`   | Obtenir les prix           |
| `price search <query>` | Rechercher un token        |
| `trade swap <...>`     | Effectuer un swap          |
| `config show`          | Afficher la configuration  |
| `session status`       | État de la session         |

#### Niveau 2: Protégé (Password Obligatoire, Session Rejetée)

| Commande             | Description            | Raison                     |
| -------------------- | ---------------------- | -------------------------- |
| `wallet export <id>` | Exporter la clé privée | Expose les fonds           |
| `wallet delete <id>` | Supprimer un wallet    | Irréversible               |
| `transfer <...>`     | Transférer des fonds   | Mouvement de fonds sortant |
| `session regenerate` | Régénérer la session   | Accès sécuritaire          |

#### Niveau 3: Setup (Password Obligatoire)

| Commande        | Description        |
| --------------- | ------------------ |
| `init`          | Initialiser la CLI |
| `wallet create` | Créer un wallet    |
| `wallet import` | Importer un wallet |

## Structure du Projet

```
jupiter-cli/
├── src/
│   ├── core/                           # Couche transverse
│   │   ├── config/
│   │   │   ├── configuration.service.ts # Gestion de la configuration YAML
│   │   │   ├── path.manager.ts          # Gestion des chemins
│   │   │   └── project-config.service.ts # Configuration projet
│   │   ├── errors/
│   │   │   ├── wallet.errors.ts        # Erreurs spécifiques wallets
│   │   │   ├── transaction.errors.ts   # Erreurs spécifiques transactions
│   │   │   └── api.errors.ts           # Erreurs API Jupiter
│   │   ├── logger/
│   │   │   └── logger.service.ts       # Service de logging structuré
│   │   ├── crypto/
│   │   │   ├── encryption.service.ts   # AES-256-GCM (IV 12 bytes)
│   │   │   └── key-derivation.service.ts # Argon2id
│   │   └── session/
│   │       └── session.service.ts      # Gestion session globale
│   │
│   ├── domain/                         # Couche domaine
│   │   ├── entities/
│   │   │   ├── wallet.entity.ts        # Entité wallet
│   │   │   └── cost-basis.entity.ts    # Calcul coût de base
│   │   └── repositories/
│   │       └── wallet.repository.ts    # Interface repository
│   │
│   ├── application/                    # Couche application
│   │   ├── ports/
│   │   │   ├── jupiter-api.port.ts     # Interface API Jupiter
│   │   │   └── blockchain.port.ts      # Interface blockchain
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
│   ├── infrastructure/                 # Couche infrastructure
│   │   ├── repositories/
│   │   │   └── prisma-wallet.repository.ts
│   │   ├── jupiter-api/
│   │   │   ├── ultra/ultra-api.service.ts
│   │   │   └── shared/jupiter-client.ts
│   │   └── solana/
│   │       ├── connection.service.ts
│   │       └── solana-rpc.service.ts
│   │
│   └── interface/                      # Couche CLI
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

## Modèle de Sécurité Détaillé

### Flux d'Initialisation

```
jupiter init --password <pwd>
    │
    ├── 1. Créer ~/.jupiter/ (data, logs, session)
    ├── 2. Créer base SQLite
    ├── 3. Hasher le mot de passe (Argon2id)
    ├── 4. Générer SESSION_KEY (64 bytes aléatoires)
    ├── 5. Chiffrer SESSION_KEY avec mot de passe
    ├── 6. Stocker dans ~/.jupiter/session/key
    └── 7. Configurer API key si fournie
```

### Flux de Commande Protégée (wallet export)

```
jupiter wallet export <id>
    │
    ├── 1. Vérifier si session existe → ERREUR si oui
    │      "This command requires password. Session not allowed."
    │
    ├── 2. Demander mot de passe (interactif ou --password)
    │
    ├── 3. Vérifier le hash Argon2id
    │
    ├── 4. Déchiffrer la clé privée
    │
    └── 5. Afficher la clé (avec avertissement)
```

### Flux de Commande Accessible (trade swap)

```
jupiter trade swap USDC SOL 0.1 -w <id> -y
    │
    ├── 1. Charger SESSION_KEY depuis ~/.jupiter/session/key
    │
    ├── 2. Déchiffrer la clé privée du wallet avec SESSION_KEY
    │
    ├── 3. Obtenir l'ordre de swap (Jupiter Ultra API)
    │
    ├── 4. Signer la transaction
    │
    ├── 5. Exécuter via Jupiter Ultra
    │
    └── 6. Zero-out de la clé privée en mémoire
```

## Schéma de Données (Prisma)

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
  hash                String   // Hash Argon2id du mot de passe
  salt                String   // Salt pour le hash
  encryptedSessionKey String   // Session key chiffrée avec mot de passe
  sessionNonce        String   // Nonce AES-256-GCM
  sessionSalt         String   // Salt pour dérivation
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
}

model Wallet {
  id           String    @id @default(uuid())
  name         String
  address      String    @unique
  encryptedKey String    // Clé privée chiffrée avec session key
  keyNonce     String
  keySalt      String
  keyAuthTag   String    // Auth tag AES-256-GCM
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

## API Jupiter Utilisées

### Ultra Swap API (Recommandée)

| Endpoint            | Méthode | Description                     |
| ------------------- | ------- | ------------------------------- |
| `/ultra/v1/order`   | GET     | Obtenir un ordre de swap        |
| `/ultra/v1/execute` | POST    | Exécuter une transaction signée |
| `/ultra/v1/search`  | GET     | Rechercher un token             |

### Price API V3

| Endpoint    | Méthode | Description              |
| ----------- | ------- | ------------------------ |
| `/price/v3` | GET     | Prix de plusieurs tokens |

## Technologies

| Catégorie  | Technologie                    |
| ---------- | ------------------------------ |
| Runtime    | Node.js 18+                    |
| Langage    | TypeScript 5.3+                |
| CLI        | Commander.js                   |
| ORM        | Prisma                         |
| Database   | SQLite                         |
| Crypto     | argon2, tweetnacl, Node crypto |
| HTTP       | axios                          |
| Validation | Zod                            |

## Commandes CLI

### Gestion des Sessions

```bash
# Voir l'état de la session
jupiter session status

# Régénérer la session (password requis)
jupiter session regenerate --password <pwd>

# Supprimer la session
jupiter session clear
```

### Wallets

```bash
# Créer (password requis)
jupiter wallet create --name "Trading" --password <pwd>

# Lister (session OK)
jupiter wallet list

# Voir détails (session OK)
jupiter wallet show <id>

# Importer (password requis)
jupiter wallet import --name "Main" --private-key <key> --password <pwd>

# Exporter (password OBLIGATOIRE, session rejetée)
jupiter wallet export <id> --password <pwd>

# Supprimer (password OBLIGIGATOIRE, session rejetée)
jupiter wallet delete <id> --password <pwd>
```

### Trading (session OK)

```bash
# Obtenir prix
jupiter price get SOL USDC

# Swap (dry-run)
jupiter trade swap USDC SOL 0.1 -w <id> --dry-run

# Swap (exécuter)
jupiter trade swap USDC SOL 0.1 -w <id> -y
```

## Tests

### Tests d'Intégration Requis

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

## Sécurité - Mesures Techniques

| Mesure              | Implémentation                        |
| ------------------- | ------------------------------------- |
| Chiffrement clés    | AES-256-GCM (IV 12 bytes)             |
| Dérivation          | Argon2id                              |
| Session storage     | Fichier permissions 600               |
| Zero-out mémoire    | Buffer.fill(0) après usage            |
| Commandes protégées | Session rejetée, password obligatoire |

## Roadmap

### v1.0 (Actuel)

- [x] Architecture DDD
- [x] Système de session globale
- [x] Commandes wallet CRUD
- [x] Trade swap via Jupiter Ultra
- [x] Protection des commandes sensibles
- [ ] Tests d'intégration complets
- [ ] Documentation API

### v1.1 (Futur)

- [ ] Transfers outbound
- [ ] Calcul PnL
- [ ] Ordres limit
- [ ] Multi-wallet portfolio

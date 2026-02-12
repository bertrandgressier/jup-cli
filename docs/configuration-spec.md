# Spécification : Gestion de la Configuration et des Chemins de Données

## Vue d'ensemble

Cette spécification définit le système de gestion de la configuration et des chemins de données pour Jup CLI, permettant une flexibilité maximale pour les différents environnements (développement, test, production).

## Objectifs

1. **Configuration centralisée** via fichier YAML
2. **Chemins de données configurables** (base SQLite, logs, etc.)
3. **Répertoire par défaut** : `~/.solana/jup-cli/`
4. **Override via ligne de commande** pour les tests et déploiements
5. **Isolation des environnements** (dev, test, prod)

## Structure de la Configuration

### Répertoire par défaut

```
~/.solana/jup-cli/
├── config.yaml          # Configuration principale
├── data/
│   ├── jupiter.db       # Base de données SQLite
│   └── jupiter.db-journal
├── logs/
│   └── jup-cli.log  # Fichiers de log
└── cache/
    └── price-cache.json # Cache des prix
```

### Fichier config.yaml

```yaml
# ~/.solana/jup-cli/config.yaml

# === Chemins de données ===
paths:
  data: ~/.solana/jup-cli/data
  logs: ~/.solana/jup-cli/logs
  cache: ~/.solana/jup-cli/cache

# === Base de données ===
database:
  provider: sqlite
  url: file:${paths.data}/jupiter.db

# === Jupiter API ===
jupiter:
  baseUrl: https://api.jup.ag
  apiKey: '' # Optionnel
  timeoutMs: 30000
  maxRetries: 3

# === Solana ===
solana:
  rpcUrl: https://api.mainnet-beta.solana.com
  commitment: confirmed

# === Logging ===
logging:
  level: info # debug, info, warn, error
  console: true
  file: true
  maxFiles: 30 # Rotation après 30 jours

# === Trading ===
trading:
  defaultSlippageBps: 100
  maxSlippageBps: 500

# === Security ===
security:
  sessionKeyBytes: 64
  keyDerivationIterations: 3
```

## Interface CLI

### Option globale `--data-dir`

Toutes les commandes acceptent l'option `--data-dir` pour spécifier un répertoire alternatif :

```bash
# Utilisation par défaut (~/.solana/jup-cli/)
jupiter init

# Utilisation d'un répertoire personnalisé
jupiter --data-dir ./test-data init
jupiter --data-dir /tmp/jupiter-test wallet list
jupiter --data-dir ./my-config trade swap --wallet <id> SOL USDC 1

# Pour les tests d'intégration
jupiter --data-dir ./test/fixtures/data init
jupiter --data-dir ./test/fixtures/data wallet create --name "Test"
```

### Variables d'environnement

Les variables d'environnement peuvent override la configuration :

```bash
export JUPITER_DATA_DIR=/custom/path
export JUPITER_LOG_LEVEL=debug
export JUPITER_DATABASE_URL=file:/custom/path/db.sqlite
```

## Implémentation Technique

### 1. Configuration Service

```typescript
export class ConfigurationService {
  private config: Configuration;
  private dataDir: string;

  constructor(dataDir?: string) {
    this.dataDir = dataDir || this.getDefaultDataDir();
    this.config = this.loadConfiguration();
  }

  private getDefaultDataDir(): string {
    const home = process.env.HOME || process.env.USERPROFILE;
    return path.join(home!, '.solana', 'jup-cli');
  }

  private loadConfiguration(): Configuration {
    const configPath = path.join(this.dataDir, 'config.yaml');

    if (fs.existsSync(configPath)) {
      const content = fs.readFileSync(configPath, 'utf-8');
      return yaml.parse(content);
    }

    return this.getDefaultConfiguration();
  }

  getDatabaseUrl(): string {
    return this.config.database.url.replace('${paths.data}', this.config.paths.data);
  }
}
```

### 2. Initialisation du Répertoire

Lors du `jupiter init` :

1. Créer le répertoire `--data-dir` s'il n'existe pas
2. Créer la structure : `data/`, `logs/`, `cache/`
3. Générer `config.yaml` avec les valeurs par défaut
4. Initialiser la base de données SQLite
5. Créer le master password et la session key

### 3. Gestion des Chemins

```typescript
export class PathManager {
  private dataDir: string;

  constructor(dataDir: string) {
    this.dataDir = path.resolve(dataDir);
  }

  getConfigPath(): string {
    return path.join(this.dataDir, 'config.yaml');
  }

  getDatabasePath(): string {
    return path.join(this.dataDir, 'data', 'jupiter.db');
  }

  getLogPath(): string {
    return path.join(this.dataDir, 'logs', 'jup-cli.log');
  }

  getCachePath(): string {
    return path.join(this.dataDir, 'cache');
  }

  ensureDirectories(): void {
    fs.mkdirSync(path.join(this.dataDir, 'data'), { recursive: true });
    fs.mkdirSync(path.join(this.dataDir, 'logs'), { recursive: true });
    fs.mkdirSync(path.join(this.dataDir, 'cache'), { recursive: true });
  }
}
```

### 4. Intégration avec Prisma

Le client Prisma doit être initialisé dynamiquement avec le bon chemin :

```typescript
export function createPrismaClient(databaseUrl: string): PrismaClient {
  return new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
  });
}
```

## Tests d'Intégration

### Exemple d'utilisation pour les tests

```typescript
// test/integration/setup.ts
import { ConfigurationService } from '../../src/core/config/configuration.service';
import { PathManager } from '../../src/core/config/path.manager';

describe('Integration Tests', () => {
  const testDataDir = './test/fixtures/integration-data';
  let config: ConfigurationService;
  let paths: PathManager;

  beforeAll(async () => {
    // Setup test environment
    paths = new PathManager(testDataDir);
    paths.ensureDirectories();

    config = new ConfigurationService(testDataDir);

    // Initialize test database
    const initService = new InitService(config);
    await initService.initialize('test-password');
  });

  afterAll(async () => {
    // Cleanup
    await fs.rm(testDataDir, { recursive: true, force: true });
  });

  it('should create wallet in test environment', async () => {
    // Test with isolated data
  });
});
```

### Commande pour les tests

```bash
# Script npm pour les tests
npm run test:integration

# Qui exécute :
JUPITER_DATA_DIR=./test/fixtures/data jest --config jest.integration.config.js
```

## Migration depuis l'ancien système

### Changements requis

1. **Supprimer** `.env` du projet (remplacé par `config.yaml`)
2. **Mettre à jour** `env.schema.ts` pour supporter les deux systèmes
3. **Modifier** le point d'entrée CLI pour parser `--data-dir`
4. **Adapter** tous les services pour utiliser `ConfigurationService`

### Compatibilité

```typescript
// Support des anciennes variables d'environnement
export class ConfigurationService {
  loadConfiguration(): Configuration {
    // 1. Charger depuis config.yaml
    const config = this.loadFromYaml();

    // 2. Override avec variables d'environnement (compatibilité)
    if (process.env.DATABASE_URL) {
      config.database.url = process.env.DATABASE_URL;
    }

    return config;
  }
}
```

## Commandes Modifiées

### Init

```bash
# Standard
jupiter init

# Personnalisé
jupiter --data-dir ./my-data init

# Avec configuration initiale
jupiter --data-dir ./my-data init --config-template production
```

### Toutes les commandes

```bash
# Chaque commande hérite de --data-dir
jupiter --data-dir ./test-data wallet list
jupiter --data-dir ./test-data trade swap ...
jupiter --data-dir ./test-data pnl show ...
```

## Avantages

1. **Tests isolés** : Chaque test peut avoir son propre répertoire de données
2. **Multi-environnement** : Dev, staging, prod avec des configs différentes
3. **Portabilité** : Déplacer toute la configuration en copiant un dossier
4. **Backup facile** : Sauvegarder `~/.solana/jup-cli/` entièrement
5. **CI/CD friendly** : Spécifier des chemins temporaires pour les tests

## Sécurité

- Les permissions du répertoire `~/.solana/jup-cli/` doivent être `700` (rwx------)
- Le fichier `config.yaml` ne doit jamais contenir de clés privées
- Les clés chiffrées restent dans la base SQLite
- Logs sans données sensibles (pas de clés, pas de passwords)

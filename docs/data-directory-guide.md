# Guide d'Utilisation : Gestion des Données et Configuration

## Vue d'ensemble

Jup CLI supporte maintenant une gestion flexible des données via :

- **Répertoire par défaut** : `~/.solana/jup-cli/`
- **Configuration YAML** : `config.yaml`
- **Override ligne de commande** : `--data-dir`
- **Variables d'environnement** : `JUPITER_DATA_DIR`

## Structure du Répertoire de Données

```
~/.solana/jup-cli/           # ou votre répertoire personnalisé
├── config.yaml                  # Configuration principale
├── data/
│   └── jupiter.db              # Base de données SQLite
├── logs/
│   └── jup-cli.log         # Fichiers de log
└── cache/
    └── price-cache.json        # Cache des prix (futur)
```

## Utilisation Basique

### 1. Initialisation Standard

```bash
# Utilise le répertoire par défaut ~/.solana/jup-cli/
jupiter init
```

### 2. Initialisation avec Chemin Personnalisé

```bash
# Crée la structure dans un répertoire spécifique
jupiter --data-dir ./mon-projet init
jupiter --data-dir /path/to/custom/dir init
```

### 3. Utilisation avec Chemin Personnalisé

```bash
# Toutes les commandes doivent utiliser le même --data-dir
jupiter --data-dir ./mon-projet wallet list
jupiter --data-dir ./mon-projet wallet create --name "Trading"
jupiter --data-dir ./mon-projet price get SOL USDC
```

## Configuration YAML

Le fichier `config.yaml` est généré automatiquement lors de l'initialisation :

```yaml
paths:
  data: ~/.solana/jup-cli/data
  logs: ~/.solana/jup-cli/logs
  cache: ~/.solana/jup-cli/cache

database:
  provider: sqlite
  url: file:~/.solana/jup-cli/data/jupiter.db

jupiter:
  baseUrl: https://api.jup.ag
  apiKey: ''
  timeoutMs: 30000
  maxRetries: 3

solana:
  rpcUrl: https://api.mainnet-beta.solana.com
  commitment: confirmed

logging:
  level: info
  console: true
  file: true
  maxFiles: 30

trading:
  defaultSlippageBps: 100
  maxSlippageBps: 500

security:
  sessionKeyBytes: 64
```

### Modifier la Configuration

```bash
# Éditer le fichier config.yaml
nano ~/.solana/jup-cli/config.yaml

# Ou utiliser une variable d'environnement temporairement
JUPITER_LOG_LEVEL=debug jupiter wallet list
```

## Tests d'Intégration

### Créer un Environnement de Test Isolé

```bash
# 1. Créer un répertoire de test
mkdir -p ./test-data

# 2. Initialiser l'environnement de test
jupiter --data-dir ./test-data init
# Entrer un mot de passe de test

# 3. Créer des wallets de test
jupiter --data-dir ./test-data wallet create --name "Test Wallet 1"
jupiter --data-dir ./test-data wallet create --name "Test Wallet 2"

# 4. Exécuter vos tests
jupiter --data-dir ./test-data wallet list
jupiter --data-dir ./test-data price get SOL USDC

# 5. Nettoyer après les tests
rm -rf ./test-data
```

### Script de Test Automatisé

```bash
#!/bin/bash
set -e

TEST_DIR="./test/fixtures/integration-test"

# Cleanup
rm -rf $TEST_DIR

# Initialize test environment
echo "test-password" | jupiter --data-dir $TEST_DIR init

# Create test wallet
jupiter --data-dir $TEST_DIR wallet create --name "Test Wallet"

# Get wallet ID
WALLET_ID=$(jupiter --data-dir $TEST_DIR wallet list | grep "Test Wallet" | awk '{print $1}')

# Test price command
jupiter --data-dir $TEST_DIR price get SOL USDC

# Cleanup
rm -rf $TEST_DIR

echo "✅ Tests passed!"
```

## Variables d'Environnement

Priorité (de la plus haute à la plus basse) :

1. Ligne de commande (`--data-dir`)
2. Variables d'environnement
3. Fichier `config.yaml`
4. Valeurs par défaut

```bash
# Override complet du répertoire de données
export JUPITER_DATA_DIR=/custom/path
jupiter init

# Override uniquement de la base de données
export JUPITER_DATABASE_URL=file:/custom/path/db.sqlite
jupiter wallet list

# Override du niveau de log
export JUPITER_LOG_LEVEL=debug
jupiter trade swap ...
```

## Cas d'Usage

### 1. Développement Local

```bash
# Utiliser le répertoire par défaut pour le développement
jupiter init
jupiter wallet create --name "Dev Wallet"
```

### 2. Tests Automatisés (CI/CD)

```bash
# Dans votre pipeline CI/CD
TEST_DIR="/tmp/jupiter-test-$(date +%s)"
jupiter --data-dir $TEST_DIR init <<EOF
test-password
test-password
EOF

# Run tests
jupiter --data-dir $TEST_DIR wallet create --name "CI Wallet"
# ... autres tests ...

# Cleanup
rm -rf $TEST_DIR
```

### 3. Multi-Environnement

```bash
# Production
jupiter --data-dir ~/.solana/jup-cli-prod init

# Staging
jupiter --data-dir ~/.solana/jup-cli-staging init

# Development
jupiter --data-dir ~/.solana/jup-cli-dev init
```

### 4. Backup et Restauration

```bash
# Backup
BACKUP_DIR="jupiter-backup-$(date +%Y%m%d)"
cp -r ~/.solana/jup-cli ./$BACKUP_DIR
tar -czf $BACKUP_DIR.tar.gz $BACKUP_DIR
rm -rf $BACKUP_DIR

# Restauration
tar -xzf jupiter-backup-20240209.tar.gz
cp -r jupiter-backup-20240209 ~/.solana/jup-cli
```

### 5. Partage de Configuration

```bash
# Copier la configuration vers une nouvelle machine
scp -r ~/.solana/jup-cli user@new-machine:~/.solana/

# Sur la nouvelle machine
jupiter wallet list  # Devrait fonctionner immédiatement
```

## Dépannage

### Problème : Permission denied

```bash
# Vérifier les permissions
ls -la ~/.solana/

# Corriger si nécessaire
chmod 700 ~/.solana/jup-cli
```

### Problème : Base de données verrouillée

```bash
# Si la DB est verrouillée (après un crash)
rm ~/.solana/jup-cli/data/jupiter.db-journal
```

### Problème : Configuration corrompue

```bash
# Supprimer et réinitialiser
rm -rf ~/.solana/jup-cli
jupiter init
```

## Bonnes Pratiques

1. **Ne jamais committer** le répertoire de données

   ```gitignore
   # .gitignore
   /test-data/
   /test/fixtures/data/
   ~/.solana/
   ```

2. **Utiliser des chemins absolus** dans les scripts

   ```bash
   DATA_DIR="$(pwd)/test-data"
   jupiter --data-dir $DATA_DIR init
   ```

3. **Nettoyer après les tests**

   ```bash
   trap 'rm -rf $TEST_DIR' EXIT
   ```

4. **Sauvegarder régulièrement**
   ```bash
   # Cron job pour backup quotidien
   0 2 * * * tar -czf ~/backups/jupiter-$(date +\%Y\%m\%d).tar.gz ~/.solana/jup-cli
   ```

## Migration depuis l'Ancien Système

Si vous utilisiez l'ancien système (avant cette mise à jour) :

```bash
# 1. Sauvegarder vos données actuelles
cp -r data data-backup

# 2. Réinitialiser avec le nouveau système
jupiter init

# 3. Copier l'ancienne base de données
cp data-backup/jupiter.db ~/.solana/jup-cli/data/

# 4. Vérifier que tout fonctionne
jupiter wallet list
```

## API pour Développeurs

### Utiliser dans vos scripts

```typescript
import { ConfigurationService, PathManager } from 'jup-cli/src/core/config';

// Créer une configuration personnalisée
const dataDir = './my-test-data';
const pathManager = new PathManager(dataDir);
pathManager.ensureDirectories();

// Accéder à la configuration
const configService = new ConfigurationService(dataDir);
const dbUrl = configService.getDatabaseUrl();

// Créer un client Prisma
const prisma = new PrismaClient({
  datasources: { db: { url: dbUrl } },
});
```

---

**Note** : Le répertoire par défaut `~/.solana/jup-cli/` est créé avec des permissions restrictives (700) pour protéger vos données sensibles.

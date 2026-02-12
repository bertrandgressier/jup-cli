# Mise à Jour : Suppression des Variables d'Environnement

## ✅ Changements Effectués

Toutes les variables d'environnement ont été supprimées. La configuration est maintenant **exclusivement** gérée via le fichier YAML.

## 🗑️ Suppressions

### Variables d'environnement supprimées :

- ❌ `JUPITER_DATA_DIR` - Utiliser `--data-dir` à la place
- ❌ `JUPITER_LOG_LEVEL` - Utiliser `jupiter config set-log-level`
- ❌ `JUPITER_DATABASE_URL` - Géré automatiquement
- ❌ `DATABASE_URL` - Géré automatiquement
- ❌ `LOG_LEVEL` - Géré automatiquement

### Fichiers supprimés :

- ❌ `.env.example` - Plus nécessaire

## 📝 Nouveau Système

### Configuration via YAML

Toute la configuration est dans `~/.solana/jupiter-cli/config.yaml` :

```yaml
paths:
  data: ~/.solana/jupiter-cli/data
  logs: ~/.solana/jupiter-cli/logs
  cache: ~/.solana/jupiter-cli/cache

database:
  provider: sqlite
  url: file:~/.solana/jupiter-cli/data/jupiter.db

jupiter:
  baseUrl: https://api.jup.ag
  apiKey: 'votre-api-key' # 👈 Stocké ici
  timeoutMs: 30000
  maxRetries: 3

solana:
  rpcUrl: https://api.mainnet-beta.solana.com
  commitment: confirmed

logging:
  level: info # 👈 Configurable via CLI
  console: true
  file: true
```

### Commandes de Configuration

```bash
# Afficher la configuration
jupiter config show

# Définir l'API key
jupiter config set-jupiter-key --key "votre-api-key"

# Définir le niveau de log
jupiter config set-log-level debug

# Définir un RPC personnalisé
jupiter config set-rpc https://votre-rpc.com

# Supprimer l'API key
jupiter config remove-jupiter-key
```

### Chemin de Données Personnalisé

Pour utiliser un répertoire différent :

```bash
# Initialisation
jupiter --data-dir ./mon-projet init --password monpassword

# Toutes les commandes utilisent le même --data-dir
jupiter --data-dir ./mon-projet wallet create --name "Test"
jupiter --data-dir ./mon-projet config set-jupiter-key --key "API_KEY"
```

## 🧪 Tests Mis à Jour

Les tests ont été mis à jour pour ne plus utiliser de variables d'environnement :

```typescript
// Avant (avec env vars)
process.env.JUPITER_DATA_DIR = '/tmp/test';
const config = new ConfigurationService();

// Après (sans env vars)
const config = new ConfigurationService('/tmp/test');
```

## 📁 Fichiers Modifiés

1. **src/core/config/path.manager.ts**
   - Suppression de `process.env.HOME` et `process.env.USERPROFILE`
   - Utilisation de `os.homedir()` uniquement

2. **src/core/config/configuration.service.ts**
   - Suppression de `process.env.JUPITER_DATA_DIR`
   - Suppression de `process.env.JUPITER_DATABASE_URL`
   - Suppression de `process.env.JUPITER_LOG_LEVEL`

3. **src/core/config/env.schema.ts**
   - Simplifié - ne garde que `NODE_ENV` pour compatibilité

4. **src/index.ts**
   - Suppression de la section "Environment Variables" du help
   - Ajout d'une section "Configuration" avec instructions YAML

5. **tests/integration/config/data-directory.test.ts**
   - Suppression des tests de variables d'environnement
   - Ajout de tests pour la persistance de l'API key

6. **tests/integration/test-example.sh**
   - Mise à jour pour utiliser `--data-dir` au lieu de variables d'env

7. **README.md**
   - Suppression de la section "Environment Variables"
   - Ajout d'une section "Configuration Management"

## ✅ Vérifications

```bash
# Build sans erreurs
npm run build

# Initialisation fonctionne
jupiter init --password testpassword123 --jupiter-key "test-api-key"

# Configuration affichée
jupiter config show

# Wallet créé
jupiter wallet create --name "Test"

# Pas de dépendance aux variables d'environnement
env -i ./dist/index.js --help  # Fonctionne !
```

## 🎉 Résumé

- ✅ Plus de variables d'environnement nécessaires
- ✅ Toute la configuration dans le YAML
- ✅ API key stockée en toute sécurité dans le YAML
- ✅ Tests mis à jour
- ✅ Documentation à jour
- ✅ Build passe
- ✅ Toutes les commandes fonctionnent

**Le système est maintenant 100% basé sur le fichier YAML de configuration !** 🚀

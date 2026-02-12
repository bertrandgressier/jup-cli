# Conventional Commits

This project follows the [Conventional Commits](https://www.conventionalcommits.org/) specification to automate versioning and changelog generation with [semantic-release](https://semantic-release.gitbook.io/).

## Commit Message Format

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

## Types

| Type | Description | Version Bump |
|------|-------------|--------------|
| **feat** | A new feature | MINOR |
| **fix** | A bug fix | PATCH |
| **docs** | Documentation only changes | PATCH |
| **style** | Changes that don't affect code meaning (formatting, etc) | PATCH |
| **refactor** | Code change that neither fixes a bug nor adds a feature | PATCH |
| **perf** | Performance improvement | PATCH |
| **test** | Adding or correcting tests | PATCH |
| **chore** | Changes to build process or auxiliary tools | PATCH |
| **BREAKING CHANGE** | Incompatible API changes | MAJOR |

## Examples

### Minor Release (new feature)
```
feat(wallet): add ability to export wallet as QR code

Add new command `wallet export-qr` that generates a QR code
containing the wallet address for easy sharing.
```

### Patch Release (bug fix)
```
fix(session): correct session expiration handling

Session was incorrectly expiring after 1 hour instead of never.
Now properly persists until manual regeneration.
```

### Major Release (breaking change)
```
feat(api)!: migrate to Jupiter Ultra API v2

BREAKING CHANGE: The Ultra API v2 requires new authentication.
Users must update their API keys in configuration.
```

### Multiple changes
```
feat(trade): add slippage protection

- Add configurable max slippage (default 1%)
- Add slippage warnings in UI
- Reject transactions with high slippage

Closes #123
```

## Scopes

Common scopes for this project:

- **wallet** - Wallet management commands
- **trade** - Trading and swap functionality
- **session** - Session management
- **config** - Configuration management
- **price** - Price fetching commands
- **security** - Encryption and security features
- **api** - Jupiter API integration
- **cli** - CLI interface and commands
- **core** - Core utilities and services
- **deps** - Dependency updates

## Tools

### Commitizen (optional)

Install commitizen for interactive commit messages:

```bash
npm install -g commitizen
# Then use:
git cz
```

### Commit Linting

Husky automatically lints commit messages using conventional commits format.

## Semantic Release Process

When you push to `main`:

1. **Analyze commits** - Determine version bump from commit types
2. **Generate changelog** - Update CHANGELOG.md with new changes
3. **Bump version** - Update package.json version
4. **Create GitHub Release** - Tag and release on GitHub
5. **Publish to npm** - Deploy new version to npm registry

## Manual Release (if needed)

```bash
# Dry run to see what would be released
npm run semantic-release:dry-run

# Actual release (runs in CI, don't run locally)
npm run semantic-release
```

## References

- [Conventional Commits Specification](https://www.conventionalcommits.org/)
- [Semantic Release Documentation](https://semantic-release.gitbook.io/)
- [Angular Commit Guidelines](https://github.com/angular/angular/blob/main/CONTRIBUTING.md#commit)

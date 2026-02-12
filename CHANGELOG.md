# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Initial release of Jupiter CLI
- Session-based security model for agent-autonomous operations
- Multi-wallet management with AES-256-GCM encryption
- Jupiter Ultra API integration for optimal swap execution
- Real-time portfolio tracking via Solana RPC
- File-based logging with pino and daily rotation
- Complete command set: init, wallet, price, trade, config, session
- Protected command system (export/delete require password)
- Session status and management commands
- Configuration management with YAML support
- TypeScript implementation with strict typing
- Clean Architecture with Domain-Driven Design
- Comprehensive test suite (unit and integration)
- CI/CD pipeline with GitHub Actions

### Security

- Argon2id for password hashing
- AES-256-GCM for private key encryption
- Session key persistence with file permissions 600
- Zero-out sensitive data from memory after use
- Protected commands reject session authentication

## [1.0.0] - 2024-02-XX

### Added

- First stable release
- Complete wallet lifecycle management
- Trading via Jupiter Ultra API
- Session-based authentication system
- Enterprise-grade security

[Unreleased]: https://github.com/bertrandgressier/jupiter-cli/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/bertrandgressier/jupiter-cli/releases/tag/v1.0.0

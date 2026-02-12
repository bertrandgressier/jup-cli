# Contributing to Jup CLI

First off, thank you for considering contributing to Jup CLI! It's people like you that make Jup CLI such a great tool.

## Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the existing issues to see if the problem has already been reported. When you are creating a bug report, please include as many details as possible:

- **Use a clear and descriptive title**
- **Describe the exact steps to reproduce the problem**
- **Provide specific examples to demonstrate the steps**
- **Describe the behavior you observed and what behavior you expected**
- **Include code samples and screenshots if applicable**

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, please include:

- **Use a clear and descriptive title**
- **Provide a step-by-step description of the suggested enhancement**
- **Provide specific examples to demonstrate the enhancement**
- **Explain why this enhancement would be useful**

### Pull Requests

1. Fork the repository
2. Create a new branch from `main` (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run the tests (`npm test`)
5. Run linting (`npm run lint`)
6. Commit your changes (`git commit -m 'Add amazing feature'`)
7. Push to the branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

## Development Setup

### Prerequisites

- Node.js 18+
- npm or yarn
- Git

### Setup Steps

```bash
# Clone your fork
git clone https://github.com/your-username/jup-cli.git
cd jup-cli

# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test
```

## Style Guidelines

### TypeScript Style Guide

- Use TypeScript strict mode
- Follow the existing code style
- Use meaningful variable names
- Add JSDoc comments for public APIs
- Use async/await instead of promises when possible

### Git Commit Messages

- Use the present tense ("Add feature" not "Added feature")
- Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
- Limit the first line to 72 characters or less
- Reference issues and pull requests liberally after the first line

Example:

```
Add session management for autonomous agents

- Implement session key generation and storage
- Add command categorization (agent vs protected)
- Update documentation

Fixes #123
```

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run specific test file
npx jest tests/unit/wallet.service.test.ts

# Run with coverage
npm run test:coverage
```

### Writing Tests

- Write tests for all new features
- Ensure all tests pass before submitting PR
- Aim for high code coverage
- Use descriptive test names

Example test structure:

```typescript
describe('WalletService', () => {
  describe('createWallet', () => {
    it('should create a new wallet with valid parameters', async () => {
      // Test implementation
    });

    it('should throw error for invalid name', async () => {
      // Test implementation
    });
  });
});
```

## Security

### Security Best Practices

- Never commit private keys or passwords
- Use environment variables for sensitive data
- Follow the existing encryption patterns
- Zero out sensitive data from memory after use

### Reporting Security Vulnerabilities

Please do not open public issues for security vulnerabilities. Instead, please email security@yourproject.com with details.

## Documentation

### Code Documentation

- Document all public functions with JSDoc
- Include parameter types and return types
- Provide usage examples for complex functions

Example:

```typescript
/**
 * Creates a new wallet with the specified name
 * @param name - The display name for the wallet
 * @returns Promise resolving to the created wallet
 * @throws {WalletError} If name is invalid or wallet creation fails
 * @example
 * const wallet = await createWallet('My Trading Wallet');
 */
async function createWallet(name: string): Promise<Wallet> {
  // Implementation
}
```

### README Updates

Update the README.md if you:

- Add new commands
- Change existing command behavior
- Add new configuration options
- Modify installation steps

## Release Process

### Version Numbering

We follow [Semantic Versioning](https://semver.org/):

- **MAJOR** version for incompatible API changes
- **MINOR** version for backwards-compatible functionality additions
- **PATCH** version for backwards-compatible bug fixes

### Release Checklist

- [ ] Update CHANGELOG.md
- [ ] Update version in package.json
- [ ] Run full test suite
- [ ] Update documentation
- [ ] Create GitHub release
- [ ] Publish to npm

## Getting Help

- Check the [README.md](README.md)
- Look through [existing issues](https://github.com/bertrandgressier/jup-cli/issues)
- Join our [Discord community](https://discord.gg/yourserver)

## Recognition

Contributors will be recognized in our README.md file and release notes.

Thank you for contributing! 🚀

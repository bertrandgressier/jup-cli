#!/bin/bash

# Example script demonstrating how to use Jupiter CLI with custom data directories
# This is useful for integration testing and isolated environments

set -e  # Exit on error

echo "🧪 Jupiter CLI - Integration Test Example"
echo "=========================================="

# Configuration
TEST_DIR="./test/fixtures/example-test-data"
TEST_PASSWORD="test-password-123"

# Cleanup function
cleanup() {
  echo "🧹 Cleaning up test data..."
  if [ -d "$TEST_DIR" ]; then
    rm -rf "$TEST_DIR"
  fi
}

# Set trap to cleanup on exit
trap cleanup EXIT

# Step 1: Initialize test environment
echo ""
echo "Step 1: Initializing test environment..."
echo "Directory: $TEST_DIR"

# Create test directory
mkdir -p "$TEST_DIR"

# Initialize with API key
echo "Note: Run manually with:"
echo "  node dist/index.js --data-dir $TEST_DIR init --password $TEST_PASSWORD --jupiter-key YOUR_API_KEY"

# Step 2: Verify directory structure
echo ""
echo "Step 2: Verifying directory structure..."
if [ -d "$TEST_DIR/data" ]; then
  echo "✅ Data directory exists"
fi
if [ -d "$TEST_DIR/logs" ]; then
  echo "✅ Logs directory exists"
fi
if [ -d "$TEST_DIR/cache" ]; then
  echo "✅ Cache directory exists"
fi

# Step 3: Show configuration
echo ""
echo "Step 3: Configuration file location:"
if [ -f "$TEST_DIR/config.yaml" ]; then
  echo "✅ Config file exists at: $TEST_DIR/config.yaml"
  echo ""
  echo "Configuration content:"
  cat "$TEST_DIR/config.yaml"
else
  echo "Note: Config file will be created after 'init'"
fi

# Step 4: Example commands
echo ""
echo "Step 4: Example usage with custom data directory..."
echo ""
echo "  # Initialize"
echo "  node dist/index.js --data-dir $TEST_DIR init --password $TEST_PASSWORD"
echo ""
echo "  # Set API key"
echo "  node dist/index.js --data-dir $TEST_DIR config set-jupiter-key --key YOUR_API_KEY"
echo ""
echo "  # Create wallet"
echo "  node dist/index.js --data-dir $TEST_DIR wallet create --name \"Test Wallet\""
echo ""
echo "  # List wallets"
echo "  node dist/index.js --data-dir $TEST_DIR wallet list"
echo ""
echo "  # Get prices"
echo "  node dist/index.js --data-dir $TEST_DIR price get SOL USDC"

# Step 5: CI/CD integration
echo ""
echo "Step 5: CI/CD Integration..."
cat << 'EOF'

Example GitHub Actions workflow:

```yaml
name: Integration Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
      
      - name: Setup test environment
        run: |
          TEST_DIR="/tmp/jupiter-test-$(date +%s)"
          node dist/index.js --data-dir $TEST_DIR init --password test-password --jupiter-key ${{ secrets.JUPITER_API_KEY }}
          echo "TEST_DIR=$TEST_DIR" >> $GITHUB_ENV
      
      - name: Run integration tests
        run: |
          node dist/index.js --data-dir $TEST_DIR wallet create --name "Test Wallet"
          node dist/index.js --data-dir $TEST_DIR wallet list
          node dist/index.js --data-dir $TEST_DIR price get SOL USDC
      
      - name: Cleanup
        run: rm -rf $TEST_DIR
```

EOF

# Summary
echo ""
echo "=========================================="
echo "✅ Demo complete!"
echo ""
echo "To run a real test:"
echo "  1. node dist/index.js --data-dir $TEST_DIR init --password $TEST_PASSWORD"
echo "  2. node dist/index.js --data-dir $TEST_DIR config set-jupiter-key --key \"YOUR_API_KEY\""
echo "  3. node dist/index.js --data-dir $TEST_DIR wallet create --name \"Test\""
echo "  4. node dist/index.js --data-dir $TEST_DIR wallet list"
echo ""
echo "Test data location: $TEST_DIR"
echo "=========================================="

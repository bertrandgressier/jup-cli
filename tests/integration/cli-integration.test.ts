import { PrismaClient } from '@prisma/client';
import { ProjectConfigurationService, ConfigurationService } from '../../src/core/config';
import { WalletManagerService } from '../../src/application/services/wallet/wallet-manager.service';
import { WalletCreatorService } from '../../src/application/services/wallet/wallet-creator.service';
import { MasterPasswordService } from '../../src/application/services/security/master-password.service';
import { PrismaWalletRepository } from '../../src/infrastructure/repositories/prisma-wallet.repository';
import * as path from 'path';
import * as fs from 'fs';

// Mock Jupiter API
jest.mock('../../src/infrastructure/jupiter-api/shared/jupiter-client', () => ({
  JupiterClient: jest.fn().mockImplementation(() => ({
    get: jest.fn(),
    post: jest.fn(),
  })),
  jupiterClient: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

// Mock Solana connection
jest.mock('../../src/infrastructure/solana/connection.service', () => ({
  connectionService: {
    getConnection: jest.fn(),
    getBalance: jest.fn().mockResolvedValue(1.5),
    getSignaturesForAddress: jest.fn().mockResolvedValue([]),
  },
}));

describe('CLI Integration Tests', () => {
  const testDataDir = path.join(__dirname, 'fixtures', 'integration-test-data');
  let prisma: PrismaClient;
  let configService: ConfigurationService;

  beforeAll(async () => {
    // Cleanup
    if (fs.existsSync(testDataDir)) {
      fs.rmSync(testDataDir, { recursive: true, force: true });
    }

    // Initialize test environment
    const projectConfig = new ProjectConfigurationService(testDataDir);
    const prismaInit = projectConfig.createPrismaClient();
    const masterPasswordService = new MasterPasswordService(prismaInit);

    await projectConfig.initialize('test-password-12345', masterPasswordService, {
      skipIfExists: false,
    });
    await prismaInit.$disconnect();

    // Configure API key for tests
    configService = new ConfigurationService(testDataDir);
    configService.getConfig().jupiter.apiKey = 'test-api-key';
    configService.saveConfiguration();

    prisma = projectConfig.createPrismaClient();
  });

  afterAll(async () => {
    if (prisma) {
      await prisma.$disconnect();
    }
    // Cleanup
    if (fs.existsSync(testDataDir)) {
      fs.rmSync(testDataDir, { recursive: true, force: true });
    }
  });

  describe('Wallet Commands', () => {
    it('should create a wallet', async () => {
      const walletRepo = new PrismaWalletRepository(prisma);
      const masterPasswordService = new MasterPasswordService(prisma);

      await masterPasswordService.authenticate('test-password-12345');

      const walletCreator = new WalletCreatorService(walletRepo, masterPasswordService);

      const wallet = await walletCreator.createWallet('Test Wallet');

      expect(wallet).toBeDefined();
      expect(wallet.name).toBe('Test Wallet');
      expect(wallet.address).toBeDefined();
      expect(wallet.address.length).toBeGreaterThan(0);
    });

    it('should list wallets', async () => {
      const walletRepo = new PrismaWalletRepository(prisma);
      const walletManager = new WalletManagerService(walletRepo);

      const wallets = await walletManager.getAllWallets();

      expect(Array.isArray(wallets)).toBe(true);
      expect(wallets.length).toBeGreaterThan(0);
    });

    it('should get wallet by id', async () => {
      const walletRepo = new PrismaWalletRepository(prisma);
      const walletManager = new WalletManagerService(walletRepo);

      const wallets = await walletManager.getAllWallets();
      const firstWallet = wallets[0];

      expect(firstWallet).toBeDefined();
      const foundWallet = await walletManager.getWallet(firstWallet!.id);

      expect(foundWallet).toBeDefined();
      expect(foundWallet.id).toBe(firstWallet!.id);
    });
  });

  describe('Configuration', () => {
    it('should save and load configuration', () => {
      const testValue = 'debug';
      configService.getConfig().logging.level = testValue;
      configService.saveConfiguration();

      const newConfigService = new ConfigurationService(testDataDir);
      expect(newConfigService.getConfig().logging.level).toBe(testValue);
    });

    it('should persist Jupiter API key', () => {
      const testApiKey = 'test-api-key-12345';
      configService.getConfig().jupiter.apiKey = testApiKey;
      configService.saveConfiguration();

      const newConfigService = new ConfigurationService(testDataDir);
      expect(newConfigService.getJupiterApiKey()).toBe(testApiKey);
    });
  });

  describe('Data Directory', () => {
    it('should have created all directories', () => {
      expect(fs.existsSync(path.join(testDataDir, 'data'))).toBe(true);
      expect(fs.existsSync(path.join(testDataDir, 'logs'))).toBe(true);
      expect(fs.existsSync(path.join(testDataDir, 'cache'))).toBe(true);
    });

    it('should have created config.yaml', () => {
      expect(fs.existsSync(path.join(testDataDir, 'config.yaml'))).toBe(true);
    });

    it('should have created database', () => {
      expect(fs.existsSync(path.join(testDataDir, 'data', 'jupiter.db'))).toBe(true);
    });
  });
});

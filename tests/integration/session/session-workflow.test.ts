import { execSync } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import { PrismaClient } from '@prisma/client';
import { ProjectConfigurationService } from '../../../src/core/config';
import { ConfigurationService } from '../../../src/core/config/configuration.service';
import { MasterPasswordService } from '../../../src/application/services/security/master-password.service';
import { SessionService } from '../../../src/core/session/session.service';
import { WalletCreatorService } from '../../../src/application/services/wallet/wallet-creator.service';
import { WalletManagerService } from '../../../src/application/services/wallet/wallet-manager.service';
import { PrismaWalletRepository } from '../../../src/infrastructure/repositories/prisma-wallet.repository';

describe('Session Workflow', () => {
  const testDataDir = path.join(__dirname, 'fixtures', 'session-workflow-test');
  const testPassword = 'TestPassword123!';
  const testApiKey = 'test-api-key-for-session-test';
  let prisma: PrismaClient;
  let configService: ConfigurationService;

  beforeAll(async () => {
    if (fs.existsSync(testDataDir)) {
      fs.rmSync(testDataDir, { recursive: true, force: true });
    }

    const projectConfig = new ProjectConfigurationService(testDataDir);
    const prismaInit = projectConfig.createPrismaClient();
    const masterPasswordService = new MasterPasswordService(prismaInit);

    await projectConfig.initialize(testPassword, masterPasswordService, { skipIfExists: false });

    const sessionService = new SessionService(prismaInit, testDataDir);
    await sessionService.generateSessionKey(testPassword);

    configService = new ConfigurationService(testDataDir);
    configService.getConfig().jupiter.apiKey = testApiKey;
    configService.saveConfiguration();

    prisma = projectConfig.createPrismaClient();
  });

  afterAll(async () => {
    await prisma.$disconnect();

    if (fs.existsSync(testDataDir)) {
      fs.rmSync(testDataDir, { recursive: true, force: true });
    }
  });

  describe('Session Creation', () => {
    it('should create session key during init', async () => {
      const sessionService = new SessionService(prisma, testDataDir);
      const info = await sessionService.getSessionInfo();

      expect(info.exists).toBe(true);
    });

    it('should store session key in file', async () => {
      const sessionService = new SessionService(prisma, testDataDir);
      const sessionKey = await sessionService.getSessionKey();

      expect(sessionKey).not.toBeNull();
      expect(sessionKey?.length).toBe(64);
    });
  });

  describe('Agent Operations (with session)', () => {
    it('should create wallet without password using session', async () => {
      const walletRepo = new PrismaWalletRepository(prisma);
      const masterPasswordService = new MasterPasswordService(prisma);
      const sessionService = new SessionService(prisma, testDataDir);

      const sessionKey = await sessionService.getSessionKey();
      expect(sessionKey).not.toBeNull();

      masterPasswordService.setSessionKey(sessionKey ?? Buffer.alloc(0));

      const walletCreator = new WalletCreatorService(walletRepo, masterPasswordService);
      const wallet = await walletCreator.createWallet('Session Test Wallet');

      expect(wallet).toBeDefined();
      expect(wallet.name).toBe('Session Test Wallet');
      expect(wallet.address).toBeDefined();
    });

    it('should list wallets without password', async () => {
      const walletRepo = new PrismaWalletRepository(prisma);
      const walletManager = new WalletManagerService(walletRepo);

      const wallets = await walletManager.getAllWallets();

      expect(wallets.length).toBeGreaterThan(0);
    });

    it('should show wallet without password', async () => {
      const walletRepo = new PrismaWalletRepository(prisma);
      const walletManager = new WalletManagerService(walletRepo);

      const wallets = await walletManager.getAllWallets();
      const firstWallet = wallets[0];

      const foundWallet = await walletManager.getWallet(firstWallet?.id ?? '');

      expect(foundWallet).toBeDefined();
      expect(foundWallet.id).toBe(firstWallet?.id);
    });
  });

  describe('Protected Operations', () => {
    it('should require password for wallet export', async () => {
      const cliPath = path.join(__dirname, '..', '..', '..', 'dist', 'index.js');

      if (!fs.existsSync(cliPath)) {
        return;
      }

      const walletRepo = new PrismaWalletRepository(prisma);
      const walletManager = new WalletManagerService(walletRepo);
      const wallets = await walletManager.getAllWallets();
      const walletId = wallets[0]?.id ?? '';

      const output = execSync(
        `node ${cliPath} --data-dir ${testDataDir} wallet export ${walletId} 2>&1 || true`
      ).toString();

      expect(output).toContain('password');
    });

    it('should reject session for wallet export and show warning', async () => {
      const cliPath = path.join(__dirname, '..', '..', '..', 'dist', 'index.js');

      if (!fs.existsSync(cliPath)) {
        return;
      }

      const walletRepo = new PrismaWalletRepository(prisma);
      const walletManager = new WalletManagerService(walletRepo);
      const wallets = await walletManager.getAllWallets();
      const walletId = wallets[0]?.id ?? '';

      const output = execSync(
        `node ${cliPath} --data-dir ${testDataDir} wallet export ${walletId} 2>&1 || true`
      ).toString();

      const hasProtected = output.includes('protected') || output.includes('Protected');
      const hasPassword = output.includes('password') || output.includes('Password');

      expect(hasProtected || hasPassword).toBe(true);
    });
  });

  describe('Session Management', () => {
    it('should show session status', async () => {
      const cliPath = path.join(__dirname, '..', '..', '..', 'dist', 'index.js');

      if (!fs.existsSync(cliPath)) {
        return;
      }

      const output = execSync(
        `node ${cliPath} --data-dir ${testDataDir} session status 2>&1`
      ).toString();

      expect(output).toContain('Active');
    });

    it('should regenerate session with password', async () => {
      const sessionService = new SessionService(prisma, testDataDir);

      const oldKey = await sessionService.getSessionKey();
      expect(oldKey).not.toBeNull();

      await sessionService.regenerateSession(testPassword);

      const newKey = await sessionService.getSessionKey();
      expect(newKey).not.toBeNull();
      expect(newKey?.equals(oldKey ?? Buffer.alloc(0))).toBe(false);
    });

    it('should clear session', async () => {
      const sessionService = new SessionService(prisma, testDataDir);

      await sessionService.clearSession();

      const key = await sessionService.getSessionKey();
      expect(key).toBeNull();
    });

    it('should fail regenerate with wrong password', async () => {
      const sessionService = new SessionService(prisma, testDataDir);

      await expect(sessionService.regenerateSession('wrong-password')).rejects.toThrow();
    });
  });

  describe('Password Fallback', () => {
    it('should allow operations with password if no session', async () => {
      const sessionService = new SessionService(prisma, testDataDir);
      await sessionService.clearSession();

      const walletRepo = new PrismaWalletRepository(prisma);
      const masterPasswordService = new MasterPasswordService(prisma);

      const sessionKeyFromDb = await masterPasswordService.getSessionKeyWithPassword(testPassword);
      masterPasswordService.setSessionKey(sessionKeyFromDb);

      const walletCreator = new WalletCreatorService(walletRepo, masterPasswordService);
      const wallet = await walletCreator.createWallet('Password Fallback Wallet');

      expect(wallet).toBeDefined();
      expect(wallet.name).toBe('Password Fallback Wallet');
    });
  });
});

import { ConfigurationService } from '../../../src/core/config/configuration.service';
import { PathManager } from '../../../src/core/config/path.manager';
import { ProjectConfigurationService } from '../../../src/core/config/project-config.service';
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

describe('Configuration and Data Directory', () => {
  const testDataDir = path.join(__dirname, 'fixtures', 'test-data');
  let pathManager: PathManager;
  let configService: ConfigurationService;

  beforeAll(async () => {
    pathManager = new PathManager(testDataDir);

    if (fs.existsSync(testDataDir)) {
      fs.rmSync(testDataDir, { recursive: true, force: true });
    }

    pathManager.ensureDirectories();
    configService = new ConfigurationService(testDataDir);
  });

  afterAll(async () => {
    if (fs.existsSync(testDataDir)) {
      fs.rmSync(testDataDir, { recursive: true, force: true });
    }
  });

  describe('PathManager', () => {
    it('should create directory structure', () => {
      expect(fs.existsSync(pathManager.getDataDir())).toBe(true);
      expect(fs.existsSync(path.join(pathManager.getDataDir(), 'data'))).toBe(true);
      expect(fs.existsSync(path.join(pathManager.getDataDir(), 'logs'))).toBe(true);
      expect(fs.existsSync(path.join(pathManager.getDataDir(), 'cache'))).toBe(true);
    });

    it('should return correct paths', () => {
      expect(pathManager.getConfigPath()).toBe(path.join(testDataDir, 'config.yaml'));
      expect(pathManager.getDatabasePath()).toBe(path.join(testDataDir, 'data', 'jupiter.db'));
      expect(pathManager.getLogPath()).toBe(path.join(testDataDir, 'logs', 'jup-cli.log'));
    });

    it('should detect uninitialized state', () => {
      expect(pathManager.isInitialized()).toBe(false);
    });
  });

  describe('ConfigurationService', () => {
    it('should create default configuration', () => {
      const config = configService.getConfig();

      expect(config.database.provider).toBe('sqlite');
      expect(config.jupiter.baseUrl).toBe('https://api.jup.ag');
      expect(config.solana.rpcUrl).toBe('https://api.mainnet-beta.solana.com');
      expect(config.logging.level).toBe('info');
    });

    it('should generate correct database URL', () => {
      const dbUrl = configService.getDatabaseUrl();
      expect(dbUrl).toContain('jupiter.db');
      expect(dbUrl).toContain(testDataDir);
    });

    it('should save and load configuration', () => {
      const config = configService.getConfig();
      config.logging.level = 'debug';

      configService.saveConfiguration();

      const newConfigService = new ConfigurationService(testDataDir);
      expect(newConfigService.getConfig().logging.level).toBe('debug');
    });

    it('should persist Jupiter API key', () => {
      const config = configService.getConfig();
      config.jupiter.apiKey = 'test-api-key-12345';
      configService.saveConfiguration();

      const newConfigService = new ConfigurationService(testDataDir);
      expect(newConfigService.getJupiterApiKey()).toBe('test-api-key-12345');
    });
  });

  describe('ProjectConfigurationService', () => {
    it('should initialize project with database', async () => {
      const projectConfig = new ProjectConfigurationService(testDataDir);

      expect(projectConfig.getPathManager().getDataDir()).toBe(testDataDir);
    });

    it.skip('should create Prisma client with correct URL', () => {
      const projectConfig = new ProjectConfigurationService(testDataDir);
      const prisma = projectConfig.createPrismaClient();

      expect(prisma).toBeInstanceOf(PrismaClient);
    });
  });
});

describe('CLI Integration Test Example', () => {
  const testDataDir = path.join(__dirname, 'fixtures', 'cli-test-data');

  beforeAll(async () => {
    if (fs.existsSync(testDataDir)) {
      fs.rmSync(testDataDir, { recursive: true, force: true });
    }
  });

  afterAll(async () => {
    if (fs.existsSync(testDataDir)) {
      fs.rmSync(testDataDir, { recursive: true, force: true });
    }
  });

  it('demonstrates how to test CLI with custom data directory', async () => {
    const pathManager = new PathManager(testDataDir);
    pathManager.ensureDirectories();

    const configService = new ConfigurationService(testDataDir);
    expect(configService.getPathManager().getDataDir()).toBe(testDataDir);
  });
});

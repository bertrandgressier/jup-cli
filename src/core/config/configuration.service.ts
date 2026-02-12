import * as fs from 'fs';
import * as yaml from 'js-yaml';
import * as path from 'path';
import { z } from 'zod';
import { PathManager } from './path-manager';

const PathsSchema = z.object({
  data: z.string(),
  logs: z.string(),
  cache: z.string(),
});

const DatabaseSchema = z.object({
  provider: z.string(),
  url: z.string(),
});

const JupiterSchema = z.object({
  baseUrl: z.string(),
  apiKey: z.string(),
  timeoutMs: z.number(),
  maxRetries: z.number(),
});

const SolanaSchema = z.object({
  rpcUrl: z.string(),
  commitment: z.string(),
});

const LoggingSchema = z.object({
  level: z.string(),
  console: z.boolean(),
  file: z.boolean(),
  maxFiles: z.number(),
});

const TradingSchema = z.object({
  defaultSlippageBps: z.number(),
  maxSlippageBps: z.number(),
});

const SecuritySchema = z.object({
  sessionKeyBytes: z.number(),
});

const ConfigurationSchema = z.object({
  paths: PathsSchema.optional(),
  database: DatabaseSchema.optional(),
  jupiter: JupiterSchema.optional(),
  solana: SolanaSchema.optional(),
  logging: LoggingSchema.optional(),
  trading: TradingSchema.optional(),
  security: SecuritySchema.optional(),
});

export interface Configuration {
  paths: {
    data: string;
    logs: string;
    cache: string;
  };
  database: {
    provider: string;
    url: string;
  };
  jupiter: {
    baseUrl: string;
    apiKey: string;
    timeoutMs: number;
    maxRetries: number;
  };
  solana: {
    rpcUrl: string;
    commitment: string;
  };
  logging: {
    level: string;
    console: boolean;
    file: boolean;
    maxFiles: number;
  };
  trading: {
    defaultSlippageBps: number;
    maxSlippageBps: number;
  };
  security: {
    sessionKeyBytes: number;
  };
}

export class ConfigurationService {
  private config: Configuration;
  private pathManager: PathManager;

  constructor(dataDir?: string) {
    this.pathManager = new PathManager(dataDir);
    this.config = this.loadConfiguration();
  }

  private loadConfiguration(): Configuration {
    const configPath = this.pathManager.getConfigPath();

    if (fs.existsSync(configPath)) {
      const content = fs.readFileSync(configPath, 'utf-8');
      const loaded = yaml.load(content);

      const parseResult = ConfigurationSchema.safeParse(loaded);
      if (!parseResult.success) {
        console.warn(`Configuration validation warning: ${parseResult.error.message}`);
      }

      return this.mergeWithDefaults(parseResult.success ? parseResult.data : {});
    }

    return this.getDefaultConfiguration();
  }

  private getDefaultConfiguration(): Configuration {
    const dataDir = this.pathManager.getDataDir();

    return {
      paths: {
        data: path.join(dataDir, 'data'),
        logs: path.join(dataDir, 'logs'),
        cache: path.join(dataDir, 'cache'),
      },
      database: {
        provider: 'sqlite',
        url: `file:${path.join(dataDir, 'data', 'jupiter.db')}`,
      },
      jupiter: {
        baseUrl: 'https://api.jup.ag',
        apiKey: '',
        timeoutMs: 30000,
        maxRetries: 3,
      },
      solana: {
        rpcUrl: 'https://api.mainnet-beta.solana.com',
        commitment: 'confirmed',
      },
      logging: {
        level: 'info',
        console: false,
        file: true,
        maxFiles: 30,
      },
      trading: {
        defaultSlippageBps: 100,
        maxSlippageBps: 500,
      },
      security: {
        sessionKeyBytes: 64,
      },
    };
  }

  private mergeWithDefaults(loaded: Partial<Configuration>): Configuration {
    const defaults = this.getDefaultConfiguration();

    return {
      paths: { ...defaults.paths, ...loaded.paths },
      database: { ...defaults.database, ...loaded.database },
      jupiter: { ...defaults.jupiter, ...loaded.jupiter },
      solana: { ...defaults.solana, ...loaded.solana },
      logging: { ...defaults.logging, ...loaded.logging },
      trading: { ...defaults.trading, ...loaded.trading },
      security: { ...defaults.security, ...loaded.security },
    };
  }

  saveConfiguration(): void {
    this.pathManager.ensureDirectories();
    const configPath = this.pathManager.getConfigPath();
    const content = yaml.dump(this.config, {
      indent: 2,
      lineWidth: -1,
      noRefs: true,
    });
    fs.writeFileSync(configPath, content, 'utf-8');
  }

  getConfig(): Configuration {
    return this.config;
  }

  getPathManager(): PathManager {
    return this.pathManager;
  }

  getDatabaseUrl(): string {
    return this.config.database?.url || '';
  }

  getJupiterApiKey(): string {
    return this.config.jupiter?.apiKey || '';
  }

  private static instance: ConfigurationService | null = null;

  static getInstance(dataDir?: string): ConfigurationService {
    if (!ConfigurationService.instance || dataDir) {
      ConfigurationService.instance = new ConfigurationService(dataDir);
    }
    return ConfigurationService.instance;
  }

  static resetInstance(): void {
    ConfigurationService.instance = null;
  }
}

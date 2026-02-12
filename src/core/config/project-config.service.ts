import * as fs from 'fs';
import { execSync } from 'child_process';
import { ConfigurationService } from './configuration.service';
import { PathManager } from './path-manager';
import { PrismaClient } from '@prisma/client';

export interface InitOptions {
  dataDir?: string;
  skipIfExists?: boolean;
  force?: boolean;
}

export interface MasterPasswordInitializer {
  initialize(masterPassword: string): Promise<void>;
}

export class ProjectConfigurationService {
  private pathManager: PathManager;
  private configService: ConfigurationService;

  constructor(dataDir?: string) {
    this.pathManager = new PathManager(dataDir);
    this.configService = new ConfigurationService(dataDir);
  }

  async initialize(
    masterPassword: string,
    masterPasswordInitializer: MasterPasswordInitializer,
    options: InitOptions = {}
  ): Promise<void> {
    const { skipIfExists = false, force = false } = options;

    if (this.pathManager.isInitialized()) {
      if (skipIfExists) {
        return;
      }
      if (force) {
        const dataDir = this.pathManager.getDataDir();
        if (fs.existsSync(dataDir)) {
          fs.rmSync(dataDir, { recursive: true, force: true });
        }
      } else {
        throw new Error('Project is already initialized. Use --force to reinitialize.');
      }
    }

    this.pathManager.ensureDirectories();
    this.configService.saveConfiguration();
    await this.initializeDatabase();
    await masterPasswordInitializer.initialize(masterPassword);
  }

  private async initializeDatabase(): Promise<void> {
    const databaseUrl = this.configService.getDatabaseUrl();

    try {
      execSync('npx prisma migrate deploy', {
        env: { ...process.env, DATABASE_URL: databaseUrl },
        stdio: ['pipe', 'pipe', 'pipe'],
      });
    } catch {
      throw new Error('Database initialization failed');
    }
  }

  createPrismaClient(): PrismaClient {
    const databaseUrl = this.configService.getDatabaseUrl();

    return new PrismaClient({
      datasources: {
        db: {
          url: databaseUrl,
        },
      },
    });
  }

  getPathManager(): PathManager {
    return this.pathManager;
  }

  isInitialized(): boolean {
    return this.pathManager.isInitialized();
  }
}

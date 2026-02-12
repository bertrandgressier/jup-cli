import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';

export class PathManager {
  private dataDir: string;

  constructor(dataDir?: string) {
    this.dataDir = dataDir || this.getDefaultDataDir();
    this.dataDir = path.resolve(this.dataDir);
  }

  private getDefaultDataDir(): string {
    const home = os.homedir();
    return path.join(home, '.solana', 'jupiter-cli');
  }

  getDataDir(): string {
    return this.dataDir;
  }

  getConfigPath(): string {
    return path.join(this.dataDir, 'config.yaml');
  }

  getDatabasePath(): string {
    return path.join(this.dataDir, 'data', 'jupiter.db');
  }

  getDatabaseUrl(): string {
    return `file:${this.getDatabasePath()}`;
  }

  getLogsDir(): string {
    return path.join(this.dataDir, 'logs');
  }

  getLogPath(): string {
    return path.join(this.getLogsDir(), 'jupiter-cli.log');
  }

  getCacheDir(): string {
    return path.join(this.dataDir, 'cache');
  }

  ensureDirectories(): void {
    fs.mkdirSync(path.join(this.dataDir, 'data'), { recursive: true });
    fs.mkdirSync(path.join(this.dataDir, 'logs'), { recursive: true });
    fs.mkdirSync(path.join(this.dataDir, 'cache'), { recursive: true });

    if (process.platform !== 'win32') {
      try {
        fs.chmodSync(this.dataDir, 0o700);
      } catch {
        // Ignore permission errors
      }
    }
  }

  exists(): boolean {
    return fs.existsSync(this.dataDir);
  }

  isInitialized(): boolean {
    return fs.existsSync(this.getConfigPath()) && fs.existsSync(this.getDatabasePath());
  }
}

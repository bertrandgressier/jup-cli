import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { randomBytes } from 'crypto';
import { PrismaClient } from '@prisma/client';
import { aesService } from '../crypto/encryption.service';
import { argon2Service } from '../crypto/key-derivation.service';
import { PathManager } from '../config/path.manager';

export interface SessionInfo {
  exists: boolean;
  createdAt?: Date;
  walletCount?: number;
}

export class SessionService {
  private prisma: PrismaClient;
  private pathManager: PathManager;
  private cachedSessionKey: Buffer | null = null;

  constructor(prisma: PrismaClient, dataDir?: string) {
    this.prisma = prisma;
    this.pathManager = new PathManager(dataDir);
  }

  async generateSessionKey(masterPassword: string): Promise<void> {
    const master = await this.prisma.masterPassword.findFirst();

    if (!master) {
      throw new Error('Master password not initialized');
    }

    const salt = Buffer.from(master.salt, 'hex');
    const sessionKey = randomBytes(64);

    const derivedKey = await argon2Service.deriveKey(masterPassword, salt);

    const { encrypted, nonce, authTag } = aesService.encrypt(
      sessionKey.toString('hex'),
      derivedKey
    );

    await this.prisma.masterPassword.update({
      where: { id: 1 },
      data: {
        encryptedSessionKey: encrypted,
        sessionNonce: nonce,
        sessionSalt: authTag,
      },
    });

    await this.storeSessionKeyFile(sessionKey);

    this.cachedSessionKey = Buffer.from(sessionKey);

    derivedKey.fill(0);
    sessionKey.fill(0);
  }

  async getSessionKey(): Promise<Buffer | null> {
    if (this.cachedSessionKey) {
      return this.cachedSessionKey;
    }

    const sessionKey = await this.loadSessionKeyFile();
    if (sessionKey) {
      this.cachedSessionKey = sessionKey;
      return sessionKey;
    }

    return null;
  }

  async hasSession(): Promise<boolean> {
    const sessionKey = await this.getSessionKey();
    return sessionKey !== null;
  }

  async getSessionInfo(): Promise<SessionInfo> {
    const masterPassword = await this.prisma.masterPassword.findFirst();

    if (!masterPassword || !masterPassword.encryptedSessionKey) {
      return { exists: false };
    }

    const walletCount = await this.prisma.wallet.count();

    return {
      exists: true,
      createdAt: masterPassword.createdAt,
      walletCount,
    };
  }

  async clearSession(): Promise<void> {
    const sessionPath = this.getSessionFilePath();

    if (fs.existsSync(sessionPath)) {
      fs.unlinkSync(sessionPath);
    }

    this.cachedSessionKey = null;
  }

  async regenerateSession(masterPassword: string): Promise<void> {
    const master = await this.prisma.masterPassword.findFirst();

    if (!master) {
      throw new Error('Master password not initialized');
    }

    const isValid = await argon2Service.verifyPassword(master.hash, masterPassword);
    if (!isValid) {
      throw new Error('Invalid master password');
    }

    await this.clearSession();
    await this.generateSessionKey(masterPassword);
  }

  private async storeSessionKeyFile(sessionKey: Buffer): Promise<void> {
    const sessionDir = this.getSessionDirectory();

    if (!fs.existsSync(sessionDir)) {
      fs.mkdirSync(sessionDir, { recursive: true, mode: 0o700 });
    }

    const sessionPath = this.getSessionFilePath();

    const encrypted = this.encryptSessionKeyForFile(sessionKey);

    fs.writeFileSync(sessionPath, encrypted, { mode: 0o600 });
  }

  private async loadSessionKeyFile(): Promise<Buffer | null> {
    const sessionPath = this.getSessionFilePath();

    if (!fs.existsSync(sessionPath)) {
      return null;
    }

    try {
      const encrypted = fs.readFileSync(sessionPath, 'utf-8');
      return this.decryptSessionKeyFromFile(encrypted);
    } catch {
      return null;
    }
  }

  private encryptSessionKeyForFile(sessionKey: Buffer): string {
    const machineKey = this.getMachineKey();
    const { encrypted, nonce, authTag } = aesService.encrypt(
      sessionKey.toString('hex'),
      machineKey
    );
    return JSON.stringify({ encrypted, nonce, authTag });
  }

  private decryptSessionKeyFromFile(encryptedData: string): Buffer {
    const { encrypted, nonce, authTag } = JSON.parse(encryptedData);
    const machineKey = this.getMachineKey();
    const decrypted = aesService.decrypt(encrypted, machineKey, nonce, authTag);
    return Buffer.from(decrypted, 'hex');
  }

  private getMachineKey(): Buffer {
    const machineId = `${os.hostname()}:${os.userInfo().username}:jup-cli`;
    return Buffer.from(machineId.padEnd(32, 'x')).slice(0, 32);
  }

  private getSessionDirectory(): string {
    return path.join(this.pathManager.getDataDir(), 'session');
  }

  private getSessionFilePath(): string {
    return path.join(this.getSessionDirectory(), 'key');
  }
}

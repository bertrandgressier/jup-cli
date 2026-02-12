import { PrismaClient } from '@prisma/client';
import { argon2Service } from '../../../core/crypto/key-derivation.service';
import { aesService } from '../../../core/crypto/encryption.service';
import { LoggerService } from '../../../core/logger/logger.service';
import {
  MasterPasswordError,
  MasterPasswordNotSetError,
  InvalidMasterPasswordError,
  SessionKeyError,
  SessionKeyNotInitializedError,
} from '../../../core/errors/wallet.errors';

export class MasterPasswordService {
  private prisma: PrismaClient;
  private cachedSessionKey: Buffer | null = null;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Initialize the master password and generate session key
   */
  async initialize(masterPassword: string): Promise<void> {
    try {
      // Check if already initialized
      const existing = await this.prisma.masterPassword.findUnique({
        where: { id: 1 },
      });

      if (existing) {
        throw new MasterPasswordError(
          'Master password already initialized',
          'MASTER_PASSWORD_ALREADY_INITIALIZED'
        );
      }

      // Generate salt and hash password
      const salt = argon2Service.generateSalt();
      const hash = await argon2Service.hashPassword(masterPassword, { salt });

      // Generate session key
      const sessionKey = argon2Service.generateKey(64);

      // Derive encryption key from password
      const encryptionKey = await argon2Service.deriveKey(masterPassword, salt);

      // Encrypt session key
      const { encrypted, nonce, authTag } = aesService.encrypt(
        sessionKey.toString('hex'),
        encryptionKey
      );

      // Store in database
      await this.prisma.masterPassword.create({
        data: {
          id: 1,
          hash,
          salt: salt.toString('hex'),
          encryptedSessionKey: encrypted,
          sessionNonce: nonce,
          sessionSalt: authTag,
        },
      });

      LoggerService.getInstance().debug('Master password initialized');
    } catch (error) {
      if (error instanceof MasterPasswordError) {
        throw error;
      }
      throw new MasterPasswordError(
        `Failed to initialize master password: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'INITIALIZATION_FAILED'
      );
    }
  }

  /**
   * Verify master password against stored hash
   */
  async verifyPassword(password: string): Promise<boolean> {
    try {
      const master = await this.prisma.masterPassword.findUnique({
        where: { id: 1 },
      });

      if (!master) {
        return false;
      }

      return await argon2Service.verifyPassword(master.hash, password);
    } catch (error) {
      LoggerService.getInstance().error('Failed to verify password', error as Error);
      return false;
    }
  }

  /**
   * Check if master password is set
   */
  async isInitialized(): Promise<boolean> {
    const master = await this.prisma.masterPassword.findUnique({
      where: { id: 1 },
    });
    return !!master;
  }

  /**
   * Get and decrypt session key using master password
   * This requires the master password - used for outbound transfers
   */
  async getSessionKeyWithPassword(password: string): Promise<Buffer> {
    const master = await this.prisma.masterPassword.findUnique({
      where: { id: 1 },
    });

    if (!master) {
      throw new MasterPasswordNotSetError();
    }

    const isValid = await argon2Service.verifyPassword(master.hash, password);

    if (!isValid) {
      throw new InvalidMasterPasswordError();
    }

    const salt = Buffer.from(master.salt, 'hex');
    const encryptionKey = await argon2Service.deriveKey(password, salt);

    const sessionKeyHex = aesService.decrypt(
      master.encryptedSessionKey,
      encryptionKey,
      master.sessionNonce,
      master.sessionSalt
    );

    return Buffer.from(sessionKeyHex, 'hex');
  }

  /**
   * Authenticate with master password and cache session key
   * Must be called before getSessionKey() for autonomous operations
   */
  async authenticate(password: string): Promise<boolean> {
    const sessionKey = await this.getSessionKeyWithPassword(password);
    this.cachedSessionKey = sessionKey;
    return true;
  }

  /**
   * Check if session is authenticated (session key cached)
   */
  isAuthenticated(): boolean {
    return this.cachedSessionKey !== null;
  }

  /**
   * Clear cached session key (logout)
   */
  clearSession(): void {
    if (this.cachedSessionKey) {
      this.cachedSessionKey.fill(0);
      this.cachedSessionKey = null;
    }
  }

  /**
   * Set session key directly (from session file)
   * Used when session key is loaded from file
   */
  setSessionKey(sessionKey: Buffer): void {
    this.cachedSessionKey = Buffer.from(sessionKey);
  }

  /**
   * Get session key using stored credentials
   * Requires prior authentication via authenticate() or setSessionKey()
   */
  async getSessionKey(): Promise<Buffer> {
    if (this.cachedSessionKey) {
      return this.cachedSessionKey;
    }

    const master = await this.prisma.masterPassword.findUnique({
      where: { id: 1 },
    });

    if (!master) {
      throw new SessionKeyNotInitializedError();
    }

    throw new SessionKeyError(
      'Session not authenticated. Call authenticate(password) first or use getSessionKeyWithPassword().',
      'SESSION_NOT_AUTHENTICATED'
    );
  }
}

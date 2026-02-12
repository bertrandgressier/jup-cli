import { randomBytes } from 'crypto';
import { Aes256GcmService, aesService } from '../../../core/crypto/encryption.service';
import { argon2Service } from '../../../core/crypto/key-derivation.service';

export class KeyEncryptionService {
  private aesService: Aes256GcmService;

  constructor() {
    this.aesService = aesService;
  }

  /**
   * Encrypt a private key using the session key
   */
  async encryptPrivateKey(
    privateKey: string,
    sessionKey: Buffer
  ): Promise<{ encryptedKey: string; nonce: string; salt: string; authTag: string }> {
    const salt = randomBytes(32);
    const key = await this.deriveKey(sessionKey, salt);

    const { encrypted, nonce, authTag } = this.aesService.encrypt(privateKey, key);

    key.fill(0);

    return {
      encryptedKey: encrypted,
      nonce,
      salt: salt.toString('hex'),
      authTag,
    };
  }

  /**
   * Decrypt a private key using the session key
   */
  async decryptPrivateKey(
    encryptedKey: string,
    nonce: string,
    salt: string,
    authTag: string,
    sessionKey: Buffer
  ): Promise<string> {
    const saltBuffer = Buffer.from(salt, 'hex');
    const key = await this.deriveKey(sessionKey, saltBuffer);

    try {
      return this.aesService.decrypt(encryptedKey, key, nonce, authTag);
    } finally {
      key.fill(0);
    }
  }

  /**
   * Derive an encryption key from the session key and salt using Argon2id
   * Uses Argon2id as per security guidelines (never SHA-256 for key derivation)
   */
  private async deriveKey(sessionKey: Buffer, salt: Buffer): Promise<Buffer> {
    return argon2Service.deriveKey(sessionKey.toString('hex'), salt);
  }
}

export const keyEncryptionService = new KeyEncryptionService();

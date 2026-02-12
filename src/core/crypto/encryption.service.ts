import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import { EncryptionError } from '../errors/wallet.errors';

export class Aes256GcmService {
  private readonly ALGORITHM = 'aes-256-gcm';
  private readonly KEY_LENGTH = 32;
  private readonly IV_LENGTH = 12;

  /**
   * Encrypt data using AES-256-GCM
   * @param plaintext - Data to encrypt
   * @param key - Encryption key (32 bytes)
   * @param nonce - Optional nonce (12 bytes recommended per NIST SP 800-38D). If not provided, a random one will be generated
   * @returns Object containing encrypted data, nonce, and auth tag
   */
  encrypt(
    plaintext: string,
    key: Buffer,
    nonce?: Buffer
  ): { encrypted: string; nonce: string; authTag: string } {
    try {
      if (key.length !== this.KEY_LENGTH) {
        throw new EncryptionError(`Key must be ${this.KEY_LENGTH} bytes`, 'INVALID_KEY_LENGTH');
      }

      const iv = nonce || randomBytes(this.IV_LENGTH);
      const cipher = createCipheriv(this.ALGORITHM, key, iv);

      let encrypted = cipher.update(plaintext, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      const authTag = cipher.getAuthTag();

      return {
        encrypted,
        nonce: iv.toString('hex'),
        authTag: authTag.toString('hex'),
      };
    } catch (error) {
      throw new EncryptionError(
        `Encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'ENCRYPTION_FAILED'
      );
    }
  }

  /**
   * Decrypt data using AES-256-GCM
   * @param encrypted - Encrypted data (hex string)
   * @param key - Encryption key (32 bytes)
   * @param nonce - Nonce used for encryption (hex string)
   * @param authTag - Authentication tag (hex string)
   * @returns Decrypted plaintext
   */
  decrypt(encrypted: string, key: Buffer, nonce: string, authTag: string): string {
    try {
      if (key.length !== this.KEY_LENGTH) {
        throw new EncryptionError(`Key must be ${this.KEY_LENGTH} bytes`, 'INVALID_KEY_LENGTH');
      }

      const iv = Buffer.from(nonce, 'hex');
      const tag = Buffer.from(authTag, 'hex');

      const decipher = createDecipheriv(this.ALGORITHM, key, iv);
      decipher.setAuthTag(tag);

      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      throw new EncryptionError(
        `Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'DECRYPTION_FAILED'
      );
    }
  }
}

export const aesService = new Aes256GcmService();

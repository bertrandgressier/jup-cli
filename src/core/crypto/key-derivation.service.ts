import * as argon2 from 'argon2';
import { randomBytes } from 'crypto';

export interface Argon2Options {
  memoryCost?: number;
  timeCost?: number;
  parallelism?: number;
  salt?: Buffer;
}

export class Argon2idService {
  /**
   * Hash a password using Argon2id
   * @param password - Password to hash
   * @param options - Optional Argon2 options
   * @returns Hashed password (includes salt and parameters)
   */
  async hashPassword(password: string, options?: Argon2Options): Promise<string> {
    const opts: argon2.Options = {
      type: argon2.argon2id,
      memoryCost: 65536, // 64 MB
      timeCost: 3,
      parallelism: 4,
      hashLength: 32,
      ...(options?.memoryCost && { memoryCost: options.memoryCost }),
      ...(options?.timeCost && { timeCost: options.timeCost }),
      ...(options?.parallelism && { parallelism: options.parallelism }),
      ...(options?.salt && { salt: options.salt }),
    };

    return argon2.hash(password, opts);
  }

  /**
   * Verify a password against a hash
   * @param hash - Stored hash
   * @param password - Password to verify
   * @returns True if password matches
   */
  async verifyPassword(hash: string, password: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, password);
    } catch {
      return false;
    }
  }

  /**
   * Derive a key from a password using Argon2id
   * This is used to derive encryption keys from the master password
   * @param password - Password to derive from
   * @param salt - Salt for derivation
   * @returns Derived key (32 bytes)
   */
  async deriveKey(password: string, salt: Buffer): Promise<Buffer> {
    const opts: argon2.Options & { raw: true } = {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
      hashLength: 32,
      salt,
      raw: true,
    };

    const key = await argon2.hash(password, opts);
    return Buffer.from(key);
  }

  /**
   * Generate a random salt
   * @param length - Salt length in bytes (default: 32)
   * @returns Random salt
   */
  generateSalt(length: number = 32): Buffer {
    return Buffer.from(randomBytes(length));
  }

  generateKey(length: number = 64): Buffer {
    return Buffer.from(randomBytes(length));
  }
}

export const argon2Service = new Argon2idService();

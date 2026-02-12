import { Aes256GcmService } from '../../../src/core/crypto/encryption.service';

describe('Aes256GcmService', () => {
  let service: Aes256GcmService;

  beforeEach(() => {
    service = new Aes256GcmService();
  });

  describe('encrypt/decrypt', () => {
    it('should encrypt and decrypt data correctly', () => {
      const key = Buffer.alloc(32, 'test-key-32-bytes-long!!');
      const plaintext = 'Hello, World!';

      const encrypted = service.encrypt(plaintext, key);
      expect(encrypted.encrypted).toBeDefined();
      expect(encrypted.nonce).toBeDefined();
      expect(encrypted.authTag).toBeDefined();

      const decrypted = service.decrypt(
        encrypted.encrypted,
        key,
        encrypted.nonce,
        encrypted.authTag
      );

      expect(decrypted).toBe(plaintext);
    });

    it('should throw error for invalid key length', () => {
      const key = Buffer.alloc(16, 'short-key');
      const plaintext = 'test';

      expect(() => service.encrypt(plaintext, key)).toThrow();
    });

    it('should fail decryption with wrong key', () => {
      const key = Buffer.alloc(32, 'test-key-32-bytes-long!!');
      const wrongKey = Buffer.alloc(32, 'wrong-key-32-bytes-long!');
      const plaintext = 'Secret data';

      const encrypted = service.encrypt(plaintext, key);

      expect(() =>
        service.decrypt(encrypted.encrypted, wrongKey, encrypted.nonce, encrypted.authTag)
      ).toThrow();
    });

    it('should fail decryption with wrong auth tag', () => {
      const key = Buffer.alloc(32, 'test-key-32-bytes-long!!');
      const plaintext = 'Secret data';

      const encrypted = service.encrypt(plaintext, key);
      const wrongAuthTag = '0'.repeat(32);

      expect(() =>
        service.decrypt(encrypted.encrypted, key, encrypted.nonce, wrongAuthTag)
      ).toThrow();
    });
  });
});

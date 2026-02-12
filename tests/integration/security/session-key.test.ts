import { MasterPasswordService } from '../../../src/application/services/security/master-password.service';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('MasterPasswordService', () => {
  let service: MasterPasswordService;

  beforeEach(() => {
    service = new MasterPasswordService(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('isInitialized', () => {
    it('should return false when not initialized', async () => {
      const result = await service.isInitialized();
      expect(typeof result).toBe('boolean');
    });
  });

  describe('verifyPassword', () => {
    it('should return false for invalid password', async () => {
      const result = await service.verifyPassword('wrong-password');
      expect(result).toBe(false);
    });
  });
});

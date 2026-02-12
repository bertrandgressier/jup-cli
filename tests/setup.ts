import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default prisma;

// For testing
export const createTestPrismaClient = () => {
  return new PrismaClient({
    datasources: {
      db: {
        url: 'file:./test.db',
      },
    },
  });
};

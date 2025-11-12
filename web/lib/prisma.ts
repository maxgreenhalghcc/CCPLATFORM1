<<<<<<< HEAD
import { PrismaClient } from '../../api/node_modules/@prisma/client';
=======
import { PrismaClient } from '@prisma/client';
>>>>>>> pr-22

const globalForPrisma = global as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error']
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;

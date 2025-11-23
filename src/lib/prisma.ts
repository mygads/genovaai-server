import { PrismaClient } from '../generated/prisma';

// PrismaClient singleton to prevent connection pool exhaustion
declare global {
  var prisma: PrismaClient | undefined;
}

export const prisma = global.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

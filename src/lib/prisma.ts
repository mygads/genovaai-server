import { PrismaClient } from '../generated/prisma';

// PrismaClient singleton to prevent connection pool exhaustion
declare global {
  var prisma: PrismaClient | undefined;
}

export const prisma = global.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});

// Ensure connection on first use
if (!global.prisma) {
  prisma.$connect().catch((err) => {
    console.error('Failed to connect to database:', err);
  });
}

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

// Graceful shutdown
if (process.env.NODE_ENV === 'production') {
  process.on('beforeExit', async () => {
    await prisma.$disconnect();
  });
}

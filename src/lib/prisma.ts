import { PrismaClient } from '../generated/prisma';

// PrismaClient singleton to prevent connection pool exhaustion
declare global {
  var prisma: PrismaClient | undefined;
}

const prismaClient = global.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});

export const prisma = prismaClient;
export default prismaClient;

// Ensure connection on first use
if (!global.prisma) {
  prismaClient.$connect().catch((err) => {
    console.error('Failed to connect to database:', err);
  });
}

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prismaClient;
}

// Graceful shutdown
if (process.env.NODE_ENV === 'production') {
  process.on('beforeExit', async () => {
    await prismaClient.$disconnect();
  });
}

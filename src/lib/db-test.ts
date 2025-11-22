import 'dotenv/config';
import { PrismaClient } from '../generated/prisma';

const prisma = new PrismaClient();

export async function testDatabaseConnection() {
  try {
    console.log('🧪 Testing GenovaAI Database Connection...\n');

    // Test 1: User query
    const users = await prisma.user.findMany({
      where: { role: 'customer' },
      include: {
        creditTransactions: true,
        geminiApiKeys: true,
        extensionSessions: true,
      },
      take: 5,
    });

    console.log('✅ Database connected');
    console.log(`✅ Found ${users.length} test customer(s)`);
    
    if (users.length > 0) {
      const user = users[0];
      console.log(`   - Name: ${user.name}`);
      console.log(`   - Email: ${user.email}`);
      console.log(`   - Credits: ${user.credits}`);
      console.log(`   - Balance: Rp ${user.balance.toString()}`);
      console.log(`   - Transactions: ${user.creditTransactions.length}`);
      console.log(`   - API Keys: ${user.geminiApiKeys.length}`);
      console.log(`   - Sessions: ${user.extensionSessions.length}`);
    }

    // Test 2: Gemini API Key pool
    const activeKeys = await prisma.geminiAPIKey.findMany({
      where: { status: 'active' },
      orderBy: { priority: 'asc' },
      include: {
        user: {
          select: { name: true, role: true }
        }
      }
    });

    console.log(`\n✅ Found ${activeKeys.length} active API key(s) in pool`);
    activeKeys.forEach((key, idx: number) => {
      console.log(`   ${idx + 1}. Priority ${key.priority} - ${key.user?.name || 'System'} (${key.user?.role || 'admin'})`);
    });

    // Test 3: System Prompts
    const templates = await prisma.systemPrompt.findMany({
      where: { isTemplate: true },
      select: {
        name: true,
        category: true,
        isPublic: true,
      }
    });

    console.log(`\n✅ Found ${templates.length} system prompt template(s)`);
    templates.forEach((template, idx: number) => {
      console.log(`   ${idx + 1}. ${template.name} (${template.category || 'general'})`);
    });

    // Test 4: Vouchers
    const vouchers = await prisma.voucher.findMany({
      where: { isActive: true },
      select: {
        code: true,
        name: true,
        type: true,
        creditBonus: true,
        discountType: true,
      }
    });

    console.log(`\n✅ Found ${vouchers.length} active voucher(s)`);
    vouchers.forEach((voucher, idx: number) => {
      const bonus = voucher.creditBonus ? `${voucher.creditBonus} credits` : `${voucher.discountType} discount`;
      console.log(`   ${idx + 1}. ${voucher.code} - ${voucher.name} (${bonus})`);
    });

    // Test 5: Extension Sessions
    const sessions = await prisma.extensionSession.findMany({
      where: { isActive: true },
      include: {
        user: {
          select: { name: true, email: true }
        },
        chatHistories: true,
      }
    });

    console.log(`\n✅ Found ${sessions.length} active extension session(s)`);
    sessions.forEach((session, idx: number) => {
      console.log(`   ${idx + 1}. ${session.sessionName} - ${session.user.name}`);
      console.log(`      Mode: ${session.requestMode}, Provider: ${session.provider}, Model: ${session.model}`);
      console.log(`      Chat histories: ${session.chatHistories.length}`);
    });

    // Test 6: Credit Transactions
    const transactions = await prisma.creditTransaction.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        user: {
          select: { name: true }
        }
      }
    });

    console.log(`\n✅ Found ${transactions.length} recent transaction(s)`);
    transactions.forEach((tx, idx: number) => {
      console.log(`   ${idx + 1}. ${tx.type} - ${tx.user.name}: ${tx.credits || 0} credits, Rp ${tx.amount}`);
    });

    console.log('\n🎉 All database tests passed!');
    console.log('\n📋 Database Summary:');
    console.log(`   - Users: ${users.length}`);
    console.log(`   - API Keys: ${activeKeys.length}`);
    console.log(`   - System Prompts: ${templates.length}`);
    console.log(`   - Vouchers: ${vouchers.length}`);
    console.log(`   - Active Sessions: ${sessions.length}`);
    console.log(`   - Transactions: ${transactions.length}`);

    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if executed directly
if (require.main === module) {
  testDatabaseConnection()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

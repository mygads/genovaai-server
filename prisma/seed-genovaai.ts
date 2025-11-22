import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seedGenovaAI() {
  console.log('🌱 Seeding GenovaAI data...');

  // 1. Create test users
  const hashedPassword = await bcrypt.hash('Test123!@#', 10);
  
  const testCustomer = await prisma.user.upsert({
    where: { email: 'customer@genovaai.test' },
    update: {},
    create: {
      email: 'customer@genovaai.test',
      phone: '628123456789',
      password: hashedPassword,
      name: 'Test Customer',
      role: 'customer',
      emailVerified: new Date(),
      phoneVerified: new Date(),
      credits: 10,
      balance: 50000,
      subscriptionStatus: 'free',
    },
  });

  const testAdmin = await prisma.user.upsert({
    where: { email: 'admin@genovaai.test' },
    update: {},
    create: {
      email: 'admin@genovaai.test',
      phone: '628987654321',
      password: hashedPassword,
      name: 'Test Admin',
      role: 'admin',
      emailVerified: new Date(),
      phoneVerified: new Date(),
      credits: 1000,
      balance: 1000000,
    },
  });

  console.log('✅ Test users created');
  console.log(`   - Customer: customer@genovaai.test`);
  console.log(`   - Admin: admin@genovaai.test`);
  console.log(`   - Password: Test123!@#`);

  // 2. Create admin Gemini API keys (default pool)
  await prisma.geminiAPIKey.createMany({
    data: [
      {
        userId: testAdmin.id,
        apiKey: 'ADMIN_KEY_1_PLACEHOLDER_REPLACE_WITH_REAL_KEY',
        status: 'active',
        priority: 1,
      },
      {
        userId: testAdmin.id,
        apiKey: 'ADMIN_KEY_2_PLACEHOLDER_REPLACE_WITH_REAL_KEY',
        status: 'active',
        priority: 2,
      },
    ],
    skipDuplicates: true,
  });

  console.log('✅ Admin API keys created (placeholders - replace with real keys)');

  // 3. Create system prompt templates
  await prisma.systemPrompt.createMany({
    data: [
      {
        userId: null,
        name: 'Quiz Assistant (Default)',
        content: `You are GenovaAI, a quiz assistant. Answer questions accurately and concisely based on the provided knowledge base. Always provide the answer in the requested format.`,
        isTemplate: true,
        isPublic: true,
        category: 'quiz',
        description: 'Default quiz assistant prompt',
      },
      {
        userId: null,
        name: 'Detailed Explainer',
        content: `You are an educational AI. Provide detailed explanations with examples and step-by-step reasoning. Make sure the student understands not just the answer, but the process.`,
        isTemplate: true,
        isPublic: true,
        category: 'education',
        description: 'For in-depth explanations',
      },
      {
        userId: null,
        name: 'Quick Answer Mode',
        content: `Provide direct, concise answers. No elaboration unless asked. Answer format: A/B/C/D for multiple choice, or brief text for short answer.`,
        isTemplate: true,
        isPublic: true,
        category: 'quick',
        description: 'Fast and brief responses',
      },
      {
        userId: null,
        name: 'Code Helper',
        content: `You are a programming assistant. Help with code questions, debugging, and explanations. Provide clean, working code examples when relevant.`,
        isTemplate: true,
        isPublic: true,
        category: 'coding',
        description: 'For programming questions',
      },
    ],
    skipDuplicates: true,
  });

  console.log('✅ System prompt templates created (4 templates)');

  // 4. Create test vouchers
  await prisma.voucher.createMany({
    data: [
      {
        code: 'WELCOME10',
        name: 'Welcome Bonus',
        description: '10 credits bonus untuk user baru',
        type: 'credit',
        discountType: 'fixed',
        value: 0,
        creditBonus: 10,
        maxUses: 1000,
        isActive: true,
        startDate: new Date(),
        endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
      },
      {
        code: 'TOPUP50K',
        name: 'Top-up Discount 50%',
        description: 'Diskon 50% untuk top-up minimal 100rb',
        type: 'balance',
        discountType: 'percentage',
        value: 50,
        minAmount: 100000,
        maxDiscount: 50000,
        maxUses: 100,
        isActive: true,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
      {
        code: 'CREDIT20',
        name: 'Credit Bonus 20',
        description: '20 credits gratis untuk top-up pertama',
        type: 'credit',
        discountType: 'fixed',
        value: 0,
        creditBonus: 20,
        balanceBonus: 0,
        maxUses: 1,
        allowMultipleUsePerUser: false,
        isActive: true,
        startDate: new Date(),
      },
    ],
    skipDuplicates: true,
  });

  console.log('✅ Test vouchers created (3 vouchers)');
  console.log(`   - WELCOME10: 10 free credits`);
  console.log(`   - TOPUP50K: 50% discount on balance top-up`);
  console.log(`   - CREDIT20: 20 free credits bonus`);

  // 5. Give welcome bonus to test customer
  await prisma.creditTransaction.create({
    data: {
      userId: testCustomer.id,
      type: 'welcome_bonus',
      amount: 0,
      credits: 10,
      description: 'Welcome bonus - 10 free credits',
      status: 'completed',
    },
  });

  console.log('✅ Welcome bonus transaction logged');

  // 6. Create a test extension session for customer
  await prisma.extensionSession.create({
    data: {
      userId: testCustomer.id,
      sessionId: `sess_test_${Date.now()}`,
      sessionName: 'My First Quiz Session',
      systemPrompt: 'You are a helpful quiz assistant. Answer questions accurately.',
      answerMode: 'short',
      requestMode: 'free_pool',
      provider: 'gemini',
      model: 'gemini-1.5-flash',
      isActive: true,
    },
  });

  console.log('✅ Test extension session created');

  console.log('\n✨ GenovaAI seeding completed successfully!');
  console.log('\n📊 Summary:');
  console.log('   - 2 users (1 customer, 1 admin)');
  console.log('   - 2 admin API keys');
  console.log('   - 4 system prompt templates');
  console.log('   - 3 vouchers');
  console.log('   - 1 welcome bonus transaction');
  console.log('   - 1 extension session');
  console.log('\n🔑 Login credentials:');
  console.log('   Email: customer@genovaai.test or admin@genovaai.test');
  console.log('   Password: Test123!@#');
}

seedGenovaAI()
  .catch((e) => {
    console.error('❌ Error seeding GenovaAI:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

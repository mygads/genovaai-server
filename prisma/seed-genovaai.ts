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

  // 3. Create system prompt templates (untuk custom user prompts)
  await prisma.systemPrompt.createMany({
    data: [
      {
        userId: null,
        name: 'Quiz Assistant - Bahasa Indonesia',
        content: `Kamu adalah GenovaAI, asisten kuis yang membantu siswa belajar. Jawab pertanyaan dengan akurat berdasarkan knowledge base yang diberikan. Gunakan bahasa Indonesia yang mudah dipahami.`,
        isTemplate: true,
        isPublic: true,
        category: 'quiz',
        description: 'Template untuk kuis dalam Bahasa Indonesia',
      },
      {
        userId: null,
        name: 'Math Tutor - Step by Step',
        content: `Kamu adalah tutor matematika. Jelaskan setiap langkah perhitungan dengan detail. Format: 1) Pahami soal, 2) Identifikasi rumus, 3) Hitung langkah per langkah, 4) Kesimpulan.`,
        isTemplate: true,
        isPublic: true,
        category: 'education',
        description: 'Untuk soal matematika dengan penjelasan bertahap',
      },
      {
        userId: null,
        name: 'Essay Helper - Formal',
        content: `Kamu adalah asisten essay akademik. Gunakan bahasa formal dan struktur yang baik. Berikan penjelasan dengan gaya penulisan esai: pendahuluan, isi, dan kesimpulan.`,
        isTemplate: true,
        isPublic: true,
        category: 'education',
        description: 'Untuk pertanyaan essay dengan gaya formal',
      },
      {
        userId: null,
        name: 'Programming Assistant',
        content: `You are a programming tutor. Explain code concepts clearly, provide working examples with comments, and help debug issues. Focus on best practices and clean code.`,
        isTemplate: true,
        isPublic: true,
        category: 'coding',
        description: 'For programming and coding questions',
      },
      {
        userId: testCustomer.id,
        name: 'Custom: Quick English Answer',
        content: `Answer in English, be concise and direct. For multiple choice, just state the letter and brief reason. Keep it simple.`,
        isTemplate: false,
        isPublic: false,
        category: 'quiz',
        description: 'Personal custom prompt for quick English answers',
      },
    ],
    skipDuplicates: true,
  });

  console.log('✅ System prompt templates created (5 templates: 4 public + 1 custom user)');

  // 4. Create test vouchers
  await prisma.voucher.createMany({
    data: [
      {
        code: 'NEWUSERPRAK',
        name: 'New User Premium Bonus',
        description: '5 kredit premium GRATIS untuk user baru! Daftar sekarang dan langsung pakai.',
        type: 'credit',
        discountType: 'fixed',
        value: 0,
        creditBonus: 5,
        maxUses: 10000,
        allowMultipleUsePerUser: false, // Only once per user
        isActive: true,
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      },
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
        description: '20 credits gratis untuk pembelian credit',
        type: 'credit',
        discountType: 'fixed',
        value: 0,
        creditBonus: 20,
        balanceBonus: 0,
        maxUses: 100,
        allowMultipleUsePerUser: false,
        isActive: true,
        startDate: new Date(),
      },
      {
        code: 'BALANCE10K',
        name: 'Balance Bonus 10K',
        description: 'Bonus Rp 10.000 untuk top-up balance',
        type: 'balance',
        discountType: 'fixed',
        value: 0,
        balanceBonus: 10000,
        minAmount: 50000,
        maxUses: 100,
        isActive: true,
        startDate: new Date(),
      },
      {
        code: 'CREDITFIRST',
        name: 'First Credit 30% Off',
        description: 'Diskon 30% pembelian credit pertama',
        type: 'credit',
        discountType: 'percentage',
        value: 30,
        minAmount: 100000,
        maxDiscount: 50000,
        maxUses: 100,
        allowMultipleUsePerUser: false,
        isActive: true,
        startDate: new Date(),
      },
    ],
    skipDuplicates: true,
  });

  console.log('✅ Test vouchers created (6 vouchers)');
  console.log(`   - NEWUSERPRAK: 5 credit bonus for new users (credit) - SPECIAL PROMO!`);
  console.log(`   - WELCOME10: 10 credit bonus (credit)`);
  console.log(`   - TOPUP50K: 50% balance discount (balance)`);
  console.log(`   - CREDIT20: 20 credit bonus (credit)`);
  console.log(`   - BALANCE10K: Rp 10K balance bonus (balance)`);
  console.log(`   - CREDITFIRST: 30% credit discount (credit)`);

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

  // 6. Create test extension sessions for customer
  const session1 = await prisma.extensionSession.create({
    data: {
      userId: testCustomer.id,
      sessionId: `sess_quiz_${Date.now()}`,
      sessionName: 'Quiz Session - Biology',
      systemPrompt: 'You are a helpful quiz assistant. Answer questions accurately.',
      answerMode: 'medium',
      requestMode: 'free_pool',
      provider: 'gemini',
      model: 'gemini-2.5-flash',
      knowledgeContext: 'Materi: Fotosintesis adalah proses pembuatan makanan pada tumbuhan menggunakan sinar matahari, air, dan CO2.',
      isActive: true,
    },
  });

  const session2 = await prisma.extensionSession.create({
    data: {
      userId: testCustomer.id,
      sessionId: `sess_custom_${Date.now() + 1}`,
      sessionName: 'Math Session - Custom Prompt',
      systemPrompt: 'You are a helpful quiz assistant.',
      customSystemPrompt: 'Kamu adalah guru matematika. Jelaskan setiap langkah dengan detail menggunakan Bahasa Indonesia. Gunakan contoh yang mudah dipahami.',
      useCustomPrompt: true,
      answerMode: 'long', // Tidak akan digunakan karena custom prompt aktif
      requestMode: 'free_user_key',
      provider: 'gemini',
      model: 'gemini-2.5-flash',
      isActive: true,
    },
  });

  const session3 = await prisma.extensionSession.create({
    data: {
      userId: testCustomer.id,
      sessionId: `sess_premium_${Date.now() + 2}`,
      sessionName: 'Premium Session - English Essay',
      systemPrompt: 'You are a helpful quiz assistant.',
      answerMode: 'long',
      requestMode: 'premium',
      provider: 'gemini',
      model: 'gemini-3-pro-preview',
      knowledgeContext: 'Essay topic: The impact of social media on modern society.',
      isActive: true,
    },
  });

  console.log('✅ Test extension sessions created (3 sessions)');
  console.log(`   - Session 1: Quiz Biology (medium mode, free_pool)`);
  console.log(`   - Session 2: Math Custom Prompt (useCustomPrompt=true, free_user_key)`);
  console.log(`   - Session 3: Premium English Essay (long mode, premium with Gemini 3)`);

  // 7. Create test knowledge files
  await prisma.knowledgeFile.createMany({
    data: [
      {
        userId: testCustomer.id,
        sessionId: session1.id,
        fileName: 'biologi-bab5-fotosintesis.pdf',
        fileType: 'pdf',
        fileSize: 245678,
        filePath: '/uploads/test/biologi-bab5.pdf',
        extractedText: `BAB 5: FOTOSINTESIS
        
Fotosintesis adalah proses pembuatan makanan pada tumbuhan hijau dengan bantuan sinar matahari. 
Proses ini terjadi di dalam kloroplas yang mengandung klorofil (zat hijau daun).

Rumus Fotosintesis:
6CO2 + 6H2O + Cahaya → C6H12O6 + 6O2

Tahapan:
1. Reaksi Terang: Terjadi di grana, menghasilkan ATP dan NADPH
2. Reaksi Gelap (Siklus Calvin): Terjadi di stroma, menghasilkan glukosa

Faktor yang mempengaruhi:
- Intensitas cahaya
- Konsentrasi CO2
- Suhu
- Ketersediaan air`,
        isActive: true,
      },
      {
        userId: testCustomer.id,
        sessionId: session2.id,
        fileName: 'matematika-aljabar.txt',
        fileType: 'txt',
        fileSize: 15234,
        filePath: '/uploads/test/math-algebra.txt',
        extractedText: `Materi Aljabar:

1. Persamaan Linear: ax + b = 0
   Solusi: x = -b/a

2. Persamaan Kuadrat: ax² + bx + c = 0
   Rumus ABC: x = (-b ± √(b²-4ac)) / 2a

3. Sistem Persamaan Linear:
   - Metode eliminasi
   - Metode substitusi
   - Metode grafik`,
        isActive: true,
      },
    ],
    skipDuplicates: true,
  });

  console.log('✅ Test knowledge files created (2 files: 1 PDF, 1 TXT)');

  console.log('\n✨ GenovaAI seeding completed successfully!');
  console.log('\n📊 Summary:');
  console.log('   - 2 users (1 customer with 10 credits + Rp.50.000, 1 admin)');
  console.log('   - 2 admin API keys (placeholders - replace with real)');
  console.log('   - 5 system prompt templates (4 public + 1 custom user)');
  console.log('   - 3 vouchers (WELCOME10, TOPUP50K, CREDIT20)');
  console.log('   - 1 welcome bonus transaction');
  console.log('   - 3 extension sessions:');
  console.log('     * Biology Quiz (medium, free_pool)');
  console.log('     * Math Custom (custom prompt, free_user_key)');
  console.log('     * English Essay (long, premium)');
  console.log('   - 2 knowledge files (PDF + TXT)');
  console.log('\n🔑 Login credentials:');
  console.log('   Email: customer@genovaai.test or admin@genovaai.test');
  console.log('   Password: Test123!@#');
  console.log('\n🎯 Test Scenarios:');
  console.log('   1. Free Pool Mode: Use Biology Quiz session (needs balance > 0)');
  console.log('   2. Free User Key: Use Math Custom session (needs user API key)');
  console.log('   3. Premium Mode: Use English Essay session (needs credits)');
  console.log('   4. Custom Prompt: Math session has custom prompt active');
  console.log('\n⚠️  Remember:');
  console.log('   - Replace admin API keys with real Gemini keys');
  console.log('   - Add user Gemini API key for free_user_key mode testing');
  console.log('   - Customer already has 10 credits for premium testing');

  // 5. Create system configuration
  console.log('\n🔧 Creating system configuration...');
  
  await prisma.systemConfig.upsert({
    where: { key: 'balance_to_credit_rate' },
    update: {
      value: '500',
      updatedAt: new Date(),
    },
    create: {
      key: 'balance_to_credit_rate',
      value: '500', // Rp 500 = 1 credit
      type: 'number',
      category: 'credits',
      label: 'Balance to Credit Exchange Rate',
      description: 'Amount of balance (in Rupiah) required to exchange for 1 credit',
    },
  });

  await prisma.systemConfig.upsert({
    where: { key: 'premium_mode_enabled' },
    update: {
      value: 'true',
      updatedAt: new Date(),
    },
    create: {
      key: 'premium_mode_enabled',
      value: 'true',
      type: 'boolean',
      category: 'features',
      label: 'Premium Mode Availability',
      description: 'Enable or disable Premium Mode for all users. When disabled, users will see "Under Maintenance" message.',
    },
  });

  await prisma.systemConfig.upsert({
    where: { key: 'topup_enabled' },
    update: {
      value: 'true',
      updatedAt: new Date(),
    },
    create: {
      key: 'topup_enabled',
      value: 'true',
      type: 'boolean',
      category: 'features',
      label: 'Top-Up Availability',
      description: 'Enable or disable Top-Up feature. When disabled, users will see "Under Maintenance - Please use Voucher" message.',
    },
  });

  console.log('✅ System configuration created');
  console.log('   - Exchange Rate: Rp 500 = 1 Credit');
  console.log('   - Premium Mode: Enabled');
  console.log('   - Top-Up Mode: Enabled');
}

seedGenovaAI()
  .catch((e) => {
    console.error('❌ Error seeding GenovaAI:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

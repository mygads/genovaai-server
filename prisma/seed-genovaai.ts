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
      credits: 0,
      balance: 50000,
      subscriptionStatus: 'free',
    },
  });

  await prisma.user.upsert({
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

  await prisma.user.upsert({
    where: { email: 'superadmin@genovaai.test' },
    update: {},
    create: {
      email: 'superadmin@genovaai.test',
      phone: '628987654322',
      password: hashedPassword,
      name: 'Test Super Admin',
      role: 'super_admin',
      emailVerified: new Date(),
      phoneVerified: new Date(),
      credits: 1000,
      balance: 1000000,
    },
  });

  console.log('✅ Test users created');
  console.log(`   - Customer: customer@genovaai.test`);
  console.log(`   - Admin: admin@genovaai.test`);
  console.log(`   - Super Admin: superadmin@genovaai.test`);
  console.log(`   - Password: Test123!@#`);

  await prisma.paidLLMModel.upsert({
    where: { modelId: 'gpt-4o-mini' },
    update: {
      enabled: true,
      pricePerRequest: 100,
      displayName: 'GPT-4o Mini',
    },
    create: {
      modelId: 'gpt-4o-mini',
      displayName: 'GPT-4o Mini',
      enabled: true,
      pricePerRequest: 100,
    },
  });

  await prisma.paidLLMModel.upsert({
    where: { modelId: 'gpt-4o' },
    update: {},
    create: {
      modelId: 'gpt-4o',
      displayName: 'GPT-4o',
      enabled: false,
      pricePerRequest: 500,
    },
  });

  console.log('✅ Paid model seed created');

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

  // 4. Create test discount vouchers
  await prisma.voucher.createMany({
    data: [
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
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    ],
    skipDuplicates: true,
  });

  console.log('✅ Test discount voucher created');
  console.log(`   - TOPUP50K: 50% balance top-up discount`);

  // 5. Create test extension sessions for customer
  const session1 = await prisma.extensionSession.create({
    data: {
      userId: testCustomer.id,
      sessionId: `sess_quiz_${Date.now()}`,
      sessionName: 'Quiz Session - Biology',
      systemPrompt: 'You are a helpful quiz assistant. Answer questions accurately.',
      answerMode: 'medium',
      requestMode: 'paid_balance',
      provider: 'openai_compatible',
      model: 'gpt-4o-mini',
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
      requestMode: 'paid_balance',
      provider: 'openai_compatible',
      model: 'gpt-4o-mini',
      isActive: true,
    },
  });

  await prisma.extensionSession.create({
    data: {
      userId: testCustomer.id,
      sessionId: `sess_paid_balance_${Date.now() + 2}`,
      sessionName: 'Paid Balance Session - English Essay',
      systemPrompt: 'You are a helpful quiz assistant.',
      answerMode: 'long',
      requestMode: 'paid_balance',
      provider: 'openai_compatible',
      model: 'gpt-4o-mini',
      knowledgeContext: 'Essay topic: The impact of social media on modern society.',
      isActive: true,
    },
  });

  console.log('✅ Test extension sessions created (3 paid balance sessions)');
  console.log(`   - Session 1: Quiz Biology (medium mode, paid_balance)`);
  console.log(`   - Session 2: Math Custom Prompt (useCustomPrompt=true, paid_balance)`);
  console.log(`   - Session 3: English Essay (long mode, paid_balance)`);

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
  console.log('   - 3 users (customer, admin, super admin)');
  console.log('   - 2 paid model seeds (1 enabled, 1 disabled)');
  console.log('   - 5 system prompt templates (4 public + 1 custom user)');
  console.log('   - 1 balance top-up discount voucher');
  console.log('   - 3 paid balance extension sessions');
  console.log('   - 2 knowledge files (PDF + TXT)');
  console.log('\n🔑 Login credentials:');
  console.log('   Email: customer@genovaai.test, admin@genovaai.test, or superadmin@genovaai.test');
  console.log('   Password: Test123!@#');
  console.log('\n🎯 Test Scenarios:');
  console.log('   1. Paid Balance: Use seeded sessions with an enabled paid model');
  console.log('   2. BYOK: Add an OpenAI-compatible provider in customer settings');
  console.log('   3. Admin Models: Fetch models from PAID_LLM_BASE_URL and set prices');
  console.log('   4. Custom Prompt: Math session has custom prompt active');
  console.log('\n⚠️  Remember:');
  console.log('   - Set PAID_LLM_BASE_URL and PAID_LLM_API_KEY for paid balance mode');

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
    where: { key: 'paid_balance_enabled' },
    update: {
      value: 'true',
      updatedAt: new Date(),
    },
    create: {
      key: 'paid_balance_enabled',
      value: 'true',
      type: 'boolean',
      category: 'features',
      label: 'Paid Balance Availability',
      description: 'Enable or disable paid balance mode for all users.',
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
  console.log('   - Paid Balance Mode: Enabled');
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

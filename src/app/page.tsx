import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "GenovaAI - Asisten AI Pintar untuk Belajar, Riset & Memahami Konsep Sulit | Gemini & GPT",
  description: "GenovaAI: Chrome Extension AI terbaik dengan Gemini 2.0 Pro & GPT-4 untuk menjawab pertanyaan, menjelaskan konsep sulit, riset cepat, dan membantu belajar. Gratis 5 kredit premium! Hanya Rp 500/kredit. Support PDF, custom knowledge base.",
  keywords: "genovaai, ai assistant indonesia, chrome extension ai, asisten belajar ai, riset dengan ai, pahami konsep sulit, gemini pro indonesia, gpt-4 indonesia, ai untuk mahasiswa, ai research assistant, homework helper, study ai tool",
  openGraph: {
    title: "GenovaAI - Asisten AI Pintar untuk Belajar & Riset",
    description: "Chrome Extension AI dengan Gemini 2.0 Pro & GPT-4. Gratis 5 kredit premium! Mulai dari Rp 500/kredit. Jawab pertanyaan, pahami konsep sulit, riset cepat.",
    type: "website",
    locale: "id_ID",
  },
  twitter: {
    card: "summary_large_image",
    title: "GenovaAI - Asisten AI untuk Belajar & Riset",
    description: "Chrome Extension AI dengan Gemini & GPT. Gratis 5 kredit premium! Jawab pertanyaan & pahami konsep sulit.",
  },
};

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
      {/* Navbar */}
      <nav className="border-b border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">G</span>
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">GenovaAI</span>
            </div>
            <div className="hidden md:flex items-center gap-6">
              <a 
                href="#cara-penggunaan" 
                className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Cara Pakai
              </a>
              <a 
                href="#download-extension" 
                className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Download Extension
              </a>
              <a 
                href="#faq" 
                className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                FAQ
              </a>
              <Link 
                href="/login" 
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Login
              </Link>
              <Link 
                href="/register" 
                className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all shadow-md hover:shadow-lg"
              >
                Register
              </Link>
            </div>
            {/* Mobile Menu - Simplified */}
            <div className="flex md:hidden items-center gap-4">
              <Link 
                href="/login" 
                className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors text-sm"
              >
                Login
              </Link>
              <Link 
                href="/register" 
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all shadow-md hover:shadow-lg text-sm"
              >
                Register
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <div className="inline-block px-4 py-2 bg-blue-100 dark:bg-blue-900/30 rounded-full text-blue-700 dark:text-blue-300 text-sm font-medium mb-6">
          🎓 AI-Powered Study Assistant
        </div>
        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
          Belajar, Riset & Pahami Konsep Sulit dengan
          <span className="bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent"> AI Gemini & GPT</span>
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-10">
          GenovaAI membantu Anda mendapatkan jawaban cepat, memahami konsep yang sulit, melakukan riset, dan belajar lebih efektif. Didukung Gemini 2.0 Pro & GPT-4 dengan knowledge base custom, upload PDF, dan analisis mendalam.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link 
            href="/register" 
            className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl text-lg font-semibold"
          >
            Mulai Gratis
          </Link>
          <Link 
            href="/dashboard" 
            className="px-8 py-4 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:border-gray-400 dark:hover:border-gray-500 transition-all text-lg font-semibold"
          >
            Lihat Dashboard
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Fitur Unggulan</h2>
          <p className="text-lg text-gray-600 dark:text-gray-300">Lengkap untuk belajar, riset, dan memahami konsep dengan AI</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-md hover:shadow-xl transition-all border border-gray-200 dark:border-gray-700">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mb-4">
              <span className="text-2xl">🎯</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Jawab Pertanyaan Apapun</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Dari soal kuis sederhana hingga konsep kompleks - GenovaAI bisa menjawab dengan 4 mode: Single (cepat), Short (ringkas), Medium (detail), Long (analisis mendalam).
            </p>
          </div>

          {/* Feature 2 */}
          <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-md hover:shadow-xl transition-all border border-gray-200 dark:border-gray-700">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center mb-4">
              <span className="text-2xl">📚</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Knowledge Base & Upload Dokumen</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Upload PDF, DOCX, TXT materi kuliah, buku, atau paper. AI akan menganalisis dan menjawab berdasarkan dokumen Anda - perfect untuk riset dan studi mendalam.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-md hover:shadow-xl transition-all border border-gray-200 dark:border-gray-700">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center mb-4">
              <span className="text-2xl">✏️</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Custom System Prompt</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Buat prompt custom untuk domain spesifik (hukum, kedokteran, teknik, bisnis). Kontrol penuh atas gaya jawaban, bahasa, dan format output AI.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-md hover:shadow-xl transition-all border border-gray-200 dark:border-gray-700">
            <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl flex items-center justify-center mb-4">
              <span className="text-2xl">🔑</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">3 Flexible Request Modes</h3>
            <p className="text-gray-600 dark:text-gray-300">
              <strong>Free:</strong> Pakai API key sendiri (unlimited). <strong>Free Pool:</strong> Gratis pakai pool kami (min saldo Rp 1). <strong>Premium:</strong> Rp 500/request untuk model terbaik.
            </p>
          </div>

          {/* Feature 5 */}
          <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-md hover:shadow-xl transition-all border border-gray-200 dark:border-gray-700">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center mb-4">
              <span className="text-2xl">💬</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Smart Chat History</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Semua percakapan tersimpan otomatis dengan search, filter, bookmark, dan rating. Export ke PDF untuk dokumentasi atau review materi.
            </p>
          </div>

          {/* Feature 6 */}
          <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-md hover:shadow-xl transition-all border border-gray-200 dark:border-gray-700">
            <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center mb-4">
              <span className="text-2xl">🚀</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Premium AI Models</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Akses ke Gemini 2.0 Pro, GPT-4, dan model premium lainnya. Reasoning lebih baik, analisis mendalam, jawaban lebih akurat, dan response lebih cepat.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Harga yang Terjangkau</h2>
          <p className="text-lg text-gray-600 dark:text-gray-300">Pilih paket yang sesuai dengan kebutuhan Anda</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {/* Free Plan */}
          <div className="p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Free</h3>
            <div className="mb-6">
              <span className="text-4xl font-bold text-gray-900 dark:text-white">Rp 0</span>
              <span className="text-gray-600 dark:text-gray-400">/bulan</span>
            </div>
            <ul className="space-y-3 mb-8">
              <li className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                <span className="text-green-500 mt-1">✓</span>
                <span>Gunakan API key Gemini sendiri</span>
              </li>
              <li className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                <span className="text-green-500 mt-1">✓</span>
                <span>Unlimited requests (sesuai limit API key)</span>
              </li>
              <li className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                <span className="text-green-500 mt-1">✓</span>
                <span>Knowledge base upload</span>
              </li>
              <li className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                <span className="text-green-500 mt-1">✓</span>
                <span>Custom prompt support</span>
              </li>
              <li className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                <span className="text-green-500 mt-1">✓</span>
                <span>Chat history</span>
              </li>
            </ul>
            <Link 
              href="/register" 
              className="block w-full py-3 text-center border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:border-gray-400 dark:hover:border-gray-500 transition-all font-semibold"
            >
              Mulai Gratis
            </Link>
          </div>

          {/* Pool Plan */}
          <div className="p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border-2 border-blue-500 relative">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-bold rounded-full">
              POPULER
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Pool Free</h3>
            <div className="mb-6">
              <span className="text-4xl font-bold text-gray-900 dark:text-white">Rp 0</span>
              <span className="text-gray-600 dark:text-gray-400">/request</span>
            </div>
            <ul className="space-y-3 mb-8">
              <li className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                <span className="text-green-500 mt-1">✓</span>
                <span>Gunakan pool API key (gratis)</span>
              </li>
              <li className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                <span className="text-green-500 mt-1">✓</span>
                <span>Wajib punya saldo (min Rp 1)</span>
              </li>
              <li className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                <span className="text-green-500 mt-1">✓</span>
                <span>Smart retry system</span>
              </li>
              <li className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                <span className="text-green-500 mt-1">✓</span>
                <span>Auto fallback ke admin key</span>
              </li>
              <li className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                <span className="text-green-500 mt-1">✓</span>
                <span>Semua fitur Free Plan</span>
              </li>
            </ul>
            <Link 
              href="/register" 
              className="block w-full py-3 text-center bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all font-semibold shadow-lg"
            >
              Mulai Sekarang
            </Link>
          </div>

          {/* Premium Plan */}
          <div className="p-8 bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl shadow-xl text-white">
            <h3 className="text-2xl font-bold mb-2">Premium</h3>
            <div className="mb-6">
              <span className="text-4xl font-bold">Rp 500</span>
              <span className="text-purple-100">/ kredit</span>
            </div>
            <div className="mb-4 text-sm text-purple-100">
              Mulai dari <span className="font-bold text-white">Rp 10.000 untuk 20 kredit</span>
            </div>
            <ul className="space-y-3 mb-8">
              <li className="flex items-start gap-2">
                <span className="text-yellow-300 mt-1">★</span>
                <span>Gemini 2.0 Flash & Pro Preview</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-300 mt-1">★</span>
                <span>Model premium lainnya</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-300 mt-1">★</span>
                <span>1 request = 1 kredit</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-300 mt-1">★</span>
                <span>Response lebih cepat</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-300 mt-1">★</span>
                <span>Reasoning lebih baik</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-300 mt-1">★</span>
                <span className="font-bold">BONUS: 5 kredit gratis dengan kode NEWUSERPRAK</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* How to Use Section */}
      <section id="cara-penggunaan" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 bg-gray-50 dark:bg-gray-800/50 rounded-3xl">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Cara Menggunakan GenovaAI</h2>
          <p className="text-lg text-gray-600 dark:text-gray-300">Panduan lengkap untuk memaksimalkan GenovaAI Extension</p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Step 1 */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-blue-500 text-white rounded-full flex items-center justify-center text-xl font-bold">1</div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Install Extension</h3>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Download GenovaAI Chrome Extension dan install ke browser Chrome Anda. Klik tombol download di bawah dan ikuti petunjuk instalasi.
            </p>
            <a 
              href="#download-extension"
              className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline font-semibold"
            >
              Lihat Cara Install → 
            </a>
          </div>

          {/* Step 2 */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-purple-500 text-white rounded-full flex items-center justify-center text-xl font-bold">2</div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Register & Login</h3>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Daftar akun GenovaAI dan dapatkan 5 kredit premium gratis dengan kode voucher <span className="font-bold text-purple-600 dark:text-purple-400">NEWUSERPRAK</span>. Login di extension untuk memulai.
            </p>
            <Link 
              href="/register"
              className="inline-flex items-center gap-2 text-purple-600 dark:text-purple-400 hover:underline font-semibold"
            >
              Daftar Sekarang →
            </Link>
          </div>

          {/* Step 3 */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-green-500 text-white rounded-full flex items-center justify-center text-xl font-bold">3</div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Atur Preferences</h3>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Klik icon GenovaAI di toolbar Chrome, buka Settings/Preferences untuk mengatur:
            </p>
            <ul className="space-y-2 text-gray-600 dark:text-gray-300">
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-1">✓</span>
                <span><strong>Request Mode:</strong> Free (API Key sendiri), Free Pool (gratis pakai pool), atau Premium</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-1">✓</span>
                <span><strong>Answer Length:</strong> Single, Short, Medium, atau Long</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-1">✓</span>
                <span><strong>Model Selection:</strong> Pilih model AI sesuai kebutuhan</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-1">✓</span>
                <span><strong>Upload Knowledge Base:</strong> Upload PDF/DOCX sebagai referensi</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-1">✓</span>
                <span><strong>Custom Prompt:</strong> Buat system prompt custom Anda sendiri</span>
              </li>
            </ul>
          </div>

          {/* Step 4 */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-orange-500 text-white rounded-full flex items-center justify-center text-xl font-bold">4</div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Mulai Bertanya</h3>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Gunakan bubble chat yang muncul di halaman web atau klik icon extension untuk bertanya:
            </p>
            <ul className="space-y-2 text-gray-600 dark:text-gray-300">
              <li className="flex items-start gap-2">
                <span className="text-orange-500 mt-1">•</span>
                <span>Ketik pertanyaan langsung atau copy-paste soal</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-500 mt-1">•</span>
                <span>AI akan menjawab sesuai mode dan preference yang Anda set</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-500 mt-1">•</span>
                <span>Semua chat history tersimpan otomatis</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-500 mt-1">•</span>
                <span>Bisa bookmark dan rating jawaban</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Additional Tips */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl p-8 border border-blue-200 dark:border-blue-800">
          <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span className="text-2xl">💡</span> Tips Memaksimalkan GenovaAI
          </h4>
          <div className="grid md:grid-cols-2 gap-4 text-gray-700 dark:text-gray-300">
            <div>
              <strong>✓ Mode Free Pool:</strong> Pastikan saldo minimal Rp 1 untuk akses gratis dengan pool API key
            </div>
            <div>
              <strong>✓ Upload Knowledge Base:</strong> Upload materi kuliah/buku untuk jawaban yang lebih akurat
            </div>
            <div>
              <strong>✓ Custom Prompt:</strong> Buat prompt khusus untuk domain spesifik (hukum, kedokteran, dll)
            </div>
            <div>
              <strong>✓ Premium Mode:</strong> Hanya Rp 500/kredit untuk jawaban tercepat dan terakurat
            </div>
          </div>
        </div>
      </section>

      {/* Extension Download Section */}
      <section id="download-extension" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Download GenovaAI Extension</h2>
          <p className="text-lg text-gray-600 dark:text-gray-300">Pasang extension Chrome dalam 3 langkah mudah</p>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* Download Options */}
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            {/* Option 1: Direct Download (Recommended) */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-3xl p-8 text-center text-white shadow-2xl relative">
              <div className="absolute -top-3 right-6 bg-yellow-400 text-gray-900 text-xs font-bold px-3 py-1 rounded-full">
                ⭐ RECOMMENDED
              </div>
              <div className="text-5xl mb-4">📦</div>
              <h3 className="text-2xl font-bold mb-3">Download Langsung</h3>
              <p className="text-green-100 mb-6">Tanpa perlu unzip, langsung load ke Chrome!</p>
              <a 
                href="https://github.com/mygads/genovaai-extension/archive/refs/heads/main.zip"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-8 py-3 bg-white text-green-600 rounded-xl hover:bg-gray-100 transition-all text-lg font-bold shadow-lg hover:shadow-xl"
              >
                📥 Download dari GitHub
              </a>
              <p className="text-sm mt-4 text-green-100">Extract → Masuk folder dist → Load unpacked</p>
            </div>

            {/* Option 2: ZIP File (Backup) */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-3xl p-8 text-center text-white shadow-2xl">
              <div className="text-5xl mb-4">🗜️</div>
              <h3 className="text-2xl font-bold mb-3">Download ZIP</h3>
              <p className="text-purple-100 mb-6">File ZIP extension siap pakai</p>
              <a 
                href="/genova-extension.zip"
                download
                className="inline-block px-8 py-3 bg-white text-purple-600 rounded-xl hover:bg-gray-100 transition-all text-lg font-bold shadow-lg hover:shadow-xl"
              >
                ⬇️ Download ZIP (~2MB)
              </a>
              <p className="text-sm mt-4 text-purple-100">Extract dulu, lalu load unpacked</p>
            </div>
          </div>

          {/* Quick Guide */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-6 mb-8 border border-blue-200 dark:border-blue-800">
            <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <span className="text-2xl">⚡</span> Cara Tercepat (3 Langkah)
            </h4>
            <ol className="space-y-2 text-gray-700 dark:text-gray-300">
              <li><strong>1.</strong> Download & extract file di atas</li>
              <li><strong>2.</strong> Buka Chrome → <code className="bg-white dark:bg-gray-800 px-2 py-1 rounded text-sm">chrome://extensions</code> → Aktifkan <strong>Developer mode</strong></li>
              <li><strong>3.</strong> Klik <strong>"Load unpacked"</strong> → Pilih folder <code className="bg-white dark:bg-gray-800 px-2 py-1 rounded text-sm">dist</code> (dari hasil extract) → Selesai! 🎉</li>
            </ol>
          </div>

          {/* Installation Steps */}
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-8">Panduan Instalasi Detail</h3>
            
            {/* Step 1 */}
            <div className="flex gap-6 bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
              <div className="shrink-0">
                <div className="w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center text-lg font-bold">1</div>
              </div>
              <div>
                <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Download & Extract File</h4>
                <p className="text-gray-600 dark:text-gray-300 mb-3">
                  Download salah satu file di atas. Extract file ZIP ke folder di komputer Anda (misal: <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">C:\Extensions\GenovaAI</code>).
                </p>
                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-sm text-blue-800 dark:text-blue-300">
                    <strong>📁 PENTING:</strong> Setelah extract, cari folder bernama <strong>dist</strong> di dalam hasil extract. Folder <strong>dist</strong> inilah yang akan di-load ke Chrome (bukan folder induknya).
                  </p>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex gap-6 bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-purple-500 text-white rounded-full flex items-center justify-center text-lg font-bold">2</div>
              </div>
              <div>
                <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Buka Chrome Extensions</h4>
                <p className="text-gray-600 dark:text-gray-300 mb-3">
                  Buka browser Chrome, ketik di address bar:
                </p>
                <code className="block bg-gray-100 dark:bg-gray-700 px-4 py-3 rounded-lg text-sm">
                  chrome://extensions
                </code>
                <p className="text-gray-600 dark:text-gray-300 mt-3">
                  Atau klik menu <strong>⋮</strong> (pojok kanan atas) → <strong>Extensions</strong> → <strong>Manage Extensions</strong>
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex gap-6 bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-green-500 text-white rounded-full flex items-center justify-center text-lg font-bold">3</div>
              </div>
              <div>
                <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Aktifkan Developer Mode</h4>
                <p className="text-gray-600 dark:text-gray-300">
                  Di halaman Extensions, aktifkan toggle <strong>Developer mode</strong> di pojok kanan atas. 
                  Setelah aktif, akan muncul tombol <strong>"Load unpacked"</strong>.
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="flex gap-6 bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
              <div className="shrink-0">
                <div className="w-10 h-10 bg-orange-500 text-white rounded-full flex items-center justify-center text-lg font-bold">4</div>
              </div>
              <div>
                <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Load Extension</h4>
                <p className="text-gray-600 dark:text-gray-300 mb-3">
                  Klik tombol <strong>&ldquo;Load unpacked&rdquo;</strong>, lalu pilih folder <strong>dist</strong> yang ada di dalam hasil extract.
                </p>
                <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-200 dark:border-green-800 mb-3">
                  <p className="text-sm text-green-800 dark:text-green-300">
                    <strong>✅ Path yang benar:</strong><br/>
                    <code className="text-xs">C:\Extensions\GenovaAI-main\<span className="font-bold text-green-600 dark:text-green-400">dist</span></code><br/>
                    (Folder yang berisi <code>manifest.json</code>, <code>service-worker-loader.js</code>, dll)
                  </p>
                </div>
                <p className="text-gray-600 dark:text-gray-300">
                  ✅ Extension GenovaAI berhasil terpasang! Icon <strong>G</strong> akan muncul di toolbar Chrome.
                </p>
              </div>
            </div>

            {/* Step 5 */}
            <div className="flex gap-6 bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border-2 border-green-500">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-green-600 text-white rounded-full flex items-center justify-center text-lg font-bold">5</div>
              </div>
              <div>
                <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Login & Mulai Pakai</h4>
                <p className="text-gray-600 dark:text-gray-300 mb-3">
                  Klik icon GenovaAI di toolbar, login dengan akun Anda, dan mulai bertanya! 
                </p>
                <p className="text-green-600 dark:text-green-400 font-bold">
                  🎁 Jangan lupa gunakan kode voucher <code className="bg-green-100 dark:bg-green-900 px-2 py-1 rounded">NEWUSERPRAK</code> untuk 5 kredit premium gratis!
                </p>
              </div>
            </div>
          </div>

          {/* Troubleshooting */}
          <div className="mt-12 bg-yellow-50 dark:bg-yellow-900/20 rounded-2xl p-6 border border-yellow-200 dark:border-yellow-800">
            <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <span className="text-2xl">⚠️</span> Troubleshooting
            </h4>
            <ul className="space-y-2 text-gray-700 dark:text-gray-300 text-sm">
              <li><strong>Extension tidak muncul:</strong> Pastikan Developer Mode sudah ON dan Anda memilih folder <strong>dist</strong> (bukan folder induk)</li>
              <li><strong>Error &ldquo;manifest.json not found&rdquo;:</strong> Anda salah pilih folder. Pilih folder <strong>dist</strong> yang berisi file manifest.json</li>
              <li><strong>Error saat load:</strong> Coba extract ulang file ZIP atau download ulang extension dari GitHub</li>
              <li><strong>Tidak bisa login:</strong> Pastikan sudah register di website GenovaAI terlebih dahulu</li>
              <li><strong>Folder dist tidak ada:</strong> Download dari GitHub yang sudah include folder dist. Jika download source code, jalankan <code className="bg-white dark:bg-gray-800 px-2 py-1 rounded">npm run build</code> dulu</li>
              <li><strong>Butuh bantuan?</strong> Hubungi support@genfity.com atau lihat dokumentasi lengkap di dashboard</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Extension Preferences Guide */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 bg-gray-50 dark:bg-gray-800/50 rounded-3xl">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Kelola Preferences Extension</h2>
          <p className="text-lg text-gray-600 dark:text-gray-300">Atur extension sesuai kebutuhan Anda untuk hasil maksimal</p>
        </div>

        <div className="max-w-4xl mx-auto space-y-8">
          {/* How to Access */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="text-3xl">⚙️</span> Cara Membuka Settings/Preferences
            </h3>
            <div className="space-y-3 text-gray-600 dark:text-gray-300">
              <p><strong>Method 1:</strong> Klik icon GenovaAI di toolbar Chrome → Klik tombol <strong>"Settings"</strong> atau <strong>"⚙️"</strong></p>
              <p><strong>Method 2:</strong> Klik kanan icon GenovaAI → Pilih <strong>"Options"</strong></p>
              <p><strong>Method 3:</strong> Buka <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">chrome://extensions</code> → Cari GenovaAI → Klik <strong>"Details"</strong> → Klik <strong>"Extension options"</strong></p>
            </div>
          </div>

          {/* Settings Overview */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Request Mode */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
              <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-3">🔑 Request Mode</h4>
              <p className="text-gray-600 dark:text-gray-300 mb-3">Pilih cara menggunakan GenovaAI:</p>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="font-bold text-blue-600">Free:</span>
                  <span>Gunakan API key Gemini sendiri (unlimited)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-green-600">Free Pool:</span>
                  <span>Pakai pool API gratis (butuh saldo min Rp 1)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-purple-600">Premium:</span>
                  <span>Pakai kredit premium (Rp 500/request)</span>
                </li>
              </ul>
            </div>

            {/* Answer Length */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
              <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-3">📏 Answer Length</h4>
              <p className="text-gray-600 dark:text-gray-300 mb-3">Atur panjang jawaban AI:</p>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                <li><strong>Single:</strong> Hanya jawaban (misal: A)</li>
                <li><strong>Short:</strong> Jawaban + penjelasan singkat</li>
                <li><strong>Medium:</strong> Penjelasan 5-10 kata</li>
                <li><strong>Long:</strong> Penjelasan detail lengkap</li>
              </ul>
            </div>

            {/* Model Selection */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
              <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-3">🤖 Model Selection</h4>
              <p className="text-gray-600 dark:text-gray-300 mb-3">Pilih model AI yang digunakan:</p>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                <li><strong>Gemini 2.0 Flash:</strong> Cepat & efisien (Free/Pool)</li>
                <li><strong>Gemini 2.0 Pro:</strong> Reasoning terbaik (Premium)</li>
                <li><strong>Custom:</strong> Model lain sesuai ketersediaan</li>
              </ul>
            </div>

            {/* Knowledge Base */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
              <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-3">📚 Knowledge Base</h4>
              <p className="text-gray-600 dark:text-gray-300 mb-3">Upload file sebagai referensi:</p>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                <li>✓ Support PDF, DOCX, TXT</li>
                <li>✓ Multiple files bisa diupload</li>
                <li>✓ AI jawab berdasarkan materi Anda</li>
                <li>✓ Cocok untuk soal spesifik dari buku/materi</li>
              </ul>
            </div>

            {/* Custom Prompt */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
              <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-3">✏️ Custom System Prompt</h4>
              <p className="text-gray-600 dark:text-gray-300 mb-3">Buat prompt sesuai kebutuhan:</p>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                <li>✓ Kontrol penuh gaya jawaban</li>
                <li>✓ Cocok untuk domain spesifik</li>
                <li>✓ Bisa set bahasa, format, tone</li>
                <li>✓ Simpan & gunakan berkali-kali</li>
              </ul>
            </div>

            {/* Other Settings */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
              <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-3">🎛️ Pengaturan Lainnya</h4>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                <li>✓ <strong>Auto-save Chat:</strong> Simpan otomatis semua percakapan</li>
                <li>✓ <strong>Bubble Position:</strong> Atur posisi chat bubble</li>
                <li>✓ <strong>Theme:</strong> Light/Dark mode</li>
                <li>✓ <strong>Notifications:</strong> Notifikasi kredit & status</li>
              </ul>
            </div>
          </div>

          {/* Pro Tips */}
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-2xl p-8 border border-purple-200 dark:border-purple-800">
            <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="text-2xl">🎯</span> Pro Tips untuk Preferences
            </h4>
            <div className="space-y-3 text-gray-700 dark:text-gray-300">
              <p><strong>💡 Untuk soal pilihan ganda:</strong> Gunakan Answer Length "Single" atau "Short" agar cepat</p>
              <p><strong>💡 Untuk essay:</strong> Gunakan "Medium" atau "Long" untuk penjelasan detail</p>
              <p><strong>💡 Hemat kredit:</strong> Gunakan Free Pool mode dengan saldo minimal untuk gratis</p>
              <p><strong>💡 Jawaban akurat:</strong> Upload knowledge base (PDF materi kuliah) sebelum bertanya</p>
              <p><strong>💡 Domain spesifik:</strong> Buat custom prompt untuk hukum, kedokteran, teknik, dll</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Pertanyaan yang Sering Diajukan (FAQ)</h2>
          <p className="text-lg text-gray-600 dark:text-gray-300">Temukan jawaban untuk pertanyaan umum tentang GenovaAI</p>
        </div>

        <div className="max-w-4xl mx-auto space-y-4">
          {/* FAQ 1 */}
          <details className="bg-white dark:bg-gray-800 rounded-2xl shadow-md group">
            <summary className="p-6 cursor-pointer list-none flex items-center justify-between font-semibold text-lg text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              <span>Apa itu GenovaAI?</span>
              <span className="text-2xl group-open:rotate-180 transition-transform">▼</span>
            </summary>
            <div className="px-6 pb-6 text-gray-600 dark:text-gray-300">
              <p>GenovaAI adalah Chrome Extension AI assistant yang membantu Anda belajar, riset, dan memahami konsep sulit dengan cepat. Didukung model AI terkini seperti Gemini 2.0 Pro dan GPT-4, GenovaAI dapat menjawab pertanyaan, menjelaskan materi kompleks, membantu mengerjakan tugas, dan memberikan insight mendalam berdasarkan dokumen/knowledge base yang Anda upload.</p>
            </div>
          </details>

          {/* FAQ 2 */}
          <details className="bg-white dark:bg-gray-800 rounded-2xl shadow-md group">
            <summary className="p-6 cursor-pointer list-none flex items-center justify-between font-semibold text-lg text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              <span>Berapa harga GenovaAI?</span>
              <span className="text-2xl group-open:rotate-180 transition-transform">▼</span>
            </summary>
            <div className="px-6 pb-6 text-gray-600 dark:text-gray-300">
              <p className="mb-3"><strong>GenovaAI tersedia dalam 3 mode:</strong></p>
              <ul className="space-y-2">
                <li>• <strong>Mode Gratis (Free):</strong> Gunakan API key Gemini Anda sendiri - unlimited dan gratis!</li>
                <li>• <strong>Mode Free Pool:</strong> Pakai pool API key gratis (butuh saldo minimal Rp 1 sebagai verifikasi)</li>
                <li>• <strong>Mode Premium:</strong> Hanya <strong>Rp 500 per request</strong> untuk akses model premium (Gemini 2.0 Pro, GPT-4, dll)</li>
              </ul>
              <p className="mt-3 text-green-600 dark:text-green-400 font-bold">🎁 Bonus: Dapatkan 5 kredit premium GRATIS dengan kode voucher NEWUSERPRAK saat register!</p>
            </div>
          </details>

          {/* FAQ 3 */}
          <details className="bg-white dark:bg-gray-800 rounded-2xl shadow-md group">
            <summary className="p-6 cursor-pointer list-none flex items-center justify-between font-semibold text-lg text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              <span>Apa saja yang bisa dilakukan GenovaAI?</span>
              <span className="text-2xl group-open:rotate-180 transition-transform">▼</span>
            </summary>
            <div className="px-6 pb-6 text-gray-600 dark:text-gray-300">
              <p className="mb-3"><strong>GenovaAI dapat membantu Anda:</strong></p>
              <ul className="space-y-2">
                <li>✓ Menjawab soal kuis, ujian, dan tugas (pilihan ganda, essay, isian)</li>
                <li>✓ Menjelaskan konsep yang sulit dipahami dengan bahasa sederhana</li>
                <li>✓ Melakukan riset cepat dari berbagai sumber</li>
                <li>✓ Menganalisis dokumen PDF, DOCX, TXT yang Anda upload</li>
                <li>✓ Memberikan insight dan summary dari materi panjang</li>
                <li>✓ Menulis essay, artikel, atau laporan berdasarkan referensi</li>
                <li>✓ Debugging code dan menjelaskan programming concepts</li>
                <li>✓ Translation dan parafrase teks dengan konteks yang tepat</li>
              </ul>
              <p className="mt-3">Intinya, apapun yang butuh pemahaman mendalam dan analisis, GenovaAI siap membantu!</p>
            </div>
          </details>

          {/* FAQ 4 */}
          <details className="bg-white dark:bg-gray-800 rounded-2xl shadow-md group">
            <summary className="p-6 cursor-pointer list-none flex items-center justify-between font-semibold text-lg text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              <span>Bagaimana cara menggunakan GenovaAI?</span>
              <span className="text-2xl group-open:rotate-180 transition-transform">▼</span>
            </summary>
            <div className="px-6 pb-6 text-gray-600 dark:text-gray-300">
              <ol className="space-y-2">
                <li><strong>1.</strong> Download dan install Chrome Extension GenovaAI</li>
                <li><strong>2.</strong> Register akun di website GenovaAI (gunakan kode NEWUSERPRAK untuk bonus)</li>
                <li><strong>3.</strong> Login di extension dan atur preferences (request mode, answer length, model AI)</li>
                <li><strong>4.</strong> Upload knowledge base jika perlu (PDF, DOCX materi kuliah/buku)</li>
                <li><strong>5.</strong> Mulai bertanya lewat bubble chat atau icon extension</li>
              </ol>
              <p className="mt-3">Lihat <a href="#cara-penggunaan" className="text-blue-600 dark:text-blue-400 hover:underline">panduan lengkap</a> untuk detail lebih lanjut.</p>
            </div>
          </details>

          {/* FAQ 5 */}
          <details className="bg-white dark:bg-gray-800 rounded-2xl shadow-md group">
            <summary className="p-6 cursor-pointer list-none flex items-center justify-between font-semibold text-lg text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              <span>Model AI apa saja yang didukung?</span>
              <span className="text-2xl group-open:rotate-180 transition-transform">▼</span>
            </summary>
            <div className="px-6 pb-6 text-gray-600 dark:text-gray-300">
              <p className="mb-3"><strong>GenovaAI mendukung berbagai model AI terkini:</strong></p>
              <ul className="space-y-2">
                <li>• <strong>Google Gemini 2.0 Flash:</strong> Cepat dan efisien (Free & Pool mode)</li>
                <li>• <strong>Google Gemini 2.0 Pro:</strong> Reasoning terbaik, analisis mendalam (Premium)</li>
                <li>• <strong>OpenAI GPT-4:</strong> Powerful untuk creative writing & complex reasoning (Premium)</li>
                <li>• Dan model premium lainnya yang terus diupdate</li>
              </ul>
              <p className="mt-3">Mode Free: Gunakan model yang didukung API key Anda. Mode Premium: Akses semua model premium dengan 1 kredit per request.</p>
            </div>
          </details>

          {/* FAQ 6 */}
          <details className="bg-white dark:bg-gray-800 rounded-2xl shadow-md group">
            <summary className="p-6 cursor-pointer list-none flex items-center justify-between font-semibold text-lg text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              <span>Apa itu Knowledge Base dan bagaimana cara menggunakannya?</span>
              <span className="text-2xl group-open:rotate-180 transition-transform">▼</span>
            </summary>
            <div className="px-6 pb-6 text-gray-600 dark:text-gray-300">
              <p className="mb-3">Knowledge Base adalah fitur untuk upload dokumen (PDF, DOCX, TXT) yang akan dijadikan referensi AI saat menjawab pertanyaan Anda. Sangat berguna untuk:</p>
              <ul className="space-y-2">
                <li>• Upload materi kuliah/textbook → AI jawab berdasarkan materi tersebut</li>
                <li>• Upload slide presentasi → AI jelaskan konsep dari slide</li>
                <li>• Upload research paper → AI extract insight dan summary</li>
                <li>• Upload dokumen hukum/kontrak → AI analisis dan jelaskan poin-poin penting</li>
              </ul>
              <p className="mt-3">Cara pakai: Buka extension settings → Upload files → AI akan otomatis gunakan dokumen tersebut sebagai konteks.</p>
            </div>
          </details>

          {/* FAQ 7 */}
          <details className="bg-white dark:bg-gray-800 rounded-2xl shadow-md group">
            <summary className="p-6 cursor-pointer list-none flex items-center justify-between font-semibold text-lg text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              <span>Bagaimana cara mendapatkan API key Gemini gratis?</span>
              <span className="text-2xl group-open:rotate-180 transition-transform">▼</span>
            </summary>
            <div className="px-6 pb-6 text-gray-600 dark:text-gray-300">
              <ol className="space-y-2">
                <li><strong>1.</strong> Kunjungi <a href="https://ai.google.dev" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">Google AI Studio (ai.google.dev)</a></li>
                <li><strong>2.</strong> Login dengan akun Google Anda</li>
                <li><strong>3.</strong> Klik "Get API Key" di dashboard</li>
                <li><strong>4.</strong> Copy API key yang diberikan</li>
                <li><strong>5.</strong> Paste ke GenovaAI extension settings → Request Mode: Free → Save</li>
              </ol>
              <p className="mt-3 text-green-600 dark:text-green-400">✅ API key Gemini gratis dengan quota yang cukup besar untuk penggunaan harian!</p>
            </div>
          </details>

          {/* FAQ 8 */}
          <details className="bg-white dark:bg-gray-800 rounded-2xl shadow-md group">
            <summary className="p-6 cursor-pointer list-none flex items-center justify-between font-semibold text-lg text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              <span>Apakah data dan chat history saya aman?</span>
              <span className="text-2xl group-open:rotate-180 transition-transform">▼</span>
            </summary>
            <div className="px-6 pb-6 text-gray-600 dark:text-gray-300">
              <p className="mb-3"><strong>Ya, keamanan data Anda adalah prioritas kami:</strong></p>
              <ul className="space-y-2">
                <li>✓ Semua komunikasi menggunakan HTTPS terenkripsi</li>
                <li>✓ API key Anda disimpan secara terenkripsi di local storage</li>
                <li>✓ Chat history hanya tersimpan di akun Anda (private)</li>
                <li>✓ Kami tidak membagikan data Anda ke pihak ketiga</li>
                <li>✓ Knowledge base files tersimpan secure di server</li>
                <li>✓ Anda bisa hapus chat history kapan saja</li>
              </ul>
              <p className="mt-3">GenovaAI developed by <strong>PT Generation Infinity Indonesia</strong> dengan standar keamanan enterprise.</p>
            </div>
          </details>

          {/* FAQ 9 */}
          <details className="bg-white dark:bg-gray-800 rounded-2xl shadow-md group">
            <summary className="p-6 cursor-pointer list-none flex items-center justify-between font-semibold text-lg text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              <span>Apakah GenovaAI bisa digunakan untuk ujian online?</span>
              <span className="text-2xl group-open:rotate-180 transition-transform">▼</span>
            </summary>
            <div className="px-6 pb-6 text-gray-600 dark:text-gray-300">
              <p className="mb-3">GenovaAI adalah <strong>alat bantu belajar</strong> yang dirancang untuk:</p>
              <ul className="space-y-2">
                <li>✓ Membantu Anda <strong>memahami konsep</strong> sebelum ujian</li>
                <li>✓ <strong>Latihan soal</strong> dan simulasi ujian</li>
                <li>✓ <strong>Review materi</strong> dan pemahaman mendalam</li>
                <li>✓ <strong>Riset dan belajar</strong> topik yang sulit</li>
              </ul>
              <p className="mt-3 text-amber-600 dark:text-amber-400 font-semibold">⚠️ Kami tidak mendukung penggunaan untuk kecurangan dalam ujian. Gunakan GenovaAI secara etis untuk belajar dan memahami materi dengan lebih baik.</p>
            </div>
          </details>

          {/* FAQ 10 */}
          <details className="bg-white dark:bg-gray-800 rounded-2xl shadow-md group">
            <summary className="p-6 cursor-pointer list-none flex items-center justify-between font-semibold text-lg text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              <span>Bagaimana cara top-up kredit atau menghubungi support?</span>
              <span className="text-2xl group-open:rotate-180 transition-transform">▼</span>
            </summary>
            <div className="px-6 pb-6 text-gray-600 dark:text-gray-300">
              <p className="mb-3"><strong>Top-up Kredit:</strong></p>
              <ul className="space-y-2 mb-4">
                <li>• Login ke <a href="/dashboard" className="text-blue-600 dark:text-blue-400 hover:underline">Dashboard GenovaAI</a></li>
                <li>• Pilih menu "Balance" atau "Buy Credits"</li>
                <li>• Pilih paket kredit (mulai 10 kredit = Rp 5.000)</li>
                <li>• Bayar via payment gateway (QRIS, Virtual Account, E-wallet)</li>
                <li>• Kredit otomatis masuk setelah pembayaran sukses</li>
              </ul>
              <p className="mb-3"><strong>Hubungi Support:</strong></p>
              <ul className="space-y-2">
                <li>• Email: <a href="mailto:support@genfity.com" className="text-blue-600 dark:text-blue-400 hover:underline">support@genfity.com</a></li>
                <li>• Website: <a href="https://genova.genfity.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">genova.genfity.com</a></li>
                <li>• Developer: PT Generation Infinity Indonesia</li>
              </ul>
            </div>
          </details>
        </div>

        {/* Still have questions? */}
        <div className="mt-12 text-center bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-8 max-w-2xl mx-auto">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Masih Ada Pertanyaan?</h3>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Tim support kami siap membantu Anda. Hubungi kami atau lihat dokumentasi lengkap di dashboard.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="mailto:support@genfity.com"
              className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-semibold"
            >
              📧 Email Support
            </a>
            <Link
              href="/dashboard"
              className="px-6 py-3 border-2 border-blue-600 text-blue-600 dark:text-blue-400 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all font-semibold"
            >
              📚 Lihat Dokumentasi
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-3xl p-12 text-center text-white">
          <h2 className="text-4xl font-bold mb-4">Siap Belajar Lebih Cerdas?</h2>
          <p className="text-xl mb-8 text-purple-100">Bergabunglah dengan ribuan siswa yang sudah menggunakan GenovaAI</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/register" 
              className="px-8 py-4 bg-white text-purple-600 rounded-xl hover:bg-gray-100 transition-all text-lg font-semibold shadow-lg"
            >
              Daftar Sekarang
            </Link>
            <Link 
              href="/login" 
              className="px-8 py-4 border-2 border-white text-white rounded-xl hover:bg-white/10 transition-all text-lg font-semibold"
            >
              Sudah Punya Akun?
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">G</span>
              </div>
              <span className="text-lg font-bold text-gray-900 dark:text-white">GenovaAI</span>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              © 2025 GenovaAI. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

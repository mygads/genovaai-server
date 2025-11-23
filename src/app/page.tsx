import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "GenovaAI - AI-Powered Quiz Assistant for Students",
  description: "GenovaAI helps students answer quiz questions with AI. Support for multiple choice, essay, and custom knowledge base. Free and premium plans available.",
  keywords: "genovaai, ai quiz assistant, study helper, gemini ai, student tool, quiz solver, homework help",
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
            <div className="flex items-center gap-4">
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
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <div className="inline-block px-4 py-2 bg-blue-100 dark:bg-blue-900/30 rounded-full text-blue-700 dark:text-blue-300 text-sm font-medium mb-6">
          🎓 AI-Powered Study Assistant
        </div>
        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
          Answer Quiz Questions with
          <span className="bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent"> AI Intelligence</span>
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-10">
          GenovaAI membantu siswa menjawab soal kuis dengan cerdas. Dukungan untuk pilihan ganda, essay, knowledge base, dan custom prompt. Tersedia mode gratis dan premium.
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
          <p className="text-lg text-gray-600 dark:text-gray-300">Semua yang Anda butuhkan untuk belajar lebih cerdas</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-md hover:shadow-xl transition-all border border-gray-200 dark:border-gray-700">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mb-4">
              <span className="text-2xl">🎯</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Multiple Answer Modes</h3>
            <p className="text-gray-600 dark:text-gray-300">
              4 mode jawaban: Single (A), Short (A. Penjelasan), Medium (5-10 kata), Long (detail lengkap). Sesuaikan dengan kebutuhan belajar Anda.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-md hover:shadow-xl transition-all border border-gray-200 dark:border-gray-700">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center mb-4">
              <span className="text-2xl">📚</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Knowledge Base</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Upload PDF, DOCX, TXT untuk dijadikan referensi. AI akan menjawab berdasarkan materi yang Anda berikan. Support multiple files.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-md hover:shadow-xl transition-all border border-gray-200 dark:border-gray-700">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center mb-4">
              <span className="text-2xl">✏️</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Custom Prompt</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Buat custom system prompt sendiri. Kontrol penuh atas gaya jawaban AI. Cocok untuk domain spesifik atau gaya bahasa tertentu.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-md hover:shadow-xl transition-all border border-gray-200 dark:border-gray-700">
            <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl flex items-center justify-center mb-4">
              <span className="text-2xl">🔑</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">3 Mode Request</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Free dengan API key sendiri, Free Pool (wajib saldo), atau Premium dengan kredit. Fleksibel sesuai budget dan kebutuhan.
            </p>
          </div>

          {/* Feature 5 */}
          <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-md hover:shadow-xl transition-all border border-gray-200 dark:border-gray-700">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center mb-4">
              <span className="text-2xl">💬</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Chat History</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Semua pertanyaan dan jawaban tersimpan. Review kapan saja, bookmark favorit, dan beri rating untuk meningkatkan kualitas.
            </p>
          </div>

          {/* Feature 6 */}
          <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-md hover:shadow-xl transition-all border border-gray-200 dark:border-gray-700">
            <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center mb-4">
              <span className="text-2xl">🚀</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Premium Models</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Akses ke Gemini 3.0 Pro dan model premium lainnya. Reasoning lebih baik, jawaban lebih akurat, dan response lebih cepat.
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
              <span className="text-4xl font-bold">Rp 10.000</span>
              <span className="text-purple-100">/ 20 kredit</span>
            </div>
            <ul className="space-y-3 mb-8">
              <li className="flex items-start gap-2">
                <span className="text-yellow-300 mt-1">★</span>
                <span>Gemini 3.0 Pro Preview</span>
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
            </ul>
            <Link 
              href="/register" 
              className="block w-full py-3 text-center bg-white text-purple-600 rounded-xl hover:bg-gray-100 transition-all font-semibold"
            >
              Beli Kredit
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

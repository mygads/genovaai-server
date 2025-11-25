import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://genova.genfity.com'),
  title: {
    default: "Genova AI - Asisten AI Pintar untuk Kuis, Belajar, Riset & Memahami Konsep Sulit",
    template: "%s | Genova AI"
  },
  description: "Chrome Extension AI terbaik dengan Gemini 2.0 Pro & GPT-4 untuk menjawab pertanyaan, menjelaskan konsep sulit, riset cepat, dan membantu belajar. Gratis 5 kredit premium! Hanya Rp 500/kredit.",
  keywords: ["genovaai", "ai assistant indonesia", "chrome extension ai", "asisten belajar ai", "riset dengan ai", "pahami konsep sulit", "gemini pro indonesia", "gpt-4 indonesia", "ai research assistant", "homework helper", "study ai tool"],
  authors: [{ name: "PT Generation Infinity Indonesia", url: "https://genova.genfity.com" }],
  creator: "PT Generation Infinity Indonesia",
  publisher: "PT Generation Infinity Indonesia",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'id_ID',
    url: 'https://genova.genfity.com',
    title: 'Genova AI - Asisten AI untuk Kuis, Belajar & Riset',
    description: 'Chrome Extension AI dengan Gemini 2.0 Pro & GPT-4. Gratis 5 kredit premium! Mulai dari Rp 500/kredit.',
    siteName: 'Genova AI',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Genova AI - Asisten AI untuk Kuis, Belajar & Riset',
    description: 'Chrome Extension AI dengan Gemini & GPT. Gratis 5 kredit premium!',
  },
  alternates: {
    canonical: 'https://genova.genfity.com',
  },
  category: 'Education',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}

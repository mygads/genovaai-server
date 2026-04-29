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
  description: "Chrome Extension AI untuk belajar, riset, dan memahami konsep sulit dengan model OpenAI-compatible. Gunakan BYOK provider Anda sendiri atau saldo Genova untuk model berbayar.",
  keywords: ["genovaai", "ai assistant indonesia", "chrome extension ai", "asisten belajar ai", "riset dengan ai", "pahami konsep sulit", "openai compatible", "byok ai", "ai research assistant", "homework helper", "study ai tool"],
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
    description: 'Chrome Extension AI dengan BYOK OpenAI-compatible atau saldo Genova untuk model berbayar.',
    siteName: 'Genova AI',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Genova AI - Asisten AI untuk Kuis, Belajar & Riset',
    description: 'Chrome Extension AI dengan BYOK OpenAI-compatible dan model berbayar dari saldo Genova.',
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

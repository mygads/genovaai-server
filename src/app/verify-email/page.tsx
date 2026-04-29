"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function VerifyEmailPage() {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Memverifikasi email Anda...");

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("token");

    if (!token) {
      setStatus("error");
      setMessage("Token verifikasi tidak ditemukan.");
      return;
    }

    fetch("/api/auth/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Verifikasi email gagal");
        setStatus("success");
        setMessage("Email berhasil dikonfirmasi. Anda sekarang bisa login.");
      })
      .catch((error) => {
        setStatus("error");
        setMessage(error instanceof Error ? error.message : "Verifikasi email gagal");
      });
  }, []);

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 via-white to-blue-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-700 text-center">
          <Link href="/" className="inline-flex items-center gap-2 mb-8">
            <div className="w-12 h-12 bg-gray-900 dark:bg-white rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white dark:text-gray-900 font-bold text-2xl">G</span>
            </div>
            <span className="text-2xl font-bold text-gray-900 dark:text-white">Genova AI</span>
          </Link>

          <div className={`mx-auto mb-5 w-12 h-12 rounded-full flex items-center justify-center ${
            status === "success"
              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
              : status === "error"
                ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
          }`}>
            {status === "loading" ? "…" : status === "success" ? "✓" : "!"}
          </div>

          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
            {status === "success" ? "Email Confirmed" : status === "error" ? "Verification Failed" : "Confirming Email"}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8">{message}</p>

          <Link
            href="/login"
            className="inline-flex justify-center w-full py-3 px-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-semibold rounded-xl hover:bg-gray-800 dark:hover:bg-gray-100 transition-all shadow-lg"
          >
            Go to Login
          </Link>
        </div>
      </div>
    </div>
  );
}

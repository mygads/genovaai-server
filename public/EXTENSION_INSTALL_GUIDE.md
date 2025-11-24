# 📦 GenovaAI Extension - Panduan Instalasi

## Cara Install Extension (Tanpa Perlu Unzip Manual)

### Opsi 1: Download dari GitHub (RECOMMENDED) ⭐

1. **Download Repository**
   - Kunjungi: https://github.com/mygads/genovaai-extension
   - Klik tombol hijau "Code" → "Download ZIP"
   - Extract file ZIP yang sudah didownload

2. **Masuk ke Folder `dist`**
   - Setelah extract, buka folder `genovaai-extension-main`
   - **Cari dan masuk ke folder bernama `dist`**
   - Folder `dist` ini yang berisi extension siap pakai

3. **Load ke Chrome**
   - Buka Chrome, ketik: `chrome://extensions`
   - Aktifkan **Developer mode** (toggle di kanan atas)
   - Klik **"Load unpacked"**
   - **Pilih folder `dist`** (bukan folder induk!)
   - ✅ Selesai! Extension terpasang

### Opsi 2: Download ZIP dari Website

1. Download file `genova-extension.zip` dari website
2. Extract file ZIP
3. Ikuti langkah yang sama - **pilih folder `dist`** saat load unpacked

---

## ⚠️ PENTING: Harus Pilih Folder `dist`

**BENAR ✅:**
```
C:\Downloads\genovaai-extension-main\dist\  ← Pilih folder ini
  ├── manifest.json
  ├── service-worker-loader.js
  ├── assets/
  └── ...
```

**SALAH ❌:**
```
C:\Downloads\genovaai-extension-main\  ← Jangan pilih folder ini
  ├── dist/
  ├── src/
  ├── package.json
  └── ...
```

Jika Anda salah pilih folder (yang ada src, package.json, dll), Chrome akan error karena tidak menemukan `manifest.json` yang valid.

---

## 🚀 Folder `dist` - Extension Siap Pakai

Folder `dist` adalah hasil build/compile dari source code yang sudah siap digunakan sebagai Chrome extension. Folder ini berisi:

- ✅ `manifest.json` - File konfigurasi extension
- ✅ `service-worker-loader.js` - Background script
- ✅ `assets/` - File CSS, JS, dan assets lainnya
- ✅ `logo.png` - Icon extension
- ✅ Semua file yang dibutuhkan Chrome

**Tidak perlu build/compile lagi!** Langsung load unpacked saja.

---

## 🔧 Troubleshooting

### Error: "Manifest file is missing or unreadable"
**Penyebab:** Anda memilih folder yang salah (bukan folder `dist`)  
**Solusi:** Pilih folder `dist` yang ada di dalam hasil extract

### Extension tidak muncul di toolbar
**Solusi:** 
1. Cek di `chrome://extensions` apakah extension sudah enabled
2. Klik icon puzzle 🧩 di toolbar → pin icon GenovaAI

### Developer mode tidak bisa diaktifkan
**Solusi:** Beberapa organisasi/sekolah lock setting ini. Gunakan Chrome pribadi atau kontak IT admin

### Folder `dist` tidak ada
**Penyebab:** Anda download source code mentah (belum di-build)  
**Solusi:** 
- Download dari link release/ZIP yang sudah include dist
- ATAU jalankan `npm install && npm run build` untuk generate folder dist

---

## 📚 Setelah Install

1. **Register & Login**  
   Daftar di https://genova.genfity.com dan login di extension

2. **Gunakan Kode Voucher**  
   Redeem kode `NEWUSERPRAK` untuk 5 kredit premium gratis!

3. **Atur Preferences**  
   Klik icon extension → Settings untuk mengatur:
   - Request Mode (Free/Pool/Premium)
   - Answer Length
   - Model AI
   - Upload Knowledge Base

4. **Mulai Bertanya**  
   Gunakan bubble chat atau klik icon extension untuk bertanya!

---

## 💡 Tips

- **Untuk dev/contributor:** Clone repo, jalankan `npm run build` untuk generate dist
- **Untuk user biasa:** Download dari release/website yang sudah include dist
- **Update extension:** Download versi terbaru, hapus folder lama, load unpacked folder dist yang baru

---

## 🆘 Butuh Bantuan?

- 📧 Email: support@genfity.com
- 🌐 Website: https://genova.genfity.com
- 💬 Lihat FAQ lengkap di website

---

**Developed by PT Generation Infinity Indonesia**

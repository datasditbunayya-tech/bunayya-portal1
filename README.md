# 🏫 Portal Bunayya Islamic School

Aplikasi portal pendidikan berbasis web untuk **Bunayya Islamic School** dengan penyimpanan **Firebase Firestore** — realtime, multi-user, gratis.

---

## ✨ Fitur Utama

- 👨‍🏫 **Portal Guru** — Input absensi, jurnal, nilai, laporan harian, kegiatan, target, ziyadah
- 🎓 **Portal Siswa** — Melihat rekap nilai, absensi, progress hafalan
- 👨‍👩‍👧 **Portal Wali** — Pantau perkembangan anak secara realtime
- 📊 **Dashboard Admin** — 8 diagram statistik interaktif
- 🔥 **Firebase Realtime** — Semua perubahan langsung terlihat di semua perangkat

---

## 🚀 Cara Deploy di GitHub Pages

1. Buat repository baru di GitHub → nama: `bunayya-portal` → Public
2. Upload file `index.html`
3. Settings → Pages → Source: **main** / **(root)** → Save
4. Akses via: `https://<username>.github.io/bunayya-portal`

---

## 🔥 Firebase yang Sudah Terpasang

Project: **bunayya-portal**  
Database: **Firestore** (asia-southeast1)

> ⚠️ Pastikan Firestore Rules diset ke **test mode** atau sesuaikan rules untuk production.

### Firestore Rules (untuk production):
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true; // Ganti dengan auth rules sesuai kebutuhan
    }
  }
}
```

---

## 🔑 Akun Login Default

| Role  | Cara Login | Password |
|-------|------------|----------|
| Admin | username: `admin` | `admin123` |
| Guru  | Pilih nama guru | NIP guru atau `1234` |
| Siswa/Wali | Pilih nama siswa | — |

---

## 📁 Struktur File

```
bunayya-portal/
├── index.html   → Aplikasi lengkap (React + Firebase, single-file)
├── Code.gs      → Google Apps Script (backup, tidak aktif)
└── README.md    → Dokumentasi ini
```

---

## 🛠️ Teknologi

- **Frontend**: React 18 (CDN)
- **Database**: Firebase Firestore (realtime)
- **Hosting**: GitHub Pages
- **Font**: Amiri (Arabic), DM Sans

---

*Dibuat dengan ❤️ untuk pendidikan Islam yang lebih baik*

# Changelog

Semua perubahan penting pada proyek **JywaNonton** (Dramabox API) akan didokumentasikan di sini.

## [1.0.0] - 2026-02-24

### Ditambahkan
- Inisialisasi proyek **JywaNonton** (Dramabox API).
- Fitur scraping konten Dramabox (Detail, Episode, Streaming Link).
- Endpoint API:
  - `/api/latest`: Daftar drama terbaru.
  - `/api/trending`: Daftar drama trending.
  - `/api/for-you`: Rekomendasi drama.
  - `/api/vip`: Konten VIP.
  - `/api/random`: Video drama acak.
  - `/api/popular-searches`: Kata kunci pencarian populer.
  - `/api/search`: Pencarian drama.
  - `/api/detail`: Detail drama.
  - `/api/episodes`: Daftar episode dan link streaming.
  - `/api/dubbed`: Drama dengan dubbing Indonesia.
- Sistem Signature RSA-SHA256 untuk bypass proteksi API Dramabox.
- Sistem Dynamic Token generation (Bootstrap).
- Sistem Caching (2 jam) untuk optimalisasi request.
- Konfigurasi Deployment untuk Vercel.
- Dokumentasi API (halaman utama).

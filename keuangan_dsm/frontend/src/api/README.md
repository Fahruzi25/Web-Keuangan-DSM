# Folder api

Saat ini aplikasi berjalan **tanpa backend** (mode demo, bawaan). Data disimpan di `localStorage` browser. Saat pertama dibuka, data contoh dimuat; tombol di footer dapat mengosongkannya atau memuatnya lagi.

- `*.api.js` : pemanggilan yang dipakai halaman. Di mode demo memakai `demo/`; di mode `http` memanggil backend lewat `BASE_URL`.
- `client.js` : `BASE_URL` (dari `VITE_API_BASE_URL`), token sesi, dan fungsi `http()`. Sudah siap, belum dipakai selama mode demo.
- `mode.js` : sumber data. `VITE_API_MODE=http` beralih ke backend.
- `demo/` : implementasi tanpa server, termasuk `contoh.js` (data contoh presentasi). Tidak ikut dalam build mode `http`, jadi build untuk backend bersih dari data maupun kode demo.
- `konstanta.js` : daftar tahap pencairan dan rekening.

Bentuk permintaan, respons, dan aturan lengkap ada di `API_KONTRAK.md` (folder frontend).

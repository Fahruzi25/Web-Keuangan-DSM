# Folder api (MODE DEMO)

Backend belum tersambung. Semua `*.api.js` membaca dan menulis data di `mockDb.js`, yang menyimpannya di
`localStorage` browser. Hasilnya, Project, Pesanan, Transaksi, Operasional, dan Dashboard saling terhubung
persis seperti nanti dengan server, dan semua aturan sudah dijalankan:

- Pencairan satu tahap hanya sekali per pekerjaan, dan total pencairan tidak boleh melebihi SP2D.
- Pembayaran pesanan tidak boleh melebihi sisa, dan nomor pembayaran mengikuti urutan tanggal.
- Project, pekerjaan, atau pesanan yang sudah punya transaksi tidak bisa dihapus.

Login menerima username dan password apa saja. Tombol "Reset data demo" ada di footer.
Saat backend siap, isi tiap `*.api.js` diganti pemanggilan `http()` dari `client.js` dengan bentuk data yang sama.
`BASE_URL` dibaca dari `VITE_API_BASE_URL` (lihat `.env.example`).

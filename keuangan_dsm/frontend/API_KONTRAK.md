# Kontrak API Frontend Keuangan DSM

Dokumen ini menjelaskan permintaan dan respons yang diharapkan frontend dari backend.
Sumber kebenaran adalah folder `src/api` (pemanggilan) dan `src/api/demo` (perilaku dan aturan yang dijalankan di mode demo).

## 1. Ketentuan umum

- **Alamat dasar** dibaca dari `VITE_API_BASE_URL` (contoh `http://localhost:3000/api`), diakses lewat `BASE_URL` di `src/api/client.js`. Semua alamat di bawah relatif terhadap alamat dasar itu.
- **Autentikasi:** semua endpoint kecuali `/auth/login` dan `/auth/logout` wajib `Authorization: Bearer <token>`. Respons 401 pada endpoint lain membuat frontend menghapus sesi dan kembali ke halaman login.
- **Format:** JSON. Tanggal berupa teks `YYYY-MM-DD`. Uang berupa angka JSON (bukan teks), maksimal 2 desimal. Id berupa bilangan bulat.
- **Format error:** `{ "message": "teks", "errors": ["teks", ...] }` (`errors` opsional). Frontend menampilkan `message`, lalu `errors` disambung.
  - 400 id tidak valid, 401 sesi habis atau login salah, 404 tidak ditemukan, 409 bentrok data (mis. masih punya transaksi), 422 isian tidak valid atau melanggar aturan.
- **Jam acuan:** "tahun berjalan" pada dashboard memakai waktu Indonesia (WIB).
- **Mode sumber data:** `VITE_API_MODE` kosong (bawaan) berarti **tanpa backend**: data di browser, berisi data contoh saat pertama dibuka. Isi `http` agar frontend memanggil backend lewat alamat dasar di atas. Data contoh dan kode demo **tidak** ikut dalam build mode `http`.

## 2. Autentikasi

| Metode | Alamat | Isi permintaan | Respons |
| --- | --- | --- | --- |
| POST | `/auth/login` | `{ username, password }` | `{ token, user: { id, username, namaLengkap } }` |
| POST | `/auth/logout` | kosong | `{ ok: true }` |
| GET | `/auth/me` | kosong | `{ id, username, namaLengkap }` atau 401 |

## 3. Project

| Metode | Alamat | Keterangan |
| --- | --- | --- |
| GET | `/project` | Daftar project (tanpa transaksi) |
| GET | `/project/:id` | Detail; setiap pekerjaan memuat `transaksi[]` (terbaru di atas) |
| POST | `/project` | Tambah project beserta pekerjaan dan pesanan. Respons 201 berbentuk project |
| PUT | `/project/:id` | Ubah. Pekerjaan dan pesanan yang memuat `id` diubah, tanpa `id` ditambah, yang tidak dikirim dihapus |
| DELETE | `/project/:id` | `{ ok: true }` |

**Isi permintaan POST dan PUT**

```json
{
  "nama": "PROJECT BPTD I JAWA TENGAH",
  "kodeProject": "BPTD-JATENG-I",
  "kontrakInaproc": "EP-01KHV5H6RAFB7WR5RBMXN6KBF1",
  "nomorKontrak": "",
  "tglKontrak": "2026-08-15",
  "nilaiKontrak": 1840000000,
  "persenPotongan": 1.75,
  "pekerjaan": [
    {
      "id": 5,
      "nama": "Rembang (APILL 1)",
      "pesanan": [
        { "id": 2, "noInvoice": "10345", "produk": "APILL V5", "keterangan": "APILL V5 (I) Rembang", "total": 266168676 }
      ]
    }
  ]
}
```

Kontrak (`kontrakInaproc`, `nomorKontrak`, `tglKontrak`, `nilaiKontrak`, `persenPotongan`) berada di tingkat project; pekerjaan hanya memuat `nama` dan `pesanan`. `persenPotongan` adalah persen PPh yang diketik pengguna (0 sampai 100). `tglKontrak` boleh `null`. `pesanan` berisi 0 atau 1 item. `total` pesanan sudah termasuk PPN.

**Bentuk project dalam respons**

```
project = { id, nama, kodeProject, kontrakInaproc, nomorKontrak, tglKontrak, nilaiKontrak, persenPotongan,
            sp2d, pencairan: [{ tahap, label, realisasi, status: "DONE"|"BELUM", tglPencairan, jumlah }],
            cair, belumCair, selesai, pekerjaan: [pekerjaan],
            danaMasuk, danaKeluar, saldo, jumlahTransaksi, totalPesanan, dibayarPesanan, sisaPesanan, biayaLangsung,
            proyeksiMasuk, proyeksiKeluar, realisasiMasuk, realisasiKeluar, onProsesMasuk, onProsesKeluar }
            // SP2D dan pencairan dihitung per project; angka pesanan dan transaksi = jumlah angka pekerjaan-pekerjaannya

pekerjaan = { id, projectId, nama,
              danaMasuk, danaKeluar, saldo, jumlahTransaksi,
              pesanan: [pesanan], totalPesanan, dibayarPesanan, sisaPesanan, biayaLangsung,
              proyeksiKeluar, realisasiMasuk, realisasiKeluar, onProsesKeluar,
              transaksi?: [transaksi]   // hanya pada GET /project/:id
            }

pesanan = { id, noInvoice, produk, keterangan, total, dpp, ppn, dibayar, sisa, lunas,
            pembayaran: [{ no, id, tanggal, nominal, rekening, keterangan }] }   // id = id transaksi
```

**Rumus (dihitung server, tidak disimpan)**

| Angka | Rumus |
| --- | --- |
| `sp2d` | `nilaiKontrak / 1,11`, dikurangi `persenPotongan` persen dari hasil itu (dibulatkan 2 desimal) |
| `pencairan[].realisasi` | jumlah nominal transaksi dana masuk dengan `tahap` tersebut; `status` DONE bila lebih dari 0 |
| `cair` | jumlah seluruh `pencairan[].realisasi` |
| `belumCair` | `max(sp2d - cair, 0)`; `selesai` bila `sp2d > 0` dan `sp2d - cair < 1` |
| `danaMasuk`, `danaKeluar` | jumlah transaksi pekerjaan itu berarah MASUK dan KELUAR; `saldo = masuk - keluar` |
| `dpp`, `ppn` | `dpp = total / 1,11` (2 desimal), `ppn = total - dpp` |
| `dibayar` | jumlah transaksi KELUAR yang menunjuk pesanan itu; `sisa = max(total - dibayar, 0)` |
| `lunas` | `total > 0` dan `total - dibayar < 1` |
| `pembayaran[].no` | urutan 1, 2, 3 menurut `tanggal`, lalu `id`. Tidak disimpan |
| `biayaLangsung` | jumlah transaksi klasifikasi PROJECT berarah KELUAR |
| `proyeksiMasuk` / `proyeksiKeluar` | `sp2d` / `biayaLangsung + totalPesanan` |
| `realisasiMasuk` / `realisasiKeluar` | `danaMasuk` / `danaKeluar` |
| `onProsesMasuk` / `onProsesKeluar` | `belumCair` / `sisaPesanan` |

**Aturan**

- Nama project dan `kodeProject` unik (tidak peka huruf besar-kecil). Satu pekerjaan paling banyak satu pesanan (`pesanan` berisi 0 atau 1 item). `kontrakInaproc` unik di seluruh project (simpan huruf besar).
- Minimal satu pekerjaan. Wajib: nama project, kodeProject, kontrakInaproc, nilaiKontrak (>= 0), persenPotongan (0 sampai 100), nama pekerjaan. Pesanan (satu per pekerjaan, boleh belum ada): keterangan wajib, total > 0.
- Pekerjaan yang punya transaksi tidak boleh dihapus (409). Pesanan yang punya pembayaran tidak boleh dihapus (409).
- `total` pesanan tidak boleh lebih kecil dari `dibayar`. SP2D baru tidak boleh lebih kecil dari `cair` (toleransi Rp 1), keduanya 422.
- Hapus project ditolak (409) bila masih punya transaksi.
- Pesan galat memakai `message: "Data project belum lengkap."` dan daftar rinci di `errors`, mis. `"Pekerjaan 2: nilai kontrak tidak valid."`.

## 4. Transaksi

| Metode | Alamat | Keterangan |
| --- | --- | --- |
| GET | `/transaksi` | `{ rows: [transaksi + saldo], ringkasan }`, urut lama ke baru |
| GET | `/transaksi/kategori` | `{ kategori: [teks], subkategori: [teks] }` dari transaksi OPERASIONAL (urut abjad, tanpa duplikat) |
| GET | `/transaksi/:id` | satu transaksi |
| POST | `/transaksi` | tambah, respons 201 |
| PUT | `/transaksi/:id` | ubah |
| DELETE | `/transaksi/:id` | `{ ok: true }` |

**Isi permintaan**

```json
{
  "tanggal": "2026-10-14",
  "rekening": "GIRO",
  "keterangan": "Pelunasan APILL Rembang",
  "arah": "KELUAR",
  "nominal": 135764516,
  "klasifikasi": "PESANAN",
  "projectId": 3,
  "pekerjaanId": 5,
  "pesananId": 2,
  "tahap": null,
  "kategori": null,
  "subkategori": null,
  "noInvoice": ""
}
```

- `rekening`: `GIRO` atau `KAS`. `arah`: `MASUK` atau `KELUAR`. `klasifikasi`: `PROJECT`, `PESANAN`, atau `OPERASIONAL`. Klasifikasi `PIUTANG` ada di daftar tetapi **tidak boleh dibuat atau diubah lewat `/transaksi`** (422); gunakan `/piutang` (bagian 6).
- `tahap`: `UANG_MUKA`, `TERMIN_1`, `TERMIN_2`, `TERMIN_3`, `RETENSI`, atau `null`.
- Isian yang tidak relevan dengan klasifikasi diabaikan dan disimpan `null` (lihat tabel).

| Klasifikasi | projectId, pekerjaanId | pesananId | tahap | kategori, subkategori | noInvoice |
| --- | --- | --- | --- | --- | --- |
| PROJECT | wajib | tidak dipakai | hanya bila arah MASUK (opsional) | tidak dipakai | opsional |
| PESANAN | wajib | wajib | tidak dipakai | tidak dipakai | tidak dipakai (diambil dari pesanan) |
| OPERASIONAL | tidak dipakai | tidak dipakai | tidak dipakai | subkategori wajib, kategori opsional | opsional |

**Bentuk transaksi dalam respons**

```
transaksi = { id, tanggal, rekening, keterangan, arah, nominal, klasifikasi,
              projectId, pekerjaanId, pesananId, tahap, kategori, subkategori, noInvoice,
              namaProject, namaPekerjaan, noInvoicePesanan, produkPesanan, pembayaranKe,
              pihakId, namaPihak, jenisPiutang, nomorPiutang }   // empat terakhir hanya terisi untuk klasifikasi PIUTANG
// saldo (khusus daftar): saldo berjalan rekening GIRO; KAS bernilai null
ringkasan = { saldoGiro, danaMasuk, keluarGiro, keluarKas }
// danaMasuk = jumlah MASUK pada GIRO, tidak termasuk transaksi berketerangan "SALDO AWAL" (tanpa peka huruf besar-kecil)
// danaMasuk dan keluarGiro TIDAK memuat klasifikasi PIUTANG (bukan pendapatan atau biaya); saldoGiro tetap memuatnya
```

**Aturan**

- Wajib: tanggal (tanggal kalender yang ada), keterangan, nominal > 0, rekening valid.
- `KAS` hanya boleh arah `KELUAR`. Klasifikasi `PESANAN` hanya boleh arah `KELUAR` (server memaksa atau menolak).
- PROJECT dan PESANAN: project harus ada dan pekerjaan harus milik project itu. PESANAN: pesanan harus milik pekerjaan itu.
- **Tahap pencairan hanya sekali per project.** Bila tahap sudah tercatat pada transaksi lain project yang sama: 422 *"Tahap X pada project ini sudah tercatat."* Saat mengubah, transaksi itu sendiri dikecualikan.
- **Total pencairan (semua tahap) tidak boleh melebihi `sp2d` + Rp 1.** 422 *"Total pencairan melebihi SP2D project ini. Sisa SP2D: Rp ..."*
- **Pembayaran pesanan tidak boleh melebihi `sisa` + Rp 1** (sisa dihitung tanpa transaksi yang sedang diubah). 422 *"Pembayaran melebihi sisa pesanan ..."*
- Dua permintaan bersamaan tidak boleh sama-sama lolos batas di atas: kunci baris pekerjaan saat memeriksa.
- Untuk 422 pada transaksi: pesan pertama di `message`, sisanya di `errors`.
- `DELETE /transaksi/:id` pada catatan PIUTANG menjalankan aturan hapus piutang (bagian 6).

## 5. Operasional

`GET /operasional?bulan=10` (bulan `01` sampai `12`, kosong berarti semua). Hanya transaksi OPERASIONAL berarah KELUAR (giro dan kas), terbaru di atas.

```
[{ id, tanggal, rekening, keterangan, kategori, subkategori, nominal, noInvoice }]
// kategori dan subkategori kosong ditampilkan "Lainnya"
```

## 6. Piutang

Pinjaman (dana keluar) dan pembayaran (dana masuk) kepada atau dari pihak lain. **Seluruhnya melalui rekening GIRO.** Server menyimpannya sebagai transaksi berklasifikasi `PIUTANG` (`rekening: GIRO`, `arah: KELUAR` untuk pinjaman, `MASUK` untuk pembayaran, `pihakId` terisi), sehingga saldo giro selalu benar dan tidak perlu diketik dua kali. Istilah seperti "geser" atau "titip" hanya ditulis di `keterangan`.

| Metode | Alamat | Keterangan |
| --- | --- | --- |
| GET | `/piutang` | `{ ringkasan, pihak: [pihak] }` |
| GET | `/piutang/:id` | satu catatan (id = id transaksi), untuk form ubah |
| POST | `/piutang` | tambah pinjaman atau pembayaran, respons 201 |
| PUT | `/piutang/:id` | ubah tanggal, nominal, keterangan |
| DELETE | `/piutang/:id` | `{ ok: true }` |
| PUT | `/piutang/pihak/:id` | ubah nama pihak: `{ nama }` -> `{ id, nama }`. **Daftarkan sebelum `/piutang/:id`** |

**Isi permintaan POST dan PUT**

```json
{ "jenis": "PINJAMAN", "pihakId": null, "pihak": "PT. Grafiti Makmur Sejahtera",
  "tanggal": "2026-10-06", "nominal": 275000000, "keterangan": "Tarik cek tunai" }
```

- `jenis`: `PINJAMAN` atau `PEMBAYARAN`. Pada PUT, `jenis` dan pihak tidak dapat diubah (422 bila `pihakId` berbeda).
- **Pihak dikenali lewat id.** Bila `pihakId` ada, itu yang dipakai. Bila tidak, server mencocokkan `pihak` dengan nama yang sudah ada tanpa peka huruf besar-kecil, titik, koma, dan spasi ganda (`"PT. Grafiti"` sama dengan `"pt grafiti"`). Tidak ketemu: pada PINJAMAN dibuat pihak baru; pada PEMBAYARAN ditolak (422 *"Pihak ini belum memiliki piutang. Catat pinjaman terlebih dahulu."*).
- Wajib: tanggal (kalender yang ada), nominal > 0, keterangan.

**Bentuk respons**

```
ringkasan = { totalPiutang, dibayar, sisa, jumlahPihak }
pihak = { id, nama, total, dibayar, sisa, lunas, jumlahPinjaman, jumlahPembayaran,
          rincian: [{ id, jenis, no, label, tanggal, keterangan, nominal }] }   // urut tanggal lalu id
catatan = { id, jenis, pihakId, namaPihak, tanggal, nominal, keterangan, nomor }   // POST, PUT, GET /:id
```

- `total` = jumlah pinjaman, `dibayar` = jumlah pembayaran, `sisa = max(total - dibayar, 0)`, `lunas` bila `total > 0` dan `total - dibayar < 1`.
- `no` (dan `label` "Pinjaman 1", "Pembayaran 2") dinomori terpisah untuk tiap jenis menurut urutan tanggal, lalu id. **Tidak disimpan.**
- Pihak yang tidak punya catatan lagi dihapus otomatis. `GET /piutang` hanya memuat pihak yang punya catatan, diurut menurut nama.

**Aturan**

- Pembayaran tidak boleh melebihi `sisa` + Rp 1 (sisa dihitung tanpa catatan yang sedang diubah). 422 *"Pembayaran melebihi sisa piutang X. Sisa: Rp ..."*
- Mengubah nilai pinjaman tidak boleh membuat `total` lebih kecil dari `dibayar` (toleransi Rp 1): 422.
- Menghapus pinjaman ditolak (409) bila `total` yang tersisa menjadi lebih kecil dari `dibayar`. Menghapus pembayaran selalu boleh.
- Dua permintaan bersamaan pada pihak yang sama tidak boleh sama-sama lolos batas sisa: kunci per pihak saat memeriksa.
- Nama pihak unik menurut pencocokan di atas (422 *"Nama pihak sudah digunakan."*); nama wajib diisi.

## 7. Rekap

`GET /rekap?tahun=2026&bulan=10&projectId=3&sumber=PROJECT,PESANAN`

Padanan sheet REKAP PABAR: buku besar per project, di dalamnya satu buku besar per pekerjaan dengan saldo berjalan.

- `tahun` (wajib), `bulan` (`01` sampai `12`, kosong berarti satu tahun penuh), `projectId` (kosong berarti semua project), `sumber` (`PROJECT,PESANAN`; piutang tidak termasuk dan dicatat pada bagian Piutang).
- Dibaca dari transaksi; tidak ada data yang diisi di sini.
- Satu entri `projects` per project yang punya transaksi atau saldo awal; di dalamnya satu **kelompok** per pekerjaan. Kelompok tanpa baris dan tanpa saldo awal tidak dikirim.
- `saldoAwal` = akumulasi seluruh baris kelompok itu **sebelum** tanggal awal periode (tanggal 1 pada `bulan`, atau 1 Januari bila `bulan` kosong), termasuk tahun-tahun sebelumnya.

```
{ periode: { tahun, bulan },
  opsiTahun: ["2026", "2025"],            // tahun yang ada pada transaksi, ditambah tahun berjalan dan tahun yang diminta
  ringkasan: { saldoAwal, masuk, keluar, saldoAkhir },   // jumlah seluruh project
  projects: [{ id, nama, kodeProject,
               saldoAwal, totalMasuk, totalKeluar, saldoAkhir,      // total gabungan seluruh pekerjaan project
               kelompok: [{ kunci, judul,                           // judul = nama pekerjaan
                            saldoAwal, totalMasuk, totalKeluar, saldoAkhir,
                            baris: [{ id, tanggal, keterangan, label, sumber, masuk, keluar, saldo }] }] }] }
```

- `saldo` berjalan = saldo sebelumnya + masuk - keluar.
- `sumber` pada baris: `PROJECT` atau `PESANAN` (klasifikasi transaksi). `label`: nama tahap pencairan (Project) atau `Pembayaran N · invoice` (Pesanan).
- Urutan baris: tanggal lalu id.

## 8. Dashboard

`GET /dashboard`

```
{ saldoGiro,                       // seluruh transaksi GIRO: masuk - keluar
  danaMasuk, danaKeluar,           // GIRO, tahun berjalan (WIB), tanpa "SALDO AWAL" dan tanpa klasifikasi PIUTANG
  perBulan: [{ masuk, keluar }],   // 12 elemen, Januari sampai Desember; juga tanpa PIUTANG
  terbaru: [{ id, tanggal, keterangan, arah, nominal, rekening, namaProject }],   // 5 teratas, tanpa "SALDO AWAL"
  proyek: { jumlahProject, projectSelesai, jumlahPekerjaan, pekerjaanSelesai,
            sp2d, cair, belumCair, totalPesanan, dibayarPesanan, sisaPesanan },   // jumlah seluruh pekerjaan
  piutang: { jumlahPihak, pihakBelumLunas, pinjamanKeluar, pembayaranDiterima, sisa } }
```

## 9. Konstanta di frontend

`src/api/konstanta.js` memuat daftar tahap (`UANG_MUKA` "Uang muka", `TERMIN_1` "Termin I", `TERMIN_2` "Termin II", `TERMIN_3` "Termin III", `RETENSI` "Retensi") dan rekening (`GIRO` "Rekening Global (Giro)", `KAS` "Kas"). Server cukup mengirim kodenya.

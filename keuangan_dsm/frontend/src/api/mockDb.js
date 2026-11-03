/**
 * MODE DEMO (tanpa server).
 * Seluruh data disimpan di localStorage browser, sehingga Project, Pesanan, Transaksi, dan Operasional
 * saling terhubung seperti saat backend tersambung. Untuk mengembalikan data awal, jalankan
 * `resetDemo()` (ada tombolnya di footer) atau hapus kunci "dsm_demo_db_v2" di localStorage.
 * Saat backend siap, isi file *.api.js diganti dengan pemanggilan `http()` dari client.js.
 */
const KEY = 'dsm_demo_db_v2';
let cache = null;

const ps = (noInvoice, produk, keterangan, total) => ({ noInvoice, produk, keterangan, total });
const kontrak = (nama, inaproc, nilai, { persen = 1.75, pesanan = [], tgl = '2026-08-15' } = {}) => ({
  nama, kontrakInaproc: inaproc, nomorKontrak: '', tglKontrak: tgl, nilaiKontrak: nilai, persenPotongan: persen, pesanan,
});

function seed() {
  const daftar = [
    { nama: 'PROJECT BPTD III SULBAR', pekerjaan: [
      kontrak('BPTD Sulbar III (Delinator)', 'EP-01KFM8WRD8A7T05J38YSN5R684', 750000000, { pesanan: [ps('DEL-0201', 'Delinator', 'Delinator post BPTD Sulbar III', 480000000)] }),
    ] },
    { nama: 'PROJECT BPTD II PAPUA BARAT', pekerjaan: [
      kontrak('BPTD II Papua Barat (APJ 1)', 'EP-01KFMBB95JY5PQHX0DWKDC711N', 480000000),
      kontrak('BPTD II Papua Barat (APJ 2)', 'EP-01KFMBATEKBAWXT0YPY10Q68EB', 520000000),
      kontrak('BPTD II Papua Barat (Delinator)', 'EP-01KHV5J2BTG17X3MNQDS2MYP0R', 640000000),
    ] },
    { nama: 'PROJECT BPTD I JAWA TENGAH', pekerjaan: [
      kontrak('Rembang (APILL 1)', 'EP-01KHV5H6RAFB7WR5RBMXN6KBF1', 980000000, { pesanan: [
        ps('10345', 'APILL V5', 'APILL V5 (I) Rembang', 266168676),
        ps('10399', 'Kabel APILL', 'Kabel pendukung APILL Rembang', 45500000),
      ] }),
      kontrak('Banyumas (APILL 2)', 'EP-01KK81B89W7AJYPXMY13MNS45P', 860000000, { pesanan: [ps('10346', 'APILL V5', 'APILL V5 (II) Banyumas', 257167020)] }),
    ] },
    { nama: 'PROJECT PUSDA SDA', pekerjaan: [kontrak('Pemeliharaan dan Pengembangan Aplikasi PU SDA', 'EP-01KQ90X0BK9E2VYQB7CN5R4R52', 350000000)] },
    { nama: 'PROJECT DIREKTORAT LALU LINTAS', pekerjaan: [
      kontrak('Tegal (Pemeliharaan APILL)', 'EP-01KQ6SASPBRN1BQC16WHVSRSB4', 300000000, { persen: 1.5, pesanan: [ps('10402', 'APILL V5', 'Pemeliharaan APILL Tegal', 150000000)] }),
    ] },
    { nama: 'PROJECT BPTD KELAS II SULAWESI SELATAN', pekerjaan: [
      kontrak('Modul Solar Panel', 'EP-DEMO-SULSEL-0001', 420000000, { pesanan: [ps('10410', 'Modul PV', 'Modul PV BPTD Sulsel', 261960000)] }),
    ] },
  ];

  let idProject = 0, idPekerjaan = 0, idPesanan = 0;
  const projects = daftar.map((p) => ({
    id: ++idProject,
    nama: p.nama,
    pekerjaan: p.pekerjaan.map((k) => ({
      ...k, id: ++idPekerjaan, pesanan: k.pesanan.map((x) => ({ ...x, id: ++idPesanan })),
    })),
  }));

  const cariPk = (nama) => {
    const p = projects.find((x) => x.pekerjaan.some((k) => k.nama === nama));
    return { projectId: p.id, pekerjaanId: p.pekerjaan.find((k) => k.nama === nama).id };
  };
  const cariPs = (noInvoice) => {
    for (const p of projects) for (const k of p.pekerjaan) {
      const x = k.pesanan.find((s) => s.noInvoice === noInvoice);
      if (x) return { projectId: p.id, pekerjaanId: k.id, pesananId: x.id };
    }
    return {};
  };

  const t = (id, tanggal, rekening, keterangan, arah, nominal, extra = {}) => ({
    id, tanggal, rekening, keterangan, arah, nominal, klasifikasi: 'OPERASIONAL',
    projectId: null, pekerjaanId: null, pesananId: null, tahap: null, kategori: null, subkategori: null, noInvoice: '', ...extra,
  });
  const proj = (nama, extra = {}) => ({ klasifikasi: 'PROJECT', ...cariPk(nama), ...extra });
  const pesan = (no) => ({ klasifikasi: 'PESANAN', ...cariPs(no) });

  const trx = [
    t(1, '2026-10-01', 'GIRO', 'SALDO AWAL', 'MASUK', 4000000000),
    t(2, '2026-10-05', 'GIRO', 'Gaji karyawan Oktober', 'KELUAR', 7000000, { kategori: 'Pegawai', subkategori: 'Gaji Karyawan' }),
    t(3, '2026-10-08', 'GIRO', 'Borongan pemasangan delinator', 'KELUAR', 15000000, proj('BPTD Sulbar III (Delinator)')),
    t(4, '2026-10-12', 'GIRO', 'UM-1', 'MASUK', 200000000, proj('BPTD Sulbar III (Delinator)', { tahap: 'UANG_MUKA' })),
    t(5, '2026-10-15', 'GIRO', 'Iuran BPJS Oktober', 'KELUAR', 2500000, { kategori: 'Iuran', subkategori: 'BPJS' }),
    t(6, '2026-10-20', 'KAS', 'Tagihan listrik kantor', 'KELUAR', 1800000, { kategori: 'Utilitas', subkategori: 'PLN' }),
    t(7, '2026-10-22', 'KAS', 'Material rambu delinator', 'KELUAR', 3200000, proj('BPTD Sulbar III (Delinator)')),
    t(8, '2026-10-10', 'GIRO', 'Pembayaran delinator ke AJK', 'KELUAR', 200000000, pesan('DEL-0201')),
    t(9, '2026-09-10', 'GIRO', 'UM-1 Rembang', 'MASUK', 170000000, proj('Rembang (APILL 1)', { tahap: 'UANG_MUKA' })),
    t(10, '2026-09-15', 'GIRO', 'Pembayaran APILL Rembang', 'KELUAR', 130404160, pesan('10345')),
    t(11, '2026-10-05', 'GIRO', 'Termin 1 Rembang', 'MASUK', 400000000, proj('Rembang (APILL 1)', { tahap: 'TERMIN_1' })),
    t(12, '2026-10-14', 'GIRO', 'Pelunasan APILL Rembang', 'KELUAR', 135764516, pesan('10345')),
    t(13, '2026-09-12', 'GIRO', 'UM-1 Banyumas', 'MASUK', 150000000, proj('Banyumas (APILL 2)', { tahap: 'UANG_MUKA' })),
    t(14, '2026-10-02', 'GIRO', 'Pembayaran APILL Banyumas', 'KELUAR', 124681160, pesan('10346')),
    t(15, '2026-10-03', 'GIRO', 'UM-1 Tegal', 'MASUK', 90000000, proj('Tegal (Pemeliharaan APILL)', { tahap: 'UANG_MUKA' })),
    t(16, '2026-10-09', 'GIRO', 'Pembayaran APILL Tegal', 'KELUAR', 100000000, pesan('10402')),
    t(17, '2026-09-20', 'GIRO', 'UM-1 Sulsel', 'MASUK', 100000000, proj('Modul Solar Panel', { tahap: 'UANG_MUKA' })),
    t(18, '2026-09-25', 'GIRO', 'Pembayaran Modul PV', 'KELUAR', 130980000, pesan('10410')),
    t(19, '2026-10-18', 'GIRO', 'Pelunasan Modul PV', 'KELUAR', 130980000, pesan('10410')),
    t(20, '2026-10-20', 'GIRO', 'Termin 1 Sulsel', 'MASUK', 200000000, proj('Modul Solar Panel', { tahap: 'TERMIN_1' })),
  ];
  return { v: 2, projects, trx, seq: { project: idProject, pekerjaan: idPekerjaan, pesanan: idPesanan, trx: trx.length } };
}

export function db() {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) { cache = JSON.parse(raw); return cache; }
  } catch { /* abaikan, pakai data awal */ }
  cache = seed();
  simpan();
  return cache;
}

export function simpan() {
  try { localStorage.setItem(KEY, JSON.stringify(cache)); } catch { /* penyimpanan penuh atau diblokir */ }
}

export function resetDemo() {
  cache = seed();
  simpan();
}

export const nextId = (jenis) => { const d = db(); d.seq[jenis] += 1; return d.seq[jenis]; };

/** Meniru jeda jaringan dan mengembalikan salinan data, supaya state di halaman tidak berbagi referensi. */
export const balas = (nilai) => new Promise((ok) => setTimeout(() => ok(JSON.parse(JSON.stringify(nilai))), 120));

export const gagal = (status, message, errors) => Object.assign(new Error(message), { status, errors });
export const tolak = (status, message, errors) => new Promise((_, no) => setTimeout(() => no(gagal(status, message, errors)), 120));

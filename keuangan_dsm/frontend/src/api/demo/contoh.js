/**
 * Data contoh untuk presentasi. Pada mode demo, data ini dimuat saat aplikasi pertama kali dibuka;
 * tombol "Kosongkan data demo" di footer mengosongkannya, dan "Muat data contoh" memuatnya lagi.
 * Tanggal mengikuti tahun berjalan. Sebagian angka diambil dari Excel (pesanan AJK dan piutang), sisanya rekaan.
 * Seluruh angka mematuhi aturan aplikasi (pencairan tidak melebihi SP2D, pembayaran tidak melebihi total pesanan).
 */
import { BULAN } from '../../utils/bulan';

const ps = (noInvoice, produk, keterangan, total) => ({ noInvoice, produk, keterangan, total });
const kontrak = (nama, { pesanan = [] } = {}) => ({ nama, pesanan });

export function seedContoh() {
  const TH = new Date().getFullYear();
  const tg = (bulan, hari) => `${TH}-${String(bulan).padStart(2, '0')}-${String(hari).padStart(2, '0')}`;

  const daftar = [
    { nama: 'PROJECT BPTD III SULBAR', kodeProject: 'BPTD-SULBAR-III', kontrakInaproc: 'EP-01KFM8WRD8A7T05J38YSN5R684', nilaiKontrak: 750000000, pekerjaan: [
      kontrak('BPTD Sulbar III (Delinator)', { pesanan: [ps('DEL-0201', 'Delinator', 'Delinator post BPTD Sulbar III', 480000000)] }),
    ] },
    { nama: 'PROJECT BPTD II PAPUA BARAT', kodeProject: 'BPTD-PABAR-II', kontrakInaproc: 'EP-01KFMBB95JY5PQHX0DWKDC711N', nilaiKontrak: 1640000000, pekerjaan: [
      kontrak('BPTD II Papua Barat (APJ 1)'),
      kontrak('BPTD II Papua Barat (APJ 2)'),
      kontrak('BPTD II Papua Barat (Delinator)', { pesanan: [ps('PB-0301', 'Delinator', 'Delinator post Papua Barat', 300000000)] }),
    ] },
    { nama: 'PROJECT BPTD I JAWA TENGAH', kodeProject: 'BPTD-JATENG-I', kontrakInaproc: 'EP-01KHV5H6RAFB7WR5RBMXN6KBF1', nilaiKontrak: 1840000000, pekerjaan: [
      kontrak('Rembang (APILL 1)', { pesanan: [ps('10345', 'APILL V5', 'APILL V5 (I) Rembang', 311668676)] }),
      kontrak('Banyumas (APILL 2)', { pesanan: [ps('10346', 'APILL V5', 'APILL V5 (II) Banyumas', 257167020)] }),
    ] },
    { nama: 'PROJECT PUSDA SDA', kodeProject: 'PUSDA-SDA', kontrakInaproc: 'EP-01KQ90X0BK9E2VYQB7CN5R4R52', nilaiKontrak: 350000000, pekerjaan: [kontrak('Pemeliharaan dan Pengembangan Aplikasi PU SDA')] },
    { nama: 'PROJECT DIREKTORAT LALU LINTAS', kodeProject: 'DITLANTAS', kontrakInaproc: 'EP-01KQ6SASPBRN1BQC16WHVSRSB4', nilaiKontrak: 300000000, persenPotongan: 1.5, pekerjaan: [
      kontrak('Tegal (Pemeliharaan APILL)', { pesanan: [ps('10402', 'APILL V5', 'Pemeliharaan APILL Tegal', 150000000)] }),
    ] },
    { nama: 'PROJECT BPTD KELAS II SULAWESI SELATAN', kodeProject: 'BPTD-SULSEL-II', kontrakInaproc: 'EP-DEMO-SULSEL-0001', nilaiKontrak: 420000000, pekerjaan: [
      kontrak('Modul Solar Panel', { pesanan: [ps('10410', 'Modul PV', 'Modul PV BPTD Sulsel', 261960000)] }),
    ] },
  ];

  let idProject = 0, idPekerjaan = 0, idPesanan = 0;
  const projects = daftar.map((p) => ({
    id: ++idProject,
    nama: p.nama, kodeProject: p.kodeProject, kontrakInaproc: p.kontrakInaproc, nomorKontrak: '',
    tglKontrak: '2026-01-15', nilaiKontrak: p.nilaiKontrak, persenPotongan: p.persenPotongan ?? 1.75,
    pekerjaan: p.pekerjaan.map((k) => ({ ...k, id: ++idPekerjaan, pesanan: k.pesanan.map((x) => ({ ...x, id: ++idPesanan })) })),
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
  const pihak = [
    { id: 1, nama: 'PT. Grafiti Makmur Sejahtera' },
    { id: 2, nama: 'PT. Pandega Wreksa Wisesa' },
    { id: 3, nama: 'PT. Joyo Mulyo Bersama' },
  ];

  const baris = [];
  const t = (tanggal, rekening, keterangan, arah, nominal, extra = {}) => baris.push({
    tanggal, rekening, keterangan, arah, nominal, klasifikasi: 'OPERASIONAL',
    projectId: null, pekerjaanId: null, pesananId: null, pihakId: null, tahap: null, kategori: null, subkategori: null, noInvoice: '', ...extra,
  });
  const op = (kategori, subkategori) => ({ kategori, subkategori });
  const proj = (pk, extra = {}) => ({ klasifikasi: 'PROJECT', ...cariPk(pk), ...extra });
  const bayar = (no) => ({ klasifikasi: 'PESANAN', ...cariPs(no) });
  const piutang = (pihakId) => ({ klasifikasi: 'PIUTANG', pihakId });

  // ---- operasional bulanan (Januari sampai Oktober) ----
  t(tg(1, 2), 'GIRO', 'SALDO AWAL', 'MASUK', 4000000000, op('Saldo', 'Saldo'));
  const gaji = [7000000, 7000000, 7250000, 7250000, 7500000, 7500000, 7500000, 7750000, 7750000, 8000000];
  gaji.forEach((n, i) => {
    const m = i + 1;
    t(tg(m, 5), 'GIRO', `Gaji karyawan ${BULAN[i]}`, 'KELUAR', n, op('Pegawai', 'Gaji Karyawan'));
    t(tg(m, 15), 'GIRO', `Iuran BPJS ${BULAN[i]}`, 'KELUAR', 2500000, op('Iuran', 'BPJS'));
    t(tg(m, 20), 'KAS', `Tagihan listrik kantor ${BULAN[i]}`, 'KELUAR', 1800000 + (m % 4) * 100000, op('Utilitas', 'PLN'));
    t(tg(m, 22), 'KAS', `Internet kantor ${BULAN[i]}`, 'KELUAR', 900000, op('Utilitas', 'Internet'));
    if (m % 3 === 1) t(tg(m, 8), 'GIRO', `Sewa kantor triwulan ${Math.ceil(m / 3)}`, 'KELUAR', 15000000, op('Sewa', 'Sewa Kantor'));
    if (m % 3 === 0) t(tg(m, 25), 'KAS', 'Alat tulis dan konsumsi rapat', 'KELUAR', 650000, op('Perlengkapan', 'ATK'));
  });

  // ---- project, pesanan, dan piutang ----
  const SULBAR = 'BPTD Sulbar III (Delinator)', APJ1 = 'BPTD II Papua Barat (APJ 1)', APJ2 = 'BPTD II Papua Barat (APJ 2)', PBDEL = 'BPTD II Papua Barat (Delinator)';
  const REMBANG = 'Rembang (APILL 1)', BANYUMAS = 'Banyumas (APILL 2)', PUSDA = 'Pemeliharaan dan Pengembangan Aplikasi PU SDA', TEGAL = 'Tegal (Pemeliharaan APILL)', SULSEL = 'Modul Solar Panel';

  // Sulbar: 600 juta dari SP2D 663,8 juta; pesanan 480 juta baru terbayar 420 juta
  t(tg(3, 12), 'GIRO', 'UM-1 Sulbar', 'MASUK', 200000000, proj(SULBAR, { tahap: 'UANG_MUKA' }));
  t(tg(6, 18), 'GIRO', 'Termin I Sulbar', 'MASUK', 250000000, proj(SULBAR, { tahap: 'TERMIN_1' }));
  t(tg(9, 22), 'GIRO', 'Termin II Sulbar', 'MASUK', 150000000, proj(SULBAR, { tahap: 'TERMIN_2' }));
  t(tg(3, 20), 'GIRO', 'Borongan pemasangan delinator', 'KELUAR', 15000000, proj(SULBAR));
  t(tg(7, 5), 'GIRO', 'Biaya pemasangan tahap 2', 'KELUAR', 12000000, proj(SULBAR));
  t(tg(4, 8), 'KAS', 'Material rambu delinator', 'KELUAR', 3200000, proj(SULBAR));
  t(tg(3, 25), 'GIRO', 'Pembayaran delinator ke AJK (1)', 'KELUAR', 150000000, bayar('DEL-0201'));
  t(tg(5, 14), 'GIRO', 'Pembayaran delinator ke AJK (2)', 'KELUAR', 150000000, bayar('DEL-0201'));
  t(tg(7, 2), 'GIRO', 'Pembayaran delinator ke AJK (3)', 'KELUAR', 120000000, bayar('DEL-0201'));

  // Papua Barat
  t(tg(1, 22), 'GIRO', 'UM-1 Papua Barat', 'MASUK', 350000000, proj(APJ1, { tahap: 'UANG_MUKA' }));
  t(tg(6, 9), 'GIRO', 'Termin I Papua Barat', 'MASUK', 520000000, proj(APJ1, { tahap: 'TERMIN_1' }));
  t(tg(1, 15), 'GIRO', 'Pembayaran jaminan pelaksanaan APJ 1', 'KELUAR', 12000000, proj(APJ1));
  t(tg(7, 14), 'GIRO', 'Pembayaran T1 komite APJ 1', 'KELUAR', 40000000, proj(APJ1));
  t(tg(1, 16), 'GIRO', 'Pembayaran jaminan pelaksanaan APJ 2', 'KELUAR', 14000000, proj(APJ2));
  t(tg(7, 16), 'GIRO', 'Pembayaran T1 komite APJ 2', 'KELUAR', 45000000, proj(APJ2));
  t(tg(2, 20), 'GIRO', 'Pembayaran delinator Papua Barat ke AJK (1)', 'KELUAR', 90000000, bayar('PB-0301'));
  t(tg(8, 25), 'GIRO', 'Pembayaran delinator Papua Barat ke AJK (2)', 'KELUAR', 110000000, bayar('PB-0301'));

  // Jawa Tengah: pesanan Rembang (10345) dan Banyumas (10346) masih ada sisa
  t(tg(2, 10), 'GIRO', 'UM-1 Jawa Tengah', 'MASUK', 320000000, proj(REMBANG, { tahap: 'UANG_MUKA' }));
  t(tg(5, 6), 'GIRO', 'Termin I Jawa Tengah', 'MASUK', 700000000, proj(REMBANG, { tahap: 'TERMIN_1' }));
  t(tg(8, 12), 'GIRO', 'Termin II Jawa Tengah', 'MASUK', 200000000, proj(REMBANG, { tahap: 'TERMIN_2' }));
  t(tg(5, 22), 'GIRO', 'Biaya pemasangan APILL Rembang', 'KELUAR', 18000000, proj(REMBANG));
  t(tg(2, 27), 'GIRO', 'Pembayaran APILL Rembang (1)', 'KELUAR', 130404160, bayar('10345'));
  t(tg(4, 16), 'GIRO', 'Pelunasan APILL Rembang', 'KELUAR', 135764516, bayar('10345'));
  t(tg(7, 20), 'GIRO', 'Pembayaran kabel pendukung APILL Rembang', 'KELUAR', 20000000, bayar('10345'));
  t(tg(7, 9), 'GIRO', 'Biaya pemasangan APILL Banyumas', 'KELUAR', 12500000, proj(BANYUMAS));
  t(tg(3, 6), 'GIRO', 'Pembayaran APILL Banyumas (1)', 'KELUAR', 124681160, bayar('10346'));
  t(tg(6, 25), 'GIRO', 'Pembayaran APILL Banyumas (2)', 'KELUAR', 80000000, bayar('10346'));

  // PUSDA, Tegal, Sulsel
  t(tg(3, 3), 'GIRO', 'UM-1 PUSDA', 'MASUK', 70000000, proj(PUSDA, { tahap: 'UANG_MUKA' }));
  t(tg(7, 28), 'GIRO', 'Termin I PUSDA', 'MASUK', 100000000, proj(PUSDA, { tahap: 'TERMIN_1' }));
  t(tg(4, 14), 'GIRO', 'Biaya pengembangan aplikasi', 'KELUAR', 9000000, proj(PUSDA));
  t(tg(4, 2), 'GIRO', 'UM-1 Tegal', 'MASUK', 90000000, proj(TEGAL, { tahap: 'UANG_MUKA' }));
  t(tg(8, 20), 'GIRO', 'Termin I Tegal', 'MASUK', 120000000, proj(TEGAL, { tahap: 'TERMIN_1' }));
  t(tg(4, 18), 'GIRO', 'Pembayaran APILL Tegal (1)', 'KELUAR', 100000000, bayar('10402'));
  t(tg(9, 10), 'GIRO', 'Pelunasan APILL Tegal', 'KELUAR', 50000000, bayar('10402'));
  t(tg(5, 11), 'GIRO', 'UM-1 Sulsel', 'MASUK', 100000000, proj(SULSEL, { tahap: 'UANG_MUKA' }));
  t(tg(9, 15), 'GIRO', 'Termin I Sulsel', 'MASUK', 200000000, proj(SULSEL, { tahap: 'TERMIN_1' }));
  t(tg(5, 28), 'GIRO', 'Pembayaran Modul PV (1)', 'KELUAR', 130980000, bayar('10410'));
  t(tg(9, 30), 'GIRO', 'Pelunasan Modul PV', 'KELUAR', 130980000, bayar('10410'));

  // piutang (seluruhnya melalui giro)
  t(tg(6, 9), 'GIRO', 'Tarik cek tunai', 'KELUAR', 275000000, piutang(1));
  t(tg(7, 13), 'GIRO', 'Tarik cek tunai', 'KELUAR', 625000000, piutang(2));
  t(tg(8, 19), 'GIRO', 'Tarik cek tunai', 'KELUAR', 200000000, piutang(2));
  t(tg(9, 10), 'GIRO', 'BPTD Papua Barat', 'KELUAR', 20000000, piutang(3));
  t(tg(9, 30), 'GIRO', 'Pembayaran komite project delineator BPTD Papua Barat', 'MASUK', 50000000, piutang(2));

  const trx = baris.sort((a, b) => (a.tanggal === b.tanggal ? 0 : a.tanggal < b.tanggal ? -1 : 1)).map((x, i) => ({ id: i + 1, ...x }));
  return { v: 9, projects, pihak, trx, seq: { project: idProject, pekerjaan: idPekerjaan, pesanan: idPesanan, pihak: pihak.length, trx: trx.length } };
}

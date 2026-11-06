/** MODE DEMO. Ringkasan Home dihitung dari data yang sama dengan halaman lain. */
import { balas, db } from './mockDb';
import { olahProject } from './project.demo';
import { olahPihak } from './piutang.demo';

export function getDashboard() {
  const tahun = new Date().getFullYear();
  const trx = db().trx;
  const bukanSaldoAwal = (t) => t.keterangan.trim().toUpperCase() !== 'SALDO AWAL';
  const giro = trx.filter((t) => t.rekening === 'GIRO');
  const arus = giro.filter((t) => t.klasifikasi !== 'PIUTANG'); // piutang bukan pendapatan atau biaya
  const jumlah = (rows, arah) => rows.filter((t) => t.arah === arah).reduce((s, t) => s + t.nominal, 0);

  const perBulan = Array.from({ length: 12 }, (_, i) => {
    const bln = String(i + 1).padStart(2, '0');
    const isi = arus.filter((t) => t.tanggal.startsWith(`${tahun}-${bln}`) && bukanSaldoAwal(t));
    return { masuk: jumlah(isi, 'MASUK'), keluar: jumlah(isi, 'KELUAR') };
  });
  const setahun = arus.filter((t) => t.tanggal.startsWith(String(tahun)) && bukanSaldoAwal(t));

  const projects = db().projects.map((p) => olahProject(p, trx));
  const pekerjaan = projects.flatMap((p) => p.pekerjaan);
  const sum = (arr, k) => arr.reduce((s, x) => s + x[k], 0);

  const terbaru = [...trx]
    .filter(bukanSaldoAwal)
    .sort((a, b) => (a.tanggal < b.tanggal ? 1 : a.tanggal > b.tanggal ? -1 : b.id - a.id))
    .slice(0, 5)
    .map((t) => ({
      id: t.id, tanggal: t.tanggal, keterangan: t.keterangan, arah: t.arah, nominal: t.nominal, rekening: t.rekening,
      namaProject: db().projects.find((p) => p.id === t.projectId)?.nama ?? null,
    }));

  const pihak = db().pihak.map(olahPihak).filter((p) => p.rincian.length);
  const piutang = {
    jumlahPihak: pihak.length,
    pihakBelumLunas: pihak.filter((p) => !p.lunas).length,
    pinjamanKeluar: sum(pihak, 'total'),
    pembayaranDiterima: sum(pihak, 'dibayar'),
    sisa: sum(pihak, 'sisa'),
  };

  return balas({
    saldoGiro: jumlah(giro, 'MASUK') - jumlah(giro, 'KELUAR'),
    danaMasuk: jumlah(setahun, 'MASUK'),
    danaKeluar: jumlah(setahun, 'KELUAR'),
    perBulan,
    terbaru,
    piutang,
    proyek: {
      jumlahProject: projects.length, projectSelesai: projects.filter((p) => p.selesai).length,
      jumlahPekerjaan: pekerjaan.length,
      sp2d: sum(projects, 'sp2d'), cair: sum(projects, 'cair'), belumCair: sum(projects, 'belumCair'),
      totalPesanan: sum(pekerjaan, 'totalPesanan'), dibayarPesanan: sum(pekerjaan, 'dibayarPesanan'), sisaPesanan: sum(pekerjaan, 'sisaPesanan'),
    },
  });
}

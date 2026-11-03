/** MODE DEMO. Ringkasan Home dihitung dari data yang sama dengan halaman lain. */
import { balas, db } from './mockDb';
import { olahProject } from './project.api';

export function getDashboard() {
  const tahun = new Date().getFullYear();
  const trx = db().trx;
  const bukanSaldoAwal = (t) => t.keterangan.trim().toUpperCase() !== 'SALDO AWAL';
  const giro = trx.filter((t) => t.rekening === 'GIRO');
  const jumlah = (rows, arah) => rows.filter((t) => t.arah === arah).reduce((s, t) => s + t.nominal, 0);

  const perBulan = Array.from({ length: 12 }, (_, i) => {
    const bln = String(i + 1).padStart(2, '0');
    const isi = giro.filter((t) => t.tanggal.startsWith(`${tahun}-${bln}`) && bukanSaldoAwal(t));
    return { masuk: jumlah(isi, 'MASUK'), keluar: jumlah(isi, 'KELUAR') };
  });
  const setahun = giro.filter((t) => t.tanggal.startsWith(String(tahun)) && bukanSaldoAwal(t));

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

  return balas({
    saldoGiro: jumlah(giro, 'MASUK') - jumlah(giro, 'KELUAR'),
    danaMasuk: jumlah(setahun, 'MASUK'),
    danaKeluar: jumlah(setahun, 'KELUAR'),
    perBulan,
    terbaru,
    proyek: {
      jumlahProject: projects.length, projectSelesai: projects.filter((p) => p.selesai).length,
      jumlahPekerjaan: pekerjaan.length, pekerjaanSelesai: pekerjaan.filter((x) => x.selesai).length,
      sp2d: sum(pekerjaan, 'sp2d'), cair: sum(pekerjaan, 'cair'), belumCair: sum(pekerjaan, 'belumCair'),
      totalPesanan: sum(pekerjaan, 'totalPesanan'), dibayarPesanan: sum(pekerjaan, 'dibayarPesanan'), sisaPesanan: sum(pekerjaan, 'sisaPesanan'),
    },
  });
}

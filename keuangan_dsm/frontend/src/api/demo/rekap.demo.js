/**
 * MODE DEMO. Rekap disusun dari transaksi (tidak ada yang diketik), mengikuti sheet REKAP PABAR: untuk tiap project,
 * satu buku besar per pekerjaan (dana masuk, dana keluar, saldo berjalan) beserta total saldo gabungan project.
 * Saldo berjalan dimulai dari saldo awal periode (akumulasi sebelum tanggal awal). Hanya transaksi Project dan Pesanan.
 */
import { balas, db } from './mockDb';
import { urutBayar } from '../../utils/pesanan';
import { labelTahap } from '../konstanta';

const bulat = (n) => Math.round(n * 100) / 100;
const SUMBER = ['PROJECT', 'PESANAN'];

/** Nomor urut per transaksi dalam kelompoknya (pesanan atau pihak), menurut tanggal. */
function nomorUrut(kunci) {
  const hitung = {};
  const hasil = new Map();
  [...db().trx].filter((t) => t[kunci]).sort(urutBayar).forEach((t) => {
    const k = `${t[kunci]}-${t.arah}`;
    hitung[k] = (hitung[k] ?? 0) + 1;
    hasil.set(t.id, hitung[k]);
  });
  return hasil;
}

export function getRekap({ tahun, bulan = '', projectId = '' } = {}) {
  const th = String(tahun || new Date().getFullYear());
  const awal = bulan ? `${th}-${bulan}-01` : `${th}-01-01`;
  const dalam = (t) => (bulan ? t.tanggal.slice(0, 7) === `${th}-${bulan}` : t.tanggal.slice(0, 4) === th);
  const noPesanan = nomorUrut('pesananId');
  const noInvoice = (t) => db().projects.flatMap((p) => p.pekerjaan).flatMap((k) => k.pesanan ?? []).find((x) => x.id === t.pesananId)?.noInvoice;

  const label = (t) => {
    if (t.klasifikasi === 'PESANAN') return `Pembayaran ${noPesanan.get(t.id)}${noInvoice(t) ? ` · ${noInvoice(t)}` : ''}`;
    return t.tahap ? labelTahap(t.tahap) : '';
  };

  function kelompokDari({ kunci, judul, trx }) {
    const efek = (t) => (t.arah === 'MASUK' ? t.nominal : -t.nominal);
    const saldoAwal = bulat(trx.filter((t) => t.tanggal < awal).reduce((s, t) => s + efek(t), 0));
    const isi = trx.filter(dalam);
    if (!isi.length && saldoAwal === 0) return null;
    let saldo = saldoAwal;
    const baris = isi.map((t) => {
      saldo = bulat(saldo + efek(t));
      return { id: t.id, tanggal: t.tanggal, keterangan: t.keterangan, label: label(t), sumber: t.klasifikasi, masuk: t.arah === 'MASUK' ? t.nominal : 0, keluar: t.arah === 'KELUAR' ? t.nominal : 0, saldo };
    });
    return {
      kunci, judul, saldoAwal, baris,
      totalMasuk: bulat(baris.reduce((s, b) => s + b.masuk, 0)),
      totalKeluar: bulat(baris.reduce((s, b) => s + b.keluar, 0)),
      saldoAkhir: saldo,
    };
  }

  const tahunAda = [...new Set(db().trx.map((t) => t.tanggal.slice(0, 4)))];
  const opsiTahun = [...new Set([...tahunAda, String(new Date().getFullYear()), th])].sort().reverse();

  const projects = [];
  for (const p of db().projects) {
    if (projectId && p.id !== Number(projectId)) continue;
    const kelompok = [];
    for (const pk of p.pekerjaan) {
      const trx = db().trx.filter((t) => t.pekerjaanId === pk.id && SUMBER.includes(t.klasifikasi)).sort(urutBayar);
      const g = kelompokDari({ kunci: `pk-${pk.id}`, judul: pk.nama, trx });
      if (g) kelompok.push(g);
    }
    if (!kelompok.length) continue;
    const jml = (k) => bulat(kelompok.reduce((s, g) => s + g[k], 0));
    projects.push({
      id: p.id, nama: p.nama, kodeProject: p.kodeProject, kelompok,
      saldoAwal: jml('saldoAwal'), totalMasuk: jml('totalMasuk'), totalKeluar: jml('totalKeluar'), saldoAkhir: jml('saldoAkhir'),
    });
  }
  const jmlSemua = (k) => bulat(projects.reduce((s, p) => s + p[k], 0));

  return balas({
    periode: { tahun: th, bulan },
    opsiTahun,
    ringkasan: { saldoAwal: jmlSemua('saldoAwal'), masuk: jmlSemua('totalMasuk'), keluar: jmlSemua('totalKeluar'), saldoAkhir: jmlSemua('saldoAkhir') },
    projects,
  });
}

/**
 * MODE DEMO. Project (kode project, kontrak INAPROC, nomor kontrak) memiliki banyak pekerjaan. Tiap pekerjaan punya nilai kontrak,
 * SP2D, pencairan per tahap, dan satu pesanan ke AJK (total termasuk PPN, dibayar lewat transaksi klasifikasi Pesanan).
 * Semua angka turunan dihitung dari transaksi, tidak diketik.
 */
import { balas, db, nextId, simpan, tolak } from './mockDb';
import { hitungSp2d } from '../../utils/sp2d';
import { PPN_PERSEN, bacaPersen, persenPph } from '../../utils/pajak';
import { dppPpn, urutBayar } from '../../utils/pesanan';

import { TAHAP } from '../konstanta';

const jumlah = (arr, f) => arr.reduce((s, x) => s + f(x), 0);
const bulat = (n) => Math.round(n * 100) / 100;
const rp = (n) => `Rp ${Math.round(n).toLocaleString('id-ID')}`;

/** Satu pesanan dengan pembayarannya (bernomor 1, 2, 3 menurut tanggal). */
export function olahPesanan(ps, trxPekerjaan) {
  const bayar = trxPekerjaan.filter((t) => t.pesananId === ps.id && t.arah === 'KELUAR').sort(urutBayar);
  const pembayaran = bayar.map((t, i) => ({ no: i + 1, id: t.id, tanggal: t.tanggal, nominal: t.nominal, rekening: t.rekening, keterangan: t.keterangan }));
  const dibayar = bulat(jumlah(bayar, (t) => t.nominal));
  const total = Number(ps.total) || 0;
  return {
    ...ps, total, ...dppPpn(total), dibayar,
    sisa: bulat(Math.max(total - dibayar, 0)),
    lunas: total > 0 && total - dibayar < 1,
    pembayaran,
  };
}

/** Kontrak tingkat project: SP2D dan pencairan per tahap, dihitung dari seluruh transaksi project itu. */
export function olahKontrak(p, semuaTrx) {
  const trx = semuaTrx.filter((t) => t.projectId === p.id);
  const sp2d = hitungSp2d(p.nilaiKontrak, PPN_PERSEN, persenPph(p));
  const pencairan = TAHAP.map((th) => {
    const isi = trx.filter((t) => t.tahap === th.key);
    const realisasi = jumlah(isi, (t) => t.nominal);
    return {
      tahap: th.key, label: th.label, realisasi: bulat(realisasi),
      status: realisasi > 0 ? 'DONE' : 'BELUM',
      tglPencairan: isi.length ? isi.map((t) => t.tanggal).sort().at(-1) : null,
      jumlah: isi.length,
    };
  });
  const cair = bulat(jumlah(pencairan, (x) => x.realisasi));
  return { sp2d, pencairan, cair, belumCair: bulat(Math.max(sp2d - cair, 0)), selesai: sp2d > 0 && sp2d - cair < 1 };
}

/** Pekerjaan (nama + satu pesanan) dengan angka turunan dari transaksinya. */
export function olahPekerjaan(pk, projectId, semuaTrx, denganTransaksi = false) {
  const trx = semuaTrx.filter((t) => t.pekerjaanId === pk.id);
  const masuk = jumlah(trx.filter((t) => t.arah === 'MASUK'), (t) => t.nominal);
  const keluar = jumlah(trx.filter((t) => t.arah === 'KELUAR'), (t) => t.nominal);

  const pesanan = (pk.pesanan ?? []).map((x) => olahPesanan(x, trx));
  const totalPesanan = bulat(jumlah(pesanan, (x) => x.total));
  const dibayarPesanan = bulat(jumlah(pesanan, (x) => x.dibayar));
  const sisaPesanan = bulat(jumlah(pesanan, (x) => x.sisa));
  const biayaLangsung = bulat(jumlah(trx.filter((t) => t.klasifikasi === 'PROJECT' && t.arah === 'KELUAR'), (t) => t.nominal));
  const proyeksiKeluar = bulat(biayaLangsung + totalPesanan);

  return {
    ...pk, projectId,
    danaMasuk: bulat(masuk), danaKeluar: bulat(keluar), saldo: bulat(masuk - keluar), jumlahTransaksi: trx.length,
    pesanan, totalPesanan, dibayarPesanan, sisaPesanan, biayaLangsung,
    proyeksiKeluar, realisasiMasuk: bulat(masuk), realisasiKeluar: bulat(keluar), onProsesKeluar: sisaPesanan,
    ...(denganTransaksi && {
      transaksi: [...trx]
        .sort((a, b) => (a.tanggal < b.tanggal ? 1 : a.tanggal > b.tanggal ? -1 : b.id - a.id))
        .map((t) => {
          const ps = pesanan.find((x) => x.id === t.pesananId);
          return { ...t, pembayaranKe: ps?.pembayaran.find((b) => b.id === t.id)?.no ?? null, noInvoicePesanan: ps?.noInvoice || null };
        }),
    }),
  };
}

// angka project yang merupakan jumlah angka pekerjaan-pekerjaannya
const KUNCI_TOTAL = [
  'danaMasuk', 'danaKeluar', 'saldo', 'jumlahTransaksi',
  'totalPesanan', 'dibayarPesanan', 'sisaPesanan', 'biayaLangsung',
  'proyeksiKeluar', 'realisasiMasuk', 'realisasiKeluar', 'onProsesKeluar',
];

export function olahProject(p, semuaTrx, denganTransaksi = false) {
  const pekerjaan = p.pekerjaan.map((pk) => olahPekerjaan(pk, p.id, semuaTrx, denganTransaksi));
  const total = Object.fromEntries(KUNCI_TOTAL.map((k) => [k, bulat(jumlah(pekerjaan, (x) => x[k]))]));
  const kontrak = olahKontrak(p, semuaTrx);
  return {
    id: p.id, nama: p.nama, kodeProject: p.kodeProject, kontrakInaproc: p.kontrakInaproc, nomorKontrak: p.nomorKontrak,
    tglKontrak: p.tglKontrak, nilaiKontrak: p.nilaiKontrak, persenPotongan: p.persenPotongan,
    pekerjaan, ...total, ...kontrak,
    proyeksiMasuk: kontrak.sp2d, onProsesMasuk: kontrak.belumCair,
  };
}

export const listProject = () => balas(db().projects.map((p) => olahProject(p, db().trx)));

export async function getProject(id) {
  const p = db().projects.find((x) => x.id === Number(id));
  if (!p) return tolak(404, 'Project tidak ditemukan.');
  return balas(olahProject(p, db().trx, true));
}

function periksa(data, idSaatIni) {
  const e = [];
  const nama = String(data.nama ?? '').trim();
  if (!nama) e.push('Nama project wajib diisi.');
  if (db().projects.some((p) => p.id !== idSaatIni && p.nama.toLowerCase() === nama.toLowerCase())) e.push('Nama project sudah digunakan.');
  const kode = String(data.kodeProject ?? '').trim();
  if (!kode) e.push('Kode project wajib diisi.');
  else if (db().projects.some((p) => p.id !== idSaatIni && String(p.kodeProject ?? '').toLowerCase() === kode.toLowerCase())) e.push('Kode project sudah digunakan.');
  const ep = String(data.kontrakInaproc ?? '').trim().toUpperCase();
  if (!ep) e.push('Kontrak INAPROC wajib diisi.');
  else if (db().projects.some((p) => p.id !== idSaatIni && String(p.kontrakInaproc ?? '').toUpperCase() === ep)) e.push(`Kontrak INAPROC ${ep} sudah digunakan project lain.`);
  if (data.nilaiKontrak === '' || Number(data.nilaiKontrak) < 0 || Number.isNaN(Number(data.nilaiKontrak))) e.push('Nilai kontrak tidak valid.');
  const persen = bacaPersen(data.persenPotongan);
  if (Number.isNaN(persen) || persen < 0 || persen > 100) e.push('Persen pajak harus angka 0 sampai 100.');
  if (!data.pekerjaan?.length) e.push('Tambahkan minimal satu pekerjaan.');
  (data.pekerjaan ?? []).forEach((k, i) => {
    const n = `Pekerjaan ${i + 1}`;
    if (!String(k.nama ?? '').trim()) e.push(`${n}: nama wajib diisi.`);
    if ((k.pesanan ?? []).length > 1) e.push(`${n}: satu pekerjaan hanya boleh memiliki satu pesanan.`);
    (k.pesanan ?? []).forEach((x, j) => {
      const m = `${n}, pesanan`;
      if (!String(x.keterangan ?? '').trim()) e.push(`${m}: keterangan wajib diisi.`);
      if (!(Number(x.total) > 0)) e.push(`${m}: total harus lebih dari 0.`);
    });
  });
  return e;
}

const bentukPekerjaan = (k, id) => ({
  id,
  nama: String(k.nama).trim(),
  pesanan: (k.pesanan ?? []).map((x) => ({
    id: x.id ? Number(x.id) : nextId('pesanan'),
    noInvoice: String(x.noInvoice ?? '').trim(),
    produk: String(x.produk ?? '').trim(),
    keterangan: String(x.keterangan ?? '').trim(),
    total: Number(x.total) || 0,
  })),
});

/** Data tingkat project: kode, kontrak (INAPROC, nomor, tanggal, nilai) dan persen PPh. SP2D dihitung dari nilai dan persen ini. */
const dataProject = (d) => ({
  nama: d.nama.trim(),
  kodeProject: String(d.kodeProject).trim(),
  kontrakInaproc: String(d.kontrakInaproc).trim().toUpperCase(),
  nomorKontrak: String(d.nomorKontrak ?? '').trim(),
  tglKontrak: d.tglKontrak || '',
  nilaiKontrak: Number(d.nilaiKontrak) || 0,
  persenPotongan: bacaPersen(d.persenPotongan),
});

export async function createProject(data) {
  const e = periksa(data, null);
  if (e.length) return tolak(422, 'Data project belum lengkap.', e);
  const p = { id: nextId('project'), ...dataProject(data), pekerjaan: data.pekerjaan.map((k) => bentukPekerjaan(k, nextId('pekerjaan'))) };
  db().projects.push(p);
  simpan();
  return balas(olahProject(p, db().trx));
}

export async function updateProject(id, data) {
  const p = db().projects.find((x) => x.id === Number(id));
  if (!p) return tolak(404, 'Project tidak ditemukan.');
  const e = periksa(data, p.id);
  if (e.length) return tolak(422, 'Data project belum lengkap.', e);
  const trx = db().trx;

  const dipertahankan = new Set(data.pekerjaan.filter((k) => k.id).map((k) => Number(k.id)));
  const dihapus = p.pekerjaan.find((k) => !dipertahankan.has(k.id) && trx.some((t) => t.pekerjaanId === k.id));
  if (dihapus) return tolak(409, `Pekerjaan "${dihapus.nama}" masih memiliki transaksi, sehingga belum dapat dihapus.`);

  const masalah = [];
  const sp2dBaru = hitungSp2d(data.nilaiKontrak, PPN_PERSEN, bacaPersen(data.persenPotongan));
  const cair = olahKontrak(p, trx).cair;
  if (cair - sp2dBaru > 1) masalah.push(`SP2D baru (${rp(sp2dBaru)}) lebih kecil dari pencairan yang sudah tercatat (${rp(cair)}).`);
  for (const lama of p.pekerjaan) {
    const baru = data.pekerjaan.find((k) => Number(k.id) === lama.id);
    if (!baru) continue;
    const olahan = olahPekerjaan(lama, p.id, trx);
    for (const ps of olahan.pesanan) {
      const kiriman = (baru.pesanan ?? []).find((x) => Number(x.id) === ps.id);
      if (!kiriman && ps.pembayaran.length) return tolak(409, `Pesanan "${ps.noInvoice || ps.keterangan}" sudah memiliki pembayaran, sehingga belum dapat dihapus.`);
      if (kiriman && ps.dibayar - Number(kiriman.total) > 1) masalah.push(`Pesanan "${ps.noInvoice || ps.keterangan}": total tidak boleh lebih kecil dari yang sudah dibayar (${rp(ps.dibayar)}).`);
    }
  }
  if (masalah.length) return tolak(422, 'Data project belum lengkap.', masalah);

  Object.assign(p, dataProject(data));
  p.pekerjaan = data.pekerjaan.map((k) => bentukPekerjaan(k, k.id ? Number(k.id) : nextId('pekerjaan')));
  simpan();
  return balas(olahProject(p, db().trx));
}

export async function deleteProject(id) {
  const p = db().projects.find((x) => x.id === Number(id));
  if (!p) return tolak(404, 'Project tidak ditemukan.');
  const n = db().trx.filter((t) => t.projectId === p.id).length;
  if (n > 0) return tolak(409, `Project masih memiliki ${n} transaksi. Hapus atau pindahkan transaksinya terlebih dahulu.`);
  db().projects = db().projects.filter((x) => x.id !== p.id);
  simpan();
  return balas({ ok: true });
}

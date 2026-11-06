/**
 * MODE DEMO. Satu daftar transaksi untuk rekening global (giro) dan kas.
 * Klasifikasi: PROJECT (pencairan SP2D dan biaya langsung), PESANAN (pembayaran ke AJK), OPERASIONAL.
 * Aturan yang kelak dijaga server (batas SP2D, batas total pesanan, tahap satu kali) sudah dijalankan di sini.
 */
import { balas, db, nextId, simpan, tolak } from './mockDb';
import { olahKontrak, olahPekerjaan } from './project.demo';
import { REKENING, labelTahap } from '../konstanta';
import { urutBayar } from '../../utils/pesanan';
import { deletePiutang, olahPihak } from './piutang.demo';

const rp = (n) => `Rp ${Math.round(n).toLocaleString('id-ID')}`;

function cariPesanan(pesananId) {
  for (const p of db().projects) for (const k of p.pekerjaan) {
    const ps = k.pesanan?.find((x) => x.id === Number(pesananId));
    if (ps) return { project: p, pekerjaan: k, pesanan: ps };
  }
  return null;
}

const bentuk = (t) => {
  const p = t.projectId ? db().projects.find((x) => x.id === t.projectId) : null;
  const pk = p?.pekerjaan.find((x) => x.id === t.pekerjaanId);
  const ps = t.pesananId ? pk?.pesanan?.find((x) => x.id === t.pesananId) : null;
  let pembayaranKe = null;
  if (ps) {
    const urut = db().trx.filter((x) => x.pesananId === ps.id).sort(urutBayar);
    pembayaranKe = urut.findIndex((x) => x.id === t.id) + 1;
  }
  const pihak = t.klasifikasi === 'PIUTANG' ? db().pihak.find((x) => x.id === t.pihakId) : null;
  const rinci = pihak ? olahPihak(pihak).rincian.find((r) => r.id === t.id) : null;
  return {
    ...t, namaProject: p?.nama ?? null, namaPekerjaan: pk?.nama ?? null,
    noInvoicePesanan: ps?.noInvoice || null, produkPesanan: ps?.produk || null, pembayaranKe,
    namaPihak: pihak?.nama ?? null, jenisPiutang: rinci?.jenis ?? null, nomorPiutang: rinci?.no ?? null,
  };
};

/** Urut lama ke baru, saldo berjalan hanya untuk rekening giro. */
export function listTransaksi() {
  const urut = [...db().trx].sort(urutBayar);
  let saldo = 0;
  const rows = urut.map((t) => {
    if (t.rekening === 'GIRO') saldo += t.arah === 'MASUK' ? t.nominal : -t.nominal;
    return { ...bentuk(t), saldo: t.rekening === 'GIRO' ? saldo : null };
  });
  const bukanSaldoAwal = (t) => t.keterangan.trim().toUpperCase() !== 'SALDO AWAL';
  const hitung = (f) => rows.filter(f).reduce((s, t) => s + t.nominal, 0);
  return balas({
    rows,
    ringkasan: {
      saldoGiro: saldo,
      // piutang (pinjaman keluar dan pembayaran masuk) bukan pendapatan atau biaya: tetap memengaruhi saldo, tidak masuk dua angka ini
      danaMasuk: hitung((t) => t.rekening === 'GIRO' && t.arah === 'MASUK' && bukanSaldoAwal(t) && t.klasifikasi !== 'PIUTANG'),
      keluarGiro: hitung((t) => t.rekening === 'GIRO' && t.arah === 'KELUAR' && t.klasifikasi !== 'PIUTANG'),
      keluarKas: hitung((t) => t.rekening === 'KAS' && t.arah === 'KELUAR'),
    },
  });
}

export async function getTransaksi(id) {
  const t = db().trx.find((x) => x.id === Number(id));
  return t ? balas(bentuk(t)) : tolak(404, 'Transaksi tidak ditemukan.');
}

export const listKategori = () => {
  const op = db().trx.filter((t) => t.klasifikasi === 'OPERASIONAL');
  const unik = (k) => [...new Set([...op.map((t) => t[k]).filter(Boolean)])].sort();
  return balas({ kategori: unik('kategori'), subkategori: unik('subkategori') });
};

function bersihkan(d) {
  const kl = ['PROJECT', 'PESANAN', 'OPERASIONAL'].includes(d.klasifikasi) ? d.klasifikasi : 'PROJECT';
  const arah = d.rekening === 'KAS' || kl === 'PESANAN' ? 'KELUAR' : d.arah;
  const teks = (v) => String(v ?? '').trim() || null;
  const punyaProject = kl !== 'OPERASIONAL';
  return {
    tanggal: d.tanggal,
    rekening: d.rekening,
    keterangan: String(d.keterangan ?? '').trim(),
    arah,
    nominal: Number(d.nominal),
    klasifikasi: kl,
    projectId: punyaProject ? Number(d.projectId) || null : null,
    pekerjaanId: punyaProject ? Number(d.pekerjaanId) || null : null,
    pesananId: kl === 'PESANAN' ? Number(d.pesananId) || null : null,
    tahap: kl === 'PROJECT' && arah === 'MASUK' ? d.tahap || null : null,
    kategori: kl === 'OPERASIONAL' ? teks(d.kategori) : null,
    subkategori: kl === 'OPERASIONAL' ? teks(d.subkategori) : null,
    noInvoice: kl === 'PESANAN' ? '' : String(d.noInvoice ?? '').trim(),
  };
}

function periksa(t, idSaatIni) {
  const e = [];
  if (!REKENING.some((r) => r.id === t.rekening)) e.push('Rekening tidak ditemukan.');
  if (!t.tanggal) e.push('Tanggal wajib diisi.');
  if (!t.keterangan) e.push('Deskripsi transaksi wajib diisi.');
  if (!(t.nominal > 0)) e.push('Nominal harus lebih dari 0.');
  if (t.rekening === 'KAS' && t.arah !== 'KELUAR') e.push('Rekening kas hanya dapat digunakan untuk dana keluar.');

  if (t.klasifikasi === 'OPERASIONAL') {
    if (!t.subkategori) e.push('Jenis operasional wajib diisi.');
    return e;
  }

  const p = db().projects.find((x) => x.id === t.projectId);
  const pk = p?.pekerjaan.find((x) => x.id === t.pekerjaanId);
  if (!p) { e.push('Pilih nama project.'); return e; }
  if (!pk) { e.push('Pilih pekerjaan dari project tersebut.'); return e; }
  const lain = db().trx.filter((x) => x.id !== idSaatIni);
  const sebelum = olahPekerjaan(pk, p.id, lain);

  if (t.klasifikasi === 'PROJECT' && t.tahap) {
    const kontrak = olahKontrak(p, lain); // SP2D dan pencairan berlaku untuk seluruh project
    if (kontrak.pencairan.find((x) => x.tahap === t.tahap)?.status === 'DONE') {
      e.push(`Tahap ${labelTahap(t.tahap)} pada project ini sudah tercatat. Pilih tahap yang lain.`);
    } else if (kontrak.cair + t.nominal > kontrak.sp2d + 1) {
      e.push(`Total pencairan melebihi SP2D project ini. Sisa SP2D: ${rp(kontrak.belumCair)}.`);
    }
  }

  if (t.klasifikasi === 'PESANAN') {
    const ps = sebelum.pesanan.find((x) => x.id === t.pesananId);
    if (!ps) e.push('Pilih pesanan yang dibayar.');
    else if (t.nominal > ps.sisa + 1) e.push(`Pembayaran melebihi sisa pesanan ${ps.noInvoice || ps.keterangan}. Sisa: ${rp(ps.sisa)}.`);
  }
  return e;
}

const TOLAK_PIUTANG = 'Piutang dicatat dan diubah melalui tab Piutang.';

export async function createTransaksi(data) {
  if (data.klasifikasi === 'PIUTANG') return tolak(422, TOLAK_PIUTANG);
  const t = bersihkan(data);
  const e = periksa(t, null);
  if (e.length) return tolak(422, e[0], e.slice(1));
  const baru = { id: nextId('trx'), ...t };
  db().trx.push(baru);
  simpan();
  return balas(bentuk(baru));
}

export async function updateTransaksi(id, data) {
  const ada = db().trx.find((x) => x.id === Number(id));
  if (!ada) return tolak(404, 'Transaksi tidak ditemukan.');
  if (ada.klasifikasi === 'PIUTANG' || data.klasifikasi === 'PIUTANG') return tolak(422, TOLAK_PIUTANG);
  const t = bersihkan(data);
  const e = periksa(t, ada.id);
  if (e.length) return tolak(422, e[0], e.slice(1));
  Object.assign(ada, t);
  simpan();
  return balas(bentuk(ada));
}

export async function deleteTransaksi(id) {
  if (db().trx.find((x) => x.id === Number(id))?.klasifikasi === 'PIUTANG') return deletePiutang(id);
  const n = db().trx.length;
  db().trx = db().trx.filter((x) => x.id !== Number(id));
  if (db().trx.length === n) return tolak(404, 'Transaksi tidak ditemukan.');
  simpan();
  return balas({ ok: true });
}

export { cariPesanan };

/**
 * MODE DEMO. Piutang: pinjaman (dana keluar) dan pembayaran (dana masuk) kepada/dari pihak lain.
 * Seluruhnya melalui rekening giro, disimpan sebagai transaksi berklasifikasi PIUTANG supaya saldo giro selalu benar.
 * Nomor "Pinjaman N" dan "Pembayaran N" mengikuti urutan tanggal, tidak diketik.
 */
import { balas, db, nextId, simpan, tolak } from './mockDb';
import { normalNama, rapikanNama } from '../../utils/pihak';
import { urutBayar } from '../../utils/pesanan';

const bulat = (n) => Math.round(n * 100) / 100;
const rp = (n) => `Rp ${Math.round(n).toLocaleString('id-ID')}`;
const jumlah = (arr) => arr.reduce((s, t) => s + t.nominal, 0);
const trxPihak = (pihakId) => db().trx.filter((t) => t.klasifikasi === 'PIUTANG' && t.pihakId === pihakId);

/** Satu pihak beserta rincian bernomor dan angka turunannya. */
export function olahPihak(p) {
  const trx = trxPihak(p.id).sort(urutBayar);
  const pinjaman = trx.filter((t) => t.arah === 'KELUAR');
  const pembayaran = trx.filter((t) => t.arah === 'MASUK');
  const nomor = new Map([...pinjaman, ...pembayaran].map((t) => [t.id, (t.arah === 'KELUAR' ? pinjaman : pembayaran).indexOf(t) + 1]));
  const total = bulat(jumlah(pinjaman));
  const dibayar = bulat(jumlah(pembayaran));
  return {
    id: p.id, nama: p.nama, total, dibayar,
    sisa: bulat(Math.max(total - dibayar, 0)),
    lunas: total > 0 && total - dibayar < 1,
    jumlahPinjaman: pinjaman.length, jumlahPembayaran: pembayaran.length,
    rincian: trx.map((t) => {
      const jenis = t.arah === 'KELUAR' ? 'PINJAMAN' : 'PEMBAYARAN';
      return { id: t.id, jenis, no: nomor.get(t.id), label: `${jenis === 'PINJAMAN' ? 'Pinjaman' : 'Pembayaran'} ${nomor.get(t.id)}`, tanggal: t.tanggal, keterangan: t.keterangan, nominal: t.nominal };
    }),
  };
}

export function listPiutang() {
  const pihak = db().pihak.map(olahPihak).filter((p) => p.rincian.length).sort((a, b) => a.nama.localeCompare(b.nama, 'id'));
  return balas({
    ringkasan: {
      totalPiutang: bulat(jumlah(pihak.map((p) => ({ nominal: p.total })))),
      dibayar: bulat(jumlah(pihak.map((p) => ({ nominal: p.dibayar })))),
      sisa: bulat(jumlah(pihak.map((p) => ({ nominal: p.sisa })))),
      jumlahPihak: pihak.length,
    },
    pihak,
  });
}

const item = (t) => {
  const p = db().pihak.find((x) => x.id === t.pihakId);
  const rinci = p ? olahPihak(p).rincian.find((r) => r.id === t.id) : null;
  return { id: t.id, jenis: t.arah === 'KELUAR' ? 'PINJAMAN' : 'PEMBAYARAN', pihakId: t.pihakId, namaPihak: p?.nama ?? null, tanggal: t.tanggal, nominal: t.nominal, keterangan: t.keterangan, nomor: rinci?.no ?? null };
};

export async function getPiutang(id) {
  const t = db().trx.find((x) => x.id === Number(id) && x.klasifikasi === 'PIUTANG');
  return t ? balas(item(t)) : tolak(404, 'Data piutang tidak ditemukan.');
}

function periksa(data, ada) {
  const e = [];
  const jenis = ada ? (ada.arah === 'KELUAR' ? 'PINJAMAN' : 'PEMBAYARAN') : data.jenis;
  if (!['PINJAMAN', 'PEMBAYARAN'].includes(jenis)) e.push('Jenis piutang tidak valid.');
  if (!data.tanggal) e.push('Tanggal wajib diisi.');
  const nominal = Number(data.nominal);
  if (!(nominal > 0)) e.push('Nominal harus lebih dari 0.');
  if (!String(data.keterangan ?? '').trim()) e.push('Keterangan wajib diisi.');

  let pihak = null;
  const nama = rapikanNama(data.pihak);
  if (ada) pihak = db().pihak.find((p) => p.id === ada.pihakId);
  else if (data.pihakId) pihak = db().pihak.find((p) => p.id === Number(data.pihakId)) ?? null;
  else if (!nama) e.push('Nama pihak wajib diisi.');
  else pihak = db().pihak.find((p) => normalNama(p.nama) === normalNama(nama)) ?? null;

  if (!pihak && jenis === 'PEMBAYARAN' && (nama || data.pihakId)) e.push('Pihak ini belum memiliki piutang. Catat pinjaman terlebih dahulu.');
  if (pihak && nominal > 0) {
    const lain = trxPihak(pihak.id).filter((t) => t.id !== ada?.id);
    const total = jumlah(lain.filter((t) => t.arah === 'KELUAR'));
    const dibayar = jumlah(lain.filter((t) => t.arah === 'MASUK'));
    if (jenis === 'PEMBAYARAN' && nominal > total - dibayar + 1) e.push(`Pembayaran melebihi sisa piutang ${pihak.nama}. Sisa: ${rp(Math.max(total - dibayar, 0))}.`);
    if (jenis === 'PINJAMAN' && ada && total + nominal < dibayar - 1) e.push(`Nilai pinjaman tidak boleh lebih kecil dari pembayaran yang sudah tercatat (${rp(dibayar)}).`);
  }
  return { e, pihak, jenis, nama };
}

export async function createPiutang(data) {
  const { e, pihak: ada, jenis, nama } = periksa(data, null);
  if (e.length) return tolak(422, e[0], e.slice(1));
  let pihak = ada;
  if (!pihak) { pihak = { id: nextId('pihak'), nama }; db().pihak.push(pihak); }
  const baru = {
    id: nextId('trx'), tanggal: data.tanggal, rekening: 'GIRO', keterangan: String(data.keterangan).trim(),
    arah: jenis === 'PINJAMAN' ? 'KELUAR' : 'MASUK', nominal: Number(data.nominal), klasifikasi: 'PIUTANG',
    projectId: null, pekerjaanId: null, pesananId: null, pihakId: pihak.id, tahap: null, kategori: null, subkategori: null, noInvoice: '',
  };
  db().trx.push(baru);
  simpan();
  return balas(item(baru));
}

export async function updatePiutang(id, data) {
  const ada = db().trx.find((x) => x.id === Number(id) && x.klasifikasi === 'PIUTANG');
  if (!ada) return tolak(404, 'Data piutang tidak ditemukan.');
  if (data.pihakId && Number(data.pihakId) !== ada.pihakId) return tolak(422, 'Pihak tidak dapat diubah. Hapus catatan ini, lalu catat ulang pada pihak yang benar.');
  const { e } = periksa(data, ada);
  if (e.length) return tolak(422, e[0], e.slice(1));
  Object.assign(ada, { tanggal: data.tanggal, nominal: Number(data.nominal), keterangan: String(data.keterangan).trim() });
  simpan();
  return balas(item(ada));
}

export async function deletePiutang(id) {
  const ada = db().trx.find((x) => x.id === Number(id) && x.klasifikasi === 'PIUTANG');
  if (!ada) return tolak(404, 'Data piutang tidak ditemukan.');
  if (ada.arah === 'KELUAR') {
    const lain = trxPihak(ada.pihakId).filter((t) => t.id !== ada.id);
    const total = jumlah(lain.filter((t) => t.arah === 'KELUAR'));
    const dibayar = jumlah(lain.filter((t) => t.arah === 'MASUK'));
    if (total < dibayar - 1) return tolak(409, `Pinjaman tidak dapat dihapus karena total pinjaman menjadi lebih kecil dari pembayaran yang sudah tercatat (${rp(dibayar)}). Hapus atau ubah pembayaran terlebih dahulu.`);
  }
  db().trx = db().trx.filter((t) => t.id !== ada.id);
  if (!trxPihak(ada.pihakId).length) db().pihak = db().pihak.filter((p) => p.id !== ada.pihakId); // pihak tanpa catatan dibersihkan
  simpan();
  return balas({ ok: true });
}

export async function ubahNamaPihak(id, nama) {
  const p = db().pihak.find((x) => x.id === Number(id));
  if (!p) return tolak(404, 'Pihak tidak ditemukan.');
  const baru = rapikanNama(nama);
  if (!baru) return tolak(422, 'Nama pihak wajib diisi.');
  if (db().pihak.some((x) => x.id !== p.id && normalNama(x.nama) === normalNama(baru))) return tolak(422, 'Nama pihak sudah digunakan.');
  p.nama = baru;
  simpan();
  return balas({ id: p.id, nama: p.nama });
}

/** MODE DEMO. Pengeluaran operasional (giro dan kas), dari transaksi yang sama dengan halaman Transaksi. */
import { balas, db } from './mockDb';

/** bulan: "" (semua) atau "01".."12". */
export function listOperasional({ bulan = '' } = {}) {
  const rows = db().trx
    .filter((t) => t.klasifikasi === 'OPERASIONAL' && t.arah === 'KELUAR' && (!bulan || t.tanggal.slice(5, 7) === bulan))
    .map((t) => ({
      id: t.id, tanggal: t.tanggal, rekening: t.rekening, keterangan: t.keterangan,
      kategori: t.kategori || 'Lainnya', subkategori: t.subkategori || 'Lainnya', nominal: t.nominal, noInvoice: t.noInvoice,
    }))
    .sort((a, b) => (a.tanggal < b.tanggal ? 1 : a.tanggal > b.tanggal ? -1 : b.id - a.id));
  return balas(rows);
}

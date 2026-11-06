/**
 * Satu daftar transaksi untuk rekening global (giro) dan kas.
 * Klasifikasi: PROJECT (pencairan SP2D dan biaya langsung), PESANAN (pembayaran ke AJK), OPERASIONAL.
 * Seluruh aturan (batas SP2D, batas pesanan, tahap satu kali, dst) diperiksa server.
 */
import { http } from './client';
import { MODE_DEMO } from './mode';

export { REKENING, namaRekening } from './konstanta';
const demo = () => import('./demo/transaksi.demo');
const angkaAtauNaN = (v) => (v === '' || v === null || v === undefined ? NaN : Number(v));

const kirim = (d) => ({
  tanggal: d.tanggal,
  rekening: d.rekening,
  keterangan: d.keterangan,
  arah: d.arah,
  nominal: angkaAtauNaN(d.nominal),
  klasifikasi: d.klasifikasi,
  projectId: d.projectId || null,
  pekerjaanId: d.pekerjaanId || null,
  pesananId: d.pesananId || null,
  tahap: d.tahap || null,
  kategori: d.kategori,
  subkategori: d.subkategori,
  noInvoice: d.noInvoice,
});

/** Urut lama ke baru; saldo berjalan hanya untuk rekening giro. */
export const listTransaksi = () => (MODE_DEMO ? demo().then((m) => m.listTransaksi()) : http('/transaksi'));
export const getTransaksi = (id) => (MODE_DEMO ? demo().then((m) => m.getTransaksi(id)) : http(`/transaksi/${Number(id)}`));
export const listKategori = () => (MODE_DEMO ? demo().then((m) => m.listKategori()) : http('/transaksi/kategori'));
export const createTransaksi = (data) => (MODE_DEMO ? demo().then((m) => m.createTransaksi(kirim(data))) : http('/transaksi', { method: 'POST', body: kirim(data) }));
export const updateTransaksi = (id, data) => (MODE_DEMO ? demo().then((m) => m.updateTransaksi(id, kirim(data))) : http(`/transaksi/${Number(id)}`, { method: 'PUT', body: kirim(data) }));
export const deleteTransaksi = (id) => (MODE_DEMO ? demo().then((m) => m.deleteTransaksi(id)) : http(`/transaksi/${Number(id)}`, { method: 'DELETE' }));

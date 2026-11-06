/**
 * Piutang: pinjaman (dana keluar) dan pembayaran (dana masuk), seluruhnya melalui rekening giro.
 * Server menyimpannya sebagai transaksi berklasifikasi PIUTANG. Bentuk data lengkap ada di API_KONTRAK.md.
 */
import { http } from './client';
import { MODE_DEMO } from './mode';

const demo = () => import('./demo/piutang.demo');
const angkaAtauNaN = (v) => (v === '' || v === null || v === undefined ? NaN : Number(v));

const kirim = (d) => ({
  jenis: d.jenis,
  pihakId: d.pihakId || null,
  pihak: String(d.pihak ?? '').trim(),
  tanggal: d.tanggal,
  nominal: angkaAtauNaN(d.nominal),
  keterangan: d.keterangan,
});

/** Seluruh pihak beserta rincian pinjaman dan pembayaran bernomor, dan ringkasan total. */
export const listPiutang = () => (MODE_DEMO ? demo().then((m) => m.listPiutang()) : http('/piutang'));
export const getPiutang = (id) => (MODE_DEMO ? demo().then((m) => m.getPiutang(id)) : http(`/piutang/${Number(id)}`));
export const createPiutang = (data) => (MODE_DEMO ? demo().then((m) => m.createPiutang(kirim(data))) : http('/piutang', { method: 'POST', body: kirim(data) }));
export const updatePiutang = (id, data) => (MODE_DEMO ? demo().then((m) => m.updatePiutang(id, kirim(data))) : http(`/piutang/${Number(id)}`, { method: 'PUT', body: kirim(data) }));
export const deletePiutang = (id) => (MODE_DEMO ? demo().then((m) => m.deletePiutang(id)) : http(`/piutang/${Number(id)}`, { method: 'DELETE' }));
export const ubahNamaPihak = (id, nama) => (MODE_DEMO ? demo().then((m) => m.ubahNamaPihak(id, nama)) : http(`/piutang/pihak/${Number(id)}`, { method: 'PUT', body: { nama } }));

/**
 * Project (kontrak, nilai, SP2D) -> pekerjaan -> satu pesanan ke AJK. Semua angka turunan (SP2D, pencairan, dibayar, sisa, rekap)
 * dihitung server dari transaksi. Bentuk data lengkap ada di API_KONTRAK.md.
 */
import { http } from './client';
import { MODE_DEMO } from './mode';
import { bacaPersen } from '../utils/pajak';

export { TAHAP, labelTahap } from './konstanta';
const demo = () => import('./demo/project.demo');
const angkaAtauNaN = (v) => (v === '' || v === null || v === undefined ? NaN : Number(v));

/** Data formulir menjadi isi permintaan. Persen pajak diketik pengguna ("1,75"), dikirim sebagai angka. */
const kirim = (data) => ({
  nama: String(data.nama ?? '').trim(),
  kodeProject: String(data.kodeProject ?? '').trim(),
  kontrakInaproc: String(data.kontrakInaproc ?? '').trim(),
  nomorKontrak: String(data.nomorKontrak ?? '').trim(),
  tglKontrak: data.tglKontrak || null,
  nilaiKontrak: angkaAtauNaN(data.nilaiKontrak),
  persenPotongan: bacaPersen(data.persenPotongan),
  pekerjaan: (data.pekerjaan ?? []).map((k) => ({
    ...(k.id ? { id: Number(k.id) } : {}),
    nama: k.nama,
    pesanan: (k.pesanan ?? []).map((x) => ({
      ...(x.id ? { id: Number(x.id) } : {}),
      noInvoice: x.noInvoice,
      produk: x.produk,
      keterangan: x.keterangan,
      total: angkaAtauNaN(x.total),
    })),
  })),
});

export const listProject = () => (MODE_DEMO ? demo().then((m) => m.listProject()) : http('/project'));
export const getProject = (id) => (MODE_DEMO ? demo().then((m) => m.getProject(id)) : http(`/project/${Number(id)}`));
export const createProject = (data) => (MODE_DEMO ? demo().then((m) => m.createProject(kirim(data))) : http('/project', { method: 'POST', body: kirim(data) }));
export const updateProject = (id, data) => (MODE_DEMO ? demo().then((m) => m.updateProject(id, kirim(data))) : http(`/project/${Number(id)}`, { method: 'PUT', body: kirim(data) }));
export const deleteProject = (id) => (MODE_DEMO ? demo().then((m) => m.deleteProject(id)) : http(`/project/${Number(id)}`, { method: 'DELETE' }));

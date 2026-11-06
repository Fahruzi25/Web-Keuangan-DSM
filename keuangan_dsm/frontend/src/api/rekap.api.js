import { http } from './client';
import { MODE_DEMO } from './mode';

/**
 * Rekap transaksi project per periode, dibaca dari data transaksi (tidak ada isian).
 * tahun: "2026"; bulan: "" (semua) atau "01".."12"; projectId: "" (semua) atau id.
 * Cakupan: transaksi klasifikasi Project dan Pesanan, dikelompokkan per project lalu per pekerjaan.
 */
export const getRekap = ({ tahun, bulan = '', projectId = '' } = {}) =>
  MODE_DEMO
    ? import('./demo/rekap.demo').then((m) => m.getRekap({ tahun, bulan, projectId }))
    : http('/rekap', { params: { tahun, bulan, projectId, sumber: 'PROJECT,PESANAN' } });

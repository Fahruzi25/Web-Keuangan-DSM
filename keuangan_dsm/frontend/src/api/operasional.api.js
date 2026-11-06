import { http } from './client';
import { MODE_DEMO } from './mode';

/** Pengeluaran operasional (giro dan kas). bulan: "" (semua) atau "01".."12". */
export const listOperasional = ({ bulan = '' } = {}) =>
  MODE_DEMO ? import('./demo/operasional.demo').then((m) => m.listOperasional({ bulan })) : http('/operasional', { params: { bulan } });

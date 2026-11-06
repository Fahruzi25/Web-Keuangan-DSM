import { http } from './client';
import { MODE_DEMO } from './mode';

/** Ringkasan halaman Home, dihitung server dari data yang sama dengan halaman lain. */
export const getDashboard = () => (MODE_DEMO ? import('./demo/dashboard.demo').then((m) => m.getDashboard()) : http('/dashboard'));

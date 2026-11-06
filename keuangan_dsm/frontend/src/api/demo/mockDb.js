/**
 * MODE DEMO (tanpa server).
 * Seluruh data disimpan di localStorage browser, sehingga Project, Pesanan, Transaksi, dan Operasional
 * saling terhubung seperti saat backend tersambung. Untuk mengembalikan data awal, jalankan
 * `resetDemo()` (ada tombolnya di footer) atau hapus kunci "dsm_demo_db_v9" di localStorage.
 * Pembukaan pertama memuat data contoh (contoh.js). Tombol "Kosongkan data demo" di footer mengosongkannya;
 * data yang sudah dikosongkan tidak dimuat ulang otomatis.
 * Saat backend siap, isi file *.api.js diganti dengan pemanggilan `http()` dari client.js.
 */
import { seedContoh } from './contoh';

const KEY = 'dsm_demo_db_v9';
const KUNCI_LAMA = ['dsm_demo_db_v2', 'dsm_demo_db_v3', 'dsm_demo_db_v4', 'dsm_demo_db_v5', 'dsm_demo_db_v6', 'dsm_demo_db_v7', 'dsm_demo_db_v8']; // berisi data contoh versi sebelumnya, dibuang
let cache = null;

function kosong() {
  return { v: 9, projects: [], pihak: [], trx: [], seq: { project: 0, pekerjaan: 0, pesanan: 0, pihak: 0, trx: 0 } };
}

export function db() {
  if (cache) return cache;
  try {
    KUNCI_LAMA.forEach((k) => localStorage.removeItem(k));
    const raw = localStorage.getItem(KEY);
    if (raw) {
      cache = JSON.parse(raw);
      cache.pihak ??= [];
      cache.seq.pihak ??= 0;
      return cache;
    }
  } catch { /* abaikan, pakai data awal */ }
  cache = seedContoh(); // pembukaan pertama: data contoh agar tampilan tidak polos
  simpan();
  return cache;
}

export function simpan() {
  try { localStorage.setItem(KEY, JSON.stringify(cache)); } catch { /* penyimpanan penuh atau diblokir */ }
}

export function resetDemo() {
  cache = kosong();
  simpan();
}

/** Memuat ulang data contoh (tombol di footer). */
export function muatContoh() {
  cache = seedContoh();
  simpan();
}

/** Mengisi seluruh data sekaligus. Dipakai pengujian; aplikasi sendiri selalu mulai kosong. */
export function isiDemo(data) {
  cache = data;
  simpan();
}

export const nextId = (jenis) => { const d = db(); d.seq[jenis] += 1; return d.seq[jenis]; };

/** Meniru jeda jaringan dan mengembalikan salinan data, supaya state di halaman tidak berbagi referensi. */
export const balas = (nilai) => new Promise((ok) => setTimeout(() => ok(JSON.parse(JSON.stringify(nilai))), 120));

export const gagal = (status, message, errors) => Object.assign(new Error(message), { status, errors });
export const tolak = (status, message, errors) => new Promise((_, no) => setTimeout(() => no(gagal(status, message, errors)), 120));

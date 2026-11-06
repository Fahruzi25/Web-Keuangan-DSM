/**
 * Sumber data aplikasi, dibaca dari VITE_API_MODE:
 * - kosong atau "demo" : BAWAAN. Tanpa server; data disimpan di browser dan dimulai kosong.
 * - "http"             : memanggil backend lewat BASE_URL (lihat client.js). Dipakai setelah backend siap.
 */
export const MODE_DEMO = import.meta.env.VITE_API_MODE !== 'http';

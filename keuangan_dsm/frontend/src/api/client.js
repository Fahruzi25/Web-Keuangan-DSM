
/**
 * Alamat dasar API, dibaca dari VITE_API_BASE_URL (file .env di folder frontend).
 * Kosong = '/api' (diteruskan Vite ke backend saat npm run dev).
 * Contoh isi: http://localhost:3000/api atau https://api.contoh.com/api
 */
export const BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api').trim().replace(/\/+$/, '');
const TOKEN_KEY = 'dsm_token';
export const USER_KEY = 'dsm_user';

export const ambilToken = () => sessionStorage.getItem(TOKEN_KEY);
export const simpanSesi = (token, user) => {
  sessionStorage.setItem(TOKEN_KEY, token);
  sessionStorage.setItem(USER_KEY, JSON.stringify(user));
};
export const hapusSesi = () => {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
};


export const angka = (v) => (v === null || v === undefined || v === '' ? 0 : Number(v));
export const tanggal = (v) => (v ? String(v).slice(0, 10) : '');

export const gagal = (status, message) => Object.assign(new Error(message), { status });

export async function http(path, { method = 'GET', body, params } = {}) {
  const qs = params
    ? new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')).toString()
    : '';
  const token = ambilToken();

  let res;
  try {
    res = await fetch(`${BASE_URL}${path}${qs ? `?${qs}` : ''}`, {
      method,
      headers: {
        ...(body !== undefined && { 'Content-Type': 'application/json' }),
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw gagal(0, 'Tidak dapat terhubung ke server.');
  }

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    if (res.status === 401 && token && !path.startsWith('/auth/login')) {
      hapusSesi(); 
      if (window.location.pathname !== '/login') window.location.assign('/login');
    }
    throw Object.assign(new Error(data?.message || `Permintaan gagal (${res.status}).`), {
      status: res.status,
      errors: data?.errors,
    });
  }
  return data;
}

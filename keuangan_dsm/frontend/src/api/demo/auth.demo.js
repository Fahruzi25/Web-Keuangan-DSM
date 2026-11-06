/** Login mode demo: menerima nama pengguna dan kata sandi apa saja. */
import { balas, tolak } from './mockDb';
import { ambilToken, hapusSesi, simpanSesi, USER_KEY } from '../client';

export async function login({ username, password }) {
  if (!username?.trim() || !password) return tolak(401, 'Nama pengguna atau kata sandi tidak sesuai.');
  const u = { id: 1, username: username.trim(), namaLengkap: username.trim() };
  simpanSesi('demo', u);
  return balas(u);
}

export async function logout() { hapusSesi(); }

export async function me() {
  if (!ambilToken()) return null;
  try { return JSON.parse(sessionStorage.getItem(USER_KEY)); } catch { return null; }
}

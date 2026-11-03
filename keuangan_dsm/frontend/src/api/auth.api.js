/** MODE DEMO: login menerima username dan password apa saja. */
import { balas, tolak } from './mockDb';

const TOKEN_KEY = 'dsm_token';
export const USER_KEY = 'dsm_user';

const baca = () => { try { return JSON.parse(sessionStorage.getItem(USER_KEY)); } catch { return null; } };

export async function login({ username, password }) {
  if (!username?.trim() || !password) return tolak(401, 'Nama pengguna atau kata sandi tidak sesuai.');
  const u = { id: 1, username: username.trim(), namaLengkap: username.trim() };
  sessionStorage.setItem(TOKEN_KEY, 'demo');
  sessionStorage.setItem(USER_KEY, JSON.stringify(u));
  return balas(u);
}

export async function logout() {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
}

export async function me() {
  return sessionStorage.getItem(TOKEN_KEY) ? baca() : null;
}

import { ambilToken, hapusSesi, http, simpanSesi, USER_KEY } from './client';
import { MODE_DEMO } from './mode';

export { USER_KEY };
const demo = () => import('./demo/auth.demo');

export async function login({ username, password }) {
  if (MODE_DEMO) return (await demo()).login({ username, password });
  const { token, user } = await http('/auth/login', { method: 'POST', body: { username, password } });
  simpanSesi(token, user);
  return user;
}

export async function logout() {
  if (MODE_DEMO) return (await demo()).logout();
  try {
    await http('/auth/logout', { method: 'POST' });
  } catch {
    /* tetap keluar di sisi browser walaupun server tidak terjangkau */
  } finally {
    hapusSesi();
  }
}

/** Memeriksa sesi saat halaman dibuka. Token kedaluwarsa atau tidak valid berarti belum masuk. */
export async function me() {
  if (MODE_DEMO) return (await demo()).me();
  if (!ambilToken()) return null;
  try {
    return await http('/auth/me');
  } catch (err) {
    if (err.status === 401) hapusSesi();
    return null;
  }
}

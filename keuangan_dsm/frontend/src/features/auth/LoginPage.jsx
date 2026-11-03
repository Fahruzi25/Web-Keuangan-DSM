import { useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Logo from '../../components/ui/Logo';

export default function LoginPage() {
  const { user, login } = useAuth();
  const location = useLocation();
  const [form, setForm] = useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const tujuan = location.state?.from?.pathname || '/';
  if (user) return <Navigate to={tujuan} replace />;

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  async function onSubmit(e) {
    e.preventDefault();
    if (!form.username.trim() || !form.password) {
      setError('Isi nama pengguna dan kata sandi terlebih dahulu.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await login({ username: form.username.trim(), password: form.password });
    } catch (err) {
      setError(
        err.status === 401
          ? 'Nama pengguna atau kata sandi tidak sesuai. Periksa kembali, lalu coba masuk lagi.'
          : 'Server tidak merespons. Silakan coba kembali beberapa saat lagi.'
      );
      setBusy(false);
    }
  }

  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden bg-gradient-to-b from-army-950 via-army-900 to-army-800 px-4 py-10">
      <div aria-hidden="true" className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-ember-500/30 blur-3xl" />
      <div aria-hidden="true" className="absolute -bottom-32 -left-24 h-96 w-96 rounded-full bg-army-500/30 blur-3xl" />

      <div className="relative w-full max-w-md rounded-4xl border border-white/15 bg-white/10 p-8 shadow-glass backdrop-blur-2xl sm:p-10">
        <div className="mb-8 flex justify-center"><Logo tinggi={52} /></div>

        <form onSubmit={onSubmit} noValidate className="space-y-5">
          <div>
            <h1 className="text-2xl font-extrabold text-white">Masuk</h1>
            <p className="mt-1 text-sm text-army-200">Akses terbatas bagi pengguna terdaftar.</p>
          </div>

          <div className="field">
            <label htmlFor="username" className="text-xs font-semibold uppercase tracking-wide text-army-200">Nama pengguna</label>
            <input id="username" name="username" autoComplete="username" autoFocus className="input border-white/20 bg-white/90"
              value={form.username} onChange={onChange} aria-invalid={!!error} />
          </div>

          <div className="field">
            <label htmlFor="password" className="text-xs font-semibold uppercase tracking-wide text-army-200">Kata sandi</label>
            <div className="relative">
              <input id="password" name="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password"
                className="input border-white/20 bg-white/90 pr-28" value={form.password} onChange={onChange} aria-invalid={!!error} />
              <button type="button" aria-pressed={showPassword} onClick={() => setShowPassword((s) => !s)}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full px-3 py-1 text-xs font-semibold text-army-700 hover:bg-army-100">
                {showPassword ? 'Sembunyikan' : 'Tampilkan'}
              </button>
            </div>
          </div>

          <p role="alert" hidden={!error} className="rounded-xl bg-red-100 px-3 py-2 text-sm font-medium text-red-800">{error}</p>

          <button type="submit" disabled={busy} className="btn btn-primary w-full py-3 text-base">
            {busy ? 'Memeriksa…' : 'Masuk'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-army-300">Lupa kata sandi? Hubungi administrator sistem untuk mengatur ulang.</p>
      </div>
    </div>
  );
}

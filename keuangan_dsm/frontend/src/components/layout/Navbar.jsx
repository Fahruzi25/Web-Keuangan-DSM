import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Logo from '../ui/Logo';

const MENU = [
  { to: '/', label: 'Home', end: true },
  { to: '/transaksi', label: 'Transaksi' },
  { to: '/project', label: 'Project' },
  { to: '/operasional', label: 'Operasional' },
];

const kelasLink = ({ isActive }) =>
  `flex min-h-[2.75rem] items-center justify-center rounded-full px-6 text-[15px] font-semibold transition lg:px-7 ${
    isActive ? 'bg-ember-500 text-white shadow' : 'text-army-50 hover:bg-white/15 hover:text-white'
  }`;

/** Bilah header transparan: tiap bagian berupa kapsul kaca (glassmorphism) yang melayang. */
export default function Navbar() {
  const { user, logout } = useAuth();
  const [buka, setBuka] = useState(false);
  const [turun, setTurun] = useState(false);
  const { pathname } = useLocation();
  useEffect(() => setBuka(false), [pathname]);
  useEffect(() => {
    const onScroll = () => setTurun(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // sedikit lebih pekat saat halaman digulir agar teks tetap terbaca di atas konten terang
  const kaca = `border border-white/20 backdrop-blur-2xl backdrop-saturate-150 shadow-glass transition-colors ${turun ? 'bg-army-950/65' : 'bg-white/10'}`;
  const nama = user?.namaLengkap || user?.username;

  return (
    <div className="sticky top-0 z-40 px-4 pt-4 sm:px-6">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
        <Link to="/" aria-label="DSM Keuangan, ke halaman Home" className={`flex min-h-[3.25rem] shrink-0 items-center rounded-full py-1.5 pl-4 pr-5 ${kaca}`}>
          <Logo tinggi={34} />
        </Link>

        <nav aria-label="Menu utama" className={`hidden rounded-full p-1.5 md:block ${kaca}`}>
          <ul className="flex items-center gap-1.5">
            {MENU.map((m) => (
              <li key={m.to}><NavLink to={m.to} end={m.end} className={kelasLink}>{m.label}</NavLink></li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-3">
          <div className={`hidden min-h-[3.25rem] items-center gap-4 rounded-full py-1.5 pl-5 pr-1.5 md:flex ${kaca}`}>
            <span className="max-w-[8rem] truncate text-sm font-semibold text-white">{nama}</span>
            <button type="button" onClick={logout} className="btn min-h-[2.5rem] border-transparent px-5 text-army-900 hover:border-transparent hover:bg-army-100">
              Keluar
              <span className="grid h-5 w-5 place-items-center rounded-full bg-army-900 text-white">
                <svg viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3" aria-hidden="true"><path d="M11.3 3.3a1 1 0 0 1 1.4 0l5 5a1 1 0 0 1 0 1.4l-5 5a1 1 0 1 1-1.4-1.4L14.6 10H3a1 1 0 1 1 0-2h11.6l-3.3-3.3a1 1 0 0 1 0-1.4Z" /></svg>
              </span>
            </button>
          </div>
          <button
            type="button"
            className={`grid h-[3.25rem] w-[3.25rem] place-items-center rounded-full text-white md:hidden ${kaca}`}
            aria-expanded={buka}
            aria-controls="menu-mobile"
            aria-label={buka ? 'Tutup menu' : 'Buka menu'}
            onClick={() => setBuka((b) => !b)}
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              {buka ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>
      </div>

      {buka && (
        <nav id="menu-mobile" aria-label="Menu utama" className="absolute inset-x-4 top-full mt-1 rounded-3xl border border-white/20 bg-army-950/80 p-3 shadow-glass backdrop-blur-2xl sm:inset-x-6 md:hidden">
          <ul className="flex flex-col gap-1.5">
            {MENU.map((m) => (
              <li key={m.to}><NavLink to={m.to} end={m.end} className={kelasLink}>{m.label}</NavLink></li>
            ))}
            <li className="mt-1 flex items-center justify-between gap-3 border-t border-white/15 px-3 pt-3">
              <span className="truncate text-sm font-semibold text-white">{nama}</span>
              <button type="button" onClick={logout} className="btn btn-sm border-transparent px-5 text-army-900 hover:border-transparent hover:bg-army-100">Keluar</button>
            </li>
          </ul>
        </nav>
      )}
    </div>
  );
}

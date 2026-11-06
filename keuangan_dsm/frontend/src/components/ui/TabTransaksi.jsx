import { NavLink, useLocation, useSearchParams } from 'react-router-dom';

const TAB = [
  { to: '/transaksi', label: 'Transaksi', end: true, judul: 'Daftar transaksi', ket: 'Transaksi rekening global dan kas' },
  { to: '/transaksi/piutang', label: 'Piutang', judul: 'Rincian piutang', ket: 'Pinjaman dan pembayaran per pihak' },
];
const REKAP = { judul: 'Rekap project', ket: 'Buku besar per project dan pekerjaan' };

/**
 * Dua bagian di halaman Transaksi, selebar kartu di bawahnya: keterangan bagian aktif di kiri, tombol di kanan.
 * Tampilan Rekap adalah bagian dari tab Transaksi (alamat /transaksi?tampilan=rekap).
 * Masing-masing punya alamat sendiri, sehingga tetap terbuka saat halaman dimuat ulang.
 */
export default function TabTransaksi() {
  const { pathname } = useLocation();
  const [params] = useSearchParams();
  const aktif = TAB.find((t) => (t.end ? pathname === t.to : pathname.startsWith(t.to))) ?? TAB[0];
  const teks = aktif.to === '/transaksi' && params.get('tampilan') === 'rekap' ? REKAP : aktif;

  return (
    <nav aria-label="Bagian transaksi" className="card flex-row flex-wrap items-center justify-between gap-x-6 gap-y-3 p-3 sm:py-3 sm:pl-6 sm:pr-3">
      <div className="min-w-0 px-2 sm:px-0">
        <p className="text-base font-bold text-army-900">{teks.judul}</p>
        <p className="hint text-sm">{teks.ket}</p>
      </div>
      <div className="flex w-full gap-1 rounded-full border border-army-200 bg-army-50 p-1 sm:w-auto">
        {TAB.map((t) => (
          <NavLink key={t.to} to={t.to} end={t.end}
            className={({ isActive }) => `flex min-h-[2.5rem] flex-1 items-center justify-center rounded-full px-4 text-center text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-ember-500 sm:min-w-[8.5rem] sm:flex-none ${isActive ? 'bg-army-800 text-white shadow' : 'text-army-600 hover:text-army-800'}`}>
            {t.label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

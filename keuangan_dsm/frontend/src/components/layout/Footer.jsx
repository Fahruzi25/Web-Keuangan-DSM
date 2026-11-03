import { Link } from 'react-router-dom';
import Logo from '../ui/Logo';
import { resetDemo } from '../../api/mockDb';

const MENU = [
  { to: '/', label: 'Home' },
  { to: '/transaksi', label: 'Transaksi' },
  { to: '/project', label: 'Project' },
  { to: '/operasional', label: 'Operasional' },
];

export default function Footer() {
  return (
    <footer className="mt-16 bg-army-950 text-army-200">
      <div className="mx-auto flex max-w-7xl flex-wrap items-start justify-between gap-10 px-4 py-12 sm:px-6">
        <div className="max-w-sm space-y-3">
          <Logo tinggi={44} />
          <p className="text-sm text-army-300">Sistem informasi keuangan PT Dawuan Slamet Mulyo.</p>
        </div>
        <nav aria-label="Pintasan" className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-widest text-ember-300">Menu</h2>
          <ul className="grid grid-cols-2 gap-x-10 gap-y-2 text-sm">
            {MENU.map((m) => <li key={m.to}><Link className="hover:text-white" to={m.to}>{m.label}</Link></li>)}
          </ul>
        </nav>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 border-t border-white/10 px-4 py-4 text-center text-xs text-army-400">
        <span>© {new Date().getFullYear()} PT Dawuan Slamet Mulyo. Seluruh hak dilindungi.</span>
        <button type="button" className="underline underline-offset-4 hover:text-white"
          onClick={() => { if (window.confirm('Kembalikan seluruh data demo ke kondisi awal? Perubahan yang telah dibuat akan hilang.')) { resetDemo(); window.location.assign('/'); } }}>
          Reset data demo
        </button>
      </div>
    </footer>
  );
}

import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';

/**
 * Tabel `.tbl-stack` menjadi kartu di layar kecil. Label tiap sel diambil dari judul kolom
 * (memperhitungkan colSpan), dan peran tabel dipasang agar pembaca layar tetap mengenalinya.
 */
function siapkanTabel() {
  document.querySelectorAll('table.tbl-stack').forEach((tb) => {
    const heads = [...tb.querySelectorAll('thead th')];
    const labels = heads.map((h) => (h.querySelector('.sr-only') ? '' : h.textContent.trim()));
    const set = (el, k, v) => { if (el.getAttribute(k) !== v) el.setAttribute(k, v); };
    set(tb, 'role', 'table');
    tb.querySelectorAll('thead, tbody, tfoot').forEach((g) => set(g, 'role', 'rowgroup'));
    tb.querySelectorAll('tr').forEach((tr) => {
      set(tr, 'role', 'row');
      const cells = [...tr.children];
      const kosong = cells.length === 1 && cells[0].colSpan >= labels.length;
      let kol = 0;
      cells.forEach((c) => {
        const inHead = c.parentElement.parentElement.tagName === 'THEAD';
        set(c, 'role', inHead ? 'columnheader' : c.tagName === 'TH' ? 'rowheader' : 'cell');
        if (!inHead && !kosong && labels[kol] !== undefined) set(c, 'data-label', labels[kol]);
        if (!inHead) set(c, 'data-kosong', String(c.tagName === 'TD' && c.textContent.trim() === '—'));
        kol += c.colSpan || 1;
      });
    });
  });
}

export default function AppLayout() {
  useEffect(() => {
    let frame = 0;
    const jadwal = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(siapkanTabel); };
    jadwal();
    const pengamat = new MutationObserver(jadwal);
    pengamat.observe(document.body, { childList: true, subtree: true });
    return () => { pengamat.disconnect(); cancelAnimationFrame(frame); };
  }, []);

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-clip">
      {/* pita hijau army di bagian atas, memudar ke latar terang */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[36rem] bg-gradient-to-b from-army-950 via-army-900 via-55% to-army-50 sm:h-[30rem]" />
      <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-24 -z-10 h-96 w-96 rounded-full bg-ember-500/25 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -left-32 top-40 -z-10 h-80 w-80 rounded-full bg-army-500/25 blur-3xl" />
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

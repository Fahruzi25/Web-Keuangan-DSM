/** Komponen kecil yang dipakai di banyak halaman. */
import { formatAngka, formatRupiah, formatTanggal } from '../../utils/format';

export function Stat({ label, value, sub, tone = 'default', children }) {
  const warna = {
    default: 'text-army-950',
    masuk: 'text-army-600',
    keluar: 'text-ember-600',
    neg: 'text-red-700',
  }[tone];
  return (
    <div className="card flex flex-col gap-1 p-5">
      <span className="text-xs font-semibold uppercase tracking-wide text-army-500">{label}</span>
      <span className={`font-num text-2xl font-semibold tabular-nums ${warna}`}>{value}</span>
      {sub && <span className="text-xs text-army-500">{sub}</span>}
      {children}
    </div>
  );
}

export function Notice({ tone = 'ok', children, onClose }) {
  return (
    <p role={tone === 'danger' ? 'alert' : 'status'} className={`notice ${tone === 'danger' ? 'notice-danger' : 'notice-ok'}`}>
      <span>{children}</span>
      {onClose && <button type="button" className="btn btn-sm" onClick={onClose}>Tutup</button>}
    </p>
  );
}

/** Pilihan satu dari beberapa (radio), lebar tiap pilihan sama. */
export function Segmen({ name, value, onChange, options, disabled, label }) {
  return (
    <div role="radiogroup" aria-label={label} className="segmen">
      {options.map((o) => (
        <label key={o.value} data-aktif={value === o.value} data-mati={disabled && value !== o.value}>
          <input type="radio" className="sr-only" name={name} value={o.value} checked={value === o.value} disabled={disabled} onChange={onChange} />
          {o.label}
        </label>
      ))}
    </div>
  );
}

export function Loading({ children = 'Memuat…' }) {
  return <p role="status" className="card p-8 text-center text-sm text-army-500">{children}</p>;
}

export function Kosong({ children }) {
  return <p className="px-4 py-10 text-center text-sm text-army-500">{children}</p>;
}

export function Progress({ persen, label }) {
  const p = Math.max(0, Math.min(100, Math.round(persen)));
  return (
    <div className="mt-2" role="img" aria-label={`${label}: ${p}%`}>
      <div className="h-2 overflow-hidden rounded-full bg-army-100">
        <div className="h-full rounded-full bg-gradient-to-r from-army-500 to-ember-500" style={{ width: `${p}%` }} />
      </div>
    </div>
  );
}

export const Panah = () => (
  <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden="true">
    <path d="M11.3 3.3a1 1 0 0 1 1.4 0l5 5a1 1 0 0 1 0 1.4l-5 5a1 1 0 1 1-1.4-1.4L14.6 10H3a1 1 0 1 1 0-2h11.6l-3.3-3.3a1 1 0 0 1 0-1.4Z" />
  </svg>
);

const NADA_RINCIAN = {
  default: 'text-army-900',
  masuk: 'text-army-600',
  keluar: 'text-ember-600',
  neg: 'text-red-700',
  redup: 'text-army-400 font-medium',
};

/**
 * Panel rincian: satu baris per butir, label di kiri dan nilai rata kanan, dipisah garis tipis.
 * `baris`: [{ label, nilai, nada, tebal, lencana }]. `kolom` 2 menampilkan dua kolom pada layar lebar.
 */
export function Rincian({ judul, baris, kolom = 1, putih = false, className = '' }) {
  return (
    <section aria-label={judul} className={`overflow-hidden ${putih ? 'rounded-3xl border border-army-100 bg-white shadow-card' : 'rounded-2xl border border-army-200 bg-army-50/70'} ${className}`}>
      {judul && <h3 className={`border-b px-4 py-3 text-xs font-bold uppercase tracking-wider text-army-600 ${putih ? 'border-army-100 bg-white' : 'border-army-200 bg-army-100/60'}`}>{judul}</h3>}
      <dl className={kolom === 2 ? 'grid sm:grid-cols-2 sm:gap-x-8 sm:px-4' : ''}>
        {baris.map((b, i) => (
          <div key={b.label} className={`flex items-baseline justify-between gap-4 border-army-100 py-2.5 text-sm ${kolom === 2 ? 'px-4 sm:px-0' : 'px-4'} ${i > 0 ? 'border-t' : ''} ${kolom === 2 && i === 1 ? 'sm:border-t-0' : ''}`}>
            <dt className="text-army-600">{b.label}</dt>
            <dd className={`flex flex-wrap items-center justify-end gap-2 text-right font-num ${b.tebal ? 'font-bold' : 'font-semibold'} ${NADA_RINCIAN[b.nada ?? 'default']}`}>
              {b.nilai}
              {b.lencana}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

/** Pencairan SP2D per tahap (`pekerjaan` = objek yang memuat pencairan, sp2d, cair, belumCair; kini milik project): tahap yang sudah masuk beserta nilainya, lalu total SP2D dan sisanya. */
export function PanelPencairan({ pekerjaan, className = '' }) {
  const baris = pekerjaan.pencairan.map((t) => ({
    label: t.label,
    nada: t.status === 'DONE' ? 'masuk' : 'redup',
    nilai: t.status === 'DONE' ? formatAngka(t.realisasi) : 'Belum cair',
    lencana: t.status === 'DONE' ? <span className="badge badge-ok">{formatTanggal(t.tglPencairan)}</span> : null,
  }));
  baris.push(
    { label: 'SP2D', nilai: formatRupiah(pekerjaan.sp2d), tebal: true },
    { label: 'Sudah cair', nilai: formatRupiah(pekerjaan.cair), nada: 'masuk', tebal: true },
    { label: 'Sisa SP2D', nilai: formatRupiah(pekerjaan.belumCair), nada: pekerjaan.belumCair > 0 ? 'keluar' : 'default', tebal: true },
  );
  return <Rincian judul="Pencairan SP2D" baris={baris} putih className={className} />;
}

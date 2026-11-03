/** Komponen kecil yang dipakai di banyak halaman. */

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

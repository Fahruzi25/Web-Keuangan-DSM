const angka = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 });
const tanggal = new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });

/** 750000000 -> "750.000.000" (untuk sel tabel, tanpa "Rp") */
export const formatAngka = (n) => angka.format(Number(n) || 0);

/** 750000000 -> "Rp 750.000.000" */
export const formatRupiah = (n) => `Rp ${formatAngka(n)}`;

/** "2026-10-12" -> "12 Okt 2026"; kosong -> "—" */
export const formatTanggal = (iso) => (iso ? tanggal.format(new Date(iso)) : '—');

/** 1500000000 -> "1,5 miliar"; 200000000 -> "200 juta" (untuk label grafik) */
export function formatSingkat(n) {
  const v = Number(n) || 0;
  const rapi = (x) => String(Math.round(x * 10) / 10).replace('.', ',');
  if (v >= 1e9) return `${rapi(v / 1e9)} miliar`;
  if (v >= 1e6) return `${rapi(v / 1e6)} juta`;
  return formatAngka(v);
}
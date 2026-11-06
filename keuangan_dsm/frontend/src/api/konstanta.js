/** Konstanta yang dipakai halaman, sama untuk mode server maupun demo. */
export const TAHAP = [
  { key: 'UANG_MUKA', label: 'Uang muka' },
  { key: 'TERMIN_1', label: 'Termin I' },
  { key: 'TERMIN_2', label: 'Termin II' },
  { key: 'TERMIN_3', label: 'Termin III' },
  { key: 'RETENSI', label: 'Retensi' },
];
export const labelTahap = (key) => TAHAP.find((t) => t.key === key)?.label || key;

export const REKENING = [
  { id: 'GIRO', nama: 'Rekening Global (Giro)' },
  { id: 'KAS', nama: 'Kas' },
];
export const namaRekening = (id) => REKENING.find((r) => r.id === id)?.nama || id;

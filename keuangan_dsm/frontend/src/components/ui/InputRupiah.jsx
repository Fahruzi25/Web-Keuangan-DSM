import { useLayoutEffect, useRef } from 'react';

/**
 * Isian nominal rupiah dengan pemisah ribuan otomatis: ketik 4000000 tampil 4.000.000.
 * - Nilai (`value`) dan `onChange` tetap memakai angka polos ("4000000" atau "463851351.35"),
 *   jadi validasi, perhitungan, dan pengiriman ke server tidak berubah.
 * - Titik adalah pemisah ribuan. Koma dipakai untuk desimal (maksimal 2 angka), mis. 1.250,50.
 * - `onChange` dipanggil dengan bentuk { target: { name, value } } agar cocok dengan handler form yang ada.
 */
const MAKS_DIGIT = 15;

/** "463851351.35" menjadi "463.851.351,35" */
export function formatInput(raw) {
  const [bulat = '', desimal] = String(raw ?? '').split('.');
  const ribuan = bulat.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return desimal === undefined ? ribuan : `${ribuan},${desimal}`;
}

/** Teks yang diketik menjadi angka polos: hanya angka, satu koma desimal, tanpa nol di depan. */
function bersihkan(teks) {
  const koma = teks.indexOf(',');
  const bulat = (koma === -1 ? teks : teks.slice(0, koma)).replace(/\D/g, '').slice(0, MAKS_DIGIT).replace(/^0+(?=\d)/, '');
  if (koma === -1) return bulat;
  const desimal = teks.slice(koma + 1).replace(/\D/g, '').slice(0, 2);
  return `${bulat || '0'}.${desimal}`;
}

export default function InputRupiah({ value, onChange, name, ...sisa }) {
  const ref = useRef(null);
  const kursor = useRef(null); // jumlah angka/koma di kiri kursor setelah mengetik

  const tampil = formatInput(value);

  // Kembalikan posisi kursor setelah teks diformat ulang (titik bertambah/berkurang)
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || kursor.current === null || document.activeElement !== el) return;
    let hitung = 0;
    let pos = 0;
    while (pos < tampil.length && hitung < kursor.current) {
      if (tampil[pos] !== '.') hitung += 1;
      pos += 1;
    }
    el.setSelectionRange(pos, pos);
    kursor.current = null;
  });

  function ubah(e) {
    const teks = e.target.value;
    const sebelumKursor = teks.slice(0, e.target.selectionStart ?? teks.length);
    kursor.current = sebelumKursor.replace(/[^\d,]/g, '').length;
    onChange({ target: { name, value: bersihkan(teks) } });
  }

  return (
    <input
      ref={ref}
      type="text"
      inputMode="decimal"
      autoComplete="off"
      name={name}
      value={tampil}
      onChange={ubah}
      {...sisa}
    />
  );
}

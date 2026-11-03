/**
 * Pajak PPh per pekerjaan. Pengguna mengetik sendiri persentasenya (mis. 1,75 atau 1,5)
 * karena tarif bisa berbeda antar pekerjaan. Nilai disimpan sebagai `persenPotongan`,
 * sama dengan kolom persen_potongan di backend.
 * Daftar JENIS_PAJAK di bawah hanya dipakai untuk membaca data lama yang masih menyimpan kode.
 */
export const PERSEN_PPH_AWAL = '1,75';
export const PPN_PERSEN = 11;

const JENIS_PAJAK_LAMA = {
  PPH_FINAL_KONSTRUKSI_KECIL: 1.75,
  PPH22_BARANG: 1.5,
};

/** Ubah isian pengguna ("1,75" atau "1.75") menjadi angka. Isian kosong atau salah menghasilkan NaN. */
export function bacaPersen(teks) {
  const t = String(teks ?? '').trim().replace(',', '.');
  if (t === '' || !/^\d*\.?\d+$|^\d+\.$/.test(t)) return NaN;
  return Number(t);
}

/** Persen PPh pekerjaan, aman untuk data baru maupun data lama. */
export function persenPph(pk) {
  if (pk?.persenPotongan !== undefined && pk?.persenPotongan !== null && pk.persenPotongan !== '') {
    const n = bacaPersen(pk.persenPotongan);
    return Number.isNaN(n) ? 0 : n;
  }
  return JENIS_PAJAK_LAMA[pk?.jenisPajak] ?? 1.75;
}

/** Untuk ditampilkan di input: 1.75 menjadi "1,75". */
export const persenKeTeks = (n) => String(n).replace('.', ',');

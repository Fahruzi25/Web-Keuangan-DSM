/** Hitungan pesanan ke AJK. Total yang diketik sudah termasuk PPN. */
export const PPN_PESANAN = 11;

const bulat = (n) => Math.round(n * 100) / 100;

/** 266168676 -> { dpp: 239791600, ppn: 26377076 } (DPP = total / 1,11) */
export function dppPpn(total) {
  const t = Number(total) || 0;
  const dpp = bulat(t / (1 + PPN_PESANAN / 100));
  return { dpp, ppn: bulat(t - dpp) };
}

/** Label di kartu: "10345 · APILL V5" */
export const labelPesanan = (ps) => [ps.noInvoice, ps.produk || ps.keterangan].filter(Boolean).join(' · ') || `Pesanan #${ps.id}`;

export const urutBayar = (a, b) => (a.tanggal === b.tanggal ? a.id - b.id : a.tanggal < b.tanggal ? -1 : 1);

/**
 * Pembayaran ke berapa transaksi ini nantinya? Nomor mengikuti urutan tanggal (lalu urutan input),
 * jadi tidak dipilih manual. `idSaatIni` diisi saat mengubah transaksi lama.
 */
export function nomorPembayaran(pesanan, { tanggal, idSaatIni = null }) {
  const lain = (pesanan?.pembayaran ?? []).filter((p) => p.id !== idSaatIni);
  const idBaru = idSaatIni ?? Number.MAX_SAFE_INTEGER;
  return lain.filter((p) => urutBayar(p, { tanggal, id: idBaru }) < 0).length + 1;
}

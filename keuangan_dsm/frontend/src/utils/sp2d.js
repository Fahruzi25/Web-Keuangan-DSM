/**
 * Pratinjau SP2D di form. Harus identik dengan backend/src/lib/sp2d.ts
 * dan rumus Excel: =(G/1.11)-(G/1.11)*1.75%
 * Nilai resmi tetap dihitung server saat simpan.
 */
export function hitungSp2d(nilaiKontrak, ppnPersen = 11, pphPersen = 1.75) {
  const nilai = Number(nilaiKontrak) || 0;
  const dpp = nilai / (1 + Number(ppnPersen) / 100);
  return Math.round((dpp - (dpp * Number(pphPersen)) / 100) * 100) / 100;
}
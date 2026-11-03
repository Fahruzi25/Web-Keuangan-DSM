export const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
export const BULAN_SINGKAT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

/** Untuk <select>: value "01".."12" cocok dengan tanggal.slice(5, 7) */
export const OPSI_BULAN = BULAN.map((label, i) => ({ value: String(i + 1).padStart(2, '0'), label }));
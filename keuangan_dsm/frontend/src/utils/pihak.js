/** Nama pihak dibandingkan tanpa memperhatikan huruf besar-kecil, titik, koma, dan spasi ganda ("PT. Grafiti" sama dengan "PT Grafiti"). */
export const normalNama = (nama) => String(nama ?? '').toLowerCase().replace(/[.,]/g, ' ').replace(/\s+/g, ' ').trim();

/** Rapikan tampilan nama: spasi ganda dibuang, tepi dipangkas. */
export const rapikanNama = (nama) => String(nama ?? '').replace(/\s+/g, ' ').trim();

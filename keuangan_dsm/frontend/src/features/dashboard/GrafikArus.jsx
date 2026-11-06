import { useState } from 'react';
import { formatAngka, formatRupiah } from '../../utils/format';
import { BULAN, BULAN_SINGKAT } from '../../utils/bulan';

const W = 760, H = 340, KIRI = 58, KANAN = 14, ATAS = 18, BAWAH = 34;
const TINGGI = H - ATAS - BAWAH;

/** 1500000000 menjadi "1,5 M", 200000000 menjadi "200 jt" (label sumbu) */
function singkat(n) {
  const v = Math.abs(Number(n) || 0);
  const rapi = (x) => String(Math.round(x * 10) / 10).replace('.', ',');
  const teks = v >= 1e9 ? `${rapi(v / 1e9)} M` : v >= 1e6 ? `${rapi(v / 1e6)} jt` : v >= 1e3 ? `${rapi(v / 1e3)} rb` : String(v);
  return n < 0 ? `−${teks}` : teks;
}

/** Skala sumbu dengan angka bulat: langkah 1, 2, 2,5, atau 5 dikali pangkat sepuluh. */
function skalaRapi(rendah, tinggi, n = 5) {
  const mentah = (tinggi - rendah || 1) / n;
  const pangkat = 10 ** Math.floor(Math.log10(mentah));
  const f = mentah / pangkat;
  const langkah = (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * pangkat;
  const awal = Math.floor(rendah / langkah) * langkah;
  const akhir = Math.ceil(tinggi / langkah) * langkah;
  const garis = [];
  for (let v = awal; v <= akhir + langkah / 2; v += langkah) garis.push(Math.round(v));
  return { awal, akhir, garis };
}

/**
 * Grafik kombinasi: batang dana masuk dan dana keluar per bulan, dengan garis selisih (masuk dikurangi keluar).
 * Digambar dengan SVG biasa tanpa pustaka tambahan. Bisa disorot dengan mouse maupun keyboard (Tab).
 */
export default function GrafikArus({ data }) {
  const [aktif, setAktif] = useState(null);
  const bulan = data.map((d, i) => ({ ...d, selisih: d.masuk - d.keluar, nama: BULAN[i], singkat: BULAN_SINGKAT[i] }));
  const { awal, akhir, garis } = skalaRapi(
    Math.min(0, ...bulan.map((b) => b.selisih)),
    Math.max(1, ...bulan.flatMap((b) => [b.masuk, b.keluar, b.selisih])),
  );
  const y = (v) => ATAS + TINGGI * (1 - (v - awal) / (akhir - awal));
  const y0 = y(0);
  const slot = (W - KIRI - KANAN) / 12;
  const lebar = Math.min(18, slot * 0.28);
  const cx = (i) => KIRI + slot * i + slot / 2;
  // garis dan titik berhenti di bulan terakhir yang punya data; bulan sesudahnya belum terjadi
  const terakhir = bulan.reduce((a, b, i) => (b.masuk || b.keluar ? i : a), -1);
  const berdata = bulan.slice(0, terakhir + 1);
  const jalur = berdata.map((b, i) => `${i ? 'L' : 'M'}${cx(i).toFixed(1)} ${y(b.selisih).toFixed(1)}`).join(' ');
  const sorot = aktif === null ? null : bulan[aktif];
  const persenX = aktif === null ? 0 : Math.min(86, Math.max(14, (cx(aktif) / W) * 100));

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img"
        aria-label="Grafik kombinasi: batang dana masuk dan dana keluar per bulan, dengan garis selisih. Angka lengkap ada di tabel tersembunyi di bawahnya.">
        {garis.map((g) => (
          <g key={g}>
            <line x1={KIRI} x2={W - KANAN} y1={y(g)} y2={y(g)} className={g === 0 ? 'stroke-army-300' : 'stroke-army-100'} strokeDasharray={g === 0 ? undefined : '4 4'} />
            <text x={KIRI - 10} y={y(g) + 4} textAnchor="end" className="fill-army-500 text-[11px]">{g === 0 ? '0' : singkat(g)}</text>
          </g>
        ))}

        {sorot && <rect x={KIRI + slot * aktif} y={ATAS} width={slot} height={TINGGI} rx="8" className="fill-army-50" />}

        {bulan.map((b, i) => {
          const redup = aktif !== null && aktif !== i ? 0.45 : 1;
          return (
            <g key={b.singkat} opacity={redup} style={{ transition: 'opacity .15s' }}>
              {b.masuk > 0 && <rect x={cx(i) - lebar - 1.5} y={y(b.masuk)} width={lebar} height={y0 - y(b.masuk)} rx="3" className="grafik-bar fill-army-500" style={{ animationDelay: `${i * 35}ms` }} />}
              {b.keluar > 0 && <rect x={cx(i) + 1.5} y={y(b.keluar)} width={lebar} height={y0 - y(b.keluar)} rx="3" className="grafik-bar fill-ember-500" style={{ animationDelay: `${i * 35}ms` }} />}
              <text x={cx(i)} y={H - 12} textAnchor="middle" className={`text-[11px] ${aktif === i ? 'fill-army-900 font-bold' : 'fill-army-600'}`}>{b.singkat}</text>
            </g>
          );
        })}

        <path d={jalur} pathLength="1" fill="none" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" className="grafik-garis stroke-army-900" />
        {berdata.map((b, i) => (
          <circle key={b.singkat} cx={cx(i)} cy={y(b.selisih)} r={aktif === i ? 5.5 : 4} strokeWidth="2.25" className="grafik-titik fill-white stroke-army-900" />
        ))}

        {bulan.map((b, i) => (
          <rect key={b.singkat} x={KIRI + slot * i} y={ATAS} width={slot} height={TINGGI + BAWAH} fill="transparent" tabIndex={0}
            aria-label={`${b.nama}: dana masuk ${formatRupiah(b.masuk)}, dana keluar ${formatRupiah(b.keluar)}, selisih ${formatRupiah(b.selisih)}`}
            className="cursor-pointer outline-none focus-visible:stroke-ember-500 focus-visible:stroke-2"
            onMouseEnter={() => setAktif(i)} onMouseLeave={() => setAktif(null)} onFocus={() => setAktif(i)} onBlur={() => setAktif(null)} />
        ))}
      </svg>

      {sorot && (
        <div role="status" className="pointer-events-none absolute top-1 z-10 w-56 -translate-x-1/2 rounded-2xl border border-army-200 bg-white p-3 text-xs shadow-card" style={{ left: `${persenX}%` }}>
          <p className="mb-2 text-sm font-bold text-army-900">{sorot.nama}</p>
          <dl className="space-y-1.5">
            <div className="flex items-center justify-between gap-3"><dt className="inline-flex items-center gap-1.5 text-army-600"><i className="h-2.5 w-2.5 rounded-sm bg-army-500" />Dana masuk</dt><dd className="font-num font-semibold text-army-800">{formatAngka(sorot.masuk)}</dd></div>
            <div className="flex items-center justify-between gap-3"><dt className="inline-flex items-center gap-1.5 text-army-600"><i className="h-2.5 w-2.5 rounded-sm bg-ember-500" />Dana keluar</dt><dd className="font-num font-semibold text-ember-600">{formatAngka(sorot.keluar)}</dd></div>
            <div className="flex items-center justify-between gap-3 border-t border-army-100 pt-1.5"><dt className="inline-flex items-center gap-1.5 text-army-600"><i className="h-0.5 w-3 rounded bg-army-900" />Selisih</dt><dd className={`font-num font-bold ${sorot.selisih < 0 ? 'text-red-700' : 'text-army-900'}`}>{sorot.selisih < 0 ? '−' : ''}{formatAngka(Math.abs(sorot.selisih))}</dd></div>
          </dl>
        </div>
      )}
    </div>
  );
}

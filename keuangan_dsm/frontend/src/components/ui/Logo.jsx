import { useState } from 'react';

const LOGO_SRC = '/logo.png';
const NAMA_PERUSAHAAN = 'PT Dawuan Slamet Mulyo';

/** Logo perusahaan. `terang` = teks putih untuk latar gelap. */
export default function Logo({ tinggi = 36, terang = true, sembunyikanNama = false }) {
  const [gagal, setGagal] = useState(false);
  return (
    <span className="inline-flex items-center gap-3">
      {gagal ? (
        <span className="rounded-lg bg-ember-500" style={{ height: tinggi, width: tinggi }} aria-hidden="true" />
      ) : (
        <img src={LOGO_SRC} alt="" style={{ height: tinggi }} className="w-auto" onError={() => setGagal(true)} />
      )}
      {!sembunyikanNama && (
        <span className={`text-sm font-extrabold leading-tight tracking-tight ${terang ? 'text-white' : 'text-army-900'}`}>
          {NAMA_PERUSAHAAN}
        </span>
      )}
    </span>
  );
}

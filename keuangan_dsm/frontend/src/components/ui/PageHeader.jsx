import { Link } from 'react-router-dom';
import IconKembali from './IconKembali';
import IconKosongkan from './IconKosongkan';

/**
 * Kepala halaman di atas pita hijau gelap: judul dan deskripsi di tengah.
 * `back`: tombol Kembali di kiri. `onKosongkan`: tombol Kosongkan di kanan (form).
 * `actions`: tombol utama halaman, di tengah di bawah deskripsi.
 *
 * Pada halaman form (`onKosongkan` ada), lebar header disamakan dengan kartu putih (max-w-3xl).
 * Di layar sm ke atas, Kembali, judul, dan Kosongkan berada satu baris: tombol rata dengan
 * tepi kiri dan kanan kartu, sejajar vertikal dengan judul, dan deskripsi tepat di bawah judul.
 * Di layar kecil, tombol tetap di baris sendiri di atas judul supaya judul tidak terhimpit.
 */
export default function PageHeader({ title, hint, back, actions, onKosongkan }) {
  const btnKembali = back && (
    <Link to={back.to} aria-label={back.label} title={back.label} className="btn btn-glass">
      <span className="btn-icon"><IconKembali /></span>
      Kembali
    </Link>
  );

  if (onKosongkan) {
    return (
      <header className="mx-auto w-full max-w-3xl px-4 pb-8 pt-8 sm:px-6 sm:pt-10">
        <div className="grid grid-cols-2 items-center gap-x-3 sm:grid-cols-[1fr_auto_1fr]">
          <div className="col-start-1 row-start-1 justify-self-start">{btnKembali}</div>
          <button
            type="button"
            onClick={onKosongkan}
            className="btn btn-glass col-start-2 row-start-1 justify-self-end sm:col-start-3"
            title="Kosongkan seluruh isian formulir"
          >
            <span className="btn-icon"><IconKosongkan /></span>
            Kosongkan
          </button>
          <h1 className="col-span-2 row-start-2 mt-6 text-center text-3xl font-extrabold text-white sm:col-span-1 sm:col-start-2 sm:row-start-1 sm:mt-0 sm:text-4xl">
            {title}
          </h1>
          {hint && (
            <p className="col-span-2 row-start-3 mx-auto mt-3 max-w-2xl text-center text-sm text-army-200 sm:col-span-3 sm:col-start-1 sm:row-start-2">
              {hint}
            </p>
          )}
        </div>
      </header>
    );
  }

  return (
    <header className="mx-auto w-full max-w-7xl px-4 pb-8 pt-8 sm:px-6 sm:pt-10">
      {back && (
        <div className="mb-6 flex items-center justify-between gap-3">
          {btnKembali}
          <span />
        </div>
      )}
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-3xl font-extrabold text-white sm:text-4xl">{title}</h1>
        {hint && <p className="mx-auto mt-3 max-w-2xl text-sm text-army-200">{hint}</p>}
        {actions && <div className="mt-6 flex flex-wrap items-center justify-center gap-3">{actions}</div>}
      </div>
    </header>
  );
}

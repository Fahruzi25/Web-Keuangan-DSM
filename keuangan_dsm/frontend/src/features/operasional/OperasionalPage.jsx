import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import PageHeader from '../../components/ui/PageHeader';
import { Kosong, Loading, Notice, Stat } from '../../components/ui/kit';
import { listOperasional } from '../../api/operasional.api';
import { formatAngka, formatRupiah, formatTanggal } from '../../utils/format';
import { OPSI_BULAN } from '../../utils/bulan';

const REKENING = { GIRO: 'Global', KAS: 'Kas' };

export default function OperasionalPage() {
  const [params, setParams] = useSearchParams();
  const bulan = params.get('bulan') || '';
  const [rows, setRows] = useState(null);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState({ subkategori: '', rekening: '', q: '' });

  const muat = () => {
    setError('');
    setRows(null);
    listOperasional({ bulan }).then(setRows).catch(() => setError('Data operasional belum dapat dimuat. Periksa koneksi, lalu coba kembali.'));
  };
  useEffect(muat, [bulan]); // eslint-disable-line react-hooks/exhaustive-deps

  const ubahBulan = (v) => setParams(v ? { bulan: v } : {});
  const ubah = (e) => setFilter((f) => ({ ...f, [e.target.name]: e.target.value }));

  // satu daftar transaksi operasional (giro dan kas), terbaru di atas
  const semua = useMemo(() => rows || [], [rows]);

  const tersaring = useMemo(() => {
    const q = filter.q.trim().toLowerCase();
    return semua.filter((t) =>
      (!filter.subkategori || t.subkategori === filter.subkategori) &&
      (!filter.rekening || t.rekening === filter.rekening) &&
      (!q || [t.keterangan, t.subkategori, t.kategori].some((v) => (v || '').toLowerCase().includes(q))));
  }, [semua, filter]);

  const total = useMemo(() => tersaring.reduce((s, t) => s + t.nominal, 0), [tersaring]);
  const perSub = useMemo(() => {
    const m = new Map();
    tersaring.forEach((t) => m.set(t.subkategori, (m.get(t.subkategori) || 0) + t.nominal));
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [tersaring]);
  const terbesar = perSub[0];

  return (
    <>
      <PageHeader
        title="Operasional"
        hint="Rekap pengeluaran operasional perusahaan berdasarkan jenis."
        actions={<Link className="btn btn-primary" to="/transaksi/tambah?klasifikasi=OPERASIONAL">Tambah transaksi</Link>}
      />

      <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6">
        {error && <Notice tone="danger">{error} <button type="button" className="btn btn-sm ml-2" onClick={muat}>Muat ulang</button></Notice>}

        <section aria-label="Filter dan pencarian" className="card grid grid-cols-2 gap-4 p-5 lg:grid-cols-4">
          <div className="field">
            <label className="label" htmlFor="bulan">Bulan</label>
            <select id="bulan" className="input" value={bulan} onChange={(e) => ubahBulan(e.target.value)}>
              <option value="">Seluruh tahun</option>
              {OPSI_BULAN.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
            </select>
          </div>
          <div className="field">
            <label className="label" htmlFor="sub">Jenis operasional</label>
            <select id="sub" name="subkategori" className="input" value={filter.subkategori} onChange={ubah}>
              <option value="">Semua jenis</option>
              {[...new Set(semua.map((t) => t.subkategori))].sort().map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="field">
            <label className="label" htmlFor="rek">Rekening</label>
            <select id="rek" name="rekening" className="input" value={filter.rekening} onChange={ubah}>
              <option value="">Semua rekening</option>
              <option value="GIRO">Rekening global</option>
              <option value="KAS">Kas</option>
            </select>
          </div>
          <div className="field col-span-2 lg:col-span-1">
            <label className="label" htmlFor="q">Cari</label>
            <input id="q" name="q" type="search" className="input" value={filter.q} onChange={ubah} placeholder="Deskripsi atau jenis operasional" />
          </div>
        </section>

        {!rows && !error && <Loading>Memuat transaksi operasional…</Loading>}

        {rows && (
          <>
            <section aria-label="Ringkasan operasional" className="grid gap-4 sm:grid-cols-3">
              <Stat label="Total pengeluaran" value={formatRupiah(total)} tone="keluar" sub="Sesuai filter yang dipilih" />
              <Stat label="Jumlah transaksi" value={tersaring.length} />
              <Stat label="Jenis terbesar" value={terbesar ? terbesar[0] : '—'} sub={terbesar ? formatRupiah(terbesar[1]) : undefined} />
            </section>

            {perSub.length > 0 && (
              <section aria-label="Total per jenis operasional" className="flex flex-wrap gap-2">
                {perSub.map(([nama, jumlah]) => (
                  <button key={nama} type="button" aria-pressed={filter.subkategori === nama}
                    onClick={() => setFilter((f) => ({ ...f, subkategori: f.subkategori === nama ? '' : nama }))}
                    className={`inline-flex min-h-[2.5rem] items-center rounded-full border px-5 text-sm transition ${filter.subkategori === nama ? 'border-ember-500 bg-ember-500 text-white' : 'border-army-200 bg-white text-army-700 hover:border-army-400'}`}>
                    <span className="font-semibold">{nama}</span> <span className="font-num opacity-80">{formatAngka(jumlah)}</span>
                  </button>
                ))}
              </section>
            )}

            <section className="card overflow-hidden" aria-label="Daftar transaksi operasional">
              <div className="overflow-x-auto">
                <table className="tbl tbl-stack md:min-w-[760px]">
                  <thead>
                    <tr>
                      <th scope="col">Tanggal</th>
                      <th scope="col">Jenis operasional</th>
                      <th scope="col">Deskripsi transaksi</th>
                      <th scope="col">Rekening</th>
                      <th scope="col" className="num">Dana keluar</th>
                      <th scope="col"><span className="sr-only">Aksi</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {tersaring.length === 0 && <tr><td colSpan={6}><Kosong>{semua.length ? 'Tidak ada transaksi yang sesuai dengan filter.' : 'Belum ada transaksi operasional pada periode ini.'}</Kosong></td></tr>}
                    {tersaring.map((t) => (
                      <tr key={t.id}>
                        <td className="whitespace-nowrap text-army-600">{formatTanggal(t.tanggal)}</td>
                        <td><span className="font-semibold">{t.subkategori}</span>{t.kategori && <small className="block text-xs text-army-500">{t.kategori}</small>}</td>
                        <td>{t.keterangan}</td>
                        <td><span className={`badge ${t.rekening === 'GIRO' ? 'badge-ok' : 'badge-warn'}`}>{REKENING[t.rekening] || t.rekening}</span></td>
                        <td className="num text-ember-600">{formatAngka(t.nominal)}</td>
                        <td className="aksi text-right">
                          <Link className="btn btn-sm btn-act" to={`/transaksi/${t.id}/ubah`} aria-label={`Ubah transaksi ${t.keterangan}`}>Ubah</Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  {tersaring.length > 0 && (
                    <tfoot>
                      <tr><th scope="row" colSpan={4}>Total</th><td className="num">{formatAngka(total)}</td><td /></tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </section>
          </>
        )}
      </div>
    </>
  );
}

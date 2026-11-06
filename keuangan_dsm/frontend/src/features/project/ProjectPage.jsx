import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import PageHeader from '../../components/ui/PageHeader';
import { Kosong, Loading, Notice, Progress, Segmen, Stat } from '../../components/ui/kit';
import { listProject } from '../../api/project.api';
import { formatAngka, formatRupiah } from '../../utils/format';
import { labelPesanan } from '../../utils/pesanan';

const jumlah = (rows, key) => rows.reduce((s, r) => s + r[key], 0);

const GRUP_REKAP = [
  { judul: 'Proyeksi', kolom: ['proyeksiMasuk', 'proyeksiKeluar'] },
  { judul: 'Realisasi', kolom: ['realisasiMasuk', 'realisasiKeluar'] },
  { judul: 'On proses', kolom: ['onProsesMasuk', 'onProsesKeluar'] },
];
const KOLOM_REKAP = GRUP_REKAP.flatMap((g) => g.kolom);
const awalGrup = (kunci) => GRUP_REKAP.some((g) => g.kolom[0] === kunci);

function SelAngka({ kunci, nilai }) {
  const nada = kunci.endsWith('Keluar') ? 'rekap-keluar' : 'rekap-masuk';
  return <td className={`rekap-angka ${nada}${awalGrup(kunci) ? ' rekap-sekat' : ''}`}>{formatAngka(nilai)}</td>;
}

/** Rekapitulasi: satu baris per project (kontrak, SP2D, dan pesanan dihitung per project). */
function TabelRekap({ projects }) {
  return (
    <section className="card overflow-hidden" aria-labelledby="judul-rekap">
      <div className="border-b border-army-100 px-6 py-5">
        <h2 id="judul-rekap" className="text-lg font-bold">Rekapitulasi project</h2>
        <p className="hint mt-1">
          Proyeksi dana keluar mencakup biaya langsung dan total pesanan. On proses adalah proyeksi dikurangi realisasi.
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="tbl-rekap">
          <colgroup>
            <col className="w-[19rem]" />
            {KOLOM_REKAP.map((k) => <col key={k} className="w-[8.5rem]" />)}
          </colgroup>
          <thead>
            <tr>
              <th scope="col" rowSpan={2} className="rekap-nama">Project</th>
              {GRUP_REKAP.map((g) => <th key={g.judul} scope="colgroup" colSpan={2} className="rekap-grup rekap-sekat">{g.judul}</th>)}
            </tr>
            <tr>
              {KOLOM_REKAP.map((k) => (
                <th key={k} scope="col" className={`rekap-sub${awalGrup(k) ? ' rekap-sekat' : ''}`}>{k.endsWith('Masuk') ? 'Dana masuk' : 'Dana keluar'}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {projects.map((p) => (
              <tr key={p.id} className="rekap-baris">
                <th scope="row">
                  <Link className="underline-offset-4 hover:text-ember-600 hover:underline" to={`/project/${p.id}`}>{p.nama}</Link>
                  <span className="mt-0.5 block text-xs font-normal text-army-500">{p.kodeProject} · {p.pekerjaan.length} pekerjaan</span>
                </th>
                {KOLOM_REKAP.map((key) => <SelAngka key={key} kunci={key} nilai={p[key]} />)}
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <th scope="row">Total seluruh project</th>
              {KOLOM_REKAP.map((key) => <SelAngka key={key} kunci={key} nilai={jumlah(projects, key)} />)}
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  );
}

export default function ProjectPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [query, setQuery] = useState('');
  const [tutup, setTutup] = useState({});
  const [tampilan, setTampilan] = useState('daftar');
  const [pesan, setPesan] = useState(location.state?.pesan || '');

  useEffect(() => {
    if (location.state?.pesan) navigate(location.pathname, { replace: true, state: null });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const muat = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      setProjects(await listProject());
    } catch {
      setLoadError('Data project belum dapat dimuat. Periksa koneksi, lalu coba kembali.');
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { muat(); }, [muat]);

  // saring per pekerjaan; project tampil bila namanya cocok atau ada pekerjaan yang cocok
  const tersaring = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return projects;
    return projects
      .map((p) => ([p.nama, p.kodeProject, p.kontrakInaproc, p.nomorKontrak].some((v) => (v || '').toLowerCase().includes(q))
        ? p
        : { ...p, pekerjaan: p.pekerjaan.filter((k) => (k.nama || '').toLowerCase().includes(q)) }))
      .filter((p) => p.pekerjaan.length > 0);
  }, [projects, query]);

  const total = { kontrak: jumlah(projects, 'nilaiKontrak'), sp2d: jumlah(projects, 'sp2d'), cair: jumlah(projects, 'cair'), belum: jumlah(projects, 'belumCair') };

  return (
    <>
      <PageHeader
        title="Project"
        hint="Daftar project beserta pekerjaan, nilai kontrak, dan progres pencairan SP2D."
        actions={<Link className="btn btn-primary" to="/project/tambah">Tambah project</Link>}
      />

      <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6">
        {pesan && <Notice onClose={() => setPesan('')}>{pesan}</Notice>}
        {loadError && <Notice tone="danger">{loadError} <button type="button" className="btn btn-sm ml-2" onClick={muat}>Muat ulang</button></Notice>}

        <section aria-label="Total seluruh project" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Nilai kontrak" value={formatRupiah(total.kontrak)} sub={`${projects.reduce((n, p) => n + p.pekerjaan.length, 0)} pekerjaan di ${projects.length} project`} />
          <Stat label="SP2D" value={formatRupiah(total.sp2d)} />
          <Stat label="Sudah cair" value={formatRupiah(total.cair)} tone="masuk">
            <Progress persen={total.sp2d ? (total.cair / total.sp2d) * 100 : 0} label="Sudah cair" />
          </Stat>
          <Stat label="Belum cair" value={formatRupiah(total.belum)} tone="keluar" />
        </section>

        <div className="card flex-row flex-wrap items-end gap-4 p-5">
          <div className="field min-w-[16rem] flex-1 basis-80">
            <label className="label" htmlFor="cari">Cari project atau pekerjaan</label>
            <input id="cari" type="search" className="input" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Nama project, kode project, pekerjaan, atau nomor EP" />
          </div>
          <div className="field">
            <span className="label">Tampilan</span>
            <Segmen label="Tampilan" name="tampilan" value={tampilan} onChange={(e) => setTampilan(e.target.value)} options={[{ value: 'daftar', label: 'Daftar' }, { value: 'rekap', label: 'Rekapitulasi' }]} />
          </div>
        </div>

        {loading && <Loading>Memuat project…</Loading>}
        {!loading && tersaring.length === 0 && (
          <section className="card" aria-label="Daftar project">
            <Kosong>{query ? 'Tidak ada project atau pekerjaan yang sesuai dengan pencarian.' : 'Belum ada project terdaftar.'}</Kosong>
          </section>
        )}

        {!loading && tampilan === 'rekap' && tersaring.length > 0 && <TabelRekap projects={tersaring} />}

        {!loading && tampilan === 'daftar' && tersaring.map((p) => {
          const lipat = !!tutup[p.id];
          const isi = p.pekerjaan;
          return (
            <section key={p.id} className="card overflow-hidden" aria-labelledby={`p${p.id}`}>
              <button type="button" aria-expanded={!lipat} aria-controls={`isi-p${p.id}`}
                onClick={() => setTutup((t) => ({ ...t, [p.id]: !t[p.id] }))}
                className="flex w-full flex-wrap items-center justify-between gap-4 bg-gradient-to-r from-army-900 to-army-800 px-6 py-5 text-left text-white">
                <span>
                  <span id={`p${p.id}`} className="block text-lg font-extrabold">{p.nama}</span>
                  <span className="text-xs text-army-200">{p.kodeProject} · {isi.length} pekerjaan</span>
                </span>
                <span className="flex flex-wrap items-center gap-6">
                  <span className="text-right"><span className="block text-[11px] uppercase tracking-wider text-army-300">Total kontrak</span><span className="font-num font-semibold">{formatRupiah(p.nilaiKontrak)}</span></span>
                  <span className="text-right"><span className="block text-[11px] uppercase tracking-wider text-army-300">Cair</span><span className="font-num font-semibold text-ember-300">{Math.round(p.sp2d ? (p.cair / p.sp2d) * 100 : 0)}%</span></span>
                  <svg viewBox="0 0 20 20" fill="currentColor" className={`h-5 w-5 transition ${lipat ? '' : 'rotate-180'}`} aria-hidden="true"><path d="M5.2 7.5a1 1 0 0 1 1.4 0L10 10.9l3.4-3.4a1 1 0 1 1 1.4 1.4l-4.1 4.1a1 1 0 0 1-1.4 0L5.2 8.9a1 1 0 0 1 0-1.4Z" /></svg>
                </span>
              </button>

              {!lipat && (
                <div id={`isi-p${p.id}`}>
                  <dl className="grid gap-x-8 gap-y-3 border-b border-army-100 px-6 py-5 sm:grid-cols-2 lg:grid-cols-4">
                    {[
                      ['Kontrak INAPROC', p.kontrakInaproc || '—'],
                      ['SP2D', formatRupiah(p.sp2d)],
                      ['Sudah cair', formatRupiah(p.cair)],
                      ['Belum cair', formatRupiah(p.belumCair)],
                    ].map(([label, v]) => (
                      <div key={label}><dt className="label">{label}</dt><dd className="mt-1 break-all font-num text-sm font-semibold">{v}</dd></div>
                    ))}
                  </dl>
                  <div className="overflow-x-auto">
                    <table className="tbl tbl-stack md:min-w-[760px]">
                      <thead>
                        <tr>
                          <th scope="col">Pekerjaan</th>
                          <th scope="col">Pesanan ke AJK</th>
                          <th scope="col" className="num">Total pesanan</th>
                          <th scope="col" className="num">Dibayar</th>
                          <th scope="col" className="num">Sisa</th>
                          <th scope="col" className="num">Transaksi</th>
                          <th scope="col"><span className="sr-only">Buka</span></th>
                        </tr>
                      </thead>
                      <tbody>
                        {isi.map((k) => (
                          <tr key={k.id}>
                            <th scope="row">
                              <Link className="font-bold text-army-800 underline-offset-4 hover:text-ember-600 hover:underline" to={`/project/${p.id}?pekerjaan=${k.id}`}>{k.nama}</Link>
                            </th>
                            <td className="text-sm text-army-600">{k.pesanan[0] ? labelPesanan(k.pesanan[0]) : '—'}</td>
                            <td className="num">{formatAngka(k.totalPesanan)}</td>
                            <td className="num text-army-600">{formatAngka(k.dibayarPesanan)}</td>
                            <td className="num text-ember-600">{formatAngka(k.sisaPesanan)}</td>
                            <td className="num">{k.jumlahTransaksi}</td>
                            <td className="aksi text-right"><Link className="btn btn-sm" to={`/project/${p.id}?pekerjaan=${k.id}`} aria-label={`Detail pekerjaan ${k.nama}`}>Detail</Link></td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr>
                          <th scope="row" colSpan={2}>Jumlah seluruh pekerjaan</th>
                          <td className="num">{formatAngka(p.totalPesanan)}</td>
                          <td className="num">{formatAngka(p.dibayarPesanan)}</td>
                          <td className="num">{formatAngka(p.sisaPesanan)}</td>
                          <td className="num">{p.jumlahTransaksi}</td>
                          <td />
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                  <div className="flex justify-end gap-2 border-t border-army-100 p-4">
                    <Link className="btn btn-sm" to={`/project/${p.id}/ubah`}>Ubah project</Link>
                    <Link className="btn btn-sm btn-dark" to={`/project/${p.id}`}>Detail project</Link>
                  </div>
                </div>
              )}
            </section>
          );
        })}
      </div>
    </>
  );
}

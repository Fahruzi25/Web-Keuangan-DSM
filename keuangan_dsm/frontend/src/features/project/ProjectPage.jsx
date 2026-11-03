import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import PageHeader from '../../components/ui/PageHeader';
import { Kosong, Loading, Notice, Progress, Segmen, Stat } from '../../components/ui/kit';
import { listProject } from '../../api/project.api';
import { formatAngka, formatRupiah } from '../../utils/format';

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

/** Rekapitulasi seluruh pekerjaan: satu baris per pekerjaan, dikelompokkan per project. */
function TabelRekap({ projects }) {
  const semua = projects.flatMap((p) => p.pekerjaan);
  return (
    <section className="card overflow-hidden" aria-labelledby="judul-rekap">
      <div className="border-b border-army-100 px-6 py-5">
        <h2 id="judul-rekap" className="text-lg font-bold">Rekapitulasi project</h2>
        <p className="hint mt-1">
          Proyeksi dana keluar adalah biaya langsung project ditambah total pesanan. On proses adalah selisih antara proyeksi dan realisasi.
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
              <th scope="col" rowSpan={2} className="rekap-nama">Project / pekerjaan</th>
              {GRUP_REKAP.map((g) => <th key={g.judul} scope="colgroup" colSpan={2} className="rekap-grup rekap-sekat">{g.judul}</th>)}
            </tr>
            <tr>
              {KOLOM_REKAP.map((k) => (
                <th key={k} scope="col" className={`rekap-sub${awalGrup(k) ? ' rekap-sekat' : ''}`}>{k.endsWith('Masuk') ? 'Dana masuk' : 'Dana keluar'}</th>
              ))}
            </tr>
          </thead>
          {projects.map((p) => (
            <tbody key={p.id}>
              <tr className="rekap-proyek">
                <th scope="rowgroup" colSpan={7}>
                  <Link className="underline-offset-4 hover:underline" to={`/project/${p.id}`}>{p.nama}</Link>
                  <span className="ml-3 text-xs font-medium text-army-600">{p.pekerjaan.length} pekerjaan</span>
                </th>
              </tr>
              {p.pekerjaan.map((k) => (
                <tr key={k.id} className="rekap-baris">
                  <th scope="row">
                    <Link className="underline-offset-4 hover:text-ember-600 hover:underline" to={`/project/${p.id}?pekerjaan=${k.id}`}>{k.nama}</Link>
                    <span className="mt-0.5 block text-xs font-normal text-army-500">{k.kontrakInaproc}</span>
                  </th>
                  {KOLOM_REKAP.map((key) => <SelAngka key={key} kunci={key} nilai={k[key]} />)}
                </tr>
              ))}
              {p.pekerjaan.length > 1 && (
                <tr className="rekap-baris rekap-total-proyek">
                  <th scope="row">Subtotal</th>
                  {KOLOM_REKAP.map((key) => <SelAngka key={key} kunci={key} nilai={jumlah(p.pekerjaan, key)} />)}
                </tr>
              )}
            </tbody>
          ))}
          <tfoot>
            <tr>
              <th scope="row">Total seluruh pekerjaan</th>
              {KOLOM_REKAP.map((key) => <SelAngka key={key} kunci={key} nilai={jumlah(semua, key)} />)}
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
      .map((p) => (p.nama.toLowerCase().includes(q)
        ? p
        : { ...p, pekerjaan: p.pekerjaan.filter((k) => [k.nama, k.kontrakInaproc, k.nomorKontrak].some((v) => (v || '').toLowerCase().includes(q))) }))
      .filter((p) => p.pekerjaan.length > 0);
  }, [projects, query]);

  const semua = useMemo(() => projects.flatMap((p) => p.pekerjaan), [projects]);
  const total = { kontrak: jumlah(semua, 'nilaiKontrak'), sp2d: jumlah(semua, 'sp2d'), cair: jumlah(semua, 'cair'), belum: jumlah(semua, 'belumCair') };

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
          <Stat label="Nilai kontrak" value={formatRupiah(total.kontrak)} sub={`${semua.length} pekerjaan di ${projects.length} project`} />
          <Stat label="SP2D" value={formatRupiah(total.sp2d)} />
          <Stat label="Sudah cair" value={formatRupiah(total.cair)} tone="masuk">
            <Progress persen={total.sp2d ? (total.cair / total.sp2d) * 100 : 0} label="Sudah cair" />
          </Stat>
          <Stat label="Belum cair" value={formatRupiah(total.belum)} tone="keluar" />
        </section>

        <div className="card flex-row flex-wrap items-end gap-4 p-5">
          <div className="field min-w-[16rem] flex-1 basis-80">
            <label className="label" htmlFor="cari">Cari project atau pekerjaan</label>
            <input id="cari" type="search" className="input" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Nama project, pekerjaan, atau nomor EP" />
          </div>
          <div className="field">
            <span className="label">Tampilan</span>
            <Segmen label="Tampilan" name="tampilan" value={tampilan} onChange={(e) => setTampilan(e.target.value)} options={[{ value: 'daftar', label: 'Daftar' }, { value: 'rekap', label: 'Rekapitulasi' }]} />
          </div>
        </div>

        {loading && <Loading>Memuat project…</Loading>}
        {!loading && tersaring.length === 0 && (
          <section className="card" aria-label="Daftar project">
            <Kosong>{query ? 'Tidak ada project atau pekerjaan yang sesuai dengan pencarian.' : 'Belum ada project terdaftar. Gunakan tombol Tambah project untuk menambahkan data.'}</Kosong>
          </section>
        )}

        {!loading && tampilan === 'rekap' && tersaring.length > 0 && <TabelRekap projects={tersaring} />}

        {!loading && tampilan === 'daftar' && tersaring.map((p) => {
          const lipat = !!tutup[p.id];
          const isi = p.pekerjaan;
          const sp2d = jumlah(isi, 'sp2d');
          const cair = jumlah(isi, 'cair');
          return (
            <section key={p.id} className="card overflow-hidden" aria-labelledby={`p${p.id}`}>
              <button type="button" aria-expanded={!lipat} aria-controls={`isi-p${p.id}`}
                onClick={() => setTutup((t) => ({ ...t, [p.id]: !t[p.id] }))}
                className="flex w-full flex-wrap items-center justify-between gap-4 bg-gradient-to-r from-army-900 to-army-800 px-6 py-5 text-left text-white">
                <span>
                  <span id={`p${p.id}`} className="block text-lg font-extrabold">{p.nama}</span>
                  <span className="text-xs text-army-200">{isi.length} pekerjaan</span>
                </span>
                <span className="flex flex-wrap items-center gap-6">
                  <span className="text-right"><span className="block text-[11px] uppercase tracking-wider text-army-300">Total kontrak</span><span className="font-num font-semibold">{formatRupiah(jumlah(isi, 'nilaiKontrak'))}</span></span>
                  <span className="text-right"><span className="block text-[11px] uppercase tracking-wider text-army-300">Cair</span><span className="font-num font-semibold text-ember-300">{Math.round(sp2d ? (cair / sp2d) * 100 : 0)}%</span></span>
                  <svg viewBox="0 0 20 20" fill="currentColor" className={`h-5 w-5 transition ${lipat ? '' : 'rotate-180'}`} aria-hidden="true"><path d="M5.2 7.5a1 1 0 0 1 1.4 0L10 10.9l3.4-3.4a1 1 0 1 1 1.4 1.4l-4.1 4.1a1 1 0 0 1-1.4 0L5.2 8.9a1 1 0 0 1 0-1.4Z" /></svg>
                </span>
              </button>

              {!lipat && (
                <div id={`isi-p${p.id}`}>
                  <div className="overflow-x-auto">
                    <table className="tbl tbl-stack md:min-w-[860px]">
                      <thead>
                        <tr>
                          <th scope="col">Pekerjaan</th>
                          <th scope="col">Kontrak INAPROC</th>
                          <th scope="col" className="num">Nilai kontrak</th>
                          <th scope="col" className="num">SP2D</th>
                          <th scope="col" className="num">Cair</th>
                          <th scope="col" className="num">Belum cair</th>
                          <th scope="col" className="num">Transaksi</th>
                          <th scope="col"><span className="sr-only">Buka</span></th>
                        </tr>
                      </thead>
                      <tbody>
                        {isi.map((k) => (
                          <tr key={k.id}>
                            <th scope="row">
                              <Link className="font-bold text-army-800 underline-offset-4 hover:text-ember-600 hover:underline" to={`/project/${p.id}?pekerjaan=${k.id}`}>{k.nama}</Link>
                              {k.selesai && <span className="badge badge-ok ml-2">Selesai</span>}
                            </th>
                            <td className="whitespace-nowrap font-num text-xs text-army-600">{k.kontrakInaproc || '—'}</td>
                            <td className="num">{formatAngka(k.nilaiKontrak)}</td>
                            <td className="num">{formatAngka(k.sp2d)}</td>
                            <td className="num text-army-600">{formatAngka(k.cair)}</td>
                            <td className="num text-ember-600">{formatAngka(k.belumCair)}</td>
                            <td className="num">{k.jumlahTransaksi}</td>
                            <td className="aksi text-right"><Link className="btn btn-sm" to={`/project/${p.id}?pekerjaan=${k.id}`} aria-label={`Detail pekerjaan ${k.nama}`}>Detail</Link></td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr>
                          <th scope="row" colSpan={2}>Jumlah seluruh pekerjaan</th>
                          <td className="num">{formatAngka(jumlah(isi, 'nilaiKontrak'))}</td>
                          <td className="num">{formatAngka(sp2d)}</td>
                          <td className="num">{formatAngka(cair)}</td>
                          <td className="num">{formatAngka(jumlah(isi, 'belumCair'))}</td>
                          <td className="num">{jumlah(isi, 'jumlahTransaksi')}</td>
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

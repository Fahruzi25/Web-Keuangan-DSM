import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import PageHeader from '../../components/ui/PageHeader';
import TabTransaksi from '../../components/ui/TabTransaksi';
import { deletePiutang } from '../../api/piutang.api';
import { Kosong, Notice, Segmen, Stat } from '../../components/ui/kit';
import RekapTransaksi from './RekapTransaksi';
import * as api from '../../api/transaksi.api';
import { listProject, labelTahap } from '../../api/project.api';
import { formatAngka, formatRupiah, formatTanggal } from '../../utils/format';
import { OPSI_BULAN } from '../../utils/bulan';

const PER_HALAMAN = 25;
const FILTER_AWAL = { tahun: '', bulan: '', rekening: '', projectId: '', q: '' };

export default function TransaksiPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [params, setParams] = useSearchParams();
  const rekap = params.get('tampilan') === 'rekap';
  const [filter, setFilter] = useState(FILTER_AWAL);
  const [halaman, setHalaman] = useState(1);
  const [konfirmasi, setKonfirmasi] = useState(null);
  const [aksiError, setAksiError] = useState('');
  const [pesan, setPesan] = useState(location.state?.pesan || '');

  useEffect(() => {
    if (location.state?.pesan) navigate(location.pathname, { replace: true, state: null });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const muat = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const [d, p] = await Promise.all([api.listTransaksi(), listProject()]);
      setData(d);
      setProjects(p);
    } catch {
      setLoadError('Transaksi belum dapat dimuat. Periksa koneksi, lalu coba kembali.');
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { muat(); }, [muat]);

  const tersaring = useMemo(() => {
    if (!data) return [];
    const q = filter.q.trim().toLowerCase();
    return data.rows
      .filter((t) =>
        (!filter.tahun || t.tanggal.startsWith(filter.tahun)) &&
        (!filter.bulan || t.tanggal.slice(5, 7) === filter.bulan) &&
        (!filter.rekening || t.rekening === filter.rekening) &&
        (!filter.projectId || t.projectId === Number(filter.projectId)) &&
        (!q || [t.keterangan, t.noInvoice, t.noInvoicePesanan, t.produkPesanan, t.subkategori, t.kategori, t.namaPekerjaan, t.namaProject, t.namaPihak].some((v) => (v || '').toLowerCase().includes(q))))
      .reverse();
  }, [data, filter]);

  const jumlahHalaman = Math.max(1, Math.ceil(tersaring.length / PER_HALAMAN));
  const halamanAktif = Math.min(halaman, jumlahHalaman);
  const tampil = tersaring.slice((halamanAktif - 1) * PER_HALAMAN, halamanAktif * PER_HALAMAN);

  const ubahFilter = (e) => { setFilter((f) => ({ ...f, [e.target.name]: e.target.value })); setHalaman(1); };

  async function hapus(t) {
    setAksiError('');
    try {
      await (t.klasifikasi === 'PIUTANG' ? deletePiutang(t.id) : api.deleteTransaksi(t.id));
      setKonfirmasi(null);
      setPesan(`Transaksi "${t.keterangan}" dihapus.`);
      await muat();
    } catch (err) {
      setAksiError(err.message || 'Transaksi belum dapat dihapus. Silakan coba kembali.');
    }
  }

  const r = data?.ringkasan;
  const tahunIni = String(new Date().getFullYear());
  const opsiTahun = useMemo(() => [...new Set([tahunIni, ...(data?.rows ?? []).map((t) => t.tanggal.slice(0, 4))])].sort().reverse(), [data, tahunIni]);
  const ubahTampilan = (e) => setParams(e.target.value === 'rekap' ? { tampilan: 'rekap' } : {}, { replace: true });

  return (
    <>
      <PageHeader
        title="Transaksi"
        hint="Catatan dana masuk dan dana keluar."
        actions={<Link className="btn btn-primary" to="/transaksi/tambah">Tambah transaksi</Link>}
      />

      <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6">
        <TabTransaksi />
        {pesan && <Notice onClose={() => setPesan('')}>{pesan}</Notice>}
        {aksiError && <Notice tone="danger" onClose={() => setAksiError('')}>{aksiError}</Notice>}

        {!rekap && (
        <section aria-label="Ringkasan transaksi" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Saldo rekening global" value={formatRupiah(r?.saldoGiro)} tone={r?.saldoGiro < 0 ? 'neg' : 'default'} />
          <Stat label="Total dana masuk" value={formatRupiah(r?.danaMasuk)} tone="masuk" sub="Tidak termasuk piutang" />
          <Stat label="Dana keluar rekening global" value={formatRupiah(r?.keluarGiro)} tone="keluar" sub="Tidak termasuk piutang" />
          <Stat label="Dana keluar kas" value={formatRupiah(r?.keluarKas)} tone="keluar" />
        </section>
        )}

        <section aria-label="Filter transaksi" className="card grid grid-cols-2 gap-4 p-5 lg:grid-cols-4">
          <div className="field col-span-2 lg:col-span-1">
            <span className="label">Tampilan</span>
            <Segmen label="Tampilan" name="tampilan" value={rekap ? 'rekap' : 'daftar'} onChange={ubahTampilan}
              options={[{ value: 'daftar', label: 'Daftar' }, { value: 'rekap', label: 'Rekap' }]} />
          </div>
          <div className="field">
            <label className="label" htmlFor="f-tahun">Tahun</label>
            <select id="f-tahun" name="tahun" className="input" value={rekap ? (filter.tahun || tahunIni) : filter.tahun} onChange={ubahFilter}>
              {!rekap && <option value="">Semua tahun</option>}
              {opsiTahun.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="field">
            <label className="label" htmlFor="f-bulan">Bulan</label>
            <select id="f-bulan" name="bulan" className="input" value={filter.bulan} onChange={ubahFilter}>
              <option value="">Semua bulan</option>
              {OPSI_BULAN.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
            </select>
          </div>
          <div className="field col-span-2 lg:col-span-1">
            <label className="label" htmlFor="f-project">Nama project</label>
            <select id="f-project" name="projectId" className="input" value={filter.projectId} onChange={ubahFilter}>
              <option value="">Semua project</option>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.nama}</option>)}
            </select>
          </div>

          {!rekap && (
            <>
              <div className="field col-span-2">
                <label className="label" htmlFor="f-rek">Rekening</label>
                <select id="f-rek" name="rekening" className="input" value={filter.rekening} onChange={ubahFilter}>
                  <option value="">Semua rekening</option>
                  {api.REKENING.map((x) => <option key={x.id} value={x.id}>{x.nama}</option>)}
                </select>
              </div>
              <div className="field col-span-2">
                <label className="label" htmlFor="f-q">Cari</label>
                <input id="f-q" name="q" type="search" className="input" value={filter.q} onChange={ubahFilter} placeholder="Deskripsi, pekerjaan, atau invoice" />
              </div>
            </>
          )}
        </section>

        {loadError && <Notice tone="danger">{loadError} <button type="button" className="btn btn-sm ml-2" onClick={muat}>Muat ulang</button></Notice>}

        {rekap ? (
          <RekapTransaksi tahun={filter.tahun || tahunIni} bulan={filter.bulan} projectId={filter.projectId} />
        ) : (
          <>
        <section className="card overflow-hidden" aria-label="Daftar transaksi">
          <div className="overflow-x-auto">
            <table className="tbl tbl-stack md:min-w-[1000px]">
              <thead>
                <tr>
                  <th scope="col">Tanggal</th>
                  <th scope="col">Nama project</th>
                  <th scope="col">Kategori</th>
                  <th scope="col">Pekerjaan, jenis, atau pihak</th>
                  <th scope="col">Deskripsi transaksi</th>
                  <th scope="col" className="num">Dana masuk</th>
                  <th scope="col" className="num">Dana keluar</th>
                  <th scope="col" className="num">Saldo</th>
                  <th scope="col"><span className="sr-only">Aksi</span></th>
                </tr>
              </thead>
              <tbody>
                {loading && <tr><td colSpan={9}><Kosong>Memuat transaksi…</Kosong></td></tr>}
                {!loading && tampil.length === 0 && (
                  <tr><td colSpan={9}>
                    <Kosong>{data?.rows.length ? 'Tidak ada transaksi yang sesuai dengan filter.' : 'Belum ada transaksi tercatat.'}</Kosong>
                  </td></tr>
                )}
                {!loading && tampil.map((t) => {
                  const project = t.klasifikasi === 'PROJECT' || t.klasifikasi === 'PESANAN';
                  const badge = { PROJECT: ['badge-ok', 'Project'], PESANAN: ['badge-in', 'Pesanan'], PIUTANG: ['badge-out', 'Piutang'], OPERASIONAL: ['badge-warn', 'Operasional'] }[t.klasifikasi];
                  return (
                    <tr key={t.id}>
                      <td className="whitespace-nowrap text-army-600">
                        {formatTanggal(t.tanggal)}
                        <small className="block text-xs font-semibold text-army-500">{t.rekening === 'GIRO' ? 'Rekening global' : 'Kas'}</small>
                      </td>
                      <td>{t.namaProject ? <span className="font-semibold">{t.namaProject}</span> : <span className="text-army-400">—</span>}</td>
                      <td><span className={`badge ${badge[0]}`}>{badge[1]}</span></td>
                      <td>
                        {project ? (t.namaPekerjaan || '—') : t.klasifikasi === 'PIUTANG' ? (t.namaPihak || '—') : (t.subkategori || '—')}
                        {!project && t.kategori && <small className="block text-xs text-army-500">{t.kategori}</small>}
                      </td>
                      <td>
                        {t.keterangan}
                        {t.tahap && <span className="badge badge-in ml-2">{labelTahap(t.tahap)}</span>}
                        {t.pembayaranKe && <span className="badge badge-out ml-2">Pembayaran {t.pembayaranKe}</span>}
                        {t.nomorPiutang && <span className="badge badge-out ml-2">{t.jenisPiutang === 'PINJAMAN' ? 'Pinjaman' : 'Pembayaran'} {t.nomorPiutang}</span>}
                        {(t.noInvoice || t.noInvoicePesanan) && <small className="block text-xs text-army-500">Invoice {t.noInvoice || t.noInvoicePesanan}</small>}
                      </td>
                      <td className="num text-army-600">{t.arah === 'MASUK' ? formatAngka(t.nominal) : '—'}</td>
                      <td className="num text-ember-600">{t.arah === 'KELUAR' ? formatAngka(t.nominal) : '—'}</td>
                      <td className={`num${t.saldo < 0 ? ' neg' : ''}`}>{t.saldo === null ? '—' : formatAngka(t.saldo)}</td>
                      <td>
                        <div className="flex gap-2 md:justify-end">
                          {konfirmasi === t.id ? (
                            <>
                              <button type="button" className="btn btn-sm btn-act" autoFocus onClick={() => setKonfirmasi(null)}>Batal</button>
                              <button type="button" className="btn btn-sm btn-act btn-danger-solid" aria-label={`Ya, hapus transaksi ${t.keterangan}`} onClick={() => hapus(t)}>Ya, hapus</button>
                            </>
                          ) : (
                            <>
                              <Link className="btn btn-sm btn-act" to={t.klasifikasi === 'PIUTANG' ? `/transaksi/piutang/${t.id}/ubah` : `/transaksi/${t.id}/ubah`} aria-label={`Ubah transaksi ${t.keterangan}`}>Ubah</Link>
                              <button type="button" className="btn btn-sm btn-act btn-danger" aria-label={`Hapus transaksi ${t.keterangan}`} onClick={() => setKonfirmasi(t.id)}>Hapus</button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="hint">{tersaring.length} transaksi</span>
          <div className="flex items-center gap-3">
            <button type="button" className="btn btn-sm min-w-[7rem]" disabled={halamanAktif <= 1} onClick={() => setHalaman(halamanAktif - 1)}>Sebelumnya</button>
            <span className="hint">Halaman {halamanAktif} dari {jumlahHalaman}</span>
            <button type="button" className="btn btn-sm min-w-[7rem]" disabled={halamanAktif >= jumlahHalaman} onClick={() => setHalaman(halamanAktif + 1)}>Berikutnya</button>
          </div>
        </div>
          </>
        )}
      </div>
    </>
  );
}

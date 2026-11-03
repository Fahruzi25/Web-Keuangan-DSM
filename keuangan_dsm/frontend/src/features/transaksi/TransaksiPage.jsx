import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import PageHeader from '../../components/ui/PageHeader';
import { Kosong, Notice, Stat } from '../../components/ui/kit';
import * as api from '../../api/transaksi.api';
import { listProject, labelTahap } from '../../api/project.api';
import { formatAngka, formatRupiah, formatTanggal } from '../../utils/format';
import { OPSI_BULAN } from '../../utils/bulan';

const PER_HALAMAN = 25;
const FILTER_AWAL = { bulan: '', rekening: '', klasifikasi: '', projectId: '', q: '' };

export default function TransaksiPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
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
        (!filter.bulan || t.tanggal.slice(5, 7) === filter.bulan) &&
        (!filter.rekening || t.rekening === filter.rekening) &&
        (!filter.klasifikasi || t.klasifikasi === filter.klasifikasi) &&
        (!filter.projectId || t.projectId === Number(filter.projectId)) &&
        (!q || [t.keterangan, t.noInvoice, t.noInvoicePesanan, t.produkPesanan, t.subkategori, t.kategori, t.namaPekerjaan, t.namaProject].some((v) => (v || '').toLowerCase().includes(q))))
      .reverse();
  }, [data, filter]);

  const jumlahHalaman = Math.max(1, Math.ceil(tersaring.length / PER_HALAMAN));
  const halamanAktif = Math.min(halaman, jumlahHalaman);
  const tampil = tersaring.slice((halamanAktif - 1) * PER_HALAMAN, halamanAktif * PER_HALAMAN);

  const ubahFilter = (e) => { setFilter((f) => ({ ...f, [e.target.name]: e.target.value })); setHalaman(1); };

  async function hapus(t) {
    setAksiError('');
    try {
      await api.deleteTransaksi(t.id);
      setKonfirmasi(null);
      setPesan(`Transaksi "${t.keterangan}" dihapus.`);
      await muat();
    } catch (err) {
      setAksiError(err.message || 'Transaksi belum dapat dihapus. Silakan coba kembali.');
    }
  }

  const r = data?.ringkasan;

  return (
    <>
      <PageHeader
        title="Transaksi"
        hint="Riwayat seluruh transaksi pada rekening global dan kas."
        actions={<Link className="btn btn-primary" to="/transaksi/tambah">Tambah transaksi</Link>}
      />

      <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6">
        {pesan && <Notice onClose={() => setPesan('')}>{pesan}</Notice>}
        {aksiError && <Notice tone="danger" onClose={() => setAksiError('')}>{aksiError}</Notice>}

        <section aria-label="Ringkasan transaksi" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Saldo rekening global" value={formatRupiah(r?.saldoGiro)} tone={r?.saldoGiro < 0 ? 'neg' : 'default'} />
          <Stat label="Total dana masuk" value={formatRupiah(r?.danaMasuk)} tone="masuk" />
          <Stat label="Dana keluar rekening global" value={formatRupiah(r?.keluarGiro)} tone="keluar" />
          <Stat label="Dana keluar kas" value={formatRupiah(r?.keluarKas)} tone="keluar" />
        </section>

        <section aria-label="Filter transaksi" className="card grid grid-cols-2 gap-4 p-5 lg:grid-cols-5">
          <div className="field">
            <label className="label" htmlFor="f-bulan">Bulan</label>
            <select id="f-bulan" name="bulan" className="input" value={filter.bulan} onChange={ubahFilter}>
              <option value="">Semua bulan</option>
              {OPSI_BULAN.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
            </select>
          </div>
          <div className="field">
            <label className="label" htmlFor="f-rek">Rekening</label>
            <select id="f-rek" name="rekening" className="input" value={filter.rekening} onChange={ubahFilter}>
              <option value="">Semua rekening</option>
              {api.REKENING.map((x) => <option key={x.id} value={x.id}>{x.nama}</option>)}
            </select>
          </div>
          <div className="field">
            <label className="label" htmlFor="f-klas">Kategori</label>
            <select id="f-klas" name="klasifikasi" className="input" value={filter.klasifikasi} onChange={ubahFilter}>
              <option value="">Semua</option>
              <option value="PROJECT">Project</option>
              <option value="PESANAN">Pesanan</option>
              <option value="OPERASIONAL">Operasional</option>
            </select>
          </div>
          <div className="field">
            <label className="label" htmlFor="f-project">Project</label>
            <select id="f-project" name="projectId" className="input" value={filter.projectId} onChange={ubahFilter}>
              <option value="">Semua project</option>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.nama}</option>)}
            </select>
          </div>
          <div className="field col-span-2 lg:col-span-1">
            <label className="label" htmlFor="f-q">Cari</label>
            <input id="f-q" name="q" type="search" className="input" value={filter.q} onChange={ubahFilter} placeholder="Deskripsi, pekerjaan, atau invoice" />
          </div>
        </section>

        {loadError && <Notice tone="danger">{loadError} <button type="button" className="btn btn-sm ml-2" onClick={muat}>Muat ulang</button></Notice>}

        <section className="card overflow-hidden" aria-label="Daftar transaksi">
          <div className="overflow-x-auto">
            <table className="tbl tbl-stack md:min-w-[1000px]">
              <thead>
                <tr>
                  <th scope="col">Tanggal</th>
                  <th scope="col">Nama project</th>
                  <th scope="col">Kategori</th>
                  <th scope="col">Pekerjaan / jenis operasional</th>
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
                    <Kosong>{data?.rows.length ? 'Tidak ada transaksi yang sesuai dengan filter.' : 'Belum ada transaksi tercatat. Gunakan tombol Tambah transaksi untuk menambahkan data.'}</Kosong>
                  </td></tr>
                )}
                {!loading && tampil.map((t) => {
                  const project = t.klasifikasi !== 'OPERASIONAL';
                  const badge = { PROJECT: ['badge-ok', 'Project'], PESANAN: ['badge-in', 'Pesanan'], OPERASIONAL: ['badge-warn', 'Operasional'] }[t.klasifikasi];
                  return (
                    <tr key={t.id}>
                      <td className="whitespace-nowrap text-army-600">
                        {formatTanggal(t.tanggal)}
                        <small className="block text-xs font-semibold text-army-500">{t.rekening === 'GIRO' ? 'Rekening global' : 'Kas'}</small>
                      </td>
                      <td>{t.namaProject ? <span className="font-semibold">{t.namaProject}</span> : <span className="text-army-400">—</span>}</td>
                      <td><span className={`badge ${badge[0]}`}>{badge[1]}</span></td>
                      <td>
                        {project ? (t.namaPekerjaan || '—') : (t.subkategori || '—')}
                        {!project && t.kategori && <small className="block text-xs text-army-500">{t.kategori}</small>}
                      </td>
                      <td>
                        {t.keterangan}
                        {t.tahap && <span className="badge badge-in ml-2">{labelTahap(t.tahap)}</span>}
                        {t.pembayaranKe && <span className="badge badge-out ml-2">Pembayaran {t.pembayaranKe}</span>}
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
                              <Link className="btn btn-sm btn-act" to={`/transaksi/${t.id}/ubah`} aria-label={`Ubah transaksi ${t.keterangan}`}>Ubah</Link>
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
      </div>
    </>
  );
}

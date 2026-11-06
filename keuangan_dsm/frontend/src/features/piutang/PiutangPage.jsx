import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import PageHeader from '../../components/ui/PageHeader';
import TabTransaksi from '../../components/ui/TabTransaksi';
import { Kosong, Loading, Notice, Progress, Stat } from '../../components/ui/kit';
import * as api from '../../api/piutang.api';
import { formatAngka, formatRupiah, formatTanggal } from '../../utils/format';

const Chevron = ({ buka }) => (
  <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" className={`h-4 w-4 transition ${buka ? 'rotate-180' : ''}`}>
    <path d="M5.3 7.3a1 1 0 0 1 1.4 0L10 10.6l3.3-3.3a1 1 0 1 1 1.4 1.4l-4 4a1 1 0 0 1-1.4 0l-4-4a1 1 0 0 1 0-1.4Z" />
  </svg>
);

export default function PiutangPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [tutup, setTutup] = useState({});
  const [konfirmasi, setKonfirmasi] = useState(null);
  const [aksiError, setAksiError] = useState('');
  const [pesan, setPesan] = useState(location.state?.pesan || '');
  const [ganti, setGanti] = useState(null); // { id, nilai, error }

  useEffect(() => {
    if (location.state?.pesan) navigate(location.pathname, { replace: true, state: null });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const muat = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try { setData(await api.listPiutang()); } catch { setLoadError('Data piutang belum dapat dimuat. Periksa koneksi, lalu coba kembali.'); } finally { setLoading(false); }
  }, []);
  useEffect(() => { muat(); }, [muat]);

  const tersaring = useMemo(() => {
    const kata = q.trim().toLowerCase();
    return (data?.pihak ?? []).filter((p) =>
      (!status || (status === 'LUNAS' ? p.lunas : !p.lunas)) &&
      (!kata || p.nama.toLowerCase().includes(kata) || p.rincian.some((r) => r.keterangan.toLowerCase().includes(kata))));
  }, [data, q, status]);

  async function hapus(r) {
    setAksiError('');
    try {
      await api.deletePiutang(r.id);
      setKonfirmasi(null);
      setPesan(`${r.label} dihapus.`);
      await muat();
    } catch (err) { setAksiError(err.message || 'Data belum dapat dihapus. Silakan coba kembali.'); }
  }

  async function simpanNama(e) {
    e.preventDefault();
    try {
      await api.ubahNamaPihak(ganti.id, ganti.nilai);
      setGanti(null);
      setPesan('Nama pihak diperbarui.');
      await muat();
    } catch (err) { setGanti((g) => ({ ...g, error: err.message || 'Nama belum dapat disimpan.' })); }
  }

  const r = data?.ringkasan;

  return (
    <>
      <PageHeader title="Piutang" hint="Pinjaman dan pembayaran piutang pihak lain melalui rekening giro."
        actions={<Link className="btn btn-primary" to="/transaksi/piutang/tambah">Tambah piutang</Link>} />

      <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6">
        <TabTransaksi />
        {pesan && <Notice onClose={() => setPesan('')}>{pesan}</Notice>}
        {aksiError && <Notice tone="danger" onClose={() => setAksiError('')}>{aksiError}</Notice>}
        {loadError && <Notice tone="danger">{loadError}</Notice>}

        <section aria-label="Ringkasan piutang" className="grid gap-4 md:grid-cols-3">
          <Stat label="Total piutang" value={formatRupiah(r?.totalPiutang)} sub={`${r?.jumlahPihak ?? 0} pihak`} />
          <Stat label="Sudah dibayar" value={formatRupiah(r?.dibayar)} tone="masuk">
            <Progress persen={r?.totalPiutang ? (r.dibayar / r.totalPiutang) * 100 : 0} label="Piutang yang sudah dibayar" />
          </Stat>
          <Stat label="Sisa piutang" value={formatRupiah(r?.sisa)} tone="keluar" sub="Belum dibayar seluruh pihak" />
        </section>

        <section aria-label="Filter piutang" className="card flex-row flex-wrap items-end gap-4 p-5">
          <div className="field min-w-[16rem] flex-1 basis-80">
            <label className="label" htmlFor="cari-piutang">Cari pihak atau keterangan</label>
            <input id="cari-piutang" type="search" className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nama pihak atau keterangan" />
          </div>
          <div className="field min-w-[12rem]">
            <label className="label" htmlFor="status-piutang">Status</label>
            <select id="status-piutang" className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">Semua</option>
              <option value="BELUM">Belum lunas</option>
              <option value="LUNAS">Lunas</option>
            </select>
          </div>
        </section>

        {loading && <Loading>Memuat piutang…</Loading>}
        {!loading && tersaring.length === 0 && (
          <section className="card"><Kosong>{data?.pihak.length ? 'Tidak ada pihak yang sesuai dengan filter.' : 'Belum ada piutang tercatat.'}</Kosong></section>
        )}

        {!loading && tersaring.map((p) => {
          const buka = !tutup[p.id];
          const sedangGanti = ganti?.id === p.id;
          return (
            <section key={p.id} className="card overflow-hidden" aria-label={`Piutang ${p.nama}`}>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-3 p-5 sm:px-6">
                <button type="button" className="btn btn-sm !min-w-0 !px-3" aria-expanded={buka} aria-label={`${buka ? 'Tutup' : 'Buka'} rincian ${p.nama}`}
                  onClick={() => setTutup((t) => ({ ...t, [p.id]: buka }))}><Chevron buka={buka} /></button>

                <div className="min-w-[14rem] flex-1">
                  {sedangGanti ? (
                    <form onSubmit={simpanNama} className="flex flex-wrap items-start gap-2">
                      <div className="field flex-1 basis-60">
                        <label className="sr-only" htmlFor={`nama-${p.id}`}>Nama pihak</label>
                        <input id={`nama-${p.id}`} className="input" value={ganti.nilai} autoFocus onChange={(e) => setGanti({ ...ganti, nilai: e.target.value, error: '' })} aria-invalid={!!ganti.error} />
                        {ganti.error && <span className="err" role="alert">{ganti.error}</span>}
                      </div>
                      <button type="submit" className="btn btn-primary btn-sm">Simpan nama</button>
                      <button type="button" className="btn btn-sm" onClick={() => setGanti(null)}>Batal</button>
                    </form>
                  ) : (
                    <h2 className="flex flex-wrap items-center gap-3 text-lg font-bold">
                      {p.nama}
                      {p.lunas ? <span className="badge badge-ok">Lunas</span> : <span className="badge badge-warn">Belum lunas</span>}
                    </h2>
                  )}
                  <p className="hint text-xs">{p.jumlahPinjaman} pinjaman · {p.jumlahPembayaran} pembayaran</p>
                </div>

                <dl className="grid grid-cols-3 gap-x-8 text-sm">
                  {[['Total', p.total, ''], ['Dibayar', p.dibayar, 'text-army-600'], ['Sisa', p.sisa, p.sisa > 0 ? 'text-ember-600' : '']].map(([label, nilai, warna]) => (
                    <div key={label}><dt className="label">{label}</dt><dd className={`mt-1 font-num font-semibold ${warna}`}>{formatAngka(nilai)}</dd></div>
                  ))}
                </dl>

                <div className="flex flex-wrap gap-2">
                  {!p.lunas && <Link className="btn btn-primary btn-sm" to={`/transaksi/piutang/tambah?pihakId=${p.id}&jenis=PEMBAYARAN`}>Catat pembayaran</Link>}
                  <Link className="btn btn-sm" to={`/transaksi/piutang/tambah?pihakId=${p.id}&jenis=PINJAMAN`}>Tambah pinjaman</Link>
                  {!sedangGanti && <button type="button" className="btn btn-sm" onClick={() => setGanti({ id: p.id, nilai: p.nama, error: '' })} aria-label={`Ubah nama ${p.nama}`}>Ubah nama</button>}
                </div>
              </div>

              {buka && (
                <div className="overflow-x-auto border-t border-army-100">
                  <table className="tbl tbl-stack md:min-w-[760px]">
                    <thead>
                      <tr>
                        <th scope="col">Rincian</th><th scope="col">Tanggal</th><th scope="col">Keterangan</th>
                        <th scope="col" className="num">Pinjaman</th><th scope="col" className="num">Pembayaran</th><th scope="col"><span className="sr-only">Aksi</span></th>
                      </tr>
                    </thead>
                    <tbody>
                      {p.rincian.map((x) => (
                        <tr key={x.id}>
                          <th scope="row" className="font-semibold">{x.label}</th>
                          <td className="whitespace-nowrap text-army-600">{formatTanggal(x.tanggal)}</td>
                          <td>{x.keterangan}</td>
                          <td className="num text-ember-600">{x.jenis === 'PINJAMAN' ? formatAngka(x.nominal) : '—'}</td>
                          <td className="num text-army-600">{x.jenis === 'PEMBAYARAN' ? formatAngka(x.nominal) : '—'}</td>
                          <td>
                            <div className="flex gap-2 md:justify-end">
                              {konfirmasi === x.id ? (
                                <>
                                  <button type="button" className="btn btn-sm btn-act" autoFocus onClick={() => setKonfirmasi(null)}>Batal</button>
                                  <button type="button" className="btn btn-sm btn-act btn-danger-solid" aria-label={`Ya, hapus ${x.label} ${p.nama}`} onClick={() => hapus(x)}>Ya, hapus</button>
                                </>
                              ) : (
                                <>
                                  <Link className="btn btn-sm btn-act" to={`/transaksi/piutang/${x.id}/ubah`} aria-label={`Ubah ${x.label} ${p.nama}`}>Ubah</Link>
                                  <button type="button" className="btn btn-sm btn-act btn-danger" aria-label={`Hapus ${x.label} ${p.nama}`} onClick={() => setKonfirmasi(x.id)}>Hapus</button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <th scope="row" colSpan={3}>Total</th>
                        <td className="num text-ember-600">{formatAngka(p.total)}</td>
                        <td className="num text-army-600">{formatAngka(p.dibayar)}</td>
                        <td className="num">Sisa {formatAngka(p.sisa)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </section>
          );
        })}
      </div>
    </>
  );
}

import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import PageHeader from '../../components/ui/PageHeader';
import { Kosong, Loading, Notice, Progress, Stat } from '../../components/ui/kit';
import * as api from '../../api/project.api';
import { namaRekening } from '../../api/transaksi.api';
import { persenPph, PPN_PERSEN } from '../../utils/pajak';
import { labelPesanan } from '../../utils/pesanan';
import { formatAngka, formatRupiah, formatTanggal } from '../../utils/format';

const STATUS = {
  DONE: { teks: 'Cair', kelas: 'badge badge-ok' },
  BELUM: { teks: 'Belum', kelas: 'badge badge-idle' },
};

export default function ProjectDetailPage() {
  const { id } = useParams();
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const [state, setState] = useState({ status: 'loading' });
  const [hapusTanya, setHapusTanya] = useState(false);
  const [aksiError, setAksiError] = useState('');

  useEffect(() => {
    let batal = false;
    api.getProject(Number(id))
      .then((project) => { if (!batal) setState({ status: 'ok', project }); })
      .catch((err) => { if (!batal) setState({ status: 'error', pesan: err.status === 404 ? 'Project tidak ditemukan atau telah dihapus.' : 'Data belum dapat dimuat. Periksa koneksi, lalu coba kembali.' }); });
    return () => { batal = true; };
  }, [id]);

  const back = { to: '/project', label: 'Kembali ke Project' };

  if (state.status !== 'ok') {
    return (
      <>
        <PageHeader title="Detail project" back={back} />
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          {state.status === 'loading' && <Loading>Memuat detail…</Loading>}
          {state.status === 'error' && <Notice tone="danger">{state.pesan}</Notice>}
        </div>
      </>
    );
  }

  const p = state.project;
  const k = p.pekerjaan.find((x) => x.id === Number(params.get('pekerjaan'))) || p.pekerjaan[0];

  async function hapus() {
    setAksiError('');
    try {
      await api.deleteProject(p.id);
      navigate('/project', { state: { pesan: `Project "${p.nama}" dihapus.` } });
    } catch (err) {
      setHapusTanya(false);
      setAksiError(err.message || 'Data belum dapat dihapus. Silakan coba kembali.');
    }
  }

  const aksi = (
    <>
      <Link className="btn btn-glass" to={`/project/${p.id}/ubah`}>Ubah</Link>
      {hapusTanya ? (
        <>
          <button type="button" className="btn" onClick={() => setHapusTanya(false)} autoFocus>Batal</button>
          <button type="button" className="btn btn-danger-solid" onClick={hapus}>Ya, hapus</button>
        </>
      ) : (
        <button type="button" className="btn btn-glass-danger" onClick={() => setHapusTanya(true)}>Hapus</button>
      )}
    </>
  );

  return (
    <>
      <PageHeader title={p.nama} hint={`${p.pekerjaan.length} pekerjaan`} back={back} actions={aksi} />

      <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6">
        {hapusTanya && <Notice tone="danger">Penghapusan project juga menghapus seluruh pekerjaan di dalamnya dan tidak dapat dibatalkan.</Notice>}
        {aksiError && <Notice tone="danger" onClose={() => setAksiError('')}>{aksiError}</Notice>}

        <section aria-label="Ringkasan project" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Nilai kontrak" value={formatRupiah(p.nilaiKontrak)} />
          <Stat label="SP2D" value={formatRupiah(p.sp2d)} />
          <Stat label="Sudah cair" value={formatRupiah(p.cair)} tone="masuk">
            <Progress persen={p.sp2d ? (p.cair / p.sp2d) * 100 : 0} label="Sudah cair" />
          </Stat>
          <Stat label="Belum cair" value={formatRupiah(p.belumCair)} tone="keluar" />
        </section>

        <section className="card p-6 sm:p-8" aria-labelledby="judul-info">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 id="judul-info" className="text-lg font-bold">Kontrak project</h2>
            {p.selesai && <span className="badge badge-ok">Pencairan selesai</span>}
          </div>
          <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              ['Kode project', p.kodeProject || '—'],
              ['Kontrak INAPROC', p.kontrakInaproc || '—'],
              ['Nomor kontrak', p.nomorKontrak || '—'],
              ['Tanggal kontrak', formatTanggal(p.tglKontrak)],
              ['Nilai kontrak', formatRupiah(p.nilaiKontrak)],
              ['SP2D', formatRupiah(p.sp2d)],
              ['Pajak', `PPN ${PPN_PERSEN}% · PPh ${persenPph(p)}%`],
            ].map(([label, v]) => (
              <div key={label}><dt className="label">{label}</dt><dd className="mt-1 font-medium">{v}</dd></div>
            ))}
          </dl>
        </section>

        <section className="card overflow-hidden" aria-labelledby="judul-cair">
          <div className="flex flex-wrap items-center justify-between gap-3 p-6 pb-4">
            <div>
              <h2 id="judul-cair" className="text-lg font-bold">Pencairan SP2D</h2>
              <p className="hint">Sudah cair {formatRupiah(p.cair)} · Belum cair {formatRupiah(p.belumCair)}</p>
            </div>
            <Link className="btn btn-primary btn-sm" to={`/transaksi/tambah?klasifikasi=PROJECT&projectId=${p.id}&pekerjaanId=${p.pekerjaan[0].id}&tahap=UANG_MUKA`}>Catat pencairan</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="tbl tbl-stack md:min-w-[560px]">
              <thead>
                <tr>
                  <th scope="col">Tahap</th>
                  <th scope="col" className="num">Realisasi</th>
                  <th scope="col">Status</th>
                  <th scope="col">Tgl pencairan</th>
                  <th scope="col"><span className="sr-only">Aksi</span></th>
                </tr>
              </thead>
              <tbody>
                {p.pencairan.map((t) => (
                  <tr key={t.tahap}>
                    <th scope="row" className="font-semibold">{t.label}</th>
                    <td className="num">{t.realisasi ? formatAngka(t.realisasi) : '—'}</td>
                    <td><span className={STATUS[t.status].kelas}>{STATUS[t.status].teks}</span></td>
                    <td className="whitespace-nowrap text-army-600">{formatTanggal(t.tglPencairan)}</td>
                    <td className="aksi text-right">
                      {t.status === 'BELUM' && (
                        <Link className="btn btn-sm" to={`/transaksi/tambah?klasifikasi=PROJECT&projectId=${p.id}&pekerjaanId=${p.pekerjaan[0].id}&tahap=${t.tahap}`} aria-label={`Catat ${t.label}`}>Catat</Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="card overflow-hidden" aria-labelledby="judul-rekap">
          <div className="p-6 pb-4">
            <h2 id="judul-rekap" className="text-lg font-bold">Proyeksi dan realisasi</h2>
            <p className="hint">Dana keluar mencakup biaya langsung dan total pesanan, belum termasuk pengeluaran operasional.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="tbl md:min-w-[560px]">
              <thead>
                <tr><th scope="col"><span className="sr-only">Pos</span></th><th scope="col" className="num">Proyeksi</th><th scope="col" className="num">Realisasi</th><th scope="col" className="num">On proses</th></tr>
              </thead>
              <tbody>
                <tr><th scope="row">Dana masuk (SP2D)</th><td className="num">{formatAngka(p.proyeksiMasuk)}</td><td className="num text-army-600">{formatAngka(p.realisasiMasuk)}</td><td className="num">{formatAngka(p.onProsesMasuk)}</td></tr>
                <tr><th scope="row">Dana keluar</th><td className="num">{formatAngka(p.proyeksiKeluar)}</td><td className="num text-ember-600">{formatAngka(p.realisasiKeluar)}</td><td className="num">{formatAngka(p.onProsesKeluar)}</td></tr>
              </tbody>
            </table>
          </div>
        </section>

        <nav aria-label="Pilih pekerjaan" className="flex flex-wrap gap-2">
          {p.pekerjaan.map((x) => (
            <button key={x.id} type="button" aria-pressed={x.id === k.id}
              onClick={() => setParams({ pekerjaan: String(x.id) })}
              className={`inline-flex min-h-[2.5rem] items-center rounded-full border px-5 text-sm font-semibold transition ${x.id === k.id ? 'border-army-800 bg-army-800 text-white' : 'border-army-200 bg-white text-army-700 hover:border-army-400'}`}>
              {x.nama}
            </button>
          ))}
        </nav>

        <section className="card overflow-hidden" aria-labelledby="judul-pesanan">
          <div className="flex flex-wrap items-center justify-between gap-3 p-6 pb-4">
            <div>
              <h2 id="judul-pesanan" className="text-lg font-bold">Pesanan ke AJK · {k.nama}</h2>
              <p className="hint">Total {formatRupiah(k.totalPesanan)} · Dibayar {formatRupiah(k.dibayarPesanan)} · Sisa {formatRupiah(k.sisaPesanan)}</p>
            </div>
          </div>
          {k.pesanan.length === 0 && <Kosong>Pesanan untuk pekerjaan ini belum dicatat.</Kosong>}
          {k.pesanan.map((ps) => (
            <article key={ps.id} className="border-t border-army-100 p-6" aria-label={`Pesanan ${labelPesanan(ps)}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-bold">{labelPesanan(ps)}</h3>
                  <p className="hint text-xs">{ps.keterangan}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {ps.lunas ? <span className="badge badge-ok">Lunas</span> : <span className="badge badge-warn">Belum lunas</span>}
                  {!ps.lunas && (
                    <Link className="btn btn-primary btn-sm" to={`/transaksi/tambah?klasifikasi=PESANAN&projectId=${p.id}&pekerjaanId=${k.id}&pesananId=${ps.id}`}>Catat pembayaran</Link>
                  )}
                </div>
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-5">
                {[['Total', ps.total], ['DPP', ps.dpp], ['PPN 11%', ps.ppn], ['Dibayar', ps.dibayar], ['Sisa', ps.sisa]].map(([label, nilai]) => (
                  <div key={label}><dt className="label">{label}</dt><dd className={`mt-1 font-num font-semibold ${label === 'Sisa' && nilai > 0 ? 'text-ember-600' : ''}`}>{formatAngka(nilai)}</dd></div>
                ))}
              </dl>
              <Progress persen={ps.total ? (ps.dibayar / ps.total) * 100 : 0} label="Dibayar" />
              <div className="mt-4 overflow-x-auto">
                <table className="tbl tbl-stack md:min-w-[520px]">
                  <thead>
                    <tr>
                      <th scope="col">Pembayaran</th><th scope="col">Tanggal</th><th scope="col">Rekening</th>
                      <th scope="col" className="num">Nominal</th><th scope="col"><span className="sr-only">Aksi</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {ps.pembayaran.length === 0 && <tr><td colSpan={5}><Kosong>Belum ada pembayaran tercatat.</Kosong></td></tr>}
                    {ps.pembayaran.map((b) => (
                      <tr key={b.id}>
                        <th scope="row" className="font-semibold">Pembayaran {b.no}</th>
                        <td className="whitespace-nowrap text-army-600">{formatTanggal(b.tanggal)}</td>
                        <td>{namaRekening(b.rekening)}</td>
                        <td className="num text-ember-600">{formatAngka(b.nominal)}</td>
                        <td className="aksi text-right"><Link className="btn btn-sm" to={`/transaksi/${b.id}/ubah`} aria-label={`Ubah pembayaran ${b.no}`}>Ubah</Link></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </article>
          ))}
        </section>

        <section className="card overflow-hidden" aria-labelledby="judul-trx">
          <div className="p-6 pb-4">
            <h2 id="judul-trx" className="text-lg font-bold">Transaksi pekerjaan</h2>
            <p className="hint">{k.jumlahTransaksi} transaksi</p>
          </div>
          <div className="overflow-x-auto">
            <table className="tbl tbl-stack md:min-w-[640px]">
              <thead>
                <tr>
                  <th scope="col">Tanggal</th>
                  <th scope="col">Deskripsi</th>
                  <th scope="col">Rekening</th>
                  <th scope="col" className="num">Dana masuk</th>
                  <th scope="col" className="num">Dana keluar</th>
                </tr>
              </thead>
              <tbody>
                {k.transaksi.length === 0 && <tr><td colSpan={5}><Kosong>Belum ada transaksi pada pekerjaan ini.</Kosong></td></tr>}
                {k.transaksi.map((t) => (
                  <tr key={t.id}>
                    <td className="whitespace-nowrap text-army-600">{formatTanggal(t.tanggal)}</td>
                    <td>
                      {t.keterangan}
                      {t.tahap && <span className="badge badge-in ml-2">{api.labelTahap(t.tahap)}</span>}
                      {t.pembayaranKe && <span className="badge badge-out ml-2">Pembayaran {t.pembayaranKe}{t.noInvoicePesanan ? ` · ${t.noInvoicePesanan}` : ''}</span>}
                    </td>
                    <td>{namaRekening(t.rekening)}</td>
                    <td className="num text-army-600">{t.arah === 'MASUK' ? formatAngka(t.nominal) : '—'}</td>
                    <td className="num text-ember-600">{t.arah === 'KELUAR' ? formatAngka(t.nominal) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </>
  );
}

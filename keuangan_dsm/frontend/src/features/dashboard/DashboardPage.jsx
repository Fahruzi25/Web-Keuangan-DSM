import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getDashboard } from '../../api/dashboard.api';
import { formatAngka, formatRupiah, formatSingkat, formatTanggal } from '../../utils/format';
import { BULAN_SINGKAT } from '../../utils/bulan';
import PageHeader from '../../components/ui/PageHeader';
import { Loading, Notice, Progress, Stat, Kosong } from '../../components/ui/kit';

function GrafikArus({ data }) {
  const W = 760, H = 280, kiri = 56, atas = 16, bawah = 32;
  const tinggi = H - atas - bawah;
  const maks = Math.max(1, ...data.flatMap((d) => [d.masuk, d.keluar]));
  const slot = (W - kiri) / 12;
  const lebar = Math.min(16, slot / 2 - 3);
  const garis = [0, 0.25, 0.5, 0.75, 1];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img"
      aria-label="Grafik batang dana masuk dan dana keluar per bulan. Angka lengkap ada di tabel tersembunyi di bawahnya.">
      {garis.map((g) => {
        const y = atas + tinggi * (1 - g);
        return (
          <g key={g}>
            <line x1={kiri} x2={W} y1={y} y2={y} className="stroke-army-100" strokeDasharray={g === 0 ? undefined : '4 4'} />
            <text x={kiri - 8} y={y + 4} textAnchor="end" className="fill-army-500 text-[11px]">{g === 0 ? '0' : formatSingkat(maks * g)}</text>
          </g>
        );
      })}
      {data.map((d, i) => {
        const x = kiri + slot * i + slot / 2;
        const hm = (d.masuk / maks) * tinggi;
        const hk = (d.keluar / maks) * tinggi;
        return (
          <g key={BULAN_SINGKAT[i]}>
            <rect x={x - lebar - 1} y={atas + tinggi - hm} width={lebar} height={hm} rx="4" className="fill-army-500 hover:fill-army-600">
              <title>{`${BULAN_SINGKAT[i]}: masuk ${formatRupiah(d.masuk)}`}</title>
            </rect>
            <rect x={x + 1} y={atas + tinggi - hk} width={lebar} height={hk} rx="4" className="fill-ember-500 hover:fill-ember-600">
              <title>{`${BULAN_SINGKAT[i]}: keluar ${formatRupiah(d.keluar)}`}</title>
            </rect>
            <text x={x} y={H - 10} textAnchor="middle" className="fill-army-600 text-[11px]">{BULAN_SINGKAT[i]}</text>
          </g>
        );
      })}
    </svg>
  );
}

export default function DashboardPage() {
  const [d, setD] = useState(null);
  const [error, setError] = useState('');

  const muat = () => {
    setError('');
    getDashboard()
      .then(setD)
      .catch(() => setError('Ringkasan belum dapat dimuat. Periksa koneksi, lalu coba kembali.'));
  };
  useEffect(muat, []);


  const aksi = (
    <>
      <Link className="btn btn-primary" to="/transaksi/tambah">Tambah transaksi</Link>
      <Link className="btn btn-glass" to="/project">Lihat project</Link>
    </>
  );

  if (error) {
    return (
      <>
        <PageHeader title="Home" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6"><Notice tone="danger">{error} <button type="button" className="btn btn-sm ml-2" onClick={muat}>Muat ulang</button></Notice></div>
      </>
    );
  }
  if (!d) {
    return (
      <>
        <PageHeader title="Home" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6"><Loading>Memuat ringkasan…</Loading></div>
      </>
    );
  }

  const x = d.proyek;
  const persenCair = x.sp2d ? (x.cair / x.sp2d) * 100 : 0;
  const kosong = d.perBulan.every((b) => b.masuk === 0 && b.keluar === 0);

  return (
    <>
      <PageHeader
        title="Ringkasan keuangan dan project"
        hint="Posisi saldo, arus dana, progres pencairan SP2D, dan pembayaran pesanan PT Dawuan Slamet Mulyo."
        actions={aksi}
      />

      <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6">
        <section aria-label="Ringkasan utama" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Saldo rekening global" value={formatRupiah(d.saldoGiro)} tone={d.saldoGiro < 0 ? 'neg' : 'default'} />
          <Stat label="Dana masuk" value={formatRupiah(d.danaMasuk)} tone="masuk" sub="Rekening global, tahun berjalan" />
          <Stat label="Dana keluar" value={formatRupiah(d.danaKeluar)} tone="keluar" sub="Rekening global, tahun berjalan" />
          <Stat label="Project terdaftar" value={x.jumlahProject} sub={`${x.jumlahPekerjaan} pekerjaan`} />
        </section>

        <section className="card p-6" aria-labelledby="judul-arus">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 id="judul-arus" className="text-lg font-bold">Arus dana per bulan</h2>
              <p className="hint">Dana masuk dan dana keluar rekening global per bulan.</p>
            </div>
            <div className="flex gap-4 text-xs font-semibold text-army-600" aria-hidden="true">
              <span className="inline-flex items-center gap-1.5"><i className="h-3 w-3 rounded bg-army-500" /> Dana masuk</span>
              <span className="inline-flex items-center gap-1.5"><i className="h-3 w-3 rounded bg-ember-500" /> Dana keluar</span>
            </div>
          </div>
          {kosong ? (
            <Kosong>Belum ada transaksi pada tahun berjalan. Grafik ditampilkan setelah transaksi pertama dicatat.</Kosong>
          ) : (
            <>
              <GrafikArus data={d.perBulan} />
              <table className="sr-only">
                <caption>Dana masuk dan keluar per bulan</caption>
                <thead><tr><th scope="col">Bulan</th><th scope="col">Dana masuk</th><th scope="col">Dana keluar</th></tr></thead>
                <tbody>
                  {d.perBulan.map((b, i) => (
                    <tr key={BULAN_SINGKAT[i]}><th scope="row">{BULAN_SINGKAT[i]}</th><td>{formatAngka(b.masuk)}</td><td>{formatAngka(b.keluar)}</td></tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </section>

        <section aria-label="Indikator project" className="grid gap-4 md:grid-cols-3">
          <Stat label="Project selesai" value={`${x.projectSelesai} dari ${x.jumlahProject}`} sub={`${x.pekerjaanSelesai} dari ${x.jumlahPekerjaan} pekerjaan selesai`}>
            <Progress persen={x.jumlahPekerjaan ? (x.pekerjaanSelesai / x.jumlahPekerjaan) * 100 : 0} label="Pekerjaan selesai" />
          </Stat>
          <Stat label="SP2D sudah cair" value={formatRupiah(x.cair)} sub={`${Math.round(persenCair)}% dari total SP2D ${formatSingkat(x.sp2d)}`}>
            <Progress persen={persenCair} label="SP2D sudah cair" />
          </Stat>
          <Stat label="SP2D belum cair" value={formatRupiah(x.belumCair)} tone="keluar" sub="Sisa pencairan seluruh project" />
        </section>

        <section aria-label="Pesanan ke AJK" className="grid gap-4 md:grid-cols-3">
          <Stat label="Total pesanan ke AJK" value={formatRupiah(x.totalPesanan)} sub="Seluruh pesanan, termasuk PPN" />
          <Stat label="Sudah dibayar" value={formatRupiah(x.dibayarPesanan)} tone="masuk" sub={`${Math.round(x.totalPesanan ? (x.dibayarPesanan / x.totalPesanan) * 100 : 0)}% dari total pesanan`}>
            <Progress persen={x.totalPesanan ? (x.dibayarPesanan / x.totalPesanan) * 100 : 0} label="Pesanan yang sudah dibayar" />
          </Stat>
          <Stat label="Sisa pembayaran" value={formatRupiah(x.sisaPesanan)} tone="keluar" sub="Kewajiban pesanan yang belum dibayar" />
        </section>

        <section className="card overflow-hidden" aria-labelledby="judul-terbaru">
          <div className="flex items-center justify-between gap-3 p-6 pb-4">
            <div>
              <h2 id="judul-terbaru" className="text-lg font-bold">Transaksi terbaru</h2>
              <p className="hint">Lima transaksi terbaru.</p>
            </div>
            <Link className="btn btn-sm" to="/transaksi">Lihat semua</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="tbl tbl-stack">
              <thead>
                <tr>
                  <th scope="col">Tanggal</th><th scope="col">Transaksi</th><th scope="col">Rekening</th><th scope="col">Project</th>
                  <th scope="col" className="num">Dana masuk</th><th scope="col" className="num">Dana keluar</th>
                </tr>
              </thead>
              <tbody>
                {d.terbaru.length === 0 && <tr><td colSpan={6}><Kosong>Belum ada transaksi tercatat.</Kosong></td></tr>}
                {d.terbaru.map((t) => (
                  <tr key={t.id}>
                    <td className="whitespace-nowrap text-army-600">{formatTanggal(t.tanggal)}</td>
                    <td className="font-medium">{t.keterangan}</td>
                    <td>{t.rekening === 'GIRO' ? 'Global' : 'Kas'}</td>
                    <td>{t.namaProject || <span className="text-army-400">Operasional</span>}</td>
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

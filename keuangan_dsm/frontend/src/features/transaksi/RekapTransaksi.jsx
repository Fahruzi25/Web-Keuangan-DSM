import { useEffect, useState } from 'react';
import { Kosong, Loading, Notice, Stat } from '../../components/ui/kit';
import { getRekap } from '../../api/rekap.api';
import { formatAngka, formatRupiah, formatTanggal } from '../../utils/format';

const BADGE = { PROJECT: 'badge-ok', PESANAN: 'badge-in' };
const NAMA_SUMBER = { PROJECT: 'Project', PESANAN: 'Pesanan' };

const Saldo = ({ nilai, className = '' }) => <td className={`num font-semibold${nilai < 0 ? ' neg' : ''} ${className}`}>{formatAngka(nilai)}</td>;

/** Buku besar satu pekerjaan: saldo awal, transaksi berurutan dengan saldo berjalan, lalu saldo akhir. */
function TabelPekerjaan({ g }) {
  return (
    <div className="overflow-x-auto">
      <div className="flex flex-wrap items-baseline justify-between gap-2 bg-army-50 px-6 py-3">
        <h3 className="font-bold text-army-800">{g.judul}</h3>
        <span className="text-xs font-semibold uppercase tracking-wide text-army-500">{g.baris.length} transaksi</span>
      </div>
      <table className="tbl md:min-w-[760px]">
        <thead>
          <tr>
            <th scope="col">Tanggal</th>
            <th scope="col">Keterangan transaksi</th>
            <th scope="col" className="num">Dana masuk</th>
            <th scope="col" className="num">Dana keluar</th>
            <th scope="col" className="num">Sisa saldo</th>
          </tr>
        </thead>
        <tbody>
          {g.saldoAwal !== 0 && (
            <tr className="text-army-600">
              <td className="whitespace-nowrap">Awal periode</td>
              <td>Saldo awal</td><td /><td />
              <Saldo nilai={g.saldoAwal} />
            </tr>
          )}
          {g.baris.map((b) => (
            <tr key={b.id}>
              <td className="whitespace-nowrap text-army-600">{formatTanggal(b.tanggal)}</td>
              <td>
                {b.keterangan}
                <span className={`badge ${BADGE[b.sumber]} ml-2`}>{NAMA_SUMBER[b.sumber]}</span>
                {b.label && <small className="block text-xs text-army-500">{b.label}</small>}
              </td>
              <td className="num text-army-600">{b.masuk ? formatAngka(b.masuk) : '—'}</td>
              <td className="num text-ember-600">{b.keluar ? formatAngka(b.keluar) : '—'}</td>
              <Saldo nilai={b.saldo} />
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <th scope="row" colSpan={2}>Total saldo akhir</th>
            <td className="num text-army-600">{formatAngka(g.totalMasuk)}</td>
            <td className="num text-ember-600">{formatAngka(g.totalKeluar)}</td>
            <td className={`num${g.saldoAkhir < 0 ? ' neg' : ''}`}>{formatAngka(g.saldoAkhir)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

function KartuProject({ p }) {
  const gabungan = p.kelompok.length > 1;
  return (
    <section className="card overflow-hidden" aria-label={`Rekap ${p.nama}`}>
      <div className="flex flex-wrap items-baseline justify-between gap-2 bg-gradient-to-r from-army-900 to-army-800 px-6 py-4 text-white">
        <h2 className="text-lg font-extrabold">{p.nama}</h2>
        <span className="text-xs text-army-200">{p.kodeProject} · {p.kelompok.length} pekerjaan</span>
      </div>
      <div className="divide-y divide-army-100">
        {p.kelompok.map((g) => <TabelPekerjaan key={g.kunci} g={g} />)}
      </div>
      {gabungan && (
        <div className="overflow-x-auto border-t-2 border-army-200">
          <table className="tbl md:min-w-[760px]">
            <tfoot>
              <tr>
                <th scope="row">{`Total saldo ${p.nama.replace(/^PROJECT\s+/i, '')}`}</th>
                <td className="num text-army-600">{formatAngka(p.totalMasuk)}</td>
                <td className="num text-ember-600">{formatAngka(p.totalKeluar)}</td>
                <td className={`num${p.saldoAkhir < 0 ? ' neg' : ''}`}>{formatAngka(p.saldoAkhir)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </section>
  );
}

/**
 * Rekap pada halaman Transaksi: buku besar project (padanan sheet REKAP PABAR). Dibaca dari transaksi, tanpa isian.
 * Filter tahun, bulan, dan project dipegang halaman Transaksi.
 */
export default function RekapTransaksi({ tahun, bulan, projectId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let batal = false;
    setLoading(true);
    setError('');
    getRekap({ tahun, bulan, projectId })
      .then((d) => { if (!batal) setData(d); })
      .catch(() => { if (!batal) setError('Rekap belum dapat dimuat. Periksa koneksi, lalu coba kembali.'); })
      .finally(() => { if (!batal) setLoading(false); });
    return () => { batal = true; };
  }, [tahun, bulan, projectId]);

  const r = data?.ringkasan;

  return (
    <>
      {error && <Notice tone="danger">{error}</Notice>}
      {loading && !data && <Loading>Memuat rekap…</Loading>}

      {data && (
        <div className={`space-y-6 transition-opacity ${loading ? 'pointer-events-none opacity-50' : ''}`} aria-busy={loading}>
          <section aria-label="Ringkasan rekap" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Saldo awal" value={formatRupiah(r.saldoAwal)} sub="Awal periode" />
            <Stat label="Dana masuk" value={formatRupiah(r.masuk)} tone="masuk" sub="Periode terpilih" />
            <Stat label="Dana keluar" value={formatRupiah(r.keluar)} tone="keluar" sub="Periode terpilih" />
            <Stat label="Saldo akhir" value={formatRupiah(r.saldoAkhir)} tone={r.saldoAkhir < 0 ? 'neg' : 'default'} sub="Akhir periode" />
          </section>

          {data.projects.length === 0 && <section className="card"><Kosong>Tidak ada transaksi project pada periode yang dipilih.</Kosong></section>}
          {data.projects.map((p) => <KartuProject key={p.id} p={p} />)}
        </div>
      )}
    </>
  );
}

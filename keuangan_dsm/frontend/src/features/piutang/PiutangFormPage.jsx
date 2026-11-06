import { useEffect, useId, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import PageHeader from '../../components/ui/PageHeader';
import InputRupiah from '../../components/ui/InputRupiah';
import { Loading, Notice, Segmen } from '../../components/ui/kit';
import * as api from '../../api/piutang.api';
import { formatAngka, formatRupiah } from '../../utils/format';
import { normalNama } from '../../utils/pihak';
import { nomorPembayaran } from '../../utils/pesanan';

const hariIni = () => new Date().toISOString().slice(0, 10);

function bentukAwal(ubah, awal, pihakList) {
  if (ubah) return { jenis: ubah.jenis, pihak: ubah.namaPihak, tanggal: ubah.tanggal, nominal: String(ubah.nominal), keterangan: ubah.keterangan };
  const pihak = pihakList.find((p) => String(p.id) === awal.pihakId);
  return { jenis: awal.jenis === 'PEMBAYARAN' ? 'PEMBAYARAN' : 'PINJAMAN', pihak: pihak?.nama ?? '', tanggal: hariIni(), nominal: '', keterangan: '' };
}

function Form({ ubah, pihakList, awal, kosong }) {
  const navigate = useNavigate();
  const [form, setForm] = useState(() => bentukAwal(kosong ? null : ubah, kosong ? {} : awal, pihakList));
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [busy, setBusy] = useState(false);
  const daftarNama = useId();

  const mengubah = !!ubah && !kosong;
  const pembayaran = form.jenis === 'PEMBAYARAN';
  const pihak = pihakList.find((p) => normalNama(p.nama) === normalNama(form.pihak));

  // saat mengubah catatan lama, nilainya sendiri tidak boleh ikut dihitung
  const sendiri = mengubah && pihak?.id === ubah.pihakId ? ubah : null;
  const total = pihak ? pihak.total - (sendiri?.jenis === 'PINJAMAN' ? sendiri.nominal : 0) : 0;
  const dibayar = pihak ? pihak.dibayar - (sendiri?.jenis === 'PEMBAYARAN' ? sendiri.nominal : 0) : 0;
  const sisa = Math.max(total - dibayar, 0);
  const nominal = Number(form.nominal) || 0;

  const rincianJenis = (pihak?.rincian ?? []).filter((r) => r.jenis === form.jenis);
  const nomor = pihak || !pembayaran
    ? nomorPembayaran({ pembayaran: rincianJenis }, { tanggal: form.tanggal, idSaatIni: mengubah ? ubah.id : null })
    : null;

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  const aria = (n) => ({ 'aria-invalid': !!errors[n], 'aria-describedby': errors[n] ? `${n}-err` : undefined });
  const galat = (n) => errors[n] && <span id={`${n}-err`} className="err">{errors[n]}</span>;

  function validasi() {
    const e = {};
    if (!form.pihak.trim()) e.pihak = 'Nama pihak wajib diisi.';
    else if (pembayaran && !pihak) e.pihak = 'Pihak ini belum memiliki piutang. Catat pinjaman terlebih dahulu.';
    if (!form.tanggal) e.tanggal = 'Tanggal wajib diisi.';
    if (!(nominal > 0)) e.nominal = 'Nominal harus lebih dari 0.';
    else if (pembayaran && pihak && nominal > sisa + 1) e.nominal = `Pembayaran melebihi sisa piutang (${formatRupiah(sisa)}).`;
    else if (!pembayaran && mengubah && pihak && total + nominal < dibayar - 1) e.nominal = `Nilai pinjaman tidak boleh lebih kecil dari pembayaran yang sudah tercatat (${formatRupiah(dibayar)}).`;
    if (!form.keterangan.trim()) e.keterangan = 'Keterangan wajib diisi.';
    return e;
  }

  async function submit(ev) {
    ev.preventDefault();
    const e = validasi();
    setErrors(e);
    if (Object.keys(e).length) return;
    setBusy(true);
    setSubmitError('');
    const data = { ...form, pihakId: pihak?.id ?? null };
    try {
      if (mengubah) await api.updatePiutang(ubah.id, data);
      else await api.createPiutang(data);
      navigate('/transaksi/piutang', { state: { pesan: mengubah ? 'Perubahan piutang disimpan.' : pembayaran ? 'Pembayaran piutang disimpan.' : 'Pinjaman baru disimpan.' } });
    } catch (err) {
      setSubmitError((err.message || 'Data belum dapat disimpan. Silakan coba kembali.') + (err.errors?.length ? ' ' + err.errors.join(' ') : ''));
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-6">
      <section className="card space-y-5 p-6 sm:p-8" aria-labelledby="judul-piutang">
        <h2 id="judul-piutang" className="text-lg font-bold">Data piutang</h2>
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="field sm:col-span-2">
            <span className="label">Jenis</span>
            <Segmen label="Jenis piutang" name="jenis" value={form.jenis} onChange={onChange} disabled={mengubah}
              options={[{ value: 'PINJAMAN', label: 'Pinjaman (dana keluar)' }, { value: 'PEMBAYARAN', label: 'Pembayaran (dana masuk)' }]} />
            {mengubah && <span className="hint text-xs">Jenis dan pihak tidak dapat diubah setelah dicatat.</span>}
          </div>

          <div className="field sm:col-span-2">
            <label className="label" htmlFor="pihak">Pihak (instansi)</label>
            <input id="pihak" name="pihak" list={daftarNama} className="input" value={form.pihak} onChange={onChange} disabled={mengubah}
              placeholder="Contoh: PT. Nama Pihak" autoComplete="off" autoFocus={!mengubah} {...aria('pihak')} />
            <datalist id={daftarNama}>{pihakList.map((p) => <option key={p.id} value={p.nama} />)}</datalist>
            {galat('pihak')}
            {!mengubah && form.pihak.trim() && !errors.pihak && (
              pihak ? <span className="hint text-xs">Pihak sudah terdaftar.</span>
                : !pembayaran && <span className="hint text-xs">Pihak baru.</span>
            )}
          </div>

          <div className="field">
            <label className="label" htmlFor="tanggal">Tanggal</label>
            <input id="tanggal" name="tanggal" type="date" className="input" value={form.tanggal} onChange={onChange} {...aria('tanggal')} />
            {galat('tanggal')}
          </div>
          <div className="field">
            <div className="flex items-center justify-between gap-2">
              <label className="label" htmlFor="nominal">Nominal (Rp)</label>
              {pembayaran && pihak && sisa >= 1 && (
                <button type="button" className="btn btn-sm" onClick={() => setForm((f) => ({ ...f, nominal: String(sisa) }))}>Isi sisa</button>
              )}
            </div>
            <InputRupiah id="nominal" name="nominal" className="input font-num" placeholder="Contoh: 275.000.000" value={form.nominal} onChange={onChange} {...aria('nominal')} />
            {galat('nominal')}
          </div>

          <div className="field sm:col-span-2">
            <label className="label" htmlFor="keterangan">Keterangan</label>
            <input id="keterangan" name="keterangan" className="input" value={form.keterangan} onChange={onChange}
              placeholder="Contoh: Tarik cek tunai, lebih geser, atau titip project" {...aria('keterangan')} />
            {galat('keterangan')}
          </div>
          <p className="hint text-xs sm:col-span-2">Dicatat pada rekening global. Pinjaman mengurangi saldo; pembayaran menambah saldo.</p>
        </div>
      </section>

      {pihak && (
        <section className="card space-y-3 p-6 sm:p-8" aria-labelledby="judul-posisi" role="status">
          <h2 id="judul-posisi" className="text-lg font-bold">Posisi piutang {pihak.nama}</h2>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-4">
            {[['Total pinjaman', formatAngka(total), `${pihak.jumlahPinjaman - (sendiri?.jenis === 'PINJAMAN' ? 1 : 0)} kali`],
              ['Sudah dibayar', formatAngka(dibayar), `${pihak.jumlahPembayaran - (sendiri?.jenis === 'PEMBAYARAN' ? 1 : 0)} kali`],
              ['Sisa', formatAngka(sisa), sisa < 1 ? 'Lunas' : 'Belum lunas']].map(([label, nilai, sub]) => (
              <div key={label}><dt className="label">{label}</dt><dd className="mt-1 font-num font-semibold">{nilai}</dd><dd className="text-xs text-army-500">{sub}</dd></div>
            ))}
          </dl>
          <p className="rounded-2xl border border-army-200 bg-army-50 px-4 py-2.5 text-sm">
            Catatan ini akan tersimpan sebagai <strong>{pembayaran ? 'Pembayaran' : 'Pinjaman'} {nomor}</strong>.
            {pembayaran && nominal > 0 && (sisa - nominal >= 0
              ? <> Sisa setelah pembayaran ini <strong className="font-num">{formatRupiah(sisa - nominal)}</strong>{sisa - nominal < 1 && ' (lunas)'}.</>
              : <> <span className="font-semibold text-red-700">Melebihi sisa sebesar {formatRupiah(nominal - sisa)}.</span></>)}
          </p>
        </section>
      )}

      {submitError && <Notice tone="danger">{submitError}</Notice>}

      <div className="grid grid-cols-2 gap-3">
        <Link className="btn w-full" to="/transaksi/piutang">Batal</Link>
        <button type="submit" className="btn btn-primary w-full" disabled={busy}>{busy ? 'Menyimpan…' : 'Simpan piutang'}</button>
      </div>
    </form>
  );
}

export default function PiutangFormPage() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const [state, setState] = useState({ status: 'loading' });
  const [reset, setReset] = useState(0);

  useEffect(() => {
    let batal = false;
    Promise.all([api.listPiutang(), id ? api.getPiutang(Number(id)) : null])
      .then(([daftar, ubah]) => { if (!batal) setState({ status: 'ok', pihakList: daftar.pihak, ubah }); })
      .catch((err) => { if (!batal) setState({ status: 'error', pesan: err.status === 404 ? 'Data piutang tidak ditemukan atau telah dihapus.' : 'Data belum dapat dimuat. Periksa koneksi, lalu coba kembali.' }); });
    return () => { batal = true; };
  }, [id]);

  const awal = { pihakId: params.get('pihakId'), jenis: params.get('jenis') };
  const judul = id ? 'Ubah piutang' : awal.jenis === 'PEMBAYARAN' ? 'Catat pembayaran piutang' : 'Tambah piutang';

  return (
    <>
      <PageHeader title={judul} hint="Pencatatan pinjaman dan pembayaran piutang." back={{ to: '/transaksi/piutang', label: 'Kembali ke Piutang' }}
        onKosongkan={state.status === 'ok' ? () => setReset((n) => n + 1) : undefined} />
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        {state.status === 'loading' && <Loading>Memuat formulir…</Loading>}
        {state.status === 'error' && <Notice tone="danger">{state.pesan}</Notice>}
        {state.status === 'ok' && <Form key={`${id || 'baru'}-${reset}`} {...state} awal={awal} kosong={reset > 0} />}
      </div>
    </>
  );
}

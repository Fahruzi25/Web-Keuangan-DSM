import { useEffect, useId, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import PageHeader from '../../components/ui/PageHeader';
import InputRupiah from '../../components/ui/InputRupiah';
import { Loading, Notice, Segmen } from '../../components/ui/kit';
import * as api from '../../api/transaksi.api';
import { listProject, TAHAP } from '../../api/project.api';
import { formatAngka, formatRupiah } from '../../utils/format';
import { dppPpn, labelPesanan, nomorPembayaran } from '../../utils/pesanan';

const hariIni = () => new Date().toISOString().slice(0, 10);
const KLASIFIKASI = ['PROJECT', 'PESANAN', 'OPERASIONAL'];

function bentukAwal(t, awal) {
  if (t) {
    return {
      rekening: t.rekening, tanggal: t.tanggal, keterangan: t.keterangan, arah: t.arah, nominal: String(t.nominal),
      klasifikasi: t.klasifikasi, projectId: t.projectId ? String(t.projectId) : '', pekerjaanId: t.pekerjaanId ? String(t.pekerjaanId) : '',
      pesananId: t.pesananId ? String(t.pesananId) : '',
      tahap: t.tahap || '', kategori: t.kategori || '', subkategori: t.subkategori || '', noInvoice: t.noInvoice || '',
    };
  }
  return {
    rekening: 'GIRO', tanggal: hariIni(), keterangan: '', arah: awal.tahap ? 'MASUK' : 'KELUAR', nominal: '',
    klasifikasi: KLASIFIKASI.includes(awal.klasifikasi) ? awal.klasifikasi : 'PROJECT',
    projectId: awal.projectId || '', pekerjaanId: awal.pekerjaanId || '', pesananId: awal.pesananId || '', tahap: awal.tahap || '',
    kategori: '', subkategori: '', noInvoice: '',
  };
}

function InfoKontrak({ pekerjaan }) {
  const { dpp, ppn } = dppPpn(pekerjaan.nilaiKontrak);
  const item = [['Nilai kontrak', pekerjaan.nilaiKontrak], ['SP2D', pekerjaan.sp2d], ['DPP', dpp], ['PPN', ppn]];
  return (
    <dl aria-label="Info kontrak pekerjaan" className="grid grid-cols-2 gap-x-6 gap-y-2 rounded-2xl border border-army-200 bg-army-50 px-4 py-3 text-sm sm:col-span-2 sm:grid-cols-4">
      {item.map(([label, nilai]) => (
        <div key={label}><dt className="text-xs font-semibold uppercase tracking-wide text-army-500">{label}</dt><dd className="font-num font-semibold text-army-800">{formatAngka(nilai)}</dd></div>
      ))}
    </dl>
  );
}

function Form({ transaksi, projects, kategoriOpsi, awal, kosong }) {
  const navigate = useNavigate();
  const [form, setForm] = useState(() => bentukAwal(kosong ? null : transaksi, kosong ? {} : awal));
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [busy, setBusy] = useState(false);
  const listKategori = useId();
  const listSub = useId();

  const kl = form.klasifikasi;
  const isKas = form.rekening === 'KAS';
  const isPesanan = kl === 'PESANAN';
  const adaProject = kl !== 'OPERASIONAL';
  const arah = isKas || isPesanan ? 'KELUAR' : form.arah;
  const project = projects.find((p) => p.id === Number(form.projectId));
  const pekerjaan = project?.pekerjaan.find((k) => k.id === Number(form.pekerjaanId));

  // saat mengubah transaksi lama, angka miliknya sendiri tidak boleh ikut mengurangi sisa
  const milikSendiri = (ps) => (transaksi && !kosong && transaksi.klasifikasi === 'PESANAN' && transaksi.pesananId === ps.id ? transaksi.nominal : 0);
  const sisaEfektif = (ps) => ps.sisa + milikSendiri(ps);
  const pesanan = pekerjaan?.pesanan.find((x) => x.id === Number(form.pesananId));
  const tahapSendiri = transaksi && !kosong && transaksi.pekerjaanId === pekerjaan?.id ? transaksi.tahap : null;
  const tahapTersedia = TAHAP.filter((t) => pekerjaan?.pencairan.find((x) => x.tahap === t.key)?.status !== 'DONE' || t.key === tahapSendiri);

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  const aria = (n) => ({ 'aria-invalid': !!errors[n], 'aria-describedby': errors[n] ? `${n}-err` : undefined });
  const galat = (n) => errors[n] && <span id={`${n}-err`} className="err">{errors[n]}</span>;

  function pilihProject(e) {
    const p = projects.find((x) => x.id === Number(e.target.value));
    // hanya satu pekerjaan: langsung terpilih
    setForm((f) => ({ ...f, projectId: e.target.value, pekerjaanId: p?.pekerjaan.length === 1 ? String(p.pekerjaan[0].id) : '', pesananId: '', tahap: '' }));
  }
  function pilihPekerjaan(e) {
    setForm((f) => ({ ...f, pekerjaanId: e.target.value, pesananId: '', tahap: '' }));
  }

  // hanya satu pesanan di pekerjaan ini: langsung terpilih
  useEffect(() => {
    if (!isPesanan || !pekerjaan || form.pesananId) return;
    const bisa = pekerjaan.pesanan.filter((x) => x.sisa + milikSendiri(x) >= 1);
    if (pekerjaan.pesanan.length === 1 && bisa.length === 1) setForm((f) => ({ ...f, pesananId: String(bisa[0].id) }));
  }, [isPesanan, pekerjaan?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const nominal = Number(form.nominal) || 0;
  const nomorBayar = pesanan ? nomorPembayaran(pesanan, { tanggal: form.tanggal, idSaatIni: transaksi && !kosong && transaksi.klasifikasi === 'PESANAN' ? transaksi.id : null }) : null;
  const sisaSetelah = pesanan ? sisaEfektif(pesanan) - nominal : null;

  function validasi() {
    const e = {};
    if (!form.tanggal) e.tanggal = 'Tanggal wajib diisi.';
    if (!form.keterangan.trim()) e.keterangan = 'Deskripsi transaksi wajib diisi.';
    if (!(nominal > 0)) e.nominal = 'Nominal harus lebih dari 0.';
    if (adaProject) {
      if (!form.projectId) e.projectId = 'Pilih nama project.';
      else if (!form.pekerjaanId) e.pekerjaanId = 'Pilih pekerjaan.';
    }
    if (isPesanan && pekerjaan) {
      if (!pesanan) e.pesananId = pekerjaan.pesanan.length ? 'Pilih pesanan yang dibayar.' : 'Pekerjaan ini belum memiliki pesanan. Tambahkan pesanan melalui Ubah project.';
      else if (nominal > sisaEfektif(pesanan) + 1) e.nominal = `Pembayaran melebihi sisa pesanan (${formatRupiah(sisaEfektif(pesanan))}).`;
    }
    if (kl === 'OPERASIONAL' && !form.subkategori.trim()) e.subkategori = 'Jenis operasional wajib diisi.';
    return e;
  }

  async function submit(ev) {
    ev.preventDefault();
    const e = validasi();
    setErrors(e);
    if (Object.keys(e).length) return;
    setBusy(true);
    setSubmitError('');
    const data = { ...form, arah };
    try {
      if (transaksi) await api.updateTransaksi(transaksi.id, data);
      else await api.createTransaksi(data);
      navigate('/transaksi', { state: { pesan: transaksi ? 'Perubahan transaksi disimpan.' : 'Transaksi baru disimpan.' } });
    } catch (err) {
      const rinci = err.errors?.length ? ' ' + err.errors.join(' ') : '';
      setSubmitError((err.message || 'Data belum dapat disimpan. Silakan coba kembali.') + rinci);
      setBusy(false);
    }
  }

  const judulDetail = { PROJECT: 'Detail project', PESANAN: 'Detail pesanan', OPERASIONAL: 'Detail operasional' }[kl];

  return (
    <form onSubmit={submit} noValidate className="space-y-6">
      <section className="card flex-row flex-wrap items-center justify-between gap-3 p-5 sm:px-8" aria-labelledby="judul-klas">
        <h2 id="judul-klas" className="text-lg font-bold">Klasifikasi</h2>
        <Segmen label="Klasifikasi" name="klasifikasi" value={kl} onChange={onChange}
          options={[{ value: 'PROJECT', label: 'Project' }, { value: 'PESANAN', label: 'Pesanan' }, { value: 'OPERASIONAL', label: 'Operasional' }]} />
      </section>

      <section className="card space-y-5 p-6 sm:p-8" aria-labelledby="judul-umum">
        <h2 id="judul-umum" className="text-lg font-bold">Data transaksi</h2>
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="field">
            <label className="label" htmlFor="rekening">Rekening</label>
            <select id="rekening" name="rekening" className="input" value={form.rekening} onChange={onChange}>
              {api.REKENING.map((a) => <option key={a.id} value={a.id}>{a.nama}</option>)}
            </select>
          </div>
          <div className="field">
            <label className="label" htmlFor="tanggal">Tanggal</label>
            <input id="tanggal" name="tanggal" type="date" className="input" value={form.tanggal} onChange={onChange} {...aria('tanggal')} />
            {galat('tanggal')}
          </div>

          <div className="field sm:col-span-2">
            <label className="label" htmlFor="keterangan">Deskripsi transaksi</label>
            <input id="keterangan" name="keterangan" className="input" value={form.keterangan} onChange={onChange} placeholder="Contoh: UM-1, Pembayaran APILL, atau Gaji Karyawan" autoFocus={!transaksi} {...aria('keterangan')} />
            {galat('keterangan')}
          </div>

          <div className="field">
            <span className="label">Arah dana</span>
            <Segmen label="Arah dana" name="arah" value={arah} onChange={onChange} disabled={isKas || isPesanan} options={[{ value: 'MASUK', label: 'Dana masuk' }, { value: 'KELUAR', label: 'Dana keluar' }]} />
            {isPesanan ? <span className="hint text-xs">Pembayaran pesanan hanya dapat berupa dana keluar.</span> : isKas && <span className="hint text-xs">Rekening kas hanya dapat digunakan untuk dana keluar.</span>}
          </div>
          <div className="field">
            <div className="flex items-center justify-between gap-2">
              <label className="label" htmlFor="nominal">Nominal (Rp)</label>
              {isPesanan && pesanan && sisaEfektif(pesanan) >= 1 && (
                <button type="button" className="btn btn-sm" onClick={() => setForm((f) => ({ ...f, nominal: String(sisaEfektif(pesanan)) }))}>Isi sisa</button>
              )}
            </div>
            <InputRupiah id="nominal" name="nominal" className="input font-num" placeholder="Contoh: 4.000.000" value={form.nominal} onChange={onChange} {...aria('nominal')} />
            {galat('nominal')}
          </div>

          {adaProject && (
            <>
              <div className="field">
                <label className="label" htmlFor="projectId">Nama project</label>
                <select id="projectId" name="projectId" className="input" value={form.projectId} onChange={pilihProject} {...aria('projectId')}>
                  <option value="">Pilih project…</option>
                  {projects.map((p) => <option key={p.id} value={p.id}>{p.nama}</option>)}
                </select>
                {galat('projectId')}
              </div>
              <div className="field">
                <label className="label" htmlFor="pekerjaanId">Pekerjaan</label>
                <select id="pekerjaanId" name="pekerjaanId" className="input" value={form.pekerjaanId} onChange={pilihPekerjaan} disabled={!project} {...aria('pekerjaanId')}>
                  <option value="">{project ? 'Pilih pekerjaan…' : 'Pilih project dulu'}</option>
                  {project?.pekerjaan.map((k) => <option key={k.id} value={k.id}>{k.nama}</option>)}
                </select>
                {galat('pekerjaanId')}
              </div>
              {pekerjaan && <InfoKontrak pekerjaan={pekerjaan} />}
            </>
          )}
        </div>
      </section>

      <section className="card space-y-5 p-6 sm:p-8" aria-labelledby="judul-detail">
        <h2 id="judul-detail" className="text-lg font-bold">{judulDetail}</h2>

        {kl === 'PROJECT' && (
          <div className="grid gap-5 sm:grid-cols-2">
            {!pekerjaan && <p className="hint sm:col-span-2">Pilih project dan pekerjaan pada bagian Data transaksi.</p>}
            {arah === 'MASUK' && pekerjaan && (
              <div className="field rounded-2xl border border-army-200 bg-army-50 p-4 sm:col-span-2">
                <label className="label" htmlFor="tahap">Tahap pencairan</label>
                <select id="tahap" name="tahap" className="input" value={form.tahap} onChange={onChange}>
                  <option value="">Bukan pencairan SP2D</option>
                  {tahapTersedia.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
                </select>
                <span className="hint text-xs">
                  SP2D {formatRupiah(pekerjaan.sp2d)} · Sisa <strong>{formatRupiah(pekerjaan.belumCair)}</strong>
                  {tahapTersedia.length === 0 && ' · Seluruh tahap pencairan sudah tercatat.'}
                  {tahapTersedia.length > 0 && tahapTersedia.length < TAHAP.length && ' · Tahap yang telah tercatat tidak ditampilkan.'}
                </span>
              </div>
            )}
            {arah === 'KELUAR' && pekerjaan && <p className="hint sm:col-span-2">Dana keluar pada klasifikasi Project dicatat sebagai biaya langsung. Pembayaran kepada AJK dicatat melalui klasifikasi Pesanan.</p>}
            <div className="field sm:col-span-2">
              <label className="label" htmlFor="noInvoice">No. invoice (opsional)</label>
              <input id="noInvoice" name="noInvoice" className="input" value={form.noInvoice} onChange={onChange} />
            </div>
          </div>
        )}

        {isPesanan && (
          <div className="space-y-5">
            {!pekerjaan && <p className="hint">Pilih project dan pekerjaan pada bagian Data transaksi.</p>}
            {pekerjaan && (
              <>
                <div>
                  <p className="label mb-2">Status pencairan dari instansi</p>
                  <ul className="flex flex-wrap gap-2">
                    {pekerjaan.pencairan.map((x) => (
                      <li key={x.tahap} className={`badge ${x.status === 'DONE' ? 'badge-ok' : 'badge-idle'}`}>
                        {x.label} {x.status === 'DONE' ? `✓ ${formatAngka(x.realisasi)}` : 'belum'}
                      </li>
                    ))}
                  </ul>
                </div>

                <div role="radiogroup" aria-label="Pesanan yang dibayar" aria-describedby={errors.pesananId ? 'pesananId-err' : undefined} className="grid gap-3">
                  <p className="label">Pesanan yang dibayar</p>
                  {pekerjaan.pesanan.length === 0 && (
                    <p className="rounded-2xl border border-dashed border-army-300 px-4 py-6 text-center text-sm text-army-600">
                      Pekerjaan ini belum memiliki pesanan.{' '}
                      <Link className="font-semibold text-army-800 underline" to={`/project/${project.id}/ubah`}>Tambahkan pesanan melalui Ubah project</Link>.
                    </p>
                  )}
                  {pekerjaan.pesanan.map((ps) => {
                    const sisa = sisaEfektif(ps);
                    const lunas = sisa < 1;
                    const terpilih = Number(form.pesananId) === ps.id;
                    const mati = lunas && !terpilih;
                    return (
                      <label key={ps.id}
                        className={`block rounded-2xl border p-4 transition focus-within:ring-2 focus-within:ring-army-400 ${mati ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'} ${terpilih ? 'border-army-700 bg-army-50 ring-2 ring-army-300' : 'border-army-200 bg-white hover:border-army-400'}`}>
                        <input type="radio" className="sr-only" name="pesananId" value={ps.id} checked={terpilih} disabled={mati} onChange={onChange} />
                        <span className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-bold">{labelPesanan(ps)}</span>
                          {lunas ? <span className="badge badge-ok">Lunas</span> : <span className="font-num text-sm font-semibold text-ember-600">Sisa {formatRupiah(sisa)}</span>}
                        </span>
                        <span className="mt-1 block text-xs text-army-600">
                          {ps.keterangan} · Total {formatRupiah(ps.total)} · Dibayar {formatRupiah(ps.dibayar - milikSendiri(ps))}
                        </span>
                      </label>
                    );
                  })}
                  {galat('pesananId')}
                </div>

                {pesanan && (
                  <div className="space-y-1 rounded-2xl border border-army-200 bg-army-50 px-4 py-3 text-sm" role="status">
                    <p>Transaksi ini akan dicatat sebagai <strong>Pembayaran {nomorBayar}</strong> untuk pesanan {labelPesanan(pesanan)}.</p>
                    <p className="text-army-600">
                      DPP {formatRupiah(pesanan.dpp)} · PPN {formatRupiah(pesanan.ppn)}
                      {nominal > 0 && (sisaSetelah >= 0
                        ? <> · Sisa setelah pembayaran ini <strong className="font-num text-army-800">{formatRupiah(sisaSetelah)}</strong>{sisaSetelah < 1 && ' (lunas)'}</>
                        : <> · <span className="font-semibold text-red-700">Melebihi sisa pesanan sebesar {formatRupiah(-sisaSetelah)}</span></>)}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {kl === 'OPERASIONAL' && (
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="field">
              <label className="label" htmlFor="kategori">Kategori (opsional)</label>
              <input id="kategori" name="kategori" list={listKategori} className="input" value={form.kategori} onChange={onChange} placeholder="Contoh: Iuran" />
              <datalist id={listKategori}>{kategoriOpsi.kategori.map((k) => <option key={k} value={k} />)}</datalist>
            </div>
            <div className="field">
              <label className="label" htmlFor="subkategori">Jenis operasional</label>
              <input id="subkategori" name="subkategori" list={listSub} className="input" value={form.subkategori} onChange={onChange} placeholder="Contoh: BPJS, PLN, Gaji Karyawan" {...aria('subkategori')} />
              <datalist id={listSub}>{kategoriOpsi.subkategori.map((s) => <option key={s} value={s} />)}</datalist>
              {galat('subkategori')}
            </div>
            <div className="field sm:col-span-2">
              <label className="label" htmlFor="noInvoice">No. invoice (opsional)</label>
              <input id="noInvoice" name="noInvoice" className="input" value={form.noInvoice} onChange={onChange} />
            </div>
          </div>
        )}
      </section>

      {submitError && <Notice tone="danger">{submitError}</Notice>}

      <div className="grid grid-cols-2 gap-3">
        <Link className="btn w-full" to="/transaksi">Batal</Link>
        <button type="submit" className="btn btn-primary w-full" disabled={busy}>{busy ? 'Menyimpan…' : 'Simpan transaksi'}</button>
      </div>
    </form>
  );
}

export default function TransaksiFormPage() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const [state, setState] = useState({ status: 'loading' });
  const [reset, setReset] = useState(0);

  useEffect(() => {
    let batal = false;
    Promise.all([listProject(), api.listKategori(), id ? api.getTransaksi(Number(id)) : null])
      .then(([projects, kategoriOpsi, transaksi]) => { if (!batal) setState({ status: 'ok', projects, kategoriOpsi, transaksi }); })
      .catch((err) => { if (!batal) setState({ status: 'error', pesan: err.status === 404 ? 'Transaksi tidak ditemukan atau telah dihapus.' : 'Data belum dapat dimuat. Periksa koneksi, lalu coba kembali.' }); });
    return () => { batal = true; };
  }, [id]);

  const awal = { klasifikasi: params.get('klasifikasi'), projectId: params.get('projectId'), pekerjaanId: params.get('pekerjaanId'), pesananId: params.get('pesananId'), tahap: params.get('tahap') };

  return (
    <>
      <PageHeader
        title={id ? 'Ubah transaksi' : 'Tambah transaksi'}
        hint="Isi data transaksi dengan lengkap dan benar."
        back={{ to: '/transaksi', label: 'Kembali ke Transaksi' }}
        onKosongkan={state.status === 'ok' ? () => setReset((n) => n + 1) : undefined}
      />
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        {state.status === 'loading' && <Loading>Memuat formulir…</Loading>}
        {state.status === 'error' && <Notice tone="danger">{state.pesan}</Notice>}
        {state.status === 'ok' && <Form key={`${id || 'baru'}-${reset}`} {...state} awal={awal} kosong={reset > 0} />}
      </div>
    </>
  );
}

import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import PageHeader from '../../components/ui/PageHeader';
import InputRupiah from '../../components/ui/InputRupiah';
import { Loading, Notice, Rincian } from '../../components/ui/kit';
import * as api from '../../api/project.api';
import { formatRupiah } from '../../utils/format';
import { PPN_PESANAN, dppPpn } from '../../utils/pesanan';
import { hitungSp2d } from '../../utils/sp2d';
import { PERSEN_PPH_AWAL, PPN_PERSEN, bacaPersen, persenKeTeks, persenPph } from '../../utils/pajak';

// 1 pekerjaan = 1 pesanan: pesanan selalu tampil di dalam card pekerjaan. `pesananLain` hanya menampung
// pesanan tambahan dari data lama (bila ada) agar tidak hilang diam-diam saat disimpan.
const PESANAN_KOSONG = () => ({ noInvoice: '', produk: '', keterangan: '', total: '' });
const PEKERJAAN_KOSONG = () => ({ nama: '', pesanan: PESANAN_KOSONG(), pesananLain: [] });
const pesananTerisi = (x) => !!x.id || [x.noInvoice, x.produk, x.keterangan, x.total].some((v) => String(v ?? '').trim() !== '');

function dariProject(k) {
  const [utama, ...lain] = k.pesanan ?? [];
  const olah = (x) => ({ ...x, total: String(x.total) });
  return { ...k, pesanan: utama ? olah(utama) : PESANAN_KOSONG(), pesananLain: lain.map(olah) };
}

function Form({ project, kosong }) {
  const navigate = useNavigate();
  const awal = project && !kosong ? project : null;
  const [nama, setNama] = useState(awal?.nama ?? '');
  const [kodeProject, setKodeProject] = useState(awal?.kodeProject ?? '');
  const [kontrakInaproc, setKontrakInaproc] = useState(awal?.kontrakInaproc ?? '');
  const [nomorKontrak, setNomorKontrak] = useState(awal?.nomorKontrak ?? '');
  const [tglKontrak, setTglKontrak] = useState(awal?.tglKontrak ?? '');
  const [nilaiKontrak, setNilaiKontrak] = useState(awal ? String(awal.nilaiKontrak) : '');
  const [persenPotongan, setPersenPotongan] = useState(awal ? persenKeTeks(persenPph(awal)) : PERSEN_PPH_AWAL);
  const [pekerjaan, setPekerjaan] = useState(() => (awal ? awal.pekerjaan.map(dariProject) : [PEKERJAAN_KOSONG()]));
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [busy, setBusy] = useState(false);

  const ubah = (i, name, v) => setPekerjaan((l) => l.map((k, j) => (j === i ? { ...k, [name]: v } : k)));
  const tambah = () => setPekerjaan((l) => [...l, PEKERJAAN_KOSONG()]);
  const hapus = (i) => setPekerjaan((l) => (l.length > 1 ? l.filter((_, j) => j !== i) : l));
  const ubahPesanan = (i, name, v) => setPekerjaan((l) => l.map((k, a) => (a === i ? { ...k, pesanan: { ...k.pesanan, [name]: v } } : k)));

  function validasi() {
    const e = {};
    if (!nama.trim()) e.nama = 'Nama project wajib diisi.';
    if (!kodeProject.trim()) e.kode = 'Kode project wajib diisi.';
    if (!kontrakInaproc.trim()) e.ep = 'Kontrak INAPROC wajib diisi.';
    if (nilaiKontrak === '' || Number(nilaiKontrak) < 0) e.nilai = 'Isi nilai kontrak, minimal 0.';
    const persen = bacaPersen(persenPotongan);
    if (Number.isNaN(persen) || persen < 0 || persen > 100) e.pajak = 'Persen pajak harus berupa angka 0 sampai 100, contoh 1,75.';
    pekerjaan.forEach((k, i) => {
      if (!k.nama.trim()) e[`nama-${i}`] = 'Nama pekerjaan wajib diisi.';
      const x = k.pesanan;
      if (pesananTerisi(x)) { // pesanan boleh dikosongkan seluruhnya bila belum ada; bila diisi, harus lengkap
        if (!x.keterangan.trim()) e[`psket-${i}`] = 'Keterangan pesanan wajib diisi.';
        if (!(Number(x.total) > 0)) e[`pstotal-${i}`] = 'Total pesanan harus lebih dari 0.';
        else if (x.dibayar > 0 && Number(x.total) < x.dibayar - 1) e[`pstotal-${i}`] = `Total tidak boleh lebih kecil dari yang sudah dibayar (${formatRupiah(x.dibayar)}).`;
      }
    });
    return e;
  }

  async function submit(ev) {
    ev.preventDefault();
    const e = validasi();
    setErrors(e);
    if (Object.keys(e).length) return;
    setBusy(true);
    setSubmitError('');
    const data = {
      nama: nama.trim(), kodeProject: kodeProject.trim(), kontrakInaproc: kontrakInaproc.trim(), nomorKontrak: nomorKontrak.trim(),
      tglKontrak, nilaiKontrak, persenPotongan,
      pekerjaan: pekerjaan.map(({ pesanan, pesananLain, ...k }) => ({ ...k, pesanan: [...(pesananTerisi(pesanan) ? [pesanan] : []), ...pesananLain] })),
    };
    try {
      if (project) await api.updateProject(project.id, data);
      else await api.createProject(data);
      navigate('/project', { state: { pesan: project ? 'Perubahan project disimpan.' : 'Project baru disimpan.' } });
    } catch (err) {
      const rinci = err.errors?.length ? ' ' + err.errors.join(' ') : '';
      setSubmitError((err.message || 'Data belum dapat disimpan. Silakan coba kembali.') + rinci);
      setBusy(false);
    }
  }

  const galat = (n) => errors[n] && <span id={`${n}-err`} className="err">{errors[n]}</span>;
  const aria = (n) => ({ 'aria-invalid': !!errors[n], 'aria-describedby': errors[n] ? `${n}-err` : undefined });

  return (
    <form onSubmit={submit} noValidate className="space-y-6">
      <section className="card space-y-5 p-6 sm:p-8" aria-labelledby="judul-project">
        <h2 id="judul-project" className="text-lg font-bold">Project</h2>
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="field sm:col-span-2">
            <label className="label" htmlFor="nama">Nama project</label>
            <input id="nama" className="input" value={nama} onChange={(e) => setNama(e.target.value)} autoFocus={!project} placeholder="Contoh: PROJECT BPTD III SULBAR" {...aria('nama')} />
            {galat('nama')}
          </div>
          <div className="field sm:col-span-2">
            <label className="label" htmlFor="kode">Kode project</label>
            <input id="kode" className="input" value={kodeProject} onChange={(e) => setKodeProject(e.target.value)} autoComplete="off" {...aria('kode')} />
            {galat('kode')}
          </div>
          <div className="field">
            <label className="label" htmlFor="ep">Kontrak INAPROC (EP-…)</label>
            <input id="ep" className="input" value={kontrakInaproc} onChange={(e) => setKontrakInaproc(e.target.value)} autoComplete="off" {...aria('ep')} />
            {galat('ep')}
          </div>
          <div className="field">
            <label className="label" htmlFor="no">Nomor kontrak</label>
            <input id="no" className="input" value={nomorKontrak} onChange={(e) => setNomorKontrak(e.target.value)} autoComplete="off" />
          </div>
          <div className="field">
            <label className="label" htmlFor="tgl">Tanggal kontrak</label>
            <input id="tgl" type="date" className="input" value={tglKontrak} onChange={(e) => setTglKontrak(e.target.value)} />
          </div>
          <div className="field">
            <label className="label" htmlFor="nilai">Nilai kontrak (Rp)</label>
            <InputRupiah id="nilai" className="input font-num" placeholder="Contoh: 750.000.000" value={nilaiKontrak} onChange={(e) => setNilaiKontrak(e.target.value)} {...aria('nilai')} />
            {galat('nilai')}
          </div>
          <div className="field">
            <label className="label" htmlFor="pajak">Tarif PPh (%)</label>
            <input id="pajak" inputMode="decimal" autoComplete="off" className="input font-num" value={persenPotongan} onChange={(e) => setPersenPotongan(e.target.value)} placeholder="Contoh: 1,75" {...aria('pajak')} />
            {galat('pajak')}
          </div>
          <div className="field">
            <span className="label">SP2D</span>
            <p className="input flex items-center bg-army-50 font-num font-semibold text-army-800" aria-live="polite">{formatRupiah(hitungSp2d(nilaiKontrak, PPN_PERSEN, persenPph({ persenPotongan })))}</p>
          </div>
        </div>
      </section>

      {pekerjaan.map((k, i) => (
        <fieldset key={k.id ?? `baru-${i}`} className="card space-y-5 p-6 sm:p-8">
          <legend className="sr-only">Pekerjaan {i + 1}</legend>
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold">Pekerjaan {i + 1}</h2>
            {pekerjaan.length > 1 && (
              <button type="button" className="btn btn-sm btn-danger" onClick={() => hapus(i)} aria-label={`Hapus pekerjaan ${i + 1}`}>Hapus</button>
            )}
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="field sm:col-span-2">
              <label className="label" htmlFor={`nama-${i}`}>Nama pekerjaan</label>
              <input id={`nama-${i}`} className="input" value={k.nama} onChange={(e) => ubah(i, 'nama', e.target.value)} {...aria(`nama-${i}`)} />
              {galat(`nama-${i}`)}
            </div>
          </div>

          <div className="space-y-4 border-t border-army-100 pt-5">
            <div>
              <h3 className="font-bold">Pesanan ke AJK</h3>
              <p className="hint text-xs">Total pesanan sudah termasuk PPN.</p>
            </div>
            {(() => {
              const x = k.pesanan;
              const { dpp, ppn } = dppPpn(x.total);
              return (
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="field">
                      <label className="label" htmlFor={`psinv-${i}`}>No. invoice</label>
                      <input id={`psinv-${i}`} className="input" value={x.noInvoice} onChange={(e) => ubahPesanan(i, 'noInvoice', e.target.value)} placeholder="Contoh: 10345" />
                    </div>
                    <div className="field">
                      <label className="label" htmlFor={`psprod-${i}`}>Produk</label>
                      <input id={`psprod-${i}`} className="input" value={x.produk} onChange={(e) => ubahPesanan(i, 'produk', e.target.value)} placeholder="Contoh: APILL V5" />
                    </div>
                    <div className="field sm:col-span-2">
                      <label className="label" htmlFor={`psket-${i}`}>Keterangan</label>
                      <input id={`psket-${i}`} className="input" value={x.keterangan} onChange={(e) => ubahPesanan(i, 'keterangan', e.target.value)} placeholder="Contoh: APILL V5 (I) Rembang" {...aria(`psket-${i}`)} />
                      {galat(`psket-${i}`)}
                    </div>
                    <div className="field sm:col-span-2">
                      <label className="label" htmlFor={`pstotal-${i}`}>Total termasuk PPN (Rp)</label>
                      <InputRupiah id={`pstotal-${i}`} className="input font-num" placeholder="Contoh: 266.168.676" value={x.total} onChange={(e) => ubahPesanan(i, 'total', e.target.value)} {...aria(`pstotal-${i}`)} />
                      {galat(`pstotal-${i}`)}
                    </div>
                  </div>
                  <Rincian
                    kolom={2}
                    baris={[
                      { label: 'DPP', nilai: formatRupiah(dpp) },
                      { label: `PPN ${PPN_PESANAN}%`, nilai: formatRupiah(ppn) },
                      ...(x.dibayar > 0 ? [{ label: 'Sudah dibayar', nilai: formatRupiah(x.dibayar), nada: 'masuk' }] : []),
                    ]}
                  />
                  {k.pesananLain.length > 0 && <p className="hint text-xs">Terdapat {k.pesananLain.length} pesanan lain pada pekerjaan ini yang tidak ditampilkan dan tetap tersimpan.</p>}
                </>
              );
            })()}
          </div>
        </fieldset>
      ))}

      <button type="button" className="btn w-full border-dashed" onClick={tambah}>Tambah pekerjaan</button>

      {submitError && <Notice tone="danger">{submitError}</Notice>}

      <div className="grid grid-cols-2 gap-3">
        <Link className="btn w-full" to="/project">Batal</Link>
        <button type="submit" className="btn btn-primary w-full" disabled={busy}>{busy ? 'Menyimpan…' : 'Simpan project'}</button>
      </div>
    </form>
  );
}

export default function ProjectFormPage() {
  const { id } = useParams();
  const [state, setState] = useState(id ? { status: 'loading' } : { status: 'ok', project: null });
  const [reset, setReset] = useState(0);

  useEffect(() => {
    if (!id) return undefined;
    let batal = false;
    api.getProject(Number(id))
      .then((project) => { if (!batal) setState({ status: 'ok', project }); })
      .catch((err) => { if (!batal) setState({ status: 'error', pesan: err.status === 404 ? 'Project tidak ditemukan atau telah dihapus.' : 'Data belum dapat dimuat. Periksa koneksi, lalu coba kembali.' }); });
    return () => { batal = true; };
  }, [id]);

  return (
    <>
      <PageHeader
        title={id ? 'Ubah project' : 'Tambah project'}
        hint="Data kontrak project, pekerjaan, dan pesanan ke AJK."
        back={{ to: '/project', label: 'Kembali ke Project' }}
        onKosongkan={state.status === 'ok' ? () => setReset((n) => n + 1) : undefined}
      />
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        {state.status === 'loading' && <Loading>Memuat formulir…</Loading>}
        {state.status === 'error' && <Notice tone="danger">{state.pesan}</Notice>}
        {state.status === 'ok' && <Form key={`${id || 'baru'}-${reset}`} project={state.project} kosong={reset > 0} />}
      </div>
    </>
  );
}

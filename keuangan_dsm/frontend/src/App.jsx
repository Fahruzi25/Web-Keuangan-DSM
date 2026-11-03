import { BrowserRouter, Link, Navigate, Route, Routes, useLocation, useParams } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';
import AppLayout from './components/layout/AppLayout';
import PageHeader from './components/ui/PageHeader';
import LoginPage from './features/auth/LoginPage';
import DashboardPage from './features/dashboard/DashboardPage';
import TransaksiPage from './features/transaksi/TransaksiPage';
import TransaksiFormPage from './features/transaksi/TransaksiFormPage';
import ProjectPage from './features/project/ProjectPage';
import ProjectFormPage from './features/project/ProjectFormPage';
import ProjectDetailPage from './features/project/ProjectDetailPage';
import OperasionalPage from './features/operasional/OperasionalPage';

function TidakDitemukan() {
  return (
    <>
      <PageHeader title="Halaman tidak ditemukan" hint="Halaman yang diminta tidak tersedia." />
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <Link className="btn btn-primary" to="/">Ke Home</Link>
      </div>
    </>
  );
}

/** Alamat lama tetap berfungsi, tetapi diarahkan ke alamat baru (query string ikut dibawa). */
function Alihkan({ ke }) {
  const { search } = useLocation();
  const params = useParams();
  const tujuan = Object.entries(params).reduce((u, [k, v]) => u.replace(`:${k}`, v), ke);
  return <Navigate to={`${tujuan}${search}`} replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route index element={<DashboardPage />} />
              <Route path="transaksi" element={<TransaksiPage />} />
              <Route path="transaksi/tambah" element={<TransaksiFormPage />} />
              <Route path="transaksi/:id/ubah" element={<TransaksiFormPage />} />
              <Route path="project" element={<ProjectPage />} />
              <Route path="project/tambah" element={<ProjectFormPage />} />
              <Route path="project/:id" element={<ProjectDetailPage />} />
              <Route path="project/:id/ubah" element={<ProjectFormPage />} />
              <Route path="operasional" element={<OperasionalPage />} />

              {/* alamat lama */}
              <Route path="dashboard" element={<Alihkan ke="/" />} />
              <Route path="rekening" element={<Alihkan ke="/transaksi" />} />
              <Route path="rekening/tambah" element={<Alihkan ke="/transaksi/tambah" />} />
              <Route path="rekening/:id/ubah" element={<Alihkan ke="/transaksi/:id/ubah" />} />
              <Route path="giro" element={<Alihkan ke="/transaksi" />} />
              <Route path="giro/tambah" element={<Alihkan ke="/transaksi/tambah" />} />
              <Route path="giro/:id/ubah" element={<Alihkan ke="/transaksi/:id/ubah" />} />
              <Route path="rekap" element={<Alihkan ke="/project" />} />
              <Route path="rekap/project/:id" element={<Alihkan ke="/project/:id" />} />
              <Route path="rekap/operasional/*" element={<Alihkan ke="/operasional" />} />
              <Route path="rekap-project" element={<Alihkan ke="/project" />} />
              <Route path="rekap-operasional" element={<Alihkan ke="/operasional" />} />
              <Route path="*" element={<TidakDitemukan />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

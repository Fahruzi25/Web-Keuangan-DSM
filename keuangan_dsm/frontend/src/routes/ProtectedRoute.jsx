import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-army-950">
        <p role="status" className="text-sm text-army-200">Memeriksa sesi…</p>
      </div>
    );
  }
  return user ? <Outlet /> : <Navigate to="/login" replace state={{ from: location }} />;
}

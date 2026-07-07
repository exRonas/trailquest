import { Navigate, Route, Routes, Link } from 'react-router-dom';
import { useAuth } from './auth/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { RoutesListPage } from './pages/RoutesListPage';
import { RouteEditorPage } from './pages/RouteEditorPage';

function TopBar() {
  const { user, logout } = useAuth();
  return (
    <div className="topbar">
      <div>
        <div className="brand">TRAILQUEST</div>
        <h1>
          <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
            Admin · Routes
          </Link>
        </h1>
      </div>
      {user ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span className="muted">{user.email}</span>
          <button className="ghost" onClick={logout}>
            Sign out
          </button>
        </div>
      ) : null}
    </div>
  );
}

function Protected({ children }: { children: JSX.Element }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="spinner">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'ADMIN')
    return <div className="container">This account is not an admin.</div>;
  return children;
}

export function App() {
  const { user } = useAuth();
  return (
    <>
      <TopBar />
      <Routes>
        <Route
          path="/login"
          element={user ? <Navigate to="/" replace /> : <LoginPage />}
        />
        <Route
          path="/"
          element={
            <Protected>
              <RoutesListPage />
            </Protected>
          }
        />
        <Route
          path="/routes/new"
          element={
            <Protected>
              <RouteEditorPage />
            </Protected>
          }
        />
        <Route
          path="/routes/:id"
          element={
            <Protected>
              <RouteEditorPage />
            </Protected>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

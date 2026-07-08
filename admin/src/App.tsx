import { Navigate, Route, Routes, Link, useLocation } from 'react-router-dom';
import { useAuth } from './auth/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { RoutesListPage } from './pages/RoutesListPage';
import { RouteEditorPage } from './pages/RouteEditorPage';
import { ForumPage } from './pages/ForumPage';
import { ReviewsPage } from './pages/ReviewsPage';

function TopBar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  return (
    <div className="topbar">
      <div>
        <div className="brand">TRAILQUEST</div>
        <h1>
          <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
            Admin
          </Link>
        </h1>
      </div>
      {user ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <nav style={{ display: 'flex', gap: 12 }}>
            <Link
              to="/"
              style={{ fontWeight: location.pathname === '/' ? 700 : 400 }}
            >
              Routes
            </Link>
            <Link
              to="/forum"
              style={{ fontWeight: location.pathname === '/forum' ? 700 : 400 }}
            >
              Forum
            </Link>
            <Link
              to="/reviews"
              style={{ fontWeight: location.pathname === '/reviews' ? 700 : 400 }}
            >
              Reviews
            </Link>
          </nav>
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
        <Route
          path="/forum"
          element={
            <Protected>
              <ForumPage />
            </Protected>
          }
        />
        <Route
          path="/reviews"
          element={
            <Protected>
              <ReviewsPage />
            </Protected>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

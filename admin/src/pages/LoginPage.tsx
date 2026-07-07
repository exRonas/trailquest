import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { apiErrorMessage } from '../api/client';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@trailquest.app');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await login(email.trim(), password);
      navigate('/');
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not sign in.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="login-wrap">
      <div className="card">
        <h2>Admin sign in</h2>
        <form onSubmit={onSubmit}>
          <div className="field">
            <label>Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              autoComplete="username"
            />
          </div>
          <div className="field">
            <label>Password</label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              autoComplete="current-password"
            />
          </div>
          {error ? <div className="error">{error}</div> : null}
          <button type="submit" disabled={busy} style={{ width: '100%' }}>
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}

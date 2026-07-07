import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { fetchRoutes, deleteRoute } from '../api/routes';
import { apiErrorMessage } from '../api/client';
import { pickLocalizedText } from '../types';

export function RoutesListPage() {
  const qc = useQueryClient();
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['routes'],
    queryFn: fetchRoutes,
  });

  const del = useMutation({
    mutationFn: (id: string) => deleteRoute(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['routes'] }),
  });

  const onDelete = (id: string, title: string) => {
    if (window.confirm(`Delete "${title}"? This cannot be undone.`)) {
      del.mutate(id);
    }
  };

  return (
    <div className="container">
      <div className="toolbar" style={{ justifyContent: 'space-between' }}>
        <h2 style={{ margin: 0 }}>Routes</h2>
        <Link to="/routes/new">
          <button>+ New route</button>
        </Link>
      </div>

      {isLoading ? <div className="spinner">Loading routes…</div> : null}
      {isError ? <div className="error">{apiErrorMessage(error)}</div> : null}
      {del.isError ? <div className="error">{apiErrorMessage(del.error)}</div> : null}

      {(data ?? []).map((r) => (
        <div className="route-row" key={r.id}>
          <div>
            <div style={{ fontWeight: 700 }}>{pickLocalizedText(r.title)}</div>
            <div className="muted">
              <span className="pill">{r.category}</span>
              <span className="pill">{r.difficulty}</span>
              {pickLocalizedText(r.country)} · {pickLocalizedText(r.region)} ·{' '}
              {r._count.checkpoints} checkpoints
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Link to={`/routes/${r.id}`}>
              <button className="secondary">Edit</button>
            </Link>
            <button
              className="danger"
              onClick={() => onDelete(r.id, pickLocalizedText(r.title))}
            >
              Delete
            </button>
          </div>
        </div>
      ))}

      {data && data.length === 0 ? (
        <div className="muted">No routes yet. Create your first one.</div>
      ) : null}
    </div>
  );
}

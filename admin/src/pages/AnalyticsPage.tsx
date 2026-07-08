import { useQuery } from '@tanstack/react-query';
import { fetchAnalytics } from '../api/analytics';
import { apiErrorMessage } from '../api/client';
import { pickLocalizedText } from '../types';

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div
      style={{
        flex: '1 1 140px',
        background: 'var(--surface, #fff)',
        border: '1px solid #e2e6e0',
        borderRadius: 12,
        padding: '16px 18px',
      }}
    >
      <div style={{ fontSize: 28, fontWeight: 700 }}>{value}</div>
      <div className="muted" style={{ marginTop: 4 }}>{label}</div>
    </div>
  );
}

export function AnalyticsPage() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: fetchAnalytics,
  });

  return (
    <div className="container">
      <div className="toolbar" style={{ justifyContent: 'space-between' }}>
        <h2 style={{ margin: 0 }}>Analytics</h2>
      </div>

      {isLoading ? <div className="spinner">Loading analytics…</div> : null}
      {isError ? <div className="error">{apiErrorMessage(error)}</div> : null}

      {data ? (
        <>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            <StatCard label="Users" value={data.totals.users} />
            <StatCard label="Routes" value={data.totals.routes} />
            <StatCard label="Completed hikes" value={data.totals.completedSessions} />
            <StatCard label="Reviews" value={data.totals.reviews} />
            <StatCard label="Forum posts" value={data.totals.posts} />
            <StatCard label="Friendships" value={data.totals.friendships} />
          </div>

          <h3 style={{ marginTop: 28 }}>Last 30 days</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            <StatCard label="New users" value={data.activity.newUsers30d} />
            <StatCard label="Active users" value={data.activity.activeUsers30d} />
          </div>

          <h3 style={{ marginTop: 28 }}>Most completed routes</h3>
          {data.popularRoutes.length === 0 ? (
            <div className="muted">No completed routes yet.</div>
          ) : (
            data.popularRoutes.map((r, i) => (
              <div key={r.routeId} className="route-row">
                <div>
                  <span style={{ fontWeight: 700, marginRight: 8 }}>{i + 1}.</span>
                  {pickLocalizedText(r.title)}
                </div>
                <div className="muted">{r.value} completed</div>
              </div>
            ))
          )}

          <h3 style={{ marginTop: 28 }}>Top rated routes</h3>
          {data.topRatedRoutes.length === 0 ? (
            <div className="muted">No reviews yet.</div>
          ) : (
            data.topRatedRoutes.map((r, i) => (
              <div key={r.routeId} className="route-row">
                <div>
                  <span style={{ fontWeight: 700, marginRight: 8 }}>{i + 1}.</span>
                  {pickLocalizedText(r.title)}
                </div>
                <div className="muted">
                  ★ {r.value.toFixed(1)} ({r.count})
                </div>
              </div>
            ))
          )}
        </>
      ) : null}
    </div>
  );
}

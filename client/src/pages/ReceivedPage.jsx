import { useApi } from '../hooks/useApi.js';
import { apiFetch } from '../api/client.js';
import { StatusBadge } from '../components/StatusBadge.jsx';

// Supplier only: requests on my listings, accept or decline them
export function ReceivedPage() {
  const { data: requests, loading, error, reload } = useApi('/api/requests/received');

  async function answer(id, status) {
    await apiFetch(`/api/requests/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) });
    reload();
  }

  return (
    <>
      <h1>Requests received</h1>
      {loading && !requests && <p>Loading…</p>}
      {error && <p className="error" role="alert">{error.message}</p>}
      {requests && requests.length === 0 && <p className="muted">No requests yet.</p>}
      {requests && requests.map((r) => (
        <article key={r._id} className="card">
          <h2>{r.listingId?.title}</h2>
          <p>
            From <strong>{r.seekerId?.name}</strong>
            {r.seekerId?.email && <>, <a href={`mailto:${r.seekerId.email}`}>{r.seekerId.email}</a></>}
          </p>
          <p><StatusBadge status={r.status} /> <span className="muted">{new Date(r.createdAt).toLocaleDateString()}</span></p>
          {r.message && <p>“{r.message}”</p>}
          {r.status === 'pending' && (
            <div className="row">
              <button onClick={() => answer(r._id, 'accepted')}>Accept</button>
              <button className="danger" onClick={() => answer(r._id, 'declined')}>Decline</button>
            </div>
          )}
        </article>
      ))}
    </>
  );
}

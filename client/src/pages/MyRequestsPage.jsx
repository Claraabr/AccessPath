import { useApi } from '../hooks/useApi.js';
import { apiFetch } from '../api/client.js';
import { StatusBadge } from '../components/StatusBadge.jsx';

// User or venue: the requests I sent and their status
export function MyRequestsPage({ go }) {
  const { data: requests, loading, error, reload } = useApi('/api/requests/sent');

  async function cancel(id) {
    if (!window.confirm('Cancel this request?')) return;
    await apiFetch(`/api/requests/${id}`, { method: 'DELETE' });
    reload();
  }

  return (
    <>
      <h1>My requests</h1>
      {loading && !requests && <p>Loading…</p>}
      {error && <p className="error" role="alert">{error.message}</p>}
      {requests && requests.length === 0 && <p className="muted">You have not sent any request yet.</p>}
      {requests && requests.map((r) => (
        <article key={r._id} className="card">
          <h2>{r.listingId?.title ?? 'Deleted listing'}</h2>
          <p><StatusBadge status={r.status} /> <span className="muted">sent {new Date(r.createdAt).toLocaleDateString()}</span></p>
          {r.message && <p>“{r.message}”</p>}
          {r.status === 'accepted' && <p>Accepted! Contact the supplier from the listing page to arrange it.</p>}
          <div className="row">
            {r.listingId && <button className="secondary" onClick={() => go('listing', r.listingId._id)}>See listing</button>}
            {r.status === 'pending' && <button className="danger" onClick={() => cancel(r._id)}>Cancel request</button>}
          </div>
        </article>
      ))}
    </>
  );
}

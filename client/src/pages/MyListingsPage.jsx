import { useState } from 'react';
import { useApi } from '../hooks/useApi.js';
import { apiFetch } from '../api/client.js';
import { ListingForm } from '../components/ListingForm.jsx';
import { Price } from '../components/Price.jsx';

// Supplier only: post, edit and delete equipment listings
export function MyListingsPage() {
  const { data: listings, loading, error, reload } = useApi('/api/listings/mine');
  const [editingId, setEditingId] = useState(null);

  async function createListing(data) {
    await apiFetch('/api/listings', { method: 'POST', body: JSON.stringify(data) });
    reload();
  }

  async function updateListing(id, data) {
    await apiFetch(`/api/listings/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
    setEditingId(null);
    reload();
  }

  async function deleteListing(id) {
    if (!window.confirm('Delete this listing and its requests?')) return;
    await apiFetch(`/api/listings/${id}`, { method: 'DELETE' });
    reload();
  }

  return (
    <>
      <h1>My listings</h1>
      <section className="card">
        <h2>Post equipment</h2>
        <ListingForm submitLabel="Post listing" onSubmit={createListing} />
      </section>

      {loading && !listings && <p>Loading…</p>}
      {error && <p className="error" role="alert">{error.message}</p>}
      {listings && listings.length === 0 && <p className="muted">You have no listings yet.</p>}
      {listings && listings.map((l) => (
        <article key={l._id} className="card">
          {editingId === l._id ? (
            <ListingForm
              initial={l}
              submitLabel="Save changes"
              onSubmit={(data) => updateListing(l._id, data)}
              onCancel={() => setEditingId(null)}
            />
          ) : (
            <>
              <h2>{l.title}</h2>
              <p className="muted">{l.type} · {l.mode === 'rent' ? 'For rent' : 'For sale'} · {l.area}</p>
              <p><Price listing={l} /></p>
              <div className="row">
                <button className="secondary" onClick={() => setEditingId(l._id)}>Edit</button>
                <button className="danger" onClick={() => deleteListing(l._id)}>Delete</button>
              </div>
            </>
          )}
        </article>
      ))}
    </>
  );
}

import { useState } from 'react';
import { useApi } from '../hooks/useApi.js';
import { apiFetch } from '../api/client.js';
import { PlaceForm } from '../components/PlaceForm.jsx';
import { PlacePage } from './PlacePage.jsx';

// Venue only. One venue account = one place, like a business on Google Maps:
// - no place yet -> set it up
// - then the venue sees its page as visitors see it, with an Edit button
export function MyPlacePage({ go }) {
  const { data: place, loading, error, reload } = useApi('/api/places/mine');
  const [editing, setEditing] = useState(false);
  const [actionError, setActionError] = useState('');
  // Changes after each save so the page below loads the new version
  const [version, setVersion] = useState(0);

  async function createPlace(data) {
    await apiFetch('/api/places', { method: 'POST', body: JSON.stringify(data) });
    reload();
  }

  async function updatePlace(data) {
    // Same address -> don't send it, so the server doesn't geocode again
    if (data.address === place.address) delete data.address;
    await apiFetch(`/api/places/${place._id}`, { method: 'PATCH', body: JSON.stringify(data) });
    setEditing(false);
    setVersion(version + 1);
    reload();
  }

  async function deletePlace() {
    if (!window.confirm('Delete your place and all its reviews?')) return;
    setActionError('');
    try {
      await apiFetch(`/api/places/${place._id}`, { method: 'DELETE' });
      setEditing(false);
      reload();
    } catch (err) {
      setActionError(err.message);
    }
  }

  if (loading && !place) return <p>Loading…</p>;
  if (error) return <p className="error" role="alert">{error.message}</p>;

  if (!place) {
    return (
      <>
        <h1>Set up your place</h1>
        <p className="muted">
          Tell people what your place offers. Visitors will see this page and can leave reviews.
        </p>
        <section className="card">
          <PlaceForm submitLabel="Create my place" onSubmit={createPlace} />
        </section>
      </>
    );
  }

  if (editing) {
    return (
      <>
        <h1>Edit my place</h1>
        <section className="card">
          <PlaceForm
            initial={place}
            submitLabel="Save changes"
            onSubmit={updatePlace}
            onCancel={() => setEditing(false)}
          />
        </section>
        <section className="card">
          <h2>Delete my place</h2>
          <p className="muted">This also deletes all the reviews it received.</p>
          {actionError && <p className="error" role="alert">{actionError}</p>}
          <button className="danger" onClick={deletePlace}>Delete my place</button>
        </section>
      </>
    );
  }

  return (
    <PlacePage
      key={`${place._id}-${version}`}
      id={place._id}
      go={go}
      ownerActions={<button className="secondary" onClick={() => setEditing(true)}>Edit</button>}
    />
  );
}

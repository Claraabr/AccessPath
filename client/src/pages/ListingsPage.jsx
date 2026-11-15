import { useState } from 'react';
import { useApi } from '../hooks/useApi.js';
import { EQUIPMENT_TYPES } from '../constants.js';
import { Price } from '../components/Price.jsx';

export function ListingsPage({ go }) {
  const [query, setQuery] = useState('');
  const { data: listings, loading, error } = useApi(`/api/listings${query}`);

  function handleSearch(e) {
    e.preventDefault();
    const form = new FormData(e.target);
    const params = new URLSearchParams();
    for (const key of ['type', 'mode', 'area']) {
      if (form.get(key)) params.set(key, form.get(key));
    }
    const qs = params.toString();
    setQuery(qs ? `?${qs}` : '');
  }

  return (
    <>
      <h1>AccessFix: find equipment</h1>
      <p className="muted">Rent or buy a ramp, a wheelchair or other equipment from suppliers near you.</p>
      <form onSubmit={handleSearch} className="card">
        <div className="row">
          <label style={{ flex: 1 }}>
            Type
            <select name="type" defaultValue="">
              <option value="">All</option>
              {EQUIPMENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </label>
          <label style={{ flex: 1 }}>
            Rent or sale
            <select name="mode" defaultValue="">
              <option value="">Both</option>
              <option value="rent">Rent</option>
              <option value="sale">Sale</option>
            </select>
          </label>
          <label style={{ flex: 1 }}>
            Area
            <input name="area" placeholder="e.g. Beirut" />
          </label>
        </div>
        <button>Search</button>
      </form>

      {loading && !listings && <p>Loading…</p>}
      {error && <p className="error" role="alert">{error.message}</p>}
      {listings && (
        <>
          <p className="muted">{listings.length} listing(s) found</p>
          <div className="grid">
            {listings.map((l) => (
              <article key={l._id} className="card">
                {l.photoUrl && <img src={l.photoUrl} alt={l.title} className="listing-photo" />}
                <h2>{l.title}</h2>
                <p className="muted">{l.type} · {l.mode === 'rent' ? 'For rent' : 'For sale'} · {l.area}</p>
                <p><Price listing={l} /></p>
                <button onClick={() => go('listing', l._id)}>See details</button>
              </article>
            ))}
          </div>
        </>
      )}
    </>
  );
}

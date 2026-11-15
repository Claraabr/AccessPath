import { useState } from 'react';
import { useApi } from '../hooks/useApi.js';
import { PLACE_CATEGORIES, CRITERIA } from '../constants.js';
import { PlacesMap } from '../components/PlacesMap.jsx';
import { CriteriaBadges } from '../components/CriteriaBadges.jsx';

export function PlacesPage({ go }) {
  // The filters live in the URL query, e.g. "?search=cafe&criteria=stepFree"
  const [query, setQuery] = useState('');
  const { data: places, loading, error } = useApi(`/api/places${query}`);

  function handleSearch(e) {
    e.preventDefault();
    const form = new FormData(e.target);
    const params = new URLSearchParams();
    if (form.get('search')) params.set('search', form.get('search'));
    if (form.get('category')) params.set('category', form.get('category'));
    const criteria = form.getAll('criteria');
    if (criteria.length > 0) params.set('criteria', criteria.join(','));
    const qs = params.toString();
    setQuery(qs ? `?${qs}` : ''); // new path -> useApi loads again
  }

  return (
    <>
      <h1>Find an accessible place</h1>
      <form onSubmit={handleSearch} className="card">
        <div className="row">
          <label style={{ flex: 2 }}>
            Name
            <input name="search" placeholder="e.g. cafe" />
          </label>
          <label style={{ flex: 1 }}>
            Category
            <select name="category" defaultValue="">
              <option value="">All</option>
              {PLACE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
        </div>
        <fieldset>
          <legend>Must have</legend>
          <div className="row">
            {Object.entries(CRITERIA).map(([key, label]) => (
              <label key={key} className="check">
                <input type="checkbox" name="criteria" value={key} />
                {label}
              </label>
            ))}
          </div>
        </fieldset>
        <button>Search</button>
      </form>

      {loading && !places && <p>Loading…</p>}
      {error && <p className="error" role="alert">{error.message}</p>}
      {places && (
        <>
          <PlacesMap places={places} onOpen={(id) => go('place', id)} />
          <p className="muted">{places.length} place(s) found</p>
          <div className="grid">
            {places.map((p) => (
              <article key={p._id} className="card">
                {/* Cover photo = the first photo of the place */}
                {p.photos?.length > 0 && <img src={p.photos[0]} alt={p.name} className="place-cover" />}
                <h2>{p.name}</h2>
                <p className="muted">{p.category} · {p.address}</p>
                <CriteriaBadges place={p} />
                <button onClick={() => go('place', p._id)}>See details and reviews</button>
              </article>
            ))}
          </div>
        </>
      )}
    </>
  );
}

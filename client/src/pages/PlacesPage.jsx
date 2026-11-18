import { useState } from 'react';
import { useApi } from '../hooks/useApi.js';
import { PLACE_CATEGORIES, CRITERIA } from '../constants.js';
import { PlacesMap } from '../components/PlacesMap.jsx';
import { CriteriaBadges, AccessIcon } from '../components/CriteriaBadges.jsx';
import { sizedPhoto } from '../api/upload.js';

export function PlacesPage({ go }) {
  // The filters live in the URL query, e.g. "?search=cafe&criteria=stepFree"
  const [query, setQuery] = useState('');
  // The list only shows up after a search; before that, the map shows every place
  const [searched, setSearched] = useState(false);
  // Shown when Search is clicked with nothing filled in
  const [hint, setHint] = useState('');
  const { data: places, loading, error } = useApi(`/api/places${query}`);

  function handleSearch(e) {
    e.preventDefault();
    const form = new FormData(e.target);
    const params = new URLSearchParams();
    const search = form.get('search').trim(); // only spaces counts as empty
    if (search) params.set('search', search);
    if (form.get('category')) params.set('category', form.get('category'));
    const criteria = form.getAll('criteria');
    if (criteria.length > 0) params.set('criteria', criteria.join(','));
    const qs = params.toString();
    // Nothing filled in -> no list, ask for at least one filter
    if (!qs) {
      setQuery('');
      setSearched(false);
      setHint('Type a name, choose a category or tick what you need, then search.');
      return;
    }
    setHint('');
    setQuery(`?${qs}`); // new path -> useApi loads again
    setSearched(true);
  }

  return (
    <>
      <h1>Find an accessible place</h1>
      <p className="muted">Places in Lebanon say how accessible they are, and visitors confirm it in their reviews.</p>
      <form onSubmit={handleSearch} className="card filters">
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
                <AccessIcon name={key} />
                {label}
              </label>
            ))}
          </div>
        </fieldset>
        <button>Search</button>
        {hint && <p className="hint" role="status">{hint}</p>}
      </form>

      {loading && !places && <p>Loading…</p>}
      {error && <p className="error" role="alert">{error.message}</p>}
      {places && !searched && (
        <>
          <p className="muted">
            {places.length} places on the map. Search by name, category or what you need to see the list.
          </p>
          <div className="map-wide">
            <PlacesMap places={places} onOpen={(id) => go('place', id)} />
          </div>
        </>
      )}
      {places && searched && (
        // Results on the left, map on the right, like Google Maps (stacked on phones)
        <div className="search-layout">
          <div>
            <p className="muted">{places.length === 1 ? '1 place found' : `${places.length} places found`}</p>
            {places.length === 0 && <p>No place matches these filters. Try with fewer criteria.</p>}
            {places.length > 0 && (
              <ul className="list">
                {places.map((p) => (
                  <li key={p._id} className="place-row">
                    {/* Cover photo = the first photo of the place. Shown 88px wide, so a
                        200px copy is enough; the list is under the form, so it loads lazily */}
                    {p.photos?.length > 0 ? (
                      <img src={sizedPhoto(p.photos[0], 200)} alt="" className="place-thumb" width="88" height="88" loading="lazy" />
                    ) : (
                      <div className="place-thumb" />
                    )}
                    <div>
                      <h2>
                        <button className="title-link" onClick={() => go('place', p._id)}>{p.name}</button>
                      </h2>
                      <p className="muted"><span className="category">{p.category}</span>, {p.address}</p>
                      <CriteriaBadges place={p} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="search-map">
            <PlacesMap places={places} onOpen={(id) => go('place', id)} />
          </div>
        </div>
      )}
    </>
  );
}

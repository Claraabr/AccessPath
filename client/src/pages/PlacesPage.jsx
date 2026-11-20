import { useState } from 'react';
import { useApi } from '../hooks/useApi.js';
import { PLACE_CATEGORIES, CRITERIA } from '../constants.js';
import { PlacesMap } from '../components/PlacesMap.jsx';
import { CriteriaBadges, AccessIcon } from '../components/CriteriaBadges.jsx';
import { sizedPhoto } from '../api/upload.js';
import { getMyPosition, sortByDistance, formatDistance } from '../utils/location.js';

// The filters of the form as a query string, e.g. "search=cafe&criteria=stepFree"
function readFilters(formEl) {
  const form = new FormData(formEl);
  const params = new URLSearchParams();
  const search = form.get('search').trim(); // only spaces counts as empty
  if (search) params.set('search', search);
  if (form.get('category')) params.set('category', form.get('category'));
  const criteria = form.getAll('criteria');
  if (criteria.length > 0) params.set('criteria', criteria.join(','));
  return params.toString();
}

export function PlacesPage({ go }) {
  // The filters live in the URL query, e.g. "?search=cafe&criteria=stepFree"
  const [query, setQuery] = useState('');
  // The list only shows up after a search; before that, the map shows every place
  const [searched, setSearched] = useState(false);
  // Shown when Search is clicked with nothing filled in, or when the position is not available
  const [hint, setHint] = useState('');
  // Position of the user after "Near me" (null = normal order)
  const [position, setPosition] = useState(null);
  const [locating, setLocating] = useState(false);
  const { data: places, loading, error } = useApi(`/api/places${query}`);

  function handleSearch(e) {
    e.preventDefault();
    const qs = readFilters(e.target);
    // Nothing filled in -> no list, ask for at least one filter
    if (!qs) {
      setQuery('');
      setSearched(false);
      setHint('Type a name, choose a category or tick what you need, then search.');
      return;
    }
    setHint('');
    setPosition(null);
    setQuery(`?${qs}`); // new path -> useApi loads again
    setSearched(true);
  }

  // "Near me": same filters (or none), closest places first
  async function handleNearMe(e) {
    const qs = readFilters(e.currentTarget.form);
    setHint('');
    setLocating(true);
    try {
      setPosition(await getMyPosition());
      setQuery(qs ? `?${qs}` : '');
      setSearched(true);
    } catch (err) {
      setHint(err.message);
    } finally {
      setLocating(false);
    }
  }

  // After "Near me", each place gets its distance and the closest come first
  const shown = places && position ? sortByDistance(places, position) : places;

  return (
    <>
      {/* The search in a narrower box, in the middle of the page */}
      <div className="search-box">
        <h1>Search for a place</h1>
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
          <div className="search-buttons">
            <button>Search</button>
            <button type="button" className="secondary" onClick={handleNearMe} disabled={locating}>
              {locating ? 'Finding you…' : 'Near me'}
            </button>
          </div>
          {hint && <p className="hint" role="status">{hint}</p>}
        </form>
      </div>

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
            <p className="muted">
              {places.length === 1 ? '1 place found' : `${places.length} places found`}
              {position && ', closest first'}
            </p>
            {places.length === 0 && <p>No place matches these filters. Try with fewer criteria.</p>}
            {places.length > 0 && (
              <ul className="list">
                {shown.map((p) => (
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
                      <p className="muted">
                        <span className="category">{p.category}</span>, {p.address}
                        {p.km != null && <strong className="distance">{formatDistance(p.km)} away</strong>}
                      </p>
                      <CriteriaBadges place={p} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="search-map">
            <PlacesMap places={shown} me={position} onOpen={(id) => go('place', id)} />
          </div>
        </div>
      )}
    </>
  );
}

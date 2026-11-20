import { useState } from 'react';
import { useApi } from '../hooks/useApi.js';
import { EQUIPMENT_TYPES } from '../constants.js';
import { Price } from '../components/Price.jsx';
import { sizedPhoto } from '../api/upload.js';
import { getMyPosition, sortByDistance, formatDistance } from '../utils/location.js';

// The filters of the form as a query string, e.g. "type=ramp&mode=rent"
function readFilters(formEl) {
  const form = new FormData(formEl);
  const params = new URLSearchParams();
  for (const key of ['type', 'mode', 'area']) {
    const value = form.get(key).trim();
    if (value) params.set(key, value);
  }
  return params.toString();
}

export function ListingsPage({ go }) {
  const [query, setQuery] = useState('');
  // Position of the user after "Near me" (null = newest first)
  const [position, setPosition] = useState(null);
  const [locating, setLocating] = useState(false);
  const [hint, setHint] = useState('');
  const { data: listings, loading, error } = useApi(`/api/listings${query}`);

  function handleSearch(e) {
    e.preventDefault();
    const qs = readFilters(e.target);
    setHint('');
    setPosition(null);
    setQuery(qs ? `?${qs}` : '');
  }

  // "Near me": same filters, the closest suppliers first
  async function handleNearMe(e) {
    const qs = readFilters(e.currentTarget.form);
    setHint('');
    setLocating(true);
    try {
      setPosition(await getMyPosition());
      setQuery(qs ? `?${qs}` : '');
    } catch (err) {
      setHint(err.message);
    } finally {
      setLocating(false);
    }
  }

  const shown = listings && position ? sortByDistance(listings, position) : listings;

  return (
    <>
      <h1>AccessFix: find equipment</h1>
      <p className="muted">Rent or buy a ramp, a wheelchair or other equipment from suppliers in Lebanon.</p>
      <form onSubmit={handleSearch} className="card filters">
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
        <div className="search-buttons">
          <button>Search</button>
          <button type="button" className="secondary" onClick={handleNearMe} disabled={locating}>
            {locating ? 'Finding you…' : 'Near me'}
          </button>
        </div>
        {hint && <p className="hint" role="status">{hint}</p>}
      </form>

      {loading && !listings && <p>Loading…</p>}
      {error && <p className="error" role="alert">{error.message}</p>}
      {shown && (
        <>
          <p className="muted">
            {shown.length === 1 ? '1 listing found' : `${shown.length} listings found`}
            {position && ', closest first'}
          </p>
          {shown.length === 0 && <p>No equipment matches these filters. Try another type or area.</p>}
          {shown.length > 0 && (
            <ul className="list">
              {shown.map((l) => (
                <li key={l._id} className="place-row">
                  {l.photoUrl ? (
                    <img src={sizedPhoto(l.photoUrl, 200)} alt="" className="place-thumb" width="88" height="88" loading="lazy" />
                  ) : (
                    <div className="place-thumb" />
                  )}
                  <div>
                    <h2>
                      <button className="title-link" onClick={() => go('listing', l._id)}>{l.title}</button>
                    </h2>
                    <p className="muted">
                      <span className="category">{l.type}</span> {l.mode === 'rent' ? 'for rent' : 'for sale'} in {l.area}
                      {l.km != null && <strong className="distance">{formatDistance(l.km)} away</strong>}
                    </p>
                    <p><Price listing={l} /></p>
                    {/* The request form is on the listing page */}
                    <button className="secondary" onClick={() => go('listing', l._id)}>
                      {l.mode === 'rent' ? 'Ask to rent' : 'Ask to buy'}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </>
  );
}

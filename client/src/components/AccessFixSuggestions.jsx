import { useApi } from '../hooks/useApi.js';
import { Price } from './Price.jsx';
import { sizedPhoto } from '../api/upload.js';
import { sortByDistance, formatDistance } from '../utils/location.js';

// For each "No" that equipment can fix: the type of equipment to look for on AccessFix
const FIXES = [
  { criterion: 'stepFree', type: 'ramp', title: 'No step-free entrance: a ramp for the steps at your door' },
  { criterion: 'elevator', type: 'stair-climber', title: 'No elevator: a stair climber to reach the other floors' },
];

// Shown to a venue on its own page: equipment from AccessFix for what its place is missing,
// the suppliers closest to the place first
export function AccessFixSuggestions({ place, go }) {
  const { data: listings } = useApi('/api/listings');
  const needs = FIXES.filter((fix) => !place[fix.criterion]);
  if (needs.length === 0 || !listings) return null;

  return (
    <section className="card fix-card">
      <h2>Make your place easier to visit</h2>
      <p className="muted">Suppliers on AccessFix rent or sell what can help, the closest to your place first.</p>
      {needs.map((fix) => {
        const closest = sortByDistance(listings.filter((l) => l.type === fix.type), place).slice(0, 3);
        return (
          <div key={fix.criterion}>
            <h3>{fix.title}</h3>
            {closest.length === 0 && <p className="muted">Nothing on AccessFix yet.</p>}
            {closest.length > 0 && (
              <ul className="list">
                {closest.map((l) => (
                  <li key={l._id} className="place-row">
                    {l.photoUrl ? (
                      <img src={sizedPhoto(l.photoUrl, 200)} alt="" className="place-thumb" width="88" height="88" loading="lazy" />
                    ) : (
                      <div className="place-thumb" />
                    )}
                    <div>
                      <h4>
                        <button className="title-link" onClick={() => go('listing', l._id)}>{l.title}</button>
                      </h4>
                      <p className="muted">
                        {l.mode === 'rent' ? 'For rent' : 'For sale'} in {l.area}
                        {l.km != null && <strong className="distance">{formatDistance(l.km)} from you</strong>}
                      </p>
                      <p><Price listing={l} /></p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
      <button className="secondary" onClick={() => go('listings')}>See everything on AccessFix</button>
    </section>
  );
}

import { CRITERIA, ACCESS_PHOTO_TEXT } from '../constants.js';
import { sizedPhoto } from '../api/upload.js';

// Pictograms like the ones on accessibility signs, drawn with lines on a 24x24 grid
const ICONS = {
  stepFree: <path d="M3 19h18V7z" />, // a ramp
  elevator: (
    <>
      <rect x="5" y="3" width="14" height="18" rx="1.5" />
      <path d="m9 10 3-3 3 3M9 14l3 3 3-3" />
    </>
  ),
  toilets: (
    <>
      <path d="M6 4h5v7H6z" />
      <path d="M4 11h16a6 6 0 0 1-6 6h-4a6 6 0 0 1-6-6z" />
      <path d="M9.5 17 9 20h6l-.5-3" />
    </>
  ),
  parking: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M9.5 17V7H13a3 3 0 0 1 0 6H9.5" />
    </>
  ),
};

export function AccessIcon({ name }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {ICONS[name]}
    </svg>
  );
}

// The 4 criteria of a place, never shown by color only:
// - small (search results): 4 squares, a missing one is crossed out, the words are for screen readers
// - large (place page): one tile per criterion with "Yes" or "No" written,
//   and under it the photo of that criterion when the place shared one
export function CriteriaBadges({ place, large = false }) {
  if (large) {
    return (
      <ul className="access-tiles">
        {Object.entries(CRITERIA).map(([key, label]) => {
          const yes = Boolean(place[key]);
          const photo = place.accessPhotos?.[key];
          return (
            <li key={key} className={yes ? 'yes' : 'no'}>
              <div className="access-head">
                <AccessIcon name={key} />
                <strong>{label}</strong>
                <span className="answer">{yes ? 'Yes' : 'No'}</span>
              </div>
              {/* shown about 500px wide, so a 600px copy is enough */}
              {photo && <img src={sizedPhoto(photo, 600)} alt={`Photo of ${ACCESS_PHOTO_TEXT[key]}`} loading="lazy" />}
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <ul className="access-icons">
      {Object.entries(CRITERIA).map(([key, label]) => {
        const yes = Boolean(place[key]);
        return (
          <li key={key} className={yes ? 'yes' : 'no'} title={`${label}: ${yes ? 'yes' : 'no'}`}>
            <AccessIcon name={key} />
            <span className="sr-only">
              {label}: {yes ? 'yes' : 'no'}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

import { CRITERIA } from '../constants.js';

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
// - large (place page): one tile per criterion with "Yes" or "No" written
export function CriteriaBadges({ place, large = false }) {
  return (
    <ul className={large ? 'access-tiles' : 'access-icons'}>
      {Object.entries(CRITERIA).map(([key, label]) => {
        const yes = Boolean(place[key]);
        return (
          <li key={key} className={yes ? 'yes' : 'no'} title={`${label}: ${yes ? 'yes' : 'no'}`}>
            <AccessIcon name={key} />
            {large ? (
              <span>
                <strong>{label}</strong>
                <span>{yes ? 'Yes' : 'No'}</span>
              </span>
            ) : (
              <span className="sr-only">
                {label}: {yes ? 'yes' : 'no'}
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}

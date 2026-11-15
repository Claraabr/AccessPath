import { CRITERIA } from '../constants.js';

// ✓ / ✗ in text, not only color, so it works for color-blind users too
export function CriteriaBadges({ place }) {
  return (
    <div className="criteria">
      {Object.entries(CRITERIA).map(([key, label]) => (
        <span key={key} className={`badge ${place[key] ? 'yes' : 'no'}`}>
          {place[key] ? '✓' : '✗'} {label}
        </span>
      ))}
    </div>
  );
}

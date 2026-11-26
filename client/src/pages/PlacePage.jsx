import { useState } from 'react';
import { useAuth } from '../auth/AuthContext.jsx';
import { useApi } from '../hooks/useApi.js';
import { apiFetch } from '../api/client.js';
import { PlacesMap } from '../components/PlacesMap.jsx';
import { CriteriaBadges, AccessPhotos } from '../components/CriteriaBadges.jsx';
import { Stars } from '../components/Stars.jsx';
import { ReviewForm } from '../components/ReviewForm.jsx';
import { AccessFixSuggestions } from '../components/AccessFixSuggestions.jsx';
import { sizedPhoto } from '../api/upload.js';
import { CRITERIA } from '../constants.js';

// The page of a place, like a Google Maps card: photos, name, rating, accessibility, map, reviews.
// A user opens it from the search. A venue sees its own place here, with an
// "Edit" button passed in ownerActions instead of the back button.
export function PlacePage({ id, go, ownerActions }) {
  const { user } = useAuth();
  const { data: place, loading, error } = useApi(`/api/places/${id}`);
  const { data: reviews, reload } = useApi(`/api/places/${id}/reviews`);
  // Id of my review while I'm editing it
  const [editingId, setEditingId] = useState(null);
  const [actionError, setActionError] = useState('');

  if (loading && !place) return <p>Loading…</p>;
  if (error) return <p className="error" role="alert">{error.message}</p>;

  const list = reviews ?? [];
  // Average rating computed here from the reviews
  const average = list.length > 0
    ? (list.reduce((sum, r) => sum + r.rating, 0) / list.length).toFixed(1)
    : null;
  const alreadyReviewed = list.some((r) => r.userId?._id === user?.id);
  // How many visitors found each criterion, from what they ticked in their reviews
  const found = {};
  for (const key of Object.keys(CRITERIA)) found[key] = list.filter((r) => r.found?.[key]).length;

  async function removeReview(reviewId) {
    if (!window.confirm('Delete your review?')) return;
    setActionError('');
    try {
      await apiFetch(`/api/reviews/${reviewId}`, { method: 'DELETE' });
      reload();
    } catch (err) {
      setActionError(err.message);
    }
  }

  return (
    <>
      {!ownerActions && (
        <button className="back" onClick={() => go('places')}>
          ← Back to the search
        </button>
      )}
      <div className="place-head">
        <div>
          <h1>{place.name}</h1>
          <p className="muted"><span className="category">{place.category}</span>, {place.address}</p>
          <p className="rating">
            {average ? (
              <>
                <Stars value={Number(average)} /> <strong>{average}</strong>{' '}
                <span className="muted">from {list.length === 1 ? '1 review' : `${list.length} reviews`}</span>
              </>
            ) : (
              <span className="muted">No reviews yet</span>
            )}
          </p>
        </div>
        {ownerActions}
      </div>

      {/* Cover photo under the name, like on Google Maps. At the top of the page, so not lazy */}
      {place.photos?.length > 0 && (
        <img src={sizedPhoto(place.photos[0], 1200)} alt={place.name} className="place-hero" height="300" />
      )}

      <h2 className="section-title">Accessibility, as declared by the place</h2>
      <CriteriaBadges place={place} large found={found} reviewCount={list.length} />
      {/* The venue looking at its own page: equipment that can fix what is missing */}
      {ownerActions && <AccessFixSuggestions place={place} go={go} />}
      <AccessPhotos place={place} />

      {/* The other photos of the place, after the cover */}
      {place.photos?.length > 1 && (
        <>
          <h2 className="section-title">More photos</h2>
          <div className="gallery">
            {place.photos.slice(1).map((url, i) => (
              // shown 220px high, so a 600px wide copy is plenty for a landscape photo
              <img key={url} src={sizedPhoto(url, 600)} alt={`${place.name}, photo ${i + 2}`} height="220" />
            ))}
          </div>
        </>
      )}

      <PlacesMap places={[place]} />

      <h2>Reviews</h2>
      {actionError && <p className="error" role="alert">{actionError}</p>}
      {user?.role === 'user' && !alreadyReviewed && <ReviewForm placeId={id} onAdded={reload} />}
      {list.length === 0 && (
        <p className="muted">{ownerActions ? 'No reviews yet.' : 'Be the first to share your experience.'}</p>
      )}
      {list.length > 0 && (
        <ul className="list">
          {list.map((r) => editingId === r._id ? (
            <li key={r._id}>
              <ReviewForm
                review={r}
                onAdded={() => {
                  setEditingId(null);
                  reload();
                }}
                onCancel={() => setEditingId(null)}
              />
            </li>
          ) : (
            <li key={r._id}>
              <div className="review-head">
                <strong>{r.userId?.name ?? 'Deleted user'}</strong>
                <Stars value={r.rating} />
                <span className="muted">{new Date(r.createdAt).toLocaleDateString()}</span>
              </div>
              <p className="muted review-found">
                Found: {Object.keys(CRITERIA).filter((key) => r.found?.[key]).map((key) => CRITERIA[key]).join(', ') || 'none of the four'}
              </p>
              {r.comment && <p>{r.comment}</p>}
              {r.photoUrl && <img src={r.photoUrl} alt={`Photo by ${r.userId?.name ?? 'a user'}`} className="review-photo" />}
              {r.reply && (
                <div className="owner-reply">
                  <p className="owner-reply-head">
                    <strong>Reply from the owner</strong>
                    <span className="muted">{new Date(r.repliedAt).toLocaleDateString()}</span>
                  </p>
                  <p>{r.reply}</p>
                </div>
              )}
              {r.userId?._id === user?.id && (
                <div className="row">
                  <button className="secondary" onClick={() => setEditingId(r._id)}>Edit my review</button>
                  <button className="danger" onClick={() => removeReview(r._id)}>Delete my review</button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

import { useState } from 'react';
import { useAuth } from '../auth/AuthContext.jsx';
import { useApi } from '../hooks/useApi.js';
import { apiFetch } from '../api/client.js';
import { PlacesMap } from '../components/PlacesMap.jsx';
import { CriteriaBadges } from '../components/CriteriaBadges.jsx';
import { Stars } from '../components/Stars.jsx';
import { ReviewForm } from '../components/ReviewForm.jsx';

// The page of a place, like a Google Maps card: photos, name, rating, accessibility, map, reviews.
// A user opens it from the search. A venue sees its own place here, with an
// "Edit" button passed in ownerActions instead of the back button.
export function PlacePage({ id, go, ownerActions }) {
  const { user } = useAuth();
  const { data: place, loading, error } = useApi(`/api/places/${id}`);
  const { data: reviews, reload } = useApi(`/api/places/${id}/reviews`);
  // Id of my review while I'm editing it
  const [editingId, setEditingId] = useState(null);

  if (loading && !place) return <p>Loading…</p>;
  if (error) return <p className="error" role="alert">{error.message}</p>;

  const list = reviews ?? [];
  // Average rating computed here from the reviews
  const average = list.length > 0
    ? (list.reduce((sum, r) => sum + r.rating, 0) / list.length).toFixed(1)
    : null;
  const alreadyReviewed = list.some((r) => r.userId?._id === user?.id);

  async function removeReview(reviewId) {
    if (!window.confirm('Delete your review?')) return;
    await apiFetch(`/api/reviews/${reviewId}`, { method: 'DELETE' });
    reload();
  }

  return (
    <>
      {!ownerActions && (
        <button className="secondary" onClick={() => go('places')} style={{ marginBottom: 16 }}>
          ← Back to places
        </button>
      )}
      {place.photos?.length > 0 && (
        <div className="gallery">
          {place.photos.map((url, i) => (
            <img key={url} src={url} alt={`${place.name}, photo ${i + 1}`} />
          ))}
        </div>
      )}
      <section className="card">
        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'start' }}>
          <h1>{place.name}</h1>
          {ownerActions}
        </div>
        <p className="muted">{place.category} · {place.address}</p>
        <p>
          {average ? <><Stars value={Number(average)} /> {average} / 5 ({list.length} review(s))</> : 'No reviews yet'}
        </p>
        <h2>Accessibility (declared by the place)</h2>
        <CriteriaBadges place={place} />
      </section>

      <PlacesMap places={[place]} />

      <h2>Reviews</h2>
      {user?.role === 'user' && !alreadyReviewed && <ReviewForm placeId={id} onAdded={reload} />}
      {list.length === 0 && (
        <p className="muted">{ownerActions ? 'No reviews yet.' : 'Be the first to share your experience.'}</p>
      )}
      {list.map((r) => editingId === r._id ? (
        <ReviewForm
          key={r._id}
          review={r}
          onAdded={() => {
            setEditingId(null);
            reload();
          }}
          onCancel={() => setEditingId(null)}
        />
      ) : (
        <article key={r._id} className="card">
          <p>
            <strong>{r.userId?.name ?? 'Deleted user'}</strong> · <Stars value={r.rating} />{' '}
            <span className="muted">{new Date(r.createdAt).toLocaleDateString()}</span>
          </p>
          {r.comment && <p>{r.comment}</p>}
          {r.photoUrl && <img src={r.photoUrl} alt={`Photo by ${r.userId?.name ?? 'a user'}`} className="review-photo" />}
          {r.userId?._id === user?.id && (
            <div className="row">
              <button className="secondary" onClick={() => setEditingId(r._id)}>Edit my review</button>
              <button className="danger" onClick={() => removeReview(r._id)}>Delete my review</button>
            </div>
          )}
        </article>
      ))}
    </>
  );
}

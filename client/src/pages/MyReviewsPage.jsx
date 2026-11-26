import { useState } from 'react';
import { useApi } from '../hooks/useApi.js';
import { apiFetch } from '../api/client.js';
import { Stars } from '../components/Stars.jsx';

// Venue only: the reviews of my place, and my replies, like on Google Maps
export function MyReviewsPage() {
  const { data: place, loading, error } = useApi('/api/places/mine');

  if (loading && !place) return <p>Loading…</p>;
  if (error) return <p className="error" role="alert">{error.message}</p>;
  if (!place) {
    return (
      <>
        <h1>My reviews</h1>
        <p className="muted">Set up your place first: visitors can review it once it is on AccessPath.</p>
      </>
    );
  }
  return <PlaceReviews place={place} />;
}

function PlaceReviews({ place }) {
  const { data: reviews, loading, reload } = useApi(`/api/places/${place._id}/reviews`);
  // "all" or "waiting" (the reviews without a reply)
  const [filter, setFilter] = useState('all');

  if (loading && !reviews) return <p>Loading…</p>;
  const list = reviews ?? [];
  const waiting = list.filter((r) => !r.reply);
  const shown = filter === 'waiting' ? waiting : list;
  const average = list.length > 0
    ? (list.reduce((sum, r) => sum + r.rating, 0) / list.length).toFixed(1)
    : null;

  return (
    <>
      <h1>My reviews</h1>
      <p className="muted">
        {average
          ? `${place.name}: ${average} out of 5 from ${list.length === 1 ? '1 review' : `${list.length} reviews`}. ${waiting.length} waiting for your reply.`
          : `${place.name} has no reviews yet.`}
      </p>
      {list.length > 0 && (
        <div className="filter-tabs" role="group" aria-label="Which reviews">
          <button aria-pressed={filter === 'all'} onClick={() => setFilter('all')}>
            All ({list.length})
          </button>
          <button aria-pressed={filter === 'waiting'} onClick={() => setFilter('waiting')}>
            Waiting for a reply ({waiting.length})
          </button>
        </div>
      )}
      {filter === 'waiting' && waiting.length === 0 && list.length > 0 && (
        <p>You answered every review.</p>
      )}
      {shown.length > 0 && (
        <ul className="list">
          {shown.map((r) => (
            <li key={r._id}>
              <div className="review-head">
                <strong>{r.userId?.name ?? 'Deleted user'}</strong>
                <Stars value={r.rating} />
                <span className="muted">{new Date(r.createdAt).toLocaleDateString()}</span>
              </div>
              {r.comment && <p>{r.comment}</p>}
              {r.photoUrl && <img src={r.photoUrl} alt={`Photo by ${r.userId?.name ?? 'a user'}`} className="review-photo" />}
              <ReplyBox review={r} onSaved={reload} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

// My reply to one review: shown with Edit / Delete, or a form to write it
function ReplyBox({ review, onSaved }) {
  const [editing, setEditing] = useState(!review.reply);
  const [text, setText] = useState(review.reply);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  async function save(e) {
    e.preventDefault();
    setSending(true);
    setError('');
    try {
      await apiFetch(`/api/reviews/${review._id}/reply`, { method: 'PUT', body: JSON.stringify({ text }) });
      setEditing(false);
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  }

  async function remove() {
    if (!window.confirm('Delete your reply?')) return;
    setError('');
    try {
      await apiFetch(`/api/reviews/${review._id}/reply`, { method: 'DELETE' });
      setText('');
      setEditing(true);
      onSaved();
    } catch (err) {
      setError(err.message);
    }
  }

  if (!editing) {
    return (
      <div className="owner-reply">
        <p className="owner-reply-head">
          <strong>Your reply</strong>
          <span className="muted">{new Date(review.repliedAt).toLocaleDateString()}</span>
        </p>
        <p>{review.reply}</p>
        {error && <p className="error" role="alert">{error}</p>}
        <div className="row">
          <button className="secondary" onClick={() => setEditing(true)}>Edit my reply</button>
          <button className="danger" onClick={remove}>Delete my reply</button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={save} className="reply-form">
      <label>
        Your reply
        <textarea
          rows="2"
          maxLength={500}
          required
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Thank the visitor, or say what you changed in your place."
        />
      </label>
      {error && <p className="error" role="alert">{error}</p>}
      <div className="row">
        <button disabled={sending}>{sending ? 'Publishing…' : 'Publish reply'}</button>
        {review.reply && (
          <button type="button" className="secondary" onClick={() => { setText(review.reply); setEditing(false); }}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

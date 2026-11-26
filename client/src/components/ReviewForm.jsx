import { useState } from 'react';
import { apiFetch } from '../api/client.js';
import { uploadPhoto } from '../api/upload.js';
import { CRITERIA } from '../constants.js';

// Used to post a review, and to edit one (review = the review to edit)
export function ReviewForm({ placeId, review, onAdded, onCancel }) {
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    const formEl = e.target;
    const form = new FormData(formEl);
    setSending(true);
    setError('');
    try {
      // 1. Upload the photo to our API (if one was chosen), otherwise keep the old one
      const file = form.get('photo');
      const photoUrl = file && file.size > 0 ? await uploadPhoto(file) : review?.photoUrl ?? '';
      const body = JSON.stringify({
        rating: Number(form.get('rating')),
        comment: form.get('comment'),
        photoUrl,
        // A ticked box sends "on", an empty one sends nothing
        found: Object.fromEntries(Object.keys(CRITERIA).map((key) => [key, form.get(`found-${key}`) === 'on'])),
      });
      // 2. Save it in our API: PATCH my review, or POST a new one
      if (review) {
        await apiFetch(`/api/reviews/${review._id}`, { method: 'PATCH', body });
      } else {
        await apiFetch(`/api/places/${placeId}/reviews`, { method: 'POST', body });
        formEl.reset();
      }
      onAdded();
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card">
      <h3>{review ? 'Edit your review' : 'Leave a review'}</h3>
      <label>
        Rating
        <select name="rating" required defaultValue={String(review?.rating ?? 5)}>
          <option value="5">5 – Excellent</option>
          <option value="4">4 – Good</option>
          <option value="3">3 – OK</option>
          <option value="2">2 – Poor</option>
          <option value="1">1 – Not accessible</option>
        </select>
      </label>
      <fieldset>
        <legend>What did you find there?</legend>
        {Object.entries(CRITERIA).map(([key, label]) => (
          <label key={key} className="check">
            <input type="checkbox" name={`found-${key}`} defaultChecked={review?.found?.[key]} />
            {label}
          </label>
        ))}
      </fieldset>
      <label>
        Comment
        <textarea
          name="comment"
          rows="3"
          maxLength={500}
          defaultValue={review?.comment ?? ''}
          placeholder="Was it easy to get in and move around?"
        />
      </label>
      <label>
        {review?.photoUrl ? 'New photo (optional)' : 'Photo (optional)'}
        <input name="photo" type="file" accept="image/*" />
      </label>
      {error && <p className="error" role="alert">{error}</p>}
      <div className="row">
        <button disabled={sending}>
          {sending ? 'Sending…' : review ? 'Save changes' : 'Post review'}
        </button>
        {onCancel && <button type="button" className="secondary" onClick={onCancel}>Cancel</button>}
      </div>
    </form>
  );
}

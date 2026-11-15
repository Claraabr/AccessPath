import { useState } from 'react';
import { PLACE_CATEGORIES, CRITERIA } from '../constants.js';
import { photosEnabled, uploadPhoto } from '../api/upload.js';

const MAX_PHOTOS = 10;

// Used to set up the place and to edit it (initial = the place to edit)
export function PlaceForm({ initial = {}, submitLabel, onSubmit, onCancel }) {
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  // Photos already saved; a click on "Remove" takes one out of the list
  const [photos, setPhotos] = useState(initial.photos ?? []);

  async function handleSubmit(e) {
    e.preventDefault();
    const formEl = e.target;
    const form = new FormData(formEl);
    setSending(true);
    setError('');
    try {
      // New photos chosen -> upload them to Cloudinary, one by one
      const files = form.getAll('photos').filter((f) => f && f.size > 0);
      if (photos.length + files.length > MAX_PHOTOS) {
        throw new Error(`${MAX_PHOTOS} photos at most`);
      }
      const uploaded = [];
      for (const file of files) uploaded.push(await uploadPhoto(file));

      const data = {
        name: form.get('name'),
        category: form.get('category'),
        address: form.get('address'),
        photos: [...photos, ...uploaded],
      };
      // A checked checkbox sends "on", an unchecked one sends nothing
      for (const key of Object.keys(CRITERIA)) data[key] = form.get(key) === 'on';

      await onSubmit(data);
      formEl.reset();
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <label>
        Name
        <input name="name" required maxLength={120} defaultValue={initial.name} />
      </label>
      <label>
        Category
        <select name="category" required defaultValue={initial.category ?? ''}>
          <option value="" disabled>Choose…</option>
          {PLACE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </label>
      <label>
        Address
        <input name="address" required placeholder="e.g. Hamra Street, Beirut" defaultValue={initial.address} />
      </label>
      <fieldset>
        <legend>What does your place offer?</legend>
        {Object.entries(CRITERIA).map(([key, label]) => (
          <label key={key} className="check">
            <input type="checkbox" name={key} defaultChecked={initial[key]} />
            {label}
          </label>
        ))}
      </fieldset>
      {photosEnabled && (
        <fieldset>
          <legend>Photos (the first one is the cover)</legend>
          {photos.length > 0 && (
            <div className="photo-edit">
              {photos.map((url, i) => (
                <div key={url}>
                  <img src={url} alt={`Photo ${i + 1} of the place`} />
                  <button
                    type="button"
                    className="secondary"
                    onClick={() => setPhotos(photos.filter((p) => p !== url))}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
          <label>
            Add photos
            <input name="photos" type="file" accept="image/*" multiple />
          </label>
        </fieldset>
      )}
      {error && <p className="error" role="alert">{error}</p>}
      <div className="row">
        <button disabled={sending}>{sending ? 'Saving…' : submitLabel}</button>
        {onCancel && <button type="button" className="secondary" onClick={onCancel}>Cancel</button>}
      </div>
    </form>
  );
}

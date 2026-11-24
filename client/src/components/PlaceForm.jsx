import { useState } from 'react';
import { PLACE_CATEGORIES, CRITERIA, ACCESS_PHOTO_TEXT } from '../constants.js';
import { uploadPhoto, sizedPhoto } from '../api/upload.js';

const MAX_PHOTOS = 10;

// Used to set up the place and to edit it (initial = the place to edit)
export function PlaceForm({ initial = {}, submitLabel, onSubmit, onCancel }) {
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  // Photos already saved; a click on "Remove" takes one out of the list
  const [photos, setPhotos] = useState(initial.photos ?? []);
  // One photo per criterion, e.g. { stepFree: 'https://...', toilets: '' }
  const [accessPhotos, setAccessPhotos] = useState(initial.accessPhotos ?? {});

  async function handleSubmit(e) {
    e.preventDefault();
    const formEl = e.target;
    const form = new FormData(formEl);
    setSending(true);
    setError('');
    try {
      // New photos chosen -> upload them to our API, one by one
      const files = form.getAll('photos').filter((f) => f && f.size > 0);
      if (photos.length + files.length > MAX_PHOTOS) {
        throw new Error(`${MAX_PHOTOS} photos at most`);
      }
      const uploaded = [];
      for (const file of files) uploaded.push(await uploadPhoto(file));
      // Photo of a criterion: a new file replaces the old photo
      const newAccessPhotos = { ...accessPhotos };
      for (const key of Object.keys(CRITERIA)) {
        const file = form.get(`photo-${key}`);
        if (file && file.size > 0) newAccessPhotos[key] = await uploadPhoto(file);
      }

      const data = {
        name: form.get('name'),
        category: form.get('category'),
        address: form.get('address'),
        photos: [...photos, ...uploaded],
        accessPhotos: newAccessPhotos,
      };
      // A checked checkbox sends "on", an unchecked one sends nothing
      for (const key of Object.keys(CRITERIA)) data[key] = form.get(key) === 'on';

      await onSubmit(data);
      setAccessPhotos(newAccessPhotos);
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
          <div key={key} className="criterion-edit">
            <label className="check">
              <input type="checkbox" name={key} defaultChecked={initial[key]} />
              {label}
            </label>
            {/* A photo shows visitors what it really looks like, even when the answer is no (the steps) */}
            <div className="access-photo-edit">
              {accessPhotos[key] && (
                <>
                  <img src={sizedPhoto(accessPhotos[key], 280)} alt={`Photo of ${ACCESS_PHOTO_TEXT[key]}`} />
                  <button
                    type="button"
                    className="secondary"
                    onClick={() => setAccessPhotos({ ...accessPhotos, [key]: '' })}
                  >
                    Remove
                  </button>
                </>
              )}
              <label>
                {accessPhotos[key] ? 'Replace the photo' : `Photo of ${ACCESS_PHOTO_TEXT[key]} (optional)`}
                <input name={`photo-${key}`} type="file" accept="image/*" />
              </label>
            </div>
          </div>
        ))}
      </fieldset>
      <fieldset>
        <legend>Other photos (the first one is the cover)</legend>
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
      {error && <p className="error" role="alert">{error}</p>}
      <div className="row">
        <button disabled={sending}>{sending ? 'Saving…' : submitLabel}</button>
        {onCancel && <button type="button" className="secondary" onClick={onCancel}>Cancel</button>}
      </div>
    </form>
  );
}

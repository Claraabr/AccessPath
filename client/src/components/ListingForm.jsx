import { useState } from 'react';
import { EQUIPMENT_TYPES } from '../constants.js';
import { photosEnabled, uploadPhoto } from '../api/upload.js';

// Used to post a listing and to edit one (initial = the listing to edit)
export function ListingForm({ initial = {}, submitLabel, onSubmit, onCancel }) {
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    const formEl = e.target;
    const form = new FormData(formEl);
    setSending(true);
    setError('');
    try {
      // New photo chosen -> upload it; otherwise keep the old one
      const file = form.get('photo');
      const photoUrl = file && file.size > 0 ? await uploadPhoto(file) : initial.photoUrl ?? '';
      await onSubmit({
        title: form.get('title'),
        type: form.get('type'),
        mode: form.get('mode'),
        price: Number(form.get('price')),
        area: form.get('area'),
        photoUrl,
      });
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
        Title
        <input name="title" required maxLength={100} placeholder="e.g. Portable ramp 2 m" defaultValue={initial.title} />
      </label>
      <div className="row">
        <label style={{ flex: 1 }}>
          Type
          <select name="type" required defaultValue={initial.type ?? ''}>
            <option value="" disabled>Choose…</option>
            {EQUIPMENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>
        <label style={{ flex: 1 }}>
          Rent or sale
          <select name="mode" required defaultValue={initial.mode ?? 'rent'}>
            <option value="rent">Rent</option>
            <option value="sale">Sale</option>
          </select>
        </label>
      </div>
      <div className="row">
        <label style={{ flex: 1 }}>
          Price (USD, per day if rent)
          <input name="price" type="number" min="0" step="1" required defaultValue={initial.price} />
        </label>
        <label style={{ flex: 1 }}>
          Area
          <input name="area" required placeholder="e.g. Beirut" defaultValue={initial.area} />
        </label>
      </div>
      {photosEnabled && (
        <label>
          Photo (optional)
          <input name="photo" type="file" accept="image/*" />
        </label>
      )}
      {error && <p className="error" role="alert">{error}</p>}
      <div className="row">
        <button disabled={sending}>{sending ? 'Saving…' : submitLabel}</button>
        {onCancel && <button type="button" className="secondary" onClick={onCancel}>Cancel</button>}
      </div>
    </form>
  );
}

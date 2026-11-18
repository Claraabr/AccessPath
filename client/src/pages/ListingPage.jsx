import { useState } from 'react';
import { useAuth } from '../auth/AuthContext.jsx';
import { useApi } from '../hooks/useApi.js';
import { apiFetch } from '../api/client.js';
import { Price } from '../components/Price.jsx';

export function ListingPage({ id, go }) {
  const { user } = useAuth();
  const { data: listing, loading, error } = useApi(`/api/listings/${id}`);
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);
  const [sendError, setSendError] = useState('');

  async function sendRequest(e) {
    e.preventDefault();
    setSendError('');
    try {
      await apiFetch(`/api/listings/${id}/requests`, {
        method: 'POST',
        body: JSON.stringify({ message }),
      });
      setSent(true);
    } catch (err) {
      setSendError(err.message);
    }
  }

  if (loading && !listing) return <p>Loading…</p>;
  if (error) return <p className="error" role="alert">{error.message}</p>;

  return (
    <>
      <button className="secondary" onClick={() => go('listings')}>← Back to AccessFix</button>
      <section className="card" style={{ marginTop: 16 }}>
        {listing.photoUrl && <img src={listing.photoUrl} alt={listing.title} className="review-photo" />}
        <h1>{listing.title}</h1>
        <p className="muted"><span className="category">{listing.type}</span> {listing.mode === 'rent' ? 'for rent' : 'for sale'} in {listing.area}</p>
        <p><Price listing={listing} /></p>
        <p>
          Offered by <strong>{listing.ownerId?.name}</strong>
          {listing.ownerId?.email && <>, <a href={`mailto:${listing.ownerId.email}`}>{listing.ownerId.email}</a></>}
        </p>
      </section>

      {(user?.role === 'user' || user?.role === 'venue') && (
        sent ? (
          <div className="card">
            <p><strong>Request sent!</strong> The supplier will accept or decline it.</p>
            <button onClick={() => go('my-requests')}>See my requests</button>
          </div>
        ) : (
          <form onSubmit={sendRequest} className="card">
            <h2>{listing.mode === 'rent' ? 'Ask to rent' : 'Ask to buy'}</h2>
            <label>
              Message to the supplier
              <textarea
                rows="3"
                maxLength={500}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Dates, place, any question…"
              />
            </label>
            {sendError && <p className="error" role="alert">{sendError}</p>}
            <button>Send request</button>
          </form>
        )
      )}
    </>
  );
}

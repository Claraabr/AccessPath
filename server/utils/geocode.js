// Turn an address into coordinates with Nominatim (OpenStreetMap)
// Free, no API key. Their rules ask for a User-Agent that names the app.
export async function geocode(address) {
  const params = new URLSearchParams({
    q: address,
    format: 'json',
    limit: '1',
    countrycodes: 'lb', // search in Lebanon only
  });
  const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
    headers: { 'User-Agent': 'AccessPath student project (USJ)' },
  });
  if (!res.ok) throw new Error('Geocoding service failed');
  const results = await res.json();
  if (results.length === 0) return null; // address not found
  return { lat: Number(results[0].lat), lng: Number(results[0].lon) };
}

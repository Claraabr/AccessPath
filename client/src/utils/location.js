// "Near me": the position of the user and the distance to places and listings

// The browser asks the user before sharing the position.
// getCurrentPosition works with callbacks: we wrap it in a Promise to use await (session 10)
export function getMyPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('This browser cannot share its position.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => reject(new Error('Your position is not available. Allow location in your browser, or search by name.')),
      { timeout: 10000 }
    );
  });
}

// Distance in km between two points, in a straight line (haversine formula)
export function distanceKm(a, b) {
  const rad = (deg) => (deg * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h)); // 6371 km = radius of the Earth
}

// "350 m" under 1 km, "4.2 km" after
export function formatDistance(km) {
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
}

// Adds km to each item, closest first. Items without a position go last.
export function sortByDistance(items, from) {
  return items
    .map((item) => ({ ...item, km: item.lat != null && item.lng != null ? distanceKm(from, item) : null }))
    .sort((a, b) => (a.km ?? Infinity) - (b.km ?? Infinity));
}

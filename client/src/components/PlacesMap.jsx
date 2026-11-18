import { useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const BEIRUT = [33.8938, 35.5018];
const MAPTILER_KEY = import.meta.env.VITE_MAPTILER_KEY;
// Our own copy of the Streets map, set to English in MapTiler Cloud.
// Tiles are asked as .webp instead of .png: same map, about a third lighter (Lighthouse, session 22)
const MAPTILER_MAP = import.meta.env.VITE_MAPTILER_MAP || 'streets-v2';

// The places are all over Lebanon: zoom the map so that every marker is visible.
// Runs again when the search gives other places.
function FitToPlaces({ places }) {
  const map = useMap();
  useEffect(() => {
    if (places.length > 1) {
      map.fitBounds(places.map((p) => [p.lat, p.lng]), { padding: [30, 30] });
    }
  }, [map, places]);
  return null;
}

// Map of places with Leaflet
// Background tiles: MapTiler "Streets" (free account, key in .env)
// No key -> fall back to the standard OpenStreetMap tiles
export function PlacesMap({ places, onOpen }) {
  // One place -> zoom on it; several -> FitToPlaces shows them all (Beirut before the first fit)
  const single = places.length === 1;
  const center = single ? [places[0].lat, places[0].lng] : BEIRUT;

  return (
    <MapContainer center={center} zoom={single ? 16 : 12} className="map">
      {MAPTILER_KEY ? (
        <TileLayer
          attribution='&copy; <a href="https://www.maptiler.com/copyright/">MapTiler</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url={`https://api.maptiler.com/maps/${MAPTILER_MAP}/{z}/{x}/{y}.webp?key=${MAPTILER_KEY}`}
          tileSize={512}
          zoomOffset={-1}
          minZoom={1}
          crossOrigin={true}
        />
      ) : (
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
      )}
      <FitToPlaces places={places} />
      {places.map((p) => (
        <CircleMarker
          key={p._id}
          center={[p.lat, p.lng]}
          radius={10}
          pathOptions={{ color: '#003d2a', fillColor: '#00563b', fillOpacity: 0.85 }}
        >
          <Popup>
            <strong>{p.name}</strong>
            <br />
            {p.address}
            {onOpen && (
              <>
                <br />
                <button className="link" onClick={() => onOpen(p._id)}>See details</button>
              </>
            )}
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}

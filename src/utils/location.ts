export interface Coordinates {
  latitude: number;
  longitude: number;
}

export function validateCoordinates(coords: Partial<Coordinates>): coords is Coordinates {
  const { latitude: lat, longitude: lon } = coords;
  return (
    typeof lat === 'number' && typeof lon === 'number' &&
    isFinite(lat) && isFinite(lon) &&
    lat >= -90 && lat <= 90 &&
    lon >= -180 && lon <= 180
  );
}

export function haversineDistanceKm(a: Coordinates, b: Coordinates): number {
  const R = 6371;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const sinHalfDLat = Math.sin(dLat / 2);
  const sinHalfDLon = Math.sin(dLon / 2);
  const a2 = sinHalfDLat * sinHalfDLat + Math.cos(lat1) * Math.cos(lat2) * sinHalfDLon * sinHalfDLon;
  return R * 2 * Math.atan2(Math.sqrt(a2), Math.sqrt(1 - a2));
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m (straight-line)`;
  return `${km.toFixed(1)} km (straight-line)`;
}

/**
 * ExploreMate OSRM Road Distance Utility
 *
 * Provides:
 *  - getRoadDistance(lat1, lng1, lat2, lng2, profile) — async, OSRM + haversine fallback
 *  - haversineDistance(lat1, lng1, lat2, lng2) — synchronous, exported for reuse
 */

/**
 * Calculate great-circle distance between two coordinates (Haversine formula).
 * @returns {number} Distance in km
 */
export function haversineDistance(lat1, lng1, lat2, lng2) {
  if (lat1 == null || lng1 == null || lat2 == null || lng2 == null) return 1.0;
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return parseFloat((R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(2));
}

// Cache for OSRM results (avoids repeated identical API calls)
const _osrmCache = new Map();

/**
 * Get road distance & duration between two points via OSRM public API.
 * Falls back to haversine × 1.3 if the API fails or times out.
 *
 * @param {number} lat1
 * @param {number} lng1
 * @param {number} lat2
 * @param {number} lng2
 * @param {'walk'|'cycle'|'bike'|'car'|'auto'|'bus'|'taxi'|'driving'|'foot'} profile
 * @returns {Promise<{ distanceKm: number, durationMin: number, source: 'osrm'|'fallback' }>}
 */
export async function getRoadDistance(lat1, lng1, lat2, lng2, profile = 'driving') {
  // OSRM profile mapping
  const profileMap = {
    walk: 'foot',
    foot: 'foot',
    cycle: 'bike',
    bike: 'bike',
    car: 'driving',
    auto: 'driving',
    bus: 'driving',
    taxi: 'driving',
    driving: 'driving'
  };
  const osrmProfile = profileMap[profile] || 'driving';

  const key = `${lat1},${lng1}|${lat2},${lng2}|${osrmProfile}`;
  if (_osrmCache.has(key)) return _osrmCache.get(key);

  try {
    const url = `https://router.project-osrm.org/route/v1/${osrmProfile}/${lng1},${lat1};${lng2},${lat2}?overview=false`;
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) throw new Error(`OSRM HTTP ${res.status}`);
    const data = await res.json();
    if (data.code !== 'Ok' || !data.routes?.[0]) throw new Error('No route returned');
    const route = data.routes[0];
    const result = {
      distanceKm: parseFloat((route.distance / 1000).toFixed(2)),
      durationMin: parseFloat((route.duration / 60).toFixed(1)),
      source: 'osrm'
    };
    _osrmCache.set(key, result);
    return result;
  } catch {
    // Fallback: haversine × 1.3 road correction factor
    const MODE_SPEEDS = { foot: 5, bike: 15, driving: 30 };
    const speed = MODE_SPEEDS[osrmProfile] || 20;
    const straight = haversineDistance(lat1, lng1, lat2, lng2);
    const distanceKm = parseFloat((straight * 1.3).toFixed(2));
    const durationMin = parseFloat(((distanceKm / speed) * 60).toFixed(1));
    const result = { distanceKm, durationMin, source: 'fallback' };
    _osrmCache.set(key, result);
    return result;
  }
}

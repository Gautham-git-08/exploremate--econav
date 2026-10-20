/**
 * Visitor Instructions Helper for ExploreMate
 * 
 * Safely looks up photography, dress code, tips, and confidence badges
 * for each verified Pondicherry destination.
 */

import visitorInstructionsData from '../data/visitorInstructions.json';

export const visitorInstructionsMeta = {
  lastReviewed: visitorInstructionsData.lastReviewed || '2026-10-19',
  note: visitorInstructionsData.note || 'Rules can change without notice. Always follow signboards and staff instructions on site.'
};

/**
 * Normalization helper:
 * - lowercase
 * - trim
 * - remove accents/diacritics (NFD)
 * - replace "&" with "and"
 * - remove punctuation
 * - collapse multiple spaces
 */
export function normalizePlaceName(name) {
  if (!name || typeof name !== 'string') return '';
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, 'and')
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Built-in alias map for any differing name variants
const ALIAS_MAP = {
  'old port': 'Old Port / Old Harbour Area',
  'rock beach': 'Promenade / Rock Beach',
  'promenade beach': 'Promenade / Rock Beach',
  'white town': 'White Town (French Quarter)',
  'french quarter': 'White Town (French Quarter)',
  'ville blanche': 'White Town (French Quarter)',
  'bharathi park': 'Bharathi Park / Government Park',
  'government park': 'Bharathi Park / Government Park',
  'aayi mandapam': 'Aayi Mandapam / Bharathi Park',
  'ashram': 'Sri Aurobindo Ashram',
  'raj niwas': "Raj Niwas (Governor's Palace)",
  'hotel de ville': 'Hôtel de Ville / Municipal Office',
  'chunnambar': 'Chunnambar Boat House'
};

// Normalized exact lookup map
const exactInstructionMap = new Map();
const allInstructionEntries = [];

try {
  (visitorInstructionsData.places || []).forEach(item => {
    if (item && item.name) {
      const normKey = normalizePlaceName(item.name);
      exactInstructionMap.set(normKey, item);
      allInstructionEntries.push({
        normalizedName: normKey,
        data: item
      });
    }
  });
} catch (err) {
  console.error('Failed to index visitorInstructionsData', err);
}

/**
 * Safely retrieves visitor instructions for a given place object or place name string.
 * Never throws an error; returns null if no match or error occurs.
 */
export function getVisitorInstructions(place) {
  try {
    if (!place) return null;
    const rawName = typeof place === 'string' ? place : place.name;
    if (!rawName || typeof rawName !== 'string') return null;

    const normalized = normalizePlaceName(rawName);
    if (!normalized) return null;

    // 1. Try exact normalized match
    if (exactInstructionMap.has(normalized)) {
      return exactInstructionMap.get(normalized);
    }

    // 2. Try alias map
    if (ALIAS_MAP[normalized]) {
      const aliasKey = normalizePlaceName(ALIAS_MAP[normalized]);
      if (exactInstructionMap.has(aliasKey)) {
        return exactInstructionMap.get(aliasKey);
      }
    }

    // 3. Try partial match ONLY if it gives a single unambiguous result
    // (Special protection: Ensure Aayi Mandapam / Bharathi Park vs Bharathi Park / Government Park are distinct)
    const partialMatches = allInstructionEntries.filter(entry => {
      return entry.normalizedName.includes(normalized) || normalized.includes(entry.normalizedName);
    });

    if (partialMatches.length === 1) {
      return partialMatches[0].data;
    }

    return null;
  } catch (err) {
    // Failsafe: Never throw
    return null;
  }
}

// In development mode only, verify and report unmatched names
if (import.meta.env?.DEV) {
  try {
    import('../data/places.js').then(({ PLACES }) => {
      if (Array.isArray(PLACES)) {
        const unmatchedPlaces = PLACES.filter(p => !getVisitorInstructions(p));
        const matchedInstrKeys = new Set(PLACES.map(p => {
          const match = getVisitorInstructions(p);
          return match ? normalizePlaceName(match.name) : null;
        }).filter(Boolean));

        const unmatchedInstructions = (visitorInstructionsData.places || []).filter(
          ip => !matchedInstrKeys.has(normalizePlaceName(ip.name))
        );

        if (unmatchedPlaces.length > 0) {
          console.warn('[ExploreMate DEV] Unmatched places without visitor instructions:', unmatchedPlaces.map(p => p.name));
        }
        if (unmatchedInstructions.length > 0) {
          console.warn('[ExploreMate DEV] Unmatched visitor instruction entries:', unmatchedInstructions.map(ip => ip.name));
        }
      }
    }).catch(() => {});
  } catch (e) {
    // Ignore in non-browser or test runner
  }
}

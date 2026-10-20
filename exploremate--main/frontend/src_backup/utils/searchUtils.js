/**
 * Search and fuzzy utility functions for ExploreMate
 */

// Normalize text: remove accents, trim, lowercase
export function normalizeStr(str = '') {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

// Compute Levenshtein distance between two strings
export function levenshteinDistance(a, b) {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix = [];
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

// Check if search tokens fuzzy-match target words
export function matchesFuzzy(query, targetText, maxDistance = 2) {
  const normQuery = normalizeStr(query);
  const normTarget = normalizeStr(targetText);

  if (!normQuery) return true;
  if (normTarget.includes(normQuery)) return true;

  const queryWords = normQuery.split(/\s+/).filter(Boolean);
  const targetWords = normTarget.split(/\s+/).filter(Boolean);

  // Every word in query should match or be within edit distance of at least one word in target
  return queryWords.every(qWord => {
    if (qWord.length <= 2) {
      return targetWords.some(tWord => tWord.includes(qWord));
    }
    return targetWords.some(tWord => {
      if (tWord.includes(qWord) || qWord.includes(tWord)) return true;
      return levenshteinDistance(qWord, tWord) <= maxDistance;
    });
  });
}

// Non-Pondicherry detector list
export const NON_PONDY_CITIES = [
  'goa', 'paris', 'chennai', 'mumbai', 'delhi', 'bangalore', 'bengaluru',
  'hyderabad', 'kolkata', 'jaipur', 'kerala', 'bali', 'london', 'rome'
];

export function getNonPondyCityMatch(query) {
  const norm = normalizeStr(query);
  if (!norm) return null;
  // If explicitly mentions Pondy, treat as Pondy
  if (norm.includes('pondy') || norm.includes('pondicherry') || norm.includes('puducherry')) {
    return null;
  }
  for (const city of NON_PONDY_CITIES) {
    if (new RegExp(`\\b${city}\\b`, 'i').test(norm)) {
      return city.charAt(0).toUpperCase() + city.slice(1);
    }
  }
  return null;
}

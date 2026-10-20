/**
 * Frontend Vitest Unit Tests
 * Tests Pondicherry query matcher, search fuzzy matching, typo tolerance,
 * and non-Pondicherry city detection.
 */

import { describe, it, expect } from 'vitest';
import { isPondicherryQuery, BRAND_NAME, CONTACT_PHONE } from '../src/config/constants';
import { matchesFuzzy, normalizeStr, getNonPondyCityMatch } from '../src/utils/searchUtils';

describe('ExploreMate Core Logic', () => {
  it('strictly validates Pondicherry queries', () => {
    expect(isPondicherryQuery('Pondicherry')).toBe(true);
    expect(isPondicherryQuery('Puducherry')).toBe(true);
    expect(isPondicherryQuery('Pondy')).toBe(true);
    expect(isPondicherryQuery('White Town Pondy')).toBe(true);
    expect(isPondicherryQuery('Goa')).toBe(false);
    expect(isPondicherryQuery('Paris')).toBe(false);
  });

  it('verifies exact contact phone masking and brand name', () => {
    expect(BRAND_NAME).toBe('ExploreMate');
    expect(CONTACT_PHONE).toBe('9********0');
  });
});

describe('Search & Fuzzy Logic (Task 2 Spec Requirements)', () => {
  it('normalizes accents and whitespace correctly', () => {
    expect(normalizeStr('  Café des Arts  ')).toBe('cafe des arts');
  });

  it('"rock beech" fuzzy matches "Promenade Rock Beach" with edit distance tolerance', () => {
    const target = 'Promenade Rock Beach rocky waterfront morning walks';
    expect(matchesFuzzy('rock beech', target)).toBe(true);
  });

  it('"temple" matches temple attractions', () => {
    const temple = 'Arulmigu Manakula Vinayagar Temple Ganesha temple';
    const museum = 'Puducherry Museum archaeology sculptures';
    expect(matchesFuzzy('temple', temple)).toBe(true);
    expect(matchesFuzzy('temple', museum)).toBe(false);
  });

  it('detects non-Pondicherry cities and extracts formatted name', () => {
    expect(getNonPondyCityMatch('paris trip')).toBe('Paris');
    expect(getNonPondyCityMatch('hotels in goa')).toBe('Goa');
    expect(getNonPondyCityMatch('flights from chennai')).toBe('Chennai');
    expect(getNonPondyCityMatch('Pondicherry')).toBe(null);
    expect(getNonPondyCityMatch('Puducherry')).toBe(null);
  });

  it('treats empty query or Pondicherry/Puducherry as valid', () => {
    expect(matchesFuzzy('', 'Any Place')).toBe(true);
  });
});

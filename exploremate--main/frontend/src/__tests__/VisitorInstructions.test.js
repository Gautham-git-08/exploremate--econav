import { describe, it, expect } from 'vitest';
import { PLACES } from '../data/places.js';
import { getVisitorInstructions, visitorInstructionsMeta } from '../utils/visitorInstructions.js';

describe('Visitor Instructions Integration', () => {
  it('exports correct metadata with lastReviewed and note', () => {
    expect(visitorInstructionsMeta.lastReviewed).toBe('2026-10-19');
    expect(visitorInstructionsMeta.note).toContain('Rules can change without notice');
  });

  it('matches all 43 places without ambiguity or null results', () => {
    expect(PLACES.length).toBe(43);
    PLACES.forEach(place => {
      const result = getVisitorInstructions(place);
      expect(result, `Missing visitor instructions for: ${place.name}`).not.toBeNull();
      expect(result.visitorInstructions).toBeDefined();
      expect(result.visitorInstructions.photography).toBeTruthy();
      expect(result.visitorInstructions.dressCode).toBeTruthy();
      expect(Array.isArray(result.visitorInstructions.tips)).toBe(true);
      expect(['sourced', 'general']).toContain(result.visitorInstructions.confidence);
    });
  });

  it('verifies the 6 specific sample places from user requirements', () => {
    // 1. Sri Aurobindo Ashram
    const ashram = PLACES.find(p => p.name === 'Sri Aurobindo Ashram');
    const ashramInst = getVisitorInstructions(ashram);
    expect(ashramInst.visitorInstructions.photography).toContain('Not allowed inside the Ashram premises');
    expect(ashramInst.visitorInstructions.dressCode).toContain('Modest clothing');
    expect(ashramInst.visitorInstructions.confidence).toBe('sourced');

    // 2. Matrimandir Viewing Point
    const matrimandir = PLACES.find(p => p.name === 'Matrimandir Viewing Point');
    const matrimandirInst = getVisitorInstructions(matrimandir);
    expect(matrimandirInst.visitorInstructions.photography).toContain('Allowed only from the designated viewing point');
    expect(matrimandirInst.visitorInstructions.confidence).toBe('sourced');

    // 3. Paradise Beach
    const paradise = PLACES.find(p => p.name === 'Paradise Beach');
    const paradiseInst = getVisitorInstructions(paradise);
    expect(paradiseInst.visitorInstructions.tips.some(t => t.includes('Chunnambar Boat House'))).toBe(true);
    expect(paradiseInst.visitorInstructions.confidence).toBe('sourced');

    // 4. Manakula Vinayagar Temple
    const vinayagar = PLACES.find(p => p.name === 'Manakula Vinayagar Temple');
    const vinayagarInst = getVisitorInstructions(vinayagar);
    expect(vinayagarInst.visitorInstructions.photography).toContain('no photos or videos inside');
    expect(vinayagarInst.visitorInstructions.confidence).toBe('sourced');

    // 5. Meeran Mosque
    const meeran = PLACES.find(p => p.name === 'Meeran Mosque');
    const meeranInst = getVisitorInstructions(meeran);
    expect(meeranInst.visitorInstructions.dressCode).toContain('Cover arms and legs');
    expect(meeranInst.visitorInstructions.confidence).toBe('general');

    // 6. Karaikal Beach
    const karaikal = PLACES.find(p => p.name === 'Karaikal Beach');
    const karaikalInst = getVisitorInstructions(karaikal);
    expect(karaikalInst.visitorInstructions.tips.some(t => t.includes('130 km'))).toBe(true);
    expect(karaikalInst.visitorInstructions.confidence).toBe('general');
  });

  it('safely distinguishes between Aayi Mandapam and Bharathi Park', () => {
    const aayi = PLACES.find(p => p.name === 'Aayi Mandapam / Bharathi Park');
    const bharathi = PLACES.find(p => p.name === 'Bharathi Park / Government Park');
    
    const aayiInst = getVisitorInstructions(aayi);
    const bharathiInst = getVisitorInstructions(bharathi);

    expect(aayiInst.name).toBe('Aayi Mandapam / Bharathi Park');
    expect(bharathiInst.name).toBe('Bharathi Park / Government Park');
  });

  it('returns null and does not throw for null, empty, or unknown place', () => {
    expect(() => getVisitorInstructions(null)).not.toThrow();
    expect(getVisitorInstructions(null)).toBeNull();
    expect(getVisitorInstructions({})).toBeNull();
    expect(getVisitorInstructions({ name: 'Unknown Nonexistent Place' })).toBeNull();
  });
});

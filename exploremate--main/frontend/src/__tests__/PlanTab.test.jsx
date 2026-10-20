/**
 * Vitest Unit Tests for Places Data & Smart Planner Engine
 */

import { describe, it, expect } from 'vitest';
import { PLACES, isPlaceOpenNow, CATEGORIES } from '../data/places.js';
import { generateSmartItinerary, haversineDistance, EMISSION_FACTORS } from '../utils/planner.js';

describe('ExploreMate Single Source of Truth Places Data', () => {
  it('contains exactly 43 destinations', () => {
    expect(PLACES.length).toBe(43);
  });

  it('all places have required fields (id, name, category, lat, lng, hours, verified)', () => {
    PLACES.forEach((p) => {
      expect(p.id).toBeDefined();
      expect(p.name).toBeDefined();
      expect(p.category).toBeDefined();
      expect(typeof p.lat).toBe('number');
      expect(typeof p.lng).toBe('number');
      expect(p.hours).toBeDefined();
      expect(typeof p.verified).toBe('boolean');
      expect(CATEGORIES).toContain(p.category);
    });
  });

  it('correctly handles split session hours for Sri Aurobindo Ashram', () => {
    const ashram = PLACES.find(p => p.id === 'aurobindo-ashram');
    expect(ashram).toBeDefined();

    // Morning session: 08:00 - 11:30 AM
    const morningDate = new Date();
    morningDate.setHours(9, 30, 0, 0);
    const morningStatus = isPlaceOpenNow(ashram, morningDate);
    expect(morningStatus.isOpen).toBe(true);

    // Midday break: 12:30 PM (closed)
    const middayDate = new Date();
    middayDate.setHours(12, 30, 0, 0);
    const middayStatus = isPlaceOpenNow(ashram, middayDate);
    expect(middayStatus.isOpen).toBe(false);

    // Afternoon session: 15:00 (open)
    const afternoonDate = new Date();
    afternoonDate.setHours(15, 0, 0, 0);
    const afternoonStatus = isPlaceOpenNow(ashram, afternoonDate);
    expect(afternoonStatus.isOpen).toBe(true);
  });

  it('correctly flags Monday closed for Pondicherry Museum', () => {
    const museum = PLACES.find(p => p.id === 'pondicherry-museum');
    expect(museum).toBeDefined();

    // Mock a Monday (day index 1)
    const monday = new Date('2026-10-19T11:00:00'); // Oct 19, 2026 is Monday
    const status = isPlaceOpenNow(museum, monday);
    expect(status.isOpen).toBe(false);
    expect(status.isClosedToday).toBe(true);
    expect(status.statusText).toBe('Closed today');
  });
});

describe('Smart Planner Engine & CO2 Calculator', () => {
  it('calculates accurate Haversine distance between White Town and Promenade', () => {
    const d = haversineDistance(11.9338, 79.8359, 11.9315, 79.8358);
    expect(d).toBeGreaterThan(0.2);
    expect(d).toBeLessThan(0.4);
  });

  it('generates a scheduled plan with timed stops and CO2 savings', () => {
    const plan = generateSmartItinerary({
      placeIds: ['aurobindo-ashram', 'white-town', 'promenade-beach'],
      budgetConfig: { totalBudget: 5000, days: 1, people: 2, travelMode: 'cycle' }
    });

    expect(plan.days.length).toBe(1);
    expect(plan.days[0].stops.length).toBeGreaterThanOrEqual(3);
    expect(plan.co2Saved).toBeGreaterThan(0);
    expect(plan.totalCost).toBeGreaterThan(0);
  });

  it('warns when total trip cost exceeds budget', () => {
    const plan = generateSmartItinerary({
      placeIds: ['aurobindo-ashram', 'white-town', 'promenade-beach'],
      budgetConfig: { totalBudget: 200, days: 1, people: 2, travelMode: 'car' } // Very low budget
    });

    expect(plan.warnings.some(w => w.includes('budget'))).toBe(true);
  });
});

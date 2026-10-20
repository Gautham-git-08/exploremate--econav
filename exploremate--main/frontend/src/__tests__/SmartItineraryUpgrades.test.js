import { describe, it, expect } from 'vitest';
import { buildItinerary, ACTIVITIES } from '../utils/itineraryEngine.js';
import { generateSmartItinerary, haversineDistance } from '../utils/planner.js';
import { PLACES } from '../data/places.js';

describe('Smart Itinerary Bugfixes and Upgrades', () => {
  const rainyWeather = Array.from({ length: 24 }, (_, h) => ({
    hour: h,
    rainProb: 95,
    precip: 3.5,
    weathercode: 61,
    isRain: true,
    temp: 26
  }));

  const clearWeather = Array.from({ length: 24 }, (_, h) => ({
    hour: h,
    rainProb: 10,
    precip: 0,
    weathercode: 0,
    isRain: false,
    temp: 29
  }));

  it('never produces duplicate stops (visited-ID set dedup)', () => {
    // Under rain, multiple outdoor stops might want the same indoor alternative
    const result = buildItinerary({
      activities: ACTIVITIES,
      weatherByHour: rainyWeather,
      startTime: 9,
      transportMode: 'cycle'
    });

    const stopIds = result.stops.map(s => s.id);
    const uniqueIds = new Set(stopIds);
    expect(uniqueIds.size).toBe(stopIds.length);
  });

  it('guarantees no price or entryFee is undefined or NaN', () => {
    const result = buildItinerary({
      activities: ACTIVITIES,
      weatherByHour: clearWeather,
      startTime: 9
    });

    result.stops.forEach(stop => {
      expect(stop.entryFee).toBeDefined();
      expect(typeof stop.entryFee).toBe('number');
      expect(isNaN(stop.entryFee)).toBe(false);
    });
  });

  it('calculates sane travel legs with real distance and cost', () => {
    const result = buildItinerary({
      activities: ACTIVITIES,
      weatherByHour: clearWeather,
      startTime: 9,
      transportMode: 'car'
    });

    // Except the first stop, all stops should have a travelLeg
    for (let i = 1; i < result.stops.length; i++) {
      const leg = result.stops[i].travelLeg;
      expect(leg).toBeDefined();
      expect(leg.distanceKm).toBeGreaterThan(0);
      expect(leg.durationMin).toBeGreaterThan(0);
      expect(leg.cost).toBeGreaterThanOrEqual(0);
    }
  });

  it('respects budget limits and drops stops if budget is exceeded', () => {
    // Ultra-low budget scenario (₹1100 for 2 people)
    const lowBudgetPlan = generateSmartItinerary({
      placeIds: PLACES.map(p => p.id),
      budgetConfig: {
        totalBudget: 1100, // Barely covers food (1000) + minimal transit
        days: 1,
        people: 2,
        startTime: '08:30',
        travelMode: 'car',
        pace: 'packed'
      },
      lockedPlaceIds: [],
      isRaining: false
    });

    // High budget scenario (₹15000 for 2 people, 2 days)
    const highBudgetPlan = generateSmartItinerary({
      placeIds: PLACES.map(p => p.id),
      budgetConfig: {
        totalBudget: 15000,
        days: 2,
        people: 2,
        startTime: '08:30',
        travelMode: 'car',
        pace: 'packed'
      },
      lockedPlaceIds: [],
      isRaining: false
    });

    expect(lowBudgetPlan.totalCost).toBeLessThanOrEqual(1100 * 1.15);
    expect(highBudgetPlan.totalCost).toBeGreaterThan(lowBudgetPlan.totalCost);
  });

  it('provides whyThisOrder reasons and weather tags on all stops', () => {
    const result = buildItinerary({
      activities: ACTIVITIES,
      weatherByHour: clearWeather,
      startTime: 9
    });

    result.stops.forEach(stop => {
      expect(stop.whyThisOrder).toBeDefined();
      expect(stop.whyThisOrder.length).toBeGreaterThan(5);
      expect(typeof stop.isRain).toBe('boolean');
    });
  });
});

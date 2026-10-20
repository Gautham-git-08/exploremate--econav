import { describe, it, expect } from 'vitest';
import { buildItinerary, ACTIVITIES } from '../utils/itineraryEngine.js';

describe('buildItinerary Pure Engine', () => {
  const clearWeather = Array.from({ length: 24 }, (_, h) => ({
    hour: h,
    rainProb: 10,
    precip: 0,
    weathercode: 0,
    isRain: false,
    temp: 29
  }));

  const rainyWeather = Array.from({ length: 24 }, (_, h) => ({
    hour: h,
    rainProb: 95,
    precip: 3.5,
    weathercode: 61,
    isRain: true,
    temp: 26
  }));

  it('preserves all outdoor activities when there is no rain', () => {
    const itinerary = buildItinerary({
      activities: ACTIVITIES,
      weatherByHour: clearWeather,
      crowdByHour: {},
      startTime: 9
    });

    expect(itinerary.rainSwapsCount).toBe(0);
    expect(itinerary.stops.length).toBe(ACTIVITIES.length);

    // Check that outdoor activities remain outdoor and unswapped
    const outdoorStops = itinerary.stops.filter(s => s.type === 'outdoor');
    expect(outdoorStops.length).toBeGreaterThan(0);
    outdoorStops.forEach(stop => {
      expect(stop.isSwapped).toBe(false);
      expect(stop.originalOutdoor).toBeNull();
    });
  });

  it('swaps outdoor activities to low-crowd indoor alternatives when rain occurs', () => {
    const itinerary = buildItinerary({
      activities: ACTIVITIES,
      weatherByHour: rainyWeather,
      crowdByHour: {},
      startTime: 9
    });

    expect(itinerary.rainSwapsCount).toBeGreaterThan(0);

    // All scheduled stops should now be indoor or sheltered
    itinerary.stops.forEach(stop => {
      if (stop.isSwapped) {
        expect(stop.swapBadge).toBe('Swapped to indoor: rain');
        expect(stop.originalOutdoor).toBeDefined();
        expect(stop.originalOutdoor.name).toBeTruthy();
        expect(stop.type).toBe('indoor');
      }
    });
  });

  it('immediately restores outdoor activities when rain is toggled off', () => {
    // 1. With rain
    const rainyItinerary = buildItinerary({
      activities: ACTIVITIES,
      weatherByHour: rainyWeather,
      crowdByHour: {},
      startTime: 9
    });
    expect(rainyItinerary.rainSwapsCount).toBeGreaterThan(0);

    // 2. Rain toggled off (clear weather passed)
    const restoredItinerary = buildItinerary({
      activities: ACTIVITIES,
      weatherByHour: clearWeather,
      crowdByHour: {},
      startTime: 9
    });
    expect(restoredItinerary.rainSwapsCount).toBe(0);

    const outdoorNames = ACTIVITIES.filter(a => a.type === 'outdoor').map(a => a.name);
    const restoredNames = restoredItinerary.stops.filter(s => s.type === 'outdoor').map(s => s.name);
    expect(restoredNames).toEqual(outdoorNames);
  });

  it('flags and provides crowd advice when crowd score exceeds 70', () => {
    // Force a high crowd on a specific activity
    const customCrowd = {
      'promenade-beach': 85
    };

    const itinerary = buildItinerary({
      activities: ACTIVITIES,
      weatherByHour: clearWeather,
      crowdByHour: customCrowd,
      startTime: 9
    });

    const promenade = itinerary.stops.find(s => s.id === 'promenade-beach');
    expect(promenade).toBeDefined();
    expect(promenade.crowdScore).toBe(85);
    expect(promenade.crowdLevel).toBe('High');
    expect(promenade.crowdAdvice).toBe('Crowded now: best time 4 PM');
  });

  it('gracefully handles edge case when an outdoor place has no indoor alternatives', () => {
    const customOutdoorWithoutAlternatives = [
      {
        id: 'remote-dune',
        name: 'Isolated Sand Dune',
        type: 'outdoor',
        durationMinutes: 60,
        indoorAlternativeIds: [] // No indoor alternatives available
      }
    ];

    const itinerary = buildItinerary({
      activities: customOutdoorWithoutAlternatives,
      weatherByHour: rainyWeather,
      crowdByHour: {},
      startTime: 9
    });

    expect(itinerary.stops.length).toBe(1);
    const stop = itinerary.stops[0];
    expect(stop.isSwapped).toBe(false);
    expect(stop.noAlternativeWarning).toBe('No indoor alternative available; shelter advised');
  });
});

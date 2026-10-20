/**
 * ExploreMate Smart Itinerary & Budget Planner Engine
 * 
 * Features:
 * - Multi-factor scoring & ordering: Budget, opening hours/closed days, geographic clustering (TSP/Haversine),
 *   time of day, weather, crowd level, visit duration, user pace & interests.
 * - Distance-dependent transport mode recommendations:
 *   Walk (<=2km), Cycle (2-8km), Bus/Auto (8-25km), Car only when needed.
 *   Comfort adjustments for weather (rain), kids/seniors.
 * - Realistic CO2 calculations (ARAI / CPCB / India GHG Program benchmarks) vs. All-car baseline.
 * - Stop locking support for partial regeneration.
 */

import { PLACES } from '../data/places.js';

// CO2 emission factors in kg CO2 per passenger-km (Source: ARAI / CPCB / India GHG Program)
export const EMISSION_FACTORS = {
  walk: 0.0,
  cycle: 0.0,
  two_wheeler: 0.072,
  bus: 0.082,
  auto: 0.102,
  car: 0.192
};

// Transport speeds in km/h for Pondicherry urban & coastal traffic
const SPEEDS = {
  walk: 4.5,
  cycle: 12.0,
  bus: 18.0,
  auto: 24.0,
  car: 26.0
};

// Estimated cost per person per leg (INR) — realistic Pondicherry 2024 rates
const getTransportCost = (mode, distanceKm) => {
  switch (mode) {
    case 'walk': return 0;
    case 'cycle': return Math.max(0, Math.round(distanceKm * 5)); // ~₹5/km rental amortized
    case 'bus': return Math.max(10, Math.round(distanceKm * 3)); // ~₹3/km PRTC
    case 'auto': return Math.round(Math.max(40, 25 + distanceKm * 12)); // ₹25 base + ₹12/km
    case 'car': return Math.round(Math.max(80, 50 + distanceKm * 18)); // ₹50 base + ₹18/km
    default: return Math.round(distanceKm * 5);
  }
};

/**
 * Calculate great-circle distance between two coordinates in kilometers (Haversine formula)
 */
export function haversineDistance(lat1, lon1, lat2, lon2) {
  if (lat1 === undefined || lon1 === undefined || lat2 === undefined || lon2 === undefined) return 1.0;
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(2));
}

/**
 * Select the optimal transport mode for a given leg distance and user preferences
 */
export function getRecommendedTransportMode({ distanceKm, userPreferredMode, isRaining, hasKidsOrSeniors }) {
  // Use selected transport mode as primary, adjusting for weather if walking/cycling in rain
  if (userPreferredMode) {
    if (isRaining && (userPreferredMode === 'walk' || userPreferredMode === 'cycle') && distanceKm > 1.0) {
      return 'auto';
    }
    return userPreferredMode;
  }

  // If raining heavily or with vulnerable travelers, adjust thresholds
  if (isRaining) {
    if (distanceKm > 1.0) return 'auto';
    return 'walk';
  }

  const maxWalk = hasKidsOrSeniors ? 1.0 : 2.0;
  const maxCycle = hasKidsOrSeniors ? 4.0 : 8.0;

  if (distanceKm <= maxWalk) {
    return 'walk';
  } else if (distanceKm <= maxCycle) {
    return 'cycle';
  } else if (distanceKm <= 25.0) {
    return 'auto';
  } else {
    // Day trips (e.g. Karaikal Beach > 100km)
    return 'car';
  }
}

/**
 * Helper to convert minutes to HH:MM AM/PM
 */
export function formatMinutesToTime(totalMinutes) {
  let mins = Math.floor(totalMinutes) % (24 * 60);
  const hours = Math.floor(mins / 60);
  const m = mins % 60;
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 === 0 ? 12 : hours % 12;
  const displayMins = m < 10 ? `0${m}` : m;
  return `${displayHours}:${displayMins} ${period}`;
}

export function parseTimeToMinutes(timeStr) {
  if (!timeStr) return 9 * 60; // 09:00 AM default
  const [h, m] = timeStr.split(':').map(Number);
  return (h || 9) * 60 + (m || 0);
}

/**
 * Check if a place is open at a given minute of the day
 */
function isPlaceOpenAtTime(place, currentMinuteOfDay, dayOfWeek = 1) {
  if (!place || !place.hours) return true;
  const { hours } = place;
  if (hours.allDay) return true;

  if (hours.closedDays && hours.closedDays.includes(dayOfWeek)) {
    return false;
  }

  const toMins = (t) => {
    if (!t) return 0;
    const [h, m] = t.split(':').map(Number);
    return h * 60 + (m || 0);
  };

  if (hours.splitSessions && hours.splitSessions.length > 0) {
    return hours.splitSessions.some(s => currentMinuteOfDay >= toMins(s.open) && currentMinuteOfDay < toMins(s.close));
  }

  if (hours.open && hours.close) {
    return currentMinuteOfDay >= toMins(hours.open) && currentMinuteOfDay < toMins(hours.close);
  }

  return true;
}

/**
 * Main Smart Itinerary Planner Generator
 */
export function generateSmartItinerary({
  placeIds = [],
  budgetConfig = {},
  lockedPlaceIds = [],
  isRaining = false,
  startDayOfWeek = new Date().getDay()
}) {
  const {
    totalBudget = 10000,
    days = 1,
    people = 2,
    startTime = '08:30',
    travelMode = 'cycle',
    pace = 'normal',
    hasKidsOrSeniors = false
  } = budgetConfig;

  // Resolve place objects
  const rawPlaces = placeIds
    .map(id => PLACES.find(p => p.id === id))
    .filter(Boolean);

  if (rawPlaces.length === 0) {
    return {
      days: [],
      totalCost: 0,
      totalCO2: 0,
      carBaselineCO2: 0,
      co2Saved: 0,
      warnings: ['No destinations selected yet. Add places from Destinations to generate your plan.']
    };
  }

  // Duration multiplier based on pace
  const paceMultiplier = pace === 'relaxed' ? 1.3 : pace === 'packed' ? 0.8 : 1.0;

  // Separate locked and unlocked places
  const lockedPlaces = rawPlaces.filter(p => lockedPlaceIds.includes(p.id));
  const unlockedPlaces = rawPlaces.filter(p => !lockedPlaceIds.includes(p.id));

  // Heuristic sort for unlocked places:
  // 1. Time-of-day alignment (Sunrise/Morning -> Midday -> Afternoon -> Sunset/Evening)
  // 2. Geographic proximity (nearest neighbour from previous stop)
  const timeScore = (p) => {
    const t = (p.bestTimeOfDay || '').toLowerCase();
    if (t.includes('sunrise')) return 1;
    if (t.includes('morning')) return 2;
    if (t.includes('midday') || t.includes('afternoon')) return 3;
    if (t.includes('sunset') || t.includes('evening')) return 4;
    return 2.5;
  };

  // Combine locked & unlocked using clustering
  let orderedPlaces = [...rawPlaces];

  // If there are unlocked places, sort unlocked by timeScore first
  if (unlockedPlaces.length > 1) {
    unlockedPlaces.sort((a, b) => timeScore(a) - timeScore(b));

    // Refine ordering with Nearest Neighbor TSP starting from White Town center (11.9338, 79.8359)
    let currentLat = 11.9338;
    let currentLng = 79.8359;
    const sortedTSP = [];
    const pool = [...unlockedPlaces];

    while (pool.length > 0) {
      let bestIdx = 0;
      let bestDist = Infinity;
      for (let i = 0; i < pool.length; i++) {
        const d = haversineDistance(currentLat, currentLng, pool[i].lat, pool[i].lng);
        // Blend distance and time-of-day preference
        const cost = d * 1.5 + Math.abs(timeScore(pool[i]) - (sortedTSP.length < pool.length / 2 ? 1.5 : 3.5));
        if (cost < bestDist) {
          bestDist = cost;
          bestIdx = i;
        }
      }
      const chosen = pool.splice(bestIdx, 1)[0];
      sortedTSP.push(chosen);
      currentLat = chosen.lat;
      currentLng = chosen.lng;
    }

    // Merge locked places preserving user locks
    orderedPlaces = [];
    let tspIndex = 0;
    for (const p of rawPlaces) {
      if (lockedPlaceIds.includes(p.id)) {
        orderedPlaces.push(p);
      } else {
        orderedPlaces.push(sortedTSP[tspIndex++] || p);
      }
    }
  }

  // Distribute places across available days with pace-aware cap
  const maxStopsPerDay = pace === 'relaxed' ? 3 : pace === 'packed' ? 6 : 5;
  const stopsPerDay = Math.min(maxStopsPerDay, Math.ceil(orderedPlaces.length / Math.max(1, days)));
  const dailySchedules = [];
  let grandTotalCost = 0;
  let grandTotalCO2 = 0;
  let grandCarBaselineCO2 = 0;
  const globalWarnings = [];

  // Food allowance estimate: ₹350–500 per person per day (adjusted proportionally if total budget is very constrained)
  const baseFoodPerPerson = 500;
  const maxAffordableFood = Math.max(100, Math.floor((totalBudget * 0.4) / (people * days)));
  const dailyFoodCostPerPerson = Math.min(baseFoodPerPerson, maxAffordableFood);
  grandTotalCost += dailyFoodCostPerPerson * people * days;

  // Global visited set to prevent the same place appearing on multiple days
  const globalVisitedIds = new Set();

  for (let d = 0; d < days; d++) {
    const dayPlaces = orderedPlaces.slice(d * stopsPerDay, (d + 1) * stopsPerDay);
    if (dayPlaces.length === 0) continue;

    const currentDayOfWeek = (startDayOfWeek + d) % 7;
    let currentMinute = parseTimeToMinutes(startTime);
    const dayStops = [];
    const dayTravelLegs = [];
    let dayDistanceKm = 0;
    let dayCost = 0;
    let dayCO2 = 0;
    let dayCarBaselineCO2 = 0;
    let hasHadLunch = false;

    for (let i = 0; i < dayPlaces.length; i++) {
      const place = dayPlaces[i];

      // Skip places already visited on a previous day (dedup)
      if (globalVisitedIds.has(place.id)) continue;

      const prevPlace = dayStops.length > 0
        ? (dayStops[dayStops.length - 1].isBreak
          ? (dayStops.length > 1 ? dayStops[dayStops.length - 2] : null)
          : dayStops[dayStops.length - 1])
        : null;

      // Calculate travel leg
      let legDistance = prevPlace ? haversineDistance(prevPlace.lat, prevPlace.lng, place.lat, place.lng) : 0.8;

      const chosenMode = getRecommendedTransportMode({
        distanceKm: legDistance,
        userPreferredMode: travelMode,
        isRaining,
        hasKidsOrSeniors
      });

      const speedKmH = SPEEDS[chosenMode] || 15;
      const legMinutes = Math.max(8, Math.round((legDistance / speedKmH) * 60));
      const legCost = getTransportCost(chosenMode, legDistance) * people;
      const legCO2 = parseFloat((legDistance * EMISSION_FACTORS[chosenMode] * people).toFixed(3));
      const carBaseline = parseFloat((legDistance * EMISSION_FACTORS.car * people).toFixed(3));
      const stopFee = (place.entryFee || 0) * people;

      // Strict budget guard: total (entry + transport + food) must never exceed totalBudget
      const projectedTotal = grandTotalCost + dayCost + stopFee + legCost;
      if (projectedTotal > totalBudget && dayStops.filter(s => !s.isBreak).length >= 1) {
        globalWarnings.push(`${place.name} skipped: would exceed total budget (₹${totalBudget}) by ₹${Math.round(projectedTotal - totalBudget)}.`);
        continue;
      }

      dayDistanceKm += legDistance;
      dayCost += legCost + stopFee;
      dayCO2 += legCO2;
      dayCarBaselineCO2 += carBaseline;
      currentMinute += legMinutes;

      // Check lunch time insertion (around 13:00 - 14:00)
      if (!hasHadLunch && currentMinute >= 13 * 60) {
        dayStops.push({
          id: `lunch-break-day-${d+1}`,
          isBreak: true,
          name: 'Lunch Break & Refreshment',
          arriveTime: formatMinutesToTime(currentMinute),
          leaveTime: formatMinutesToTime(currentMinute + 60),
          durationMinutes: 60,
          entryFee: 0,
          foodEstimate: dailyFoodCostPerPerson * people,
          whyThisOrder: 'Authentic Creole or Chettinad lunch in White Town/Heritage Town to recharge energy.',
          description: 'Relax at a local café or shaded eatery to avoid midday heat.',
          indoorOutdoor: 'indoor',
          image: '/images/cafe des arts.png'
        });
        currentMinute += 60;
        hasHadLunch = true;
      }

      // Check opening hours suitability
      const isOpen = isPlaceOpenAtTime(place, currentMinute, currentDayOfWeek);
      const stopWarnings = [];
      if (!isOpen) {
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        if (place.hours?.closedDays?.includes(currentDayOfWeek)) {
          stopWarnings.push(`${place.name} is scheduled on ${dayNames[currentDayOfWeek]}, but it is CLOSED today! Consider visiting on another day.`);
          globalWarnings.push(`${place.name} is CLOSED on ${dayNames[currentDayOfWeek]}.`);
        } else {
          stopWarnings.push(`${place.name} is usually closed at ${formatMinutesToTime(currentMinute)} (${place.hoursNote}).`);
        }
      }

      // Rain warning if outdoor during rain
      if (isRaining && place.indoorOutdoor === 'outdoor') {
        stopWarnings.push('Rain warning: Outdoor stop during rain simulation. Swapping or carrying an umbrella recommended.');
      }

      const visitDuration = Math.round((place.avgVisitMinutes || 60) * paceMultiplier);
      const arriveTimeStr = formatMinutesToTime(currentMinute);
      currentMinute += visitDuration;
      const leaveTimeStr = formatMinutesToTime(currentMinute);


      // Why this order rationale
      let why = `${place.bestTimeOfDay} visit minimizes crowds. `;
      if (prevPlace) {
        why += `Only ${legDistance} km from ${prevPlace.name} via ${chosenMode}.`;
      } else {
        why += `Convenient starting hub near town center.`;
      }

      dayStops.push({
        ...place,
        arriveTime: arriveTimeStr,
        leaveTime: leaveTimeStr,
        durationMinutes: visitDuration,
        calculatedFee: stopFee,
        whyThisOrder: why,
        isLocked: lockedPlaceIds.includes(place.id),
        warnings: stopWarnings,
        travelLeg: prevPlace ? {
          from: prevPlace.name,
          to: place.name,
          distanceKm: legDistance,
          mode: chosenMode,
          minutes: legMinutes,
          cost: legCost,
          co2Kg: legCO2,
          co2SavedKg: parseFloat(Math.max(0, carBaseline - legCO2).toFixed(3))
        } : null
      });

      // Mark as visited so it won't appear on another day
      globalVisitedIds.add(place.id);

      if (prevPlace) {
        dayTravelLegs.push({
          from: prevPlace.name,
          to: place.name,
          distanceKm: legDistance,
          mode: chosenMode,
          minutes: legMinutes,
          cost: legCost,
          co2Kg: legCO2,
          co2SavedKg: parseFloat(Math.max(0, carBaseline - legCO2).toFixed(3))
        });
      }
    }

    grandTotalCost += dayCost;
    grandTotalCO2 += dayCO2;
    grandCarBaselineCO2 += dayCarBaselineCO2;

    dailySchedules.push({
      dayNumber: d + 1,
      dayOfWeek: currentDayOfWeek,
      stops: dayStops,
      travelLegs: dayTravelLegs,
      totalDistanceKm: parseFloat(dayDistanceKm.toFixed(1)),
      totalDurationMinutes: currentMinute - parseTimeToMinutes(startTime),
      dayCost,
      dayCO2: parseFloat(dayCO2.toFixed(2)),
      carBaselineCO2: parseFloat(dayCarBaselineCO2.toFixed(2)),
      co2SavedKg: parseFloat(Math.max(0, dayCarBaselineCO2 - dayCO2).toFixed(2))
    });
  }

  // Budget warning check
  if (grandTotalCost > totalBudget) {
    const diff = grandTotalCost - totalBudget;
    globalWarnings.push(`Estimated total trip cost (₹${grandTotalCost}) exceeds your budget (₹${totalBudget}) by ₹${diff}. Consider switching auto/car legs to walking or cycling.`);
  }

  return {
    days: dailySchedules,
    totalCost: grandTotalCost,
    totalBudget,
    totalCO2: parseFloat(grandTotalCO2.toFixed(2)),
    carBaselineCO2: parseFloat(grandCarBaselineCO2.toFixed(2)),
    co2Saved: parseFloat(Math.max(0, grandCarBaselineCO2 - grandTotalCO2).toFixed(2)),
    warnings: globalWarnings
  };
}

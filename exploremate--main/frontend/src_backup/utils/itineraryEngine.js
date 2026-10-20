/**
 * ExploreMate Pure Itinerary Engine
 * 
 * Features:
 * - Pure, unit-tested function: buildItinerary({ activities, weatherByHour, crowdByHour, startTime, transportMode })
 * - Weather-aware replanning: Swaps outdoor activities to low-crowd sheltered indoor alternatives when rain or thunderstorm occurs
 * - Displays original outdoor place with strike-through ("Originally: Beach Walk") and swap badge
 * - Restores outdoor activities immediately when rain simulation is turned off
 * - Crowd optimization: shifts high-crowd slots (>70) or flags "Crowded now: best time 4 PM"
 * - Handles edge case when no indoor alternative is available
 */

import { IMAGE_MAP, NEUTRAL_PLACEHOLDER } from '../config/images.map.js';

export const ACTIVITIES = [
  {
    id: 'promenade-beach',
    name: 'Promenade Beach Walk',
    type: 'outdoor',
    category: 'Coastal',
    durationMinutes: 90,
    location: { lat: 11.9318, lng: 79.8358 },
    image: IMAGE_MAP['promenade-beach']?.src || '/images/rock_beach.png',
    description: 'Brisk oceanfront stroll along the basalt seawall, Gandhi statue, and French War Memorial.',
    crowdByHour: [10, 10, 10, 15, 25, 45, 65, 80, 50, 35, 30, 25, 25, 30, 35, 55, 85, 95, 90, 75, 45, 25, 15, 10],
    indoorAlternativeIds: ['pondicherry-museum', 'casablanca-boutique', 'cluny-embroidery']
  },
  {
    id: 'white-town',
    name: 'White Town Heritage Walking Tour',
    type: 'outdoor',
    category: 'Heritage',
    durationMinutes: 75,
    location: { lat: 11.9338, lng: 79.8341 },
    image: IMAGE_MAP['white-town']?.src || '/images/white_town_reference.jpg.jpeg',
    description: 'Explore pastel mustard villas, arched bougainvillea gateways, and historic French street names.',
    crowdByHour: [5, 5, 5, 10, 20, 35, 55, 60, 50, 40, 35, 30, 30, 35, 40, 50, 70, 75, 60, 45, 25, 15, 10, 5],
    indoorAlternativeIds: ['pondicherry-museum', 'aurobindo-ashram', 'casablanca-boutique']
  },
  {
    id: 'matrimandir-centre',
    name: 'Matrimandir Viewing Point & Gardens',
    type: 'outdoor',
    category: 'Spiritual',
    durationMinutes: 120,
    location: { lat: 12.0070, lng: 79.8107 },
    image: IMAGE_MAP['matrimandir-viewing-point']?.src || '/images/matrimandir_auroville.png',
    description: 'Iconic golden sphere meditation sanctuary set within 12 peaceful landscaped gardens.',
    crowdByHour: [0, 0, 0, 0, 0, 0, 0, 0, 30, 65, 80, 85, 60, 50, 75, 85, 40, 0, 0, 0, 0, 0, 0, 0],
    indoorAlternativeIds: ['aurobindo-ashram', 'pondicherry-museum']
  },
  {
    id: 'serenity-beach',
    name: 'Serenity Beach Sunrise & Pier',
    type: 'outdoor',
    category: 'Coastal',
    durationMinutes: 90,
    location: { lat: 11.9688, lng: 79.8436 },
    image: IMAGE_MAP['serenity-beach']?.src || '/images/serenity_beach_coast.jpg.jpeg',
    description: 'Rocky groin pier, artisanal fishing catamarans, and gentle morning coastal surf.',
    crowdByHour: [15, 15, 20, 30, 40, 60, 70, 50, 30, 20, 20, 20, 25, 30, 40, 55, 75, 80, 60, 35, 20, 15, 10, 10],
    indoorAlternativeIds: ['cafe-des-arts', 'casablanca-boutique']
  },
  {
    id: 'pondicherry-museum',
    name: 'Pondicherry Museum',
    type: 'indoor',
    category: 'Culture',
    durationMinutes: 60,
    location: { lat: 11.9345, lng: 79.8348 },
    image: IMAGE_MAP['pondicherry-museum']?.src || '/images/pondicherry_museum.jpg.jpeg',
    description: 'Sheltered galleries displaying Arikamedu Roman trade beads, French colonial transport, and bronze artifacts.',
    crowdByHour: [0, 0, 0, 0, 0, 0, 0, 0, 15, 30, 45, 55, 40, 35, 50, 60, 40, 0, 0, 0, 0, 0, 0, 0],
    indoorAlternativeIds: []
  },
  {
    id: 'aurobindo-ashram',
    name: 'Sri Aurobindo Ashram',
    type: 'indoor',
    category: 'Spiritual',
    durationMinutes: 60,
    location: { lat: 11.9366, lng: 79.8354 },
    image: IMAGE_MAP['aurobindo-ashram']?.src || '/images/aurobindo_ashram.png',
    description: 'Peaceful spiritual sanctuary and quiet flower-covered meditation courtyard housing the Samadhi.',
    crowdByHour: [0, 0, 0, 0, 0, 0, 0, 0, 45, 60, 75, 70, 20, 20, 40, 60, 70, 55, 0, 0, 0, 0, 0, 0],
    indoorAlternativeIds: []
  },
  {
    id: 'casablanca-boutique',
    name: 'Casablanca Heritage Boutique',
    type: 'indoor',
    category: 'Lifestyle',
    durationMinutes: 45,
    location: { lat: 11.9325, lng: 79.8318 },
    image: IMAGE_MAP['casablanca-boutique']?.src || '/images/casablanca.png',
    description: 'Air-conditioned multi-level boutique featuring Auroville pottery, handloom linens, and courtyard cafe.',
    crowdByHour: [0, 0, 0, 0, 0, 0, 0, 0, 0, 15, 25, 35, 40, 45, 50, 65, 75, 80, 70, 40, 10, 0, 0, 0],
    indoorAlternativeIds: []
  },
  {
    id: 'cafe-des-arts',
    name: 'Café des Arts Courtyard',
    type: 'indoor',
    category: 'Dining',
    durationMinutes: 45,
    location: { lat: 11.9332, lng: 79.8340 },
    image: IMAGE_MAP['cafe-des-arts']?.src || '/images/cafe des arts.png',
    description: 'Vintage sheltered bohemian colonial café garden on Rue Suffren with espresso and crepes.',
    crowdByHour: [0, 0, 0, 0, 0, 0, 0, 0, 20, 40, 55, 60, 50, 40, 35, 45, 65, 70, 50, 20, 0, 0, 0, 0],
    indoorAlternativeIds: []
  }
];

/**
 * Helper to determine if an hour has rain or storm conditions
 */
export function isHourRainy(weatherInfo = {}) {
  const { rainProb = 0, precip = 0, precipitation = 0, weathercode = 0, isRain = false } = weatherInfo;
  if (isRain) return true;
  if (rainProb >= 60) return true;
  const p = Math.max(precip, precipitation);
  if (p > 0.5) return true;
  // WMO codes: 51-67 (drizzle/rain), 80-82 (rain showers), 95-99 (thunderstorm)
  const isRainCode = (weathercode >= 51 && weathercode <= 67) ||
                     (weathercode >= 80 && weathercode <= 82) ||
                     (weathercode >= 95 && weathercode <= 99);
  return isRainCode;
}

/**
 * Pure, deterministic itinerary planner function
 */
export function buildItinerary({
  activities = ACTIVITIES,
  weatherByHour = [],
  crowdByHour = {},
  startTime = 9,
  transportMode = 'cycle'
}) {
  let currentMinute = startTime * 60;
  const scheduledStops = [];
  let rainSwapsCount = 0;
  let totalTravelMinutes = 0;
  const weatherAlerts = [];

  // Default sequence if not passed
  const baseActivities = activities.length > 0 ? activities : ACTIVITIES;

  for (let i = 0; i < baseActivities.length; i++) {
    const act = baseActivities[i];
    const currentHour = Math.floor(currentMinute / 60) % 24;

    // Look up weather info for this hour
    const weatherInfo = Array.isArray(weatherByHour)
      ? (weatherByHour.find(w => w.hour === currentHour) || { rainProb: 10, temp: 29, isRain: false })
      : (weatherByHour[currentHour] || { rainProb: 10, temp: 29, isRain: false });

    const isRain = isHourRainy(weatherInfo);

    if (weatherInfo.weathercode >= 95 && !weatherAlerts.some(a => a.includes(currentHour))) {
      const displayH = currentHour > 12 ? `${currentHour - 12} PM` : `${currentHour} AM`;
      weatherAlerts.push(`Thunderstorm expected around ${displayH}`);
    }

    // Crowd evaluation
    const defaultCrowd = (act.crowdByHour && act.crowdByHour[currentHour]) ?? 35;
    const crowdScore = crowdByHour[act.id] !== undefined 
      ? (Array.isArray(crowdByHour[act.id]) ? crowdByHour[act.id][currentHour] : crowdByHour[act.id])
      : defaultCrowd;

    let finalStop = { ...act };
    let isSwapped = false;
    let swapBadge = '';
    let originalOutdoor = null;
    let noAlternativeWarning = null;

    // If outdoor and rainy -> Replace with indoor alternative
    if (isRain && act.type === 'outdoor') {
      if (act.indoorAlternativeIds && act.indoorAlternativeIds.length > 0) {
        // Resolve indoor candidates from all available activities
        const candidates = act.indoorAlternativeIds
          .map(id => ACTIVITIES.find(a => a.id === id) || baseActivities.find(a => a.id === id))
          .filter(Boolean);

        if (candidates.length > 0) {
          // Choose candidate with lowest crowd score at this hour
          candidates.sort((a, b) => {
            const cA = (a.crowdByHour && a.crowdByHour[currentHour]) || 40;
            const cB = (b.crowdByHour && b.crowdByHour[currentHour]) || 40;
            return cA - cB;
          });

          const chosen = candidates[0];
          finalStop = { ...chosen };
          isSwapped = true;
          swapBadge = 'Swapped to indoor: rain';
          originalOutdoor = {
            name: act.name,
            id: act.id,
            type: act.type
          };
          rainSwapsCount++;
        } else {
          noAlternativeWarning = 'No indoor alternative available; shelter advised';
        }
      } else {
        noAlternativeWarning = 'No indoor alternative available; shelter advised';
      }
    }

    // High crowd check (>70)
    let crowdAdvice = null;
    if (crowdScore > 70) {
      crowdAdvice = 'Crowded now: best time 4 PM';
    }

    // Crowd badge classification
    let crowdLevel = 'Low';
    let crowdBadgeColor = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300';
    if (crowdScore > 70) {
      crowdLevel = 'High';
      crowdBadgeColor = 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300';
    } else if (crowdScore > 40) {
      crowdLevel = 'Medium';
      crowdBadgeColor = 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300';
    }

    // Time calculations
    const startH = Math.floor(currentMinute / 60);
    const startM = currentMinute % 60;
    const duration = finalStop.durationMinutes || 60;
    const endMinutes = currentMinute + duration;
    const endH = Math.floor(endMinutes / 60);
    const endM = endMinutes % 60;

    const formatTime = (h, m) => {
      const displayH = h % 12 === 0 ? 12 : h % 12;
      const period = h >= 12 && h < 24 ? 'PM' : 'AM';
      return `${displayH}:${String(m).padStart(2, '0')} ${period}`;
    };

    const timeSlotStr = `${formatTime(startH, startM)} - ${formatTime(endH, endM)}`;

    // Travel time estimate to next stop (~12-15 mins)
    const legTravelTime = i < baseActivities.length - 1 ? 15 : 0;
    totalTravelMinutes += legTravelTime;

    scheduledStops.push({
      ...finalStop,
      timeSlot: timeSlotStr,
      startHour: currentHour,
      durationMinutes: duration,
      crowdScore,
      crowdLevel,
      crowdBadgeColor,
      crowdAdvice,
      isRain,
      isSwapped,
      swapBadge,
      originalOutdoor,
      noAlternativeWarning,
      weatherTemp: weatherInfo.temp || 29,
      weatherCode: weatherInfo.weathercode || (isRain ? 61 : 0)
    });

    // Advance time: duration + travel leg
    currentMinute += duration + legTravelTime;
  }

  return {
    stops: scheduledStops,
    rainSwapsCount,
    totalActivities: scheduledStops.length,
    totalTravelMinutes,
    weatherAlerts,
    startTime
  };
}

// Backwards compatibility alias
export const buildSmartItinerary = ({
  activities = ACTIVITIES,
  isRainSimulator = false,
  rainIntensity = 'moderate',
  hourlyWeather = [],
  startTimeHour = 9,
  transportMode = 'cycle'
}) => {
  // Construct weatherByHour respecting simulation toggle
  const weatherByHour = Array.from({ length: 24 }, (_, h) => {
    if (isRainSimulator) {
      return {
        hour: h,
        rainProb: 90,
        precip: rainIntensity === 'heavy' ? 4.5 : rainIntensity === 'light' ? 0.8 : 2.0,
        weathercode: rainIntensity === 'heavy' ? 95 : 61,
        isRain: true,
        temp: 26
      };
    }
    const real = hourlyWeather.find(w => w.hour === h);
    return real || { hour: h, rainProb: 15, precip: 0, weathercode: 0, isRain: false, temp: 29 };
  });

  return buildItinerary({
    activities,
    weatherByHour,
    startTime: startTimeHour,
    transportMode
  });
};

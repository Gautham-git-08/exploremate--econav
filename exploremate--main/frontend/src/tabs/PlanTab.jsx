/**
 * ExploreMate Smart Itinerary & Budget Planner Tab
 * 
 * Features:
 * - Prominent Weather Control Bar:
 *   - "Simulate Rain" toggle switch (Off / On) with umbrella / cloud icon
 *   - Weather mode selector: "Live weather", "Simulate light rain", "Simulate thunderstorm"
 *   - Real Open-Meteo API integration for Pondicherry (11.9416, 79.8083)
 *   - Rain alert banner when simulation is active
 *   - Animated Rain/Lightning canvas effect
 * - Pure buildItinerary Engine integration:
 *   - Replaces outdoor activities with low-crowd indoor alternatives when rain occurs
 *   - Displays "Swapped to indoor: rain" badge and original outdoor activity struck through
 *   - Crowd optimization: badges (Low/Medium/High) and crowd shift alert (>70: "Crowded now: best time 4 PM")
 *   - Graceful fallback when no indoor alternative is available
 *   - Automatic instant restoration when rain is toggled OFF
 * - Full multi-factor optimization from src/utils/planner.js
 * - Interactive budget, duration, travelers, pace, mode, and kids/seniors controls
 * - Day-by-day vertical timeline with arrive/leave times, visit durations, fees, and "Why this order"
 * - Mode-specific travel legs with distance, duration, estimated cost, and CO2 calculation
 * - Stop locking mechanism (pinned stops stay intact during Regenerate)
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calendar, Clock, CloudRain, Sun, CloudLightning, Users, Lock, Unlock, RefreshCw, 
  Trash2, AlertTriangle, ShieldCheck, Footprints, Bike, Bus, Car, 
  DollarSign, CheckCircle2, ChevronRight, Compass, Plus, Printer, ArrowRight,
  Umbrella, Waves, Wind
} from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { useSettings } from '../context/SettingsContext.jsx';
import { generateSmartItinerary } from '../utils/planner.js';
import { buildItinerary, ACTIVITIES } from '../utils/itineraryEngine.js';
import { getRoadDistance } from '../utils/osrm.js';
import { FALLBACK_IMAGE, PLACES } from '../data/places.js';
import RainEffect from '../components/common/RainEffect.jsx';
import DistanceCalculator from '../components/common/DistanceCalculator.jsx';

export default function PlanTab({ setActiveTab }) {
  const { 
    itineraryIds, 
    selectedPlaces, 
    budgetConfig, 
    updateBudget, 
    lockedPlaceIds, 
    toggleLockPlace, 
    removePlaceFromItinerary,
    addPlaceToItinerary,
    clearItinerary
  } = useApp();

  const { weatherSimulation, setWeatherSimulation, reduceMotion } = useSettings();
  const [selectedDayTab, setSelectedDayTab] = useState(1);
  const [regenSeed, setRegenSeed] = useState(0);

  // Enriched stops state: pureItinerary stops after OSRM road-distance enrichment
  const [enrichedStops, setEnrichedStops] = useState([]);

  // Live Open-Meteo weather state
  const [liveWeather, setLiveWeather] = useState(null);
  const [isLoadingWeather, setIsLoadingWeather] = useState(false);

  // Fetch Open-Meteo forecast for Pondicherry
  useEffect(() => {
    let isMounted = true;
    async function fetchForecast() {
      try {
        setIsLoadingWeather(true);
        const res = await fetch(
          'https://api.open-meteo.com/v1/forecast?latitude=11.9416&longitude=79.8083&hourly=temperature_2m,precipitation_probability,precipitation,weathercode&forecast_days=3'
        );
        if (!res.ok) throw new Error('Weather API error');
        const data = await res.json();
        if (isMounted && data.hourly) {
          // Format into hourly array
          const hourly = data.hourly.time.map((timeStr, idx) => {
            const date = new Date(timeStr);
            const hour = date.getHours();
            const rainProb = data.hourly.precipitation_probability ? data.hourly.precipitation_probability[idx] : 0;
            const precip = data.hourly.precipitation ? data.hourly.precipitation[idx] : 0;
            const weathercode = data.hourly.weathercode ? data.hourly.weathercode[idx] : 0;
            const temp = data.hourly.temperature_2m ? data.hourly.temperature_2m[idx] : 29;

            const isRain = rainProb >= 60 || precip > 0.5 ||
              (weathercode >= 51 && weathercode <= 67) ||
              (weathercode >= 80 && weathercode <= 82) ||
              (weathercode >= 95 && weathercode <= 99);

            return { hour, rainProb, precip, weathercode, temp, isRain };
          });
          setLiveWeather(hourly);
        }
      } catch (err) {
        console.warn('Could not fetch Open-Meteo weather, using coastal default', err);
      } finally {
        if (isMounted) setIsLoadingWeather(false);
      }
    }

    fetchForecast();
    return () => { isMounted = false; };
  }, []);

  // Weather simulation flags
  const isSimulated = weatherSimulation === 'light_rain' || 
                      weatherSimulation === 'heavy_rain' || 
                      weatherSimulation === 'thunderstorm';

  // Current live rain check (if mode is 'live')
  const currentHour = new Date().getHours();
  const currentLiveHourWeather = liveWeather?.find(w => w.hour === currentHour);
  const isLiveRaining = weatherSimulation === 'live' && currentLiveHourWeather?.isRain;

  const isRaining = isSimulated || isLiveRaining;

  // Toggle simulate rain switch
  const handleToggleSimulateRain = () => {
    if (isSimulated) {
      setWeatherSimulation('live');
    } else {
      setWeatherSimulation('light_rain');
    }
  };

  // Weather mode change handler
  const handleWeatherModeSelect = (mode) => {
    setWeatherSimulation(mode);
  };

  // Calculate hourly weather for itineraryEngine
  const activeWeatherByHour = useMemo(() => {
    if (isSimulated) {
      const isThunder = weatherSimulation === 'thunderstorm';
      return Array.from({ length: 24 }, (_, h) => ({
        hour: h,
        rainProb: 95,
        precip: isThunder ? 6.5 : 2.5,
        weathercode: isThunder ? 95 : 61,
        isRain: true,
        temp: 26
      }));
    }
    if (liveWeather && liveWeather.length > 0) {
      return liveWeather;
    }
    return Array.from({ length: 24 }, (_, h) => ({
      hour: h,
      rainProb: 15,
      precip: 0,
      weathercode: 0,
      isRain: false,
      temp: 29
    }));
  }, [isSimulated, weatherSimulation, liveWeather]);

  // Convert selected places to activities for pure buildItinerary
  const activeActivities = useMemo(() => {
    if (selectedPlaces.length > 0) {
      return selectedPlaces.map(p => {
        // Map indoorAlternativeIds or find suitable ones
        const defaultAlternativeIds = p.indoorOutdoor === 'outdoor'
          ? (p.category === 'Beaches' ? ['pondicherry-museum', 'casablanca-boutique'] : ['aurobindo-ashram', 'pondicherry-museum'])
          : [];

        return {
          id: p.id,
          name: p.name,
          type: p.indoorOutdoor || (['Beaches', 'Parks', 'Day trips'].includes(p.category) ? 'outdoor' : 'indoor'),
          category: p.category,
          durationMinutes: p.avgVisitMinutes || 60,
          location: { lat: p.lat, lng: p.lng },
          image: p.image || FALLBACK_IMAGE,
          description: p.description,
          entryFee: p.entryFee || 0,
          crowdByHour: p.crowdLevel ? [20, 20, 20, 30, 45, 60, 75, 80, 60, 40, 30, 30, 35, 45, 60, 75, 85, 90, 75, 50, 30, 20, 15, 10] : [35],
          indoorAlternativeIds: defaultAlternativeIds
        };
      });
    }
    // Only schedule places when user has added destinations (no fixed default spots)
    return [];
  }, [selectedPlaces]);

  // Execute pure itinerary calculation
  const startHour = parseInt((budgetConfig.startTime || '09:00').split(':')[0], 10) || 9;
  const pureItinerary = useMemo(() => {
    if (activeActivities.length === 0) {
      return {
        stops: [],
        rainSwapsCount: 0,
        totalActivities: 0,
        totalTravelMinutes: 0,
        weatherAlerts: [],
        startTime: startHour
      };
    }
    return buildItinerary({
      activities: activeActivities,
      weatherByHour: activeWeatherByHour,
      crowdByHour: {},
      startTime: startHour,
      transportMode: budgetConfig.travelMode
    });
  }, [activeActivities, activeWeatherByHour, startHour, budgetConfig.travelMode]);

  // Async OSRM enrichment: upgrade travelLeg.distanceKm / durationMin on pureItinerary stops
  useEffect(() => {
    if (!pureItinerary?.stops?.length) { setEnrichedStops([]); return; }
    let cancelled = false;
    // Start with haversine-based stops immediately
    setEnrichedStops([...pureItinerary.stops]);

    async function enrich() {
      const updated = pureItinerary.stops.map(s => ({ ...s }));
      for (let i = 1; i < updated.length; i++) {
        const prev = updated[i - 1];
        const curr = updated[i];
        if (prev?.location && curr?.location) {
          try {
            const road = await getRoadDistance(
              prev.location.lat, prev.location.lng,
              curr.location.lat, curr.location.lng,
              budgetConfig.travelMode
            );
            if (!cancelled && curr.travelLeg) {
              curr.travelLeg = {
                ...curr.travelLeg,
                distanceKm: road.distanceKm,
                durationMin: road.durationMin,
                minutes: road.durationMin,
                source: road.source
              };
            }
          } catch { /* keep haversine fallback */ }
        }
      }
      if (!cancelled) setEnrichedStops(updated);
    }

    enrich();
    return () => { cancelled = true; };
  }, [pureItinerary, budgetConfig.travelMode]);

  // Generate multi-day itinerary with budget and travel legs
  const itineraryPlan = useMemo(() => {
    if (itineraryIds.length === 0) {
      return {
        days: [],
        totalCost: 0,
        totalBudget: budgetConfig.totalBudget,
        totalCO2: 0,
        carBaselineCO2: 0,
        co2Saved: 0,
        warnings: []
      };
    }
    return generateSmartItinerary({
      placeIds: itineraryIds,
      budgetConfig,
      lockedPlaceIds,
      isRaining,
      startDayOfWeek: new Date().getDay()
    });
  }, [itineraryIds, budgetConfig, lockedPlaceIds, isRaining, regenSeed]);

  const handlePrint = () => {
    window.print();
  };

  const handleRegenerate = () => {
    setRegenSeed(prev => prev + 1);
  };

  const getTransportIcon = (mode) => {
    switch (mode) {
      case 'walk': return <Footprints className="w-3.5 h-3.5 text-emerald-600" />;
      case 'cycle': return <Bike className="w-3.5 h-3.5 text-teal-600" />;
      case 'bus': return <Bus className="w-3.5 h-3.5 text-blue-600" />;
      case 'auto': return <Car className="w-3.5 h-3.5 text-amber-600" />;
      case 'car': return <Car className="w-3.5 h-3.5 text-rose-600" />;
      default: return <Footprints className="w-3.5 h-3.5 text-slate-500" />;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-16 relative">
      {/* Top Banner & Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-3xl font-bold text-slate-900 dark:text-white">
            Smart Itinerary & Cost Planner
          </h2>
          <p className="text-xs text-slate-500">
            Weather-aware scheduling with rain swaps, crowd shifting, cluster routing, and green transit.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {itineraryIds.length > 0 && (
            <button
              type="button"
              onClick={clearItinerary}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-bold transition shadow-sm"
              title="Clear all destinations from itinerary"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear All</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleRegenerate}
            disabled={itineraryIds.length === 0}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-mustard-600 hover:bg-mustard-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold shadow transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Regenerate Route</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            disabled={itineraryIds.length === 0}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition"
            title="Print schedule"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Prominent Weather & Rain Simulation Control Bar */}
      <div className="relative overflow-hidden glass-panel p-4 sm:p-5 rounded-3xl border border-teal-500/30 bg-gradient-to-r from-teal-50/60 via-slate-50/40 to-amber-50/40 dark:from-teal-950/30 dark:via-slate-900/40 dark:to-amber-950/20 shadow-md">
        {/* Animated Rain / Lightning Canvas Overlay */}
        <RainEffect mode={weatherSimulation} reduceMotion={reduceMotion} />

        <div className="relative z-20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Left: Weather Status & Simulation Switch */}
          <div className="flex items-center space-x-3.5">
            <div className={`p-3 rounded-2xl flex items-center justify-center transition-colors ${
              isRaining 
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' 
                : 'bg-amber-100 dark:bg-amber-950/60 text-amber-600'
            }`}>
              {weatherSimulation === 'thunderstorm' ? (
                <CloudLightning className="w-6 h-6 animate-pulse" />
              ) : isRaining ? (
                <CloudRain className="w-6 h-6" />
              ) : (
                <Sun className="w-6 h-6" />
              )}
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-sm text-slate-900 dark:text-white">
                  Weather Engine: {isRaining ? 'Precipitation Mode' : 'Clear & Coastal'}
                </span>
                {pureItinerary.rainSwapsCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 animate-pulse">
                    {pureItinerary.rainSwapsCount} Swapped
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500">
                Pondicherry Forecast: {currentLiveHourWeather ? `${Math.round(currentLiveHourWeather.temp)}°C` : '29°C'} • 
                {isRaining ? ' Outdoor spots redirected to low-crowd sheltered alternatives' : ' Sunny and pleasant for walking/biking'}
              </p>
            </div>
          </div>

          {/* Right: Controls & Selectors */}
          <div className="flex items-center flex-wrap gap-2.5">
            {/* Simulate Rain Toggle Button */}
            <button
              type="button"
              onClick={handleToggleSimulateRain}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-2xl text-xs font-bold transition shadow-sm ${
                isSimulated
                  ? 'bg-blue-600 hover:bg-blue-700 text-white ring-2 ring-blue-400/40'
                  : 'bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700'
              }`}
            >
              <Umbrella className="w-4 h-4" />
              <span>Simulate Rain: {isSimulated ? 'ON' : 'OFF'}</span>
            </button>

            {/* Weather Mode Selector Dropdown */}
            <div className="flex items-center space-x-1.5 bg-white dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs">
              <button
                type="button"
                onClick={() => handleWeatherModeSelect('live')}
                className={`px-2.5 py-1.5 rounded-xl font-medium transition ${
                  weatherSimulation === 'live'
                    ? 'bg-teal-600 text-white font-bold shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
                title="Real-time Open-Meteo weather"
              >
                Live weather
              </button>

              <button
                type="button"
                onClick={() => handleWeatherModeSelect('light_rain')}
                className={`px-2.5 py-1.5 rounded-xl font-medium transition ${
                  weatherSimulation === 'light_rain'
                    ? 'bg-blue-600 text-white font-bold shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                Light rain
              </button>

              <button
                type="button"
                onClick={() => handleWeatherModeSelect('thunderstorm')}
                className={`px-2.5 py-1.5 rounded-xl font-medium transition ${
                  weatherSimulation === 'thunderstorm'
                    ? 'bg-indigo-600 text-white font-bold shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                Thunderstorm
              </button>
            </div>
          </div>
        </div>

        {/* Rain simulation active alert banner */}
        {isSimulated && (
          <div className="relative z-20 mt-3 p-2.5 px-3 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-blue-900 dark:text-blue-200 text-xs flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CloudRain className="w-4 h-4 text-blue-600 shrink-0" />
              <span>
                <strong>Rain simulation active:</strong> outdoor plans moved indoors to low-crowd sheltered alternatives. Original outdoor stops are struck through.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setWeatherSimulation('live')}
              className="text-[11px] underline font-bold hover:text-blue-700 shrink-0 ml-2"
            >
              Turn OFF
            </button>
          </div>
        )}
      </div>

      {/* Preferences & Budget Tuning Panel */}
      <div className="glass-panel p-5 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-700/80 pb-3">
          <span className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Trip Parameters & Budget Configuration
          </span>
          <span className="text-[11px] text-teal-700 dark:text-teal-400 font-semibold">
            {selectedPlaces.length} destination(s) selected
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
          {/* Total Budget */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
              Budget (INR)
            </label>
            <input
              type="number"
              step="500"
              value={budgetConfig.totalBudget}
              onChange={(e) => updateBudget({ totalBudget: Number(e.target.value) })}
              className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium"
            />
          </div>

          {/* Number of Days */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
              Days
            </label>
            <select
              value={budgetConfig.days}
              onChange={(e) => updateBudget({ days: Number(e.target.value) })}
              className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium"
            >
              {[1, 2, 3, 4, 5].map(d => (
                <option key={d} value={d}>{d} Day{d > 1 ? 's' : ''}</option>
              ))}
            </select>
          </div>

          {/* Travelers Count */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
              Travelers
            </label>
            <input
              type="number"
              min="1"
              max="10"
              value={budgetConfig.people}
              onChange={(e) => updateBudget({ people: Number(e.target.value) })}
              className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium"
            />
          </div>

          {/* Start Time */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
              Day Start Time
            </label>
            <input
              type="time"
              value={budgetConfig.startTime}
              onChange={(e) => updateBudget({ startTime: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium"
            />
          </div>

          {/* Travel Mode Preference */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
              Preferred Mode
            </label>
            <select
              value={budgetConfig.travelMode}
              onChange={(e) => updateBudget({ travelMode: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium"
            >
              <option value="walk">Walking (Eco)</option>
              <option value="cycle">Bicycle (Eco)</option>
              <option value="bus">PRTC Bus</option>
              <option value="auto">Auto-rickshaw</option>
              <option value="car">Cab / Taxi</option>
            </select>
          </div>

          {/* Pace */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
              Pace
            </label>
            <select
              value={budgetConfig.pace}
              onChange={(e) => updateBudget({ pace: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium"
            >
              <option value="relaxed">Relaxed (~3-4 stops)</option>
              <option value="normal">Normal (~4-5 stops)</option>
              <option value="packed">Packed (Fast pace)</option>
            </select>
          </div>
        </div>

        {/* Kids / Seniors Accessibility Toggle */}
        <div className="flex items-center space-x-3 pt-2">
          <input
            type="checkbox"
            id="kidsSeniorsToggle"
            checked={budgetConfig.hasKidsOrSeniors}
            onChange={(e) => updateBudget({ hasKidsOrSeniors: e.target.checked })}
            className="w-4 h-4 text-mustard-600 rounded focus:ring-mustard-500"
          />
          <label htmlFor="kidsSeniorsToggle" className="text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer">
            Traveling with young children or seniors (limits walking to &le;1 km, avoids steep stairs)
          </label>
        </div>
      </div>

      {/* Global Warnings Banner */}
      {itineraryPlan.warnings && itineraryPlan.warnings.length > 0 && (
        <div className="space-y-2">
          {itineraryPlan.warnings.map((warn, i) => (
            <div key={i} className="flex items-start space-x-2.5 p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>{warn}</span>
            </div>
          ))}
        </div>
      )}

      {/* Key Metric Highlights */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="glass-panel p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Estimated Total Cost</span>
          <div className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
            ₹{typeof itineraryPlan.totalCost === 'number' ? itineraryPlan.totalCost : '—'}
          </div>
          <span className={`text-[10px] font-semibold ${itineraryPlan.totalCost > budgetConfig.totalBudget ? 'text-rose-600' : 'text-emerald-600'}`}>
            {itineraryPlan.totalCost > budgetConfig.totalBudget
              ? '⚠️ Exceeds budget'
              : `Remaining: ₹${budgetConfig.totalBudget - (itineraryPlan.totalCost || 0)}`}
          </span>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
          <span className="text-[10px] uppercase font-bold text-teal-600 dark:text-teal-400 block tracking-wider">CO2 Saved vs Car</span>
          <div className="text-xl font-bold text-teal-700 dark:text-teal-300 mt-0.5">
            {itineraryPlan.co2Saved} kg
          </div>
          <span className="text-[10px] text-teal-600 dark:text-teal-400 font-medium">
            ≈ {Math.max(1, Math.round(itineraryPlan.co2Saved * 120))} phone charges
          </span>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
          <span className="text-[10px] uppercase font-bold text-mustard-600 dark:text-mustard-400 block tracking-wider">Scheduled Stops</span>
          <div className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
            {pureItinerary.stops.length} Places
          </div>
          <span className="text-[10px] text-slate-500">
            {pureItinerary.rainSwapsCount} swapped for rain
          </span>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
          <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 block tracking-wider">Weather Status</span>
          <div className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
            {isRaining ? (weatherSimulation === 'thunderstorm' ? 'Thunderstorm' : 'Monsoon Rain') : 'Clear & Dry'}
          </div>
          <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
            <span className="text-[10px] text-slate-500">
              {isRaining ? 'Indoor alternatives active' : 'Ideal for outdoor routes'}
            </span>
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-teal-100 dark:bg-teal-900 text-teal-700 dark:text-teal-300">
              {isSimulated ? '⚡ Simulated' : isLoadingWeather ? 'Loading...' : '🌐 Live'}
            </span>
          </div>
        </div>
      </div>

      {/* Itinerary Timeline View */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <span className="font-serif text-lg font-bold text-slate-900 dark:text-white">
            Daily Itinerary Timeline ({pureItinerary.stops.length} stops)
          </span>
          {pureItinerary.stops.length > 0 && (
            <span className="text-xs text-slate-500">
              Total Transit: ~{pureItinerary.totalTravelMinutes} mins • Green Mode: <strong className="capitalize">{budgetConfig.travelMode}</strong>
            </span>
          )}
        </div>

        {/* Empty State — shown when user hasn't added any destinations yet */}
        {pureItinerary.stops.length === 0 ? (
          <div className="glass-panel p-8 sm:p-12 rounded-3xl border border-dashed border-mustard-400/60 dark:border-mustard-600/40 text-center space-y-5">
            <div className="mx-auto w-16 h-16 rounded-full bg-mustard-100 dark:bg-mustard-950/40 flex items-center justify-center">
              <Compass className="w-8 h-8 text-mustard-500" />
            </div>
            <div>
              <h3 className="font-serif text-xl font-bold text-slate-900 dark:text-white">
                No destinations added yet
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                Choose spots from the <strong>Search bar</strong> or <strong>Destinations tab</strong> to build your Smart Itinerary.
                Each place you add will be scheduled automatically with weather, crowd, and budget optimization.
              </p>
            </div>

            {/* Quick Add — select from PLACES dropdown */}
            <div className="max-w-xs mx-auto space-y-3">
              <select
                defaultValue=""
                onChange={(e) => {
                  if (e.target.value) {
                    addPlaceToItinerary(e.target.value);
                    e.target.value = '';
                  }
                }}
                className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-mustard-500 focus:border-mustard-500"
              >
                <option value="" disabled>+ Quick add a destination...</option>
                {PLACES.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} — {p.category} {p.entryFee === 0 ? '(Free)' : `(₹${p.entryFee})`}
                  </option>
                ))}
              </select>
            </div>

            {setActiveTab && (
              <button
                type="button"
                onClick={() => setActiveTab('destinations')}
                className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-mustard-500 hover:bg-mustard-600 text-slate-950 font-bold text-xs shadow-md transition active:scale-95"
              >
                <ArrowRight className="w-4 h-4" />
                <span>Browse All Destinations</span>
              </button>
            )}
          </div>
        ) : (
        /* Vertical Timeline — uses enrichedStops (OSRM-upgraded) with haversine fallback */
        <div className="relative pl-6 sm:pl-8 border-l-2 border-mustard-500/30 dark:border-mustard-500/20 space-y-6">
          {(enrichedStops.length > 0 ? enrichedStops : pureItinerary.stops).map((stop, idx) => {
            const isLocked = lockedPlaceIds.includes(stop.id);
            const displayStops = enrichedStops.length > 0 ? enrichedStops : pureItinerary.stops;

            return (
              <div key={`${stop.id}-${idx}`} className="relative group">
                {/* Timeline Step Dot / Number */}
                <div className={`absolute -left-[35px] sm:-left-[43px] top-6 w-6 h-6 rounded-full font-extrabold text-[11px] flex items-center justify-center border-2 border-white dark:border-slate-900 shadow-md ${
                  stop.isSwapped
                    ? 'bg-blue-600 text-white ring-2 ring-blue-300'
                    : 'bg-mustard-500 text-slate-950'
                }`}>
                  {idx + 1}
                </div>

                {/* Stop Card */}
                <div className={`glass-panel p-5 sm:p-6 rounded-3xl border transition shadow-sm ${
                  stop.isSwapped 
                    ? 'border-blue-300 dark:border-blue-800/80 bg-blue-50/30 dark:bg-blue-950/20' 
                    : 'border-slate-200 dark:border-slate-800 hover:border-mustard-500/40'
                }`}>
                  <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                    {/* Left: Time, Image, Details */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 min-w-0 flex-1">
                      {/* Time Badge */}
                      <div className="w-28 shrink-0">
                        <span className="text-xs font-bold text-mustard-700 dark:text-mustard-400 block">
                          {stop.timeSlot ? stop.timeSlot.split(' - ')[0] : '09:00 AM'}
                        </span>
                        <span className="text-[11px] text-slate-400 block">
                          to {stop.timeSlot ? stop.timeSlot.split(' - ')[1] : '10:30 AM'}
                        </span>
                        <span className="text-[10px] text-slate-500 font-medium">
                          ({stop.durationMinutes} mins)
                        </span>
                      </div>

                      {/* Place Image */}
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-slate-200 dark:bg-slate-800 shrink-0">
                        <img
                          src={stop.image || FALLBACK_IMAGE}
                          alt={stop.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = FALLBACK_IMAGE;
                          }}
                        />
                      </div>

                      {/* Information */}
                      <div className="space-y-1.5 min-w-0 flex-1">
                        <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                          <span className="font-serif font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                            {stop.name}
                          </span>

                          {stop.category && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-mustard-100 dark:bg-mustard-950/60 text-mustard-800 dark:text-mustard-300">
                              {stop.category}
                            </span>
                          )}

                          {/* Swapped Badge */}
                          {stop.isSwapped && (
                            <span className="text-[10px] px-2.5 py-0.5 rounded-full font-extrabold bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 border border-blue-300 dark:border-blue-700 flex items-center gap-1">
                              <CloudRain className="w-3 h-3 text-blue-600" />
                              <span>{stop.swapBadge || 'Swapped to indoor: rain'}</span>
                            </span>
                          )}

                          {/* Crowd Pill */}
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${stop.crowdBadgeColor}`}>
                            Crowd: {stop.crowdLevel} ({stop.crowdScore || 35}%)
                          </span>
                        </div>

                        {/* Struck-through Original Outdoor Place */}
                        {stop.isSwapped && stop.originalOutdoor && (
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            <span className="line-through text-slate-400 dark:text-slate-500 mr-1.5">
                              Originally: {stop.originalOutdoor.name}
                            </span>
                            <span className="text-[11px] text-blue-600 dark:text-blue-400 font-medium">
                              (Swapped due to rain)
                            </span>
                          </div>
                        )}

                        {/* Crowd Shift Advice Alert (>70) */}
                        {stop.crowdAdvice && (
                          <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-800 dark:text-amber-200 font-medium flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            <span>{stop.crowdAdvice}</span>
                          </div>
                        )}

                        {/* Fallback Warning if no indoor alternative */}
                        {stop.noAlternativeWarning && (
                          <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-[11px] text-rose-700 dark:text-rose-300 font-medium flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                            <span>{stop.noAlternativeWarning}</span>
                          </div>
                        )}

                        {/* Description */}
                        <p className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-2">
                          {stop.description}
                        </p>

                        {/* Weather tag + why reason */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                            stop.isRain
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200'
                          }`}>
                            {stop.isRain ? '🌧 Rainy' : '☀ Clear'}
                          </span>
                          {stop.whyThisOrder && (
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 italic line-clamp-1">
                              {stop.whyThisOrder}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Actions (Lock, Remove, Fee) */}
                    <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800 shrink-0">
                      <span className="text-xs font-bold text-teal-700 dark:text-teal-400">
                        {(() => {
                          const fee = stop.entryFee ?? stop.fee ?? stop.cost ?? 0;
                          const num = Number(fee);
                          if (isNaN(num)) return 'Free Entry';
                          return num === 0 ? 'Free Entry' : `~₹${num}`;
                        })()}
                      </span>

                      <div className="flex items-center space-x-1.5">
                        <button
                          type="button"
                          onClick={() => toggleLockPlace(stop.id)}
                          className={`p-1.5 rounded-xl border text-xs flex items-center gap-1 transition ${
                            isLocked
                              ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300'
                              : 'border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-600'
                          }`}
                          title={isLocked ? "Unlock stop" : "Lock stop in place"}
                        >
                          {isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                          <span className="text-[10px] hidden sm:inline">{isLocked ? 'Locked' : 'Lock'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => removePlaceFromItinerary(stop.id)}
                          className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                          title="Remove from itinerary"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Travel Leg Card to next stop — uses real travelLeg data from enrichedStops */}
                {idx < displayStops.length - 1 && displayStops[idx + 1] && (() => {
                  const nextStop = displayStops[idx + 1];
                  const leg = nextStop.travelLeg;
                  const distKm = leg?.distanceKm ?? '~?';
                  const durMin = leg?.durationMin ?? leg?.minutes ?? '?';
                  const legCost = leg?.cost ?? 0;
                  return (
                    <div className="my-3 ml-2 flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400 bg-slate-100/70 dark:bg-slate-800/50 p-2.5 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 max-w-xl">
                      <div className="p-1.5 rounded-xl bg-white dark:bg-slate-700 shadow-sm">
                        {getTransportIcon(budgetConfig.travelMode)}
                      </div>
                      <span className="font-semibold text-slate-700 dark:text-slate-300 capitalize">
                        {budgetConfig.travelMode}: {distKm} km
                      </span>
                      <span>•</span>
                      <span>{typeof durMin === 'number' ? `~${Math.round(durMin)}` : durMin} mins</span>
                      <span>•</span>
                      <span className="text-teal-600 dark:text-teal-400 font-medium">
                        {legCost > 0 ? `~₹${legCost}` : 'Free'}
                      </span>
                      {leg?.source === 'fallback' && (
                        <span className="text-[10px] text-slate-400">(est.)</span>
                      )}
                    </div>
                  );
                })()}
              </div>
            );
          })}

          {/* Day ends line — shows last stop's leave time */}
          {pureItinerary.stops.length > 0 && (() => {
            const lastStop = pureItinerary.stops[pureItinerary.stops.length - 1];
            const endTime = (() => {
              if (lastStop.timeSlot) {
                const parts = lastStop.timeSlot.split(' - ');
                return parts[1] || '';
              }
              return '';
            })();
            return endTime ? (
              <div className="relative flex items-center gap-3 pl-1 pt-2">
                <div className="absolute -left-[35px] sm:-left-[43px] w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                  Day ends · {endTime}
                </span>
              </div>
            ) : null;
          })()}
        </div>
        )}
      </div>

      {/* Distance & Travel Time Calculator */}
      <div className="glass-panel p-5 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm mt-6">
        <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-700/80 pb-3">
          <span className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Distance &amp; Travel Time Calculator
          </span>
          <span className="text-[10px] text-teal-600">Powered by OSRM + Open-Meteo</span>
        </div>
        <DistanceCalculator />
      </div>
    </div>
  );
}

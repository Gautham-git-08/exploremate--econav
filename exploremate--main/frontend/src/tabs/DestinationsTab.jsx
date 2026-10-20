/**
 * ExploreMate Destinations Tab
 * - Reads all 43 places from single source of truth src/data/places.js
 * - Category filter chips matching project spec: All, Beaches, Heritage, Temples, Churches, Mosques, Parks, Museums, Day trips
 * - Real-time hours, "Closed today", "Open now", and "Verified / Unverified" badges
 * - Toggles "Added / Remove" with shared AppContext itinerary state and persistence
 * - Slide-over detailed factsheet modal with Google Maps navigation link
 */

import React, { useState } from 'react';
import { Compass, Clock, MapPin, Users, CloudSun, Shield, ShieldCheck, ShieldAlert, ExternalLink, X, Plus, Check, AlertCircle, Camera, Shirt, Lightbulb, ChevronDown, ChevronUp } from 'lucide-react';
import { PLACES, CATEGORIES, isPlaceOpenNow, FALLBACK_IMAGE } from '../data/places.js';
import { useApp } from '../context/AppContext.jsx';
import { useSettings } from '../context/SettingsContext.jsx';
import { getVisitorInstructions, visitorInstructionsMeta } from '../utils/visitorInstructions.js';

/**
 * Visitor Instructions Collapsible Block
 * Render-guarded with try/catch to ensure it never crashes the destination card or modal.
 */
function VisitorInstructionsBlock({ place, defaultExpanded = false }) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  try {
    const data = getVisitorInstructions(place);
    if (!data?.visitorInstructions) return null;

    const {
      photography = '',
      dressCode = '',
      tips = [],
      confidence = 'general'
    } = data.visitorInstructions;

    const isSourced = confidence === 'sourced';

    return (
      <div 
        onClick={(e) => e.stopPropagation()}
        className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 text-xs"
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
          className="w-full flex items-center justify-between text-left font-serif font-bold text-slate-800 dark:text-slate-200 hover:text-mustard-600 dark:hover:text-mustard-400 transition py-0.5 group/vib"
          aria-expanded={isExpanded}
        >
          <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
            <span className="text-xs">Visitor Instructions</span>
            {isSourced ? (
              <span className="px-2 py-0.5 rounded-full text-[9px] font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                Verified guidance
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-[9px] font-semibold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                General guidance, confirm on site
              </span>
            )}
          </div>
          {isExpanded ? (
            <ChevronUp className="w-3.5 h-3.5 text-slate-400 group-hover/vib:text-mustard-600 shrink-0 ml-1" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover/vib:text-mustard-600 shrink-0 ml-1" />
          )}
        </button>

        {isExpanded && (
          <div className="mt-2 space-y-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 animate-fade-in text-[11px]">
            {photography && (
              <div className="flex items-start space-x-2">
                <Camera className="w-3.5 h-3.5 text-mustard-600 shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <span className="font-bold text-slate-900 dark:text-white mr-1">Photography:</span>
                  <span className="text-slate-600 dark:text-slate-300 leading-relaxed">{photography}</span>
                </div>
              </div>
            )}

            {dressCode && (
              <div className="flex items-start space-x-2">
                <Shirt className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <span className="font-bold text-slate-900 dark:text-white mr-1">Dress code:</span>
                  <span className="text-slate-600 dark:text-slate-300 leading-relaxed">{dressCode}</span>
                </div>
              </div>
            )}

            {(tips ?? []).length > 0 && (
              <div className="flex items-start space-x-2">
                <Lightbulb className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <span className="font-bold text-slate-900 dark:text-white block mb-0.5">Good to know:</span>
                  <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-300 pl-0.5">
                    {(tips ?? []).map((tip, idx) => (
                      <li key={idx} className="leading-relaxed">{tip}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 text-[10px] text-slate-400 dark:text-slate-500 italic">
              Rules can change. Follow signboards and staff instructions. Last reviewed: {visitorInstructionsMeta.lastReviewed}
            </div>
          </div>
        )}
      </div>
    );
  } catch (err) {
    return null;
  }
}

export default function DestinationsTab() {
  const [filter, setFilter] = useState('All');
  const [selectedPlace, setSelectedPlace] = useState(null);
  const { weatherSimulation } = useSettings();
  const { isInItinerary, togglePlaceInItinerary } = useApp();

  const filteredPlaces = PLACES.filter((p) => {
    if (filter === 'All') return true;
    return p.category.toLowerCase() === filter.toLowerCase();
  });

  // Weather suitability chip computation
  const getWeatherChip = (place) => {
    const isRain = weatherSimulation === 'light_rain' || weatherSimulation === 'heavy_rain' || weatherSimulation === 'thunderstorm';
    if (isRain) {
      if (place.indoorOutdoor === 'indoor' || place.indoorOutdoor === 'both') {
        return { text: "Indoor / Rain Safe", color: "bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300" };
      }
      return { text: "Not advised: rain", color: "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300" };
    }
    if (weatherSimulation === 'heat') {
      if (place.indoorOutdoor === 'indoor') {
        return { text: "AC / Shaded", color: "bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300" };
      }
      return { text: "Better after 4 PM", color: "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300" };
    }
    return { text: "Great now", color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300" };
  };

  const handleToggleItinerary = (place, e) => {
    if (e) e.stopPropagation();
    togglePlaceInItinerary(place);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-3xl font-bold text-slate-900 dark:text-white">
            Pondicherry Destinations ({filteredPlaces.length})
          </h2>
          <p className="text-xs text-slate-500">
            Verified French heritage, coastal beaches, ancient temples, sacred churches & mosques, and lush nature parks.
          </p>
        </div>

        {/* Category Filter Chips */}
        <div className="flex flex-wrap gap-1.5 overflow-x-auto pb-1 max-w-2xl">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition whitespace-nowrap ${
                filter === cat
                  ? 'bg-mustard-600 text-white shadow font-semibold'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Places Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPlaces.map((place) => {
          const weatherChip = getWeatherChip(place);
          const openStatus = isPlaceOpenNow(place);
          const inPlan = isInItinerary(place.id);

          return (
            <div
              key={place.id}
              onClick={() => setSelectedPlace(place)}
              className="glass-panel rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 hover:border-mustard-500/50 hover:shadow-xl transition cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <div className="relative aspect-video w-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                  <img
                    src={place.image}
                    alt={place.name}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = FALLBACK_IMAGE;
                    }}
                  />

                  {/* Weather Chip */}
                  <div className={`absolute top-3 left-3 px-2.5 py-1 rounded-full text-[11px] font-medium backdrop-blur-md shadow ${weatherChip.color}`}>
                    {weatherChip.text}
                  </div>

                  {/* Open Status Chip */}
                  <div className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-[11px] font-bold backdrop-blur-md shadow ${openStatus.badgeColor}`}>
                    {openStatus.statusText}
                  </div>
                </div>

                <div className="p-5 space-y-2.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-teal-700 dark:text-teal-400 uppercase tracking-wider">
                      {place.category}
                    </span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {place.entryFee === 0 ? 'Free Entry' : `₹${place.entryFee} / person`}
                    </span>
                  </div>

                  <h3 className="font-serif text-lg font-bold text-slate-900 dark:text-white line-clamp-1 group-hover:text-mustard-600 transition">
                    {place.name}
                  </h3>

                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                    {place.description}
                  </p>

                  {/* Badges: Verified / Unverified, Duration, Crowd */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {place.verified ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-medium">
                        <ShieldCheck className="w-3 h-3 mr-1 text-emerald-600" />
                        Verified Details
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 font-medium">
                        <ShieldAlert className="w-3 h-3 mr-1 text-amber-600" />
                        Not Confirmed (Verify On Arrival)
                      </span>
                    )}

                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-mustard-50 dark:bg-mustard-950/40 text-mustard-800 dark:text-mustard-300">
                      ~{place.avgVisitMinutes} mins
                    </span>

                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      Best: {place.bestTimeOfDay}
                    </span>
                  </div>

                  {/* Visitor Instructions Block (Collapsible, collapsed by default) */}
                  <VisitorInstructionsBlock place={place} defaultExpanded={false} />
                </div>
              </div>

              {/* Card Footer: Hours & Add/Remove Itinerary Button */}
              <div className="px-5 pb-5 pt-3 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-xs">
                <span className="flex items-center gap-1 font-medium text-slate-500 dark:text-slate-400 line-clamp-1 max-w-[55%]">
                  <Clock className="w-3.5 h-3.5 text-mustard-600 shrink-0" />
                  <span className="truncate">{place.hoursNote}</span>
                </span>

                <button
                  type="button"
                  onClick={(e) => handleToggleItinerary(place, e)}
                  className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl font-semibold text-xs transition shadow-sm ${
                    inPlan
                      ? 'bg-rose-600 hover:bg-rose-700 text-white'
                      : 'bg-mustard-600 hover:bg-mustard-700 text-white'
                  }`}
                >
                  {inPlan ? (
                    <>
                      <X className="w-3.5 h-3.5" />
                      <span>Added / Remove</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add to Plan</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Place Detail Slide-over Modal */}
      {selectedPlace && (
        <div
          className="fixed inset-0 z-[1020] bg-black/60 backdrop-blur-sm flex justify-end animate-fade-in"
          onClick={() => setSelectedPlace(null)}
        >
          <div
            className="w-full max-w-lg h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 p-6 overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div>
                <span className="text-[11px] font-semibold text-teal-700 dark:text-teal-400 uppercase tracking-wider block">
                  {selectedPlace.category}
                </span>
                <h3 className="font-serif text-xl font-bold text-slate-900 dark:text-white mt-0.5">
                  {selectedPlace.name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedPlace(null)}
                aria-label="Close details"
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-5 text-sm">
              <div className="aspect-video w-full rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 relative">
                <img
                  src={selectedPlace.image}
                  alt={selectedPlace.name}
                  loading="lazy"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = FALLBACK_IMAGE;
                  }}
                />
              </div>

              {/* Description */}
              <div>
                <h4 className="font-serif font-bold text-slate-900 dark:text-white mb-1.5">
                  Overview & Sourced Facts
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {selectedPlace.description}
                </p>
              </div>

              {/* Fee & Hours Card */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl space-y-2.5 text-xs">
                <div className="flex items-start space-x-2 text-slate-700 dark:text-slate-300">
                  <Clock className="w-4 h-4 text-mustard-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">Visiting Hours</span>
                    <span>{selectedPlace.hoursNote}</span>
                  </div>
                </div>

                <div className="flex items-start space-x-2 text-slate-700 dark:text-slate-300 pt-2 border-t border-slate-200 dark:border-slate-700">
                  <Shield className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">Entry Fee</span>
                    <span>{selectedPlace.feeNote}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 grid grid-cols-2 gap-2 text-slate-600 dark:text-slate-300">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Best Time</span>
                    <span className="font-semibold">{selectedPlace.bestTimeOfDay}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Avg Duration</span>
                    <span className="font-semibold">{selectedPlace.avgVisitMinutes} minutes</span>
                  </div>
                </div>
              </div>

              {/* Visitor Instructions Block (Expanded by default in detail view) */}
              <VisitorInstructionsBlock place={selectedPlace} defaultExpanded={true} />

              {/* Actions */}
              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => togglePlaceInItinerary(selectedPlace)}
                  className={`flex-1 flex items-center justify-center space-x-1.5 py-3 px-4 rounded-xl font-bold text-xs shadow transition ${
                    isInItinerary(selectedPlace.id)
                      ? 'bg-rose-600 hover:bg-rose-700 text-white'
                      : 'bg-mustard-600 hover:bg-mustard-700 text-white'
                  }`}
                >
                  {isInItinerary(selectedPlace.id) ? (
                    <>
                      <X className="w-4 h-4" />
                      <span>Remove from Itinerary</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>Add to Itinerary</span>
                    </>
                  )}
                </button>

                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedPlace.name + " Pondicherry")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center space-x-1.5 py-3 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow transition"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Get Directions</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

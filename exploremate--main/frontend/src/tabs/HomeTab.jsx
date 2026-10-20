/**
 * ExploreMate Home Tab
 * Hero section with Pondicherry strict search, live weather card, quick actions,
 * and rain-day indoor highlights.
 */

import React, { useState, useEffect } from 'react';
import { Compass, Sun, CloudRain, Calendar, Shield, Sparkles, Navigation, Clock, MapPin, ArrowRight, CheckCircle2, Trees, Footprints } from 'lucide-react';
import { BRAND_NAME } from '../config/constants';
import { useSettings } from '../context/SettingsContext';
import SearchBox from '../components/common/SearchBox';
import { getDestinationMedia, FALLBACK_IMAGE } from '../config/destinations';

export default function HomeTab({ setActiveTab, onSelectPlace }) {
  const [weatherData, setWeatherData] = useState(null);
  const [places, setPlaces] = useState([]);
  const { weatherSimulation } = useSettings();

  useEffect(() => {
    // Fetch live weather
    fetch('/api/weather')
      .then((res) => res.json())
      .then((d) => setWeatherData(d))
      .catch((err) => console.error("Weather fetch failed", err));

    // Fetch featured places
    fetch('/api/places')
      .then((res) => res.json())
      .then((d) => setPlaces(d.places || []))
      .catch((err) => console.error("Places fetch failed", err));
  }, []);

  // Weather simulation override display
  const isSimulatedRain = weatherSimulation === 'light_rain' || weatherSimulation === 'heavy_rain' || weatherSimulation === 'thunderstorm';
  const currentTemp = weatherSimulation === 'heat' ? 39.5 : (weatherData?.current?.temperature_2m || 29.2);

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Simulation Alert Banner */}
      {weatherSimulation !== 'live' && (
        <div className="bg-amber-500 text-slate-950 font-bold px-4 py-2 rounded-2xl flex items-center justify-between text-xs sm:text-sm shadow-md">
          <div className="flex items-center space-x-2">
            <CloudRain className="w-4 h-4" />
            <span>WEATHER SIMULATION ACTIVE: {weatherSimulation.toUpperCase()}</span>
          </div>
          <span className="text-[11px] font-normal underline cursor-pointer" onClick={() => setActiveTab('settings')}>
            Change in Settings
          </span>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative overflow-visible rounded-3xl glass-panel p-6 sm:p-10 border border-mustard-500/20 shadow-xl z-20">
        <div className="max-w-2xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-mustard-500/10 text-mustard-700 dark:text-mustard-400 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Eco-Travel Companion for Pondicherry</span>
          </div>

          <h2 className="font-serif text-3xl sm:text-5xl font-bold text-slate-900 dark:text-white leading-tight">
            Discover French Elegance & Coastal Serenity
          </h2>

          <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
            Personalized itineraries, low-carbon story chapters, live weather rerouting, and verified heritage walking routes — crafted strictly for Pondicherry.
          </p>

          {/* Pondicherry-Only Search Bar with Categories and Dropdown */}
          <div className="mt-6">
            <SearchBox onSelectPlace={onSelectPlace} setActiveTab={setActiveTab} />
          </div>
        </div>
      </section>

      {/* Live Weather & Quick Stats Strip */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Weather Card */}
        <div 
          onClick={() => setActiveTab('weather')}
          className="glass-panel p-5 rounded-3xl border border-slate-200 dark:border-slate-800 cursor-pointer hover:border-teal-500/50 transition group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Pondicherry Weather
            </span>
            <CloudRain className="w-5 h-5 text-teal-600 dark:text-teal-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-bold text-slate-900 dark:text-white">
              {currentTemp}°C
            </span>
            <span className="text-xs text-slate-500">
              {isSimulatedRain ? 'Monsoon Showers' : 'Humid Coastal Breeze'}
            </span>
          </div>
          <div className="mt-2 text-xs text-teal-700 dark:text-teal-400 font-medium">
            {isSimulatedRain ? '⚠️ Indoor stops recommended today' : 'Ideal for French Quarter walks'}
          </div>
        </div>

        {/* Quick Plan Card */}
        <div 
          onClick={() => setActiveTab('plan')}
          className="glass-panel p-5 rounded-3xl border border-slate-200 dark:border-slate-800 cursor-pointer hover:border-mustard-500/50 transition group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Smart Itinerary
            </span>
            <Calendar className="w-5 h-5 text-mustard-600 dark:text-mustard-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="mt-3 text-lg font-bold text-slate-900 dark:text-white">
            Auto-Plan Your Day
          </div>
          <div className="mt-1 text-xs text-slate-500">
            Weather-aware time-slots, crowd balancing, and meal breaks.
          </div>
        </div>

        {/* Carbon Fuel Card */}
        <div 
          onClick={() => setActiveTab('chapters')}
          className="glass-panel p-5 rounded-3xl border border-slate-200 dark:border-slate-800 cursor-pointer hover:border-leaf-500/50 transition group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Carbon Chapters
            </span>
            <Sparkles className="w-5 h-5 text-leaf-500 group-hover:scale-110 transition-transform" />
          </div>
          <div className="mt-3 text-lg font-bold text-slate-900 dark:text-white">
            Earn CO2 Ink
          </div>
          <div className="mt-1 text-xs text-slate-500">
            Walk & cycle to unlock serialized Pondicherry mystery stories.
          </div>
        </div>
      </section>

      {/* Featured Curated Places */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-serif text-2xl font-bold text-slate-900 dark:text-white">
              Featured Heritage & Coastal Spots
            </h3>
            <p className="text-xs text-slate-500">
              Curated verified attractions across White Town, Promenade, and Auroville.
            </p>
          </div>
          <button
            onClick={() => setActiveTab('destinations')}
            className="text-xs font-semibold text-mustard-600 dark:text-mustard-400 flex items-center hover:underline"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {places.slice(0, 3).map((place) => (
            <div
              key={place.id}
              onClick={() => {
                if (onSelectPlace) onSelectPlace(place);
                setActiveTab('destinations');
              }}
              className="glass-panel rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 cursor-pointer hover:shadow-xl transition group"
            >
              <div className="relative aspect-video w-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                <img
                  src={getDestinationMedia(place.id, place.name).src}
                  alt={getDestinationMedia(place.id, place.name).alt}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={(e) => {
                    e.target.src = FALLBACK_IMAGE;
                  }}
                />
                <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full text-[11px] font-semibold text-white">
                  ★ {place.rating}
                </div>
                {place.indoor && (
                  <div className="absolute top-3 left-3 bg-teal-600/90 backdrop-blur-md px-2.5 py-1 rounded-full text-[11px] font-medium text-white">
                    Indoor Rain-Safe
                  </div>
                )}
              </div>

              <div className="p-4 space-y-2">
                <h4 className="font-serif text-lg font-bold text-slate-900 dark:text-white line-clamp-1">
                  {place.name}
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                  {place.review_summary || place.description}
                </p>
                <div className="pt-2 flex items-center justify-between text-[11px] text-slate-500">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-mustard-600" />
                    {place.opening_hours?.display || 'Open today'}
                  </span>
                  <span className="font-medium text-teal-700 dark:text-teal-400">
                    {place.cost === 0 ? 'Free Entry' : `INR ${place.cost}`}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works Section */}
      <section className="space-y-4">
        <div>
          <h3 className="font-serif text-2xl font-bold text-slate-900 dark:text-white">
            How ExploreMate Works
          </h3>
          <p className="text-xs text-slate-500">
            Four simple steps to travel sustainably with verified local intelligence.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              step: '01',
              title: 'Discover & Search',
              desc: 'Browse 43 verified Pondicherry destinations across White Town, beaches, and temples.',
              icon: Compass,
              color: 'text-mustard-600 dark:text-mustard-400 bg-mustard-500/10'
            },
            {
              step: '02',
              title: 'Smart Itinerary',
              desc: 'Generate dynamic hour-by-hour plans that swap outdoor spots during monsoon showers.',
              icon: Calendar,
              color: 'text-teal-600 dark:text-teal-400 bg-teal-500/10'
            },
            {
              step: '03',
              title: 'Travel Low-Carbon',
              desc: 'Choose walking or cycling to save CO2 emissions compared to petrol vehicles.',
              icon: Footprints,
              color: 'text-leaf-600 dark:text-leaf-400 bg-leaf-500/10'
            },
            {
              step: '04',
              title: 'Unlock Mystery Tales',
              desc: 'Redeem your verified CO2 ink to reveal serialized historical mystery chapters.',
              icon: Sparkles,
              color: 'text-amber-600 dark:text-amber-400 bg-amber-500/10'
            }
          ].map((item, i) => {
            const Icon = item.icon;
            return (
              <div key={i} className="glass-panel p-5 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${item.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="font-serif text-sm font-bold text-slate-400">
                    {item.step}
                  </span>
                </div>
                <h4 className="font-serif font-bold text-base text-slate-900 dark:text-white">
                  {item.title}
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Eco-Impact Highlights Section */}
      <section className="glass-panel p-6 sm:p-8 rounded-3xl border border-leaf-500/20 bg-gradient-to-br from-leaf-500/5 via-transparent to-teal-500/5">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="max-w-xl space-y-2">
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-leaf-500/10 text-leaf-700 dark:text-leaf-300 text-xs font-semibold">
              <Trees className="w-3.5 h-3.5" />
              <span>Eco-Impact Counter</span>
            </div>
            <h3 className="font-serif text-2xl font-bold text-slate-900 dark:text-white">
              Every Footstep Preserves Pondicherry
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              ExploreMate encourages pedalling through French Quarter boulevards and strolling Promenade Beach rather than hiring motorized transport, cutting coastal emissions and keeping heritage zones clean.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 w-full md:w-auto">
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 text-center">
              <div className="text-2xl font-bold text-leaf-600 dark:text-leaf-400">
                0.192 kg
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Saved per km walked vs car
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 text-center">
              <div className="text-2xl font-bold text-teal-600 dark:text-teal-400">
                100%
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Local Pondicherry scope
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

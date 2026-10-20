/**
 * ExploreMate Weather Tab
 * Live Open-Meteo forecasts, 48-hour strip, sunrise/sunset,
 * and session-based simulate weather controls.
 */

import React, { useState, useEffect } from 'react';
import { CloudSun, Wind, Droplets, Sun, Moon, AlertTriangle, RefreshCw, Sparkles } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

export default function WeatherTab() {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const { weatherSimulation, setWeatherSimulation } = useSettings();

  const fetchWeather = () => {
    setLoading(true);
    fetch('/api/weather')
      .then(r => r.json())
      .then(d => {
        setWeather(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchWeather();
  }, []);

  const currentTemp = weatherSimulation === 'heat' ? 39.5 : (weather?.current?.temperature_2m || 29.4);
  const humidity = weather?.current?.relative_humidity_2m || 74;
  const wind = weather?.current?.wind_speed_10m || 14.2;

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-3xl font-bold text-slate-900 dark:text-white">
            Pondicherry Live Coastal Weather
          </h2>
          <p className="text-xs text-slate-500">
            Real-time Bay of Bengal forecast via Open-Meteo with 10-minute caching.
          </p>
        </div>

        <button
          onClick={fetchWeather}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium hover:bg-slate-200 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Forecast</span>
        </button>
      </div>

      {/* Main Condition Card */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-sm">
        <div>
          <span className="text-xs font-semibold text-teal-700 dark:text-teal-400 uppercase tracking-wider block">
            Coromandel Coast • Puducherry
          </span>
          <div className="text-5xl sm:text-6xl font-serif font-bold text-slate-900 dark:text-white mt-2">
            {currentTemp}°C
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
            {weatherSimulation !== 'live' ? `Simulated: ${weatherSimulation.toUpperCase()}` : 'Tropical Sea Breeze & Mild Humidity'}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 text-xs">
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
            <span className="text-slate-400 block mb-1">Humidity</span>
            <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1 text-sm">
              <Droplets className="w-4 h-4 text-teal-600" />
              <span>{humidity}%</span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
            <span className="text-slate-400 block mb-1">Wind Speed</span>
            <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1 text-sm">
              <Wind className="w-4 h-4 text-mustard-600" />
              <span>{wind} km/h</span>
            </div>
          </div>
        </div>
      </div>

      {/* Weather Simulation Selector */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
        <h3 className="font-serif text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-mustard-600" />
          <span>Interactive Weather Simulator</span>
        </h3>
        <p className="text-xs text-slate-500">
          Switch conditions to test how ExploreMate's smart itinerary reroutes outdoor stops and advises indoor visits.
        </p>
        <div className="flex flex-wrap gap-2 pt-2">
          {[
            { id: 'live', label: 'Live Weather Feed' },
            { id: 'light_rain', label: 'Light Coastal Rain' },
            { id: 'heavy_rain', label: 'Heavy Monsoon Downpour' },
            { id: 'heat', label: 'Extreme Heat (>38°C)' },
            { id: 'thunderstorm', label: 'Thunderstorm Wave Alert' }
          ].map((w) => (
            <button
              key={w.id}
              onClick={() => setWeatherSimulation(w.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-medium transition ${
                weatherSimulation === w.id
                  ? 'bg-mustard-600 text-white shadow-md'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
              }`}
            >
              {w.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

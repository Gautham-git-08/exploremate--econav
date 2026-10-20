/**
 * ExploreMate Settings Drawer
 * Complete preference customization panel: themes, language, units, text size,
 * reduce motion, simulation controls, cache clear, data export/import, and app reset.
 */

import React, { useRef } from 'react';
import { X, Moon, Sun, Monitor, Type, Volume2, CloudRain, Trash2, Download, Upload, RotateCcw } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { useModal } from '../context/ModalContext';

export default function SettingsDrawer({ isOpen, onClose }) {
  const {
    theme, setTheme,
    language, setLanguage,
    units, setUnits,
    reduceMotion, setReduceMotion,
    highContrast, setHighContrast,
    textSize, setTextSize,
    weatherSimulation, setWeatherSimulation,
    clearCacheAndData
  } = useSettings();

  const { showConfirm, showAlert } = useModal();
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleExportData = () => {
    const data = {
      theme,
      language,
      units,
      timestamp: new Date().toISOString(),
      localStorage: { ...localStorage }
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `exploremate_backup_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportData = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        if (parsed.localStorage) {
          Object.keys(parsed.localStorage).forEach((k) => {
            localStorage.setItem(k, parsed.localStorage[k]);
          });
          showAlert({ title: "Import Successful", message: "User data restored. Reloading ExploreMate..." });
          setTimeout(() => window.location.reload(), 1500);
        }
      } catch (err) {
        showAlert({ title: "Import Error", message: "Invalid JSON backup file." });
      }
    };
    reader.readAsText(file);
  };

  const handleReset = async () => {
    const confirmed = await showConfirm({
      title: "Reset Application Data",
      message: "Are you sure you want to reset all saved itineraries, expenses, and settings? This cannot be undone.",
      confirmText: "Reset Everything",
      cancelText: "Keep Data"
    });
    if (confirmed) {
      clearCacheAndData();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[1050] bg-black/60 backdrop-blur-sm flex justify-end animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-md h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 p-6 overflow-y-auto shadow-2xl transition-transform"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <h3 className="font-serif text-xl font-bold text-slate-900 dark:text-white">
            Advanced Settings
          </h3>
          <button 
            onClick={onClose}
            aria-label="Close settings"
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-6 space-y-6 text-sm">
          {/* Theme */}
          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-2">Theme</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'light', label: 'Light', icon: Sun },
                { id: 'dark', label: 'Dark', icon: Moon },
                { id: 'system', label: 'System', icon: Monitor }
              ].map((t) => {
                const Icon = t.icon;
                return (
                  <button
                    key={t.id}
                    onClick={() => setTheme(t.id)}
                    className={`flex items-center justify-center space-x-1.5 py-2 px-3 rounded-xl border text-xs font-medium transition ${
                      theme === t.id 
                        ? 'border-mustard-500 bg-mustard-50 dark:bg-mustard-950/40 text-mustard-700 dark:text-mustard-300' 
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Units */}
          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-2">Measurement Units</label>
            <div className="grid grid-cols-2 gap-2">
              {['km', 'mi'].map((u) => (
                <button
                  key={u}
                  onClick={() => setUnits(u)}
                  className={`py-2 px-3 rounded-xl border text-xs font-medium uppercase transition ${
                    units === u 
                      ? 'border-teal-500 bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300' 
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {u === 'km' ? 'Kilometers (km)' : 'Miles (mi)'}
                </button>
              ))}
            </div>
          </div>

          {/* Text Size */}
          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-2">Text Scale</label>
            <div className="grid grid-cols-3 gap-2">
              {['normal', 'large', 'xl'].map((sz) => (
                <button
                  key={sz}
                  onClick={() => setTextSize(sz)}
                  className={`py-2 px-3 rounded-xl border text-xs capitalize transition ${
                    textSize === sz 
                      ? 'border-mustard-500 bg-mustard-50 dark:bg-mustard-950/40 text-mustard-700 dark:text-mustard-300 font-semibold' 
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {sz}
                </button>
              ))}
            </div>
          </div>

          {/* Accessibility Toggles */}
          <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-slate-800 dark:text-slate-200">Reduce Motion</div>
                <div className="text-xs text-slate-500">Disable UI transitions & pulse animations</div>
              </div>
              <input
                type="checkbox"
                checked={reduceMotion}
                onChange={(e) => setReduceMotion(e.target.checked)}
                className="w-4 h-4 accent-mustard-500 rounded"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-slate-800 dark:text-slate-200">High Contrast Mode</div>
                <div className="text-xs text-slate-500">Increase border & text contrast</div>
              </div>
              <input
                type="checkbox"
                checked={highContrast}
                onChange={(e) => setHighContrast(e.target.checked)}
                className="w-4 h-4 accent-mustard-500 rounded"
              />
            </div>
          </div>

          {/* Weather Simulation Control */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center space-x-2 mb-2">
              <CloudRain className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <label className="font-medium text-slate-700 dark:text-slate-300">Weather Simulation Engine</label>
            </div>
            <p className="text-xs text-slate-500 mb-3">
              Test itinerary rerouting and indoor recommendations under weather changes.
            </p>
            <select
              value={weatherSimulation}
              onChange={(e) => setWeatherSimulation(e.target.value)}
              className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-mustard-500"
            >
              <option value="live">Live Weather Feed (Open-Meteo)</option>
              <option value="light_rain">Simulate: Light Coastal Drizzle</option>
              <option value="heavy_rain">Simulate: Heavy Monsoon Downpour</option>
              <option value="thunderstorm">Simulate: Coastal Thunderstorm Alert</option>
              <option value="heat">Simulate: Extreme Heat (&gt;38°C)</option>
              <option value="wind">Simulate: Strong Cyclone Gale Winds</option>
              <option value="night">Simulate: Nightfall (White Town Lamps)</option>
            </select>
          </div>

          {/* Data Backup & Restore */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
            <label className="block font-medium text-slate-700 dark:text-slate-300">Data & Privacy</label>
            <div className="flex space-x-2">
              <button
                onClick={handleExportData}
                className="flex-1 flex items-center justify-center space-x-1.5 py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 text-xs font-medium transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export JSON</span>
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 flex items-center justify-center space-x-1.5 py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 text-xs font-medium transition"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Import JSON</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleImportData}
              />
            </div>

            <button
              onClick={handleReset}
              className="w-full flex items-center justify-center space-x-1.5 py-2 px-3 rounded-xl bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 hover:bg-red-100 text-xs font-medium transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Application & Clear Cache</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * ExploreMate Carbon Footprint, Eco-Game & Vivid Lore Chapters Tab
 * 
 * Features:
 * - 4 Distinct Selectable Carbon Cards:
 *   1. Bicycle (0.000 kg CO2/km)
 *   2. Walking (0.000 kg CO2/km)
 *   3. Local train / Public transport (0.041 kg CO2/km)
 *   4. Personal car baseline (0.192 kg CO2/km)
 * - Interactive distance slider with real-time savings calculations vs 0.192 car baseline
 * - Side-by-side comparison bar
 * - "Confirm this trip" button:
 *   - Updates persistent numeric cumulative savings in localStorage ('exploremate_cumulative_co2_saved')
 *   - Appends to localStorage trip history ('exploremate_trip_history')
 *   - Fires canvas-confetti celebration for Bicycle and Walking ONLY (respecting reduceMotion)
 *   - Automatically unlocks stories matching unlockThresholdKg
 * - 4 Vivid Travel Stories & Lore (250-350 words) with rich sensory details
 * - Full-width StoryReader modal with hero image, drop caps, reading time, scroll progress bar, dark/light mode, and Web Speech API narration
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Sparkles, Lock, Unlock, Award, Footprints, Bike, Bus, Car, 
  Share2, CheckCircle2, ChevronRight, Trees, Zap, Trophy, ShieldCheck, 
  BookOpen, History, Volume2, ArrowRight, RotateCcw
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useApp } from '../context/AppContext.jsx';
import { useSettings } from '../context/SettingsContext.jsx';
import { STORIES, EMISSION_OPTIONS } from '../data/stories.js';
import StoryReader from '../components/common/StoryReader.jsx';

export default function ChaptersTab() {
  const { selectedPlaces, budgetConfig } = useApp();
  const { reduceMotion } = useSettings();

  // Carbon Calculator States
  const [selectedModeId, setSelectedModeId] = useState('bicycle');
  const [tripDistanceKm, setTripDistanceKm] = useState(6);
  const [cumulativeSavedKg, setCumulativeSavedKg] = useState(() => {
    const saved = localStorage.getItem('exploremate_cumulative_co2_saved');
    return saved ? parseFloat(saved) || 0.0 : 0.0;
  });
  const [tripHistory, setTripHistory] = useState(() => {
    try {
      const history = localStorage.getItem('exploremate_trip_history');
      return history ? JSON.parse(history) : [];
    } catch {
      return [];
    }
  });

  // Story Reader State
  const [activeStory, setActiveStory] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Selected mode object
  const activeMode = useMemo(() => {
    return EMISSION_OPTIONS.find(m => m.id === selectedModeId) || EMISSION_OPTIONS[0];
  }, [selectedModeId]);

  // Baseline Car Calculation: 0.192 kg CO2 / km
  const carBaselineEmission = parseFloat((tripDistanceKm * 0.192).toFixed(3));
  const activeModeEmission = parseFloat((tripDistanceKm * activeMode.co2PerKm).toFixed(3));
  const tripSavedKg = parseFloat(Math.max(0, carBaselineEmission - activeModeEmission).toFixed(3));

  // Equivalencies
  const totalLifetimeSaved = parseFloat((cumulativeSavedKg + tripSavedKg).toFixed(2));
  const phoneCharges = Math.max(1, Math.round(totalLifetimeSaved * 125));
  const treeDays = (totalLifetimeSaved * 16.5).toFixed(1);

  // Green Score calculation (0 to 100)
  const greenScore = useMemo(() => {
    if (activeMode.id === 'bicycle' || activeMode.id === 'walking') return 98;
    if (activeMode.id === 'transit') return 78;
    return 35;
  }, [activeMode]);

  // Trip confirmation handler
  const handleConfirmTrip = () => {
    const newCumulative = parseFloat((cumulativeSavedKg + tripSavedKg).toFixed(3));
    setCumulativeSavedKg(newCumulative);
    localStorage.setItem('exploremate_cumulative_co2_saved', newCumulative.toString());

    // Record history
    const newRecord = {
      id: Date.now(),
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
      mode: activeMode.name,
      distanceKm: tripDistanceKm,
      savedKg: tripSavedKg
    };
    const updatedHistory = [newRecord, ...tripHistory].slice(0, 10);
    setTripHistory(updatedHistory);
    localStorage.setItem('exploremate_trip_history', JSON.stringify(updatedHistory));

    // Confetti celebration for zero-emission modes ONLY
    if (activeMode.celebrate && !reduceMotion) {
      confetti({
        particleCount: 90,
        spread: 75,
        origin: { y: 0.6 }
      });
    }

    // Check newly unlocked stories
    const newlyUnlocked = STORIES.filter(s => cumulativeSavedKg < s.unlockThresholdKg && newCumulative >= s.unlockThresholdKg);
    if (newlyUnlocked.length > 0) {
      setToastMessage(`🎉 Congratulations! You unlocked: "${newlyUnlocked[0].title}"!`);
      setTimeout(() => setToastMessage(null), 5000);
    } else {
      setToastMessage(`✅ Trip confirmed! Saved ${tripSavedKg} kg CO2.`);
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  // Reset progress handler for testing
  const handleResetProgress = () => {
    if (window.confirm('Reset all saved carbon and unlocked stories?')) {
      localStorage.removeItem('exploremate_cumulative_co2_saved');
      localStorage.removeItem('exploremate_trip_history');
      setCumulativeSavedKg(0.0);
      setTripHistory([]);
      setToastMessage('Carbon savings reset to 0 kg.');
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-5xl mx-auto pb-16">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-[1150] max-w-sm p-4 rounded-2xl bg-teal-900 text-white shadow-2xl border border-teal-500/50 flex items-center space-x-3 animate-fade-in">
          <Sparkles className="w-5 h-5 text-mustard-400 shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-3xl font-bold text-slate-900 dark:text-white">
            Carbon Footprint & Eco Lore
          </h2>
          <p className="text-xs text-slate-500">
            Real emissions math, gamified zero-carbon transport cards, and rich Pondicherry travel stories.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={handleResetProgress}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 text-xs transition"
            title="Reset carbon progress"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Progress</span>
          </button>
        </div>
      </div>

      {/* Cumulative Lifetime Savings Banner */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-teal-500/30 bg-gradient-to-r from-teal-500/10 via-emerald-500/10 to-teal-500/5 shadow-md flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-1 text-center md:text-left">
          <span className="text-[11px] font-extrabold uppercase tracking-widest text-teal-700 dark:text-teal-400">
            Persistent Eco-Impact
          </span>
          <div className="flex items-baseline space-x-3 justify-center md:justify-start">
            <span className="text-5xl font-extrabold text-slate-900 dark:text-white">
              {cumulativeSavedKg.toFixed(2)}
            </span>
            <span className="text-lg font-bold text-teal-600 dark:text-teal-400">
              kg CO2 Saved
            </span>
          </div>
          <p className="text-xs text-slate-500 max-w-md">
            Every zero-emission walk or pedal in Pondicherry accumulates toward unlocking local heritage stories.
          </p>
        </div>

        {/* Real World Equivalents */}
        <div className="flex items-center space-x-4 sm:space-x-6 shrink-0">
          <div className="text-center p-3 sm:p-4 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 shadow-sm">
            <div className="text-2xl mb-1">⚡</div>
            <div className="text-lg font-extrabold text-slate-900 dark:text-white">
              {phoneCharges}
            </div>
            <div className="text-[10px] text-slate-500 font-medium">
              Phone Charges
            </div>
          </div>

          <div className="text-center p-3 sm:p-4 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 shadow-sm">
            <div className="text-2xl mb-1">🌳</div>
            <div className="text-lg font-extrabold text-slate-900 dark:text-white">
              {treeDays}
            </div>
            <div className="text-[10px] text-slate-500 font-medium">
              Tree Sequestration Days
            </div>
          </div>
        </div>
      </div>

      {/* Carbon Calculator: 4 Selectable Option Cards */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800 pb-3">
          <span className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Step 1: Choose Your Transport Mode
          </span>
          <span className="text-[11px] text-teal-600 dark:text-teal-400 font-semibold">
            Baseline: 0.192 kg CO2 / km (Personal Car)
          </span>
        </div>

        {/* 4 Large Selectable Cards (2x2 on mobile, 4-in-a-row on desktop) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {EMISSION_OPTIONS.map((opt) => {
            const isSelected = selectedModeId === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setSelectedModeId(opt.id)}
                className={`p-5 rounded-3xl text-left border transition-all flex flex-col justify-between relative ${
                  isSelected
                    ? 'bg-teal-50/70 dark:bg-teal-950/40 border-teal-500 shadow-lg ring-2 ring-teal-500/30'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-3xl">{opt.icon}</span>
                    {isSelected && (
                      <CheckCircle2 className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                    )}
                  </div>
                  <h4 className="font-serif font-bold text-base text-slate-900 dark:text-white">
                    {opt.name}
                  </h4>
                  <span className="text-[11px] text-slate-500 block mb-2">
                    {opt.label}
                  </span>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-2">
                    {opt.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-baseline justify-between text-xs">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Rate</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {opt.co2PerKm} kg/km
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Step 2: Trip Distance Slider */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Step 2: Select Trip Distance
            </span>
            <span className="text-sm font-extrabold text-teal-600 dark:text-teal-400">
              {tripDistanceKm} Kilometers
            </span>
          </div>

          <input
            type="range"
            min="1"
            max="35"
            step="1"
            value={tripDistanceKm}
            onChange={(e) => setTripDistanceKm(Number(e.target.value))}
            className="w-full accent-teal-600 cursor-pointer h-2 bg-slate-200 dark:bg-slate-700 rounded-lg"
          />

          <div className="flex justify-between text-[10px] text-slate-400">
            <span>1 km (White Town Loop)</span>
            <span>12 km (Auroville / Matrimandir)</span>
            <span>25 km (Paradise & Chunnamber)</span>
            <span>35 km (Coastal Traverse)</span>
          </div>
        </div>

        {/* Step 3: Side-by-Side Comparison Bar */}
        <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              Emissions Comparison for {tripDistanceKm} km
            </span>
            <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">
              Avoided: {tripSavedKg} kg CO2
            </span>
          </div>

          <div className="space-y-2">
            {/* Car Bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] text-slate-500">
                <span>Personal Car Baseline (0.192 kg/km)</span>
                <span className="font-bold text-rose-600">{carBaselineEmission} kg CO2</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                <div className="bg-rose-500 h-full rounded-full w-full" />
              </div>
            </div>

            {/* Selected Mode Bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] text-slate-500">
                <span>Selected: {activeMode.name} ({activeMode.co2PerKm} kg/km)</span>
                <span className="font-bold text-teal-600 dark:text-teal-400">{activeModeEmission} kg CO2</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                <div 
                  className="bg-teal-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${carBaselineEmission > 0 ? (activeModeEmission / carBaselineEmission) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Confirm Button */}
        <button
          type="button"
          onClick={handleConfirmTrip}
          className={`w-full py-3.5 px-6 rounded-2xl font-bold text-sm shadow-md transition-all flex items-center justify-center space-x-2 ${
            activeMode.celebrate
              ? 'bg-teal-600 hover:bg-teal-700 text-white shadow-teal-600/20'
              : 'bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900'
          }`}
        >
          {activeMode.celebrate && <Sparkles className="w-4 h-4 text-mustard-300" />}
          <span>Confirm This Trip & Bank {tripSavedKg} kg CO2</span>
        </button>
      </div>

      {/* Gamified Travel Lore Chapters Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-serif text-2xl font-bold text-slate-900 dark:text-white">
              Pondicherry Eco Lore & Stories
            </h3>
            <p className="text-xs text-slate-500">
              4 vivid cultural stories unlocking as you accumulate real carbon savings.
            </p>
          </div>

          <span className="text-xs font-bold px-3 py-1 rounded-full bg-teal-100 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 border border-teal-300">
            {STORIES.filter(s => cumulativeSavedKg >= s.unlockThresholdKg).length} of {STORIES.length} Unlocked
          </span>
        </div>

        {/* Stories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {STORIES.map((story) => {
            const isUnlocked = cumulativeSavedKg >= story.unlockThresholdKg;
            const progressPct = Math.min(100, Math.round((cumulativeSavedKg / story.unlockThresholdKg) * 100));

            return (
              <div
                key={story.id}
                className={`glass-panel rounded-3xl overflow-hidden border transition-all flex flex-col justify-between shadow-md ${
                  isUnlocked 
                    ? 'border-mustard-500/40 hover:border-mustard-500' 
                    : 'border-slate-200 dark:border-slate-800 opacity-90'
                }`}
              >
                {/* Hero Header */}
                <div className="relative h-48 w-full overflow-hidden bg-slate-200 dark:bg-slate-800">
                  <img
                    src={story.heroImage}
                    alt={story.heroAlt}
                    className={`w-full h-full object-cover transition duration-500 ${isUnlocked ? 'scale-100' : 'grayscale blur-[1px]'}`}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/images/neutral_placeholder.svg';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-5 text-white">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-mustard-300 block">
                      {story.subtitle}
                    </span>
                    <h4 className="font-serif font-bold text-lg leading-tight">
                      {story.title}
                    </h4>
                  </div>

                  {/* Badge in top right */}
                  <div className="absolute top-3 right-3">
                    {isUnlocked ? (
                      <span className="flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/90 text-white backdrop-blur-sm shadow">
                        <Unlock className="w-3 h-3" />
                        <span>Unlocked</span>
                      </span>
                    ) : (
                      <span className="flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-black/70 text-slate-300 backdrop-blur-sm">
                        <Lock className="w-3 h-3" />
                        <span>Requires {story.unlockThresholdKg} kg</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Body Details */}
                <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-3">
                    {story.summary}
                  </p>

                  <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                    {/* Unlock Progress if locked */}
                    {!isUnlocked ? (
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] text-slate-500">
                          <span>Unlock Progress</span>
                          <span>{cumulativeSavedKg.toFixed(2)} / {story.unlockThresholdKg} kg ({progressPct}%)</span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className="bg-mustard-500 h-full rounded-full transition-all duration-500"
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                        <span className="flex items-center gap-1">
                          <Award className="w-3.5 h-3.5" />
                          <span>Award: {story.badgeAward}</span>
                        </span>
                        <span>{story.readingTimeMinutes} min read</span>
                      </div>
                    )}

                    {/* Action Button */}
                    <button
                      type="button"
                      onClick={() => setActiveStory(story)}
                      className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2 ${
                        isUnlocked
                          ? 'bg-mustard-600 hover:bg-mustard-700 text-white shadow-sm'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>{isUnlocked ? 'Read Vivid Story & Audio' : 'Preview Story Lore'}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Trip History Log */}
      {tripHistory.length > 0 && (
        <div className="glass-panel p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <History className="w-4 h-4 text-teal-600" />
              <span>Confirmed Green Trips History</span>
            </span>
            <span className="text-[11px] text-slate-400">
              {tripHistory.length} recorded
            </span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {tripHistory.map((trip) => (
              <div key={trip.id} className="py-2.5 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {trip.mode}
                  </span>
                  <span className="text-slate-400 text-[11px] ml-2">
                    ({trip.distanceKm} km on {trip.date})
                  </span>
                </div>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  +{trip.savedKg} kg CO2
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Story Reader Modal */}
      {activeStory && (
        <StoryReader
          story={activeStory}
          onClose={() => setActiveStory(null)}
        />
      )}
    </div>
  );
}

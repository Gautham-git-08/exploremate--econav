import React, { createContext, useContext, useState, useEffect } from 'react';
import { PLACES } from '../data/places.js';

const AppContext = createContext(null);

const DEFAULT_ITINERARY_IDS = [];

const DEFAULT_BUDGET = {
  totalBudget: 10000,
  days: 1,
  people: 2,
  startTime: '08:30',
  travelMode: 'cycle', // walk, cycle, bus, auto, car
  interests: ['Heritage', 'Beaches'],
  pace: 'normal', // relaxed, normal, packed
  hasKidsOrSeniors: false
};

export function AppProvider({ children }) {
  // Itinerary Place IDs — only added when user selects destinations
  const [itineraryIds, setItineraryIds] = useState(() => {
    try {
      const saved = localStorage.getItem('exploremate_itinerary_ids');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Clear legacy pre-fixed default spots (3-spot or 4-spot)
          const isLegacy = (parsed.length === 3 &&
            parsed.includes('aurobindo-ashram') &&
            parsed.includes('white-town') &&
            parsed.includes('promenade-beach')) ||
            (parsed.length === 4 &&
            parsed.includes('promenade-beach') &&
            parsed.includes('white-town') &&
            parsed.includes('matrimandir-centre') &&
            parsed.includes('serenity-beach'));
          if (!isLegacy) return parsed;
          localStorage.removeItem('exploremate_itinerary_ids');
        }
      }
    } catch (e) {
      console.warn('Error reading exploremate_itinerary_ids:', e);
    }
    return DEFAULT_ITINERARY_IDS;
  });

  // Locked Stops in Planner (IDs of places whose position is locked)
  const [lockedPlaceIds, setLockedPlaceIds] = useState(() => {
    try {
      const saved = localStorage.getItem('exploremate_locked_stops');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Budget & Travel Preferences
  const [budgetConfig, setBudgetConfig] = useState(() => {
    try {
      const saved = localStorage.getItem('exploremate_budget_config');
      return saved ? { ...DEFAULT_BUDGET, ...JSON.parse(saved) } : DEFAULT_BUDGET;
    } catch {
      return DEFAULT_BUDGET;
    }
  });

  // Toast / Notification
  const [toast, setTo] = useState(null);

  const showToast = (message, type = 'success') => {
    setTo({ message, type, id: Date.now() });
    setTimeout(() => {
      setTo(null);
    }, 3500);
  };

  // Sync itineraryIds to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('exploremate_itinerary_ids', JSON.stringify(itineraryIds));
    } catch (e) {
      console.warn('Failed to save itinerary to localStorage:', e);
    }
  }, [itineraryIds]);

  // Sync lockedPlaceIds to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('exploremate_locked_stops', JSON.stringify(lockedPlaceIds));
    } catch (e) {
      console.warn('Failed to save locked stops to localStorage:', e);
    }
  }, [lockedPlaceIds]);

  // Sync budgetConfig to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('exploremate_budget_config', JSON.stringify(budgetConfig));
    } catch (e) {
      console.warn('Failed to save budget config to localStorage:', e);
    }
  }, [budgetConfig]);

  // Resolve full place objects for selected itinerary
  const selectedPlaces = itineraryIds
    .map(id => PLACES.find(p => p.id === id))
    .filter(Boolean);

  const isInItinerary = (placeId) => itineraryIds.includes(placeId);

  const addPlaceToItinerary = (placeOrId) => {
    const id = typeof placeOrId === 'string' ? placeOrId : placeOrId?.id;
    if (!id) return false;

    if (itineraryIds.includes(id)) {
      showToast('Place is already in your itinerary.', 'info');
      return false;
    }

    const place = PLACES.find(p => p.id === id);
    const placeName = place ? place.name : 'Place';

    setItineraryIds(prev => [...prev, id]);
    showToast(`Added "${placeName}" to your itinerary!`, 'success');
    return true;
  };

  const removePlaceFromItinerary = (placeOrId) => {
    const id = typeof placeOrId === 'string' ? placeOrId : placeOrId?.id;
    if (!id) return;

    const place = PLACES.find(p => p.id === id);
    const placeName = place ? place.name : 'Place';

    setItineraryIds(prev => prev.filter(item => item !== id));
    setLockedPlaceIds(prev => prev.filter(item => item !== id));
    showToast(`Removed "${placeName}" from your itinerary.`, 'info');
  };

  const togglePlaceInItinerary = (placeOrId) => {
    const id = typeof placeOrId === 'string' ? placeOrId : placeOrId?.id;
    if (isInItinerary(id)) {
      removePlaceFromItinerary(id);
    } else {
      addPlaceToItinerary(id);
    }
  };

  const toggleLockPlace = (placeId) => {
    setLockedPlaceIds(prev => 
      prev.includes(placeId) ? prev.filter(id => id !== placeId) : [...prev, placeId]
    );
  };

  const reorderItinerary = (newIds) => {
    setItineraryIds(newIds);
  };

  const updateBudget = (updates) => {
    setBudgetConfig(prev => ({ ...prev, ...updates }));
  };

  const clearItinerary = () => {
    setItineraryIds([]);
    setLockedPlaceIds([]);
    showToast('Itinerary cleared.', 'info');
  };

  return (
    <AppContext.Provider
      value={{
        itineraryIds,
        selectedPlaces,
        isInItinerary,
        addPlaceToItinerary,
        removePlaceFromItinerary,
        togglePlaceInItinerary,
        lockedPlaceIds,
        toggleLockPlace,
        reorderItinerary,
        clearItinerary,
        budgetConfig,
        updateBudget,
        showToast,
        allPlaces: PLACES
      }}
    >
      {children}
      {/* Toast Notification Container */}
      {toast && (
        <div className="fixed bottom-20 right-6 z-[99999] max-w-sm animate-bounce-in">
          <div className={`px-4 py-3 rounded-2xl shadow-2xl backdrop-blur-md border text-sm font-medium flex items-center space-x-3 ${
            toast.type === 'success' 
              ? 'bg-emerald-900/90 text-emerald-100 border-emerald-500/50' 
              : 'bg-slate-900/90 text-slate-100 border-slate-700/50'
          }`}>
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

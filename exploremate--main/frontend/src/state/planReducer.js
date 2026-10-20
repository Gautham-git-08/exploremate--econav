import { useReducer, useEffect } from 'react';
// planReducer.js
// Handles itinerary state, undo/redo, and localStorage persistence for ExploreMate.

/**
 * Initial itinerary used when no saved plan exists.
 * Contains a few sample stops; the UI will render these.
 */
const defaultItinerary = [
  {
    id: 'aurobindo-ashram',
    name: 'Sri Aurobindo Ashram',
    timeSlot: '08:30 AM - 10:00 AM',
    durationMinutes: 90,
    cost: 0,
    isIndoor: true,
    stopNumber: 1,
  },
  {
    id: 'french-quarter',
    name: 'White Town (French Quarter Heritage Walk)',
    timeSlot: '10:15 AM - 12:30 PM',
    durationMinutes: 135,
    cost: 0,
    isIndoor: false,
    stopNumber: 2,
  },
  {
    id: 'promenade-beach',
    name: 'Promenade Rock Beach',
    timeSlot: '04:30 PM - 06:30 PM',
    durationMinutes: 120,
    cost: 0,
    isIndoor: false,
    stopNumber: 3,
  },
];

// Load saved itinerary from localStorage if present.
const loadFromStorage = () => {
  try {
    const stored = localStorage.getItem('exploremate_plan');
    if (stored) {
      const parsed = JSON.parse(stored);
      // Basic validation – ensure we have an array of stops.
      if (Array.isArray(parsed.itinerary)) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to parse saved plan:', e);
  }
  // Fallback to default.
  return { itinerary: defaultItinerary, undoStack: [], redoStack: [] };
};

/**
 * Reducer handling itinerary mutations.
 *
 * State shape:
 *   {
 *     itinerary: Array<stop>,
 *     undoStack: Array<Array<stop>>, // previous itineraries
 *     redoStack: Array<Array<stop>>, // undone itineraries
 *   }
 */
export const planReducer = (state, action) => {
  switch (action.type) {
    case 'SET_STATE': {
      // Replace whole state – used only on load.
      return { ...state, ...action.payload };
    }
    case 'EXTEND_TIME': {
      const { stopId, minutes } = action.payload;
      const newItinerary = state.itinerary.map((stop) =>
        stop.id === stopId
          ? {
              ...stop,
              durationMinutes: stop.durationMinutes + minutes,
              timeSlot: `${stop.timeSlot} (+${minutes}m)`,
            }
          : stop
      );
      return {
        itinerary: newItinerary,
        undoStack: [...state.undoStack, state.itinerary].slice(-20), // keep last 20
        redoStack: [],
      };
    }
    case 'REMOVE_STOP': {
      const { stopId } = action.payload;
      const newItinerary = state.itinerary.filter((s) => s.id !== stopId);
      return {
        itinerary: newItinerary,
        undoStack: [...state.undoStack, state.itinerary].slice(-20),
        redoStack: [],
      };
    }
    case 'UNDO': {
      if (state.undoStack.length === 0) return state;
      const previous = state.undoStack[state.undoStack.length - 1];
      const newUndo = state.undoStack.slice(0, -1);
      return {
        itinerary: previous,
        undoStack: newUndo,
        redoStack: [state.itinerary, ...state.redoStack].slice(0, 20),
      };
    }
    case 'REDO': {
      if (state.redoStack.length === 0) return state;
      const next = state.redoStack[0];
      const newRedo = state.redoStack.slice(1);
      return {
        itinerary: next,
        undoStack: [...state.undoStack, state.itinerary].slice(-20),
        redoStack: newRedo,
      };
    }
    default:
      return state;
  }
};

/**
 * Helper hook to initialise reducer with persisted state.
 * Returns [state, dispatch] exactly like useReducer.
 */
export const usePlanState = (initialArg) => {
  // `initialArg` is ignored – we always load from storage/default.
  const [state, dispatch] = useReducer(planReducer, {}, loadFromStorage);

  // Persist after every change.
  useEffect(() => {
    try {
      const payload = JSON.stringify({ itinerary: state.itinerary });
      localStorage.setItem('exploremate_plan', payload);
    } catch (_) {
      // ignore storage errors.
    }
  }, [state.itinerary]);

  return [state, dispatch];
};

// Export default for convenience.
export default planReducer;

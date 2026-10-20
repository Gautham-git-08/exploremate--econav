/**
 * ExploreMate Interactive Map Tab
 * - Live Leaflet map displaying itinerary places in optimised visiting order
 * - Numbered markers (1, 2, 3...) with rich popups (fee, hours, arrival/leave, travel leg details)
 * - Route polylines colored dynamically by transport mode (walk, cycle, bus, auto, car)
 * - Automatic fitBounds when stops update
 * - Filters by Day and by Category
 * - Optional toggle to overlay all 43 Pondicherry landmarks
 */

import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  MapPin, Navigation, Compass, AlertCircle, RefreshCw, ZoomIn, 
  LocateFixed, Eye, EyeOff, Layers, Footprints, Bike, Bus, Car, Filter
} from 'lucide-react';
import { PONDY_BOUNDS } from '../config/constants';
import { PLACES, CATEGORIES, isPlaceOpenNow } from '../data/places.js';
import { useApp } from '../context/AppContext.jsx';
import { useSettings } from '../context/SettingsContext.jsx';
import { generateSmartItinerary } from '../utils/planner.js';

// Fix bundler icon issue with Leaflet default icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Color palette for transport mode routes
const MODE_COLORS = {
  walk: '#10B981',    // Emerald Green
  cycle: '#0D9488',   // Teal
  bus: '#3B82F6',     // Blue
  auto: '#F59E0B',    // Amber
  car: '#EF4444'      // Red
};

// Custom numbered gold stop pin generator
const createNumberedStopIcon = (stopNumber) => {
  return L.divIcon({
    className: 'custom-stop-marker',
    html: `
      <div style="
        background: linear-gradient(135deg, #EAA82C, #D97706);
        color: #0F172A;
        font-weight: 800;
        font-size: 12px;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 2.5px solid white;
        box-shadow: 0 4px 10px rgba(0,0,0,0.35);
        transform: translateY(-4px);
      ">
        ${stopNumber}
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -20]
  });
};

// Subtle icon for non-itinerary catalog destinations
const createCatalogIcon = (category) => {
  return L.divIcon({
    className: 'catalog-marker',
    html: `
      <div style="
        background: #0F172A;
        color: white;
        width: 14px;
        height: 14px;
        border-radius: 50%;
        border: 2px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.25);
        opacity: 0.75;
      "></div>
    `,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
    popupAnchor: [0, -10]
  });
};

export default function MapTab() {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const layersGroupRef = useRef(null);

  const { itineraryIds, budgetConfig, lockedPlaceIds } = useApp();
  const { weatherSimulation } = useSettings();

  const [selectedDay, setSelectedDay] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showAllPlaces, setShowAllPlaces] = useState(true);
  const [tileError, setTileError] = useState(false);
  const [locating, setLocating] = useState(false);

  const isRaining = 
    weatherSimulation === 'light_rain' || 
    weatherSimulation === 'heavy_rain' || 
    weatherSimulation === 'thunderstorm';

  // Compute optimized plan
  const plan = useMemo(() => {
    return generateSmartItinerary({
      placeIds: itineraryIds,
      budgetConfig,
      lockedPlaceIds,
      isRaining,
      startDayOfWeek: new Date().getDay()
    });
  }, [itineraryIds, budgetConfig, lockedPlaceIds, isRaining]);

  // Extract stops based on Day filter
  const currentStops = useMemo(() => {
    if (!plan || !plan.days) return [];
    if (selectedDay === 'all') {
      return plan.days.flatMap(d => d.stops.filter(s => !s.isBreak));
    }
    const dayObj = plan.days.find(d => d.dayNumber === Number(selectedDay));
    return dayObj ? dayObj.stops.filter(s => !s.isBreak) : [];
  }, [plan, selectedDay]);

  // Extract travel legs based on Day filter
  const currentLegs = useMemo(() => {
    if (!plan || !plan.days) return [];
    if (selectedDay === 'all') {
      return plan.days.flatMap(d => d.travelLegs);
    }
    const dayObj = plan.days.find(d => d.dayNumber === Number(selectedDay));
    return dayObj ? dayObj.travelLegs : [];
  }, [plan, selectedDay]);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: PONDY_BOUNDS.center,
        zoom: PONDY_BOUNDS.zoom,
        zoomControl: true,
      });

      const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      tileLayer.on('tileerror', () => {
        setTileError(true);
      });

      layersGroupRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;

      setTimeout(() => {
        map.invalidateSize();
      }, 150);
    }

    const handleResize = () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Update Markers, Polylines, and FitBounds reactively
  useEffect(() => {
    if (!mapInstanceRef.current || !layersGroupRef.current) return;

    const map = mapInstanceRef.current;
    const group = layersGroupRef.current;
    group.clearLayers();

    const bounds = L.latLngBounds();

    // 1. Render all 43 places as subtle background markers if enabled
    if (showAllPlaces) {
      PLACES.forEach(place => {
        if (selectedCategory !== 'All' && place.category.toLowerCase() !== selectedCategory.toLowerCase()) {
          return;
        }

        // Check if this place is already an active stop
        const isStop = currentStops.some(s => s.id === place.id);
        if (!isStop && typeof place.lat === 'number' && typeof place.lng === 'number') {
          const bgMarker = L.marker([place.lat, place.lng], { icon: createCatalogIcon(place.category) });
          bgMarker.bindPopup(`
            <div style="font-family: inherit; font-size: 12px; color: #0F172A; min-width: 170px;">
              <div style="font-weight: 700; font-size: 13px;">${place.name}</div>
              <div style="color: #0E7490; font-size: 11px; font-weight: 600;">${place.category}</div>
              <div style="margin-top: 4px; font-size: 11px; color: #475569;">${place.feeNote}</div>
              <div style="font-size: 11px; color: #64748B;">${place.hoursNote}</div>
            </div>
          `);
          group.addLayer(bgMarker);
        }
      });
    }

    // 2. Render Itinerary Stops with Numbered Markers
    currentStops.forEach((stop, idx) => {
      if (typeof stop.lat === 'number' && typeof stop.lng === 'number') {
        const stopNumber = idx + 1;
        const marker = L.marker([stop.lat, stop.lng], {
          icon: createNumberedStopIcon(stopNumber),
          zIndexOffset: 1000 + idx
        });

        marker.bindPopup(`
          <div style="font-family: inherit; font-size: 12px; color: #0F172A; min-width: 200px;">
            <div style="font-size: 11px; font-weight: 800; color: #D97706; text-transform: uppercase;">
              Stop #${stopNumber} • ${stop.category || 'Destination'}
            </div>
            <div style="font-weight: 700; font-size: 14px; margin-top: 2px; margin-bottom: 4px;">
              ${stop.name}
            </div>
            <div style="background: #F1F5F9; padding: 6px 8px; border-radius: 8px; margin-bottom: 6px; font-size: 11px;">
              <div>Time: <b>${stop.arriveTime} - ${stop.leaveTime}</b></div>
              <div>Entry: <b>${stop.entryFee === 0 ? 'Free' : '₹' + stop.entryFee}</b></div>
              <div>Visiting: <b>${stop.hoursNote || 'Check on arrival'}</b></div>
            </div>
            <div style="font-size: 11px; color: #64748B;">
              ${stop.whyThisOrder || ''}
            </div>
          </div>
        `);

        group.addLayer(marker);
        bounds.extend([stop.lat, stop.lng]);
      }
    });

    // 3. Render Mode-Colored Route Polylines between consecutive stops
    for (let i = 0; i < currentStops.length - 1; i++) {
      const from = currentStops[i];
      const to = currentStops[i + 1];

      if (typeof from.lat === 'number' && typeof from.lng === 'number' &&
          typeof to.lat === 'number' && typeof to.lng === 'number') {
        
        const leg = currentLegs[i];
        const mode = leg?.mode || budgetConfig.travelMode || 'cycle';
        const color = MODE_COLORS[mode] || '#EAA82C';

        const poly = L.polyline([[from.lat, from.lng], [to.lat, to.lng]], {
          color,
          weight: 5,
          opacity: 0.85,
          dashArray: mode === 'walk' ? '4, 8' : undefined,
          lineCap: 'round'
        });

        poly.bindTooltip(`${mode.toUpperCase()}: ${leg?.distanceKm || '1'} km (~${leg?.minutes || 10}m)`, {
          sticky: true,
          direction: 'top'
        });

        group.addLayer(poly);
      }
    }

    // Auto fitBounds if we have itinerary stops
    if (bounds.isValid() && currentStops.length > 0) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
  }, [currentStops, currentLegs, showAllPlaces, selectedCategory]);

  const handleFitAll = () => {
    if (!mapInstanceRef.current) return;
    const bounds = L.latLngBounds();
    currentStops.forEach(s => {
      if (typeof s.lat === 'number' && typeof s.lng === 'number') {
        bounds.extend([s.lat, s.lng]);
      }
    });

    if (bounds.isValid()) {
      mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    } else {
      mapInstanceRef.current.setView(PONDY_BOUNDS.center, PONDY_BOUNDS.zoom);
    }
  };

  const handleLocateMe = () => {
    if (!mapInstanceRef.current) return;
    setLocating(true);

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocating(false);
          const { latitude, longitude } = pos.coords;
          mapInstanceRef.current.setView([latitude, longitude], 15);
          L.marker([latitude, longitude])
            .addTo(mapInstanceRef.current)
            .bindPopup("<b>You are here</b>")
            .openPopup();
        },
        () => {
          setLocating(false);
          // Default to White Town center
          mapInstanceRef.current.setView([11.9338, 79.8359], 15);
        },
        { timeout: 7000 }
      );
    } else {
      setLocating(false);
      mapInstanceRef.current.setView([11.9338, 79.8359], 15);
    }
  };

  return (
    <div className="space-y-4 animate-fade-in pb-16">
      {/* Header & Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-serif text-3xl font-bold text-slate-900 dark:text-white">
            Pondicherry Interactive Route Map
          </h2>
          <p className="text-xs text-slate-500">
            Numbered stops in visiting order with mode-colored transit polylines.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={handleFitAll}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition shadow-sm"
          >
            <ZoomIn className="w-3.5 h-3.5" />
            <span>Fit All Stops</span>
          </button>

          <button
            type="button"
            onClick={handleLocateMe}
            disabled={locating}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition shadow-sm disabled:opacity-50"
          >
            <LocateFixed className={`w-3.5 h-3.5 ${locating ? 'animate-spin' : ''}`} />
            <span>Locate Me</span>
          </button>

          <button
            type="button"
            onClick={() => setShowAllPlaces(!showAllPlaces)}
            className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition shadow-sm ${
              showAllPlaces
                ? 'bg-mustard-600 text-white'
                : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200'
            }`}
          >
            {showAllPlaces ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">All 43 Spots</span>
          </button>
        </div>
      </div>

      {/* Filter Chips Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 glass-panel p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
        {/* Day Filter */}
        <div className="flex items-center space-x-2 text-xs">
          <span className="font-bold text-slate-500 uppercase text-[10px] tracking-wider">Day:</span>
          <select
            value={selectedDay}
            onChange={(e) => setSelectedDay(e.target.value)}
            className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium"
          >
            <option value="all">All Days ({currentStops.length} stops)</option>
            {plan.days && plan.days.map(d => (
              <option key={d.dayNumber} value={d.dayNumber}>Day {d.dayNumber}</option>
            ))}
          </select>
        </div>

        {/* Category Filter */}
        <div className="flex items-center space-x-1.5 overflow-x-auto text-xs no-scrollbar">
          <span className="font-bold text-slate-500 uppercase text-[10px] tracking-wider shrink-0">Filter:</span>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 rounded-xl whitespace-nowrap transition text-[11px] font-medium ${
                selectedCategory === cat
                  ? 'bg-mustard-500 text-slate-950 font-bold'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Mode Color Legend Strip */}
      <div className="flex items-center space-x-4 text-xs font-medium text-slate-600 dark:text-slate-300 px-2 flex-wrap gap-y-1">
        <span className="text-[11px] font-bold uppercase text-slate-400">Route Leg Colors:</span>
        <div className="flex items-center space-x-1.5">
          <span className="w-3 h-3 rounded-full bg-[#10B981]" />
          <span>Walk (≤2km)</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-3 h-3 rounded-full bg-[#0D9488]" />
          <span>Cycle (2–8km)</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-3 h-3 rounded-full bg-[#3B82F6]" />
          <span>Bus (8–25km)</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-3 h-3 rounded-full bg-[#F59E0B]" />
          <span>Auto-rickshaw</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-3 h-3 rounded-full bg-[#EF4444]" />
          <span>Taxi / Cab</span>
        </div>
      </div>

      {/* Map Container */}
      <div className="relative w-full h-[620px] rounded-3xl overflow-hidden shadow-xl border border-slate-200 dark:border-slate-800">
        <div ref={mapContainerRef} className="w-full h-full z-10" />

        {tileError && (
          <div className="absolute top-4 left-4 z-[500] bg-rose-500 text-white text-xs px-3 py-1.5 rounded-xl shadow-lg flex items-center space-x-1.5">
            <AlertCircle className="w-4 h-4" />
            <span>Tile server connectivity intermittent. Reconnecting...</span>
          </div>
        )}
      </div>
    </div>
  );
}

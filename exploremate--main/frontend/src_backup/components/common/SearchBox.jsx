/**
 * ExploreMate Global Search Box
 * - Clicking/focusing opens dropdown showing all 43 places.
 * - Live filtering by place name, category, and tags.
 * - Shows thumbnail (with onError fallback), category chip, and entry fee.
 * - Scrollable max-height ~60vh, z-[9999], click-outside handler, keyboard navigation.
 */

import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Compass, MapPin, Tag, Check } from 'lucide-react';
import { PLACES, FALLBACK_IMAGE, CATEGORIES, isPlaceOpenNow } from '../../data/places.js';
import { useApp } from '../../context/AppContext.jsx';

export default function SearchBox({ onSelectPlace, setActiveTab }) {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  const { addPlaceToItinerary, isInItinerary } = useApp();

  // Filter places based on query and selected category
  const filteredPlaces = PLACES.filter((place) => {
    // Category match
    const matchesCategory =
      selectedCategory === 'All' ||
      place.category.toLowerCase() === selectedCategory.toLowerCase();

    if (!matchesCategory) return false;

    // Query match
    if (!query.trim()) return true;

    const q = query.toLowerCase().trim();
    const nameMatch = place.name.toLowerCase().includes(q);
    const catMatch = place.category.toLowerCase().includes(q);
    const descMatch = (place.description || '').toLowerCase().includes(q);
    const feeMatch = (place.feeNote || '').toLowerCase().includes(q);

    return nameMatch || catMatch || descMatch || feeMatch;
  });

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
      return;
    }

    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < filteredPlaces.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : filteredPlaces.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < filteredPlaces.length) {
        handleSelectPlace(filteredPlaces[selectedIndex]);
      } else if (filteredPlaces.length > 0) {
        handleSelectPlace(filteredPlaces[0]);
      }
    }
  };

  const handleSelectPlace = (place) => {
    setIsOpen(false);
    setQuery(place.name);
    if (onSelectPlace) {
      onSelectPlace(place);
    }
    if (setActiveTab) {
      setActiveTab('destinations');
    }
  };

  const handleClear = () => {
    setQuery('');
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-2xl mx-auto space-y-2.5 z-50">
      {/* Category Filter Chips */}
      <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => {
              setSelectedCategory(cat);
              setIsOpen(true);
            }}
            className={`px-3 py-1 rounded-full whitespace-nowrap font-medium transition ${
              selectedCategory === cat
                ? 'bg-mustard-500 text-slate-950 font-bold shadow-sm'
                : 'bg-white/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Search Input Bar */}
      <div className="relative flex items-center">
        <Search className="w-5 h-5 absolute left-3.5 text-slate-400 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!isOpen) setIsOpen(true);
            setSelectedIndex(-1);
          }}
          onFocus={() => setIsOpen(true)}
          onClick={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search all 43 Pondicherry places (e.g. 'Rock Beach', 'Ashram', 'French')..."
          aria-label="Search all 43 Pondicherry places"
          aria-expanded={isOpen}
          role="combobox"
          className="w-full pl-10 pr-10 py-3.5 text-sm bg-white dark:bg-slate-800 border-2 border-mustard-500/30 hover:border-mustard-500 focus:border-mustard-500 rounded-2xl focus:outline-none focus:ring-4 focus:ring-mustard-500/20 shadow-lg text-slate-900 dark:text-white transition"
        />

        {query && (
          <button
            type="button"
            onClick={handleClear}
            aria-label="Clear search"
            className="absolute right-3.5 p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Dropdown displaying ALL 43 places (or filtered results) */}
      {isOpen && (
        <div
          ref={dropdownRef}
          role="listbox"
          className="absolute top-full left-0 right-0 z-[9999] mt-2 max-h-[60vh] overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl divide-y divide-slate-100 dark:divide-slate-800/80 animate-fade-in"
        >
          {/* Dropdown Header showing count */}
          <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700/60 sticky top-0 backdrop-blur-sm z-10">
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              Showing {filteredPlaces.length} of {PLACES.length} places
            </span>
            <span className="text-[11px]">Click to view details</span>
          </div>

          {filteredPlaces.length > 0 ? (
            filteredPlaces.map((place, idx) => {
              const isSelected = idx === selectedIndex;
              const openStatus = isPlaceOpenNow(place);
              const inPlan = isInItinerary(place.id);

              return (
                <div
                  key={place.id}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelectPlace(place)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`p-3 sm:p-3.5 flex items-center justify-between cursor-pointer transition ${
                    isSelected
                      ? 'bg-mustard-50 dark:bg-mustard-950/40 text-mustard-950 dark:text-mustard-100'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-800 dark:text-slate-200'
                  }`}
                >
                  <div className="flex items-center space-x-3 min-w-0 pr-2">
                    {/* Image Thumbnail */}
                    <img
                      src={place.image}
                      alt={place.name}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = FALLBACK_IMAGE;
                      }}
                      className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl object-cover shrink-0 shadow-sm border border-slate-200/60 dark:border-slate-700/60"
                    />

                    <div className="min-w-0">
                      <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                        <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                          {place.name}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-mustard-100 dark:bg-mustard-950/60 text-mustard-800 dark:text-mustard-300">
                          {place.category}
                        </span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-medium ${openStatus.badgeColor}`}>
                          {openStatus.statusText}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                        {place.description}
                      </p>
                    </div>
                  </div>

                  {/* Fee & Action */}
                  <div className="text-right shrink-0 flex flex-col items-end space-y-1">
                    <span className="text-xs font-bold text-teal-700 dark:text-teal-400">
                      {place.entryFee === 0 ? 'Free' : `₹${place.entryFee}`}
                    </span>
                    {inPlan && (
                      <span className="inline-flex items-center text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                        <Check className="w-3 h-3 mr-0.5" /> In Plan
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center text-xs text-slate-500 dark:text-slate-400 space-y-2">
              <Compass className="w-8 h-8 mx-auto text-slate-400 opacity-60" />
              <p className="font-medium text-slate-700 dark:text-slate-300">
                No Pondicherry places match "{query}"
              </p>
              <p className="text-[11px]">
                Try searching for "Promenade", "Ashram", "Museum", or "Matrimandir".
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

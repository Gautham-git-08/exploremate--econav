/**
 * ExploreMate Stays Tab & Hotels Tab
 * Guesthouses, homestays, hostels, and hotels with price filters, amenities,
 * and direct booking / navigation links.
 */

import React, { useState, useEffect } from 'react';
import { Bed, Star, MapPin, ExternalLink, ShieldCheck, Heart } from 'lucide-react';
import { getDestinationMedia, FALLBACK_IMAGE } from '../config/destinations';

export default function StaysTab() {
  const [filterType, setFilterType] = useState('all'); // all, guesthouse, hostel, resort, hotel

  const stays = [
    {
      id: 'greens-guesthouse',
      name: "Green's Guesthouse",
      type: 'guesthouse',
      area: 'Auroville Road',
      pricePerNight: 1600,
      rating: 4.6,
      image: '/photos/Auroville_Green_guesthouse.png',
      image_credit: 'ExploreMate Team',
      ecoCertified: true,
      description: 'Peaceful eco-friendly guesthouse surrounded by organic gardens near the Auroville solar kitchen.'
    },
    {
      id: 'maison-perumal',
      name: 'Maison Perumal - CGH Earth',
      type: 'hotel',
      area: 'Tamil Quarter',
      pricePerNight: 7500,
      rating: 4.8,
      image: '/photos/Maison Perumal - CGH Earth.jpg.jpeg',
      image_credit: 'ExploreMate Team',
      ecoCertified: true,
      description: 'Restored 130-year-old Tamil-French mansion celebrating Chettinad architecture and slow travel.'
    },
    {
      id: 'dune-eco-village',
      name: 'Dune Eco Village & Beach Resort',
      type: 'resort',
      area: 'Puducherry Coast',
      pricePerNight: 9200,
      rating: 4.7,
      image: '/photos/dune eco.png',
      image_credit: 'ExploreMate Team',
      ecoCertified: true,
      description: 'Expansive 35-acre organic eco-resort along the Coromandel coast with reclaimed wood bungalows.'
    },
    {
      id: 'promenade-hotel',
      name: 'The Promenade Seafront Hotel',
      type: 'hotel',
      area: 'White Town',
      pricePerNight: 8500,
      rating: 4.7,
      image: '/photos/Promenade Seafront Boutique Hotel.avif',
      image_credit: 'ExploreMate Team',
      ecoCertified: false,
      description: 'Iconic luxury seafront boutique hotel overlooking the Bay of Bengal and French War Memorial.'
    },
    {
      id: 'nomad-hostel',
      name: 'Pondy Nomad Backpacker Hostel',
      type: 'hostel',
      area: 'Heritage Town',
      pricePerNight: 750,
      rating: 4.4,
      image: '/photos/white_town_reference.jpg.jpeg',
      image_credit: 'ExploreMate Team',
      ecoCertified: true,
      description: 'Vibrant budget hostel for solo backpackers with bicycle rentals, common lounge, and walking tours.'
    }
  ];

  const filtered = stays.filter(s => {
    if (filterType === 'all') return true;
    return s.type === filterType;
  });

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-3xl font-bold text-slate-900 dark:text-white">
            Pondicherry Stays & Hostels
          </h2>
          <p className="text-xs text-slate-500">
            Heritage guesthouses, eco-resorts, and backpacker hostels. All rates in INR.
          </p>
        </div>

        {/* Filter chips */}
        <div className="flex flex-wrap gap-2">
          {['all', 'guesthouse', 'hostel', 'hotel', 'resort'].map((f) => (
            <button
              key={f}
              onClick={() => setFilterType(f)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium capitalize transition ${
                filterType === f
                  ? 'bg-mustard-600 text-white shadow'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
              }`}
            >
              {f === 'all' ? 'All Stays' : `${f}s`}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((stay) => (
          <div
            key={stay.id}
            className="glass-panel rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col justify-between hover:shadow-xl transition"
          >
            <div>
              <div className="relative aspect-video w-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                <img
                  src={getDestinationMedia(stay.id, stay.name).src}
                  alt={getDestinationMedia(stay.id, stay.name).alt}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={(e) => { e.target.src = FALLBACK_IMAGE; }}
                />
                <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full text-xs font-semibold text-white">
                  ★ {stay.rating}
                </div>
                {stay.ecoCertified && (
                  <div className="absolute top-3 left-3 bg-leaf-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center space-x-1 shadow">
                    <ShieldCheck className="w-3 h-3" />
                    <span>Eco Certified</span>
                  </div>
                )}
              </div>

              <div className="p-5 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-serif text-lg font-bold text-slate-900 dark:text-white line-clamp-1">
                    {stay.name}
                  </h3>
                </div>
                <div className="text-xs text-teal-700 dark:text-teal-400 font-medium flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {stay.area}
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                  {stay.description}
                </p>
              </div>
            </div>

            <div className="p-5 pt-0 border-t border-slate-100 dark:border-slate-800/60 mt-2 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-400 block">Per night</span>
                <span className="font-serif text-lg font-bold text-slate-900 dark:text-white">
                  {stay.pricePerNight ? `${stay.pricePerNight} INR` : 'Price not verified'}
                </span>
              </div>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(stay.name + ' Pondicherry')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-mustard-600 hover:bg-mustard-700 text-white text-xs font-semibold rounded-xl shadow transition"
              >
                Book / View
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

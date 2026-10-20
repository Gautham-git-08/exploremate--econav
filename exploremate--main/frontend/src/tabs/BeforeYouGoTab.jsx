/**
 * ExploreMate Before You Go Tab
 * Vital travel guidelines: dress codes, hospital distances by Haversine,
 * safety helplines, photography rules, and coastal advisories.
 */

import React, { useState, useEffect } from 'react';
import { Shield, Phone, Hospital, AlertCircle, Camera, CheckCircle2, MapPin } from 'lucide-react';
import { SAFETY_NUMBERS } from '../config/constants';

export default function BeforeYouGoTab() {
  const [userLocation, setUserLocation] = useState(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude
          });
        },
        () => console.log("Location access denied or unavailable")
      );
    }
  }, []);

  // Nearest hospitals in Pondicherry
  const hospitals = [
    { name: "JIPMER (Jawaharlal Institute)", address: "Dhanvantri Nagar, Gorimedu", lat: 11.9545, lng: 79.7981, phone: "+91 413 2296000" },
    { name: "Indira Gandhi Govt General Hospital", address: "Victor Simonel St, White Town", lat: 11.9334, lng: 79.8330, phone: "+91 413 2336050" },
    { name: "PIMS (Pondicherry Institute of Medical Sciences)", address: "Kalapet", lat: 12.0232, lng: 79.8540, phone: "+91 413 2651111" }
  ];

  // Haversine calculation
  const getDistanceKm = (hLat, hLng) => {
    if (!userLocation) return null;
    const R = 6371;
    const dLat = (hLat - userLocation.lat) * (Math.PI / 180);
    const dLon = (hLng - userLocation.lng) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(userLocation.lat * (Math.PI / 180)) * Math.cos(hLat * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return (R * c).toFixed(1);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div>
        <h2 className="font-serif text-3xl font-bold text-slate-900 dark:text-white">
          Before You Go — Essential Pondicherry Guide
        </h2>
        <p className="text-xs text-slate-500">
          Emergency phone lines, nearest medical centers, dress codes, and coastal rules.
        </p>
      </div>

      {/* Safety Numbers Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: 'Police Control', num: SAFETY_NUMBERS.police, color: 'text-red-600' },
          { label: 'Ambulance', num: SAFETY_NUMBERS.ambulance, color: 'text-red-500' },
          { label: 'Tourist Helpline', num: SAFETY_NUMBERS.tourist, color: 'text-teal-600' },
          { label: 'Women Helpline', num: SAFETY_NUMBERS.women, color: 'text-pink-600' },
          { label: 'Fire Service', num: SAFETY_NUMBERS.fire, color: 'text-amber-600' },
        ].map((item) => (
          <div key={item.label} className="glass-panel p-4 rounded-2xl border border-slate-200 dark:border-slate-800 text-center">
            <span className="text-[11px] text-slate-500 block">{item.label}</span>
            <a href={`tel:${item.num}`} className={`text-xl font-bold ${item.color} hover:underline mt-1 block`}>
              {item.num}
            </a>
          </div>
        ))}
      </div>

      {/* Coastal Advisories */}
      <div className="p-5 rounded-3xl bg-amber-500/10 border border-amber-500/30 text-amber-950 dark:text-amber-200 space-y-2 text-xs leading-relaxed">
        <div className="flex items-center space-x-2 font-bold text-sm">
          <AlertCircle className="w-5 h-5 text-amber-600" />
          <span>Local Puducherry Municipality Advisories</span>
        </div>
        <p>
          • <strong>Promenade Beach Vehicle Restriction:</strong> Goubert Avenue is strictly a pedestrian-only zone daily from 06:00 PM to 07:30 AM. No cars or two-wheelers permitted.
        </p>
        <p>
          • <strong>Rock Beach Swimming:</strong> Swimming directly at Rock Beach / Promenade is strictly prohibited due to submerged tetrapods and dangerous rip currents. Swim only at designated beach clubs or Paradise Beach life-guarded zones.
        </p>
        <p>
          • <strong>White Town Heritage Respect:</strong> White Town is a residential neighborhood. Avoid loud music and littering.
        </p>
      </div>

      {/* Hospitals List with GPS Haversine */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-serif text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Hospital className="w-5 h-5 text-teal-600" />
            <span>Emergency Medical Centers & Hospitals</span>
          </h3>
          <span className="text-[11px] text-slate-400">
            {userLocation ? 'Distances calculated via GPS Haversine' : 'Enable GPS for exact distance'}
          </span>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
          {hospitals.map((hosp) => {
            const dist = getDistanceKm(hosp.lat, hosp.lng);
            return (
              <div key={hosp.name} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">{hosp.name}</h4>
                  <p className="text-slate-500 mt-0.5">{hosp.address}</p>
                </div>
                <div className="flex items-center space-x-4">
                  {dist && (
                    <span className="px-2.5 py-1 rounded-full bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 font-semibold">
                      {dist} km away
                    </span>
                  )}
                  <a
                    href={`tel:${hosp.phone}`}
                    className="px-3 py-1.5 bg-mustard-600 text-white rounded-xl font-medium hover:bg-mustard-700 transition"
                  >
                    Call {hosp.phone}
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

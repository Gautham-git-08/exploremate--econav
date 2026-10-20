/**
 * ExploreMate Welcome Screen
 * Fades after ~3 seconds or on "Get Started". Displays once per session.
 */

import React, { useState, useEffect } from 'react';
import { Compass, Sparkles, ArrowRight } from 'lucide-react';
import { BRAND_NAME } from '../../config/constants';

export default function WelcomeScreen({ onDismiss }) {
  const [visible, setVisible] = useState(() => {
    return !sessionStorage.getItem('exploremate_welcomed');
  });
  const [fading, setFading] = useState(false);

  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(() => {
      dismiss();
    }, 3200);
    return () => clearTimeout(timer);
  }, [visible]);

  const dismiss = () => {
    setFading(true);
    setTimeout(() => {
      sessionStorage.setItem('exploremate_welcomed', 'true');
      setVisible(false);
      if (onDismiss) onDismiss();
    }, 450);
  };

  if (!visible) return null;

  return (
    <div className={`fixed inset-0 z-[1100] flex items-center justify-center bg-[#FBF8F3] dark:bg-slate-950 transition-opacity duration-500 ${fading ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
      <div className="text-center p-6 max-w-sm sm:max-w-md mx-auto">
        <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-6 rounded-3xl bg-mustard-500/20 dark:bg-mustard-500/10 flex items-center justify-center p-4 border border-mustard-500/30 animate-pulse">
          <img 
            src="/logo.png" 
            alt={BRAND_NAME} 
            className="w-full h-full object-contain"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'block';
            }}
          />
          <Compass className="w-12 h-12 text-mustard-600 dark:text-mustard-400 hidden" />
        </div>

        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white tracking-tight">
          Welcome to {BRAND_NAME}
        </h1>

        <p className="mt-3 text-sm sm:text-base text-teal-700 dark:text-teal-400 font-medium">
          The French Riviera of the East · Eco-Heritage Coastal Haven
        </p>

        <p className="mt-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
          AI smart itineraries, carbon fuel stories, and live weather rerouting for Pondicherry.
        </p>

        <button
          onClick={dismiss}
          className="mt-8 inline-flex items-center space-x-2 px-6 py-2.5 rounded-full bg-mustard-600 hover:bg-mustard-700 text-white font-medium text-sm shadow-lg hover:shadow-xl transition"
        >
          <span>Get Started</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

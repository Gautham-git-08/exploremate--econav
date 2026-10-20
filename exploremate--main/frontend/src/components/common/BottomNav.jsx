/**
 * ExploreMate Bottom Navigation Bar (Mobile-first)
 * Displays 5 primary tabs + "More" drawer trigger on mobile viewports.
 */

import React, { useState } from 'react';
import { Home, Calendar, Map, Wallet, MoreHorizontal, Compass, Bed, CloudSun, Shield, Star, MessageSquare, BookOpen, Languages, Sparkles } from 'lucide-react';

export default function BottomNav({ activeTab, setActiveTab }) {
  const [showMore, setShowMore] = useState(false);

  const primaryTabs = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'plan', label: 'Itinerary', icon: Calendar },
    { id: 'map', label: 'Map', icon: Map },
    { id: 'destinations', label: 'Places', icon: Compass },
    { id: 'budget', label: 'Budget', icon: Wallet },
  ];

  const secondaryTabs = [
    { id: 'stays', label: 'Stays & Hostels', icon: Bed },
    { id: 'weather', label: 'Weather Live', icon: CloudSun },
    { id: 'chapters', label: 'Carbon Chapters', icon: Sparkles },
    { id: 'before_you_go', label: 'Before You Go', icon: Shield },
    { id: 'lostfound', label: 'Lost & Found', icon: MessageSquare },
    { id: 'translate', label: 'Translate (60+)', icon: Languages },
    { id: 'reviews', label: 'Reviews', icon: Star },
  ];

  return (
    <>
      {/* Mobile More Sheet */}
      {showMore && (
        <div 
          className="fixed inset-0 z-[690] bg-black/50 backdrop-blur-sm md:hidden"
          onClick={() => setShowMore(false)}
        >
          <div 
            className="absolute bottom-16 left-0 right-0 glass-panel rounded-t-3xl p-5 border-t border-slate-200 dark:border-slate-800 shadow-2xl animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-1 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-4" />
            <h4 className="font-serif font-bold text-slate-900 dark:text-white mb-3 text-center">
              Explore More Features
            </h4>
            <div className="grid grid-cols-3 gap-3">
              {secondaryTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      setShowMore(false);
                    }}
                    className={`flex flex-col items-center justify-center p-3 rounded-2xl transition ${
                      isActive 
                        ? 'bg-mustard-500 text-white shadow-md' 
                        : 'bg-slate-100/70 dark:bg-slate-800/70 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    <Icon className="w-5 h-5 mb-1.5" />
                    <span className="text-[11px] font-medium text-center line-clamp-1">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Main Bottom Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-[700] md:hidden glass-panel border-t border-slate-200 dark:border-slate-800 px-2 py-1.5">
        <div className="flex items-center justify-around">
          {primaryTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setShowMore(false);
                }}
                className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition ${
                  isActive 
                    ? 'text-mustard-600 dark:text-mustard-400 font-semibold' 
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.75]'}`} />
                <span className="text-[10px] mt-0.5">{tab.label}</span>
              </button>
            );
          })}
          
          {/* More trigger */}
          <button
            onClick={() => setShowMore(!showMore)}
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition ${
              showMore ? 'text-mustard-600 dark:text-mustard-400' : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <MoreHorizontal className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">More</span>
          </button>
        </div>
      </nav>
    </>
  );
}

/**
 * ExploreMate Navigation Header
 * - Single sticky top navbar across all viewports
 * - Left: Logo, wordmark, and Pondicherry subtitle
 * - Center: Primary tab links with active pill state and "More" dropdown
 * - Right: Language switcher (EN, TA, HI, FR), Theme toggle, Settings, and Mobile Hamburger
 * - Mobile: Responsive slide-down menu with full tab access
 */

import React, { useState } from 'react';
import { 
  Sun, Moon, Settings, MapPin, Compass, Menu, X, ChevronDown, 
  Calendar, Map, Sparkles, Languages, Bed, CloudSun, Shield, 
  MessageSquare, Star, Wallet, Home
} from 'lucide-react';
import { BRAND_NAME } from '../../config/constants';
import { useSettings } from '../../context/SettingsContext';

export default function Header({ activeTab, setActiveTab, onOpenSettings }) {
  const { theme, setTheme, language, setLanguage } = useSettings();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [moreDropdownOpen, setMoreDropdownOpen] = useState(false);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const primaryNavItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'destinations', label: 'Destinations', icon: Compass },
    { id: 'plan', label: 'Smart Itinerary', icon: Calendar },
    { id: 'map', label: 'Map', icon: Map },
    { id: 'chapters', label: 'Carbon Chapters', icon: Sparkles },
    { id: 'translate', label: 'Translate', icon: Languages },
  ];

  const secondaryNavItems = [
    { id: 'budget', label: 'Budget Planner', icon: Wallet },
    { id: 'weather', label: 'Live Weather', icon: CloudSun },
    { id: 'stays', label: 'Stays & Hostels', icon: Bed },
    { id: 'before_you_go', label: 'Before You Go', icon: Shield },
    { id: 'lostfound', label: 'Lost & Found', icon: MessageSquare },
    { id: 'reviews', label: 'Reviews', icon: Star },
  ];

  const allNavItems = [...primaryNavItems, ...secondaryNavItems];

  const handleNavClick = (tabId) => {
    setActiveTab(tabId);
    setMobileMenuOpen(false);
    setMoreDropdownOpen(false);
  };

  return (
    <header className="sticky top-0 z-[600] glass-panel border-b border-slate-200/80 dark:border-slate-800/80 px-4 py-2.5 sm:px-6">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Brand */}
        <div 
          onClick={() => handleNavClick('home')}
          className="flex items-center space-x-3 cursor-pointer group select-none shrink-0"
        >
          <div className="w-10 h-10 rounded-2xl bg-mustard-500/20 dark:bg-mustard-500/10 flex items-center justify-center p-1.5 border border-mustard-500/30 group-hover:scale-105 transition-transform">
            <img 
              src="/logo.png" 
              alt="ExploreMate" 
              className="w-full h-full object-contain"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'block';
              }} 
            />
            <Compass className="w-6 h-6 text-mustard-600 dark:text-mustard-400 hidden" />
          </div>
          <div>
            <span className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white block leading-tight">
              {BRAND_NAME}
            </span>
            <span className="text-[10px] sm:text-xs text-teal-700 dark:text-teal-400 font-medium tracking-wide flex items-center gap-1">
              <MapPin className="w-3 h-3 inline" /> Pondicherry Eco-Guide
            </span>
          </div>
        </div>

        {/* Desktop Single Primary Navbar */}
        <nav className="hidden lg:flex items-center space-x-1">
          {primaryNavItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                activeTab === item.id
                  ? 'bg-mustard-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {item.label}
            </button>
          ))}

          {/* More Dropdown for Secondary Features */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setMoreDropdownOpen(!moreDropdownOpen)}
              className={`flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                secondaryNavItems.some(i => i.id === activeTab)
                  ? 'bg-mustard-100 dark:bg-mustard-950/60 text-mustard-800 dark:text-mustard-300'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <span>More</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>

            {moreDropdownOpen && (
              <div 
                className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl py-2 z-[650] animate-fade-in"
                onMouseLeave={() => setMoreDropdownOpen(false)}
              >
                {secondaryNavItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavClick(item.id)}
                      className={`w-full text-left px-4 py-2 text-xs flex items-center space-x-2.5 transition ${
                        activeTab === item.id
                          ? 'bg-mustard-500/15 text-mustard-700 dark:text-mustard-300 font-bold'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <Icon className="w-4 h-4 text-mustard-600 shrink-0" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </nav>

        {/* Right Action Icons: Language, Theme, Settings, Hamburger */}
        <div className="flex items-center space-x-2 sm:space-x-2.5">
          {/* Language Switcher */}
          <div className="relative flex items-center">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              aria-label="Select language"
              className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 py-1.5 px-2 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-mustard-500 font-medium"
            >
              <option value="en">EN</option>
              <option value="ta">தமிழ் (TA)</option>
              <option value="hi">हिन्दी (HI)</option>
              <option value="fr">FR</option>
            </select>
          </div>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle color theme"
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>

          {/* Settings Button */}
          <button
            onClick={onOpenSettings}
            aria-label="Open advanced settings"
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Mobile Hamburger Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
            className="lg:hidden p-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            {mobileMenuOpen ? <X className="w-5 h-5 text-mustard-600" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="lg:hidden pt-3 pb-2 border-t border-slate-200/80 dark:border-slate-800/80 mt-2 grid grid-cols-2 gap-1.5 animate-slide-down">
          {allNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-medium transition ${
                  isActive
                    ? 'bg-mustard-600 text-white shadow-sm font-bold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-mustard-600'}`} />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
}

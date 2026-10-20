/**
 * ExploreMate Main Application Component
 * Tab switching routing, global modal integration, welcome splash,
 * settings drawer, and floating Gemini chat widget.
 */

import React, { useState } from 'react';
import Header from './components/common/Header';
import Footer from './components/common/Footer';
import BottomNav from './components/common/BottomNav';
import WelcomeScreen from './components/common/WelcomeScreen';
import ErrorBoundary from './components/common/ErrorBoundary';
import SettingsDrawer from './tabs/SettingsDrawer';
import ChatWidget from './components/chatbot/ChatWidget';

// Tabs
import HomeTab from './tabs/HomeTab';
import PlanTab from './tabs/PlanTab';
import DestinationsTab from './tabs/DestinationsTab';
import StaysTab from './tabs/StaysTab';
import MapTab from './tabs/MapTab';
import WeatherTab from './tabs/WeatherTab';
import BudgetTab from './tabs/BudgetTab';
import BeforeYouGoTab from './tabs/BeforeYouGoTab';
import ReviewsTab from './tabs/ReviewsTab';
import LostFoundTab from './tabs/LostFoundTab';
import TranslateTab from './tabs/TranslateTab';
import ChaptersTab from './tabs/ChaptersTab';

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState(null);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'home':
        return <HomeTab setActiveTab={setActiveTab} onSelectPlace={setSelectedPlace} />;
      case 'plan':
        return <PlanTab />;
      case 'destinations':
        return <DestinationsTab onSelectForItinerary={setSelectedPlace} />;
      case 'stays':
      case 'hotels':
        return <StaysTab />;
      case 'map':
        return <MapTab />;
      case 'weather':
        return <WeatherTab />;
      case 'budget':
        return <BudgetTab />;
      case 'before_you_go':
        return <BeforeYouGoTab />;
      case 'reviews':
        return <ReviewsTab />;
      case 'lostfound':
        return <LostFoundTab />;
      case 'translate':
        return <TranslateTab />;
      case 'chapters':
        return <ChaptersTab />;
      case 'about':
      case 'privacy':
      case 'terms':
      case 'credits':
        return (
          <div className="glass-panel p-8 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4 max-w-3xl mx-auto">
            <h2 className="font-serif text-2xl font-bold capitalize text-slate-900 dark:text-white">
              {activeTab.replace('_', ' ')}
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              ExploreMate is engineered exclusively for Pondicherry / Puducherry. All geographical boundaries, coastal advisories, and heritage markers follow official Union Territory regulations and OpenStreetMap data.
            </p>
            <p className="text-xs text-slate-500">
              Customer Support: exploremateservices@gmail.com | Phone: 9********0
            </p>
          </div>
        );
      default:
        return <HomeTab setActiveTab={setActiveTab} onSelectPlace={setSelectedPlace} />;
    }
  };

  return (
    <ErrorBoundary>
      <WelcomeScreen />
      
      <div className="min-h-screen flex flex-col justify-between bg-[#FBF8F3] dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">
        <Header 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          onOpenSettings={() => setIsSettingsOpen(true)} 
        />

        {/* Main View Area */}
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
          {renderTabContent()}
        </main>

        <Footer onNavigate={setActiveTab} />
        
        {/* Mobile Tab Navigation */}
        <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Global Settings Drawer */}
        <SettingsDrawer isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

        {/* Gemini Flash Assistant */}
        <ChatWidget activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>
    </ErrorBoundary>
  );
}

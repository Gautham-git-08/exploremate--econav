import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import enLocale from '../locales/en.json';
import taLocale from '../locales/ta.json';
import hiLocale from '../locales/hi.json';

const LOCALES = {
  en: enLocale,
  ta: taLocale,
  hi: hiLocale,
  fr: enLocale // Fallback to en if French locale not loaded
};

const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem('exploremate_theme') || 'system');
  const [language, setLanguage] = useState(() => localStorage.getItem('exploremate_lang') || 'en');
  const [units, setUnits] = useState(() => localStorage.getItem('exploremate_units') || 'km');
  const [reduceMotion, setReduceMotion] = useState(() => localStorage.getItem('exploremate_reduce_motion') === 'true');
  const [highContrast, setHighContrast] = useState(() => localStorage.getItem('exploremate_high_contrast') === 'true');
  const [textSize, setTextSize] = useState(() => localStorage.getItem('exploremate_text_size') || 'normal');
  const [weatherSimulation, setWeatherSimulation] = useState('live'); // live | light_rain | heavy_rain | thunderstorm | heat | wind | night | clear
  const [dynamicCache, setDynamicCache] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('exploremate_trans_cache') || '{}');
    } catch {
      return {};
    }
  });

  // Layer A: Static UI Translation lookup
  const t = useCallback((keyPath) => {
    const activeDict = LOCALES[language] || LOCALES.en;
    const parts = keyPath.split('.');
    let cur = activeDict;
    for (const part of parts) {
      if (cur && cur[part] !== undefined) {
        cur = cur[part];
      } else {
        // Fallback to English
        let fallback = LOCALES.en;
        for (const fbPart of parts) {
          if (fallback && fallback[fbPart] !== undefined) fallback = fallback[fbPart];
          else return keyPath;
        }
        return fallback;
      }
    }
    return cur || keyPath;
  }, [language]);

  // Layer B: Dynamic on-demand translation through backend with caching
  const translateDynamic = useCallback(async (text, targetLang = language) => {
    if (!text || targetLang === 'en') return text;
    const cacheKey = `${targetLang}_${text.trim()}`;
    if (dynamicCache[cacheKey]) return dynamicCache[cacheKey];

    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          target_lang: targetLang,
          source_lang: 'en'
        })
      });
      const data = await res.json();
      if (data && data.translation) {
        const translated = data.translation;
        setDynamicCache(prev => {
          const updated = { ...prev, [cacheKey]: translated };
          try { localStorage.setItem('exploremate_trans_cache', JSON.stringify(updated)); } catch {}
          return updated;
        });
        return translated;
      }
      return text;
    } catch (e) {
      console.warn("Dynamic translation failed:", e);
      return text;
    }
  }, [language, dynamicCache]);

  // Sync language attribute to documentElement
  useEffect(() => {
    localStorage.setItem('exploremate_lang', language);
    document.documentElement.lang = language;
  }, [language]);

  // Sync theme to document element
  useEffect(() => {
    localStorage.setItem('exploremate_theme', theme);
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'light') {
      root.classList.remove('dark');
    } else {
      // System
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) root.classList.add('dark');
      else root.classList.remove('dark');
    }
  }, [theme]);

  // Sync high contrast
  useEffect(() => {
    localStorage.setItem('exploremate_high_contrast', highContrast);
    if (highContrast) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }
  }, [highContrast]);

  const clearCacheAndData = () => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.reload();
  };

  return (
    <SettingsContext.Provider value={{
      theme,
      setTheme,
      language,
      setLanguage,
      units,
      setUnits,
      reduceMotion,
      setReduceMotion,
      highContrast,
      setHighContrast,
      textSize,
      setTextSize,
      weatherSimulation,
      setWeatherSimulation,
      clearCacheAndData,
      t,
      translateDynamic
    }}>
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => useContext(SettingsContext);

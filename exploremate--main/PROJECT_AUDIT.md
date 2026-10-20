# PROJECT AUDIT: ExploreMate

## 1. Overview & Tech Stack
ExploreMate is an AI-powered eco-travel companion web application built exclusively for Pondicherry / Puducherry.
- **Frontend Stack:** React 18, Vite 5, Tailwind CSS 3, Lucide React icons, React-Leaflet / Leaflet.
- **Backend Stack:** Python Flask, SQLite (`chapters.db`, `lostfound.db`), Google GenAI SDK (`google-genai`), Requests (Open-Meteo, MyMemory, Google Cloud Translation).
- **Communication:** Vite Dev Proxy (`/api` -> `http://127.0.0.1:5000/api`).
- **Configuration & Secrets:** Backend `.env` (stores `GEMINI_API_KEY`, `GEMINI_MODEL`, `GOOGLE_TRANSLATE_KEY`). No secrets exposed in frontend.

---

## 2. Directory Tree & File Manifest

### Root
- `package.json` / `package-lock.json`: Root project meta & tooling scripts.
- `README.md`: Project documentation and quickstart instructions.
- `TODO_VERIFY.md`: List of places with unverified hours/fees and pending image attributions.
- `DIAGNOSIS.md`: Diagnostic records from earlier stabilisation phases.

### Backend (`/backend`)
- `app.py`: Main Flask application entrypoint. Configures CORS, blueprints, rate limiter, and error handlers.
- `requirements.txt`: Python dependencies (`flask`, `flask-cors`, `requests`, `python-dotenv`, `google-genai`).
- `.env` / `.env.example`: Secret keys configuration (`GEMINI_API_KEY`, `GEMINI_MODEL`, `PORT`, `CORS_ORIGINS`).
- `config/settings.py` & `config/__init__.py`: App configurations, brand constants (`BRAND_NAME`, `CONTACT_PHONE`, `SAFETY_NUMBERS`), directory paths.
- `config/emission_factors.py`: Transport emission factors (kg CO2 per passenger per km) and ink ledger rules.
- `blueprints/core.py`: Serves city information, destinations/places (`/api/places`), accommodation stays, food, and weather proxy.
- `blueprints/chat.py`: Proxy route for Gemini AI chat (`/api/chat`) with Pondicherry grounding and structured action extraction.
- `blueprints/translate.py`: 3-tier translation pipeline (`/api/translate`) with Google Cloud, Gemini Flash, and MyMemory failover.
- `blueprints/chapters.py`: CO2 ink calculations, leg verification (`/api/chapters/verify_leg`), and story unlock status.
- `blueprints/lostfound.py`: SQLite-backed lost and found engine (`items`, `claims`, match scoring).
- `blueprints/budget.py`: Budget distribution, daily burn rate calculations, and currency rules.
- `data/pondicherry.json`: Curated dataset with 43 destinations, coordinates, verified descriptions, and tags.
- `data/chapters.json`: 5 serialized Pondicherry mystery story episodes with unlock thresholds.

### Frontend (`/frontend`)
- `index.html`: Main HTML entry with responsive viewport, fonts, and dark mode class support.
- `vite.config.js`: Vite server and dev proxy settings (`/api` -> `http://127.0.0.1:5000`).
- `tailwind.config.js` & `postcss.config.js`: Tailwind theme styling with eco colours (`mustard`, `leaf`, `teal`).
- `src/main.jsx`: React root mount with `SettingsProvider` and `ModalProvider`.
- `src/App.jsx`: Top-level tab navigator and layout wrapper (Header, Footer, BottomNav, ChatWidget).
- `src/index.css`: Global design tokens, custom font definitions, and glass-panel CSS rules.
- `src/config/constants.js`: Scope rules, brand constants, and Pondicherry geographic boundary checkers.
- `src/config/languages.js`: Supported language definitions (EN, TA, HI, FR).
- `src/context/ModalContext.jsx`: Accessible modal dialog system (`showAlert`, `showConfirm`).
- `src/context/SettingsContext.jsx`: User preferences (theme, language, weather simulation mode).
- `src/components/common/Header.jsx`: Sticky navbar with brand logo, search bar, language switch, theme toggle, and settings.
- `src/components/common/Footer.jsx`: Accessible footer with emergency safety hotlines, quick links, and copyright.
- `src/components/common/BottomNav.jsx`: Mobile-first 5-tab quick navigation bar.
- `src/components/common/SearchBox.jsx`: Debounced fuzzy search with category chips and non-Pondicherry redirection.
- `src/components/common/ErrorBoundary.jsx`: Safe crash fallback container.
- `src/components/chatbot/ChatWidget.jsx`: Floating Gemini assistant widget with typing indicator and suggestions.
- `src/tabs/HomeTab.jsx`: Landing view featuring hero, search, live weather, and curated highlights.
- `src/tabs/PlanTab.jsx`: Day planner with undo/redo, timeline stops, time extensions, and transit links.
- `src/tabs/DestinationsTab.jsx`: Browse 43 places with category chips, weather suitability badges, and slide-overs.
- `src/tabs/ChaptersTab.jsx`: Carbon-Fuel Chapters view with CO2 ink balance, leg simulator, and bilingual audio reader.
- `src/tabs/LostFoundTab.jsx`: Lost & Found listing, reporting modal, and claim flows.
- `src/tabs/WeatherTab.jsx`: Open-Meteo 3-day forecast, hourly precipitation, and simulated weather toggles.
- `src/tabs/BudgetTab.jsx`: Multi-category budget planner with total-100 sliders and expense tracking.
- `src/tabs/TranslateTab.jsx`: 60+ language text & speech translator.
- `src/tabs/MapTab.jsx`: Leaflet interactive map with markers and locate-me controls.
- `src/public/photos/`: Curated photographic assets for White Town, beaches, temples, and heritage monuments.

---

## 3. Phase-by-Phase Roadmap

1. **Phase 1: Home Page Redesign & Search Bar Unification**
   - Eliminate duplicate search bars (keep exactly one hero search bar).
   - Unify design system with clean visual hierarchy, generous whitespace, sticky navbar, and responsive layouts.
2. **Phase 2: Image Integrity & Asset Mapping**
   - Create a central `destinations.js` / image map.
   - Enforce fixed aspect ratios, `object-fit: cover`, `loading="lazy"`, meaningful `alt`, and graceful fallbacks.
3. **Phase 3: Real i18n & Live Translation**
   - Layer A: UI text localized JSON files (`en.json`, `ta.json`, `hi.json`) with grammatically verified strings.
   - Layer B: Dynamic content translated on-demand via `POST /api/translate` with in-memory caching.
4. **Phase 4: Smart Itinerary (Dynamic, Weather & Crowd-Aware, Rain Simulator)**
   - Transform Plan tab into a Smart Itinerary timeline.
   - Live Open-Meteo weather integration + interactive Rain Simulator toggle.
   - Dynamic replanning engine: swaps outdoor places for indoor alternatives during rain, balances crowd levels.
5. **Phase 5: CO2 Tracker & Chapter Unlocks**
   - Transport comparison charts (Car vs Motorbike vs Bus vs Train vs Cycle vs Walk).
   - Carbon savings math stored as numbers, persisting in `localStorage`.
   - Real-time chapter unlocking with celebration toast at exact thresholds.
6. **Phase 6: Lost & Found Police-Based Workflow**
   - Finder report generates `LF-TEMP-XXXX` and provides directions to nearest Pondicherry police stations.
   - Police Desk view (`/police`) to issue official IDs (`PF-YEAR-SEQUENCE`) and investigate claims.
   - Claimant flow with masked public listings and police collection advisories.
7. **Phase 7: Chatbot Gemini Live Integration**
   - Backend `POST /api/chat` with official `google-genai` SDK and secure API key loading.
   - Conversational memory, travel grounding prompt, rate limiting, and structured actions.
8. **Phase 8: Navigation & Consistency**
   - Rename Plan to "Smart Itinerary" across routes, navbar, titles, and translation dictionaries.
   - Add consistent 404 page and loading skeletons.
9. **Phase 9: Performance & Build Cleanliness**
   - Optimize bundle size, lazy-load below-the-fold content, and eliminate console warnings.
10. **Phase 10: Final Documentation & QA**
   - Comprehensive `README.md` and complete QA verification.

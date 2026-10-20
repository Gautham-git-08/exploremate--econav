# ExploreMate — System Diagnosis Report (Task 0)

## Real Stack (3 lines)
- **Frontend**: React 19 + Vite 8.3 + Tailwind CSS v3 (`darkMode: 'class'`), Lucide icons, Leaflet (CDN CSS + npm leaflet package), Vitest.
- **Backend**: Flask 3.1 + Python 3.11, SQLite3 (`lostfound.db`, `chapters.db`), Flask-Limiter, Flask-CORS, python-dotenv, official `google-genai` SDK, pytest.
- **Integration**: Vite dev proxy `/api` &rarr; Flask server on `http://127.0.0.1:5000`.

---

## Detailed Diagnosis for the 6 Problems (+ Transport Card)

### Problem 1: Search box does nothing
- **What was seen**: In `Header.jsx` (lines 21–32) and `HomeTab.jsx` (lines 34–45), typing a place name like `"Rock Beach"` or `"Sri Aurobindo Ashram"` and pressing Enter only performs a check `isPondicherryQuery(searchVal)` and navigates to `setActiveTab('destinations')`. It does NOT filter places, does not display a debounced results dropdown, does not navigate/highlight the specific destination, and has no keyboard accessibility (`role="listbox"`, `aria-live`).
- **Root Cause**: The search input was wired only as a simple redirect to the Destinations tab with a non-Pondicherry alert check. There is no autocomplete dropdown, no debounced search handler against name/alias/category/description, no typo tolerance, and no category filter chips beside the input.
- **Planned Minimal Fix**:
  - Implement a dedicated search handler with 250ms debounce and edit-distance/fuzzy matching across name, aliases, category, tags, and description.
  - Add an accessible dropdown (`role="listbox"`, keyboard navigation with Up/Down/Enter/Escape, clear button) and category filter chips.
  - When an item is selected, open that destination's detail drawer and trigger map centering.
  - If a non-Pondicherry city is typed (e.g., Paris, Goa), show the centered notice modal without Pondicherry results.

---

### Problem 2: Places list is thin / missing descriptions
- **What was seen**: Network call `GET /api/places` returns `{"places": [], "total": 0}` from the active Flask instance. When inspecting the JSON file directly, only 7 records exist, lacking fields like `aliases`, `tags`, `shortDescription`, `longDescription`, `whatToExperience`, and `accessNote`.
- **Root Cause**: Two issues:
  1. In `backend/config/settings.py` (line 10), `BASE_DIR = Path(__file__).resolve().parent` evaluates to `backend/config/` instead of `backend/`, meaning `DATA_DIR = BASE_DIR / "data"` resolves to non-existent `backend/config/data/`. Thus `load_json("pondicherry.json")` returns an empty dict, causing `/api/places` and `/api/chapters` to return empty lists.
  2. The seed dataset only had 7 places without the full tourism brief entries (Promenade Beach, Paradise Beach, Serenity Beach, Eden Beach, Pondy Marina, Aayi Mandapam, Arikamedu, Chunnambar, temples, churches, etc.).
- **Planned Minimal Fix**:
  - Correct `BASE_DIR` in `backend/config/settings.py` to `Path(__file__).resolve().parent.parent` so `DATA_DIR` points to `backend/data`.
  - In Task 3, merge the complete tourism brief places into `backend/data/pondicherry.json` without overwriting existing entries or verified photo fields. Add short/long descriptions, experience lists, and coordinate provenance.

---

### Problem 3: Smart itinerary not working (flexible timeline, weather/crowd re-planning, re-routing)
- **What was seen**: `PlanTab.jsx` contains static hardcoded sample stops (`aurobindo-ashram`, `french-quarter`, `promenade-beach`). It lacks start/end time duration selection, multi-day scheduling, auto-arrange heuristic, cascade calculations when stops extend/shift, weather/crowd proactive re-planning banners, and undo/redo history.
- **Root Cause**: It was an initial static mock. The core time cascade engine, travel time calculation (Haversine ÷ speed), weather-limit checks (`RAIN_PROB_LIMIT=50`, `HEAT_LIMIT=35`), crowd-window rebalancing, and timeline connector markers are not yet implemented in the tab component.
- **Planned Minimal Fix**:
  - Build the full `PlanTab` engine supporting 1–N days with customizable start/end times and locked stops.
  - Add travel connector legs (walking, cycling, auto, bus) with estimated times.
  - Integrate Open-Meteo hourly weather checks and crowd hours (`crowdByHour`) to trigger undoable "Plan suggestion" banners.
  - Implement Nearest-Neighbor + Swap auto-arrange and Undo/Redo stack (10 states).

---

### Problem 4: Carbon-Fuel Chapters not working
- **What was seen**: In `ChaptersTab.jsx`, fetching `/api/chapters` returns an empty array `[]` because of the `DATA_DIR` path bug diagnosed in Problem 2. Furthermore, the leg verification does not check destination geofencing against actual chapter coordinates, and lacks the interactive demo-mode GPS trace replay.
- **Root Cause**:
  1. `backend/config/settings.py` path misconfiguration prevents `chapters.json` from loading.
  2. Full demo trace simulation and destination radius verification (50–100m) are not hooked up in the UI.
- **Planned Minimal Fix**:
  - With `settings.py` path corrected, `/api/chapters` immediately returns the 5 serialized chapters and storyteller credits.
  - Implement full leg planner with emission ranking, speed validation, demo trace replay, audio narration, and unlock animations.

---

### Problem 5: Map not visible
- **What was seen**: In `MapTab.jsx`, Leaflet is accessed via `window.L`. While `leaflet` is in `package.json`, `index.html` loads Leaflet CSS via CDN, but the Map component relies on `window.L` without importing `leaflet` in JavaScript. Marker icon assets fail to load or resolve in Vite (`marker-icon.png` 404). In addition, when switching tabs, the map container does not trigger `invalidateSize()`, resulting in grey/blank tiles or zero height.
- **Root Cause**:
  - `MapTab.jsx` expects `window.L` on the global scope instead of importing `L from 'leaflet'`.
  - Default Leaflet marker icons are broken in bundlers (Vite) without explicit icon image configuration.
  - Missing `map.invalidateSize()` call when Map tab becomes visible or on window resize.
  - Container needs explicit resilient CSS height and error fallback if tile loading fails.
- **Planned Minimal Fix**:
  - Import `L from 'leaflet'` and Leaflet marker icon assets directly in `MapTab.jsx`.
  - Add `map.invalidateSize()` hook on tab visibility and resize.
  - Ensure explicit height (`min-h-[60vh]`), "Fit all", "Locate me", and tile error fallback banner.

---

### Problem 6: No weather/crowd-based re-planning or re-routing
- **What was seen**: Currently, weather simulation only renders a static banner on `HomeTab` and `PlanTab`. No dynamic rescheduling or route changes happen when weather conditions transition to heavy rain or heat.
- **Root Cause**: The re-planning engine (`weatherPlanner`) is not yet connected to the itinerary state or the map routing polyline.
- **Planned Minimal Fix**:
  - Add rule-based weather evaluation in the planner engine (swap outdoor with indoor, shift midday heat walks).
  - Connect weather state to Leaflet Routing Machine / polyline display (dash old route grey, draw bold alternative route).

---

### Problem 7: Plan tab has no bus/train booking help
- **What was seen**: `PlanTab.jsx` only shows local itinerary stops. There is no "Getting to Pondicherry" transit card, no IRCTC / PRTC / redBus official links, and no booking checklist generator.
- **Root Cause**: The transit hub and travel-preparation module is not yet created.
- **Planned Minimal Fix**:
  - Add the "Getting to Pondicherry" card to `PlanTab.jsx` with origin inputs, mode selection (Train / Bus), official redirect buttons (`rel="noopener noreferrer"`), station distance calculations (Haversine), copyable/printable booking checklist, and Day 1 arrival shift.

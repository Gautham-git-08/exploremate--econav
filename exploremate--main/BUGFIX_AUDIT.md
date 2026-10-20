# BUGFIX AUDIT — ExploreMate

Comprehensive audit of remaining issues, root causes, affected files, and planned fixes.

---

## 1. Duplicate Navigation: Every Tab Appears Twice

### Bug Description
On the home page and throughout desktop viewports, navigation tab links appear in duplicate—stacked directly on top of each other.

### Root Cause
1. `frontend/src/App.jsx` mounts `<Header />` (lines 89–93), which internally renders a `<nav className="hidden lg:flex items-center space-x-1">` (lines 49–69 in `Header.jsx`).
2. Immediately below `<Header />`, `App.jsx` (lines 96–123) mounts a second `<nav className="hidden md:flex items-center justify-center space-x-1 py-2.5 px-4 glass-panel border-b...">` that repeats the tab buttons.
3. Additionally, `Header.jsx` lacked a responsive slide-out hamburger menu for mobile devices, relying solely on `BottomNav.jsx`.

### Affected Files
- `frontend/src/App.jsx`
- `frontend/src/components/common/Header.jsx`

### Planned Fix
- Remove the redundant secondary `<nav>` from `App.jsx`.
- Upgrade `Header.jsx` to be the single source of truth for navigation:
  - Left: Logo & brand name with Pondicherry tag.
  - Center/Right: Full tab navigation with active state highlights.
  - Far Right: Language switcher, theme toggle, settings button, and mobile hamburger toggle button.
  - Mobile: Clean animated slide-over / dropdown drawer for mobile viewports.
- Confirm only one search bar exists across the application.

---

## 2. Image Mapping & Inconsistent Placeholders

### Bug Description
Images across the website were inconsistent; some places used external Unsplash or Wikipedia URLs while others had mismatched local files or generic fallbacks.

### Root Cause
- No dedicated `images.map.js` existed as the single source of truth.
- Some components fetched images from `getDestinationMedia()` in `destinations.js`, while others read from `places.js` directly, leading to broken or mismatched image links.

### Affected Files
- `frontend/src/config/images.map.js` (to be created)
- `frontend/src/data/places.js`
- `frontend/src/tabs/DestinationsTab.jsx`
- `frontend/src/tabs/PlanTab.jsx`
- `frontend/src/tabs/ChaptersTab.jsx`

### Planned Fix
- Audit all 21 local image assets in `frontend/public/images/` and document file names, dimensions, and visual content.
- Create `frontend/src/config/images.map.js` mapping all places, chapters, itinerary activities, and indoor alternatives strictly to verified local assets or neutral branded placeholders.
- Enforce standard CSS: fixed aspect ratios (16:9 for cards, 1:1 for avatars), `object-fit: cover`, `loading="lazy"`, meaningful `alt` text, and `onError` fallback.
- Provide a complete verification table in the final report.

---

## 3. Smart Itinerary & Rain Simulation Toggle Missing

### Bug Description
The rain toggle button is missing from the Smart Itinerary tab. The dynamic timeline that automatically swaps outdoor activities with sheltered indoor alternatives during rain or thunderstorms was not prominently accessible.

### Root Cause
- In `frontend/src/tabs/PlanTab.jsx`, the rain simulation controls and Open-Meteo live API integration were previously overshadowed by budget forms, and the pure `buildItinerary` function did not render the original outdoor place struck through with an indoor swap badge.

### Affected Files
- `frontend/src/utils/itineraryEngine.js` / `frontend/src/utils/planner.js`
- `frontend/src/tabs/PlanTab.jsx`
- `frontend/src/__tests__/Itinerary.test.js`

### Planned Fix
- Add a prominent, unmissable control bar at the very top of `PlanTab.jsx`:
  - "Simulate Rain" toggle switch (Off / On) with umbrella/cloud icon.
  - Weather mode selector: `Live weather`, `Simulate light rain`, `Simulate thunderstorm`.
  - When simulation is ON: overrides forecast, displays an alert banner ("Rain simulation active: outdoor plans moved indoors"), and renders an animated rain & subtle lightning canvas effect.
  - When simulation is OFF: fetches live real-time Open-Meteo weather for Pondicherry (`11.9416, 79.8083`), triggering rain status if precipitation probability $\ge 60\%$, precipitation $> 0.5\text{ mm}$, or WMO weather code is $51\text{--}67, 80\text{--}82, 95\text{--}99$.
- Implement a pure function `buildItinerary({ activities, weatherByHour, crowdByHour, startTime, transportMode })`:
  - Replaces outdoor activities with nearby low-crowd indoor alternatives when rainy.
  - Marks swapped cards with "Swapped to indoor: rain" and displays the original outdoor stop struck-through ("Originally: Beach Walk").
  - Shifts slots if crowd score $> 70$.
  - Reverts smoothly when rain simulation is turned OFF.
- Write unit tests for all 5 required edge cases in `Itinerary.test.js`.

---

## 4. Carbon Footprint: Four Selectable Option Cards & Gamified Unlocks

### Bug Description
The carbon section lacked the four distinct selectable option cards (Bicycle, Walking, Local train / Public transport, Personal car), lacked the exact baseline savings math, and did not trigger confetti celebrations upon zero-emission trip confirmation.

### Root Cause
- `canvas-confetti` was not installed in `package.json`.
- Trip confirmation did not reliably increment the user's cumulative CO2 savings in `localStorage` as numeric values, causing chapter unlock checks to fail.

### Affected Files
- `frontend/package.json`
- `frontend/src/tabs/ChaptersTab.jsx`
- `frontend/src/config/carbon.js` (or unified emission constants)

### Planned Fix
- Install `canvas-confetti`.
- Render four large selectable cards in a 2x2 grid (mobile) or 4-in-a-row (desktop) for:
  1. **Bicycle** ($0\text{ kg CO}_2/\text{km}$)
  2. **Walking** ($0\text{ kg CO}_2/\text{km}$)
  3. **Local train / Public transport** ($0.041\text{ kg CO}_2/\text{km}$)
  4. **Personal car** ($0.192\text{ kg CO}_2/\text{km}$)
- Interactive trip distance slider with live calculation:
  $$\text{saved} = \text{distanceKm} \times 0.192 - \text{distanceKm} \times \text{factor}[\text{mode}]$$
- "Confirm this trip" button persists numeric `totalSaved` in `localStorage`, updates trip history, and checks `totalSaved >= unlockThresholdKg`.
- Trigger full-screen confetti animation via `canvas-confetti` (with `prefers-reduced-motion` check) for Bicycle and Walking only.
- Unlock stories dynamically with unlock animation and toast notifications.

---

## 5. Stories Quality & Reader Interface

### Bug Description
Stories were brief, plain text snippets rather than vivid, engaging travel literature.

### Root Cause
- Stories were stored as short descriptions without narrative depth, sensory details, or local Pondicherry cultural lore.
- No full-screen dedicated reader view with reading time, scroll progress bar, drop caps, or audio narration controls existed.

### Affected Files
- `frontend/src/data/stories.js`
- `frontend/src/tabs/ChaptersTab.jsx`

### Planned Fix
- Write 4 vivid, engaging 250–350 word stories:
  1. *The Sea Turtle's Midnight Beach* (Serenity Beach)
  2. *The Fisherman's Dawn Catamaran* (Kottakuppam)
  3. *The Ancient Neem of Rue Dumas* (White Town)
  4. *The Golden Forest of Auroville* (Matrimandir Green Belt)
- Implement a story reader UI with hero image, title, drop-cap first letter, reading time estimate, scroll progress indicator, and light/dark reading toggle.
- Integrate Web Speech API (`speechSynthesis`) with play/pause/stop and audio progress.

---

## 6. Design System & Polished Footer

### Bug Description
Missing "built for the Zephyr hackathon" footer line; occasional inconsistent styles and lack of unified mobile drawer.

### Root Cause
- Footer component lacked hackathon attribution and unified responsive styles.

### Affected Files
- `frontend/src/components/common/Footer.jsx`
- `frontend/src/index.css`

### Planned Fix
- Add hackathon credits to `Footer.jsx`.
- Ensure consistent eco-travel color scheme (`#FBF8F3`, deep green, mustard accent).

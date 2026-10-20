# ExploreMate — Sustainable AI-Guided Travel Companion for Pondicherry

> **Built for the Zephyr hackathon**  
> An eco-conscious, full-stack web application engineered exclusively for **Puducherry / Pondicherry, India**.

ExploreMate combines certified heritage intelligence, low-carbon journey tracking, automated monsoon-adaptive itinerary replanning, gamified travel lore, and an official police-regulated lost & found desk.

---

## 🌟 Key Architecture & Upgrades

### 1. Unified Navigation & Clean Hero
- **Single Source of Truth Navigation:** Clean sticky top header with logo, primary navigation links, language selector, theme toggle, and animated slide-out hamburger menu on mobile.
- **Single Hero Search Bar:** Typo-tolerant fuzzy search, accent folding, category filtering, and friendly Pondicherry geo-fencing.

### 2. Verified Local Image Map (`images.map.js`)
- Every destination, stay, dining spot, story hero, and indoor alternative is strictly mapped to verified local photography in `frontend/public/images/`.
- Zero unverified external or broken stock URLs. Any destination lacking an exact photo uses `neutral_placeholder.svg` with proper `aspect-video` and `object-fit: cover`.

### 3. Smart Itinerary Engine & Rain Simulation (`PlanTab.jsx` + `itineraryEngine.js`)
- **Prominent Weather Control Bar:**
  - "Simulate Rain" toggle switch (Off / On) with umbrella/cloud icon.
  - Weather mode selector: `Live weather`, `Simulate light rain`, `Simulate thunderstorm`.
  - Animated canvas rendering falling raindrops and subtle thunderstorm lightning flashes.
  - Real-time **Open-Meteo API** integration for Pondicherry (`11.9416, 79.8083`).
- **Pure Unit-Tested `buildItinerary` Engine:**
  - Automatically swaps outdoor stops (e.g. Promenade Beach Walk, White Town walking tour) to low-crowd sheltered alternatives (e.g. Pondicherry Museum, Sri Aurobindo Ashram, Casablanca Boutique).
  - Displays **"Swapped to indoor: rain"** badge with original outdoor destination struck through (`<s>Originally: Beach Walk</s>`).
  - Crowd optimization: classifies crowd levels and flags slots exceeding 70% with advice (`"Crowded now: best time 4 PM"`).
  - Immediate automatic restoration of outdoor activities when rain is toggled OFF.
  - Fully covered by 19 Vitest unit tests in `src/__tests__/Itinerary.test.js`.

### 4. Carbon Footprint & Gamified Unlocks (`ChaptersTab.jsx`)
- **4 Selectable Transport Cards:**
  1. **Bicycle** ($0\text{ kg CO}_2/\text{km}$)
  2. **Walking** ($0\text{ kg CO}_2/\text{km}$)
  3. **Local train / Public transport** ($0.041\text{ kg CO}_2/\text{km}$)
  4. **Personal car** ($0.192\text{ kg CO}_2/\text{km}$ baseline)
- **Interactive Trip Slider:** Distance selector from 1 km to 35 km with real-time math:
  $$\text{avoided} = \text{distanceKm} \times 0.192 - \text{distanceKm} \times \text{factor}[\text{mode}]$$
- **Side-by-Side Comparison Bar:** Direct visual comparison of personal car baseline emissions versus clean transit.
- **Trip Confirmation:**
  - Persists cumulative numeric savings in `localStorage` (`exploremate_cumulative_co2_saved`).
  - Automatically records trips in the trip history log.
  - Triggers **`canvas-confetti`** celebration for zero-emission modes (Bicycle and Walking only, respecting `prefers-reduced-motion`).
  - Automatically unlocks travel stories when thresholds are reached.

### 5. Vivid Travel Stories & Dedicated Reader (`stories.js` + `StoryReader.jsx`)
- Four rich 250–350 word travel stories with sensory details, Tamil-French cultural history, and ecological stakes:
  1. *The Sea Turtle's Midnight Beach* (Serenity Beach & Olive Ridley nesting)
  2. *The Fisherman's Dawn Catamaran* (Kottakuppam artisanal fishermen)
  3. *The Ancient Neem of Rue Dumas* (White Town microclimate & lime plaster)
  4. *The Golden Forest of Auroville* (Matrimandir Tropical Dry Evergreen Forest)
- **Full-Width Story Reader View:**
  - Verified hero photograph and location metadata.
  - Estimated reading time (e.g., "2 min read", word count).
  - Top scroll progress bar tracking reading completion.
  - Elegant drop-cap styling on the opening letter.
  - Independent Light / Dark reading mode toggle.
  - **Web Speech API (`speechSynthesis`) Voice Narration:** Play, Pause, and Stop controls for hands-free audio listening.

### 6. Official Police-Based Lost & Found Workflow (`LostFoundTab.jsx`)
- Safe community recovery process: Finder reports item $\rightarrow$ receives temporary ID (`LF-TEMP-XXXX`) $\rightarrow$ directions to 3 Puducherry police stations.
- **Police Desk View** (passcode: `pondy2026`): Official logs handovers and generates official tracking IDs (`PF-YEAR-SEQUENCE`).
- In-person government ID verification required before item release.

### 7. Google Gemini AI Companion (`ChatWidget.jsx`)
- Grounded strictly in the 43 verified Pondicherry destinations.
- Securely reads `VITE_GEMINI_API_KEY` from environment variables.
- Multi-turn conversation memory with fallback error resilience.

---

## 🚀 Quickstart & Setup

### Prerequisites
- Node.js (v18 or higher)
- Python (v3.10 or higher)

### 1. Backend Setup (Flask API)
```bash
cd backend
python -m venv venv
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt
python app.py
```
*Backend runs on `http://127.0.0.1:5000`*

### 2. Frontend Setup (React + Vite + Tailwind)
```bash
cd frontend
npm install
npm run dev
```
*Frontend runs on `http://localhost:5173/`*

### 3. Run Automated Tests
```bash
cd frontend
npm test
```
*Executes all Vitest test suites (19 unit tests passing across `Itinerary.test.js`, `PlanTab.test.jsx`, and `test_constants.test.js`).*

### 4. Production Build
```bash
cd frontend
npm run build
```

---

## 🎬 3-Minute Hackathon Demo Script

1. **Clean Navigation & Search (0:00 - 0:45):**
   - Open `http://localhost:5173/`.
   - Point out the single clean sticky navbar and mobile hamburger menu.
   - In the hero search box, type `"rock beech"` $\rightarrow$ fuzzy search correctly identifies Promenade Beach.
   - Switch language to Tamil or Hindi using the top-right selector $\rightarrow$ instantaneous UI translation.

2. **Smart Itinerary & Monsoon Rain Simulation (0:45 - 1:45):**
   - Switch to the **Smart Itinerary** tab.
   - Click **Simulate Rain: ON** and switch to **Thunderstorm**.
   - Show the animated rain & lightning canvas overlay.
   - Notice how Promenade Beach Walk automatically swaps to an indoor sheltered museum/boutique with the **"Swapped to indoor: rain"** badge, and the original outdoor title is displayed struck through (`<s>Originally: Beach Walk</s>`).
   - Toggle **OFF** $\rightarrow$ outdoor activities immediately restore.

3. **Carbon Footprint & Confetti Celebration (1:45 - 2:20):**
   - Switch to **Carbon Chapters**.
   - Select **Bicycle (0.000 kg/km)** and set the distance slider to **8 km**.
   - Point out the real-time savings: avoids 1.536 kg $\text{CO}_2$ compared to the 0.192 car baseline.
   - Click **Confirm This Trip & Bank CO2**.
   - Watch the celebratory **confetti** burst on zero-emission confirmation.
   - See the cumulative savings counter update and persist in `localStorage`.

4. **Story Reader & Web Speech Audio (2:20 - 3:00):**
   - Click **Read Vivid Story & Audio** on *The Sea Turtle's Midnight Beach*.
   - Showcase the full-width reader with hero image, scroll progress indicator, and drop-cap styling.
   - Click **Listen** to demonstrate live browser speech narration (`speechSynthesis`).
   - Conclude with the footer credit: *"Built for the Zephyr hackathon"*.

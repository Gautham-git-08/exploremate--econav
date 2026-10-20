"""
fix_legacy_places.py
Patches the first 7 legacy entries in backend/data/pondicherry.json.

Only adds/updates: category, longDescription, whatToExperience, aliases,
                   tags, coordsSource, durationMin, accessNote
NEVER overwrites:  image, image_credit, lat, long, lng, cost, price_verified,
                   rating, review_summary, opening_hours, crowd_levels,
                   guidelines, nearby_place_ids
"""

import json
import os

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
JSON_PATH = os.path.join(SCRIPT_DIR, "..", "backend", "data", "pondicherry.json")

# ── Patch definitions keyed by place id ──────────────────────────────────────

PATCHES = {
    "aurobindo-ashram": {
        "category": "Spiritual & religious",
        "longDescription": (
            "Founded by Sri Aurobindo and The Mother, this spiritual community "
            "occupies a former French colonial house on Rue de la Marine in White Town. "
            "The centrepiece is the flower-covered Samadhi, a marble tomb in a serene "
            "meditation courtyard. Visitors can explore the main building, the Ashram "
            "Library, and quiet reading rooms. Photography is strictly prohibited inside "
            "the courtyard and samadhi area, maintaining the contemplative atmosphere "
            "that draws seekers from around the world."
        ),
        "whatToExperience": [
            "Silent meditation at the flower-covered Samadhi",
            "Ashram bookshop and reading room",
            "Walking the tranquil inner courtyard",
        ],
        "aliases": ["Ashram Pondicherry", "Sri Aurobindo Ashram"],
        "tags": ["ashram", "spiritual", "meditation", "samadhi", "heritage"],
        "coordsSource": "existing",
        "durationMin": 60,
        "accessNote": "Photography prohibited inside courtyard and samadhi area. Modest attire required.",
    },
    "french-quarter": {
        "category": "French heritage & landmarks",
        "longDescription": (
            "White Town is a charming grid of pastel-coloured French colonial villas "
            "situated east of the canal that divides Pondicherry. Streets such as Rue "
            "Dumas, Rue Romain Rolland, and Rue Suffren feature bougainvillea-draped "
            "walls, wrought-iron gates, and distinctive mustard-and-cream façades. "
            "The neighbourhood preserves its Franco-Tamil architectural character and "
            "is best explored on foot or by bicycle in the early morning when the light "
            "is soft and traffic is minimal."
        ),
        "whatToExperience": [
            "Cycling through pastel colonial streets",
            "Heritage photography at Rue Dumas",
            "Café hopping in bougainvillea-draped lanes",
            "Evening stroll along the canal",
        ],
        "aliases": ["White Town", "Ville Blanche", "French Quarter Pondicherry"],
        "tags": ["colonial", "french", "heritage", "cycling", "photography", "white town"],
        "coordsSource": "existing",
        "durationMin": 120,
        "accessNote": "Best explored on foot or bicycle. Respect residential privacy.",
    },
    "promenade-beach": {
        "category": "Beaches & coastal",
        "longDescription": (
            "Promenade Beach, also known as Rock Beach, is a 1.5 km stretch along "
            "Goubert Avenue running from the War Memorial to the Dupleix statue. A "
            "paved pedestrian boulevard lined with heritage buildings offers unobstructed "
            "sunrise views over the Bay of Bengal. Landmarks along the route include "
            "the Gandhi statue and the old lighthouse. The rocky coastline makes swimming "
            "unsafe, but evening crowds gather for the sea breeze and street-food stalls. "
            "Vehicles are banned on the promenade during evenings."
        ),
        "whatToExperience": [
            "Sunrise walk along Goubert Avenue",
            "Gandhi statue and Gingee pillars viewing",
            "Evening sea breeze and food stalls",
            "Heritage buildings photography",
        ],
        "aliases": ["Rock Beach", "Goubert Avenue Beach", "Promenade"],
        "tags": ["beach", "promenade", "sunrise", "coastal", "gandhi statue"],
        "coordsSource": "existing",
        "durationMin": 90,
        "accessNote": "No swimming due to rocky coast. Vehicles banned 6 PM - 7:30 AM.",
    },
    "pondicherry-museum": {
        "category": "Museums, gardens & culture",
        "longDescription": (
            "Housed in a colonial-era building on Rue Saint Louis, the Pondicherry "
            "Museum showcases the region's layered history through diverse galleries. "
            "Highlights include archaeological artefacts from Arikamedu, the ancient "
            "Roman trade settlement, alongside geological specimens, stone sculptures, "
            "and French colonial-era transport exhibits. Additional sections cover "
            "Pondicherry's cultural evolution from its pre-colonial past through the "
            "French administration period, offering a compact overview of the territory's "
            "heritage."
        ),
        "whatToExperience": [
            "Arikamedu Roman artefact galleries",
            "French colonial transport exhibits",
            "Geological and sculpture sections",
        ],
        "aliases": ["Puducherry Museum", "Musée de Pondichéry"],
        "tags": ["museum", "history", "arikamedu", "colonial", "archaeology"],
        "coordsSource": "existing",
        "durationMin": 60,
        "accessNote": "Closed on Mondays and national holidays.",
    },
    "matrimandir-centre": {
        "category": "Spiritual & religious",
        "longDescription": (
            "The Matrimandir is a golden geodesic sphere in Auroville designed by "
            "architect Roger Anger as a place for silent concentration. Its inner "
            "chamber houses the largest optically perfect crystal globe in the world. "
            "Surrounding the structure are twelve petal-shaped meditation gardens, each "
            "representing a human aspiration such as sincerity, humility, and courage. "
            "Visitors can obtain a free viewing pass from the Auroville Visitors Centre "
            "and take an electric shuttle to the designated viewing area near the ancient "
            "banyan tree."
        ),
        "whatToExperience": [
            "Viewing the golden sphere from gardens",
            "Walking the 12 meditation gardens",
            "Banyan tree and peace area",
            "Photo from designated viewing point",
        ],
        "aliases": ["Matrimandir", "Auroville Matrimandir", "Golden Globe Auroville"],
        "tags": ["auroville", "meditation", "golden sphere", "gardens", "spiritual"],
        "coordsSource": "existing",
        "durationMin": 120,
        "accessNote": "Free viewing pass required from Auroville Visitors Centre. Electric shuttle available.",
    },
    "casablanca-boutique": {
        "category": "More places",
        "longDescription": (
            "Casablanca is a multi-level lifestyle store located on Mission Street in "
            "Pondicherry, specialising in locally crafted pottery, handloom textiles, "
            "organic skincare products, and leather goods. Each floor showcases curated "
            "collections from regional artisans and sustainable brands. The building's "
            "colonial architecture adds character to the shopping experience. A rooftop "
            "café on the upper floor offers courtyard views and a relaxed spot for "
            "refreshments after browsing the store."
        ),
        "whatToExperience": [
            "Handloom textile and pottery shopping",
            "Organic skincare products",
            "Rooftop café with courtyard views",
        ],
        "aliases": ["Casablanca Pondicherry"],
        "tags": ["shopping", "pottery", "textiles", "café", "lifestyle"],
        "coordsSource": "existing",
        "durationMin": 60,
        "accessNote": "Open daily. Café on upper floor.",
    },
    "cluny-embroidery": {
        "category": "More places",
        "longDescription": (
            "The Cluny Embroidery Centre is a heritage workshop housed inside a former "
            "French convent in Pondicherry. It supports underprivileged women artisans "
            "who produce exquisite hand-embroidered linen, table settings, and clothing "
            "using traditional French embroidery techniques passed down over generations. "
            "Visitors can observe the meticulous craftsmanship in action and purchase "
            "finished pieces directly from the workshop, supporting both the preservation "
            "of heritage skills and the livelihoods of local women."
        ),
        "whatToExperience": [
            "Watching artisan embroidery demonstrations",
            "Purchasing hand-embroidered linen",
            "Learning about French convent heritage",
        ],
        "aliases": ["Cluny Convent Embroidery"],
        "tags": ["embroidery", "handicraft", "heritage", "convent", "artisan"],
        "coordsSource": "existing",
        "durationMin": 45,
        "accessNote": "Closed Sundays and Mondays. Photography restricted inside studio.",
    },
}

# Fields that must NEVER be overwritten
PROTECTED_FIELDS = {
    "image", "image_credit", "lat", "long", "lng", "cost", "price_verified",
    "rating", "review_summary", "opening_hours", "crowd_levels", "guidelines",
    "nearby_place_ids",
}


def main():
    with open(JSON_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)

    patched_count = 0
    for place in data["places"]:
        pid = place.get("id")
        if pid not in PATCHES:
            continue

        patch = PATCHES[pid]
        for key, value in patch.items():
            if key in PROTECTED_FIELDS:
                print(f"  [SKIP] Skipping protected field '{key}' for {pid}")
                continue
            place[key] = value

        patched_count += 1
        print(f"  [OK] Patched: {pid}")

    print(f"\nTotal patched: {patched_count} / {len(PATCHES)} expected")

    with open(JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
        f.write("\n")

    print("Written back to", os.path.abspath(JSON_PATH))


if __name__ == "__main__":
    main()

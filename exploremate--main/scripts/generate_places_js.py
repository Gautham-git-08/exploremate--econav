"""
Script to generate frontend/src/data/places.js from the user prompt's exact 43-place specification.
Includes verified fees, structured hours, coordinates, categories, and fallbacks.
"""

import json
from pathlib import Path

# 43 places exact data mapping from prompt
PLACES = [
    {
        "id": "aurobindo-ashram",
        "name": "Sri Aurobindo Ashram",
        "category": "Heritage",
        "lat": 11.9366,
        "lng": 79.8344,
        "entryFee": 0,
        "feeNote": "Free",
        "hours": {
            "open": "08:00",
            "close": "18:00",
            "closedDays": [],
            "splitSessions": [
                {"open": "08:00", "close": "11:30"},
                {"open": "14:00", "close": "18:00"}
            ],
            "allDay": False
        },
        "hoursNote": "8:00–11:30 AM, 2:00–6:00 PM",
        "image": "/images/aurobindo_ashram.png",
        "description": "Spiritual community center founded in 1926 by Sri Aurobindo and Mirra Alfassa (The Mother). The flower-covered white marble samadhi rests in a tranquil central courtyard.",
        "avgVisitMinutes": 60,
        "bestTimeOfDay": "Morning",
        "indoorOutdoor": "both",
        "crowdLevel": {"morning": "Moderate", "midday": "Low", "evening": "High"},
        "verified": True
    },
    {
        "id": "white-town",
        "name": "White Town (French Quarter)",
        "category": "Heritage",
        "lat": 11.9338,
        "lng": 79.8359,
        "entryFee": 0,
        "feeNote": "Free",
        "hours": {
            "open": "00:00",
            "close": "23:59",
            "closedDays": [],
            "splitSessions": None,
            "allDay": True
        },
        "hoursNote": "Public streets accessible all day",
        "image": "/images/white_town_reference.jpg.jpeg",
        "description": "Picturesque colonial quarter known for French street names, pastel yellow and mustard villas, wrought-iron balconies, and bougainvillea-draped avenues.",
        "avgVisitMinutes": 120,
        "bestTimeOfDay": "Morning",
        "indoorOutdoor": "outdoor",
        "crowdLevel": {"morning": "Low", "midday": "Moderate", "evening": "High"},
        "verified": True
    },
    {
        "id": "promenade-beach",
        "name": "Promenade / Rock Beach",
        "category": "Beaches",
        "lat": 11.9315,
        "lng": 79.8358,
        "entryFee": 0,
        "feeNote": "Free",
        "hours": {
            "open": "00:00",
            "close": "23:59",
            "closedDays": [],
            "splitSessions": None,
            "allDay": True
        },
        "hoursNote": "Public promenade; vehicles banned 6:00 PM to 7:30 AM",
        "image": "/images/rock_beach.png",
        "description": "Pondicherry's iconic 1.5 km seaside boulevard along Goubert Avenue, flanked by heritage landmarks, rocky seawalls, and wide paved walkways overlooking the Bay of Bengal.",
        "avgVisitMinutes": 90,
        "bestTimeOfDay": "Sunrise",
        "indoorOutdoor": "outdoor",
        "crowdLevel": {"morning": "Moderate", "midday": "Low", "evening": "High"},
        "verified": True
    },
    {
        "id": "pondicherry-museum",
        "name": "Pondicherry Museum",
        "category": "Museums",
        "lat": 11.9344,
        "lng": 79.8349,
        "entryFee": 10,
        "feeNote": "Adults ₹10; children ₹5; foreigners ₹50",
        "hours": {
            "open": "10:00",
            "close": "17:00",
            "closedDays": [1], # Closed Monday
            "splitSessions": None,
            "allDay": False
        },
        "hoursNote": "10 AM–5 PM; closed Monday",
        "image": "/images/pondicherry_museum.jpg.jpeg",
        "description": "Housed in historic colonial buildings on Rue Saint Louis, showcasing archaeological discoveries from Roman Arikamedu, French colonial furniture, and Chola bronze sculptures.",
        "avgVisitMinutes": 60,
        "bestTimeOfDay": "Midday",
        "indoorOutdoor": "indoor",
        "crowdLevel": {"morning": "Low", "midday": "Moderate", "evening": "Low"},
        "verified": True
    },
    {
        "id": "matrimandir-viewing-point",
        "name": "Matrimandir Viewing Point",
        "category": "Heritage",
        "lat": 11.9982,
        "lng": 79.8118,
        "entryFee": 0,
        "feeNote": "Free (obtain a pass at Visitors Centre)",
        "hours": {
            "open": "09:00",
            "close": "17:30",
            "closedDays": [],
            "splitSessions": None,
            "allDay": False
        },
        "hoursNote": "Daily, 9 AM–5:30 PM; obtain a pass",
        "image": "/images/matrimandir_auroville.png",
        "description": "Breathtaking vantage point of the golden geodesic sphere at the heart of Auroville, surrounded by 12 petal-shaped contemplation gardens and tranquil green forest.",
        "avgVisitMinutes": 90,
        "bestTimeOfDay": "Morning",
        "indoorOutdoor": "outdoor",
        "crowdLevel": {"morning": "Moderate", "midday": "High", "evening": "Moderate"},
        "verified": True
    },
    {
        "id": "casablanca-boutique",
        "name": "Casablanca Heritage Boutique",
        "category": "Heritage",
        "lat": 11.9333,
        "lng": 79.8298,
        "entryFee": 0,
        "feeNote": "Free to browse; purchases extra",
        "hours": {
            "open": "10:00",
            "close": "21:00",
            "closedDays": [],
            "splitSessions": None,
            "allDay": False
        },
        "hoursNote": "Not confirmed, check on arrival",
        "image": "/images/casablanca.png",
        "description": "Multi-storey premier boutique and lifestyle store on Mission Street featuring curated regional textiles, handmade ceramics, artisanal leathers, and a relaxed top-floor café.",
        "avgVisitMinutes": 45,
        "bestTimeOfDay": "Afternoon",
        "indoorOutdoor": "indoor",
        "crowdLevel": {"morning": "Low", "midday": "Moderate", "evening": "High"},
        "verified": False
    },
    {
        "id": "cluny-embroidery-centre",
        "name": "Cluny Embroidery Centre",
        "category": "Heritage",
        "lat": 11.9324,
        "lng": 79.8339,
        "entryFee": 0,
        "feeNote": "Free",
        "hours": {
            "open": "09:00",
            "close": "17:00",
            "closedDays": [0], # Closed Sunday
            "splitSessions": [
                {"open": "09:00", "close": "12:00"},
                {"open": "14:00", "close": "17:00"}
            ],
            "allDay": False
        },
        "hoursNote": "9 AM–12 PM, 2–5 PM; closed Sunday",
        "image": "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80",
        "description": "Charitable heritage needlework center in an 18th-century French colonial mansion on Rue Romain Rolland, where skilled local women hand-embroider delicate linen and lace.",
        "avgVisitMinutes": 45,
        "bestTimeOfDay": "Morning",
        "indoorOutdoor": "indoor",
        "crowdLevel": {"morning": "Low", "midday": "Low", "evening": "Closed"},
        "verified": True
    },
    {
        "id": "paradise-beach",
        "name": "Paradise Beach",
        "category": "Beaches",
        "lat": 11.8742,
        "lng": 79.8193,
        "entryFee": 0,
        "feeNote": "Beach entry free; normal boat ticket ₹300 adult / ₹150 child",
        "hours": {
            "open": "09:00",
            "close": "17:00",
            "closedDays": [],
            "splitSessions": None,
            "allDay": False
        },
        "hoursNote": "Boat service generally 9 AM–5 PM; confirm last return boat",
        "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Paradise_Beach_Pondicherry.jpg/800px-Paradise_Beach_Pondicherry.jpg",
        "description": "Pristine golden sand spit nestled between the Chunnambar backwaters and the open sea, accessible exclusively by an enchanting ferry ride through casuarina banks.",
        "avgVisitMinutes": 150,
        "bestTimeOfDay": "Morning",
        "indoorOutdoor": "outdoor",
        "crowdLevel": {"morning": "Moderate", "midday": "High", "evening": "High"},
        "verified": True
    },
    {
        "id": "serenity-beach",
        "name": "Serenity Beach",
        "category": "Beaches",
        "lat": 11.9688,
        "lng": 79.8436,
        "entryFee": 0,
        "feeNote": "Free",
        "hours": {
            "open": "05:00",
            "close": "20:00",
            "closedDays": [],
            "splitSessions": None,
            "allDay": True
        },
        "hoursNote": "Not confirmed, check on arrival",
        "image": "/images/serenity_beach_coast.jpg.jpeg",
        "description": "Picturesque sandy bay north of town featuring a long rocky groin into the waves, artisanal catamaran fleets, sunrise photo vantage points, and friendly surf schools.",
        "avgVisitMinutes": 90,
        "bestTimeOfDay": "Sunrise",
        "indoorOutdoor": "outdoor",
        "crowdLevel": {"morning": "Low", "midday": "Low", "evening": "Moderate"},
        "verified": False
    },
    {
        "id": "eden-beach",
        "name": "Eden Beach",
        "category": "Beaches",
        "lat": 11.8847,
        "lng": 79.8228,
        "entryFee": 0,
        "feeNote": "Free",
        "hours": {
            "open": "09:00",
            "close": "18:00",
            "closedDays": [],
            "splitSessions": None,
            "allDay": False
        },
        "hoursNote": "9 AM–6 PM",
        "image": "/images/eden_beach.png",
        "description": "Internationally certified Blue Flag eco-beach in Chinnaveerampattinam offering spotless sands, watchtowers, solar power, clean washroom facilities, and calm shores.",
        "avgVisitMinutes": 120,
        "bestTimeOfDay": "Sunset",
        "indoorOutdoor": "outdoor",
        "crowdLevel": {"morning": "Low", "midday": "Moderate", "evening": "Moderate"},
        "verified": True
    },
    {
        "id": "pondy-marina-beach",
        "name": "Pondy Marina Beach",
        "category": "Beaches",
        "lat": 11.9162,
        "lng": 79.8315,
        "entryFee": 0,
        "feeNote": "Free",
        "hours": {
            "open": "05:00",
            "close": "22:00",
            "closedDays": [],
            "splitSessions": None,
            "allDay": True
        },
        "hoursNote": "Not confirmed, check on arrival",
        "image": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80",
        "description": "Modern family waterfront recreation strip south of the main promenade, featuring an open-air food court, sandy playground spaces, and vibrant evening lighting.",
        "avgVisitMinutes": 75,
        "bestTimeOfDay": "Evening",
        "indoorOutdoor": "outdoor",
        "crowdLevel": {"morning": "Low", "midday": "Low", "evening": "High"},
        "verified": False
    },
    {
        "id": "auroville-beach",
        "name": "Auroville Beach",
        "category": "Beaches",
        "lat": 11.9839,
        "lng": 79.8519,
        "entryFee": 0,
        "feeNote": "Free",
        "hours": {
            "open": "05:00",
            "close": "19:00",
            "closedDays": [],
            "splitSessions": None,
            "allDay": True
        },
        "hoursNote": "Not confirmed, check on arrival",
        "image": "https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=800&q=80",
        "description": "Also called Auro Beach, situated off ECR with gently sloping sands, wooden fishing catamarans, and rolling waves popular among morning walkers and shell collectors.",
        "avgVisitMinutes": 60,
        "bestTimeOfDay": "Sunrise",
        "indoorOutdoor": "outdoor",
        "crowdLevel": {"morning": "Low", "midday": "Low", "evening": "Moderate"},
        "verified": False
    },
    {
        "id": "french-war-memorial",
        "name": "French War Memorial",
        "category": "Heritage",
        "lat": 11.9333,
        "lng": 79.8361,
        "entryFee": 0,
        "feeNote": "Free",
        "hours": {
            "open": "10:00",
            "close": "17:00",
            "closedDays": [],
            "splitSessions": None,
            "allDay": False
        },
        "hoursNote": "10 AM–5 PM",
        "image": "/images/french_war_memorial.png",
        "description": "Solemn and elegant monument on Goubert Avenue dedicated to the residents of French India who sacrificed their lives during the First World War. Illuminated gracefully on Bastille Day.",
        "avgVisitMinutes": 30,
        "bestTimeOfDay": "Morning",
        "indoorOutdoor": "outdoor",
        "crowdLevel": {"morning": "Low", "midday": "Low", "evening": "Moderate"},
        "verified": True
    },
    {
        "id": "mahatma-gandhi-statue",
        "name": "Mahatma Gandhi Statue",
        "category": "Heritage",
        "lat": 11.9318,
        "lng": 79.8358,
        "entryFee": 0,
        "feeNote": "Free",
        "hours": {
            "open": "00:00",
            "close": "23:59",
            "closedDays": [],
            "splitSessions": None,
            "allDay": True
        },
        "hoursNote": "Public seafront; accessible throughout the day",
        "image": "https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&w=800&q=80",
        "description": "Towering 4-meter bronze statue of Mahatma Gandhi surrounded by eight majestic monolithic granite pillars brought from the historic fort of Gingee.",
        "avgVisitMinutes": 30,
        "bestTimeOfDay": "Evening",
        "indoorOutdoor": "outdoor",
        "crowdLevel": {"morning": "Moderate", "midday": "Low", "evening": "High"},
        "verified": True
    },
    {
        "id": "aayi-mandapam",
        "name": "Aayi Mandapam / Bharathi Park",
        "category": "Parks",
        "lat": 11.9331,
        "lng": 79.8335,
        "entryFee": 0,
        "feeNote": "Free",
        "hours": {
            "open": "06:00",
            "close": "20:00",
            "closedDays": [],
            "splitSessions": None,
            "allDay": False
        },
        "hoursNote": "6 AM–8 PM",
        "image": "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=800&q=80",
        "description": "Brilliant neoclassical white Greco-Roman pavilion built during the reign of Napoleon III, commemorating the lady Aayi who gifted her reservoir to supply clean drinking water.",
        "avgVisitMinutes": 45,
        "bestTimeOfDay": "Morning",
        "indoorOutdoor": "outdoor",
        "crowdLevel": {"morning": "Low", "midday": "Low", "evening": "Moderate"},
        "verified": True
    },
    {
        "id": "old-lighthouse",
        "name": "Old Lighthouse",
        "category": "Heritage",
        "lat": 11.9312,
        "lng": 79.8353,
        "entryFee": 10,
        "feeNote": "₹10 entry reported; verify interior access on arrival",
        "hours": {
            "open": "08:00",
            "close": "17:30",
            "closedDays": [],
            "splitSessions": [
                {"open": "08:00", "close": "12:30"},
                {"open": "13:30", "close": "17:30"}
            ],
            "allDay": False
        },
        "hoursNote": "8 AM–12:30 PM, 1:30–5:30 PM (verify current schedule)",
        "image": "https://images.unsplash.com/photo-1506953823976-52e1fdc0149a?auto=format&fit=crop&w=800&q=80",
        "description": "19th-century French beacon erected in 1836 on Goubert Avenue. Its historic fluted tower stands opposite the Place de la République.",
        "avgVisitMinutes": 45,
        "bestTimeOfDay": "Morning",
        "indoorOutdoor": "both",
        "crowdLevel": {"morning": "Low", "midday": "Low", "evening": "Moderate"},
        "verified": True
    },
    {
        "id": "raj-niwas",
        "name": "Raj Niwas (Governor's Palace)",
        "category": "Heritage",
        "lat": 11.9341,
        "lng": 79.8347,
        "entryFee": 0,
        "feeNote": "Not confirmed, check on arrival",
        "hours": {
            "open": "12:00",
            "close": "13:30",
            "closedDays": [],
            "splitSessions": None,
            "allDay": False
        },
        "hoursNote": "12–1:30 PM is listed for visits; prior approval required",
        "image": "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=800&q=80",
        "description": "Grand official residence of the Lieutenant Governor of Puducherry, formerly the Palais du Gouverneur, harmonizing French classical and Indian architectural motifs.",
        "avgVisitMinutes": 45,
        "bestTimeOfDay": "Midday",
        "indoorOutdoor": "indoor",
        "crowdLevel": {"morning": "Low", "midday": "Moderate", "evening": "Low"},
        "verified": False
    },
    {
        "id": "manakula-vinayagar-temple",
        "name": "Manakula Vinayagar Temple",
        "category": "Temples",
        "lat": 11.9352,
        "lng": 79.8340,
        "entryFee": 0,
        "feeNote": "Free for general darshan; special services extra",
        "hours": {
            "open": "05:45",
            "close": "21:30",
            "closedDays": [],
            "splitSessions": [
                {"open": "05:45", "close": "12:30"},
                {"open": "16:00", "close": "21:30"}
            ],
            "allDay": False
        },
        "hoursNote": "5:45 AM–12:30 PM, 4–9:30 PM",
        "image": "/images/manakula_vinayagar_temple.png",
        "description": "Celebrated ancient Hindu shrine dedicated to Lord Ganesha, dating back to pre-French times. Features a golden chariot, ornate ceiling frescoes, and traditional temple rituals.",
        "avgVisitMinutes": 45,
        "bestTimeOfDay": "Morning",
        "indoorOutdoor": "indoor",
        "crowdLevel": {"morning": "High", "midday": "Closed", "evening": "High"},
        "verified": True
    },
    {
        "id": "sacred-heart-basilica",
        "name": "Basilica of the Sacred Heart of Jesus",
        "category": "Churches",
        "lat": 11.9287,
        "lng": 79.8276,
        "entryFee": 0,
        "feeNote": "Free",
        "hours": {
            "open": "06:00",
            "close": "18:00",
            "closedDays": [],
            "splitSessions": None,
            "allDay": False
        },
        "hoursNote": "Mon–Fri 6 AM–6 PM; Sat until 5:30 PM; Sun 5:30 AM–7:30 PM",
        "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cf/Sacred_Heart_Church_Pondicherry.jpg/800px-Sacred_Heart_Church_Pondicherry.jpg",
        "description": "Magnificent specimen of neo-Gothic Catholic architecture on South Boulevard, featuring rare stained-glass panels depicting the life of Christ and soaring twin spires.",
        "avgVisitMinutes": 45,
        "bestTimeOfDay": "Morning",
        "indoorOutdoor": "indoor",
        "crowdLevel": {"morning": "Moderate", "midday": "Low", "evening": "Moderate"},
        "verified": True
    },
    {
        "id": "notre-dame-des-anges",
        "name": "Église de Notre Dame des Anges",
        "category": "Churches",
        "lat": 11.9322,
        "lng": 79.8354,
        "entryFee": 0,
        "feeNote": "Free",
        "hours": {
            "open": "09:00",
            "close": "18:00",
            "closedDays": [],
            "splitSessions": [
                {"open": "09:00", "close": "12:00"},
                {"open": "14:00", "close": "18:00"}
            ],
            "allDay": False
        },
        "hoursNote": "9 AM–12 PM, 2–6 PM on weekdays",
        "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e6/Notre_Dame_des_Anges_Pondicherry.jpg/800px-Notre_Dame_des_Anges_Pondicherry.jpg",
        "description": "Charming Greco-Roman basilica on Rue Dumas facing the sea, distinguished by its pastel peach masonry, marble interiors, and statue of Joan of Arc.",
        "avgVisitMinutes": 40,
        "bestTimeOfDay": "Morning",
        "indoorOutdoor": "indoor",
        "crowdLevel": {"morning": "Low", "midday": "Low", "evening": "Low"},
        "verified": True
    },
    {
        "id": "immaculate-conception-cathedral",
        "name": "Cathedral of Our Lady of the Immaculate Conception",
        "category": "Churches",
        "lat": 11.9348,
        "lng": 79.8306,
        "entryFee": 0,
        "feeNote": "Free",
        "hours": {
            "open": "07:00",
            "close": "20:30",
            "closedDays": [],
            "splitSessions": [
                {"open": "07:00", "close": "12:00"},
                {"open": "15:00", "close": "20:30"}
            ],
            "allDay": False
        },
        "hoursNote": "7 AM–12 PM, 3–8:30 PM daily",
        "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/Immaculate_Conception_Cathedral_Pondicherry.jpg/800px-Immaculate_Conception_Cathedral_Pondicherry.jpg",
        "description": "Historic 300-year-old mother church of the Archdiocese on Mission Street, displaying imposing Portuguese-French baroque façade architecture and luminous altar halls.",
        "avgVisitMinutes": 45,
        "bestTimeOfDay": "Morning",
        "indoorOutdoor": "indoor",
        "crowdLevel": {"morning": "Moderate", "midday": "Closed", "evening": "Moderate"},
        "verified": True
    },
    {
        "id": "vedapureeswarar-temple",
        "name": "Vedapureeswarar Temple",
        "category": "Temples",
        "lat": 11.9368,
        "lng": 79.8304,
        "entryFee": 0,
        "feeNote": "Free for general darshan; offerings extra",
        "hours": {
            "open": "06:00",
            "close": "20:30",
            "closedDays": [],
            "splitSessions": [
                {"open": "06:00", "close": "12:00"},
                {"open": "16:00", "close": "20:30"}
            ],
            "allDay": False
        },
        "hoursNote": "6 AM–8:30 PM according to list",
        "image": "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80",
        "description": "Ancient Shiva sanctuary situated on MG Road, renowned for its Dravidian Rajagopuram, sacred Nandi mandapam, and stone pillars with mythological bas-reliefs.",
        "avgVisitMinutes": 45,
        "bestTimeOfDay": "Morning",
        "indoorOutdoor": "indoor",
        "crowdLevel": {"morning": "Moderate", "midday": "Low", "evening": "High"},
        "verified": True
    },
    {
        "id": "thirukameswarar-temple-villianur",
        "name": "Thirukameswarar Temple, Villianur",
        "category": "Temples",
        "lat": 11.9142,
        "lng": 79.7618,
        "entryFee": 0,
        "feeNote": "Free for general darshan; offerings extra",
        "hours": {
            "open": "06:00",
            "close": "20:30",
            "closedDays": [],
            "splitSessions": [
                {"open": "06:00", "close": "12:00"},
                {"open": "16:00", "close": "20:30"}
            ],
            "allDay": False
        },
        "hoursNote": "Daily rituals run from early morning to evening; confirm exact schedule",
        "image": "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=800&q=80",
        "description": "Historic 12th-century Chola-period temple complex in Villianur with an expansive temple theertham (sacred tank) and ornate stone carvings, 9 km west of Puducherry.",
        "avgVisitMinutes": 60,
        "bestTimeOfDay": "Morning",
        "indoorOutdoor": "both",
        "crowdLevel": {"morning": "Moderate", "midday": "Closed", "evening": "Moderate"},
        "verified": True
    },
    {
        "id": "kanniga-parameswari-temple",
        "name": "Kanniga Parameswari Temple",
        "category": "Temples",
        "lat": 11.9329,
        "lng": 79.8291,
        "entryFee": 0,
        "feeNote": "Free for general darshan",
        "hours": {
            "open": "06:00",
            "close": "20:30",
            "closedDays": [],
            "splitSessions": [
                {"open": "06:00", "close": "12:00"},
                {"open": "16:00", "close": "20:30"}
            ],
            "allDay": False
        },
        "hoursNote": "Not confirmed, check on arrival",
        "image": "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=800&q=80",
        "description": "Unique syncretic temple on M.G. Road blending Dravidian gopuram architecture with French neoclassical archways, columns, and stained glass.",
        "avgVisitMinutes": 35,
        "bestTimeOfDay": "Morning",
        "indoorOutdoor": "indoor",
        "crowdLevel": {"morning": "Moderate", "midday": "Low", "evening": "Moderate"},
        "verified": False
    },
    {
        "id": "meeran-mosque",
        "name": "Meeran Mosque",
        "category": "Mosques",
        "lat": 11.9308,
        "lng": 79.8294,
        "entryFee": 0,
        "feeNote": "Free for worship; visitor access may be restricted",
        "hours": {
            "open": "06:00",
            "close": "20:00",
            "closedDays": [],
            "splitSessions": None,
            "allDay": False
        },
        "hoursNote": "Not confirmed, check on arrival",
        "image": "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80",
        "description": "One of the oldest Islamic sites in Puducherry, built over 350 years ago in the Muslim quarter, featuring classical Gothic and Indo-Islamic domes.",
        "avgVisitMinutes": 30,
        "bestTimeOfDay": "Morning",
        "indoorOutdoor": "indoor",
        "crowdLevel": {"morning": "Low", "midday": "Low", "evening": "Low"},
        "verified": False
    },
    {
        "id": "kuthba-mosque",
        "name": "Kuthba Mosque",
        "category": "Mosques",
        "lat": 11.9317,
        "lng": 79.8288,
        "entryFee": 0,
        "feeNote": "Free for worship; visitor access may be restricted",
        "hours": {
            "open": "06:30",
            "close": "19:30",
            "closedDays": [],
            "splitSessions": None,
            "allDay": False
        },
        "hoursNote": "6:30 AM–7:30 PM (subject to worship rules)",
        "image": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80",
        "description": "Historic 17th-century Friday congregational mosque in the Heritage Muslim precinct, noted for traditional Friday prayers and serene prayer hall.",
        "avgVisitMinutes": 30,
        "bestTimeOfDay": "Morning",
        "indoorOutdoor": "indoor",
        "crowdLevel": {"morning": "Low", "midday": "Moderate", "evening": "Low"},
        "verified": True
    },
    {
        "id": "jamia-mosque",
        "name": "Jamia Mosque",
        "category": "Mosques",
        "lat": 11.9325,
        "lng": 79.8281,
        "entryFee": 0,
        "feeNote": "Free for worship; visitor access may be restricted",
        "hours": {
            "open": "06:30",
            "close": "19:30",
            "closedDays": [],
            "splitSessions": None,
            "allDay": False
        },
        "hoursNote": "6:30 AM–7:30 PM",
        "image": "https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=800&q=80",
        "description": "Centuries-old Islamic center on Mosque Street featuring graceful minarets, polished courtyard pavers, and peaceful community surroundings.",
        "avgVisitMinutes": 30,
        "bestTimeOfDay": "Morning",
        "indoorOutdoor": "indoor",
        "crowdLevel": {"morning": "Low", "midday": "Low", "evening": "Low"},
        "verified": True
    },
    {
        "id": "bharathi-park",
        "name": "Bharathi Park / Government Park",
        "category": "Parks",
        "lat": 11.9331,
        "lng": 79.8335,
        "entryFee": 0,
        "feeNote": "Free",
        "hours": {
            "open": "06:00",
            "close": "20:30",
            "closedDays": [],
            "splitSessions": None,
            "allDay": False
        },
        "hoursNote": "6 AM–8:30 PM",
        "image": "https://images.unsplash.com/photo-1506953823976-52e1fdc0149a?auto=format&fit=crop&w=800&q=80",
        "description": "Lush verdant municipal park located opposite the Legislative Assembly and Raj Niwas, shaded by ancient banyans and flowering canopies around Aayi Mandapam.",
        "avgVisitMinutes": 45,
        "bestTimeOfDay": "Morning",
        "indoorOutdoor": "outdoor",
        "crowdLevel": {"morning": "Moderate", "midday": "Low", "evening": "High"},
        "verified": True
    },
    {
        "id": "botanical-garden",
        "name": "Botanical Garden",
        "category": "Parks",
        "lat": 11.9282,
        "lng": 79.8252,
        "entryFee": 0,
        "feeNote": "Non-ticketed / Free entry",
        "hours": {
            "open": "09:00",
            "close": "17:00",
            "closedDays": [],
            "splitSessions": None,
            "allDay": False
        },
        "hoursNote": "9 AM–5 PM",
        "image": "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80",
        "description": "Established in 1826 by French horticulturist C.S. Perrottet, boasting 22 acres of rare exotic flora, a toy train track, fossil specimens, and shaded gravel walkways.",
        "avgVisitMinutes": 75,
        "bestTimeOfDay": "Morning",
        "indoorOutdoor": "outdoor",
        "crowdLevel": {"morning": "Moderate", "midday": "Low", "evening": "Moderate"},
        "verified": True
    },
    {
        "id": "jawahar-toy-museum",
        "name": "Jawahar Toy Museum",
        "category": "Museums",
        "lat": 11.9318,
        "lng": 79.8351,
        "entryFee": 0,
        "feeNote": "Free",
        "hours": {
            "open": "10:00",
            "close": "17:00",
            "closedDays": [1], # Closed Monday
            "splitSessions": None,
            "allDay": False
        },
        "hoursNote": "10 AM–5 PM; closed Monday and public holidays",
        "image": "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=800&q=80",
        "description": "Delightful boutique gallery on Goubert Avenue holding over 120 costumed dolls and traditional puppet figures representing distinct Indian states and cultures.",
        "avgVisitMinutes": 35,
        "bestTimeOfDay": "Midday",
        "indoorOutdoor": "indoor",
        "crowdLevel": {"morning": "Low", "midday": "Moderate", "evening": "Low"},
        "verified": True
    },
    {
        "id": "chunnambar-boat-house",
        "name": "Chunnambar Boat House",
        "category": "Day trips",
        "lat": 11.8742,
        "lng": 79.8055,
        "entryFee": 0,
        "feeNote": "Boat ticket extra; normal boat ₹300 adult / ₹150 child",
        "hours": {
            "open": "09:00",
            "close": "17:00",
            "closedDays": [],
            "splitSessions": None,
            "allDay": False
        },
        "hoursNote": "9 AM–5 PM",
        "image": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80",
        "description": "Scenic backwater marina 8 km south of Pondicherry along the Cuddalore Road, serving as the departure terminal for ferries to Paradise Beach.",
        "avgVisitMinutes": 60,
        "bestTimeOfDay": "Morning",
        "indoorOutdoor": "outdoor",
        "crowdLevel": {"morning": "Moderate", "midday": "High", "evening": "High"},
        "verified": True
    },
    {
        "id": "ousteri-wetland",
        "name": "Ousteri Wetland and National Park",
        "category": "Parks",
        "lat": 11.9567,
        "lng": 79.7431,
        "entryFee": 0,
        "feeNote": "Free entry; boating extra",
        "hours": {
            "open": "09:00",
            "close": "17:00",
            "closedDays": [],
            "splitSessions": None,
            "allDay": False
        },
        "hoursNote": "9 AM–5 PM",
        "image": "https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=800&q=80",
        "description": "Major freshwater wetland sanctuary situated 10 km northwest of the city, renowned as an Important Bird Area (IBA) sheltering migratory waterfowls.",
        "avgVisitMinutes": 90,
        "bestTimeOfDay": "Morning",
        "indoorOutdoor": "outdoor",
        "crowdLevel": {"morning": "Low", "midday": "Low", "evening": "Moderate"},
        "verified": True
    },
    {
        "id": "arikamedu-archaeological-site",
        "name": "Arikamedu Archaeological Site",
        "category": "Heritage",
        "lat": 11.8953,
        "lng": 79.8169,
        "entryFee": 0,
        "feeNote": "Free entry reported; confirm access on arrival",
        "hours": {
            "open": "10:00",
            "close": "16:00",
            "closedDays": [],
            "splitSessions": None,
            "allDay": False
        },
        "hoursNote": "10 AM–4 PM",
        "image": "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=800&q=80",
        "description": "Fabled ancient Indo-Roman trading port and archaeological site on the Ariyankuppam riverbank, revealing historic glass bead factories and Roman amphorae fragments.",
        "avgVisitMinutes": 60,
        "bestTimeOfDay": "Morning",
        "indoorOutdoor": "outdoor",
        "crowdLevel": {"morning": "Low", "midday": "Low", "evening": "Low"},
        "verified": True
    },
    {
        "id": "auroville-visitors-centre",
        "name": "Auroville Visitors Centre",
        "category": "Heritage",
        "lat": 11.9995,
        "lng": 79.8122,
        "entryFee": 0,
        "feeNote": "No general entry fee identified; activities or purchases extra",
        "hours": {
            "open": "09:00",
            "close": "17:00",
            "closedDays": [],
            "splitSessions": None,
            "allDay": False
        },
        "hoursNote": "Information desk 9 AM–5 PM",
        "image": "/images/matrimandir_auroville.png",
        "description": "Primary gateway for Auroville visitors offering comprehensive photo exhibits, orientation video halls, organic boutiques, and registration passes for the Matrimandir.",
        "avgVisitMinutes": 75,
        "bestTimeOfDay": "Morning",
        "indoorOutdoor": "both",
        "crowdLevel": {"morning": "Moderate", "midday": "High", "evening": "Low"},
        "verified": True
    },
    {
        "id": "jawaharlal-nehru-statue",
        "name": "Jawaharlal Nehru Statue",
        "category": "Heritage",
        "lat": 11.9328,
        "lng": 79.8360,
        "entryFee": 0,
        "feeNote": "Free",
        "hours": {
            "open": "00:00",
            "close": "23:59",
            "closedDays": [],
            "splitSessions": None,
            "allDay": True
        },
        "hoursNote": "Public seafront; accessible throughout the day",
        "image": "https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&w=800&q=80",
        "description": "Statue of India's first Prime Minister prominently positioned along Goubert Avenue sea promenade, facing the Bay of Bengal opposite the Gandhi memorial.",
        "avgVisitMinutes": 20,
        "bestTimeOfDay": "Evening",
        "indoorOutdoor": "outdoor",
        "crowdLevel": {"morning": "Low", "midday": "Low", "evening": "Moderate"},
        "verified": True
    },
    {
        "id": "dupleix-statue",
        "name": "Dupleix Statue",
        "category": "Heritage",
        "lat": 11.9298,
        "lng": 79.8348,
        "entryFee": 0,
        "feeNote": "Free",
        "hours": {
            "open": "00:00",
            "close": "23:59",
            "closedDays": [],
            "splitSessions": None,
            "allDay": True
        },
        "hoursNote": "Public seafront; accessible throughout the day",
        "image": "https://images.unsplash.com/photo-1506953823976-52e1fdc0149a?auto=format&fit=crop&w=800&q=80",
        "description": "Historic 2.88-meter bronze monument sculpted in 1870 commemorating Marquis Joseph-François Dupleix, the famed 18th-century French Governor of Pondicherry.",
        "avgVisitMinutes": 20,
        "bestTimeOfDay": "Evening",
        "indoorOutdoor": "outdoor",
        "crowdLevel": {"morning": "Low", "midday": "Low", "evening": "Moderate"},
        "verified": True
    },
    {
        "id": "romain-rolland-library",
        "name": "Romain Rolland Library",
        "category": "Museums",
        "lat": 11.9337,
        "lng": 79.8342,
        "entryFee": 0,
        "feeNote": "Reading access: confirm visitor rules; membership charges apply for borrowing",
        "hours": {
            "open": "08:00",
            "close": "20:00",
            "closedDays": [1], # Closed Monday
            "splitSessions": None,
            "allDay": False
        },
        "hoursNote": "8 AM–8 PM, closed Monday and public holidays",
        "image": "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80",
        "description": "One of India's oldest public libraries, founded in 1827 on Rue Romain Rolland, housing over 40,000 rare French historical manuscripts, journals, and antique volumes.",
        "avgVisitMinutes": 45,
        "bestTimeOfDay": "Morning",
        "indoorOutdoor": "indoor",
        "crowdLevel": {"morning": "Low", "midday": "Low", "evening": "Low"},
        "verified": True
    },
    {
        "id": "french-institute-ifp",
        "name": "French Institute of Pondicherry (IFP)",
        "category": "Heritage",
        "lat": 11.9341,
        "lng": 79.8354,
        "entryFee": 0,
        "feeNote": "Free for eligible public visits",
        "hours": {
            "open": "09:00",
            "close": "17:30",
            "closedDays": [0, 6], # Closed Saturday and Sunday
            "splitSessions": [
                {"open": "09:00", "close": "13:00"},
                {"open": "14:00", "close": "17:30"}
            ],
            "allDay": False
        },
        "hoursNote": "Mon–Fri, 9 AM–1 PM and 2–5:30 PM",
        "image": "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=800&q=80",
        "description": "Renowned research institution on Rue Saint Louis established in 1955, preserving the UNESCO-recognized collection of South Indian temple photo-archives and manuscripts.",
        "avgVisitMinutes": 45,
        "bestTimeOfDay": "Morning",
        "indoorOutdoor": "indoor",
        "crowdLevel": {"morning": "Low", "midday": "Low", "evening": "Low"},
        "verified": True
    },
    {
        "id": "alliance-francaise",
        "name": "Alliance Française de Pondichéry",
        "category": "Heritage",
        "lat": 11.9311,
        "lng": 79.8349,
        "entryFee": 0,
        "feeNote": "Not confirmed, check on arrival",
        "hours": {
            "open": "09:00",
            "close": "18:30",
            "closedDays": [0], # Closed Sunday
            "splitSessions": [
                {"open": "09:00", "close": "13:00"},
                {"open": "15:00", "close": "18:30"}
            ],
            "allDay": False
        },
        "hoursNote": "Mon–Sat 9 AM–1 PM, 3–6:30 PM (office hours)",
        "image": "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=800&q=80",
        "description": "First Alliance Française chapter established in South Asia (1889), occupying a splendid seafront villa hosting French cinema screenings, art salons, and cultural talks.",
        "avgVisitMinutes": 45,
        "bestTimeOfDay": "Evening",
        "indoorOutdoor": "both",
        "crowdLevel": {"morning": "Low", "midday": "Low", "evening": "Moderate"},
        "verified": False
    },
    {
        "id": "hotel-de-ville",
        "name": "Hôtel de Ville / Municipal Office",
        "category": "Heritage",
        "lat": 11.9325,
        "lng": 79.8352,
        "entryFee": 0,
        "feeNote": "Not confirmed, check on arrival",
        "hours": {
            "open": "09:30",
            "close": "17:30",
            "closedDays": [0, 6],
            "splitSessions": None,
            "allDay": False
        },
        "hoursNote": "Not confirmed; exterior viewing only unless access is permitted",
        "image": "https://images.unsplash.com/photo-1506953823976-52e1fdc0149a?auto=format&fit=crop&w=800&q=80",
        "description": "Historic colonial municipal town hall on Rue de la Caserne dating back to 1870, reconstructed with meticulous heritage architectural fidelity facing the sea.",
        "avgVisitMinutes": 25,
        "bestTimeOfDay": "Morning",
        "indoorOutdoor": "outdoor",
        "crowdLevel": {"morning": "Low", "midday": "Low", "evening": "Low"},
        "verified": False
    },
    {
        "id": "old-port",
        "name": "Old Port / Old Harbour Area",
        "category": "Heritage",
        "lat": 11.9214,
        "lng": 79.8322,
        "entryFee": 0,
        "feeNote": "Free for publicly accessible areas",
        "hours": {
            "open": "06:00",
            "close": "19:00",
            "closedDays": [],
            "splitSessions": None,
            "allDay": True
        },
        "hoursNote": "Not confirmed, check on arrival",
        "image": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80",
        "description": "Atmospheric historic maritime pier and ruins southwest of the promenade where French and international cargo merchant vessels anchored throughout the 18th and 19th centuries.",
        "avgVisitMinutes": 45,
        "bestTimeOfDay": "Sunrise",
        "indoorOutdoor": "outdoor",
        "crowdLevel": {"morning": "Low", "midday": "Low", "evening": "Moderate"},
        "verified": False
    },
    {
        "id": "auroville-farms",
        "name": "Auroville Farms & Green Belt",
        "category": "Day trips",
        "lat": 12.0125,
        "lng": 79.8021,
        "entryFee": 0,
        "feeNote": "Not confirmed; tours or activities may cost extra",
        "hours": {
            "open": "08:30",
            "close": "16:30",
            "closedDays": [],
            "splitSessions": None,
            "allDay": False
        },
        "hoursNote": "Not confirmed, check on arrival",
        "image": "https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=800&q=80",
        "description": "Pioneering ecological regenerative belt surrounding Auroville featuring organic spirulina farms, agroforestry plots, native seed banks, and permaculture workshops.",
        "avgVisitMinutes": 120,
        "bestTimeOfDay": "Morning",
        "indoorOutdoor": "outdoor",
        "crowdLevel": {"morning": "Low", "midday": "Low", "evening": "Low"},
        "verified": False
    },
    {
        "id": "karaikal-beach",
        "name": "Karaikal Beach",
        "category": "Day trips",
        "lat": 10.9254,
        "lng": 79.8488,
        "entryFee": 0,
        "feeNote": "Free",
        "hours": {
            "open": "05:00",
            "close": "21:00",
            "closedDays": [],
            "splitSessions": None,
            "allDay": True
        },
        "hoursNote": "Not confirmed, check on arrival",
        "image": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80",
        "description": "Sprawling sandy enclave beach where the Arasalar River meets the Bay of Bengal, 130 km south of central Pondicherry; a calm coastal day trip destination.",
        "avgVisitMinutes": 120,
        "bestTimeOfDay": "Sunrise",
        "indoorOutdoor": "outdoor",
        "crowdLevel": {"morning": "Low", "midday": "Low", "evening": "Moderate"},
        "verified": False
    }
]

print(f"Total places compiled: {len(PLACES)}")
assert len(PLACES) == 43, f"Expected 43 places, got {len(PLACES)}"

out_path = Path("frontend/src/data/places.js")

js_code = f"""/**
 * ExploreMate Single Source of Truth for Pondicherry Places
 * Exactly 43 places compiled according to project specifications.
 * All pages (Home search, Destinations, Itinerary, Map, Carbon) import from here.
 */

export const FALLBACK_IMAGE = '/images/white_town_reference.jpg.jpeg';

export const CATEGORIES = [
  'All',
  'Beaches',
  'Heritage',
  'Temples',
  'Churches',
  'Mosques',
  'Parks',
  'Museums',
  'Day trips'
];

export const PLACES = {json.dumps(PLACES, indent=2)};

/**
 * Check if a place is open right now based on its structured hours.
 * @param {{ hours: object, verified: boolean }} place
 * @param {{Date}} date
 * @returns {{{{ isOpen: boolean, isClosedToday: boolean, statusText: string, badgeColor: string }}}}
 */
export function isPlaceOpenNow(place, date = new Date()) {{
  if (!place || !place.hours) {{
    return {{ isOpen: true, isClosedToday: false, statusText: 'Hours not confirmed', badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' }};
  }}

  const {{ hours, verified }} = place;

  if (hours.allDay) {{
    return {{ isOpen: true, isClosedToday: false, statusText: 'Open 24/7', badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' }};
  }}

  const currentDay = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
  if (hours.closedDays && hours.closedDays.includes(currentDay)) {{
    return {{ isOpen: false, isClosedToday: true, statusText: 'Closed today', badgeColor: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300' }};
  }}

  const currentHours = date.getHours();
  const currentMins = date.getMinutes();
  const currentTotalMins = currentHours * 60 + currentMins;

  const toMins = (timeStr) => {{
    if (!timeStr) return 0;
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + (m || 0);
  }};

  // Check split sessions if present
  if (hours.splitSessions && hours.splitSessions.length > 0) {{
    let currentlyOpen = false;
    let nextOpenSession = null;

    for (const session of hours.splitSessions) {{
      const start = toMins(session.open);
      const end = toMins(session.close);
      if (currentTotalMins >= start && currentTotalMins < end) {{
        currentlyOpen = true;
        break;
      }}
      if (currentTotalMins < start && !nextOpenSession) {{
        nextOpenSession = session;
      }}
    }}

    if (currentlyOpen) {{
      return {{ isOpen: true, isClosedToday: false, statusText: 'Open now', badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' }};
    }} else if (nextOpenSession) {{
      return {{ isOpen: false, isClosedToday: false, statusText: `Closed now (reopens at ${{nextOpenSession.open}})`, badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' }};
    }} else {{
      return {{ isOpen: false, isClosedToday: false, statusText: 'Closed for the day', badgeColor: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300' }};
    }}
  }}

  // Single continuous session
  if (hours.open && hours.close) {{
    const start = toMins(hours.open);
    const end = toMins(hours.close);
    if (currentTotalMins >= start && currentTotalMins < end) {{
      return {{ isOpen: true, isClosedToday: false, statusText: 'Open now', badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' }};
    }} else {{
      return {{ isOpen: false, isClosedToday: false, statusText: 'Closed now', badgeColor: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300' }};
    }}
  }}

  if (!verified) {{
    return {{ isOpen: true, isClosedToday: false, statusText: 'Not confirmed, check on arrival', badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' }};
  }}

  return {{ isOpen: true, isClosedToday: false, statusText: 'Open', badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' }};
}}

export default PLACES;
"""

with open(out_path, "w", encoding="utf-8") as f:
    f.write(js_code)

print(f"Generated {out_path} with {len(PLACES)} places successfully!")

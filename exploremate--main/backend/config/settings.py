"""
ExploreMate Server Configuration
Defines server paths, model configurations, and safety phone numbers.
"""

import os
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"

load_dotenv(BASE_DIR / ".env")

BRAND_NAME = "ExploreMate"
CONTACT_PHONE = "9********0"

# Safety Numbers (Shared constants)
SAFETY_NUMBERS = {
    "police": "100",
    "ambulance": "108",
    "fire": "101",
    "women": "1091",
    "tourist": "1363"
}

# Supported City Coordinates Bounding Box for Pondicherry
PONDICHERRY_BOUNDS = {
    "min_lat": 11.8000,
    "max_lat": 12.0500,
    "min_lng": 79.7000,
    "max_lng": 79.9000,
    "center": {"lat": 11.9338, "lng": 79.8297}
}

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.8-flash")
GOOGLE_TRANSLATE_KEY = os.getenv("GOOGLE_TRANSLATE_KEY", "")
GOOGLE_PLACES_KEY = os.getenv("GOOGLE_PLACES_KEY", "")
ORS_KEY = os.getenv("ORS_KEY", "")
FEATURE_CHAPTERS = os.getenv("FEATURE_CHAPTERS", "True").lower() == "true"

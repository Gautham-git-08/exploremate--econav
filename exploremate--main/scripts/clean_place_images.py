import re
from pathlib import Path

places_file = Path("frontend/src/data/places.js")
text = places_file.read_text(encoding="utf-8")

# Replace all external URLs with /images/neutral_placeholder.svg
cleaned = re.sub(r'\"image\":\s*\"https?://[^\"]+\"', '\"image\": \"/images/neutral_placeholder.svg\"', text)

# Also ensure FALLBACK_IMAGE is /images/neutral_placeholder.svg or white_town_reference
cleaned = cleaned.replace("export const FALLBACK_IMAGE = '/images/white_town_reference.jpg.jpeg';", "export const FALLBACK_IMAGE = '/images/neutral_placeholder.svg';")

places_file.write_text(cleaned, encoding="utf-8")
print("Cleaned places.js successfully!")

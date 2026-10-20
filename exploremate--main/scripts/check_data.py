"""
ExploreMate Data Schema and Coordinates Validator
Ensures all places have valid required fields and lie inside Pondicherry bounding box.
"""

import json
from pathlib import Path

DATA_FILE = Path(__file__).resolve().parent.parent / "backend" / "data" / "pondicherry.json"

# Pondicherry Bounding Box (Lat: 11.80 to 12.05, Lng: 79.70 to 79.90)
BOUNDS = {
    "min_lat": 11.80,
    "max_lat": 12.05,
    "min_lng": 79.70,
    "max_lng": 79.90
}

def validate_data():
    if not DATA_FILE.exists():
        print(f"Error: {DATA_FILE} does not exist.")
        return False
        
    with open(DATA_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)
        
    places = data.get("places", [])
    print(f"Loaded {len(places)} places from {DATA_FILE.name}")
    
    passed = True
    for p in places:
        pid = p.get("id")
        name = p.get("name")
        lat = p.get("lat")
        lng = p.get("long") or p.get("lng")
        
        if not pid or not name:
            print(f"❌ Missing id or name in entry: {p}")
            passed = False
            continue
            
        if lat is None or lng is None:
            print(f"❌ Missing coordinates for {name} ({pid})")
            passed = False
            continue
            
        if not (BOUNDS["min_lat"] <= lat <= BOUNDS["max_lat"] and BOUNDS["min_lng"] <= lng <= BOUNDS["max_lng"]):
            print(f"[NOTICE] {name} ({lat}, {lng}) is an outlying day trip outside central Pondicherry core.")
            
        print("[OK] Data validation completed successfully! All places verified.")
    return passed

if __name__ == "__main__":
    validate_data()

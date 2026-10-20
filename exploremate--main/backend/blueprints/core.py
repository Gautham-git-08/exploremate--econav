"""
ExploreMate Core Blueprint
Handles city information, places list, stay/hotels, food, and weather proxy.
"""

from flask import Blueprint, jsonify, request
import json
import os
import time
import requests
from config import BASE_DIR, DATA_DIR, SAFETY_NUMBERS, BRAND_NAME, CONTACT_PHONE

core_bp = Blueprint("core", __name__)

_WEATHER_CACHE = {}
_CACHE_TTL = 600  # 10 minutes

def load_json(filename):
    filepath = DATA_DIR / filename
    if not filepath.exists():
        return {}
    with open(filepath, "r", encoding="utf-8") as f:
        return json.load(f)

@core_bp.route("/city", methods=["GET"])
def get_city():
    """Return core city info, safety numbers, and emergency transit hubs."""
    data = load_json("pondicherry.json")
    return jsonify({
        "destination": "Pondicherry",
        "tagline": "The French Riviera of the East · Eco-Heritage Coastal Haven",
        "brand_name": BRAND_NAME,
        "contact_phone": CONTACT_PHONE,
        "customer_service": {
            "name": "Explore Mate Team",
            "phone": CONTACT_PHONE,
            "email": "exploremateservices@gmail.com",
            "hours": "Open all days (Monday – Sunday)"
        },
        "safety_numbers": SAFETY_NUMBERS,
        "transit_hubs": data.get("transit_hubs", {})
    })

@core_bp.route("/places", methods=["GET"])
def get_places():
    """Return all verified/curated places, optionally filtered by type or interest."""
    data = load_json("pondicherry.json")
    places = data.get("places", [])
    
    place_type = request.args.get("type")
    interest = request.args.get("interest")
    is_indoor = request.args.get("indoor")
    
    filtered = places
    if place_type:
        filtered = [p for p in filtered if p.get("type") == place_type]
    if interest:
        filtered = [p for p in filtered if p.get("interest") == interest]
    if is_indoor is not None:
        indoor_bool = is_indoor.lower() == "true"
        filtered = [p for p in filtered if p.get("indoor") == indoor_bool]
        
    return jsonify({"places": filtered, "total": len(filtered)})

@core_bp.route("/places/<place_id>", methods=["GET"])
def get_place(place_id):
    """Return full detailed record for a specific place."""
    data = load_json("pondicherry.json")
    places = data.get("places", [])
    for p in places:
        if p.get("id") == place_id:
            return jsonify(p)
    return jsonify({"error": "Place not found"}), 404

@core_bp.route("/stay", methods=["GET"])
def get_stays():
    """Return accommodation options (guesthouses, hotels, eco-stays)."""
    data = load_json("pondicherry.json")
    stays = data.get("stays", [])
    stay_type = request.args.get("type")
    if stay_type:
        stays = [s for s in stays if s.get("type") == stay_type]
    return jsonify({"stays": stays, "total": len(stays)})

@core_bp.route("/food", methods=["GET"])
def get_food():
    """Return curated restaurants, cafes, and dining options."""
    data = load_json("pondicherry.json")
    food = data.get("food", [])
    cuisine = request.args.get("cuisine")
    if cuisine:
        food = [f for f in food if cuisine.lower() in [c.lower() for c in f.get("cuisine", [])]]
    return jsonify({"food": food, "total": len(food)})

@core_bp.route("/weather", methods=["GET"])
def get_weather():
    """Proxy Open-Meteo live weather for Pondicherry with a 10-minute in-memory cache."""
    now = time.time()
    if "data" in _WEATHER_CACHE and (now - _WEATHER_CACHE["timestamp"]) < _CACHE_TTL:
        return jsonify(_WEATHER_CACHE["data"])
    
    # Open-Meteo for Pondicherry coordinates (11.9338, 79.8297)
    url = (
        "https://api.open-meteo.com/v1/forecast"
        "?latitude=11.9338&longitude=79.8297"
        "&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m"
        "&hourly=temperature_2m,precipitation_probability,weather_code"
        "&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_probability_max"
        "&timezone=Asia%2FKolkata"
    )
    try:
        resp = requests.get(url, timeout=5)
        if resp.status_code == 200:
            weather_data = resp.json()
            _WEATHER_CACHE["data"] = weather_data
            _WEATHER_CACHE["timestamp"] = now
            return jsonify(weather_data)
        else:
            return jsonify({"error": "Weather service unavailable"}), 502
    except Exception as e:
        # Fallback stale cache if available
        if "data" in _WEATHER_CACHE:
            data = _WEATHER_CACHE["data"].copy()
            data["stale"] = True
            return jsonify(data)
        return jsonify({"error": str(e), "fallback": {
            "current": {"temperature_2m": 29.5, "weather_code": 1, "apparent_temperature": 32.0, "relative_humidity_2m": 75}
        }}), 200

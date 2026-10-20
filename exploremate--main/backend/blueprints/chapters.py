"""
ExploreMate Carbon Chapters Blueprint
Manages low-emission trip verification, ink calculations, daily caps, and mystery chapter unlocks.
"""

from flask import Blueprint, jsonify, request
import json
import sqlite3
import time
from config import BASE_DIR, DATA_DIR, FEATURE_CHAPTERS
from config.emission_factors import EMISSION_FACTORS, INK_RULES

chapters_bp = Blueprint("chapters", __name__)
DB_PATH = BASE_DIR / "chapters.db"

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS ink_ledger (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_session TEXT NOT NULL,
        leg_id TEXT NOT NULL,
        mode TEXT NOT NULL,
        distance_km REAL NOT NULL,
        kg_saved REAL NOT NULL,
        ink_earned REAL NOT NULL,
        timestamp REAL NOT NULL
    );
    """)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS chapter_unlocks (
        chapter_id TEXT PRIMARY KEY,
        unlock_count INTEGER DEFAULT 0
    );
    """)
    conn.commit()
    conn.close()

init_db()

def calculate_leg_ink(mode, distance_km):
    """
    Calculates carbon savings vs baseline auto-rickshaw:
    Baseline = distance_km * auto (0.115 kg/km)
    Actual = distance_km * mode factor
    Savings = max(0, Baseline - Actual)
    """
    mode = mode.lower()
    dist = max(0.0, float(distance_km))
    baseline_factor = EMISSION_FACTORS.get(INK_RULES["baseline_mode"], 0.115)
    actual_factor = EMISSION_FACTORS.get(mode, baseline_factor)
    
    baseline_emissions = dist * baseline_factor
    actual_emissions = dist * actual_factor
    kg_saved = max(0.0, baseline_emissions - actual_emissions)
    
    # Non-motorized modes get a minimum bonus
    if mode in ["walk", "cycle"] and dist > 0.1:
        ink_earned = round(max(kg_saved, INK_RULES["min_walk_cycle_ink_kg"]), 3)
    else:
        ink_earned = round(kg_saved, 3)
        
    return {
        "mode": mode,
        "distance_km": dist,
        "kg_saved": round(kg_saved, 3),
        "ink_earned": ink_earned
    }

@chapters_bp.route("", methods=["GET"])
def get_chapters():
    """Return all serialized chapters, storyteller metadata, and current session ink."""
    if not FEATURE_CHAPTERS:
        return jsonify({"enabled": False, "chapters": []})
        
    filepath = DATA_DIR / "chapters.json"
    chapters = []
    if filepath.exists():
        with open(filepath, "r", encoding="utf-8") as f:
            chapters = json.load(f)
            
    session_id = request.args.get("session_id", "default_session")
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT SUM(ink_earned) as total_ink FROM ink_ledger WHERE user_session = ?", (session_id,))
    row = cursor.fetchone()
    total_ink = row["total_ink"] if row and row["total_ink"] else 0.0
    
    cursor.execute("SELECT chapter_id, unlock_count FROM chapter_unlocks")
    unlocks = {r["chapter_id"]: r["unlock_count"] for r in cursor.fetchall()}
    conn.close()
    
    # Mark unlock status based on ink
    processed = []
    for chap in chapters:
        c = chap.copy()
        c["is_unlocked"] = (c["ink_cost_kg"] == 0.0) or (total_ink >= c["ink_cost_kg"])
        c["community_unlocks"] = unlocks.get(c["id"], 12)
        processed.append(c)
        
    return jsonify({
        "enabled": True,
        "total_ink_kg": round(total_ink, 3),
        "daily_cap_kg": INK_RULES["daily_ink_cap_kg"],
        "chapters": processed
    })

@chapters_bp.route("/verify_leg", methods=["POST"])
def verify_leg():
    """Verify sustainable leg and credit ink to user's ledger."""
    data = request.get_json() or {}
    session_id = data.get("session_id", "default_session")
    leg_id = data.get("leg_id", f"leg_{int(time.time())}")
    mode = data.get("mode", "walk")
    distance_km = float(data.get("distance_km", 1.0))
    avg_speed_kmh = float(data.get("avg_speed_kmh", 4.5))
    
    # Speed validation bounds
    valid = True
    reason = "Leg verified"
    if mode == "walk" and (avg_speed_kmh < 1.0 or avg_speed_kmh > 12.0):
        valid = False
        reason = "Speed outside walking bounds"
    elif mode == "cycle" and (avg_speed_kmh < 4.0 or avg_speed_kmh > 35.0):
        valid = False
        reason = "Speed outside cycling bounds"
        
    if not valid:
        return jsonify({
            "verified": False,
            "message": f"{reason}. No ink credited.",
            "ink_earned": 0.0
        })
        
    calc = calculate_leg_ink(mode, distance_km)
    ink_earned = calc["ink_earned"]
    
    # Daily cap check
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT SUM(ink_earned) as today_ink FROM ink_ledger WHERE user_session = ? AND timestamp > ?", (
        session_id, time.time() - 86400
    ))
    today_row = cursor.fetchone()
    today_ink = today_row["today_ink"] if today_row and today_row["today_ink"] else 0.0
    
    if (today_ink + ink_earned) > INK_RULES["daily_ink_cap_kg"]:
        ink_earned = max(0.0, INK_RULES["daily_ink_cap_kg"] - today_ink)
        
    cursor.execute("""
    INSERT INTO ink_ledger (user_session, leg_id, mode, distance_km, kg_saved, ink_earned, timestamp)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (session_id, leg_id, mode, distance_km, calc["kg_saved"], ink_earned, time.time()))
    conn.commit()
    conn.close()
    
    return jsonify({
        "verified": True,
        "ink_earned": ink_earned,
        "kg_saved": calc["kg_saved"],
        "message": f"Great job! You earned {ink_earned} kg of CO2 ink for travelling sustainably."
    })

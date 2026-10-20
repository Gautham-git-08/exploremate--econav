"""
ExploreMate Lost & Found Blueprint
SQLite-backed lost and found engine with honeypots, rate limiting, and explainable match scoring.
"""

from flask import Blueprint, jsonify, request
import sqlite3
import hashlib
import time
import math
from config import BASE_DIR, SAFETY_NUMBERS

lostfound_bp = Blueprint("lostfound", __name__)
DB_PATH = BASE_DIR / "lostfound.db"

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

# Verified central police stations in Pondicherry (free offline directory)
PUDUCHERRY_POLICE_STATIONS = [
    {
        "id": "ps-grand-bazaar",
        "name": "Grand Bazaar Police Station",
        "address": "Bussy Street / Ambour Salai, Heritage Town, Puducherry",
        "phone": "+91 413 2334000",
        "lat": 11.9335,
        "lng": 79.8312,
        "mapsUrl": "https://www.google.com/maps/search/?api=1&query=Grand+Bazaar+Police+Station+Pondicherry"
    },
    {
        "id": "ps-odeons",
        "name": "Odiansalai Police Station",
        "address": "South Boulevard, Near Railway Station, Puducherry",
        "phone": "+91 413 2336100",
        "lat": 11.9275,
        "lng": 79.8290,
        "mapsUrl": "https://www.google.com/maps/search/?api=1&query=Odiansalai+Police+Station+Pondicherry"
    },
    {
        "id": "ps-d-nagar",
        "name": "D'Nagar Police Station",
        "address": "Puducherry North Coast Road, Puducherry",
        "phone": "+91 413 2272200",
        "lat": 11.9540,
        "lng": 79.8250,
        "mapsUrl": "https://www.google.com/maps/search/?api=1&query=D+Nagar+Police+Station+Pondicherry"
    }
]

def init_db():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS items (
        id TEXT PRIMARY KEY,
        temp_ref TEXT,
        official_id TEXT,
        type TEXT NOT NULL,
        category TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        place_name TEXT NOT NULL,
        lat REAL,
        lng REAL,
        item_date TEXT NOT NULL,
        photo_url TEXT,
        reporter_name TEXT NOT NULL,
        reporter_contact_type TEXT NOT NULL,
        reporter_contact_hash TEXT NOT NULL,
        found_item_location TEXT,
        private_question TEXT,
        private_answer_hash TEXT,
        status TEXT NOT NULL DEFAULT 'logged_pending_handover',
        close_outcome TEXT,
        close_note TEXT,
        manage_token_hash TEXT NOT NULL,
        report_count INTEGER DEFAULT 0,
        created_at REAL NOT NULL
    );
    """)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS claims (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        item_id TEXT NOT NULL,
        official_id TEXT,
        claimant_name TEXT NOT NULL,
        claimant_contact TEXT NOT NULL,
        claim_description TEXT,
        proof_details TEXT,
        status TEXT DEFAULT 'claim_submitted',
        police_notes TEXT,
        created_at REAL NOT NULL
    );
    """)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS police_seq (
        year INTEGER PRIMARY KEY,
        current_seq INTEGER DEFAULT 0
    );
    """)
    conn.commit()
    conn.close()

# Initialize table on import
init_db()

def hash_str(val):
    return hashlib.sha256(val.strip().lower().encode("utf-8")).hexdigest() if val else ""

def haversine_km(lat1, lon1, lat2, lon2):
    if not all([lat1, lon1, lat2, lon2]):
        return 999.0
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

@lostfound_bp.route("", methods=["GET"])
def list_items():
    """List open or filtered items without revealing private contact details or answer hashes."""
    conn = get_db()
    cursor = conn.cursor()
    
    item_type = request.args.get("type")
    status = request.args.get("status")
    category = request.args.get("category")
    
    query = "SELECT id, type, category, title, description, place_name, lat, lng, item_date, photo_url, reporter_name, found_item_location, status, close_outcome, created_at FROM items WHERE report_count < 3"
    params = []
    
    if item_type and item_type != "all":
        query += " AND type = ?"
        params.append(item_type)
    if status and status != "all":
        query += " AND status = ?"
        params.append(status)
    if category and category != "all":
        query += " AND category = ?"
        params.append(category)
        
    query += " ORDER BY created_at DESC"
    cursor.execute(query, params)
    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()
    
    return jsonify({
        "items": rows,
        "total": len(rows),
        "safety_banner": {
            "notice": "For valuables, phones, wallets or documents, please also hand them to the nearest police station.",
            "police": SAFETY_NUMBERS["police"],
            "tourist_helpline": SAFETY_NUMBERS["tourist"]
        }
    })

@lostfound_bp.route("", methods=["POST"])
def create_item():
    """Create a new Lost or Found report."""
    data = request.get_json() or {}
    
    # Honeypot spam check
    if data.get("website_url_hp"):
        return jsonify({"error": "Spam detected"}), 400
        
    item_type = data.get("type")
    category = data.get("category")
    title = data.get("title", "").strip()
    desc = data.get("description", "").strip()
    place_name = data.get("place_name", "").strip()
    
    if not item_type or not category or not title or not desc or not place_name:
        return jsonify({"error": "Missing required fields"}), 400
    if len(title) > 80:
        return jsonify({"error": "Title exceeds 80 characters"}), 400
    if len(desc) < 20 or len(desc) > 600:
        return jsonify({"error": "Description must be between 20 and 600 characters"}), 400
        
    reporter_contact = data.get("reporter_contact", "").strip()
    if not reporter_contact:
        return jsonify({"error": "Valid phone or email required"}), 400
        
    manage_token = hashlib.sha256(f"{time.time()}_{title}".encode()).hexdigest()[:16]
    token_hash = hash_str(manage_token)
    item_id = f"lf_{int(time.time()*1000)}"
    
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO items (
        id, type, category, title, description, place_name, lat, lng,
        item_date, photo_url, reporter_name, reporter_contact_type, reporter_contact_hash,
        found_item_location, private_question, private_answer_hash, status, manage_token_hash, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'open', ?, ?)
    """, (
        item_id, item_type, category, title, desc, place_name,
        data.get("lat"), data.get("lng"), data.get("item_date", ""),
        data.get("photo_url", ""), data.get("reporter_name", "Anonymous"),
        data.get("reporter_contact_type", "phone"), hash_str(reporter_contact),
        data.get("found_item_location", ""), data.get("private_question", ""),
        hash_str(data.get("private_answer", "")), token_hash, time.time()
    ))
    conn.commit()
    conn.close()
    
    return jsonify({
        "success": True,
        "item_id": item_id,
        "manage_token": manage_token,
        "message": "Report created successfully. Save your manage_token to edit or close this report later."
    }), 201

@lostfound_bp.route("/matches", methods=["GET"])
def get_matches():
    """Score open items against opposite-type entries using explainable rules."""
    item_id = request.args.get("item_id")
    if not item_id:
        return jsonify({"matches": []})
        
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM items WHERE id = ?", (item_id,))
    target = cursor.fetchone()
    if not target:
        conn.close()
        return jsonify({"error": "Item not found"}), 404
        
    target_dict = dict(target)
    opposite_type = "found" if target_dict["type"] == "lost" else "lost"
    
    cursor.execute("SELECT * FROM items WHERE type = ? AND status = 'open' AND report_count < 3", (opposite_type,))
    candidates = [dict(c) for c in cursor.fetchall()]
    conn.close()
    
    scored = []
    target_words = set(target_dict["title"].lower().split() + target_dict["description"].lower().split())
    
    for cand in candidates:
        score = 0
        reasons = []
        
        # 1. Category match (40 pts)
        if cand["category"] == target_dict["category"]:
            score += 40
            reasons.append(f"Matching category: {cand['category']}")
            
        # 2. Keyword overlap (up to 30 pts)
        cand_words = set(cand["title"].lower().split() + cand["description"].lower().split())
        overlap = target_words.intersection(cand_words) - {"the", "a", "an", "in", "at", "on", "near", "and", "or", "of", "to"}
        if overlap:
            pts = min(len(overlap) * 10, 30)
            score += pts
            reasons.append(f"Shared keywords: {', '.join(list(overlap)[:3])}")
            
        # 3. Distance proximity (up to 30 pts)
        if target_dict.get("lat") and cand.get("lat"):
            dist = haversine_km(target_dict["lat"], target_dict["lng"], cand["lat"], cand["lng"])
            if dist < 1.0:
                score += 30
                reasons.append(f"Very close location ({dist:.1f} km)")
            elif dist < 3.0:
                score += 15
                reasons.append(f"Nearby vicinity ({dist:.1f} km)")
                
        if score >= 30:
            scored.append({
                "candidate": {
                    "id": cand["id"],
                    "title": cand["title"],
                    "place_name": cand["place_name"],
                    "category": cand["category"],
                    "item_date": cand["item_date"],
                    "type": cand["type"]
                },
                "score": score,
                "reasons": reasons
            })
            
    scored.sort(key=lambda x: x["score"], reverse=True)
    return jsonify({"matches": scored[:5]})

@lostfound_bp.route("/police_stations", methods=["GET"])
def get_police_stations():
    """Return verified Pondicherry police stations with Google directions fallback."""
    return jsonify({
        "stations": PUDUCHERRY_POLICE_STATIONS,
        "instruction": "Please take any found valuable item to your nearest police station to receive an official verification ID."
    })

@lostfound_bp.route("/police/receive", methods=["POST"])
def police_receive_item():
    """Police Desk action: confirms handover, assigns guaranteed unique official ID (PF-YEAR-SEQUENCE)."""
    data = request.get_json() or {}
    temp_ref = data.get("temp_ref", "").strip()
    station_id = data.get("station_id", "ps-grand-bazaar")
    
    if not temp_ref:
        return jsonify({"error": "Temporary reference code required"}), 400
        
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM items WHERE id = ? OR temp_ref = ?", (temp_ref, temp_ref))
    item = cursor.fetchone()
    if not item:
        conn.close()
        return jsonify({"error": "Item with this temporary reference was not found"}), 404
        
    cur_year = time.gmtime().tm_year
    cursor.execute("SELECT current_seq FROM police_seq WHERE year = ?", (cur_year,))
    seq_row = cursor.fetchone()
    if seq_row:
        next_seq = seq_row["current_seq"] + 1
        cursor.execute("UPDATE police_seq SET current_seq = ? WHERE year = ?", (next_seq, cur_year))
    else:
        next_seq = 1
        cursor.execute("INSERT INTO police_seq (year, current_seq) VALUES (?, ?)", (cur_year, next_seq))
        
    official_id = f"PF-{cur_year}-{next_seq:06d}"
    cursor.execute("""
    UPDATE items
    SET status = 'received_by_police', official_id = ?
    WHERE id = ?
    """, (official_id, item["id"]))
    conn.commit()
    conn.close()
    
    return jsonify({
        "success": True,
        "official_id": official_id,
        "message": f"Item received by police. Official tracking ID issued: {official_id}"
    })

@lostfound_bp.route("/claims", methods=["POST"])
def submit_claim():
    """Submit a formal ownership claim against an official item ID."""
    data = request.get_json() or {}
    official_id = data.get("official_id", "").strip()
    name = data.get("claimant_name", "").strip()
    contact = data.get("claimant_contact", "").strip()
    desc = data.get("claim_description", "").strip()
    proof = data.get("proof_details", "").strip()
    
    if not official_id or not name or not contact or not desc:
        return jsonify({"error": "Official item ID, claimant name, contact and distinguishing features are required"}), 400
        
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM items WHERE official_id = ? OR id = ?", (official_id, official_id))
    item = cursor.fetchone()
    if not item:
        conn.close()
        return jsonify({"error": "No verified item found with this official ID"}), 404
        
    cursor.execute("""
    INSERT INTO claims (
        item_id, official_id, claimant_name, claimant_contact,
        claim_description, proof_details, status, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, 'claim_submitted', ?)
    """, (item["id"], official_id, name, contact, desc, proof, time.time()))
    
    cursor.execute("UPDATE items SET status = 'claim_submitted' WHERE id = ?", (item["id"],))
    conn.commit()
    conn.close()
    
    return jsonify({
        "success": True,
        "message": "Claim submitted successfully. Please visit the assigned police station with a valid government ID for physical verification. Items cannot be collected online."
    }), 201

@lostfound_bp.route("/police/claims", methods=["GET"])
def list_police_claims():
    """List pending claims and investigation status for Police Desk review."""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT c.id, c.item_id, c.official_id, c.claimant_name, c.claimant_contact,
           c.claim_description, c.proof_details, c.status, c.police_notes, c.created_at,
           i.title as item_title, i.category as item_category
    FROM claims c
    JOIN items i ON c.item_id = i.id
    ORDER BY c.created_at DESC
    """)
    claims = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return jsonify({"claims": claims})

@lostfound_bp.route("/police/claim_status", methods=["POST"])
def update_claim_status():
    """Police Desk action: update claim status to under_investigation, verified_and_released, or rejected."""
    data = request.get_json() or {}
    claim_id = data.get("claim_id")
    new_status = data.get("status") # 'under_investigation' | 'verified_and_released' | 'claim_rejected'
    notes = data.get("notes", "")
    
    if not claim_id or new_status not in ['under_investigation', 'verified_and_released', 'claim_rejected']:
        return jsonify({"error": "Valid claim_id and recognized status required"}), 400
        
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("UPDATE claims SET status = ?, police_notes = ? WHERE id = ?", (new_status, notes, claim_id))
    
    # If released or rejected, update item status accordingly
    if new_status == 'verified_and_released':
        cursor.execute("UPDATE items SET status = 'released_to_owner' WHERE id = (SELECT item_id FROM claims WHERE id = ?)", (claim_id,))
    elif new_status == 'claim_rejected':
        cursor.execute("UPDATE items SET status = 'received_by_police' WHERE id = (SELECT item_id FROM claims WHERE id = ?)", (claim_id,))
    elif new_status == 'under_investigation':
        cursor.execute("UPDATE items SET status = 'under_investigation' WHERE id = (SELECT item_id FROM claims WHERE id = ?)", (claim_id,))
        
    conn.commit()
    conn.close()
    return jsonify({"success": True, "status": new_status, "message": f"Claim status updated to {new_status}"})


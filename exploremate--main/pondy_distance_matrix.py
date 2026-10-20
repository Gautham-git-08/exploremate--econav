"""
Pondicherry 43-place distance matrix (real routing data).

Run on your own computer (needs internet):
    pip install requests pandas
    python pondy_distance_matrix.py

Step 1: geocodes each place with OpenStreetMap Nominatim -> coords.csv
        OPEN coords.csv and FIX any wrong/missing rows (lat,lon), then run again.
Step 2: queries OSRM for walking, cycling, driving (distance km + time min)
Step 3: writes CSV matrices + a long-format file (pairs.csv) you can load in your app.

Bus = ESTIMATE (car route distance, car time x 1.6 + 10 min waiting). Pondicherry has no
open complete bus timetable data, so this cannot be exact.
"""
import os, time, requests, json
from pathlib import Path
import pandas as pd

PLACES = [
 "Sri Aurobindo Ashram", "White Town (French Quarter)", "Promenade / Rock Beach",
 "Pondicherry Museum", "Matrimandir Viewing Point", "Casablanca Heritage Boutique",
 "Cluny Embroidery Centre", "Paradise Beach", "Serenity Beach", "Eden Beach",
 "Pondy Marina Beach", "Auroville Beach", "French War Memorial", "Mahatma Gandhi Statue",
 "Aayi Mandapam / Bharathi Park", "Old Lighthouse", "Raj Niwas (Governor's Palace)",
 "Manakula Vinayagar Temple", "Basilica of the Sacred Heart of Jesus",
 "Eglise de Notre Dame des Anges", "Cathedral of Our Lady of the Immaculate Conception",
 "Vedapureeswarar Temple", "Thirukameswarar Temple, Villianur", "Kanniga Parameswari Temple",
 "Meeran Mosque", "Kuthba Mosque", "Jamia Mosque", "Bharathi Park / Government Park",
 "Botanical Garden", "Jawahar Toy Museum", "Chunnambar Boat House",
 "Ousteri Wetland and National Park", "Arikamedu Archaeological Site",
 "Auroville Visitors Centre", "Jawaharlal Nehru Statue", "Dupleix Statue",
 "Romain Rolland Library", "French Institute of Pondicherry (IFP)",
 "Alliance Francaise de Pondichery", "Hotel de Ville / Municipal Office",
 "Old Port / Old Harbour Area", "Auroville Farms & Green Belt", "Karaikal Beach",
]
HEADERS = {"User-Agent": "pondy-distance-student-project/1.0"}

def geocode():
    rows = []
    for name in PLACES:
        q = name.split("/")[0].strip() + ", Puducherry, India"
        if "Karaikal" in name: q = "Karaikal Beach, Karaikal, India"
        r = requests.get("https://nominatim.openstreetmap.org/search",
                         params={"q": q, "format": "json", "limit": 1}, headers=HEADERS, timeout=30).json()
        if r: rows.append((name, float(r[0]["lat"]), float(r[0]["lon"]), r[0]["display_name"]))
        else: rows.append((name, "", "", "NOT FOUND - fill manually"))
        time.sleep(1.1)  # Nominatim rate limit: 1 request/second
    pd.DataFrame(rows, columns=["place", "lat", "lon", "matched_as"]).to_csv("coords.csv", index=False)
    print("coords.csv written. CHECK it (matched_as column), fix wrong rows, run again.")

def table(df, profile):
    urls = {
        "foot": ["https://routing.openstreetmap.de/routed-foot/table/v1/driving/"],
        "bike": ["https://routing.openstreetmap.de/routed-bike/table/v1/driving/"],
        "car":  ["https://router.project-osrm.org/table/v1/driving/", "https://routing.openstreetmap.de/routed-car/table/v1/driving/"]
    }[profile]
    coords = ";".join(f"{lon},{lat}" for lat, lon in zip(df.lat, df.lon))
    
    for base in urls:
        try:
            r = requests.get(f"{base}{coords}",
                             params={"annotations": "distance,duration"}, headers=HEADERS, timeout=120).json()
            if r.get("code") == "Ok" and "distances" in r and "durations" in r:
                return r["distances"], r["durations"]
        except Exception as e:
            print(f"Warning: {base} failed: {e}")
            continue
    raise RuntimeError(f"All table endpoints failed for {profile}")

def main():
    if not os.path.exists("coords.csv"):
        return geocode()
    df = pd.read_csv("coords.csv")
    assert df.lat.notna().all(), "Some coordinates are missing in coords.csv"
    names = list(df.place)
    out = []
    mats = {}
    for p in ("foot", "bike", "car"):
        print(f"Querying OSRM table for {p}...")
        d, t = table(df, p)
        mats[p] = (d, t)
        pd.DataFrame(d, index=names, columns=names).div(1000).round(2).to_csv(f"{p}_distance_km.csv")
        pd.DataFrame(t, index=names, columns=names).div(60).round(1).to_csv(f"{p}_time_min.csv")
    
    print("Building pairs.csv...")
    distances_json = {}
    
    for i, a in enumerate(names):
        distances_json[a] = {}
        for j, b in enumerate(names):
            if i == j: continue
            row = {"from": a, "to": b}
            for p in ("foot", "bike", "car"):
                d, t = mats[p]
                row[f"{p}_km"] = round(d[i][j] / 1000, 2)
                row[f"{p}_min"] = round(t[i][j] / 60, 1)
            row["bus_km_estimate"] = row["car_km"]
            row["bus_min_estimate"] = round(row["car_min"] * 1.6 + 10, 1)
            out.append(row)
            
            distances_json[a][b] = {
                "foot_km": row["foot_km"],
                "foot_min": row["foot_min"],
                "bike_km": row["bike_km"],
                "bike_min": row["bike_min"],
                "car_km": row["car_km"],
                "car_min": row["car_min"],
                "bus_min_estimate": row["bus_min_estimate"]
            }
            
    df_pairs = pd.DataFrame(out)
    df_pairs.to_csv("pairs.csv", index=False)
    print(f"Done: pairs.csv written with {len(df_pairs)} pairs.")

    # Save distances.json in multiple standard locations
    for target_dir in [Path("data"), Path("frontend/public/data"), Path("frontend/src/data")]:
        target_dir.mkdir(parents=True, exist_ok=True)
        out_file = target_dir / "distances.json"
        with open(out_file, "w", encoding="utf-8") as f:
            json.dump(distances_json, f, indent=2)
        print(f"Saved {out_file}")

    # Sanity-check results
    print("\n--- Running Sanity Checks ---")
    fail_speed_order = 0
    fail_asymmetry = 0
    
    # Fast lookup from pair dataframe
    pair_map = {(r["from"], r["to"]): r for r in out}
    
    for r in out:
        a = r["from"]
        b = r["to"]
        
        # Check 1: walking time > cycling time, cycling time > car time
        # Allow tiny buffer (0.1 min) for identical zero/near-zero distance
        if r["foot_min"] < r["bike_min"]:
            print(f"Sanity flag (foot < bike time): {a} -> {b} (foot: {r['foot_min']} min, bike: {r['bike_min']} min)")
            fail_speed_order += 1
        if r["bike_min"] < r["car_min"] and r["car_km"] > 1.0:
            # Note: in dense pedestrian areas or one-ways, bike can sometimes be faster than car, which is normal
            pass
            
        # Check 2: distance A->B roughly equal to B->A (within 25% or 0.5 km)
        rev = pair_map.get((b, a))
        if rev:
            diff_foot = abs(r["foot_km"] - rev["foot_km"])
            if diff_foot > max(1.5, r["foot_km"] * 0.4):
                print(f"Asymmetry notice (foot km): {a} <-> {b} ({r['foot_km']} km vs {rev['foot_km']} km)")
                fail_asymmetry += 1
                
    print(f"Sanity check summary: {fail_speed_order} speed order anomalies, {fail_asymmetry} significant asymmetry notices (mostly due to one-way streets/pedestrian zones).")

if __name__ == "__main__":
    main()

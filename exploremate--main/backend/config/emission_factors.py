"""
ExploreMate Carbon Emission Baselines
CO2 Emission Factors in kg CO2 per passenger-kilometer for transportation modes.
Marked: TODO verify against DEFRA emission standards.
"""

# Baseline reference emission factors (kg CO2 per passenger km)
# Verified against national travel published averages (approximate values)
EMISSION_FACTORS = {
    "car": 0.192,         # Car (petrol, one person) - Baseline
    "motorcycle": 0.103,  # Two-wheeler (motorbike)
    "two_wheeler": 0.103, # Alias
    "bus": 0.105,         # Bus transit
    "train": 0.041,       # Train / Metro
    "cycle": 0.0,         # Cycling (human powered)
    "walk": 0.0           # Walking (zero direct emissions)
}

# Chapter ink rules
INK_RULES = {
    "baseline_mode": "car",            # Baseline mode for comparison
    "min_walk_cycle_ink_kg": 0.05,     # Guaranteed minimum reward for non-motorized leg
    "daily_ink_cap_kg": 5.0,           # Maximum ink earnable per day
    "short_distance_threshold_km": 2.0 # Legs under 2km prompt active walk/cycle recommendation
}

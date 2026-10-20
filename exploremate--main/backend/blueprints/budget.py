"""
ExploreMate Budget Blueprint
Provides server-side budget computation, validation, pace projection, and CSV export logic.
"""

from flask import Blueprint, jsonify, request, Response
import io
import csv

budget_bp = Blueprint("budget", __name__)

def compute_budget_status(user_budget, total_estimated_cost):
    """
    Computes exact utilization and status thresholds:
    - healthy: utilization <= 85%
    - warning: 85% < utilization <= 100%
    - exceeded: utilization > 100%
    """
    user_budget = float(user_budget) if user_budget else 0.0
    total_cost = float(total_estimated_cost) if total_estimated_cost else 0.0
    remaining = user_budget - total_cost
    
    if user_budget <= 0:
        utilization = 100.0 if total_cost > 0 else 0.0
        status = "exceeded" if total_cost > 0 else "healthy"
        status_message = "No budget allocated" if total_cost > 0 else "Budget set to zero"
        badge_color = "red" if total_cost > 0 else "green"
    else:
        utilization = round((total_cost / user_budget) * 100, 1)
        if utilization > 100:
            status = "exceeded"
            status_message = f"Budget exceeded by {round(abs(remaining), 2)}"
            badge_color = "red"
        elif utilization > 85:
            status = "warning"
            status_message = f"Warning: {utilization}% of budget allocated"
            badge_color = "amber"
        else:
            status = "healthy"
            status_message = f"On track: {utilization}% allocated"
            badge_color = "emerald"
            
    return {
        "userBudget": user_budget,
        "totalEstimatedCost": total_cost,
        "remainingBudget": remaining,
        "utilizationPercent": utilization,
        "status": status,
        "statusMessage": status_message,
        "badgeColor": badge_color
    }

@budget_bp.route("/calculate", methods=["POST"])
def calculate_budget():
    """
    Calculates full budget breakdown from client inputs:
    total budget, days, travelers, style, stay preference, and sliders.
    """
    data = request.get_json() or {}
    total_budget = float(data.get("totalBudget", 0))
    days = max(1, int(data.get("days", 1)))
    travelers = max(1, int(data.get("travelers", 1)))
    
    # Sliders must total 100%
    sliders = data.get("sliders", {
        "activities": 25,
        "food": 30,
        "stay": 30,
        "transport": 10,
        "buffer": 5
    })
    
    total_slider = sum(sliders.values())
    if total_slider == 0:
        normalized_sliders = {k: 20 for k in sliders}
    else:
        normalized_sliders = {k: (v / total_slider) * 100 for k, v in sliders.items()}
        
    breakdown = {
        "activities": round((total_budget * (normalized_sliders.get("activities", 0) / 100)), 2),
        "food": round((total_budget * (normalized_sliders.get("food", 0) / 100)), 2),
        "stay": round((total_budget * (normalized_sliders.get("stay", 0) / 100)), 2),
        "transport": round((total_budget * (normalized_sliders.get("transport", 0) / 100)), 2),
        "buffer": round((total_budget * (normalized_sliders.get("buffer", 0) / 100)), 2)
    }
    
    total_estimated = sum(breakdown.values())
    status_dict = compute_budget_status(total_budget, total_estimated)
    
    per_day = round(total_budget / days, 2)
    per_person = round(total_budget / travelers, 2)
    per_person_day = round(total_budget / (days * travelers), 2)
    
    return jsonify({
        **status_dict,
        "breakdown": breakdown,
        "stay": breakdown["stay"],
        "perDay": per_day,
        "perPerson": per_person,
        "perPersonDay": per_person_day
    })

@budget_bp.route("/export_csv", methods=["POST"])
def export_csv():
    """Export expenses log as a downloadable CSV."""
    data = request.get_json() or {}
    expenses = data.get("expenses", [])
    
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["ID", "Category", "Amount (INR)", "Note", "Time", "Stop"])
    for exp in expenses:
        writer.writerow([
            exp.get("id", ""),
            exp.get("category", ""),
            exp.get("amount", ""),
            exp.get("note", ""),
            exp.get("time", ""),
            exp.get("stop", "")
        ])
        
    output.seek(0)
    return Response(
        output.getvalue(),
        mimetype="text/csv",
        headers={"Content-Disposition": "attachment;filename=exploremate_expenses.csv"}
    )

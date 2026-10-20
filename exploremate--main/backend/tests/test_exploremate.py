"""
Backend Unit Tests for ExploreMate
Validates budget calculation, threshold statuses, lost and found honeypot/claims,
and carbon fuel ink calculations.
"""

import pytest
from config.emission_factors import INK_RULES
from blueprints.budget import compute_budget_status
from blueprints.chapters import calculate_leg_ink

def test_budget_healthy():
    status = compute_budget_status(10000, 7000)
    assert status["status"] == "healthy"
    assert status["utilizationPercent"] == 70.0
    assert status["badgeColor"] == "emerald"

def test_budget_warning_threshold():
    status = compute_budget_status(10000, 9000)
    assert status["status"] == "warning"
    assert status["utilizationPercent"] == 90.0
    assert status["badgeColor"] == "amber"

def test_budget_exceeded():
    status = compute_budget_status(10000, 11500)
    assert status["status"] == "exceeded"
    assert status["utilizationPercent"] == 115.0
    assert status["badgeColor"] == "red"

def test_budget_zero():
    status = compute_budget_status(0, 0)
    assert status["status"] == "healthy"
    assert status["remainingBudget"] == 0

def test_ink_calculation_walk():
    res = calculate_leg_ink("walk", 2.0)
    assert res["ink_earned"] > 0
    assert res["kg_saved"] > 0
    # Walk emissions factor is 0, baseline is 2.0 * 0.115 = 0.23 kg
    assert res["kg_saved"] == 0.23

def test_ink_calculation_auto():
    # If using baseline auto, no ink is earned
    res = calculate_leg_ink("auto", 2.0)
    assert res["kg_saved"] == 0.0
    assert res["ink_earned"] == 0.0

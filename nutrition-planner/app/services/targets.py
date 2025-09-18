from __future__ import annotations
from typing import Dict, Any, Literal
import math

# Petits helpers
def mifflin_st_jeor_bmr(gender: Literal["male","female"], weight_kg: float, height_cm: int, age_years: int) -> float:
    if gender == "male":
        return 10*weight_kg + 6.25*height_cm - 5*age_years + 5
    else:
        return 10*weight_kg + 6.25*height_cm - 5*age_years - 161

def age_from_birthdate(iso: str) -> int:
    from datetime import date
    y, m, d = [int(x) for x in iso.split("-")]
    today = date.today()
    age = today.year - y - ((today.month, today.day) < (m, d))
    return max(age, 0)

def activity_factor(job_activity: str, sport_frequency: str) -> float:
    # Base sur job
    base = {
        "sedentary": 1.2,
        "light": 1.35,
        "moderate": 1.5,
        "heavy": 1.7,
    }.get(job_activity, 1.3)

    # Boost selon sport
    sf = sport_frequency.strip()
    if sf in ("none","0","0-0"):
        bonus = 0.0
    elif sf in ("1-2", "1_2_per_week"):
        bonus = 0.1
    elif sf in ("3-4", "3_5_per_week"):
        bonus = 0.2
    elif sf in ("5-6","6_plus_per_week"):
        bonus = 0.3
    else:
        bonus = 0.15
    return base + bonus

def kcal_adjust_for_goal(kcal: float, goal: str) -> float:
    goal = (goal or "").lower()
    if goal in ("fat_loss","perte de poids","cut"):
        return kcal * 0.85   # ~ -15%
    if goal in ("muscle_gain","prise de muscle","bulk"):
        return kcal * 1.1    # ~ +10%
    # maintain / performance / health…
    return kcal

def macro_split(gender: str, goal: str) -> dict:
    # Retourne ratios par défaut si besoin
    g = (goal or "").lower()
    if g in ("fat_loss",):
        # plus de protés
        return {"protein_pct": 0.30, "fat_pct": 0.30, "carbs_pct": 0.40}
    if g in ("muscle_gain",):
        return {"protein_pct": 0.25, "fat_pct": 0.25, "carbs_pct": 0.50}
    if g in ("performance",):
        return {"protein_pct": 0.20, "fat_pct": 0.25, "carbs_pct": 0.55}
    # maintain / health
    return {"protein_pct": 0.20, "fat_pct": 0.30, "carbs_pct": 0.50}

def clamp(v: float, lo: float, hi: float) -> float:
    return max(lo, min(v, hi))

def compute_targets_for_profile(p: Dict[str, Any]) -> Dict[str, Any]:
    # 1) Dépense
    age = age_from_birthdate(p["birth_date"])
    bmr = mifflin_st_jeor_bmr(p["gender"], float(p["weight_kg"]), int(p["height_cm"]), age)
    af = activity_factor(p.get("job_activity","sedentary"), p.get("sport_frequency","none"))
    tdee = bmr * af
    kcal = round(kcal_adjust_for_goal(tdee, p.get("goal","maintain")))

    # 2) Macros (g)
    split = macro_split(p.get("gender","male"), p.get("goal","maintain"))
    protein_g = round((kcal * split["protein_pct"]) / 4)    # 4 kcal/g
    fat_g     = round((kcal * split["fat_pct"]) / 9)        # 9 kcal/g
    carbs_g   = round((kcal * split["carbs_pct"]) / 4)      # 4 kcal/g

    # Fibre, sucres, sodium — valeurs guides génériques
    fiber_g   = 30
    sugars_g  = 50
    sodium_mg = 2300

    # 3) Micro (ANSES/EFSA approximatives adultes)
    micro = dict(
        calcium_mg_per_day=1000,
        iron_mg_per_day=8 if p["gender"] == "male" else 18,     # simple: F > M
        magnesium_mg_per_day=380 if p["gender"] == "male" else 320,
        zinc_mg_per_day=11 if p["gender"] == "male" else 8,
        potassium_mg_per_day=3500,
        iodine_ug_per_day=150,
        selenium_ug_per_day=55,
        vitamin_a_ug_rae_per_day=900 if p["gender"] == "male" else 700,
        vitamin_d_ug_per_day=15,
        vitamin_e_mg_per_day=15,
        vitamin_c_mg_per_day=90 if p["gender"] == "male" else 75,
        vitamin_b1_mg_per_day=1.2 if p["gender"] == "male" else 1.1,
        vitamin_b2_mg_per_day=1.3 if p["gender"] == "male" else 1.1,
        vitamin_b3_mg_per_day=16 if p["gender"] == "male" else 14,
        vitamin_b6_mg_per_day=1.3,
        vitamin_b9_ug_dfe_per_day=400,
        vitamin_b12_ug_per_day=2.4,
    )

    # 4) Oméga-3 (approches génériques)
    omega3 = dict(
        omega3_ala_g_per_day=1.6 if p["gender"] == "male" else 1.1,
        omega3_dha_g_per_day=0.5,
        omega3_epa_g_per_day=0.5,
    )

    return {
        "profile_id": p["profile_id"],
        "kcal_per_day": kcal,
        "protein_g_per_day": protein_g,
        "carbs_g_per_day": carbs_g,
        "fat_g_per_day": fat_g,
        "fiber_g_per_day": fiber_g,
        "sugars_g_per_day": sugars_g,
        "sodium_mg_per_day": sodium_mg,
        **micro,
        **omega3,
    }

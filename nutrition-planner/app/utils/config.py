from __future__ import annotations
import os, yaml

_CFG = None

def load_optimizer_config() -> dict:
    global _CFG
    if _CFG is not None:
        return _CFG
    path = os.getenv("OPTIMIZER_CONFIG", "config/optimizer.yaml")
    with open(path, "r", encoding="utf-8") as f:
        data = yaml.safe_load(f) or {}
    # garde-fous (valeurs par défaut si manquantes)
    data.setdefault("uniqueness", {"mains":{"per_day":False, "per_week":True}, "desserts":{"per_day":True, "per_week":False}})
    data.setdefault("slots", {"order":["breakfast","lunch","dinner"],
                              "ratios":{"breakfast":0.25,"lunch":0.35,"dinner":0.40},
                              "intra_ratios":{"breakfast":{"main":1.0},"lunch":{"main":0.8,"dessert":0.2},"dinner":{"main":0.8,"dessert":0.2}}})
    data.setdefault("bands_day", {"kcal":{"lo":0.90,"hi":1.10},"protein":{"lo":0.80,"hi":1.15},"carbs":{"lo":0.80,"hi":1.40},"fat":{"lo":0.80,"hi":1.00}})
    data.setdefault("scaling", {"min_servings":0.6,"max_servings":2.5,"step":0.5,"normalize_energy_tolerance":0.05,"band_tolerance":0.10})
    data.setdefault("defaults", {"kcal_per_day":2000,"protein_g_per_day":90,"carbs_g_per_day":250,"fat_g_per_day":70,"omega3_epa_dha_g_per_week":1.8})
    data.setdefault("optimizer", {"max_swaps_per_day":6,"swap_pool_top_k":12,"candidate_sample_max":20,"lean_tie_breaker":1e-4,"prefer_low_fat_for_boosts":True,"enforce_fat_first":True})
    _CFG = data
    return _CFG

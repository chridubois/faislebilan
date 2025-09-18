from __future__ import annotations
from typing import Dict, Any, Iterable, Tuple, Optional, Union, List

from app.utils.loader import load_ingredients
from app.models import Nutrients  # <- utilise le modèle Nutrients central
# NB: on n'importe pas Recipe ici volontairement pour rester agnostique (dict ou pydantic)

# --- mapping: champs du modèle Nutrients -> clés présentes dans ingredients.json ---
NUT_MAP: Dict[str, str] = {
    "energy_kcal":      "energy_kcal",
    "protein_g":        "protein",
    "carbs_g":          "carbs",
    "fat_g":            "fat_total",
    "fiber_g":          "fiber",
    "sugars_g":         "sugars",
    "sodium_mg":        "sodium",

    "calcium_mg":       "calcium",
    "iron_mg":          "iron",
    "magnesium_mg":     "magnesium",
    "zinc_mg":          "zinc",
    "potassium_mg":     "potassium",
    "iodine_ug":        "iodine",
    "selenium_ug":      "selenium",

    "vitamin_a_ug_rae": "vitamin_A_RAE",
    "vitamin_d_ug":     "vitamin_D",
    "vitamin_e_mg":     "vitamin_E",
    "vitamin_c_mg":     "vitamin_C",
    "vitamin_b1_mg":    "thiamin_B1",
    "vitamin_b2_mg":    "riboflavin_B2",
    "vitamin_b3_mg":    "niacin_B3",
    "vitamin_b6_mg":    "vitamin_B6",
    "vitamin_b9_ug_dfe":"folate_B9",
    "vitamin_b12_ug":   "cobalamin_B12",

    "omega3_ala_g":     "omega3_ALA",
    "omega3_epa_g":     "omega3_EPA",
    "omega3_dha_g":     "omega3_DHA",
}

# --- unité cible (dans le modèle Nutrients) ---
UNIT_TARGETS: Dict[str, str] = {
    "energy_kcal":      "kcal",
    "protein_g":        "g",
    "carbs_g":          "g",
    "fat_g":            "g",
    "fiber_g":          "g",
    "sugars_g":         "g",
    "sodium_mg":        "mg",

    "calcium_mg":       "mg",
    "iron_mg":          "mg",
    "magnesium_mg":     "mg",
    "zinc_mg":          "mg",
    "potassium_mg":     "mg",
    "iodine_ug":        "µg",
    "selenium_ug":      "µg",

    "vitamin_a_ug_rae": "µg",
    "vitamin_d_ug":     "µg",
    "vitamin_e_mg":     "mg",
    "vitamin_c_mg":     "mg",
    "vitamin_b1_mg":    "mg",
    "vitamin_b2_mg":    "mg",
    "vitamin_b3_mg":    "mg",
    "vitamin_b6_mg":    "mg",
    "vitamin_b9_ug_dfe":"µg",
    "vitamin_b12_ug":   "µg",

    "omega3_ala_g":     "g",
    "omega3_epa_g":     "g",
    "omega3_dha_g":     "g",
}

# L’ordre ici correspond au modèle Nutrients (utile pour initialiser / sommer)
NUT_KEYS: Iterable[str] = NUT_MAP.keys()

# ---------- helpers unités & bases ----------

def _canonical_unit(u: Optional[str]) -> str:
    if not u:
        return ""
    u = u.strip().lower().replace("μ", "µ")
    if u in {"mcg", "ug"}:
        return "µg"
    if u in {"kcal", "cal"}:
        return "kcal" if u == "kcal" else "cal"
    if u in {"gram", "grams"}:
        return "g"
    if u in {"milligram", "milligrams"}:
        return "mg"
    if u in {"microgram", "micrograms"}:
        return "µg"
    return u

def normalize_value(val: float | int | None, unit: Optional[str], target_unit: str) -> float:
    if val is None:
        return 0.0
    v = float(val)
    u = _canonical_unit(unit)
    t = _canonical_unit(target_unit)

    if u == t or u == "" or t == "":
        return v

    # masse
    if u == "g" and t == "mg":
        return v * 1000.0
    if u == "mg" and t == "g":
        return v / 1000.0
    if u == "g" and t == "µg":
        return v * 1_000_000.0
    if u == "µg" and t == "g":
        return v / 1_000_000.0
    if u == "mg" and t == "µg":
        return v * 1000.0
    if u == "µg" and t == "mg":
        return v / 1000.0

    # énergie
    if u == "cal" and t == "kcal":
        return v / 1000.0
    if u == "kcal" and t == "cal":
        return v * 1000.0

    return v

def _extract_value_unit_per(node: Any) -> Tuple[float, str, str]:
    """
    Retourne (value, unit, per) à partir d'un nœud nutriment.
    node:
      - float/int  -> valeur brute, unit/per inconnus (on considérera per=100g)
      - dict       -> { value, unit?, per? } ; per ∈ {"100g","1g","portion","unit"}
                      on tolère variantes (per_100g, g, …)
    """
    if isinstance(node, (int, float)):
        return float(node), "", "100g"

    if isinstance(node, dict):
        val = node.get("value", 0.0)
        unit = _canonical_unit(node.get("unit"))
        per = (node.get("per") or "100g").strip().lower()
        if per in {"100 g", "100gr", "100-gram", "per_100g"}:
            per = "100g"
        elif per in {"1 g", "per_g", "g"}:
            per = "1g"
        elif per in {"portion", "serving", "per_serving"}:
            per = "portion"
        elif per in {"unit", "piece"}:
            per = "unit"
        return float(val), unit, per

    return 0.0, "", "100g"

# ---------- chargement & index ----------

def _idx_ing() -> Dict[str, dict]:
    """Index {ingredient_id -> ingredient_dict} depuis ingredients.json"""
    data = load_ingredients() or []
    return {i["id"]: i for i in data if isinstance(i, dict) and "id" in i}

def _get_state_record(ing: dict, state: Optional[str]) -> Optional[dict]:
    """
    Retourne le bloc d'état demandé, avec fallbacks:
    - exact match si présent (ex: "froid", "fondu")
    - 'cru' sinon
    - 'cuit' sinon
    - premier état
    """
    states = ing.get("states") or {}
    if not states:
        return None
    if state and state in states:
        return states[state]
    if "cru" in states:
        return states["cru"]
    if "cuit" in states:
        return states["cuit"]
    return next(iter(states.values()), None)

# ---------- extraction nutriments (per 100g, dans l’unité cible du modèle) ----------

def _nut_value_per_100g(ing: dict, ing_state: dict, model_key: str) -> float:
    if not ing_state:
        return 0.0
    nutrients = ing_state.get("nutrients") or {}
    ing_key = NUT_MAP.get(model_key)
    if not ing_key:
        return 0.0

    node = nutrients.get(ing_key)
    val, unit, per = _extract_value_unit_per(node)

    # conversion d’unité vers l’unité cible du modèle
    target_unit = UNIT_TARGETS.get(model_key, "")
    val_conv = normalize_value(val, unit, target_unit)

    # convertir la base vers "par 100g"
    if per == "100g":
        return val_conv
    if per == "1g":
        return val_conv * 100.0
    if per in {"portion", "unit"}:
        portion_weight_g = None
        if isinstance(node, dict):
            portion_weight_g = node.get("portion_weight_g")
        if portion_weight_g is None:
            portion_weight_g = ing_state.get("portion_weight_g")
        if portion_weight_g is None:
            portion_weight_g = ing.get("portion_weight_g")
        try:
            pw = float(portion_weight_g) if portion_weight_g is not None else 0.0
        except Exception:
            pw = 0.0
        return val_conv * (100.0 / pw) if pw > 0 else val_conv

    return val_conv

# ---------- itérateurs recette ----------

def _recipe_iter_ingredients(recipe: Union[dict, Any]):
    """
    Itère (ingredient_id, quantity_g, state) quel que soit Recipe pydantic ou dict brut.
    - Pydantic: recipe.ingredients[*].ingredient_id / quantity_g / state?
    - Dict:     recipe["ingredients"][*]
    """
    if hasattr(recipe, "ingredients"):  # pydantic
        for ri in recipe.ingredients:
            yield getattr(ri, "ingredient_id", None), getattr(ri, "quantity_g", 0), getattr(ri, "state", None)
    else:  # dict
        for ri in (recipe.get("ingredients") or []):
            yield ri.get("ingredient_id"), ri.get("quantity_g", 0), ri.get("state")

def _recipe_portions(recipe: Union[dict, Any]) -> float:
    p = getattr(recipe, "portions", None) if hasattr(recipe, "portions") else (recipe.get("portions") if isinstance(recipe, dict) else None)
    try:
        p = float(p)
    except Exception:
        p = 1.0
    return p if p and p > 0 else 1.0

# ---------- API: recette ----------

def recipe_totals(recipe: Union[dict, Any], ing_idx: Optional[Dict[str, dict]] = None, scale: float = 1.0) -> Nutrients:
    """
    Totaux pour la recette entière (avant division par portions).
    """
    if ing_idx is None:
        ing_idx = _idx_ing()

    out = {k: 0.0 for k in NUT_KEYS}

    for ing_id, qty_g, state in _recipe_iter_ingredients(recipe):
        if not ing_id:
            continue
        qty = float(qty_g or 0.0) * float(scale or 1.0)
        if qty <= 0:
            continue

        ing = ing_idx.get(ing_id)
        if not ing:
            continue
        ing_state = _get_state_record(ing, (str(state or "").lower() or None))
        if not ing_state:
            continue

        factor = qty / 100.0
        for model_key in NUT_KEYS:
            per100 = _nut_value_per_100g(ing, ing_state, model_key)
            out[model_key] += per100 * factor

    return Nutrients(**out)

def recipe_per_portion(recipe: Union[dict, Any], scale: float = 1.0) -> Nutrients:
    """
    Nutriments **par portion**.
    """
    totals = recipe_totals(recipe, scale=scale)
    p = _recipe_portions(recipe)
    return Nutrients(
        energy_kcal = totals.energy_kcal / p,
        protein_g   = totals.protein_g   / p,
        carbs_g     = totals.carbs_g     / p,
        fat_g       = totals.fat_g       / p,
        fiber_g     = totals.fiber_g     / p,
        sugars_g    = totals.sugars_g    / p,
        sodium_mg   = totals.sodium_mg   / p,

        calcium_mg      = getattr(totals, "calcium_mg", 0.0)      / p,
        iron_mg         = getattr(totals, "iron_mg", 0.0)         / p,
        magnesium_mg    = getattr(totals, "magnesium_mg", 0.0)    / p,
        zinc_mg         = getattr(totals, "zinc_mg", 0.0)         / p,
        potassium_mg    = getattr(totals, "potassium_mg", 0.0)    / p,
        iodine_ug       = getattr(totals, "iodine_ug", 0.0)       / p,
        selenium_ug     = getattr(totals, "selenium_ug", 0.0)     / p,

        vitamin_a_ug_rae= getattr(totals, "vitamin_a_ug_rae", 0.0)/ p,
        vitamin_d_ug    = getattr(totals, "vitamin_d_ug", 0.0)    / p,
        vitamin_e_mg    = getattr(totals, "vitamin_e_mg", 0.0)    / p,
        vitamin_c_mg    = getattr(totals, "vitamin_c_mg", 0.0)    / p,
        vitamin_b1_mg   = getattr(totals, "vitamin_b1_mg", 0.0)   / p,
        vitamin_b2_mg   = getattr(totals, "vitamin_b2_mg", 0.0)   / p,
        vitamin_b3_mg   = getattr(totals, "vitamin_b3_mg", 0.0)   / p,
        vitamin_b6_mg   = getattr(totals, "vitamin_b6_mg", 0.0)   / p,
        vitamin_b9_ug_dfe=getattr(totals,"vitamin_b9_ug_dfe",0.0) / p,
        vitamin_b12_ug  = getattr(totals, "vitamin_b12_ug", 0.0)  / p,

        omega3_ala_g    = getattr(totals, "omega3_ala_g", 0.0)    / p,
        omega3_epa_g    = getattr(totals, "omega3_epa_g", 0.0)    / p,
        omega3_dha_g    = getattr(totals, "omega3_dha_g", 0.0)    / p,
    )

# ---------- API: repas/jour/semaine (multi-items plat+dessert) ----------

def meal_totals(meal: Union[dict, Any], recipes_idx: Dict[str, Union[dict, Any]]) -> Nutrients:
    """
    Somme les nutriments de tous les items d’un Meal (supporte legacy: recipe_id au niveau meal).
    """
    parts: List[Nutrients] = []

    # Nouveau format: items[]
    items = getattr(meal, "items", None) if hasattr(meal, "items") else meal.get("items") if isinstance(meal, dict) else None
    if items:
        for it in items:
            rid = getattr(it, "recipe_id", None) if hasattr(it, "recipe_id") else it.get("recipe_id")
            servings = getattr(it, "servings", None) if hasattr(it, "servings") else it.get("servings")
            r = recipes_idx.get(rid)
            if not r:
                continue
            n = recipe_per_portion(r, 1.0)
            parts.append(n if servings in (None, 1.0) else n.scaled(servings))
        return Nutrients.sum(parts)

    # Legacy: un seul recipe_id/servings au niveau Meal
    rid = getattr(meal, "recipe_id", None) if hasattr(meal, "recipe_id") else (meal.get("recipe_id") if isinstance(meal, dict) else None)
    servings = getattr(meal, "servings", None) if hasattr(meal, "servings") else (meal.get("servings") if isinstance(meal, dict) else None)
    r = recipes_idx.get(rid)
    if not r:
        return Nutrients()
    n = recipe_per_portion(r, 1.0)
    return n if servings in (None, 1.0) else n.scaled(servings)

def day_totals(day: Union[dict, Any], recipes_idx: Dict[str, Union[dict, Any]]) -> Nutrients:
    meals = getattr(day, "meals", None) if hasattr(day, "meals") else day.get("meals") if isinstance(day, dict) else None
    parts: List[Nutrients] = []
    for m in (meals or []):
        parts.append(meal_totals(m, recipes_idx))
    return Nutrients.sum(parts)

def week_totals(week: Union[dict, Any], recipes_idx: Dict[str, Union[dict, Any]]) -> Nutrients:
    days = getattr(week, "days", None) if hasattr(week, "days") else week.get("days") if isinstance(week, dict) else None
    parts: List[Nutrients] = []
    for d in (days or []):
        parts.append(day_totals(d, recipes_idx))
    return Nutrients.sum(parts)

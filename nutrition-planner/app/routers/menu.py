# app/routers/menu.py
from __future__ import annotations

from fastapi import APIRouter, Body, HTTPException, Query

# ⬇️ IMPORTANT : n'utiliser que les SCHEMAS
from app.schemas.menu import (
    GenerateRequest,
    WeekPlan,
    EvaluateResponse,
    SwapRequest,
    MoveRequest,
    Recipe,
)

from app.services.generator import (
    generate_week,
    swap_recipe,
    move_meal,
    evaluate_plan,
    PLANS,
    evaluate_nutrients,
    diagnose_plan_gaps,
)
from app.utils.loader import load_recipes, load_profiles
from app.services.nutrition import recipe_per_portion
from app.services.targets import compute_targets_for_profile

router = APIRouter()

# ---- helpers ----
def coerce_plan(plan_obj) -> WeekPlan:
    if isinstance(plan_obj, WeekPlan):
        try:
            return WeekPlan.model_validate(plan_obj.model_dump())
        except Exception:
            pass
    if hasattr(plan_obj, "model_dump"):
        return WeekPlan.model_validate(plan_obj.model_dump())
    return WeekPlan.model_validate(plan_obj)

def ensure_current_plan(plan_id: str) -> WeekPlan:
    if plan_id not in PLANS:
        raise HTTPException(status_code=404, detail="Plan not found")
    coerced = coerce_plan(PLANS[plan_id])
    PLANS[plan_id] = coerced
    return coerced

@router.post("/reset")
def reset_plans():
    """
    Utilitaire : vide la mémoire des plans (utile après un reload de modèles).
    """
    PLANS.clear()
    return {"ok": True, "count": 0}

# ---- routes ----

@router.post("/generate", response_model=WeekPlan)
def generate(
    req: GenerateRequest = Body(default=GenerateRequest()),
    profile_id: str = Query(..., description="Profil à utiliser pour calculer les targets."),
):
    # 1) récupérer le profil et calculer toutes les cibles
    profiles = load_profiles() or []
    prof = next((p for p in profiles if p.get("profile_id") == profile_id), None)
    if not prof:
        raise HTTPException(status_code=404, detail="Profile not found")

    targets = compute_targets_for_profile(prof)
    kcal = int(round(float(targets["kcal_per_day"])))
    fat_limit = float(targets["fat_g_per_day"])

    # 2) générer en forçant les targets du profil (pas de fallback générique)
    plan = generate_week(
        kcal_target_per_day=kcal,
        allow_repeat=req.allow_repeat,
        fat_limit_g_per_day=fat_limit,
        targets_override=targets,   # <= toutes les cibles du profil
    )
    coerced = coerce_plan(plan)
    PLANS[coerced.plan_id] = coerced
    return coerced

@router.get("/generate", response_model=WeekPlan)
def generate_default():
    plan = generate_week()
    coerced = coerce_plan(plan)
    PLANS[coerced.plan_id] = coerced
    return coerced

@router.post("/{plan_id}/swap", response_model=WeekPlan)
def swap(plan_id: str, body: SwapRequest):
    ensure_current_plan(plan_id)
    updated = swap_recipe(plan_id, body)
    return ensure_current_plan(updated.plan_id)

@router.post("/{plan_id}/move", response_model=WeekPlan)
def move(plan_id: str, body: MoveRequest):
    ensure_current_plan(plan_id)
    updated = move_meal(plan_id, body)
    return ensure_current_plan(updated.plan_id)

@router.get("/{plan_id}/evaluate", response_model=EvaluateResponse)
def evaluate(plan_id: str):
    plan = ensure_current_plan(plan_id)
    day_kcal, weekly, compliance = evaluate_plan(plan)
    return EvaluateResponse(
        day_kcal=day_kcal,
        week_totals={
            "energy_kcal": weekly["kcal"],
            "protein_g": weekly["protein"],
            "carbs_g": weekly["carbs"],
            "fat_g": weekly["fat"],
            "fiber_g": weekly["fiber"],
            "sugars_g": weekly["sugars"],
            "sodium_mg": weekly["sodium"],
        },
        compliance=compliance,
    )

@router.get("/{plan_id}/macros")
def plan_macros(plan_id: str):
    """
    Retourne pour chaque jour :
      - les macros par slot (breakfast/lunch/dinner),
      - les totaux journaliers.

    Compatible :
      - Nouveau format : meal.items[] (plat + dessert)
      - Legacy : meal.recipe_id + servings/scale au niveau du Meal
    """
    plan = ensure_current_plan(plan_id)
    rec_idx = {r["id"]: Recipe.model_validate(r) for r in load_recipes()}

    def _add_slot(acc, per, factor: float):
        acc["kcal"]     += round(per.energy_kcal * factor)
        acc["protein_g"]+= round(per.protein_g   * factor)
        acc["carbs_g"]  += round(per.carbs_g     * factor)
        acc["fat_g"]    += round(per.fat_g       * factor)

    days = []
    totals = []

    for d in plan.days:
        day_slots = {"breakfast": None, "lunch": None, "dinner": None}
        acc = dict(kcal=0, protein_g=0, carbs_g=0, fat_g=0)

        for m in d.meals:
            slot_acc = dict(kcal=0, protein_g=0, carbs_g=0, fat_g=0)

            if getattr(m, "items", None):
                # Nouveau format : sommer tous les items (plat + dessert)
                for it in m.items:
                    r = rec_idx.get(it.recipe_id)
                    if not r:
                        continue
                    per = recipe_per_portion(r, 1.0)
                    factor = (getattr(it, "servings", None) or getattr(it, "scale", 1.0) or 1.0)
                    _add_slot(slot_acc, per, factor)
            else:
                # Legacy : un seul recipe_id au niveau Meal
                r = rec_idx.get(m.recipe_id)
                if r:
                    per = recipe_per_portion(r, 1.0)
                    factor = (getattr(m, "servings", None) or getattr(m, "scale", 1.0) or 1.0)
                    _add_slot(slot_acc, per, factor)

            day_slots[m.slot] = {k: int(v) for k, v in slot_acc.items()}
            for k in acc.keys():
                acc[k] += slot_acc[k]

        days.append(day_slots)
        totals.append({k: int(v) for k, v in acc.items()})

    return {"days": days, "totals": totals}

@router.get("/{plan_id}/nutrients")
def nutrients(plan_id: str):
    """
    Totaux hebdo pour macro+micro + cibles hebdo + deltas.
    Ne casse pas /evaluate existant.
    """
    plan = ensure_current_plan(plan_id)
    return evaluate_nutrients(plan)

@router.get("/{plan_id}", response_model=WeekPlan)
def get_plan(plan_id: str):
    """
    Retourne le plan complet (structure brute) pour inspection côté front/tests.
    """
    return ensure_current_plan(plan_id)

@router.get("/{plan_id}/diagnostics/gaps")
def gaps(plan_id: str):
    plan = ensure_current_plan(plan_id)
    return diagnose_plan_gaps(plan)

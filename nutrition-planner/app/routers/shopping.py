# app/routers/shopping.py
from __future__ import annotations

from fastapi import APIRouter, HTTPException
from collections import defaultdict
from typing import Dict, Any

from app.services.generator import PLANS
from app.utils.loader import load_recipes, load_ingredients

router = APIRouter()

@router.get("/{plan_id}")
def shopping_list(plan_id: str):
    if plan_id not in PLANS:
        raise HTTPException(status_code=404, detail="Plan not found")

    plan = PLANS[plan_id]
    rec_idx: Dict[str, Dict[str, Any]] = {r["id"]: r for r in (load_recipes() or [])}

    agg = defaultdict(float)  # ingredient_id -> grams

    for d in plan.days:
        for m in d.meals:
            # ----- Nouveau format : items[] (plat + dessert) -----
            if getattr(m, "items", None):
                for it in m.items:
                    rid = getattr(it, "recipe_id", None)
                    if not rid or rid not in rec_idx:
                        continue
                    r = rec_idx[rid]

                    # nombre de portions à consommer (compat scale)
                    servings = (getattr(it, "servings", None) or getattr(it, "scale", 1.0) or 1.0)
                    portions_recipe = (r.get("portions", 1) or 1)
                    consumption_factor = float(servings) / float(portions_recipe or 1)

                    for ri in (r.get("ingredients") or []):
                        ing_id = ri.get("ingredient_id")
                        qty_g = float(ri.get("quantity_g", 0.0))
                        if ing_id and qty_g > 0:
                            agg[ing_id] += qty_g * consumption_factor

            # ----- Legacy : un seul recipe_id au niveau Meal -----
            else:
                rid = getattr(m, "recipe_id", None)
                if not rid or rid not in rec_idx:
                    continue
                r = rec_idx[rid]

                servings = (getattr(m, "servings", None) or getattr(m, "scale", 1.0) or 1.0)
                portions_recipe = (r.get("portions", 1) or 1)
                consumption_factor = float(servings) / float(portions_recipe or 1)

                for ri in (r.get("ingredients") or []):
                    ing_id = ri.get("ingredient_id")
                    qty_g = float(ri.get("quantity_g", 0.0))
                    if ing_id and qty_g > 0:
                        agg[ing_id] += qty_g * consumption_factor

    ing_idx = {i["id"]: i for i in (load_ingredients() or [])}
    out = [
        {
            "ingredient_id": iid,
            "name": ing_idx.get(iid, {}).get("name", iid),
            "quantity_g": round(q, 1),
        }
        for iid, q in agg.items()
    ]
    out.sort(key=lambda x: x["name"])
    return {"plan_id": plan_id, "items": out}

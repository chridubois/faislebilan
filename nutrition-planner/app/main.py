# app/main.py
from fastapi import FastAPI, Depends, HTTPException, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional, TypedDict, Dict, List
from dotenv import load_dotenv
import os, json, re, unicodedata, ipaddress, socket, requests
from requests import HTTPError as RequestsHTTPError
from urllib.parse import quote as urlquote

from app.deps.auth import get_user_token
from app.services.supabase import select as sb_select
from app.services.supabase import post_rpc, select, insert, upsert
from app.services.supabase import patch as sb_patch, delete as sb_delete
from app.schemas.recipe_in import RecipeCreate, IngredientCreate

# Routers
from app.routers import menu, recipes, profiles, shopping
from app.routers import ingredients as ingredients_router
from app.routers import ciqual as ciqual_router

# --- Boot checks & app ---
load_dotenv()
if not os.getenv("SUPABASE_SERVICE_ROLE_KEY"):
    raise RuntimeError("SUPABASE_SERVICE_ROLE_KEY manquante (vérifie ton .env et le dossier courant)")

print("SERVICE KEY present?", bool(os.getenv("SUPABASE_SERVICE_ROLE_KEY")))
print("URL:", os.getenv("SUPABASE_URL"))

app = FastAPI(title="Nutrition Planner MVP")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # à resserrer en prod
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Units config ---
_ALLOWED_UNITS = {
    "g": "g",
    "gram": "g", "grams": "g",
    "kg": "kg", "kilogram": "kg", "kilograms": "kg",
    "ml": "ml", "milliliter": "ml", "millilitre": "ml",
    "cl": "cl", "centiliter": "cl", "centilitre": "cl",
    "l": "l", "liter": "l", "litre": "l",
    "u": "unité", "unite": "unité", "unité": "unité",
    "unit": "unité", "piece": "unité", "pièce": "unité", "pcs": "unité",
}

# Clés standardisées (unités dans les noms de clé)
NUT_KEYS_ORDER = [
    "energy_kcal",
    "protein_g", "carbs_g", "sugars_g", "fat_g", "sat_fat_g", "fiber_g",
    "omega3_g", "epa_g", "dha_g",          # ← ajouté ici
    "salt_g", "sodium_mg",
    "vit_a_ug", "vit_c_mg", "vit_d_ug", "vit_e_mg", "vit_k_ug",
    "vit_b1_mg", "vit_b2_mg", "vit_b3_mg", "vit_b5_mg", "vit_b6_mg", "vit_b9_ug", "vit_b12_ug",
    "ca_mg", "mg_mg", "p_mg", "k_mg", "fe_mg", "zn_mg", "cu_mg", "mn_mg", "se_ug", "i_ug",
    "cholesterol_mg",                      # ← déjà ajouté
]

NUT_SORT_ALLOWLIST = {
    "kcal": "energy_kcal_ps",
    "protein_g": "protein_g_ps",
    "carbs_g": "carbs_g_ps",
    "sugars_g": "sugars_g_ps",
    "fat_g": "fat_g_ps",
    "sat_fat_g": "sat_fat_g_ps",
    "fiber_g": "fiber_g_ps",
    "omega3_g": "omega3_g_ps",
    "fe_mg": "fe_mg_ps",
    "k_mg": "k_mg_ps",
}

_URL_RE = re.compile(r'^https?://[^\s]+$', re.I)

# -------- API namespace --------
api = APIRouter(prefix="/api")

# -------- Routers “module” --------
api.include_router(menu.router,      prefix="/menu",      tags=["menu"])
api.include_router(recipes.router,   prefix="/recipes",   tags=["recipes"])
api.include_router(profiles.router,                   tags=["profiles"])
api.include_router(shopping.router,  prefix="/shopping",  tags=["shopping"])
api.include_router(ingredients_router.router,         tags=["ingredients"])
api.include_router(ciqual_router.router,              tags=["ciqual"])

# -------- Utilities --------
API_DEBUG = os.getenv("API_DEBUG") == "1"

def dbg(label: str, obj):
    if API_DEBUG:
        try:
            print(f"[API DEBUG] {label}: {json.dumps(obj, ensure_ascii=False, default=str)}")
        except Exception:
            print(f"[API DEBUG] {label}: {obj}")

def _compact(d: dict) -> dict:
    return {k: v for k, v in d.items() if v is not None}

def _ensure_list(v):
    if v is None: return []
    if isinstance(v, list): return v
    if isinstance(v, str):  # accepte "lunch,dinner"
        return [s.strip() for s in v.split(",") if s.strip()]
    return [v]

def _to_int(v, default=None):
    if v is None: return default
    if isinstance(v, bool): return int(v)
    if isinstance(v, int): return v
    if isinstance(v, float): return int(round(v))
    if isinstance(v, str):
        s = v.strip().replace(",", ".")
        if s == "": return default
        try:
            if "." in s:
                return int(round(float(s)))
            return int(s)
        except ValueError:
            raise HTTPException(400, detail=f"Invalid integer for field: {v!r}")
    raise HTTPException(400, detail=f"Invalid integer type: {type(v).__name__}")

def _to_float(v, default=None):
    if v is None: return default
    if isinstance(v, (int, float)): return float(v)
    if isinstance(v, str):
        s = v.strip().replace(",", ".")
        if s == "": return default
        try:
            return float(s)
        except ValueError:
            raise HTTPException(400, detail=f"Invalid number: {v!r}")
    raise HTTPException(400, detail=f"Invalid number type: {type(v).__name__}")

_uuid_regex = re.compile(
    r"^[0-9a-fA-F]{8}\-[0-9a-fA-F]{4}\-[1-5][0-9a-fA-F]{3}\-[89abAB][0-9a-fA-F]{3}\-[0-9a-fA-F]{12}$"
)
def _looks_like_uuid(x: str) -> bool:
    return isinstance(x, str) and bool(_uuid_regex.match(x))

def _strip_accents(s: str) -> str:
    return "".join(c for c in unicodedata.normalize("NFD", s) if unicodedata.category(c) != "Mn")

def _normalize_unit_label(unit_raw: Optional[str]) -> str:
    """Normalise une unité utilisateur vers {g,ml,l,cl,kg,unité}."""
    if not unit_raw:
        return "g"
    k = _strip_accents(unit_raw).strip().lower()
    k = k.replace(".", "")  # ex: "l." -> "l"
    if k in _ALLOWED_UNITS:
        return _ALLOWED_UNITS[k]
    k2 = k.rstrip("s")  # grams -> gram, units -> unit
    if k2 in _ALLOWED_UNITS:
        return _ALLOWED_UNITS[k2]
    raise HTTPException(400, f"Unité invalide: {unit_raw!r}. Unités acceptées: g, ml, l, cl, kg, unité.")

def _get_field(it, name, default=None):
    if isinstance(it, dict):
        return it.get(name, default)
    return getattr(it, name, default)

def _is_public_host(host: str) -> bool:
    # évite de “valider” des URLs vers 127.0.0.1, 10.x, etc. (SSRF)
    try:
        ip = ipaddress.ip_address(socket.gethostbyname(host))
        return not (ip.is_private or ip.is_loopback or ip.is_link_local)
    except Exception:
        return True  # si on ne résout pas, on laisse HEAD décider

def validate_image_url(url: str, *, require_image_mime: bool = True, max_bytes: int = 10_000_000) -> str:
    if not url or not _URL_RE.match(url.strip()):
        raise HTTPException(400, "image must be an http(s) URL")
    url = url.strip()
    try:
        host = re.split(r'://', url, 1)[1].split('/')[0]
        if not _is_public_host(host):
            raise HTTPException(400, "image URL host not allowed")
    except Exception:
        pass
    try:
        r = requests.head(url, timeout=5, allow_redirects=True)
        # fallback si HEAD pas supporté
        if r.status_code >= 400 or not r.headers:
            r = requests.get(url, stream=True, timeout=7)
        ct = (r.headers.get("Content-Type") or "").lower()
        if require_image_mime and not ct.startswith("image/"):
            raise HTTPException(400, f"image URL content-type not image/* (got {ct or 'unknown'})")
        cl = r.headers.get("Content-Length")
        if cl and cl.isdigit() and int(cl) > max_bytes:
            raise HTTPException(400, "image too large")
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(400, "unable to validate image URL")
    return url

def _get_any(it, names: list[str], default=None):
    for n in names:
        v = _get_field(it, n, None)
        if v is not None:
            return v
    return default

def _extract_qty_unit(it) -> tuple[float, str]:
    qty_raw = _get_any(it, ["quantity", "quantity_g", "qty", "amount", "value", "grams"], None)
    if qty_raw is None:
        raise HTTPException(400, "Chaque item doit fournir une quantité (champ 'quantity').")
    qty = _to_float(qty_raw, default=None)
    if qty is None:
        raise HTTPException(400, f"Quantité invalide: {qty_raw!r}")

    unit_raw = _get_any(it, ["unit", "uom", "units"], None)
    unit = _normalize_unit_label(unit_raw)
    return qty, unit

def _build_recipe_payload(body):
    course_type = getattr(body, "course_type", None) or "main"
    meal_types  = _ensure_list(getattr(body, "meal_types", None))
    description = getattr(body, "description", None) or ""
    raw_img = getattr(body, "image", None)
    image = validate_image_url(raw_img) if raw_img else None
    payload = _compact({
        "name": body.name,
        "description": description,
        "course_type": course_type,
        "meal_types": meal_types,
        "servings": _to_int(getattr(body, "servings", None), default=1),
        "time_min": _to_int(getattr(body, "time_min", None), default=None),
        "dish_family": getattr(body, "dish_family", None),
        "cuisine": getattr(body, "cuisine", None),
        "image": image,
    })
    dbg("recipe_insert_payload", payload)
    return payload

# --- Ingredient helpers -------------------------------------------------------
def _resolve_ingredient_from_ciqual(ciqual_code: str, token) -> str:
    code = ciqual_code.strip().lower()
    ps = f"?select=id&ciqual_code=eq.{urlquote(code)}&limit=1"

    rows = select("staging.ingredients", ps, user_jwt=token, force_service=False)
    if rows:
        return rows[0]["id"]

    ps2 = f"?select=name_fr&ciqual_code=eq.{urlquote(code)}&limit=1"
    ciq = select("ciqual_foods", ps2, user_jwt=token, force_service=False)
    name = (ciq[0]["name_fr"] if ciq else None) or f"CIQUAL {code}"

    new_row = _compact({
        "name": name,
        "category": "ciqual",
        "labels": [],
        "allergens": [],
        "ciqual_code": code,
    })

    created = upsert(
        "staging.ingredients",
        [new_row],
        user_jwt=token,
        on_conflict="ciqual_code",
        returning="representation",
        force_service=True
    )[0]
    return created["id"]

def _resolve_ingredient_uuid_or_ciqual(it, token) -> str | None:
    given = _get_any(it, ["ingredient_id"], None)
    if isinstance(given, str) and _looks_like_uuid(given):
        return given

    ciqual_code = _get_any(it, ["ciqual_code", "ingredient_ciqual_code"], None)
    if isinstance(ciqual_code, str) and ciqual_code.strip():
        return _resolve_ingredient_from_ciqual(ciqual_code, token)

    new = _get_any(it, ["ingredient_new"], None)
    if new:
        name = _get_field(new, "name", "").strip()
        if not name:
            return None
        row = _compact({
            "name": name,
            "category": _get_field(new, "category", None),
            "labels": _get_field(new, "labels", None),
            "allergens": _get_field(new, "allergens", None),
            "ciqual_code": (_get_field(new, "ciqual_code", "") or "").strip().lower() or None,
        })
        if row.get("ciqual_code"):
            created = upsert(
                "staging.ingredients", [row],
                user_jwt=token, on_conflict="ciqual_code",
                returning="representation", force_service=True
            )[0]
        else:
            created = insert("staging.ingredients", [row], user_jwt=token, force_service=True)[0]
        return created["id"]

    return None

def _prepare_items_rows(items, token):
    rows = []
    for idx, it in enumerate(items or []):
        ing_uuid = _resolve_ingredient_uuid_or_ciqual(it, token)
        if not ing_uuid:
            small = {
                "ingredient_id": _get_field(it, "ingredient_id", None),
                "ciqual_code": _get_field(it, "ciqual_code", None),
                "ingredient_new": _get_field(it, "ingredient_new", None),
            }
            raise HTTPException(400, f"Item #{idx+1}: ingrédient introuvable. Payload partiel: {small}")
        qty, unit = _extract_qty_unit(it)
        rows.append({"ingredient_id": ing_uuid, "quantity": qty, "unit": unit})
    return rows

def _fetch_ciqual_for_ids(ids: List[str], token) -> Dict[str, Optional[str]]:
    """Retourne {ingredient_id: ciqual_code|None} en batch, avec la bonne syntaxe PostgREST."""
    clean = [x for x in (ids or []) if isinstance(x, str) and _looks_like_uuid(x)]
    if not clean:
        return {}
    ids_list = ",".join(urlquote(x) for x in clean)  # id=in.(uuid1,uuid2)
    ps = f"?select=id,ciqual_code&id=in.({ids_list})"
    rows = select("staging.ingredients", ps, user_jwt=token, force_service=True)
    out: Dict[str, Optional[str]] = {}
    for r in rows:
        cc = (r.get("ciqual_code") or "").strip().lower() or None
        out[r["id"]] = cc
    return out

# --- NUTRITION ENGINE ---------------------------------------------------------
def _unit_to_grams(q: float, unit: str | None) -> float | None:
    """Convertit quantité + unité en grammes. Hypothèse 1 ml ~= 1 g pour les liquides.
    'unité' -> inconnu (None)."""
    u = (unit or "").strip().lower()
    if u in ("g", ""): return float(q)
    if u == "kg": return float(q) * 1000.0
    if u == "mg": return float(q) / 1000.0
    if u == "ml": return float(q) * 1.0
    if u == "cl": return float(q) * 10.0
    if u in ("l", "lt"): return float(q) * 1000.0
    if u in ("unite", "unité", "piece", "pièce", "pcs"): return None
    return None

def _sum_vectors(vecs: list[dict]) -> dict:
    out = {}
    for v in vecs:
        for k, val in (v or {}).items():
            try:
                out[k] = float(out.get(k, 0.0)) + float(val or 0.0)
            except Exception:
                pass
    return out

def _scale_vector_per100(vec: dict, grams: float) -> dict:
    if not vec or grams is None:
        return {}
    factor = grams / 100.0
    return {k: float(v) * factor for k, v in vec.items() if isinstance(v, (int, float))}

# --- CIQUAL VECTOR: 2 chemins possibles (RPC ou vue plate) -------------------
def _ciqual_vector_by_rpc(ciqual_code: str, token) -> dict | None:
    try:
        v = post_rpc("ciqual_vector", {"code": ciqual_code}, user_jwt=token)
        if isinstance(v, dict) and v:
            if API_DEBUG: print("[CIQUAL] RPC hit:", ciqual_code)
            return v
    except Exception as e:
        if API_DEBUG: print("[CIQUAL] RPC miss:", ciqual_code, repr(e))
    return None

def _ciqual_vector_from_flat_table(ciqual_code: str, token) -> dict | None:
    ps = f"?ciqual_code=eq.{urlquote(ciqual_code)}&limit=1"
    try:
        rows = select("ciqual_nutrients_flat", ps, user_jwt=token, force_service=False)
        if rows:
            row = rows[0]
            # on garde toutes les colonnes numériques
            return {k: float(v) for k, v in row.items() if isinstance(v, (int, float))}
    except Exception:
        pass
    return None

def _get_ciqual_vector(ciqual_code: str, token) -> dict:
    code = (ciqual_code or "").strip().lower()
    if not code:
        return {}
    return (
        _ciqual_vector_by_rpc(code, token)
        or _ciqual_vector_from_flat_table(code, token)
        or {}
    )

# -------- Endpoints --------

@api.get("/recipes/catalog")
def recipe_catalog(
    sort: str | None = None,
    order: str = "desc",
    course: str | None = None,
    meal: str | None = None,
    max_time: int | None = None,
    limit: int = 300,
    token: Optional[str] = Depends(get_user_token),
):
    col = NUT_SORT_ALLOWLIST.get((sort or "").lower())
    order_dir = "asc" if order == "asc" else "desc"

    # On part de la vue plate "recipes_catalog" pour faciliter le tri
    ps = f"?select=*&limit={limit}"
    if col:
        ps += f"&order={col}.{order_dir}.nullslast"
    if course:
        ps += f"&course_type=eq.{urlquote(course)}"
    if max_time is not None:
        ps += f"&time_min=lte.{max_time}"

    rows = select("staging.recipes_catalog", ps, user_jwt=token, force_service=False)
    if meal:  # filtrage array côté Python
        rows = [r for r in rows if meal in (r.get("meal_types") or [])]
    return rows

@api.get("/ciqual/search")
def ciqual_search(q: str, token: Optional[str] = Depends(get_user_token)):
    try:
        return post_rpc("search_ciqual", {"q": q}, user_jwt=token, force_service=False)
    except Exception:
        ps = f"?select=ciqual_code,name_fr,grp_name_fr,subgrp_name_fr&name_fr=ilike.*{q}*&limit=20"
        return select("ciqual_foods", ps, user_jwt=token, force_service=False)

@api.get("/ingredients")
def list_ingredients(token: Optional[str] = Depends(get_user_token)):
    ps = "?select=id,name,category,labels,allergens,ciqual_code,created_at&order=name.asc"
    return select("staging.ingredients", ps, user_jwt=token, force_service=False)

@api.get("/recipes")
def list_recipes(token: Optional[str] = Depends(get_user_token)):
    ps = "?select=id,name,course_type,meal_types,servings,image,dish_family,cuisine,time_min,created_at" \
         "&order=created_at.desc"
    return select("staging.recipes", ps, user_jwt=token, force_service=False)

@api.get("/recipes/{recipe_id}")
def get_recipe(recipe_id: str, token: Optional[str] = Depends(get_user_token)):
    ps = f"?select=id,name,description,course_type,meal_types,servings,image,dish_family,cuisine,time_min,created_at" \
         f"&id=eq.{recipe_id}&limit=1"
    rows = select("staging.recipes", ps, user_jwt=token, force_service=False)
    if not rows:
        raise HTTPException(404, "not_found")
    return rows[0]

@api.get("/recipes/{recipe_id}/items")
def list_recipe_items(recipe_id: str, token: Optional[str] = Depends(get_user_token)):
    ps = (
        "?select=ingredient_id,quantity,unit,"
        "ingredient:ingredients(name,ciqual_code)"
        f"&recipe_id=eq.{recipe_id}"
        "&order=ingredient_id.asc"
    )
    rows = select("staging.recipe_ingredients", ps, user_jwt=token, force_service=True)
    return [
        {
            "recipe_id": recipe_id,
            "ingredient_id": r["ingredient_id"],
            "ingredient_name": (r.get("ingredient") or {}).get("name"),
            "ciqual_code": (r.get("ingredient") or {}).get("ciqual_code"),
            "quantity": r["quantity"],
            "unit": r["unit"],
        }
        for r in rows
    ]

@api.post("/ingredients")
def create_ingredient(body: IngredientCreate, token: Optional[str] = Depends(get_user_token)):
    row = _compact({
        "name": body.name,
        "category": body.category,
        "labels": body.labels,
        "allergens": body.allergens,
        "ciqual_code": (body.ciqual_code.strip().lower() if body.ciqual_code else None),
    })

    try:
        data = upsert(
            "staging.ingredients",
            [row],
            user_jwt=token,
            on_conflict="ciqual_code",
            returning="representation",
            force_service=True
        )
        return data[0]

    except RequestsHTTPError as e:
        txt = getattr(e.response, "text", str(e))
        if "23505" in txt and row.get("ciqual_code"):
            ps = f"?select=*&ciqual_code=eq.{urlquote(row['ciqual_code'])}&limit=1"
            existing = select("staging.ingredients", ps, user_jwt=token, force_service=True)
            if existing:
                return existing[0]
        raise HTTPException(status_code=400, detail=txt)

@api.patch("/recipes/{recipe_id}/image-url")
def set_recipe_image_url(recipe_id: str, body: dict, token: Optional[str] = Depends(get_user_token)):
    url = validate_image_url((body.get("image") or "").strip())
    try:
        data = upsert("staging.recipes", [{"id": recipe_id, "image": url}],
                      user_jwt=token, on_conflict="id", returning="representation", force_service=True)
        return data[0]
    except RequestsHTTPError as e:
        raise HTTPException(status_code=400, detail=getattr(e.response, "text", str(e)))

@api.post("/recipes")
def create_recipe(body: RecipeCreate, token: Optional[str] = Depends(get_user_token)):
    try:
        items_rows = _prepare_items_rows(body.items or [], token)
    except RequestsHTTPError as e:
        raise HTTPException(status_code=400, detail=getattr(e.response, "text", str(e)))

    try:
        rec = insert(
            "staging.recipes",
            [_build_recipe_payload(body)],
            user_jwt=token,
            force_service=True
        )[0]
    except RequestsHTTPError as e:
        raise HTTPException(status_code=400, detail=getattr(e.response, "text", str(e)))

    recipe_id = rec["id"]
    dbg("recipe_created_id", recipe_id)

    if items_rows:
        for r in items_rows:
            r["recipe_id"] = recipe_id
        dbg("recipe_items_bulk_insert", items_rows)
        try:
            insert(
                "staging.recipe_ingredients",
                items_rows,
                user_jwt=token,
                returning="minimal",
                force_service=True
            )
        except RequestsHTTPError as e:
            raise HTTPException(status_code=400, detail=getattr(e.response, "text", str(e)))

    return rec

# ==== UPDATE RECIPE (PATCH) ================================================

@api.patch("/recipes/{recipe_id}")
def patch_recipe(recipe_id: str, body: dict, token: Optional[str] = Depends(get_user_token)):
    # on ne laisse passer que les champs autorisés
    allowed = {
        "name", "description", "image",
        "course_type", "meal_types", "servings",
        "time_min", "dish_family", "cuisine",
    }
    payload = {k: v for k, v in (body or {}).items() if k in allowed}
    if not payload:
        return {"updated": 0}

    try:
        rows = sb_patch(
            "staging.recipes",
            payload,
            params=f"?id=eq.{urlquote(recipe_id)}",
            user_jwt=token,
            returning="representation",
            force_service=True,
        )
        if not rows:
            raise HTTPException(404, "not_found")
        return rows[0]
    except RequestsHTTPError as e:
        raise HTTPException(status_code=400, detail=getattr(e.response, "text", str(e)))


@api.put("/recipes/{recipe_id}/items")
def replace_recipe_items(recipe_id: str, body: dict, token: Optional[str] = Depends(get_user_token)):
    items = (body or {}).get("items") or []
    if not isinstance(items, list):
        raise HTTPException(400, "items must be a list")

    # 1) prépare / résout les ingrédients + qty/unit (comme au create)
    try:
        rows = _prepare_items_rows(items, token)
    except RequestsHTTPError as e:
        raise HTTPException(status_code=400, detail=getattr(e.response, "text", str(e)))

    # 2) supprime l’existant pour cette recette
    try:
        sb_delete("staging.recipe_ingredients", f"?recipe_id=eq.{urlquote(recipe_id)}", user_jwt=token, force_service=True)
    except RequestsHTTPError as e:
        raise HTTPException(status_code=400, detail=getattr(e.response, "text", str(e)))

    # 3) réinsère les nouveaux items
    for r in rows:
        r["recipe_id"] = recipe_id

    if rows:
        try:
            insert("staging.recipe_ingredients", rows, user_jwt=token, returning="minimal", force_service=True)
        except RequestsHTTPError as e:
            raise HTTPException(status_code=400, detail=getattr(e.response, "text", str(e)))

    return {"ok": True, "count": len(rows)}

# ==== REPLACE ITEMS =========================================================

@api.post("/recipes/{recipe_id}/items:replace")
def replace_recipe_items(recipe_id: str, body: dict, token: Optional[str] = Depends(get_user_token)):
    """
    Remplace la liste des items d'une recette.
    Body attendu: { items: [{ ingredient_id? | ciqual_code? | ingredient_new?, quantity, unit }, ...] }
    """
    items = body.get("items") or []
    if not isinstance(items, list):
        raise HTTPException(400, "items must be a list")

    # 1) préparer/résoudre tous les items (création d’ingrédient si nécessaire)
    try:
        rows = _prepare_items_rows(items, token)  # -> [{ingredient_id, quantity, unit}]
    except RequestsHTTPError as e:
        raise HTTPException(status_code=400, detail=getattr(e.response, "text", str(e)))

    # 2) delete + insert (remplacement simple)
    try:
        # supprime les anciens
        from app.services.supabase import delete as sb_delete  # si pas importé en haut
        sb_delete("staging.recipe_ingredients", f"?recipe_id=eq.{urlquote(recipe_id)}", user_jwt=token, force_service=True)

        # insère les nouveaux
        for r in rows:
            r["recipe_id"] = recipe_id
        insert("staging.recipe_ingredients", rows, user_jwt=token, returning="minimal", force_service=True)
        return {"ok": True, "count": len(rows)}
    except RequestsHTTPError as e:
        raise HTTPException(status_code=400, detail=getattr(e.response, "text", str(e)))


@api.get("/ciqual/vector")
def ciqual_vector_endpoint(code: str, token: Optional[str] = Depends(get_user_token)):
    vec = _get_ciqual_vector(code, token)
    if not vec:
        raise HTTPException(404, "ciqual_vector_not_found")
    return {"code": code, "per_100g": vec, "keys": list(vec.keys())}

class _NutItem(TypedDict, total=False):
    ingredient_id: str
    ciqual_code: str
    quantity: float
    unit: str

@api.post("/nutrition/compute")
def nutrition_compute(body: dict, token: Optional[str] = Depends(get_user_token)):
    """Calcule la nutrition pour une liste d'items {ingredient_id? | ciqual_code?, quantity, unit}."""
    items = body.get("items") or []
    servings = max(1, int(body.get("servings") or 1))
    if not isinstance(items, list) or not items:
        raise HTTPException(400, "items_required")

    # Pré-résolution ingredient_id -> ciqual_code (batch)
    ids = sorted({str(it.get("ingredient_id")) for it in items if _looks_like_uuid(str(it.get("ingredient_id")))})
    id2code = _fetch_ciqual_for_ids(ids, token)

    per_item = []
    totals: Dict[str, float] = {}
    missing = []

    for idx, it in enumerate(items):
        qty = it.get("quantity", 0)
        unit = _normalize_unit_label(it.get("unit"))
        grams = _unit_to_grams(qty, unit)

        ciq = (it.get("ciqual_code") or id2code.get(str(it.get("ingredient_id") or ""), "") or "").strip().lower()

        if not ciq or grams is None or grams <= 0:
            missing.append(idx)
            per_item.append({"index": idx, "grams": grams, "ciqual_code": ciq or None, "vector": {}, "missing": True})
            continue

        vec100 = _get_ciqual_vector(ciq, token)
        vec = _scale_vector_per100(vec100, grams)
        per_item.append({"index": idx, "grams": grams, "ciqual_code": ciq, "vector": vec, "missing": False})
        for k, v in vec.items():
            totals[k] = totals.get(k, 0.0) + float(v)

    per_serving = {k: v/servings for k, v in totals.items()} if servings > 1 else totals
    # Tri d'affichage (facultatif)
    # sorted_totals = {k: totals.get(k, 0.0) for k in NUT_KEYS_ORDER if k in totals}  # si tu veux ordonner

    return {"totals": totals, "per_serving": per_serving, "per_item": per_item, "missing": missing}

@api.get("/recipes/{recipe_id}/nutrition")
def get_recipe_nutrition(recipe_id: str, token: Optional[str] = Depends(get_user_token)):
    """
    Calcule la nutrition d'une recette en tenant compte des PORTIONS.
    Lit les items + le nombre de portions, puis appelle nutrition_compute(items, servings).
    """
    # 0) Récupère le nombre de portions de la recette
    try:
        ps_rec = f"?select=servings&id=eq.{urlquote(recipe_id)}&limit=1"
        rec_rows = select("staging.recipes", ps_rec, user_jwt=token, force_service=False)
    except RequestsHTTPError as e:
        raise HTTPException(status_code=400, detail=getattr(e.response, "text", str(e)))
    if not rec_rows:
        raise HTTPException(404, "recipe_not_found")
    servings = int(rec_rows[0].get("servings") or 1)
    if servings < 1:
        servings = 1

    # 1) Lire les items de la recette
    try:
        ps_items = f"?select=ingredient_id,quantity,unit&recipe_id=eq.{urlquote(recipe_id)}"
        items = select("staging.recipe_ingredients", ps_items, user_jwt=token, force_service=True)
    except RequestsHTTPError as e:
        raise HTTPException(status_code=400, detail=getattr(e.response, "text", str(e)))

    if not items:
        return {"totals": {}, "per_item": [], "missing": [], "per_serving": {}, "servings": servings}

    # 2) Récupérer les métadonnées des ingrédients (nom + ciqual_code)
    ids = sorted({it.get("ingredient_id") for it in items if it.get("ingredient_id")})
    id2meta: dict[str, dict] = {}
    if ids:
        ids_list = ",".join(urlquote(x) for x in ids)  # pas d'encodage des parenthèses
        ps_ing = f"?select=id,name,ciqual_code&id=in.({ids_list})"
        rows = select("staging.ingredients", ps_ing, user_jwt=token, force_service=True)
        for r in rows:
            id2meta[r["id"]] = {
                "name": r.get("name"),
                "ciqual_code": (r.get("ciqual_code") or "").strip().lower() or None,
            }

    # 3) Construire le payload pour le compute
    req_items = []
    index_map: list[Optional[str]] = []
    for it in items:
        iid = it.get("ingredient_id")
        meta = id2meta.get(iid, {})
        req_items.append({
            "ingredient_id": iid,
            "ciqual_code": meta.get("ciqual_code"),
            "quantity": it.get("quantity") or 0,
            "unit": it.get("unit") or "g",
        })
        index_map.append(iid)

    # 4) Calculer la nutrition en passant les PORTIONS
    try:
        res = nutrition_compute({"items": req_items, "servings": servings}, token)
    except RequestsHTTPError as e:
        raise HTTPException(status_code=400, detail=getattr(e.response, "text", str(e)))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    # 5) Réinjecter les labels (nom / ingredient_id) dans per_item
    for p in res.get("per_item", []):
        try:
            idx = p["index"]
            iid = index_map[idx]
            p["ingredient_id"] = iid
            p["name"] = id2meta.get(iid or "", {}).get("name")
        except Exception:
            pass

    # on renvoie aussi servings pour info
    res["servings"] = servings
    return res


# Monte /api
app.include_router(api)

@app.get("/health")
def health():
    return {"ok": True}

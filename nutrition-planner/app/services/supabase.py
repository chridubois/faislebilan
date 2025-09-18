# app/services/supabase.py
from __future__ import annotations
import os, json, requests
from typing import Optional, List, Dict, Any
from dotenv import load_dotenv, find_dotenv

# -- env ----------------------------------------------------------------------
load_dotenv(find_dotenv())

import re

DB_SCHEMA = os.getenv("DB_SCHEMA", "public")

# Table alias (pour renommages entre staging et public)
# >>> adapte selon tes tables "publiques" existantes <<<
TABLE_ALIASES = {
    "staging.recipes": "public.recipes",
    "staging.recipe_ingredients": "public.recipe_ingredients",  # renommage
    "staging.ingredients": "public.ingredients",
    # "staging.recipes_catalog": "public.recipes_catalog",
}

def _resolve_resource(name: str) -> str:
    """
    Normalise un 'resource' Supabase REST (table chemin REST).
    - Applique TABLE_ALIASES si match exact
    - Sinon remplace le préfixe 'staging.' par DB_SCHEMA + '.'
    - Sinon retourne le nom tel quel
    """
    if not name:
        return name
    # alias exact d'abord
    if name in TABLE_ALIASES:
        return TABLE_ALIASES[name]
    # replace staging.<x> -> <DB_SCHEMA>.<x>
    name = re.sub(r"^staging\.", f"{DB_SCHEMA}.", name)
    return name

SUPABASE_URL  = (os.getenv("SUPABASE_URL") or "").rstrip("/")
ANON_KEY      = os.getenv("SUPABASE_ANON_KEY") or ""
SERVICE_KEY   = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or ""
SUPABASE_DEBUG = os.getenv("SUPABASE_DEBUG") == "1"

if not SUPABASE_URL:
    raise RuntimeError("Missing SUPABASE_URL in environment")
if not ANON_KEY:
    raise RuntimeError("Missing SUPABASE_ANON_KEY in environment")

# -- helpers ------------------------------------------------------------------
def _safe_headers_for_log(h: dict) -> dict:
    if not SUPABASE_DEBUG:
        return {}
    redacted = {}
    for k, v in h.items():
        if k.lower() in ("apikey", "authorization"):
            redacted[k] = "***"
        else:
            redacted[k] = v
    return redacted

def _choose_token(user_jwt: Optional[str], force_service: bool) -> str:
    if force_service:
        if not SERVICE_KEY:
            raise RuntimeError("SUPABASE_SERVICE_ROLE_KEY required when force_service=True")
        return SERVICE_KEY
    # priorité: user -> service -> anon
    return user_jwt or SERVICE_KEY or ANON_KEY

def _split_schema(rel: str) -> tuple[Optional[str], str]:
    if "." in rel:
        s, t = rel.split(".", 1)
        return s, t
    return None, rel

def _base_headers(token: str) -> dict:
    # petit marqueur utile pour lire les logs côté app (ne pas afficher la clé)
    kind = "service_role" if token == SERVICE_KEY else ("anon" if token == ANON_KEY else "user_jwt")
    if SUPABASE_DEBUG:
        print(f"[Supabase] Using token kind: {kind}")
    return {
        "apikey": token,
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    }

def _log_http(method: str, url: str, headers: dict, body: Any, r: requests.Response):
    if not SUPABASE_DEBUG:
        if not r.ok:
            # même hors debug, on remonte les erreurs PostgREST
            print(f"POSTGREST {method} ERROR {r.status_code} {url} {r.text}")
        return
    try:
        print(f"[Supabase] {method} {url}")
        print("[Supabase] headers:", _safe_headers_for_log(headers))
        if body is not None:
            print("[Supabase] body:", json.dumps(body, ensure_ascii=False, default=str))
        print("[Supabase] resp:", r.status_code, r.text[:4000])
    except Exception as e:
        print("[Supabase] log error:", e)

# -- HTTP wrappers -------------------------------------------------------------
def select(
    table: str,
    params: str = "",
    user_jwt: Optional[str] = None,
    force_service: bool = False,
):
    schema, rel = _split_schema(table)
    token   = _choose_token(user_jwt, force_service)
    headers = _base_headers(token)
    if schema:
        headers["Accept-Profile"] = schema
    url = f"{SUPABASE_URL}/rest/v1/{rel}{params}"
    r = requests.get(url, headers=headers)
    _log_http("SELECT", url, headers, None, r)
    r.raise_for_status()
    return r.json()

def insert(
    table: str,
    rows: List[Dict],
    user_jwt: Optional[str] = None,
    returning: str = "representation",  # "representation" | "minimal"
    force_service: bool = False,
):
    schema, rel = _split_schema(table)
    token   = _choose_token(user_jwt, force_service)
    headers = _base_headers(token)
    if schema:
        headers["Content-Profile"] = schema
        if returning != "minimal":
            headers["Accept-Profile"] = schema
    headers["Prefer"] = f"return={returning}"
    url = f"{SUPABASE_URL}/rest/v1/{rel}"
    r = requests.post(url, headers=headers, json=rows)
    _log_http("INSERT", url, headers, rows, r)
    r.raise_for_status()
    return r.json() if returning != "minimal" else []

def upsert(
    table: str,
    rows: List[Dict],
    user_jwt: Optional[str] = None,
    on_conflict: Optional[str] = None,
    returning: str = "representation",
    force_service: bool = False,
):
    schema, rel = _split_schema(table)
    token   = _choose_token(user_jwt, force_service)
    headers = _base_headers(token)
    if schema:
        headers["Content-Profile"] = schema
        if returning != "minimal":
            headers["Accept-Profile"] = schema
    headers["Prefer"] = f"resolution=merge-duplicates,return={returning}"
    url = f"{SUPABASE_URL}/rest/v1/{rel}"
    if on_conflict:
        url += f"?on_conflict={on_conflict}"
    r = requests.post(url, headers=headers, json=rows)
    _log_http("UPSERT", url, headers, rows, r)
    r.raise_for_status()
    return r.json() if returning != "minimal" else []

def patch(
    table: str,
    body: dict,
    params: str,                      # ex: f"?id=eq.{recipe_id}"
    user_jwt: Optional[str] = None,
    returning: str = "representation",
    force_service: bool = False,
):
    schema, rel = _split_schema(table)
    token = _choose_token(user_jwt, force_service)
    headers = _base_headers(token)
    if schema:
        headers["Content-Profile"] = schema
        if returning != "minimal":
            headers["Accept-Profile"] = schema
    headers["Prefer"] = f"return={returning}"
    url = f"{SUPABASE_URL}/rest/v1/{rel}{params}"
    r = requests.patch(url, headers=headers, json=body)
    if not r.ok:
        print("POSTGREST PATCH ERROR", r.status_code, url, r.text)
    r.raise_for_status()
    return r.json() if returning != "minimal" else []

def delete(
    table: str,
    params: str,                      # ex: f"?recipe_id=eq.{recipe_id}"
    user_jwt: Optional[str] = None,
    force_service: bool = False,
):
    schema, rel = _split_schema(table)
    token = _choose_token(user_jwt, force_service)
    headers = _base_headers(token)
    if schema:
        headers["Content-Profile"] = schema
    url = f"{SUPABASE_URL}/rest/v1/{rel}{params}"
    r = requests.delete(url, headers=headers)
    if not r.ok:
        print("POSTGREST DELETE ERROR", r.status_code, url, r.text)
    r.raise_for_status()
    # PostgREST renvoie souvent un body vide sur DELETE
    try:
        return r.json()
    except Exception:
        return {}

def post_rpc(
    fn: str,
    body: Dict[str, Any],
    user_jwt: Optional[str] = None,
    force_service: bool = False,
):
    token   = _choose_token(user_jwt, force_service)
    headers = _base_headers(token)
    url = f"{SUPABASE_URL}/rest/v1/rpc/{fn}"
    r = requests.post(url, headers=headers, json=body)
    _log_http("RPC", url, headers, body, r)
    r.raise_for_status()
    return r.json()

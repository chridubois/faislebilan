import { useEffect, useMemo, useRef, useState } from "react";
import type { Ingredient, IngredientCiqual } from "../types";
import { searchCiqual } from "../api/ingredients";

export type IngredientFormValues = {
  name: string;
  category: string;
  labels: string;      // CSV dans le formulaire
  allergens: string;   // CSV dans le formulaire
  ciqual_code: string | null;
};

export type IngredientFormProps = {
  initial?: Partial<Ingredient>;
  mode: "create" | "edit";
  loading?: boolean;
  onSubmit: (values: IngredientFormValues) => Promise<void> | void;
  onDelete?: () => Promise<void> | void;
};

const toCsv = (v: unknown): string =>
  Array.isArray(v) ? v.join(", ") : typeof v === "string" ? v : "";

function useDebounced<T>(value: T, delay = 300) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

export default function IngredientForm({
  initial,
  mode,
  loading,
  onSubmit,
  onDelete,
}: IngredientFormProps) {
  const [values, setValues] = useState<IngredientFormValues>({
    name: initial?.name ?? "",
    category: initial?.category ?? "",
    labels: toCsv(initial?.labels),
    allergens: toCsv(initial?.allergens),
    ciqual_code:
      (initial && (initial as { ciqual_code?: string | null }).ciqual_code) ??
      null,
  });

  const [errors, setErrors] = useState<{ ciqual_code?: string }>({});

  // --- Autocomplete CIQUAL (sans MUI) ---
  const [ciqualInput, setCiqualInput] = useState<string>(
    // si tu veux afficher le code existant en édition, tu peux hydrater ici
    values.ciqual_code ?? ""
  );
  const debouncedCiqual = useDebounced(ciqualInput, 300);
  const [ciqualOptions, setCiqualOptions] = useState<IngredientCiqual[]>([]);
  const [ciqualLoading, setCiqualLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const q = debouncedCiqual.trim();
      if (q.length < 2) {
        if (!cancelled) setCiqualOptions([]);
        return;
      }
      setCiqualLoading(true);
      try {
        const res = (await searchCiqual({
          q,
          limit: 20,
        })) as IngredientCiqual[];
        if (!cancelled) setCiqualOptions(res);
      } finally {
        if (!cancelled) setCiqualLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [debouncedCiqual]);

  // Fermer la liste si clic en dehors
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const set = <K extends keyof IngredientFormValues>(
    k: K,
    v: IngredientFormValues[K]
  ) => setValues((s) => ({ ...s, [k]: v }));

  // ✅ Quand on choisit un CIQUAL :
  // - on fixe ciqual_code
  // - si name est vide, on le remplit automatiquement avec le libellé CIQUAL
  const selectOption = (opt: IngredientCiqual) => {
    setValues((s) => ({
      ...s,
      ciqual_code: opt.ciqual_code,
      name: s.name && s.name.trim().length > 0 ? s.name : (opt.name_fr ?? ""),
    }));
    // On affiche "Nom (code)" dans l'input CIQUAL
    setCiqualInput(`${opt.name_fr ?? ""} (${opt.ciqual_code})`);
    setOpen(false);
    setErrors((e) => ({ ...e, ciqual_code: undefined }));
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Fallback supplémentaire : si name est vide mais un code CIQUAL est sélectionné,
    // on essaye d'inférer le nom depuis l'input "Nom (code)".
    let patched: IngredientFormValues = { ...values };
    if (!patched.name.trim() && patched.ciqual_code) {
      const m = ciqualInput.match(/^(.+?)\s*\([^)]+\)\s*$/);
      const inferred = (m ? m[1] : ciqualInput).trim();
      if (inferred) patched = { ...patched, name: inferred };
    }

    const nextErrors: typeof errors = {};
    if (!patched.ciqual_code) nextErrors.ciqual_code = "Code CIQUAL requis";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    await onSubmit(patched);
  }

  const dropdownVisible = useMemo(
    () => open && (ciqualOptions.length > 0 || ciqualLoading),
    [open, ciqualOptions.length, ciqualLoading]
  );

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ display: "grid", gap: 12, maxWidth: 720 }}>
        {/* CIQUAL */}
        <div>
          <label
            htmlFor="ciqual"
            style={{ display: "block", fontWeight: 600, marginBottom: 4 }}
          >
            Code CIQUAL (obligatoire)
          </label>

          <div
            ref={wrapRef}
            style={{ position: "relative", width: "100%" }}
            onFocus={() => setOpen(true)}
          >
            <input
              id="ciqual"
              type="text"
              value={ciqualInput}
              onChange={(e) => {
                setCiqualInput(e.target.value);
                setOpen(true);
                // quand l'utilisateur retape, on "désélectionne" le code tant qu'il n'a pas choisi
                setValues((s) => ({ ...s, ciqual_code: null }));
              }}
              placeholder="Tape au moins 2 lettres pour chercher…"
              autoComplete="off"
              style={{
                width: "100%",
                padding: "8px 36px 8px 10px",
                border: `1px solid ${errors.ciqual_code ? "#d32f2f" : "#ccc"}`,
                borderRadius: 8,
                outline: "none",
              }}
            />

            {/* Badge loader simple */}
            {ciqualLoading && (
              <span
                aria-hidden
                style={{
                  position: "absolute",
                  right: 10,
                  top: 8,
                  fontSize: 12,
                  opacity: 0.7,
                }}
              >
                ⏳
              </span>
            )}

            {/* Dropdown */}
            {dropdownVisible && (
              <ul
                role="listbox"
                style={{
                  position: "absolute",
                  zIndex: 20,
                  top: "100%",
                  left: 0,
                  right: 0,
                  maxHeight: 220,
                  overflowY: "auto",
                  background: "#fff",
                  border: "1px solid #ddd",
                  borderTop: "none",
                  borderRadius: "0 0 8px 8px",
                  boxShadow:
                    "0 8px 20px rgba(0,0,0,0.06), 0 2px 6px rgba(0,0,0,0.04)",
                }}
              >
                {ciqualOptions.map((opt) => (
                  <li
                    key={opt.ciqual_code}
                    role="option"
                    onMouseDown={(e) => {
                      e.preventDefault(); // éviter blur avant click
                      selectOption(opt);
                    }}
                    style={{
                      padding: "8px 10px",
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) =>
                      ((e.currentTarget.style.background = "#f5f5f5"))
                    }
                    onMouseLeave={(e) =>
                      ((e.currentTarget.style.background = "transparent"))
                    }
                  >
                    {opt.name_fr}{" "}
                    <span style={{ opacity: 0.6 }}>({opt.ciqual_code})</span>
                  </li>
                ))}
                {ciqualOptions.length === 0 && !ciqualLoading && (
                  <li style={{ padding: "8px 10px", opacity: 0.7 }}>
                    Aucun résultat
                  </li>
                )}
              </ul>
            )}
          </div>

          {errors.ciqual_code && (
            <div style={{ color: "#d32f2f", marginTop: 4 }}>
              {errors.ciqual_code}
            </div>
          )}
        </div>

        {/* Autres champs */}
        <div>
          <label style={{ display: "block", fontWeight: 600, marginBottom: 4 }}>
            Nom (optionnel)
          </label>
          <input
            type="text"
            value={values.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="Laisser vide pour reprendre le libellé CIQUAL"
            style={{ width: "100%", padding: 8, borderRadius: 8, border: "1px solid #ccc" }}
          />
        </div>

        <div>
          <label style={{ display: "block", fontWeight: 600, marginBottom: 4 }}>
            Catégorie (optionnel)
          </label>
            <input
              type="text"
              value={values.category}
              onChange={(e) => set("category", e.target.value)}
              style={{ width: "100%", padding: 8, borderRadius: 8, border: "1px solid #ccc" }}
            />
        </div>

        <div>
          <label style={{ display: "block", fontWeight: 600, marginBottom: 4 }}>
            Labels (séparés par des virgules)
          </label>
          <input
            type="text"
            value={values.labels}
            onChange={(e) => set("labels", e.target.value)}
            style={{ width: "100%", padding: 8, borderRadius: 8, border: "1px solid #ccc" }}
          />
        </div>

        <div>
          <label style={{ display: "block", fontWeight: 600, marginBottom: 4 }}>
            Allergènes (séparés par des virgules)
          </label>
          <input
            type="text"
            value={values.allergens}
            onChange={(e) => set("allergens", e.target.value)}
            style={{ width: "100%", padding: 8, borderRadius: 8, border: "1px solid #ccc" }}
          />
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="submit"
            disabled={!!loading}
            style={{
              padding: "8px 14px",
              borderRadius: 8,
              border: "1px solid #0b6",
              background: loading ? "#9fd9c7" : "#11a879",
              color: "white",
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {mode === "create" ? "Créer" : "Enregistrer"}
          </button>

          {mode === "edit" && onDelete && (
            <button
              type="button"
              onClick={() => void onDelete()}
              disabled={!!loading}
              style={{
                padding: "8px 14px",
                borderRadius: 8,
                border: "1px solid #c62828",
                background: "white",
                color: "#c62828",
                fontWeight: 600,
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              Supprimer
            </button>
          )}
        </div>
      </div>
    </form>
  );
}

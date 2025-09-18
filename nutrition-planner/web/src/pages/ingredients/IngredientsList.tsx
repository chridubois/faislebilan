import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { listIngredients } from "../../api/ingredients";
import type { Ingredient } from "../../types";

const PAGE_SIZE = 25;

export default function IngredientsList() {
  const navigate = useNavigate();
  const [sp, setSp] = useSearchParams();

  const qParam = sp.get("q") ?? "";
  const pageParam = Number(sp.get("page") ?? "0");
  const page = Number.isFinite(pageParam) ? pageParam : 0;

  const [q, setQ] = useState(qParam);
  const [rows, setRows] = useState<Array<Pick<Ingredient, "id" | "name" | "category" | "labels" | "allergens">>>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const limit = PAGE_SIZE;
  const offset = page * PAGE_SIZE;

  const refresh = async () => {
    setLoading(true);
    setErr(null);
    try {
      const data = await listIngredients({ q: qParam || undefined, limit, offset });
      setRows(data);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qParam, page]);

  const onSearch = () => {
    const next = new URLSearchParams(sp);
    if (q.trim()) next.set("q", q.trim());
    else next.delete("q");
    next.set("page", "0");
    setSp(next, { replace: true });
  };

  const onPrev = () => {
    if (page <= 0) return;
    const next = new URLSearchParams(sp);
    next.set("page", String(page - 1));
    setSp(next, { replace: true });
  };

  const onNext = () => {
    const next = new URLSearchParams(sp);
    next.set("page", String(page + 1));
    setSp(next, { replace: true });
  };

  const title = useMemo(
    () => (qParam ? `Ingrédients — recherche: “${qParam}”` : "Ingrédients"),
    [qParam]
  );

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 12 }}>
        <h2 style={{ margin: 0 }}>{title}</h2>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher un ingrédient…"
            onKeyDown={(e) => e.key === "Enter" && onSearch()}
            style={{ padding: "6px 10px", minWidth: 260, borderRadius: 6, border: "1px solid #ccc" }}
          />
          <button onClick={onSearch} style={{ padding: "6px 10px" }}>Rechercher</button>
          <button onClick={refresh} disabled={loading} style={{ padding: "6px 10px" }}>
            {loading ? "…" : "Rafraîchir"}
          </button>
          <button onClick={() => navigate("/ingredients/new")} style={{ padding: "6px 10px" }}>
            Nouvel ingrédient
          </button>
        </div>
      </div>

      {err && (
        <div style={{ padding: 12, marginBottom: 12, background: "#ffecec", border: "1px solid #f5c2c7", borderRadius: 8, color: "#b00020" }}>
          {err}
        </div>
      )}

      <div style={{ overflowX: "auto", border: "1px solid #e5e5e5", borderRadius: 8 }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#fafafa" }}>
              <th style={th}>Nom</th>
              <th style={th}>Catégorie</th>
              <th style={th}>Labels</th>
              <th style={th}>Allergènes</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr
                key={r.id}
                onClick={() => navigate(`/ingredients/${r.id}`)}
                style={{ cursor: "pointer" }}
              >
                <td style={td}>{r.name}</td>
                <td style={td}>{r.category ?? "—"}</td>
                <td style={td}>
                  {r.labels?.length ? r.labels.join(", ") : "—"}
                </td>
                <td style={td}>
                  {r.allergens?.length ? r.allergens.join(", ") : "—"}
                </td>
              </tr>
            ))}
            {rows.length === 0 && !loading && (
              <tr>
                <td style={td} colSpan={4} align="center">Aucun résultat</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 12 }}>
        <button onClick={onPrev} disabled={page <= 0} style={{ padding: "6px 10px" }}>◀︎ Précédent</button>
        <span>Page {page + 1}</span>
        {/* On active “Suivant” si l'on a rempli la page courante */}
        <button onClick={onNext} disabled={rows.length < PAGE_SIZE} style={{ padding: "6px 10px" }}>Suivant ▶︎</button>
      </div>
    </div>
  );
}

const th: React.CSSProperties = { textAlign: "left", padding: "10px 12px", borderBottom: "1px solid #eee", fontWeight: 600 };
const td: React.CSSProperties = { padding: "10px 12px", borderBottom: "1px solid #f3f3f3" };

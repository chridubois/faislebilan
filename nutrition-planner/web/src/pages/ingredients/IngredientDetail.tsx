import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import IngredientForm, { type IngredientFormValues } from "../../components/IngredientForm";
import { getIngredient, updateIngredient, deleteIngredient } from "../../api/ingredients";
import type { Ingredient } from "../../types";

const splitToArray = (s: string) =>
  s ? s.split(",").map((x) => x.trim()).filter(Boolean) : [];

export default function IngredientDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<Ingredient | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // Redirection si /ingredients/new
  useEffect(() => {
    if (id === "new") navigate("/ingredients/new", { replace: true });
  }, [id, navigate]);

  // Fetch en édition
  useEffect(() => {
    if (!id || id === "new") return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const it = await getIngredient(id);
        if (!cancelled) setData(it);
      } catch (e) {
        if (!cancelled) setErr(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  const onSubmit = useCallback(
    async (values: IngredientFormValues) => {
      if (!id) return;
      setLoading(true);
      try {
        const payload = {
          ciqual_code: values.ciqual_code, // peut être null si autorisé
          name: values.name.trim() || undefined,
          category: values.category.trim() || undefined,
          labels: splitToArray(values.labels),
          allergens: splitToArray(values.allergens),
        };
        const saved = await updateIngredient(id, payload);
        setData(saved);
      } catch (e) {
        setErr(e instanceof Error ? e.message : String(e));
      } finally {
        setLoading(false);
      }
    },
    [id]
  );

  const onDelete = useCallback(async () => {
    if (!id) return;
    await deleteIngredient(id);
    navigate("/ingredients");
  }, [id, navigate]);

  if (id === "new") return null;
  if (err) return <div style={{ color: "#c62828" }}>{err}</div>;
  if (loading && !data) return <p>Chargement…</p>;
  if (!data) return null;

  return (
    <div>
      <h2 style={{ margin: "0 0 16px", fontSize: 20, fontWeight: 600 }}>
        Éditer : {data.name || data.id}
      </h2>
      <IngredientForm
        mode="edit"
        initial={data}
        loading={loading}
        onSubmit={onSubmit}
        onDelete={onDelete}
      />
    </div>
  );
}

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import IngredientForm, { type IngredientFormValues } from "../../components/IngredientForm";
import { createIngredient } from "../../api/ingredients";
import type { IngredientNew } from "../../types";

const splitToArray = (s: string) =>
  s ? s.split(",").map((x) => x.trim()).filter(Boolean) : [];

export default function IngredientCreate() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(values: IngredientFormValues) {
    setLoading(true);
    setErr(null);
    try {
      if (!values.ciqual_code) throw new Error("Code CIQUAL requis");

      const payload: IngredientNew = {
        ciqual_code: values.ciqual_code,
        name: values.name.trim(),
        category: values.category.trim() || undefined,
        labels: splitToArray(values.labels),
        allergens: splitToArray(values.allergens),
      };

      const created = await createIngredient(payload);
      navigate(`/ingredients/${created.id}`, { replace: true });
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h2 style={{ margin: "0 0 16px", fontSize: 20, fontWeight: 600 }}>
        Nouvel ingrédient
      </h2>
      {err ? <div style={{ color: "#c62828", marginBottom: 12 }}>{err}</div> : null}
      <IngredientForm mode="create" onSubmit={onSubmit} loading={loading} />
    </div>
  );
}

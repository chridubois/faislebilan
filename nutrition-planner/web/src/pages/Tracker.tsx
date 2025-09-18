import { useEffect, useMemo, useState } from "react";

/** Types */
type Unit = "g" | "ml" | "pièce(s)";
type MealType = "petit-déj" | "déjeuner" | "dîner" | "collation";

type Line = {
  id: string;
  food: string;
  qty: number | "";
  unit: Unit;
};

type Entry = {
  id: string;
  dateISO: string;        // YYYY-MM-DD
  time: string;           // HH:MM
  meal: MealType;
  lines: Line[];
  note?: string;
};

const SUGGESTED_FOODS = [
  "Œufs",
  "Pain complet",
  "Avoine",
  "Yaourt nature",
  "Poulet",
  "Riz complet",
  "Quinoa",
  "Sarrasin",
  "Brocoli",
  "Sardines",
  "Maquereau",
  "Lentilles",
  "Tomates",
  "Banane",
  "Amandes",
];

/** Utils */
const uid = () => Math.random().toString(36).slice(2, 9);
const todayISO = () => new Date().toISOString().slice(0, 10);
const nowHM = () => {
  const d = new Date();
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
};

export default function Tracker() {
  const [dateISO, setDateISO] = useState<string>(todayISO());
  const [time, setTime] = useState<string>(nowHM());
  const [meal, setMeal] = useState<MealType>("déjeuner");
  const [note, setNote] = useState<string>("");
  const [lines, setLines] = useState<Line[]>([
    { id: uid(), food: "", qty: "", unit: "g" },
  ]);

  // Persist last used meal + time (UX)
  useEffect(() => {
    const saved = localStorage.getItem("tracker_last_ctx");
    if (saved) {
      try {
        const v = JSON.parse(saved) as { meal?: MealType };
        if (v.meal) setMeal(v.meal);
      } catch { /* ignore */}
    }
  }, []);
  useEffect(() => {
    localStorage.setItem("tracker_last_ctx", JSON.stringify({ meal }));
  }, [meal]);

  const isValid = useMemo(() => {
    if (!dateISO || !time || !meal) return false;
    if (lines.length === 0) return false;
    return lines.every((l) => l.food.trim().length > 0 && Number(l.qty) > 0);
  }, [dateISO, time, meal, lines]);

  const addLine = () =>
    setLines((ls) => [...ls, { id: uid(), food: "", qty: "", unit: "g" }]);

  const removeLine = (id: string) =>
    setLines((ls) => (ls.length > 1 ? ls.filter((l) => l.id !== id) : ls));

  const updateLine = (id: string, patch: Partial<Line>) =>
    setLines((ls) => ls.map((l) => (l.id === id ? { ...l, ...patch } : l)));

  const clearForm = () => {
    setLines([{ id: uid(), food: "", qty: "", unit: "g" }]);
    setNote("");
    // On garde date/heure/meal pour enchaîner plusieurs ajouts
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    const entry: Entry = {
      id: uid(),
      dateISO,
      time,
      meal,
      lines: lines.map((l) => ({ ...l, qty: Number(l.qty) })),
      note: note?.trim() || undefined,
    };

    // Persist
    const key = "tracker_entries";
    const prev: Entry[] = JSON.parse(localStorage.getItem(key) || "[]");
    localStorage.setItem(key, JSON.stringify([entry, ...prev]));

    // Debug dev
    console.log("Saved tracker entry:", entry);

    clearForm();
    // Petit feedback natif
    if ("vibrate" in navigator && typeof navigator.vibrate === "function") {
      navigator.vibrate(20);
    }
    alert("Ajouté ✔️");
  };

  return (
    <main className="app-main">
      <form onSubmit={onSubmit} className="max-w-2xl mx-auto">
        <header className="mb-3">
          <h1 className="text-xl font-extrabold text-slate-900">Tracker</h1>
          <p className="text-slate-500 text-sm">
            Ajoute ce que tu as mangé pour ce repas.
          </p>
        </header>

        {/* Contexte (date / heure / repas) */}
        <section className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-4">
          <label className="flex flex-col gap-1">
            <span className="text-sm text-slate-600">Date</span>
            <input
              type="date"
              value={dateISO}
              onChange={(e) => setDateISO(e.target.value)}
              className="input"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm text-slate-600">Heure</span>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="input"
            />
          </label>

          <label className="flex flex-col gap-1 col-span-2 sm:col-span-2">
            <span className="text-sm text-slate-600">Repas</span>
            <select
              value={meal}
              onChange={(e) => setMeal(e.target.value as MealType)}
              className="input"
            >
              <option value="petit-déj">Petit-déj</option>
              <option value="déjeuner">Déjeuner</option>
              <option value="dîner">Dîner</option>
              <option value="collation">Collation</option>
            </select>
          </label>
        </section>

        {/* Lignes aliments */}
        <section className="space-y-2">
          {lines.map((l, idx) => (
            <div
              key={l.id}
              className="rounded-xl border border-slate-200 bg-slate-900 text-slate-100 p-3 flex items-end gap-2"
            >
              <label className="flex-1 flex flex-col gap-1">
                <span className="text-xs text-slate-400">Aliment</span>
                <input
                  list="food-suggestions"
                  placeholder="ex: Quinoa"
                  value={l.food}
                  onChange={(e) => updateLine(l.id, { food: e.target.value })}
                  className="rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 outline-none focus:ring-2 focus:ring-orange-300"
                />
              </label>

              <label className="w-28 flex flex-col gap-1">
                <span className="text-xs text-slate-400">Quantité</span>
                <input
                  inputMode="decimal"
                  type="number"
                  min={0}
                  step="0.1"
                  placeholder="0"
                  value={l.qty}
                  onChange={(e) =>
                    updateLine(l.id, { qty: e.target.value === "" ? "" : Number(e.target.value) })
                  }
                  className="rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 outline-none focus:ring-2 focus:ring-orange-300"
                />
              </label>

              <label className="w-28 flex flex-col gap-1">
                <span className="text-xs text-slate-400">Unité</span>
                <select
                  value={l.unit}
                  onChange={(e) => updateLine(l.id, { unit: e.target.value as Unit })}
                  className="rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 outline-none focus:ring-2 focus:ring-orange-300"
                >
                  <option value="g">g</option>
                  <option value="ml">ml</option>
                  <option value="pièce(s)">pièce(s)</option>
                </select>
              </label>

              <div className="flex items-center pb-2">
                <button
                  type="button"
                  onClick={() => removeLine(l.id)}
                  className="rounded-lg px-3 py-2 text-sm border border-slate-700 bg-slate-800 hover:bg-slate-700"
                  aria-label={`Supprimer la ligne ${idx + 1}`}
                  disabled={lines.length === 1}
                >
                  −
                </button>
              </div>
            </div>
          ))}

          <datalist id="food-suggestions">
            {SUGGESTED_FOODS.map((f) => (
              <option key={f} value={f} />
            ))}
          </datalist>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={addLine}
              className="rounded-lg px-3 py-2 text-sm border border-slate-300 hover:bg-slate-50"
            >
              + Ajouter un aliment
            </button>
          </div>
        </section>

        {/* Note */}
        <section className="mt-3">
          <label className="flex flex-col gap-1">
            <span className="text-sm text-slate-600">Note (optionnel)</span>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="input"
              placeholder="Contexte, ressenti, etc."
            />
          </label>
        </section>

        {/* Actions */}
        <footer className="mt-4 flex gap-8">
          <button
            type="submit"
            disabled={!isValid}
            className={`rounded-lg px-4 py-2 font-semibold text-white ${isValid ? "bg-orange-500 hover:bg-orange-600" : "bg-orange-300 cursor-not-allowed"}`}
          >
            Enregistrer
          </button>
          <button
            type="button"
            onClick={clearForm}
            className="text-slate-600 hover:text-slate-900"
          >
            Réinitialiser
          </button>
        </footer>
      </form>
    </main>
  );
}

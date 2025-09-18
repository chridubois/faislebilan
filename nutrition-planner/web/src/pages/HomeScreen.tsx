import { Link } from "react-router-dom";
import "./../App.css";

export default function HomeScreen() {
  const tiles = [
    { to: "/tracker", label: "Tracker", subtitle: "En construction" , disabled: false },
    { to: "/recipes/create", label: "Créer recette", subtitle: "Ajouter une nouvelle recette" },
    { to: "/recipes/browse", label: "Liste recettes", subtitle: "Parcourir & filtrer" },
    { to: "/ingredients", label: "Liste ingrédients", subtitle: "Base ingrédients" },
  ];

  return (
    <main className="home">
      <section className="home__grid" role="navigation" aria-label="Navigation principale">
        {tiles.map((t) =>
          t.disabled ? (
            <div key={t.label} className="tile tile--disabled" aria-disabled="true">
              <div className="tile__title">{t.label}</div>
              <div className="tile__subtitle">{t.subtitle}</div>
              <span className="tile__badge">Bientôt</span>
            </div>
          ) : (
            <Link
              key={t.label}
              to={t.to}
              className={`tile ${t.label === "Créer recette" ? "tile--accent" : ""}`}
            >
              <div className="tile__title">{t.label}</div>
              <div className="tile__subtitle">{t.subtitle}</div>
            </Link>
          )
        )}

      </section>
    </main>
  );
}

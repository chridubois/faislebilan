import { Link, NavLink } from "react-router-dom";

function Logo() {
  return (
    <Link to="/planner" className="app-logo" aria-label="Aller au Planner">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
        <circle cx="12" cy="12" r="10" stroke="#0ea5e9" strokeWidth="2" />
        <path d="M7 13c3 2 7 2 10 0" stroke="#0ea5e9" strokeWidth="2" strokeLinecap="round" />
        <path d="M9 9h6" stroke="#0ea5e9" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <b>NutriPlanner</b>
    </Link>
  );
}

export default function Header() {
  return (
    <header className="app-header">
      <Logo />
      <nav className="app-nav" aria-label="Navigation principale">
        <NavLink to="/tracker" className={({ isActive }) => `app-link ${isActive ? "is-active" : ""}`}>Tracker</NavLink>
        <NavLink to="/ingredients" className={({ isActive }) => `app-link ${isActive ? "is-active" : ""}`}>Explorer ingrédients</NavLink>
        <NavLink to="/recipes/browse" className={({ isActive }) => `app-link ${isActive ? "is-active" : ""}`}>Explorer recettes</NavLink>
        <NavLink to="/recipes/create" className={({ isActive }) => `app-link ${isActive ? "is-active" : ""}`}>Créer une recette</NavLink>
        <NavLink to="/profiles" className={({ isActive }) => `app-link ${isActive ? "is-active" : ""}`}>Profils</NavLink>
      </nav>
    </header>
  );
}

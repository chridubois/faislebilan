import './App.css'
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
// import Planner from './pages/Planner'
import ProfilesList from './pages/profiles/ProfilesList'
import ProfileDetail from './pages/profiles/ProfileDetail'
import RecipeCreate from './pages/recipes/RecipeCreate'
import RecipeDetail from './pages/recipes/RecipeDetail'
import RecipesBrowse from './pages/recipes/RecipesBrowse';
import IngredientsList from './pages/ingredients/IngredientsList'
import IngredientDetail from './pages/ingredients/IngredientDetail'
import IngredientCreate from './pages/ingredients/IngredientCreate'
import HomeScreen from './pages/HomeScreen';
import Tracker from './pages/Tracker';

export default function App() {
  return (
    <Router>
      <header className="app-header">
        <Link to="/" className="app-logo">🍽️ NutriPlanner</Link>
        <nav className="app-nav">
          <Link to="/tracker" className="app-link">Tracker</Link>
          <Link to="/ingredients" className="app-link">Explorer ingrédients</Link>
          <Link to="/recipes/browse" className="app-link">Explorer recettes</Link>
          <Link to="/recipes/create" className="app-link">Créer une recette</Link>
          <Link to="/profiles" className="app-link">Profils</Link>
        </nav>
      </header>

      <main className="app-main">
        <Routes>
          <Route path="/" element={<HomeScreen />} />
          <Route path="/profiles" element={<ProfilesList />} />
          <Route path="/profiles/:id" element={<ProfileDetail />} />
          <Route path="/recipes/create" element={<RecipeCreate />} />
          <Route path="/recipes/bdd/:id" element={<RecipeDetail />} />
          <Route path="/recipes/browse" element={<RecipesBrowse />} />
          <Route path="/ingredients" element={<IngredientsList />} />
          <Route path="/ingredients/new" element={<IngredientCreate />} />
          <Route path="/ingredients/:id" element={<IngredientDetail />} />
          <Route path="/tracker" element={<Tracker />} />
        </Routes>
      </main>
    </Router>
  )
}

import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Home from './pages/Home';
import Funnel from './pages/Funnel';
import Bilan from './pages/Bilan';
import ListeBilans from './pages/ListeBilans';
import ListeClients from './pages/ListeClients';
import Client from './pages/Client';
import Header from './components/Header'; // Importer le Header
import Footer from './components/Footer';

function App() {
  return (
    <Router>
      <Header />
      <div style={{ minHeight: 'calc(100vh - 64px - 64px)' }}> {/* Adjust height for header and footer */}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/funnel" element={<Funnel />} />
          <Route path="/bilan/:id" element={<Bilan />} />
          <Route path="/bilans" element={<ListeBilans />} />
          <Route path="/clients" element={<ListeClients />} />
          <Route path="/client/:id" element={<Client />} />
        </Routes>
      </div>
      <Footer /> {/* Ajouter le Footer ici */}
    </Router>
  );
}

export default App;

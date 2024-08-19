import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { Box } from '@mui/material';
import Home from './pages/Home';
import Funnel from './pages/Funnel';
import Bilan from './pages/Bilan';
import ListeBilans from './pages/ListeBilans';
import ListeClients from './pages/ListeClients';
import Client from './pages/Client';
import Header from './components/Header';
import Footer from './components/Footer';
import Dashboard from './pages/Dashboard';
import FAQ from './pages/FAQ';
import Support from './pages/Support';
import Login from './pages/Login';
import Profile from './pages/Profile';
import AdminPage from './pages/AdminPage';
import PrivateRoute from './components/PrivateRoute';
import AdminRoute from './hoc/AdminRoute';

function App() {
  return (
    <Router>
      <Header />
      <Box mt={4}></Box>
      <div style={{ minHeight: 'calc(100vh - 64px - 64px)' }}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Home />} />
          <Route path="/funnel" element={<PrivateRoute><Funnel /></PrivateRoute>} />
          <Route path="/bilan/:id" element={<PrivateRoute><Bilan /></PrivateRoute>} />
          <Route path="/bilans" element={<PrivateRoute><ListeBilans /></PrivateRoute>} />
          <Route path="/clients" element={<PrivateRoute><ListeClients /></PrivateRoute>} />
          <Route path="/client/:id" element={<PrivateRoute><Client /></PrivateRoute>} />
          <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/support" element={<Support />} />
          <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
          <Route path="/admin" element={<AdminRoute><AdminPage /></AdminRoute>} />
        </Routes>
      </div>
      <Footer />
    </Router>
  );
}

export default App;

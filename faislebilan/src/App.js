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
import BilanTemplates from './pages/BilanTemplates';
import CreateBilanTemplate from './pages/CreateBilanTemplate';
import NoTemplates from './pages/NoTemplates';
import UserPreferences from './pages/UserPreferences';
import CreateForm from './pages/CreateForm';
import FormManagement from './pages/FormManagement';
import FillForm from './pages/FillForm';
import UserFormSubmissions from './pages/UserFormSubmissions';
import FormSubmissionDetail from './pages/FormSubmissionDetail';
import { getAuth } from 'firebase/auth';

function App() {
  const auth = getAuth();
  const user = auth.currentUser; // Obtenez l'utilisateur connecté
  window.dataLayer.push({
    event: 'page_view',
    userId: user ? user.uid : null,
  });
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
          <Route path="/bilan-templates" element={<PrivateRoute><BilanTemplates /></PrivateRoute>} />
          <Route path="/create-bilan-template" element={<PrivateRoute><CreateBilanTemplate /></PrivateRoute>} />
          <Route path="/create-bilan-template/:id" element={<PrivateRoute><CreateBilanTemplate /></PrivateRoute>} />
          <Route path="/no-templates" element={<PrivateRoute><NoTemplates /></PrivateRoute>} />
          <Route path="/preferences" element={<PrivateRoute><UserPreferences /></PrivateRoute>} />
          <Route path="/create-form" element={<PrivateRoute><CreateForm /></PrivateRoute>} />
          <Route path="/edit-form/:id" element={<PrivateRoute><CreateForm /></PrivateRoute>} />
          <Route path="/manage-forms" element={<PrivateRoute><FormManagement /></PrivateRoute>} />
          <Route path="/fill-form/:formId/:clientId" element={<FillForm />} />
          <Route path="/form-submissions" element={<PrivateRoute><UserFormSubmissions /></PrivateRoute>} />
          <Route path="/form-submission/:id" element={<PrivateRoute><FormSubmissionDetail /></PrivateRoute>} />
          <Route path="/admin" element={<AdminRoute><AdminPage /></AdminRoute>} />
        </Routes>
      </div>
      <Footer />
    </Router>
  );
}

export default App;

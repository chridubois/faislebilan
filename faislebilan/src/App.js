import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { Box } from '@mui/material';
import Home from './pages/Home';
import Funnel from './pages/Funnel';
import Bilan from './pages/Bilan';
import ListeBilans from './pages/ListeBilans';
import ListeClients from './pages/ListeClients';
import Client from './pages/Client';
import Footer from './components/Footer';
import Header from './components/Header';
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
import FillForm from './pages/FillForm';  // Nouvelle page ajoutée
import UserFormSubmissions from './pages/UserFormSubmissions';  // Nouvelle page ajoutée
import FormSubmissionDetail from './pages/FormSubmissionDetail';  // Nouvelle page ajoutée
import PrivacyPolicy from './pages/PrivacyPolicy';
import Layout from './components/Layout';
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
      <Box mt={4} />
      <div style={{ minHeight: 'calc(100vh - 64px)' }}>
        <Routes>
          {/* Pages publiques sans le layout */}
          <Route
            path="/login"
            element={
              <>
                <Header />  {/* Affichage du Header */}
                <Login />
                <Footer />
              </>
            }
          />
          <Route
            path="/"
            element={
              <>
                <Header />  {/* Affichage du Header */}
                <Home />
                <Footer />
              </>
            }
          />
          <Route
            path="/faq"
            element={
              <>
                <Header />  {/* Affichage du Header */}
                <FAQ />
                <Footer />
              </>
            }
          />
          <Route
            path="/support"
            element={
              <>
                <Header />  {/* Affichage du Header */}
                <Support />
                <Footer />
              </>
            }
          />
          <Route
            path="/privacy-policy"
            element={
              <>
                <Header />  {/* Affichage du Header */}
                <PrivacyPolicy />
                <Footer />
              </>
            }
          />

          {/* Pages privées avec Layout */}
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/funnel"
            element={
              <PrivateRoute>
                <Layout>
                  <Funnel />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/bilan/:id"
            element={
              <PrivateRoute>
                <Layout>
                  <Bilan />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/bilans"
            element={
              <PrivateRoute>
                <Layout>
                  <ListeBilans />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/clients"
            element={
              <PrivateRoute>
                <Layout>
                  <ListeClients />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/client/:id"
            element={
              <PrivateRoute>
                <Layout>
                  <Client />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <PrivateRoute>
                <Layout>
                  <Profile />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/bilan-templates"
            element={
              <PrivateRoute>
                <Layout>
                  <BilanTemplates />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/create-bilan-template"
            element={
              <PrivateRoute>
                <Layout>
                  <CreateBilanTemplate />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/create-bilan-template/:id"
            element={
              <PrivateRoute>
                <Layout>
                  <CreateBilanTemplate />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/no-templates"
            element={
              <PrivateRoute>
                <Layout>
                  <NoTemplates />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/preferences"
            element={
              <PrivateRoute>
                <Layout>
                  <UserPreferences />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/create-form"
            element={
              <PrivateRoute>
                <Layout>
                  <CreateForm />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/edit-form/:id"
            element={
              <PrivateRoute>
                <Layout>
                  <CreateForm />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/manage-forms"
            element={
              <PrivateRoute>
                <Layout>
                  <FormManagement />
                </Layout>
              </PrivateRoute>
            }
          />

          {/* Nouveaux chemins ajoutés */}
          <Route
            path="/fill-form/:formId/:clientId"
            element={
              <PrivateRoute>
                <Layout>
                  <FillForm />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/form-submissions"
            element={
              <PrivateRoute>
                <Layout>
                  <UserFormSubmissions />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/form-submission/:id"
            element={
              <PrivateRoute>
                <Layout>
                  <FormSubmissionDetail />
                </Layout>
              </PrivateRoute>
            }
          />

          {/* Route Admin */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <Layout>
                  <AdminPage />
                </Layout>
              </AdminRoute>
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;

import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Container, Typography, Box, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { getAuth } from 'firebase/auth';
import CustomTable from '../components/CustomTable';  // Import du composant réutilisable

function ListeClients() {
  const [clients, setClients] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchClients = async () => {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) return;

      const clientsCollection = collection(db, 'clients');
      const q = query(clientsCollection, where('userId', '==', user.uid));
      const clientSnapshot = await getDocs(q);
      const clientList = clientSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setClients(clientList);
    };

    fetchClients();
  }, []);

  const handleCreateClient = () => {
    navigate('/funnel');
  };

  const handleViewDetails = (clientId) => {
    navigate(`/client/${clientId}`);
  };

  const handleDeleteClient = (clientId) => {
    // Ajoute la logique de suppression ici si nécessaire
    console.log('Supprimer le client :', clientId);
  };

  // Définit les colonnes du tableau
  const columns = [
    { id: 'name', label: 'Nom du Client', field: 'name' },
    { id: 'email', label: 'Email', field: 'email' },
    { id: 'dob', label: 'Date de Naissance', field: 'dob' }
  ];

  // Définit les actions possibles (Voir Détails, Supprimer)
  const actions = [
    { label: 'Voir détails', onClick: handleViewDetails },
    { label: 'Supprimer', color: 'secondary', onClick: handleDeleteClient }
  ];

  return (
    <Container>
      <Helmet>
        <title>Liste Clients</title>
      </Helmet>

      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4" component="h1">
          Liste des clients
        </Typography>
        <Button variant="contained" color="primary" onClick={handleCreateClient}>
          Créer un client
        </Button>
      </Box>

      {/* Utilisation du CustomTable */}
      <CustomTable columns={columns} data={clients} actions={actions} />
    </Container>
  );
}

export default ListeClients;

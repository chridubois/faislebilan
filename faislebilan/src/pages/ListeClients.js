import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Container, Typography, Box, Button, useMediaQuery } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { getAuth } from 'firebase/auth';
import CustomTable from '../components/CustomTable';  // Import du composant réutilisable
import { useTheme } from '@mui/material/styles';

function ListeClients() {
  const [clients, setClients] = useState([]);
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm')); // Vérifie si l'utilisateur est sur un écran mobile

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

  // Définit les colonnes du tableau
  const columns = [
    { id: 'name', label: 'Nom du Client', field: 'name' },
  ];

  // Définit les actions possibles (Voir Détails, Supprimer)
  const actions = [
    { label: 'Voir détails', onClick: handleViewDetails },
  ];

  return (
    <Container>
      <Helmet>
        <title>Liste des bénéficiaires</title>
      </Helmet>

      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant={isMobile ? 'h5' : 'h4'} component="h1">
          Bénéficiaires
        </Typography>
        <Button variant="contained" color="primary" onClick={handleCreateClient} size={isMobile ? 'small' : 'medium'}>
          Créer un bénéficiaire
        </Button>
      </Box>

      {/* Table scrollable sur petits écrans */}
      <Box sx={{ overflowX: 'auto' }}>
        <CustomTable
          columns={columns}
          data={clients}
          actions={actions}
          isMobile={isMobile} // Passe l'information pour les actions responsives
        />
      </Box>
    </Container>
  );
}

export default ListeClients;

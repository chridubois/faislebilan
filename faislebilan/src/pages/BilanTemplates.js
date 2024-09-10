import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Box, Button, Container, Typography } from '@mui/material';
import { getAuth } from 'firebase/auth';
import CustomTable from '../components/CustomTable'; // Import du composant de tableau réutilisable

function BilanTemplates() {
  const [templates, setTemplates] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTemplates = async () => {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) return;

      const templatesCollection = collection(db, 'bilanTemplates');
      const q = query(templatesCollection, where('userId', '==', user.uid));
      const querySnapshot = await getDocs(q);
      const templatesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTemplates(templatesData);
    };

    fetchTemplates();
  }, []);

  const handleTemplateClick = (templateId) => {
    navigate(`/create-bilan-template/${templateId}`);
  };


  // Définit les colonnes du tableau
  const columns = [
    { id: 'name', label: 'Nom du Template', field: 'name' },
  ];

  // Définit les actions possibles (Éditer, Supprimer)
  const actions = [
    { label: 'Éditer', onClick: handleTemplateClick },
  ];

  return (
    <Container>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4" component="h1">
          Liste des templates de bilan
        </Typography>
        <Button variant="contained" color="primary" onClick={() => navigate('/create-bilan-template')}>
          Créer un nouveau template
        </Button>
      </Box>

      {/* Utilisation du CustomTable */}
      <CustomTable columns={columns} data={templates} actions={actions} />
    </Container>
  );
}

export default BilanTemplates;

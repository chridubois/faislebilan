// src/pages/BilanTemplates.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../config/firebase';
import { List, ListItem, ListItemText, Button, Container, Typography } from '@mui/material';
import { getAuth } from 'firebase/auth';

function BilanTemplates() {
  const [templates, setTemplates] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const auth = getAuth();
        const user = auth.currentUser; // Obtenez l'utilisateur connecté
        if (!user) {
          throw new Error("User not authenticated");
        }

        // Filtrer les templates par userId
        const templatesCollection = collection(db, 'bilanTemplates');
        const q = query(templatesCollection, where('userId', '==', user.uid));
        const querySnapshot = await getDocs(q);
        const templatesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setTemplates(templatesData);
      } catch (error) {
        console.error('Erreur lors du chargement des modèles de bilans :', error);
      }
    };

    fetchTemplates();
  }, []);


  const handleTemplateClick = (templateId) => {
    navigate(`/create-bilan-template/${templateId}`);
  };

  return (
    <Container>
      <Typography variant="h4">Gestion des Bilan Templates</Typography>
      <Button variant="contained" color="primary" onClick={() => navigate('/create-bilan-template')}>
        Créer un nouveau template
      </Button>
      <List>
        {templates.map((template) => (
          <ListItem button key={template.id} onClick={() => handleTemplateClick(template.id)}>
            <ListItemText primary={template.name} />
          </ListItem>
        ))}
      </List>
    </Container>
  );
}

export default BilanTemplates;

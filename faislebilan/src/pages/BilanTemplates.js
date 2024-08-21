// src/pages/BilanTemplates.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { List, ListItem, ListItemText, Button, Container, Typography } from '@mui/material';

function BilanTemplates() {
  const [templates, setTemplates] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTemplates = async () => {
      const querySnapshot = await getDocs(collection(db, 'bilanTemplates'));
      const templatesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTemplates(templatesData);
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

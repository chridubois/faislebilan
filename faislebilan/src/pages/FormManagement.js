import React, { useState, useEffect } from 'react';
import { Box, Container, Typography, Button } from '@mui/material';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useNavigate } from 'react-router-dom';
import CustomTable from '../components/CustomTable'; // Import du composant de tableau réutilisable

function FormManagement() {
  const [forms, setForms] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchForms = async () => {
      const querySnapshot = await getDocs(collection(db, 'forms'));
      setForms(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };
    fetchForms();
  }, []);

  const handleDelete = async (id) => {
    await deleteDoc(doc(db, 'forms', id));
    setForms(forms.filter(form => form.id !== id));
  };

  const handleEdit = (formId) => {
    navigate(`/edit-form/${formId}`);
  };

  // Définit les colonnes du tableau
  const columns = [
    { id: 'title', label: 'Nom du Formulaire', field: 'title' },
    { id: 'description', label: 'Description', field: 'description' }
  ];

  // Définit les actions possibles (Éditer, Supprimer)
  const actions = [
    { label: 'Éditer', onClick: handleEdit },
    { label: 'Supprimer', color: 'secondary', onClick: handleDelete }
  ];

  return (
    <Container>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4" component="h1">
          Gérer les formulaires
        </Typography>
        <Button variant="contained" color="primary" onClick={() => navigate('/create-form')}>
          Créer un nouveau formulaire
        </Button>
      </Box>

      {/* Utilisation du CustomTable */}
      <CustomTable columns={columns} data={forms} actions={actions} />
    </Container>
  );
}

export default FormManagement;

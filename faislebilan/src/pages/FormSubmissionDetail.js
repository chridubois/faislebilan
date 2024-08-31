import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Container, Typography, List, ListItem, ListItemText, Box } from '@mui/material';

function FormSubmissionDetail() {
  const { id } = useParams();
  const [formSubmission, setFormSubmission] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFormSubmission = async () => {
      try {
        const formSubmissionDoc = await getDoc(doc(db, 'formSubmissions', id));
        if (formSubmissionDoc.exists()) {
          setFormSubmission(formSubmissionDoc.data());
        } else {
          console.error('Form Submission non trouvé');
        }
      } catch (error) {
        console.error('Erreur lors de la récupération de la soumission de formulaire:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFormSubmission();
  }, [id]);

  if (loading) {
    return <Typography variant="h6">Chargement...</Typography>;
  }

  if (!formSubmission) {
    return <Typography variant="h6">Soumission de formulaire introuvable.</Typography>;
  }

  return (
    <Container>
      <Typography variant="h4" gutterBottom>Détails de la Soumission de Formulaire</Typography>
      <Box mt={2}>
        <Typography variant="h6">Formulaire: {formSubmission.formTitle}</Typography>
        <Typography variant="body1">Client ID: {formSubmission.clientId}</Typography>
      </Box>
      <List>
        {Object.entries(formSubmission.responses).map(([questionId, response], index) => (
          <ListItem key={index}>
            <ListItemText
              primary={`Question: ${response.questionTitle}`}
              secondary={`Réponse: ${response.response}`}
            />
          </ListItem>
        ))}
      </List>
    </Container>
  );
}

export default FormSubmissionDetail;

import React, { useState, useEffect } from 'react';
import { getAuth } from 'firebase/auth';
import { collection, query, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Container, List, ListItem, ListItemText, Typography } from '@mui/material';
import { Link } from 'react-router-dom';

function UserFormSubmissions() {
  const [formSubmissions, setFormSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const auth = getAuth();
  const user = auth.currentUser;

  useEffect(() => {
    const fetchFormSubmissions = async () => {
      try {
        const formSubmissionsCollection = collection(db, 'formSubmissions');
        const q = query(formSubmissionsCollection);
        const querySnapshot = await getDocs(q);
        const submissions = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setFormSubmissions(submissions);
      } catch (error) {
        console.error('Erreur lors de la récupération des soumissions de formulaire:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFormSubmissions();
  }, [user.uid]);

  if (loading) {
    return <Typography variant="h6">Chargement...</Typography>;
  }

  if (formSubmissions.length === 0) {
    return <Typography variant="h6">Aucune soumission de formulaire trouvée.</Typography>;
  }

  return (
    <Container>
      <Typography variant="h4" gutterBottom>Soumissions de Formulaires</Typography>
      <List>
        {formSubmissions.map(submission => (
          <ListItem
            key={submission.id}
            button
            component={Link}
            to={`/form-submission/${submission.id}`}
          >
            <ListItemText
              primary={`Soumission le: ${new Date(submission.submittedAt.toDate()).toLocaleDateString()}`}
              secondary={`Client ID: ${submission.clientId}`}
            />
          </ListItem>
        ))}
      </List>
    </Container>
  );
}

export default UserFormSubmissions;

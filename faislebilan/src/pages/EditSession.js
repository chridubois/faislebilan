// src/pages/EditSession.js

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Container, TextField, Button, Typography, Box } from '@mui/material';

function EditSession() {
  const { sessionId } = useParams(); // Récupérer l'ID de la session depuis l'URL
  const [sessionData, setSessionData] = useState(null);
  const [description, setDescription] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const sessionDocRef = doc(db, 'sessions', sessionId);
        const sessionDocSnap = await getDoc(sessionDocRef);

        if (sessionDocSnap.exists()) {
          const session = sessionDocSnap.data();
          setSessionData(session);
          setDescription(session.description); // Remplir les champs avec les données existantes
        } else {
          console.error('Session not found!');
        }
      } catch (error) {
        console.error('Error fetching session:', error);
      }
    };

    fetchSession();
  }, [sessionId]);

  const handleSave = async () => {
    try {
      const sessionDocRef = doc(db, 'sessions', sessionId);
      await updateDoc(sessionDocRef, {
        description,
        updatedAt: new Date(),
      });

      navigate(-1); // Rediriger vers la page précédente
    } catch (error) {
      console.error('Error updating session:', error);
    }
  };

  if (!sessionData) {
    return <Typography>Loading...</Typography>;
  }

  return (
    <Container maxWidth="sm">
      <Box mt={4}>
        <Typography variant="h4" gutterBottom>
          Modifier la Session
        </Typography>
        <TextField
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          fullWidth
          margin="normal"
        />
        <Button variant="contained" color="primary" onClick={handleSave}>
          Sauvegarder
        </Button>
      </Box>
    </Container>
  );
}

export default EditSession;

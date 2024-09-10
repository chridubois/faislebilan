import React, { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../hooks/useAuth';
import { Container, Typography, Checkbox, FormControlLabel, Button, Grid, Paper, Box } from '@mui/material';

function UserPreferences() {
  const { currentUser } = useAuth();

  // Définir les préférences par défaut
  const defaultPreferences = {
    showClientInfo: true,
    showTestResults: true,
    showRecommendations: true,
    showBilanList: true,
    showEvolutionGraph: true,
    showIndicesGraph: true,
    clientAttributes: {
      name: true,
      dob: true,
      gender: true,
      height: true,
      weight: true,
      activity: true,
      bmi: true,
      bmr: true,
    },
  };

  const [preferences, setPreferences] = useState(defaultPreferences);

  useEffect(() => {
    const fetchUserPreferences = async () => {
      const userDocRef = doc(db, 'users', currentUser.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        if (userData.preferences) {
          setPreferences(userData.preferences);
        }
      }
    };

    fetchUserPreferences();
  }, [currentUser.uid]);

  const handleCheckboxChange = (section, attr = null) => {
    setPreferences(prev => {
      if (attr) {
        return {
          ...prev,
          clientAttributes: {
            ...prev.clientAttributes,
            [attr]: !prev.clientAttributes[attr],
          },
        };
      }
      return { ...prev, [section]: !prev[section] };
    });
  };

  const savePreferences = async () => {
    const userDocRef = doc(db, 'users', currentUser.uid);

    try {
      await updateDoc(userDocRef, { preferences });
      alert('Préférences sauvegardées avec succès.');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des préférences:', error);
      alert('Erreur lors de la sauvegarde des préférences.');
    }
  };

  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ padding: 4, marginTop: 4 }}>
        <Typography variant="h4" gutterBottom>Personnaliser la page Bilan</Typography>

        <Box mb={4}>
          <Typography variant="h6" gutterBottom>Sections à afficher</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={<Checkbox checked={preferences.showClientInfo} onChange={() => handleCheckboxChange('showClientInfo')} />}
                label="Afficher les informations du bénéficiaire"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={<Checkbox checked={preferences.showTestResults} onChange={() => handleCheckboxChange('showTestResults')} />}
                label="Afficher les résultats des tests"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={<Checkbox checked={preferences.showRecommendations} onChange={() => handleCheckboxChange('showRecommendations')} />}
                label="Afficher les recommandations"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={<Checkbox checked={preferences.showEvolutionGraph} onChange={() => handleCheckboxChange('showEvolutionGraph')} />}
                label="Afficher l'évolution de l'indice moyen"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={<Checkbox checked={preferences.showIndicesGraph} onChange={() => handleCheckboxChange('showIndicesGraph')} />}
                label="Afficher le graphique des indices"
              />
            </Grid>
          </Grid>
        </Box>

        <Box mb={4}>
          <Typography variant="h6" gutterBottom>Attributs des informations du client</Typography>
          <Grid container spacing={2}>
            {Object.keys(preferences.clientAttributes).map(attr => (
              <Grid item xs={12} sm={6} md={4} key={attr}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={preferences.clientAttributes[attr]}
                      onChange={() => handleCheckboxChange('clientAttributes', attr)}
                    />
                  }
                  label={`Afficher ${attr}`}
                />
              </Grid>
            ))}
          </Grid>
        </Box>

        <Box textAlign="center" mt={4}>
          <Button variant="contained" color="primary" onClick={savePreferences}>
            Sauvegarder
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}

export default UserPreferences;

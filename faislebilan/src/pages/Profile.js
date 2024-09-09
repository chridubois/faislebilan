import React from 'react';
import { Container, Typography, Button, Avatar, Grid, Paper, Box } from '@mui/material';
import { getAuth } from 'firebase/auth';

const Profile = () => {
  const auth = getAuth();
  const user = auth.currentUser;

  const handleLogout = () => {
    auth.signOut();
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 4 }}>
      <Paper elevation={3} sx={{ padding: 4, textAlign: 'center' }}>
        <Box mb={4}>
          <Typography variant="h4" gutterBottom>
            Mon Profil
          </Typography>
        </Box>

        {user ? (
          <Grid container spacing={3} justifyContent="center" alignItems="center">
            {/* Avatar de l'utilisateur */}
            <Grid item>
              <Avatar
                alt={user.displayName || 'User'}
                src={user.photoURL}
                sx={{ width: 100, height: 100, margin: 'auto' }}
              />
            </Grid>

            {/* Détails de l'utilisateur */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Nom : {user.displayName || 'Nom non fourni'}
              </Typography>
              <Typography variant="h6" gutterBottom>
                Email : {user.email}
              </Typography>
            </Grid>

            {/* Bouton de déconnexion */}
            <Grid item xs={12}>
              <Button
                variant="contained"
                color="secondary"
                onClick={handleLogout}
                sx={{ marginTop: 2 }}
                fullWidth
              >
                Déconnexion
              </Button>
            </Grid>
          </Grid>
        ) : (
          <Typography variant="body1">Aucun utilisateur connecté.</Typography>
        )}
      </Paper>
    </Container>
  );
};

export default Profile;

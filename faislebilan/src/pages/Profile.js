import React from 'react';
import { Container, Typography, Button } from '@mui/material';
import { getAuth } from 'firebase/auth';

const Profile = () => {
  const auth = getAuth();
  const user = auth.currentUser;

  const handleLogout = () => {
    auth.signOut();
  };

  return (
    <Container>
      <Typography variant="h4" component="h1" gutterBottom>
        Mon Profil
      </Typography>
      {user ? (
        <>
          <Typography variant="h6">Nom : {user.displayName || "Nom non fourni"}</Typography>
          <Typography variant="h6">Email : {user.email}</Typography>
          <Button variant="contained" color="secondary" onClick={handleLogout} style={{ marginTop: '20px' }}>
            Déconnexion
          </Button>
        </>
      ) : (
        <Typography variant="body1">Aucun utilisateur connecté.</Typography>
      )}
    </Container>
  );
};

export default Profile;

import React, { useState } from 'react';
import { Container, Typography, TextField, Button, Box, Grid } from '@mui/material';

function Support() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();

    // Logique de soumission (vous pouvez remplacer ceci par un appel à une API ou un service backend)
    console.log('Nom:', name);
    console.log('Email:', email);
    console.log('Sujet:', subject);
    console.log('Message:', message);

    // Réinitialiser le formulaire après soumission
    setName('');
    setEmail('');
    setSubject('');
    setMessage('');
  };

  return (
    <Container>
      <Typography variant="h4" component="h1" gutterBottom>
        Support
      </Typography>
      <Typography variant="body1" gutterBottom>
        Si vous avez des questions, des préoccupations ou avez besoin d'aide, veuillez remplir le formulaire ci-dessous et notre équipe de support vous répondra dès que possible.
      </Typography>

      <Box mt={4}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Nom"
                variant="outlined"
                fullWidth
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Email"
                type="email"
                variant="outlined"
                fullWidth
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Sujet"
                variant="outlined"
                fullWidth
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Message"
                variant="outlined"
                fullWidth
                multiline
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <Button type="submit" variant="contained" color="primary" fullWidth>
                Envoyer
              </Button>
            </Grid>
          </Grid>
        </form>
      </Box>

      <Box mt={4}>
        <Typography variant="h6">Informations de Contact</Typography>
        <Typography variant="body1">
          Vous pouvez également nous contacter directement via les coordonnées suivantes :
        </Typography>
        <Typography variant="body1">
          <strong>Email :</strong> support@example.com
        </Typography>
        <Typography variant="body1">
          <strong>Téléphone :</strong> +33 1 23 45 67 89
        </Typography>
        <Typography variant="body1">
          <strong>Adresse :</strong> 123 Rue de l'Exemple, 75000 Paris, France
        </Typography>
      </Box>
    </Container>
  );
}

export default Support;

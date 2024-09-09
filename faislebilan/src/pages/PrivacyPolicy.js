import React from 'react';
import { Container, Box, Typography, Paper } from '@mui/material';

const PrivacyPolicy = () => {
  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3}>
        <Box p={4}>
          <Typography variant="h4" component="h1" gutterBottom align="center">
            Politique de Confidentialité
          </Typography>

          <Box mt={3}>
            <Typography variant="h6" component="h2" gutterBottom>
              Introduction
            </Typography>
            <Typography variant="body1" paragraph>
              Bienvenue sur l'application <strong>faislebilan</strong>. Cette politique de confidentialité a pour but de vous
              informer de la manière dont nous collectons, utilisons, partageons et protégeons vos informations personnelles,
              notamment les données de santé.
            </Typography>
          </Box>

          <Box mt={3}>
            <Typography variant="h6" component="h2" gutterBottom>
              Les informations que nous collectons
            </Typography>
            <Typography variant="body1" paragraph>
              Nous collectons des informations personnelles qui incluent, sans s'y limiter :
            </Typography>
            <ul>
              <Typography component="li" variant="body1">Nom et prénom</Typography>
              <Typography component="li" variant="body1">Adresse e-mail</Typography>
              <Typography component="li" variant="body1">Données de santé (évaluations physiques, etc.)</Typography>
            </ul>
          </Box>

          <Box mt={3}>
            <Typography variant="h6" component="h2" gutterBottom>
              Comment nous utilisons vos informations
            </Typography>
            <Typography variant="body1" paragraph>
              Nous utilisons vos informations personnelles pour :
            </Typography>
            <ul>
              <Typography component="li" variant="body1">Fournir nos services, notamment les évaluations APA</Typography>
              <Typography component="li" variant="body1">Améliorer l'expérience utilisateur</Typography>
              <Typography component="li" variant="body1">Assurer la sécurité et la protection des données</Typography>
            </ul>
          </Box>

          <Box mt={3}>
            <Typography variant="h6" component="h2" gutterBottom>
              Partage des données
            </Typography>
            <Typography variant="body1" paragraph>
              Vos informations personnelles ne sont jamais vendues. Nous ne partageons vos données qu'avec des tiers lorsque cela est nécessaire pour fournir nos services ou pour se conformer aux exigences légales.
            </Typography>
          </Box>

          <Box mt={3}>
            <Typography variant="h6" component="h2" gutterBottom>
              Sécurité des données
            </Typography>
            <Typography variant="body1" paragraph>
              Nous mettons en œuvre des mesures de sécurité techniques et organisationnelles pour protéger vos données contre tout accès non autorisé, modification, divulgation ou destruction.
            </Typography>
          </Box>

          <Box mt={3}>
            <Typography variant="h6" component="h2" gutterBottom>
              Vos droits
            </Typography>
            <Typography variant="body1" paragraph>
              Conformément au RGPD, vous disposez des droits suivants concernant vos données personnelles :
            </Typography>
            <ul>
              <Typography component="li" variant="body1">Droit d'accès à vos données</Typography>
              <Typography component="li" variant="body1">Droit de rectification</Typography>
              <Typography component="li" variant="body1">Droit à l'effacement</Typography>
              <Typography component="li" variant="body1">Droit à la portabilité des données</Typography>
              <Typography component="li" variant="body1">Droit de limiter le traitement</Typography>
            </ul>
            <Typography variant="body1" paragraph>
              Pour exercer vos droits, vous pouvez nous contacter à l'adresse e-mail suivante : [adresse email].
            </Typography>
          </Box>

          <Box mt={3}>
            <Typography variant="h6" component="h2" gutterBottom>
              Durée de conservation des données
            </Typography>
            <Typography variant="body1" paragraph>
              Nous conservons vos informations personnelles aussi longtemps que nécessaire pour fournir nos services ou conformément aux exigences légales.
            </Typography>
          </Box>

          <Box mt={3}>
            <Typography variant="h6" component="h2" gutterBottom>
              Modifications de cette politique de confidentialité
            </Typography>
            <Typography variant="body1" paragraph>
              Nous nous réservons le droit de modifier cette politique de confidentialité à tout moment. Nous vous informerons de toute modification par e-mail ou via une notification sur l'application.
            </Typography>
          </Box>

          <Box mt={3}>
            <Typography variant="h6" component="h2" gutterBottom>
              Nous contacter
            </Typography>
            <Typography variant="body1" paragraph>
              Si vous avez des questions concernant cette politique de confidentialité, vous pouvez nous contacter à l'adresse e-mail suivante : hellochristophedubois@gmail.com
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default PrivacyPolicy;

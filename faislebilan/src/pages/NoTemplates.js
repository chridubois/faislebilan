import React from 'react';
import { Container, Typography, Button, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';

function NoTemplates() {
  const navigate = useNavigate();

  const handleCreateTemplate = () => {
    navigate('/create-bilan-template');
  };

  return (
    <Container>
      <Box mt={5} textAlign="center">
        <Typography variant="h5" gutterBottom>
          Vous n'avez pas encore créé de modèle de Bilan
        </Typography>
        <Typography variant="body1" gutterBottom>
          Pour créer un bilan, vous devez d'abord créer un modèle de Bilan.
        </Typography>
        <Button variant="contained" color="primary" onClick={handleCreateTemplate}>
          Créer un modèle de Bilan
        </Button>
      </Box>
    </Container>
  );
}

export default NoTemplates;

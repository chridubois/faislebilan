// src/pages/ListeClients.js
import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Container, Typography, Card, CardContent, Grid, Button, Box } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';

function ListeClients() {
  const [clients, setClients] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchClients = async () => {
      const clientsCollection = collection(db, 'clients');
      const clientSnapshot = await getDocs(clientsCollection);
      const clientList = clientSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setClients(clientList);
    };

    fetchClients();
  }, []);

  const handleCreateClient = () => {
    navigate('/funnel');
  };

  return (
    <Container>
      <Helmet>
        <title>Liste Clients</title>
      </Helmet>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4" component="h1">
          Liste des clients
        </Typography>
        <Button variant="contained" color="primary" onClick={handleCreateClient}>
          Créer un client
        </Button>
      </Box>

      <Grid container spacing={4}>
        {clients.map((client) => (
          <Grid item xs={12} sm={6} md={4} key={client.id}>
            <Card
              component={Link}
              to={`/client/${client.id}`}
              style={{
                backgroundColor: '#e0e0e0', // Forcer la couleur de fond
                textDecoration: 'none',
                cursor: 'pointer',
                transition: 'background-color 0.3s ease',
                '&:hover': {
                  backgroundColor: '#d3d3d3', // Forcer la couleur de fond au survol
                },
              }}
            >
              <CardContent>
                <Typography variant="h6" style={{ color: '#34495e' }}>
                  {client.name}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Date de naissance : {client.dob}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}

export default ListeClients;

// src/pages/Home.js

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Typography, Button, Container, Card, CardContent, Grid, Box, Snackbar } from '@mui/material';
import { Helmet } from 'react-helmet';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';

function Home() {
  const navigate = useNavigate();
  const [recentBilans, setRecentBilans] = useState([]);
  const [notificationOpen, setNotificationOpen] = useState(false);

  useEffect(() => {
    const fetchRecentBilans = async () => {
      const bilansRef = collection(db, 'bilans');
      const q = query(bilansRef, orderBy('createdAt', 'desc'), limit(5));
      const querySnapshot = await getDocs(q);
      const bilans = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRecentBilans(bilans);
    };

    fetchRecentBilans();
  }, []);

  const handleStart = () => {
    navigate('/funnel');
  };

  const handleViewBilan = (id) => {
    navigate(`/bilan/${id}`);
  };

  const handleNotificationClose = () => {
    setNotificationOpen(false);
  };

  return (
    <>
      <Helmet>
        <title>Faislebilan</title>
      </Helmet>
      <Container
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
          marginTop: '40px',
          padding: '20px',
        }}
      >
        <Typography variant="h4" gutterBottom>
          Bienvenue sur Faislebilan !
        </Typography>
        <Typography variant="body1" paragraph>
          Une application simple pour gérer vos bilans de forme physique.
        </Typography>
        <Button
          variant="contained"
          color="primary"
          size="large"
          onClick={() => {
            handleStart();
            setNotificationOpen(true);  // Ouvre la notification lors du clic
          }}
          style={{ backgroundColor: '#2980b9', marginTop: '20px' }}
        >
          Lancer un bilan
        </Button>

        <Typography variant="h5" style={{ marginTop: '40px' }}>
          Bilans Récents
        </Typography>
        <Grid container spacing={3} style={{ marginTop: '20px' }}>
          {recentBilans.map((bilan) => (
            <Grid item xs={12} sm={6} md={4} key={bilan.id}>
              <Card
                onClick={() => handleViewBilan(bilan.id)}
                style={{
                  cursor: 'pointer',
                  backgroundColor: '#ecf0f1',
                  boxShadow: '0 4px 8px 0 rgba(0, 0, 0, 0.2)',
                  transition: '0.3s',
                  '&:hover': { boxShadow: '0 8px 16px 0 rgba(0, 0, 0, 0.2)' },
                }}
              >
                <CardContent>
                  <Typography variant="h6" style={{ color: '#34495e' }}>{bilan.clientName}</Typography> {/* Remplacez par le bon champ */}
                  <Typography variant="body2" color="textSecondary">
                    Date: {new Date(bilan.createdAt.toDate()).toLocaleDateString()}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Section Aide Rapide */}
        <Box style={{ marginTop: '60px', width: '100%', textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>
            Besoin d'aide ?
          </Typography>
          <Typography variant="body2" color="textSecondary" paragraph>
            Consultez notre <a href="/faq" style={{ color: '#2980b9' }}>FAQ</a> ou contactez notre <a href="/support" style={{ color: '#2980b9' }}>support</a> pour obtenir de l'aide.
          </Typography>
        </Box>
      </Container>

      {/* Snackbar pour la notification */}
      <Snackbar
        open={notificationOpen}
        autoHideDuration={3000}
        onClose={handleNotificationClose}
        message="Bilan lancé avec succès !"
      />
    </>
  );
}

export default Home;

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Typography, Button, Container, Card, CardContent, Grid, Box, Snackbar } from '@mui/material';
import { Helmet } from 'react-helmet';
import { collection, query, orderBy, limit, getDocs, doc, getDoc, where } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../hooks/useAuth';
import { Carousel } from 'react-responsive-carousel';
import 'react-responsive-carousel/lib/styles/carousel.min.css';
import image1 from '../images/carrousel1.png';
import image2 from '../images/carrousel2.png';
import image3 from '../images/carrousel3.png';

function Home() {
  const navigate = useNavigate();
  const { isAuthenticated, currentUser } = useAuth();
  const [recentBilans, setRecentBilans] = useState([]);
  const [notificationOpen, setNotificationOpen] = useState(false);

  useEffect(() => {
    const fetchRecentBilans = async () => {
      if (isAuthenticated) {
        const bilansRef = collection(db, 'bilans');
        const q = query(bilansRef, where('userId', '==', currentUser.uid), orderBy('createdAt', 'desc'), limit(5));
        const querySnapshot = await getDocs(q);

        const bilans = await Promise.all(
          querySnapshot.docs.map(async (bilanDoc) => {
            const bilanData = bilanDoc.data();
            const clientDocRef = doc(db, 'clients', bilanData.clientId);
            const clientDocSnap = await getDoc(clientDocRef);

            let clientName = 'Client inconnu';
            if (clientDocSnap.exists()) {
              const clientData = clientDocSnap.data();
              clientName = clientData.name || 'Client sans nom';
            }

            return { id: bilanDoc.id, clientName, createdAt: bilanData.createdAt };
          })
        );

        setRecentBilans(bilans);
      }
    };

    fetchRecentBilans();
  }, [isAuthenticated, currentUser]);

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

      {/* Full-width Carousel */}
      <Box sx={{ width: '100vw', position: 'relative', left: '50%', right: '50%', marginLeft: '-50vw', marginRight: '-50vw', my: 4 }}>
        <Carousel showThumbs={false} autoPlay interval={3000} infiniteLoop>
          <div>
            <img src={image1} alt="Étape 1" style={{ width: '100%', height: 'auto', objectFit: 'cover' }} />
            {/* <p className="legend">Étape 1: Créez un bilan en quelques clics</p> */}
          </div>
          <div>
            <img src={image2} alt="Étape 2" style={{ width: '100%', height: 'auto', objectFit: 'cover' }} />
            {/* <p className="legend">Étape 2: Suivez vos progrès avec des graphiques détaillés</p> */}
          </div>
          <div>
            <img src={image3} alt="Étape 3" style={{ width: '100%', height: 'auto', objectFit: 'cover' }} />
            {/* <p className="legend">Étape 3: Recevez des recommandations personnalisées</p> */}
          </div>
        </Carousel>
      </Box>

      <Container
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
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
            setNotificationOpen(true);
          }}
          style={{ backgroundColor: '#2980b9', marginTop: '20px' }}
        >
          Lancer un bilan
        </Button>

        {isAuthenticated && recentBilans.length > 0 && (
          <>
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
                      <Typography variant="h6" style={{ color: '#34495e' }}>{bilan.clientName}</Typography>
                      <Typography variant="body2" color="textSecondary">
                        Date: {new Date(bilan.createdAt.toDate()).toLocaleDateString()}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </>
        )}

        <Box style={{ marginTop: '60px', width: '100%', textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>
            Besoin d'aide ?
          </Typography>
          <Typography variant="body2" color="textSecondary" paragraph>
            Consultez notre <a href="/faq" style={{ color: '#2980b9' }}>FAQ</a> ou contactez notre <a href="/support" style={{ color: '#2980b9' }}>support</a> pour obtenir de l'aide.
          </Typography>
        </Box>
      </Container>

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

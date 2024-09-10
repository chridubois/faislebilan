import React, { useState } from 'react';
import { AppBar, Toolbar, IconButton, Button, Grid, Typography, Drawer, List, ListItem, ListItemText, Box, Container } from '@mui/material';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import logo from '../images/faislebilan.png';  // Assure-toi d'avoir un logo contrasté
import screenshot1 from '../images/screenshot1.png';  // Assure-toi d'avoir une capture d'écran
import iconEvaluation from '../images/icon-evaluation.png';  // Assure-toi d'avoir des icônes
import iconPlanning from '../images/icon-planning.png';  // Assure-toi d'avoir des icônes
import iconFollowup from '../images/icon-followup.png';  // Assure-toi d'avoir des icônes

function Home() {
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const toggleDrawer = () => {
    setDrawerOpen(!drawerOpen);
  };

  return (
    <Box sx={{ backgroundColor: '#2C3E50', minHeight: '100vh', py: 5, color: '#FFFFFF' }}>
      {/* En-tête avec AppBar */}
      <AppBar position="static" sx={{ backgroundColor: '#2C3E50', mb: 5 }} elevation={0}>
        <Container maxWidth="xl">
          <Toolbar sx={{ justifyContent: 'space-between' }}>
            {/* Logo */}
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <RouterLink to="/" style={{ textDecoration: 'none' }}> {/* Ajoute le lien vers la home */}
                <img src={logo} alt="faislebilan logo" style={{ height: 40 }} />
              </RouterLink>
            </Box>

            {/* Boutons pour les écrans larges */}
            <Box sx={{ display: { xs: 'none', md: 'block' } }}>
              <Button
                variant="outlined"
                sx={{
                  mr: 2,
                  color: '#FF5722',
                  borderColor: '#FF5722',
                  '&:hover': {
                    backgroundColor: '#FF5722',
                    color: '#fff',
                  },
                }}
                onClick={() => navigate('/signup')}
              >
                Créer un compte
              </Button>
              <Button
                variant="contained"
                sx={{
                  backgroundColor: '#FF5722',
                  color: '#fff',
                  '&:hover': {
                    backgroundColor: '#FF7043',
                  },
                }}
                onClick={() => navigate('/login')}
              >
                Se connecter
              </Button>
            </Box>

            {/* Menu burger pour les écrans plus petits */}
            <IconButton
              color="inherit"
              edge="end"
              onClick={toggleDrawer}
              sx={{ display: { xs: 'block', md: 'none' } }}
            >
              <MenuIcon />
            </IconButton>
          </Toolbar>
        </Container>
      </AppBar>

      {/* Drawer/Menu burger */}
      <Drawer anchor="right" open={drawerOpen} onClose={toggleDrawer}>
        <Box
          sx={{
            width: 250,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            height: '100%',
          }}
        >
          <IconButton onClick={toggleDrawer} sx={{ alignSelf: 'flex-end', m: 2 }}>
            <CloseIcon />
          </IconButton>

          <List>
            <ListItem button onClick={() => { navigate('/login'); toggleDrawer(); }}>
              <ListItemText primary="Créer un compte" />
            </ListItem>
            <ListItem button onClick={() => { navigate('/login'); toggleDrawer(); }}>
              <ListItemText primary="Se connecter" />
            </ListItem>
          </List>
        </Box>
      </Drawer>

      <Box height={94} />  {/* Espace pour le logo et les boutons */}

      {/* Section titre et sous-titre */}
      <Container maxWidth="lg">
        <Box textAlign="center" mb={6}>
          <Typography variant="h2" fontWeight="bold" gutterBottom>
            La solution <span style={{ color: '#FF5722' }}>n°1</span> pour les enseignants APA
          </Typography>
          <Typography variant="h5" color="textSecondary" sx={{ maxWidth: 800, margin: '0 auto', color: '#B0BEC5' }}>
            Évaluez, planifiez et suivez vos bilans APA plus facilement que jamais.
          </Typography>
          <Box mt={4}>
            <Button
              variant="contained"
              size="large"
              sx={{
                mr: 2,
                backgroundColor: '#FF5722',
                color: '#fff',
                boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)',
                '&:hover': {
                  backgroundColor: '#FF7043',
                  boxShadow: '0px 6px 15px rgba(0, 0, 0, 0.2)',
                },
              }}
              onClick={() => navigate('/login')}
            >
              Essayer gratuitement
            </Button>
            <Button
              variant="outlined"
              size="large"
              sx={{
                color: '#FF5722',
                borderColor: '#FF5722',
                boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)',
                '&:hover': {
                  backgroundColor: '#FF5722',
                  color: '#fff',
                  boxShadow: '0px 6px 15px rgba(0, 0, 0, 0.2)',
                },
              }}
              onClick={() => window.open('https://calendly.com/hellochristophedubois/call-decouverte', '_blank')}
            >
              Demander une démo
            </Button>
          </Box>
          <Typography variant="caption" color="textSecondary" mt={2} sx={{ color: '#B0BEC5' }}>
            14 jours d'essai gratuit. Pas besoin de CB.
          </Typography>
        </Box>

        {/* Capture d'écran centrée */}
        <Box textAlign="center" mb={8} sx={{ display: 'flex', justifyContent: 'center' }}>
          <img src={screenshot1} alt="faislebilan demo" style={{ width: '100%', maxWidth: '900px', borderRadius: 8, boxShadow: '0px 4px 12px rgba(0,0,0,0.1)' }} />
        </Box>

        {/* Section fonctionnalités avec icônes centrées */}
        <Box mb={8}>
          <Typography variant="h4" textAlign="center" fontWeight="bold" mb={6}>
            Tout ce dont vous avez besoin pour gérer vos bilans APA
          </Typography>
          <Grid container spacing={4} justifyContent="center" alignItems="center">
            <Grid item xs={12} sm={6} md={4}>
              <Box display="flex" flexDirection="column" alignItems="center" textAlign="center">
                <img src={iconEvaluation} alt="icon" style={{ height: 80, marginBottom: '16px' }} />
                <Typography variant="h6" fontWeight="bold" color="#fff">
                  Évaluation personnalisée
                </Typography>
                <Typography color="#B0BEC5">
                  Créez des bilans adaptés aux besoins de chaque élève.
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Box display="flex" flexDirection="column" alignItems="center" textAlign="center">
                <img src={iconPlanning} alt="icon" style={{ height: 80, marginBottom: '16px' }} />
                <Typography variant="h6" fontWeight="bold" color="#fff">
                  Planification simplifiée
                </Typography>
                <Typography color="#B0BEC5">
                  Organisez et planifiez vos bilans en quelques clics.
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Box display="flex" flexDirection="column" alignItems="center" textAlign="center">
                <img src={iconFollowup} alt="icon" style={{ height: 80, marginBottom: '16px' }} />
                <Typography variant="h6" fontWeight="bold" color="#fff">
                  Suivi des résultats
                </Typography>
                <Typography color="#B0BEC5">
                  Suivez les progrès de vos élèves et ajustez les bilans.
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Box>

        {/* Témoignages / Preuve sociale avec fond blanc */}
        <Box mb={8} textAlign="center">
          <Typography variant="h4" fontWeight="bold" mb={6} color="#fff">
            Des enseignants APA nous font déjà confiance
          </Typography>
          <Grid container spacing={4} justifyContent="center">
            <Grid item xs={12} sm={6} md={4}>
              <Box
                p={3}
                borderRadius={4}
                sx={{
                  backgroundColor: '#FFF',
                  color: '#2C3E50',
                  boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)',
                  border: '1px solid rgba(0, 0, 0, 0.05)',
                  '&:hover': {
                    transform: 'scale(1.02)',
                    boxShadow: '0px 6px 15px rgba(0, 0, 0, 0.2)',
                  },
                  transition: '0.3s ease-in-out',
                }}
              >
                <Typography variant="body1" color="textSecondary">
                  "faislebilan a changé ma façon d'évaluer mes élèves. Tout est plus simple et rapide."
                </Typography>
                <Typography variant="subtitle2" fontWeight="bold" mt={2} color="#2C3E50">
                  - Sarah P., Enseignante APA
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Box
                p={3}
                borderRadius={4}
                sx={{
                  backgroundColor: '#FFF',
                  color: '#2C3E50',
                  boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)',
                  border: '1px solid rgba(0, 0, 0, 0.05)',
                  '&:hover': {
                    transform: 'scale(1.02)',
                    boxShadow: '0px 6px 15px rgba(0, 0, 0, 0.2)',
                  },
                  transition: '0.3s ease-in-out',
                }}
              >
                <Typography variant="body1" color="textSecondary">
                  "Je ne peux plus m'en passer. Tout est optimisé pour mon travail quotidien."
                </Typography>
                <Typography variant="subtitle2" fontWeight="bold" mt={2} color="#2C3E50">
                  - Jean L., Enseignant APA
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Box
                p={3}
                borderRadius={4}
                sx={{
                  backgroundColor: '#FFF',
                  color: '#2C3E50',
                  boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)',
                  border: '1px solid rgba(0, 0, 0, 0.05)',
                  '&:hover': {
                    transform: 'scale(1.02)',
                    boxShadow: '0px 6px 15px rgba(0, 0, 0, 0.2)',
                  },
                  transition: '0.3s ease-in-out',
                }}
              >
                <Typography variant="body1" color="textSecondary">
                  "L'outil idéal pour gérer mes bilans APA, je recommande chaudement !"
                </Typography>
                <Typography variant="subtitle2" fontWeight="bold" mt={2} color="#2C3E50">
                  - Sophie M., Enseignante APA
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Box
                p={3}
                borderRadius={4}
                sx={{
                  backgroundColor: '#FFF',
                  color: '#2C3E50',
                  boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)',
                  border: '1px solid rgba(0, 0, 0, 0.05)',
                  '&:hover': {
                    transform: 'scale(1.02)',
                    boxShadow: '0px 6px 15px rgba(0, 0, 0, 0.2)',
                  },
                  transition: '0.3s ease-in-out',
                }}
              >
                <Typography variant="body1" color="textSecondary">
                  "Facile à utiliser, complet et intuitif, faislebilan est un atout au quotidien."
                </Typography>
                <Typography variant="subtitle2" fontWeight="bold" mt={2} color="#2C3E50">
                  - Pierre D., Enseignant APA
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Box>


        {/* Appel final à l'action */}
        <Box textAlign="center" py={6} sx={{ bgcolor: '#1A2B3C' }}>
          <Typography variant="h5" fontWeight="bold" mb={4} color="#E1F5FE">
            Rejoignez des centaines d'enseignants APA qui utilisent faislebilan
          </Typography>
          <Button
            variant="contained"
            size="large"
            sx={{
              backgroundColor: '#FF5722',
              color: '#fff',
              boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)',
              '&:hover': {
                backgroundColor: '#FF7043',
                boxShadow: '0px 6px 15px rgba(0, 0, 0, 0.2)',
              },
            }}
            onClick={() => navigate('/login')}
          >
            Commencer dès maintenant
          </Button>
        </Box>
      </Container>
    </Box>
  );
}

export default Home;

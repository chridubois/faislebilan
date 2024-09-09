import React, { useState } from 'react';
import { Box, Drawer, List, ListItem, ListItemText, Divider, CssBaseline, Avatar, Button, Typography, IconButton, AppBar, Toolbar, ListItemIcon, ListSubheader } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import AssignmentIcon from '@mui/icons-material/Assignment';
import FormIcon from '@mui/icons-material/Description';
import SettingsIcon from '@mui/icons-material/Settings';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import logo from '../images/faislebilan.png'; // Chemin vers le logo Faislebilan
import { getAuth } from 'firebase/auth';
import { useAuth } from '../hooks/useAuth';

const drawerWidth = 240;

function Layout({ children }) {
  const auth = getAuth();
  const { isAuthenticated, isAdmin } = useAuth();
  const navigate = useNavigate(); // Pour naviguer vers la page de profil
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleProfileClick = () => {
    navigate('/profile'); // Redirige vers la page de profil
  };

  const handleCreateBilan = () => {
    navigate('/funnel'); // Redirige vers la page de création d'un bilan
  };

  const drawerContent = (
    <div style={{ backgroundColor: '#A7C3CA', height: '100%', display: 'flex', flexDirection: 'column' }}> {/* Couleur de fond et flex layout */}
      {/* Logo en haut */}
      <Box display="flex" justifyContent="center" alignItems="center" p={2}>
        <Link to="/dashboard">
          <img src={logo} alt="Faislebilan Logo" style={{ width: '150px', cursor: 'pointer' }} />
        </Link>
      </Box>

      <Divider />

      {/* Titre pour la section de navigation */}
      <List
        subheader={
          <ListSubheader component="div" sx={{ backgroundColor: 'inherit', fontWeight: 'bold', fontSize: '16px' }}>
            Navigation
          </ListSubheader>
        }
      >
        {isAuthenticated && (
          <>
            <ListItem button component={Link} to="/dashboard">
              <ListItemIcon>
                <DashboardIcon />
              </ListItemIcon>
              <ListItemText primary="Dashboard" />
            </ListItem>

            <ListItem button component={Link} to="/clients">
              <ListItemIcon>
                <PeopleIcon />
              </ListItemIcon>
              <ListItemText primary="Clients" />
            </ListItem>

            {/* Mettre en avant le bouton "Créer un bilan" */}
            <Box p={2} display="flex" justifyContent="center">
              <Button
                variant="contained"
                color="primary"
                size="large"
                startIcon={<AddCircleIcon />}  // Icone "Créer un bilan"
                sx={{ width: '100%', backgroundColor: '#FF5722', '&:hover': { backgroundColor: '#FF7043' } }}
                onClick={handleCreateBilan}
              >
                Créer un bilan
              </Button>
            </Box>
          </>
        )}
        {!isAuthenticated && (
          <ListItem button component={Link} to="/login">
            <ListItemIcon>
              <AccountCircleIcon />
            </ListItemIcon>
            <ListItemText primary="Se connecter" />
          </ListItem>
        )}
      </List>

      {isAdmin && (
        <>
          <Divider />

          {/* Titre pour la section de gestion */}
          <List
            subheader={
              <ListSubheader component="div" sx={{ backgroundColor: 'inherit', fontWeight: 'bold', fontSize: '16px' }}>
                Gestion
              </ListSubheader>
            }
          >
            <ListItem button component={Link} to="/bilan-templates">
              <ListItemIcon>
                <AssignmentIcon />
              </ListItemIcon>
              <ListItemText primary="Bilans" />
            </ListItem>

            <ListItem button component={Link} to="/manage-forms">
              <ListItemIcon>
                <FormIcon />
              </ListItemIcon>
              <ListItemText primary="Formulaires" />
            </ListItem>

            <ListItem button component={Link} to="/preferences">
              <ListItemIcon>
                <SettingsIcon />
              </ListItemIcon>
              <ListItemText primary="Préférences" />
            </ListItem>
          </List>
        </>
      )}

      {/* Cet espace poussera la section "Compte" en bas */}
      <Box sx={{ flexGrow: 1 }} />

      {isAuthenticated && (
        <>
          <Divider />

          {/* Titre pour la section du compte */}
          <Box p={2}>
            <Typography variant="body1" fontWeight="bold">
              Compte
            </Typography>
            {/* Lors du clic sur le nom ou l'avatar, on est redirigé vers la page de profil */}
            <Box display="flex" alignItems="center" p={1} onClick={handleProfileClick} sx={{ cursor: 'pointer' }}>
              <Avatar sx={{ marginRight: '8px' }} alt={auth?.currentUser?.displayName || 'User'} src={auth?.currentUser?.photoURL} />
              <Typography variant="body1">{auth?.currentUser?.displayName || 'Profil'}</Typography>
            </Box>
          </Box>
        </>
      )}
    </div>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />

      {/* AppBar visible uniquement sur mobile */}
      <AppBar position="fixed" sx={{ display: { xs: 'block', sm: 'none' }, backgroundColor: '#A7C3CA' }}>
        <Toolbar>
          {/* Logo dans l'AppBar mobile */}
          <Box display="flex" justifyContent="center" alignItems="center" flexGrow={1}>
            <Link to="/dashboard">
              <img src={logo} alt="Faislebilan Logo" style={{ width: '120px', cursor: 'pointer' }} />
            </Link>
          </Box>

          {/* Bouton menu burger à droite */}
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="end"
            onClick={handleDrawerToggle}
          >
            <MenuIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Drawer permanent pour les grands écrans */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', sm: 'block' }, // Drawer permanent pour les grands écrans
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': { width: drawerWidth, boxSizing: 'border-box', backgroundColor: '#A7C3CA' }, // Couleur personnalisée
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Drawer temporaire pour les petits écrans */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle} // Ferme le Drawer lorsqu'on clique à l'extérieur
        ModalProps={{
          keepMounted: true, // Améliore les performances sur mobile
        }}
        sx={{
          display: { xs: 'block', sm: 'none' }, // Drawer temporaire pour les petits écrans
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, backgroundColor: '#A7C3CA' }, // Couleur personnalisée
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Contenu principal */}
      <Box
        component="main"
        sx={{ flexGrow: 1, p: 3, mt: { xs: '64px', sm: '0px' } }} // Espacement pour la AppBar en mobile
      >
        {children}
      </Box>
    </Box>
  );
}

export default Layout;

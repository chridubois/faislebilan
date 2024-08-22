import React, { useState } from 'react';
import { AppBar, Toolbar, Typography, Button, IconButton, Menu, MenuItem, Box } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LogoutIcon from '@mui/icons-material/Logout';
import { Link } from 'react-router-dom';
import logo from '../images/faislebilan.png';
import AddIcon from '@mui/icons-material/Add';
import PeopleIcon from '@mui/icons-material/People';
import ListAltIcon from '@mui/icons-material/ListAlt';
import DashboardIcon from '@mui/icons-material/Dashboard';
import { getAuth } from 'firebase/auth';
import { useAuth } from '../hooks/useAuth';

function Header() {
  const [anchorEl, setAnchorEl] = useState(null);
  const auth = getAuth();
  const { isAuthenticated, isAdmin } = useAuth();

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    auth.signOut();
  };

  return (
    <AppBar position="static" sx={{ backgroundColor: '#A7C3CA' }}>
      <Toolbar style={{ display: 'flex', justifyContent: 'space-between' }}>
        <Typography variant="h6" component="div">
          <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
            <img src={logo} alt="Faislebilan Logo" style={{ height: '30px' }} />
          </Link>
        </Typography>

        {/* Masquer les liens sur petits écrans */}
        <Box sx={{ display: { xs: 'none', sm: 'flex' }, justifyContent: 'flex-end', flexGrow: 1 }}>
          {isAuthenticated && isAdmin && (
            <Button color="inherit" component={Link} to="/admin" startIcon={<DashboardIcon />}>
              Administration
            </Button>
          )}
          {isAuthenticated ? (
            <>
              <Button color="inherit" component={Link} to="/funnel" startIcon={<AddIcon />}>
                Créer un bilan
              </Button>
              <Button color="inherit" component={Link} to="/clients" startIcon={<PeopleIcon />}>
                Liste des clients
              </Button>
              <Button color="inherit" component={Link} to="/bilans" startIcon={<ListAltIcon />}>
                Liste des bilans
              </Button>
              <Button color="inherit" component={Link} to="/bilan-templates" startIcon={<ListAltIcon />}>
                Gestion de bilans
              </Button>
              <Button color="inherit" component={Link} to="/dashboard" startIcon={<ListAltIcon />}>
                Dashboard
              </Button>
              <Button color="inherit" component={Link} to="/preferences" startIcon={<ListAltIcon />}>
                Préférences
              </Button>
              <IconButton color="inherit" component={Link} to="/profile">
                <AccountCircleIcon />
              </IconButton>
              <IconButton color="inherit" onClick={handleLogout}>
                <LogoutIcon />
              </IconButton>
            </>
          ) : (
            <>
              <Button color="inherit" component={Link} to="/funnel" startIcon={<AddIcon />}>
                Créer un bilan
              </Button>
              <Button color="inherit" component={Link} to="/login">
                Se connecter
              </Button>
            </>
          )}
        </Box>

        {/* Menu burger pour les petits écrans */}
        <Box sx={{ display: { xs: 'block', sm: 'none' } }}>
          <IconButton
            edge="start"
            color="inherit"
            aria-label="menu"
            onClick={handleMenuOpen}
          >
            <MenuIcon />
          </IconButton>
        </Box>

        {/* Menu déroulant */}
        <Menu
          id="menu-appbar"
          anchorEl={anchorEl}
          anchorOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          keepMounted
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          {isAuthenticated && isAdmin && (
            <MenuItem onClick={handleMenuClose} component={Link} to="/admin">
              Administration
            </MenuItem>
          )}
          {isAuthenticated ? (
            <>
              <MenuItem onClick={handleMenuClose} component={Link} to="/funnel">
                Créer un bilan
              </MenuItem>
              <MenuItem onClick={handleMenuClose} component={Link} to="/clients">
                Liste des clients
              </MenuItem>
              <MenuItem onClick={handleMenuClose} component={Link} to="/bilans">
                Liste des bilans
              </MenuItem>
              <MenuItem onClick={handleMenuClose} component={Link} to="/bilan-templates">
                Gestion de bilans
              </MenuItem>
              <MenuItem onClick={handleMenuClose} component={Link} to="/dashboard">
                Dashboard
              </MenuItem>
              <MenuItem onClick={handleMenuClose} component={Link} to="/preferences">
                Préférences
              </MenuItem>
              <MenuItem onClick={handleMenuClose} component={Link} to="/profile">
                Mon profil
              </MenuItem>
              <MenuItem onClick={handleLogout}>
                Se déconnecter
              </MenuItem>
            </>
          ) : (
            <>
              <MenuItem onClick={handleMenuClose} component={Link} to="/funnel">
                Créer un bilan
              </MenuItem>
              <MenuItem onClick={handleMenuClose} component={Link} to="/login">
                Se connecter
              </MenuItem>
            </>
          )}
        </Menu>
      </Toolbar>
    </AppBar>
  );
}

export default Header;

import React, { useState } from 'react';
import { AppBar, Toolbar, Typography, Button, IconButton, Menu, MenuItem, Box, Popover } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LogoutIcon from '@mui/icons-material/Logout';
import { Link } from 'react-router-dom';
import logo from '../images/faislebilan.png';
import { getAuth } from 'firebase/auth';
import { useAuth } from '../hooks/useAuth';

function Header() {
  const [anchorEl, setAnchorEl] = useState(null);
  const [clientsSubmenuAnchorEl, setClientsSubmenuAnchorEl] = useState(null);
  const [adminSubmenuAnchorEl, setAdminSubmenuAnchorEl] = useState(null);
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

  const handleClientsSubmenuOpen = (event) => {
    if (adminSubmenuAnchorEl) {
      setAdminSubmenuAnchorEl(null);
    }
    setClientsSubmenuAnchorEl(event.currentTarget);
  };

  const handleClientsSubmenuClose = () => {
    setClientsSubmenuAnchorEl(null);
  };

  const handleAdminSubmenuOpen = (event) => {
    if (clientsSubmenuAnchorEl) {
      setClientsSubmenuAnchorEl(null);
    }
    setAdminSubmenuAnchorEl(event.currentTarget);
  };

  const handleAdminSubmenuClose = () => {
    setAdminSubmenuAnchorEl(null);
  };

  return (
    <AppBar position="static" sx={{ backgroundColor: '#A7C3CA' }}>
      <Toolbar style={{ display: 'flex', justifyContent: 'space-between' }}>
        <Typography variant="h6" component="div">
          <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
            <img src={logo} alt="Faislebilan Logo" style={{ height: '30px' }} />
          </Link>
        </Typography>

        {/* Desktop Menu */}
        <Box sx={{ display: { xs: 'none', sm: 'flex' }, justifyContent: 'flex-end', flexGrow: 1 }}>
          {isAuthenticated && (
            <>
              <Button color="inherit" component={Link} to="/dashboard">
                Dashboard
              </Button>

              {/* Sous-menu Clients */}
              <Box
                onMouseEnter={handleClientsSubmenuOpen}
                onMouseLeave={handleClientsSubmenuClose}
              >
                <Button color="inherit">
                  Clients
                </Button>
                <Popover
                  open={Boolean(clientsSubmenuAnchorEl)}
                  anchorEl={clientsSubmenuAnchorEl}
                  onClose={handleClientsSubmenuClose}
                  anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'left',
                  }}
                  transformOrigin={{
                    vertical: 'top',
                    horizontal: 'left',
                  }}
                >
                  <MenuItem
                    onClick={handleClientsSubmenuClose}
                    component={Link}
                    to="/funnel"
                  >
                    Créer un bilan
                  </MenuItem>
                  <MenuItem
                    onClick={handleClientsSubmenuClose}
                    component={Link}
                    to="/clients"
                  >
                    Liste Clients
                  </MenuItem>
                </Popover>
              </Box>

              {/* Sous-menu Administration */}
              <Box
                onMouseEnter={handleAdminSubmenuOpen}
                onMouseLeave={handleAdminSubmenuClose}
              >
                <Button color="inherit">
                  Administration
                </Button>
                <Popover
                  open={Boolean(adminSubmenuAnchorEl)}
                  anchorEl={adminSubmenuAnchorEl}
                  onClose={handleAdminSubmenuClose}
                  anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'left',
                  }}
                  transformOrigin={{
                    vertical: 'top',
                    horizontal: 'left',
                  }}
                >
                  <MenuItem
                    onClick={handleAdminSubmenuClose}
                    component={Link}
                    to="/bilan-templates"
                  >
                    Gestion Bilans
                  </MenuItem>
                  <MenuItem
                    onClick={handleAdminSubmenuClose}
                    component={Link}
                    to="/manage-forms"
                  >
                    Gestion Formulaires
                  </MenuItem>
                  <MenuItem
                    onClick={handleAdminSubmenuClose}
                    component={Link}
                    to="/preferences"
                  >
                    Préférences
                  </MenuItem>
                  {isAdmin && (
                    <MenuItem onClick={handleMenuClose} component={Link} to="/admin">
                      Administration
                    </MenuItem>
                  )}
                </Popover>
              </Box>

              <IconButton color="inherit" component={Link} to="/profile">
                <AccountCircleIcon />
              </IconButton>
              <IconButton color="inherit" onClick={handleLogout}>
                <LogoutIcon />
              </IconButton>
            </>
          )}
          {!isAuthenticated && (
            <Button color="inherit" component={Link} to="/login">
              Se connecter
            </Button>
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
          {isAuthenticated && (
            <>
              <MenuItem onClick={handleMenuClose} component={Link} to="/dashboard">
                Dashboard
              </MenuItem>

              {/* Sous-menu Clients */}
              <MenuItem onClick={handleMenuClose} component={Link} to="/funnel">
                Créer un bilan
              </MenuItem>
              <MenuItem onClick={handleMenuClose} component={Link} to="/clients">
                Liste Clients
              </MenuItem>

              {/* Sous-menu Administration */}
              <MenuItem onClick={handleMenuClose} component={Link} to="/bilan-templates">
                Gestion Bilans
              </MenuItem>
              <MenuItem onClick={handleMenuClose} component={Link} to="/manage-forms">
                Gestion Formulaires
              </MenuItem>
              <MenuItem onClick={handleMenuClose} component={Link} to="/preferences">
                Préférences
              </MenuItem>
              {isAdmin && (
                <MenuItem onClick={handleMenuClose} component={Link} to="/admin">
                  Administration
                </MenuItem>
              )}

              <MenuItem onClick={handleMenuClose} component={Link} to="/profile">
                Mon profil
              </MenuItem>
              <MenuItem onClick={handleLogout}>
                Se déconnecter
              </MenuItem>
            </>
          )}
          {!isAuthenticated && (
            <MenuItem onClick={handleMenuClose} component={Link} to="/login">
              Se connecter
            </MenuItem>
          )}
        </Menu>
      </Toolbar>
    </AppBar>
  );
}

export default Header;

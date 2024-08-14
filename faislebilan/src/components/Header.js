// src/components/Header.js
import React, { useState } from 'react';
import { AppBar, Toolbar, Typography, Button, IconButton, Menu, MenuItem, Box } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { Link } from 'react-router-dom';
import logo from '../images/faislebilan.png';

function Header() {
  const [anchorEl, setAnchorEl] = useState(null);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  return (
    <AppBar position="static">
      <Toolbar style={{ display: 'flex', justifyContent: 'space-between' }}>
        <Typography variant="h6" component="div">
          <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
            <img src={logo} alt="Faislebilan Logo" style={{ height: '40px' }} />
          </Link>
        </Typography>

        <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
          <Button color="inherit" component={Link} to="/funnel">
            Créer un bilan
          </Button>
          <Button color="inherit" component={Link} to="/clients">
            Liste des clients
          </Button>
          <Button color="inherit" component={Link} to="/bilans">
            Liste des bilans
          </Button>
        </Box>

        {/* Menu burger pour les petits écrans */}
        <IconButton
          edge="start"
          color="inherit"
          aria-label="menu"
          sx={{ display: { xs: 'block', sm: 'none' } }}  // Visible uniquement sur les petits écrans
          onClick={handleMenuOpen}
        >
          <MenuIcon />
        </IconButton>

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
          <MenuItem onClick={handleMenuClose} component={Link} to="/funnel">
            Créer un bilan
          </MenuItem>
          <MenuItem onClick={handleMenuClose} component={Link} to="/clients">
            Liste des clients
          </MenuItem>
          <MenuItem onClick={handleMenuClose} component={Link} to="/bilans">
            Liste des bilans
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
}

export default Header;

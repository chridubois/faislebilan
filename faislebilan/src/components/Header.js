import React, { useState } from 'react';
import { AppBar, Toolbar, Typography, Button, IconButton, Menu, MenuItem, Box } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { Link } from 'react-router-dom';
import logo from '../images/faislebilan.png';
import AddIcon from '@mui/icons-material/Add';
import PeopleIcon from '@mui/icons-material/People';
import ListAltIcon from '@mui/icons-material/ListAlt';
import DashboardIcon from '@mui/icons-material/Dashboard'; // Icône pour le tableau de bord

function Header() {
  const [anchorEl, setAnchorEl] = useState(null);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  return (
    <AppBar position="static" color="primary">
      <Toolbar style={{ display: 'flex', justifyContent: 'space-between' }}>
        <Typography variant="h6" component="div">
          <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
            <img src={logo} alt="Faislebilan Logo" style={{ height: '30px' }} />
          </Link>
        </Typography>

        <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
          <Button color="inherit" component={Link} to="/funnel" startIcon={<AddIcon />}>
            Créer un bilan
          </Button>
          <Button color="inherit" component={Link} to="/clients" startIcon={<PeopleIcon />}>
            Liste des clients
          </Button>
          <Button color="inherit" component={Link} to="/bilans" startIcon={<ListAltIcon />}>
            Liste des bilans
          </Button>
          <Button color="inherit" component={Link} to="/dashboard" startIcon={<DashboardIcon />}>
            Tableau de Bord
          </Button>
        </Box>

        {/* Menu burger pour les petits écrans */}
        <IconButton
          edge="start"
          color="inherit"
          aria-label="menu"
          sx={{ display: { xs: 'block', sm: 'none' } }}
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
          <MenuItem onClick={handleMenuClose} component={Link} to="/dashboard">
            Tableau de Bord
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
}

export default Header;

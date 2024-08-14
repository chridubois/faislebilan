// src/components/Footer.js
import React from 'react';
import { Typography, Box } from '@mui/material';

function Footer() {
  return (
    <Box component="footer" py={2} textAlign="center" bgcolor="primary.main" color="white" mt={4}>
      <Typography variant="body2">
        © {new Date().getFullYear()} Faislebilan. Tous droits réservés.
      </Typography>
    </Box>
  );
}

export default Footer;

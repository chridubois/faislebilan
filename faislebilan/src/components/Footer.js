import React from 'react';
import { Typography, Box, Link } from '@mui/material';

function Footer() {
  return (
    <Box component="footer" py={2} textAlign="center" bgcolor="#A7C3CA" color="white" mt={4}>
      <Typography variant="body2">
        © {new Date().getFullYear()} Faislebilan. Tous droits réservés.
      </Typography>
      <Typography variant="body2">
        <Link href="/privacy-policy" color="inherit">
          Politique de confidentialité
        </Link>
      </Typography>
    </Box>
  );
}

export default Footer;

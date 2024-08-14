// src/pages/Home.js

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Container, Typography } from '@mui/material';

function Home() {
  const navigate = useNavigate();

  const handleStart = () => {
    navigate('/funnel');
  };

  return (
    <Container
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        textAlign: 'center'
      }}
    >
      <Button variant="contained" color="primary" size="large" onClick={handleStart}>
        Lancer un bilan
      </Button>
    </Container>
  );
}

export default Home;

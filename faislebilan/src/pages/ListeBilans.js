// src/pages/ListeBilans.js
import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Container, Typography, List, ListItem, ListItemText } from '@mui/material';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';

function ListeBilans() {
  const [bilans, setBilans] = useState([]);

  useEffect(() => {
    const fetchBilans = async () => {
      const bilansCollection = collection(db, 'bilans');
      const bilanSnapshot = await getDocs(bilansCollection);
      const bilanList = bilanSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setBilans(bilanList);
    };

    fetchBilans();
  }, []);

  return (
    <Container>
      <Helmet>
        <title>Liste Bilans</title>
      </Helmet>
      <Typography variant="h4" component="h1" gutterBottom>
        Liste des bilans
      </Typography>
      <List>
        {bilans.map((bilan) => (
          <ListItem key={bilan.id} button component={Link} to={`/bilan/${bilan.id}`}>
            <ListItemText primary={`Bilan de ${bilan.clientId}`} secondary={`Créé le : ${bilan.createdAt.toDate().toLocaleDateString()}`} />
          </ListItem>
        ))}
      </List>
    </Container>
  );
}

export default ListeBilans;

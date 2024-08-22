import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, orderBy, getDocs, doc, getDoc, where } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Container, TextField, Grid, Card, CardContent, Typography, MenuItem } from '@mui/material';
import { getAuth } from 'firebase/auth';

function BilanList() {
  const navigate = useNavigate();
  const [bilans, setBilans] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('date');

  useEffect(() => {
    const fetchBilans = async () => {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) return;

      const bilansRef = collection(db, 'bilans');
      const q = query(bilansRef, where('userId', '==', user.uid), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);

      const bilansData = await Promise.all(
        querySnapshot.docs.map(async (docSnapshot) => {
          const bilan = { id: docSnapshot.id, ...docSnapshot.data() };

          // Récupérer les informations du client
          const clientDocRef = doc(db, 'clients', bilan.clientId);
          const clientDocSnap = await getDoc(clientDocRef);
          if (clientDocSnap.exists()) {
            bilan.clientName = clientDocSnap.data().name;
          } else {
            bilan.clientName = 'Nom du client manquant';
          }

          return bilan;
        })
      );

      // Envoyer l'événement au dataLayer lorsque le client est vu
      window.dataLayer.push({
        event: 'view_bilan_list',
        userId: user.uid,
      });

      setBilans(bilansData);
    };

    fetchBilans();
  }, []);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleFilterChange = (e) => {
    setFilter(e.target.value);
  };

  const handleSortChange = (e) => {
    setSort(e.target.value);
  };

  const filteredBilans = bilans.filter(bilan =>
    bilan.clientName && bilan.clientName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredBilansByDate = filteredBilans.filter(bilan => {
    const createdAt = bilan.createdAt.toDate();
    const now = new Date();

    if (filter === 'last7days') {
      return createdAt >= new Date(now.setDate(now.getDate() - 7));
    } else if (filter === 'last30days') {
      return createdAt >= new Date(now.setDate(now.getDate() - 30));
    } else {
      return true;
    }
  });

  const sortedBilans = [...filteredBilansByDate].sort((a, b) => {
    if (sort === 'date') {
      return b.createdAt.toDate() - a.createdAt.toDate();
    } else if (sort === 'name') {
      return a.clientName.localeCompare(b.clientName);
    } else {
      return 0;
    }
  });

  return (
    <Container>
      <Typography variant="h4" component="h1" gutterBottom>
        Liste des Bilans
      </Typography>

      {/* Barre de recherche */}
      <TextField
        label="Rechercher un client"
        variant="outlined"
        fullWidth
        margin="normal"
        value={searchTerm}
        onChange={handleSearchChange}
      />

      {/* Filtres et Tri */}
      <TextField
        select
        label="Filtrer par"
        value={filter}
        onChange={handleFilterChange}
        variant="outlined"
        fullWidth
        margin="normal"
      >
        <MenuItem value="all">Tous</MenuItem>
        <MenuItem value="last7days">Les 7 derniers jours</MenuItem>
        <MenuItem value="last30days">Les 30 derniers jours</MenuItem>
      </TextField>

      <TextField
        select
        label="Trier par"
        value={sort}
        onChange={handleSortChange}
        variant="outlined"
        fullWidth
        margin="normal"
      >
        <MenuItem value="date">Date</MenuItem>
        <MenuItem value="name">Nom du client</MenuItem>
      </TextField>

      <Grid container spacing={3}>
        {sortedBilans.map((bilan) => (
          <Grid item xs={12} sm={6} md={4} key={bilan.id}>
            <Card
              onClick={() => navigate(`/bilan/${bilan.id}`)}
              style={{
                cursor: 'pointer',
                backgroundColor: '#ecf0f1',
                boxShadow: '0 4px 8px 0 rgba(0, 0, 0, 0.2)',
                transition: '0.3s',
                '&:hover': { boxShadow: '0 8px 16px 0 rgba(0, 0, 0, 0.2)' },
              }}
            >
              <CardContent>
                <Typography variant="h6" style={{ color: '#34495e' }}>
                  {bilan.clientName}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Date: {new Date(bilan.createdAt.toDate()).toLocaleDateString()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}

export default BilanList;

import React, { useState, useEffect } from 'react';
import { collection, getDocs, orderBy, query, where } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Button, Container, Typography, Grid, Card, CardContent, TextField, MenuItem, Box, List, ListItem, ListItemText } from '@mui/material';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { getAuth } from 'firebase/auth';
import { Link, useNavigate } from 'react-router-dom';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

function Dashboard() {
  const [bilans, setBilans] = useState([]);
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(''); // Aucun client sélectionné par défaut
  const [averageIndex, setAverageIndex] = useState(0);
  const [chartData, setChartData] = useState(null);
  const navigate = useNavigate();

  // Récupérer les clients à l'initialisation
  useEffect(() => {
    const fetchClients = async () => {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) return;

      const clientsCollection = collection(db, 'clients');
      const q = query(clientsCollection, where('userId', '==', user.uid), orderBy('createdAt', 'desc'));
      const clientsSnapshot = await getDocs(q);
      const clientsData = clientsSnapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name,
      }));
      setClients(clientsData);
    };

    fetchClients();
  }, []);

  // Récupérer les bilans (soit tous, soit pour un client spécifique)
  useEffect(() => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) return;

    const fetchBilans = async () => {
      const bilansCollection = collection(db, 'bilans');
      const q = query(bilansCollection, where('userId', '==', user.uid), orderBy('createdAt', 'desc'));
      let bilanQuery = q;

      if (selectedClient) {
        // Si un client est sélectionné, filtrer les bilans par client
        bilanQuery = query(bilansCollection, where('clientId', '==', selectedClient), where('userId', '==', user.uid));
      }

      const bilanSnapshot = await getDocs(bilanQuery);
      const bilansData = bilanSnapshot.docs.map(doc => doc.data());
      setBilans(bilansData);

      if (bilansData.length > 0) {
        // Calculer la moyenne des indices
        const totalIndices = bilansData.reduce((acc, bilan) => {
          const total = Object.values(bilan.tests).reduce((sum, test) => sum + test.index, 0);
          return acc + total / Object.values(bilan.tests).length;
        }, 0);
        setAverageIndex((totalIndices / bilansData.length).toFixed(2));

        // Préparer les données pour le graphique
        const dates = bilansData.map(bilan => bilan.createdAt.toDate().toLocaleDateString());
        const indices = bilansData.map(bilan => {
          return Object.values(bilan.tests).reduce((sum, test) => sum + test.index, 0) / Object.values(bilan.tests).length;
        });

        setChartData({
          labels: dates,
          datasets: [
            {
              label: 'Indice de Forme Moyen',
              data: indices,
              borderColor: 'rgba(75,192,192,1)',
              backgroundColor: 'rgba(75,192,192,0.2)',
              fill: true,
            },
          ],
        });
      }
    };

    fetchBilans();
  }, [selectedClient]);

  const handleClientChange = (event) => {
    setSelectedClient(event.target.value);
  };

  const handleCreateBilan = () => {
    navigate('/funnel'); // Redirige vers la page de création d'un bilan
  };

  return (
    <Container>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4" component="h1">
          Tableau de Bord
        </Typography>
        <Button
          variant="contained"
          color="primary"
          size="large"
          sx={{ backgroundColor: '#FF5722', '&:hover': { backgroundColor: '#FF7043' } }}
          onClick={handleCreateBilan}
        >
          Créer un bilan
        </Button>
      </Box>

      <Box mt={4} />

      {/* Section des derniers bilans et clients */}
      <Grid container spacing={4} style={{ marginBottom: '20px' }}>
        <Grid item xs={12} sm={6}>
          <Typography variant="h6">Derniers Bilans</Typography>
          {bilans.length > 0 ? (
            <List>
              {bilans.slice(0, 5).map((bilan) => (
                <ListItem
                  key={bilan.id}
                  button
                  component={Link}
                  to={`/bilan/${bilan.id}`}
                  style={{
                    backgroundColor: '#f0f0f0',
                    marginBottom: '10px',
                    borderRadius: '8px',
                    boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)',
                    transition: 'transform 0.2s ease-in-out',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.02)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  <ListItemText
                    primary={`Bilan créé le : ${bilan.createdAt.toDate().toLocaleDateString()}`}
                    primaryTypographyProps={{ style: { fontWeight: 'bold' } }}
                  />
                </ListItem>
              ))}
            </List>
          ) : (
            <Typography variant="body1">Ce client n'a pas encore fait de bilan.</Typography>
          )}
        </Grid>
        <Grid item xs={12} sm={6}>
          <Typography variant="h6">Derniers Clients</Typography>
          {clients.length > 0 ? (
            <List>
              {clients.slice(0, 5).map((client) => (
                <ListItem
                  key={client.id}
                  button
                  component={Link}
                  to={`/client/${client.id}`}
                  style={{
                    backgroundColor: '#f0f0f0',
                    marginBottom: '10px',
                    borderRadius: '8px',
                    boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)',
                    transition: 'transform 0.2s ease-in-out',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.02)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  <ListItemText
                    primary={`${client.name}`}
                    primaryTypographyProps={{ style: { fontWeight: 'bold' } }}
                  />
                </ListItem>
              ))}
            </List>
          ) : (
            <Typography variant="body1">Ce client n'a pas encore fait de bilan.</Typography>
          )}
        </Grid>
      </Grid>

      <Typography variant="h4" component="h2">Statistiques</Typography>

      {/* Sélecteur de client */}
      <TextField
        select
        label="Sélectionner un client"
        value={selectedClient}
        onChange={handleClientChange}
        variant="outlined"
        fullWidth
        margin="normal"
      >
        <MenuItem value="">
          Tous les clients
        </MenuItem>
        {clients.map((client) => (
          <MenuItem key={client.id} value={client.id}>
            {client.name}
          </MenuItem>
        ))}
      </TextField>

      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6">Nombre de Bilans</Typography>
              <Typography variant="h4">{bilans.length}</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6">Indice Moyen Global</Typography>
              <Typography variant="h4">{averageIndex}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {chartData && (
        <Box mt={4}>
          <Typography variant="h6" gutterBottom>
            Évolution de l'Indice de Forme
          </Typography>

          {/* Graphique responsive */}
          <Box sx={{ position: 'relative', width: '100%', height: 'auto', maxWidth: '1000px', aspectRatio: '16/9' }}>
            <Line
              data={chartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
              }}
            />
          </Box>
        </Box>
      )}
    </Container>
  );
}

export default Dashboard;

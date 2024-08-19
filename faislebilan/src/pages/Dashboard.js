import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Container, Typography, Grid, Card, CardContent, TextField, MenuItem } from '@mui/material';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { getAuth } from 'firebase/auth';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

function Dashboard() {
  const [bilans, setBilans] = useState([]);
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(''); // Aucun client sélectionné par défaut
  const [averageIndex, setAverageIndex] = useState(0);
  const [chartData, setChartData] = useState(null);

  // Récupérer les clients à l'initialisation
  useEffect(() => {
    const fetchClients = async () => {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) return;

      const clientsCollection = collection(db, 'clients');
      const q = query(clientsCollection, where('userId', '==', user.uid));
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
      const q = query(bilansCollection, where('userId', '==', user.uid));
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

  return (
    <Container>
      <Typography variant="h4" component="h1" gutterBottom>
        Tableau de Bord
      </Typography>

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

      <Grid container spacing={4}>
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6">Nombre de Bilans</Typography>
              <Typography variant="h4">{bilans.length}</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6">Indice Moyen Global</Typography>
              <Typography variant="h4">{averageIndex}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {chartData && (
        <>
          <Typography variant="h6" style={{ marginTop: '20px' }}>
            Évolution de l'Indice de Forme
          </Typography>
          <Line data={chartData} />
        </>
      )}
    </Container>
  );
}

export default Dashboard;

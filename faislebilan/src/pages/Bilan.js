// src/pages/Bilan.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Container, Typography, Button, Table, TableBody, TableCell, TableRow, Grid, Box } from '@mui/material';
import { Radar } from 'react-chartjs-2';
import { Chart as ChartJS, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend } from 'chart.js';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

function Bilan() {
  const { id } = useParams();
  const [bilan, setBilan] = useState(null);
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBilanAndClient = async () => {
      try {
        const bilanDocRef = doc(db, 'bilans', id);
        const bilanDocSnap = await getDoc(bilanDocRef);

        if (bilanDocSnap.exists()) {
          const bilanData = bilanDocSnap.data();
          setBilan(bilanData);

          const clientDocRef = doc(db, 'clients', bilanData.clientId);
          const clientDocSnap = await getDoc(clientDocRef);

          if (clientDocSnap.exists()) {
            setClient(clientDocSnap.data());
          } else {
            console.error('Client introuvable!');
          }
        } else {
          console.error('Bilan introuvable!');
        }

        setLoading(false);
      } catch (error) {
        console.error('Erreur lors de la récupération du bilan:', error);
        setLoading(false);
      }
    };

    fetchBilanAndClient();
  }, [id]);

  if (loading) {
    return <Typography variant="h6">Chargement...</Typography>;
  }

  if (!bilan || !client) {
    return <Typography variant="h6">Bilan ou Client introuvable</Typography>;
  }

  // Trier les tests par nom croissant avant de préparer les données pour le graphique radar
  const sortedTests = Object.values(bilan.tests).sort((a, b) => a.name.localeCompare(b.name));

  // Préparer les données pour le graphique radar
  const radarData = {
    labels: sortedTests.map(test => test.name),
    datasets: [
      {
        label: 'Indice de Forme',
        data: sortedTests.map(test => test.index),
        backgroundColor: 'rgba(34, 202, 236, 0.2)',
        borderColor: 'rgba(34, 202, 236, 1)',
        borderWidth: 2,
      },
    ],
  };

  const radarOptions = {
    scales: {
      r: {
        min: 0,
        max: 5,
        ticks: {
          stepSize: 1,
        },
      },
    },
  };

  return (
    <Container>
      <Typography variant="h4" component="h1" gutterBottom>
        Détails du Bilan
        <Button
          variant="contained"
          color="primary"
          onClick={() => navigate(`/client/${bilan.clientId}`)}
          style={{ float: 'right' }}
        >
          Page Client
        </Button>
      </Typography>

      <Typography variant="body1" style={{ marginTop: '20px' }}>
        Bilan créé le : {bilan.createdAt.toDate().toLocaleDateString()}
      </Typography>

      <Box mt={4} />

      <Grid container spacing={4}>
        <Grid item xs={12} md={6}>
          <Typography variant="h6" gutterBottom>
            Informations du Client
          </Typography>
          <Table>
            <TableBody>
              <TableRow>
                <TableCell>Nom-Prénom</TableCell>
                <TableCell>{client.name}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Date de naissance</TableCell>
                <TableCell>{client.dob}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Sexe</TableCell>
                <TableCell>{client.gender}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Taille</TableCell>
                <TableCell>{client.height} cm</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Poids</TableCell>
                <TableCell>{client.weight} kg</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </Grid>

        <Grid item xs={12} md={6}>
          <Box display="flex" justifyContent="center" alignItems="center" height="100%">
            <div style={{ width: '300px', height: '300px' }}>
              <Radar data={radarData} options={radarOptions} />
            </div>
          </Box>
        </Grid>
      </Grid>

      <Box mt={4} />

      <Typography variant="h6" gutterBottom>
        Réponses aux tests
      </Typography>
      <Table>
        <TableBody>
          {Object.entries(bilan.tests).map(([testId, testData]) => (
            <TableRow key={testId}>
              <TableCell>{testData.name}</TableCell>
              <TableCell>Réponse: {testData.response}</TableCell>
              <TableCell>Indice: {testData.index}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Container>
  );
}

export default Bilan;

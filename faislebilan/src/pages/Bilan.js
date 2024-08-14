// src/pages/Bilan.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Container, Typography, Button, Table, TableBody, TableCell, TableRow } from '@mui/material';
import { Radar } from 'react-chartjs-2';
import { calculateSquatIndex, calculatePushupIndex, calculateChairIndex, calculate6MinWalkIndex } from '../utils/utils';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

function Bilan() {
  const { id } = useParams();
  const [bilan, setBilan] = useState(null);
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBilan = async () => {
      try {
        const bilanDocRef = doc(db, 'bilans', id);
        const bilanDocSnap = await getDoc(bilanDocRef);

        if (bilanDocSnap.exists()) {
          const bilanData = bilanDocSnap.data();
          setBilan(bilanData);

          // Récupérer les informations du client
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
      } catch (error) {
        console.error('Erreur lors de la récupération du bilan:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBilan();
  }, [id]);

  if (loading) {
    return <Typography variant="h6">Chargement...</Typography>;
  }

  if (!bilan || !client) {
    return <Typography variant="h6">Bilan ou Client introuvable</Typography>;
  }

  const handleGoToClientPage = () => {
    navigate(`/client/${bilan.clientId}`);
  };

  const age = new Date().getFullYear() - new Date(client.dob).getFullYear();

  // Calcul des indices pour chaque test
  const testsWithIndices = {};
  for (const [testId, testData] of Object.entries(bilan.tests)) {
    let index = 0;
    if (testData.name === 'squat') {
      index = calculateSquatIndex(client.gender, age, testData.response);
      console.log('index:', index);
    } else if (testData.name === 'pushup') {
      index = calculatePushupIndex(client.gender, age, testData.response);
    } else if (testData.name === 'chaise') {
      index = calculateChairIndex(testData.response);
    } else if (testData.name === '6min_marche') {
      index = calculate6MinWalkIndex(client.gender, age, testData.response);
    }

    testsWithIndices[testId] = {
      ...testData,
      index: index
    };
  }

  // Préparer les données pour le graphique radar
  const radarData = {
    labels: Object.values(testsWithIndices).map(test => test.name),
    datasets: [
      {
        label: 'Indice de Forme',
        data: Object.values(testsWithIndices).map(test => test.index),
        backgroundColor: 'rgba(34, 202, 236, 0.2)',
        borderColor: 'rgba(34, 202, 236, 1)',
        borderWidth: 2,
      },
    ],
  };

  return (
    <Container>
      <Typography variant="h4" component="h1" gutterBottom>
        Détails du Bilan
        <Button
          variant="contained"
          color="primary"
          onClick={handleGoToClientPage}
          style={{ float: 'right' }}
        >
          Page Client
        </Button>
      </Typography>

      {/* Afficher les informations du client */}
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

      {/* Afficher le graphique radar */}
      <Radar data={radarData} />

      {/* Afficher les réponses et indices pour chaque test */}
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

      <Typography variant="body1" style={{ marginTop: '20px' }}>
        Bilan créé le : {bilan.createdAt.toDate().toLocaleDateString()}
      </Typography>
    </Container>
  );
}

export default Bilan;

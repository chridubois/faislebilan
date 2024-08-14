import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Container, Typography, Table, TableBody, TableCell, TableHead, TableRow, CircularProgress } from '@mui/material';
import { Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
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

  useEffect(() => {
    const fetchBilanAndClient = async () => {
      try {
        // Récupérer le bilan à partir de l'ID
        const bilanDocRef = doc(db, "bilans", id);
        const bilanDocSnap = await getDoc(bilanDocRef);

        if (bilanDocSnap.exists()) {
          const bilanData = bilanDocSnap.data();
          setBilan(bilanData);

          // Récupérer le client associé au bilan
          const clientDocRef = doc(db, "clients", bilanData.clientId);
          const clientDocSnap = await getDoc(clientDocRef);

          if (clientDocSnap.exists()) {
            setClient(clientDocSnap.data());
          } else {
            console.error("No such client document!");
          }
        } else {
          console.error("No such bilan document!");
        }
      } catch (e) {
        console.error("Error fetching document: ", e);
      } finally {
        setLoading(false);
      }
    };

    fetchBilanAndClient();
  }, [id]);

  if (loading) {
    return <CircularProgress />;
  }

  if (!bilan || !client) {
    return <Typography variant="h6">Bilan ou client introuvable</Typography>;
  }

  const data = {
    labels: Object.keys(bilan.tests),
    datasets: [
      {
        label: 'Résultats des tests',
        data: Object.values(bilan.tests),
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      },
    ],
  };

  return (
    <Container>
      <Typography variant="h4" component="h1" gutterBottom>
        Bilan de {client.name}
      </Typography>
      <Typography variant="h6">Informations personnelles</Typography>
      <Table>
        <TableBody>
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

      <Typography variant="h6" style={{ marginTop: '20px' }}>Résultats des tests</Typography>
      <Radar data={data} />

      <Typography variant="h6" style={{ marginTop: '20px' }}>Détails des tests</Typography>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Test</TableCell>
            <TableCell>Résultat</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {Object.entries(bilan.tests).map(([test, result]) => (
            <TableRow key={test}>
              <TableCell>{test}</TableCell>
              <TableCell>{result}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Container>
  );
}

export default Bilan;

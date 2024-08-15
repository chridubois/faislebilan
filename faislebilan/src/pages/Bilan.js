import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Container, Typography, Button, Table, TableBody, TableCell, TableRow, Grid, Box } from '@mui/material';
import { Radar } from 'react-chartjs-2';
import { Chart as ChartJS, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend } from 'chart.js';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

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

  const handleExportPDF = () => {
    const input = document.getElementById('bilan-content');
    html2canvas(input).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210; // largeur A4 en mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width; // hauteur calculée pour respecter les proportions

      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`bilan-${client.name}.pdf`);
    });
  };

  if (loading) {
    return <Typography variant="h6">Chargement...</Typography>;
  }

  if (!bilan || !client) {
    return <Typography variant="h6">Bilan ou Client introuvable</Typography>;
  }

  // Définir les valeurs de référence pour chaque test
  const referenceValues = {
    squat: 3,
    pushup: 4,
    chaise: 3,
    '6min marche': 4,
    planche: 3,
    sorensen: 4,
    'mobilité épaule': 3,
    'souplesse chaîne post': 3,
    'mobilité hanches': 3,
    ruffier: 3,
    'souplesse ischio': 3,
    'marche 2min': 3,
    'coordination jambes bras': 3,
    'assis debout': 3,
    // Ajoutez d'autres tests ici avec les valeurs de référence appropriées
  };

  // Trier les tests par nom croissant avant de préparer les données pour le graphique radar
  const sortedTests = Object.values(bilan.tests).sort((a, b) => a.name.localeCompare(b.name));

  // Préparer les données pour le graphique radar avec les valeurs de l'utilisateur
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
      {
        label: 'Valeurs de Référence',
        data: sortedTests.map(test => referenceValues[test.name] || 0), // Utiliser les valeurs de référence
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        borderColor: 'rgba(255, 99, 132, 1)',
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

      <Button variant="contained" color="secondary" onClick={handleExportPDF} style={{ marginBottom: '20px' }}>
        Exporter en PDF
      </Button>

      <div id="bilan-content">
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
              <div style={{ width: '400px', height: '400px' }}>
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
      </div>
    </Container>
  );
}

export default Bilan;

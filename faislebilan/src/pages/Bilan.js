import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Container, Typography, Button, Card, CardContent, Table, TableBody, TableCell, TableRow, Grid, Box, Divider } from '@mui/material';
import { Radar } from 'react-chartjs-2';
import { Chart as ChartJS, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend } from 'chart.js';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

function Bilan() {
  const { id } = useParams();
  const [bilan, setBilan] = useState(null);
  const [client, setClient] = useState(null);
  const [previousBilan, setPreviousBilan] = useState(null);
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

            const previousBilanQuery = query(
              collection(db, 'bilans'),
              where('clientId', '==', bilanData.clientId),
              orderBy('createdAt', 'desc'),
              limit(2)
            );

            const previousBilanSnapshot = await getDocs(previousBilanQuery);
            const previousBilans = previousBilanSnapshot.docs.map(doc => doc.data());

            if (previousBilans.length > 1) {
              setPreviousBilan(previousBilans[1]);
            }
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

  const generatePDF = () => {
    const input = document.getElementById('bilan-content');
    html2canvas(input).then(canvas => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF();
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save('bilan.pdf');
    });
  };

  if (loading) {
    return <Typography variant="h6">Chargement...</Typography>;
  }

  if (!bilan || !client) {
    return <Typography variant="h6">Bilan ou Client introuvable</Typography>;
  }

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
      // {
      //   label: 'Valeurs de Référence',
      //   data: sortedTests.map(test => referenceValues[test.name] || 0), // Utiliser les valeurs de référence
      //   backgroundColor: 'rgba(255, 99, 132, 0.2)',
      //   borderColor: 'rgba(255, 99, 132, 1)',
      //   borderWidth: 2,
      // },
    ],
  };

  // Ajouter les données du bilan précédent si disponible
  if (previousBilan) {
    const sortedPreviousTests = Object.values(previousBilan.tests).sort((a, b) => a.name.localeCompare(b.name));
    radarData.datasets.push({
      label: 'Bilan Précédent',
      data: sortedPreviousTests.map(test => test.index),
      backgroundColor: 'rgba(255, 99, 132, 0.2)',
      borderColor: 'rgba(255, 99, 132, 1)',
      borderWidth: 2,
    });
  }

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

  const renderResponse = (response) => {
    if (typeof response === 'object' && response !== null) {
      return (
        <ul>
          {Object.entries(response).map(([key, value]) => (
            <li key={key}>
              {key}: {value}
            </li>
          ))}
        </ul>
      );
    }
    return response;
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
        <Button
          variant="contained"
          color="secondary"
          onClick={generatePDF}
          style={{ float: 'right', marginRight: '10px' }}
        >
          Télécharger PDF
        </Button>
      </Typography>

      <Box mt={4} id="bilan-content">
        <Card style={{ marginBottom: '20px', padding: '20px' }}>
          <Typography variant="h5" gutterBottom>
            Informations du Client
          </Typography>
          <Divider style={{ marginBottom: '20px' }} />
          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
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
                  <TableRow>
                    <TableCell>Niveau d'activité</TableCell>
                    <TableCell>{client.activity}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Graphique des Indices
              </Typography>
              <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                <div style={{ width: '400px', height: '400px' }}>
                  <Radar data={radarData} options={radarOptions} />
                </div>
              </Box>
            </Grid>
          </Grid>
        </Card>

        <Card style={{ marginBottom: '20px', padding: '20px' }}>
          <Typography variant="h5" gutterBottom>
            Recommandations
          </Typography>
          <Divider style={{ marginBottom: '20px' }} />
          <Box mt={2}>
            <Typography variant="body1">
              Basé sur vos résultats, voici quelques recommandations pour vous aider à améliorer votre condition physique :
            </Typography>

            <Typography variant="subtitle1" gutterBottom>
              Exercices recommandés :
            </Typography>
            <ul>
              <li>Augmentez vos séries de push-ups pour améliorer votre force du haut du corps.</li>
              <li>Incorporez des étirements quotidiens pour améliorer votre flexibilité.</li>
            </ul>

            <Typography variant="subtitle1" gutterBottom>
              Recommandations nutritionnelles :
            </Typography>
            <ul>
              <li>Consommez des protéines après l'entraînement pour favoriser la récupération.</li>
              <li>Augmentez votre apport en fibres pour une meilleure digestion et énergie.</li>
            </ul>

            <Typography variant="subtitle1" gutterBottom>
              Objectifs à court terme :
            </Typography>
            <ul>
              <li>Atteindre 20 push-ups d'ici le prochain bilan.</li>
              <li>Améliorer votre score de souplesse en ajoutant des étirements.</li>
            </ul>

            <Typography variant="subtitle1" gutterBottom>
              Motivation :
            </Typography>
            <Typography variant="body2">
              Continuez vos efforts ! Chaque petite amélioration compte, et vous êtes sur la bonne voie pour atteindre vos objectifs de forme physique.
            </Typography>
          </Box>
        </Card>

        <Card style={{ marginBottom: '20px', padding: '20px' }}>
          <Typography variant="h5" gutterBottom>
            Réponses aux Tests
          </Typography>
          <Divider style={{ marginBottom: '20px' }} />
          <Table>
            <TableBody>
              {Object.entries(bilan.tests).map(([testId, testData]) => (
                <TableRow key={testId}>
                  <TableCell>{testData.name}</TableCell>
                  <TableCell>Réponse: {renderResponse(testData.response)}</TableCell>
                  <TableCell>Indice: {testData.index}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </Box>
    </Container>
  );
}

export default Bilan;

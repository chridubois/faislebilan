import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Container, Typography, Button, Card, Table, TableBody, TableCell, TableRow, Grid, Box, Divider } from '@mui/material';
import { Radar, Line } from 'react-chartjs-2';
import { Chart as ChartJS, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend } from 'chart.js';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { getAuth } from 'firebase/auth';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

function Bilan() {
  const { id } = useParams();
  const [bilan, setBilan] = useState(null);
  const [client, setClient] = useState(null);
  const [previousBilan, setPreviousBilan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [preferences, setPreferences] = useState({
    showClientInfo: true,
    showTestResults: true,
    showRecommendations: true,
    showBilanList: true,
    showEvolutionGraph: true,
    showIndicesGraph: true,
    clientAttributes: {
      name: true,
      dob: true,
      gender: true,
      height: true,
      weight: true,
      activity: true,
      bmi: true,
      bmr: true,
    },
  });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPreferences = async () => {
      const auth = getAuth();
      const user = auth.currentUser; // Obtenez l'utilisateur connecté
      const userDocRef = doc(db, 'users', user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        if (userData.preferences) {
          setPreferences(userData.preferences);
        }
      }
    };

    fetchPreferences();
  }, []);


  useEffect(() => {
    const fetchBilanAndClient = async () => {
      try {
        const bilanDocRef = doc(db, 'bilans', id);
        const bilanDocSnap = await getDoc(bilanDocRef);

        if (bilanDocSnap.exists()) {
          const bilanData = bilanDocSnap.data();
          setBilan(bilanData);
          // Envoyer l'événement au dataLayer lorsque le client est vu
          window.dataLayer.push({
            event: 'view_bilan',
            bilanId: id,
          });

          const clientDocRef = doc(db, 'clients', bilanData.clientId);
          const clientDocSnap = await getDoc(clientDocRef);

          if (clientDocSnap.exists()) {
            setClient(clientDocSnap.data());

            const previousBilanQuery = query(
              collection(db, 'bilans'),
              where('clientId', '==', bilanData.clientId),
              orderBy('createdAt', 'desc')
            );

            const previousBilanSnapshot = await getDocs(previousBilanQuery);
            const previousBilans = previousBilanSnapshot.docs.map(doc => doc.data());

            if (previousBilans.length > 0) {
              setPreviousBilan(previousBilans);
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

  // Calculer l'indice moyen pour chaque bilan
  const indicesMoyens = previousBilan && previousBilan.length > 0
    ? previousBilan.map(bilan => {
      const totalIndex = Object.values(bilan.tests).reduce((acc, test) => acc + test.index, 0);
      return totalIndex / Object.values(bilan.tests).length;
    })
    : [];

  console.log(previousBilan);

  console.log('indicesMoyens:', indicesMoyens);

  // Préparer les données pour la courbe d'évolution
  const lineData = {
    labels: previousBilan && previousBilan.length > 0
      ? previousBilan.map(bilan => new Date(bilan.createdAt.toDate()).toLocaleDateString())
      : [],
    datasets: [
      {
        label: 'Indice Moyen',
        data: indicesMoyens,
        fill: false,
        borderColor: 'rgba(75, 192, 192, 1)',
        tension: 0.1
      }
    ]
  };

  // Calculer l'âge du client à partir de la date de naissance (dob)
  const calculateAge = (dob) => {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDifference = today.getMonth() - birthDate.getMonth();

    if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };


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
    ],
  };

  // Ajouter les données du bilan précédent si disponible
  if (previousBilan && previousBilan.length > 1 && previousBilan[1]) {
    const sortedPreviousTests = Object.values(previousBilan[1].tests).sort((a, b) => a.name.localeCompare(b.name));
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
      <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap">
        <Typography variant="h4" component="h1" gutterBottom>
          Détails du Bilan
        </Typography>
        <Box display="flex" flexWrap="wrap" justifyContent="flex-end">
          <Button
            variant="contained"
            color="primary"
            onClick={() => navigate(`/client/${bilan.clientId}`)}
            style={{ marginRight: '10px', marginBottom: '10px' }}
          >
            Page Client
          </Button>
          <Button
            variant="contained"
            color="secondary"
            onClick={generatePDF}
            style={{ marginBottom: '10px' }}
          >
            Télécharger PDF
          </Button>
        </Box>
      </Box>

      <Box mt={4} id="bilan-content">
        {/* Informations du Client */}
        {preferences.showClientInfo && (
          <Card style={{ marginBottom: '20px', padding: '20px' }}>
            <Typography variant="h5" gutterBottom>
              Informations du Client
            </Typography>
            <Divider style={{ marginBottom: '20px' }} />
            <Grid container spacing={4}>
              <Grid item xs={12} md={6}>
                <Table>
                  <TableBody>
                    {preferences.clientAttributes.name && (
                      <TableRow>
                        <TableCell>Nom-Prénom</TableCell>
                        <TableCell>{client.name}</TableCell>
                      </TableRow>
                    )}
                    {preferences.clientAttributes.dob && (
                      <TableRow>
                        <TableCell>Age</TableCell>
                        <TableCell>{calculateAge(client.dob)} ans ({new Date(client.dob).toLocaleDateString()})</TableCell>
                      </TableRow>
                    )}
                    {preferences.clientAttributes.gender && (
                      <TableRow>
                        <TableCell>Sexe</TableCell>
                        <TableCell>{client.gender}</TableCell>
                      </TableRow>
                    )}
                    {preferences.clientAttributes.height && (
                      <TableRow>
                        <TableCell>Taille</TableCell>
                        <TableCell>{client.height} cm</TableCell>
                      </TableRow>
                    )}
                    {preferences.clientAttributes.weight && (
                      <TableRow>
                        <TableCell>Poids</TableCell>
                        <TableCell>{client.weight} kg</TableCell>
                      </TableRow>
                    )}
                    {preferences.clientAttributes.activity && (
                      <TableRow>
                        <TableCell>Niveau d'activité</TableCell>
                        <TableCell>{client.activity}</TableCell>
                      </TableRow>
                    )}
                    {preferences.clientAttributes.bmi && (
                      <TableRow>
                        <TableCell>IMC</TableCell>
                        <TableCell>{client.bmi?.toFixed(2)} kg/m2</TableCell>
                      </TableRow>
                    )}
                    {preferences.clientAttributes.bmr && (
                      <>
                        <TableRow>
                          <TableCell>BMR (Harris Benedict)</TableCell>
                          <TableCell>{client.bmrHarrisBenedict?.toFixed(2)} kcal/jour</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>BMR (Mifflin St Jeor)</TableCell>
                          <TableCell>{client.bmrMifflinStJeor?.toFixed(2)} kcal/jour</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>BMR (Harris Benedict) Final</TableCell>
                          <TableCell>{client.bmrHarrisBenedictFinal?.toFixed(2)} kcal/jour</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>BMR (Mifflin St Jeor) Final</TableCell>
                          <TableCell>{client.bmrMifflinStJeorFinal?.toFixed(2)} kcal/jour</TableCell>
                        </TableRow>
                      </>
                    )}
                  </TableBody>
                </Table>
              </Grid>
              <Grid item xs={12} md={6}>
                {preferences.showIndicesGraph && (
                  <>
                    <Typography variant="h6" gutterBottom>
                      Graphique des Indices
                    </Typography>
                    <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                      <div style={{ width: '100%', maxWidth: '400px', height: '400px' }}>
                        <Radar data={radarData} options={radarOptions} />
                      </div>
                    </Box>
                  </>
                )}
              </Grid>
            </Grid>
          </Card>
        )}

        {/* Ajouter la courbe d'évolution de l'indice moyen */}
        {preferences.showEvolutionGraph && (
          <Card style={{ marginBottom: '20px', padding: '20px' }}>
            <Typography variant="h5" gutterBottom>
              Évolution de l'Indice Moyen
            </Typography>
            <Divider style={{ marginBottom: '20px' }} />
            <Line data={lineData} />
          </Card>)}

        {/* Recommandations */}
        {preferences.showRecommendations && (
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
                Objectifs à court terme :
              </Typography>
              <ul>
                {Object.entries(bilan.tests)
                  .filter(([testId, testData]) => testData.goal !== null && testData.goal !== undefined) // Filter tests with goals
                  .map(([testId, testData]) => (
                    <li key={testId}>
                      Pour le test {testData.name}, essayez d'atteindre {testData.goal} pour passer à l'indice {testData.index + 1}.
                    </li>
                  ))}
              </ul>
            </Box>
          </Card>
        )}



        {/* Réponses aux Tests */}
        {preferences.showTestResults && (
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
        )}
      </Box>
    </Container>
  );
}

export default Bilan;

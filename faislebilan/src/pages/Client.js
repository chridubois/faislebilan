import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Container, Typography, Table, TableBody, TableCell, TableRow, Button, List, ListItem, ListItemText, Box, Grid } from '@mui/material';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, LineElement, PointElement, LinearScale, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(LineElement, PointElement, LinearScale, Title, Tooltip, Legend);

function Client() {
  const { id } = useParams();
  const [client, setClient] = useState(null);
  const [bilans, setBilans] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchClientAndBilans = async () => {
      try {
        // Récupérer les infos du client
        const clientDocRef = doc(db, 'clients', id);
        const clientDocSnap = await getDoc(clientDocRef);

        if (clientDocSnap.exists()) {
          setClient(clientDocSnap.data());

          // Récupérer les bilans du client
          const bilansCollection = collection(db, 'bilans');
          const q = query(bilansCollection, where('clientId', '==', id));
          const bilanSnapshot = await getDocs(q);
          const bilanList = bilanSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setBilans(bilanList);
        } else {
          console.error('No such client!');
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des données du client:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchClientAndBilans();
  }, [id]);

  if (loading) {
    return <Typography variant="h6">Chargement...</Typography>;
  }

  if (!client) {
    return <Typography variant="h6">Client introuvable</Typography>;
  }

  const handleNewBilan = () => {
    navigate('/funnel', { state: { clientId: id, client } });
  };

  // Préparer les données pour le graphique
  const chartData = {
    labels: bilans.map(bilan => new Date(bilan.createdAt.toDate()).toLocaleDateString()),
    datasets: [
      {
        label: 'Indice de Forme Moyen',
        data: bilans.map(bilan => {
          const totalIndex = Object.values(bilan.tests).reduce((acc, test) => acc + test.index, 0);
          return (totalIndex / Object.values(bilan.tests).length) || 0;
        }),
        fill: false,
        borderColor: 'rgba(75, 192, 192, 1)',
        tension: 0.1,
      },
    ],
  };

  return (
    <Container>
      <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap">
        <Typography variant="h4" component="h1" gutterBottom>
          Informations du client
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={handleNewBilan}
          style={{ marginBottom: '10px' }}
        >
          Nouveau Bilan
        </Button>
      </Box>

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
              <TableRow>
                <TableCell>Coeff Niveau d'activité</TableCell>
                <TableCell>{client.activityCoeff}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>IMC</TableCell>
                <TableCell>{client.bmi?.toFixed(2)} kg/m2</TableCell>
              </TableRow>
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
            </TableBody>
          </Table>
        </Grid>

        <Grid item xs={12} md={6}>
          <Typography variant="h6" gutterBottom>
            Bilans
          </Typography>
          {bilans.length > 0 ? (
            <List>
              {bilans.map((bilan) => (
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
      </Grid>

      {/* Graphique d'évolution de l'indice de forme */}
      <Box mt={4}>
        <Typography variant="h6" gutterBottom>
          Évolution de l'indice de forme moyen
        </Typography>
        <div style={{ width: '100%', height: '400px' }}>
          <Line data={chartData} />
        </div>
      </Box>
    </Container>
  );
}

export default Client;

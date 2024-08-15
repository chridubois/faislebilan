import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Container, Typography, Table, TableBody, TableCell, TableRow, Button, List, ListItem, ListItemText, Box } from '@mui/material';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

function Client() {
  const { id } = useParams();
  const [client, setClient] = useState(null);
  const [bilans, setBilans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState(null);
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

          if (bilanList.length > 0) {
            // Préparer les données pour le graphique
            const dates = bilanList.map(bilan => bilan.createdAt.toDate().toLocaleDateString());
            const indices = bilanList.map(bilan => {
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

  const handleNewBilan = () => {
    navigate('/funnel', { state: { clientId: id, client } });
  };

  if (loading) {
    return <Typography variant="h6">Chargement...</Typography>;
  }

  if (!client) {
    return <Typography variant="h6">Client introuvable</Typography>;
  }

  return (
    <Container>
      <Typography variant="h4" component="h1" gutterBottom>
        Informations du client
        <Button
          variant="contained"
          color="primary"
          onClick={handleNewBilan}
          style={{ float: 'right' }}
        >
          Nouveau Bilan
        </Button>
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

      <Typography variant="h6" style={{ marginTop: '20px' }}>
        Bilans
      </Typography>
      {bilans.length > 0 ? (
        <>
          <List>
            {bilans.map((bilan) => (
              <ListItem key={bilan.id} button component={Link} to={`/bilan/${bilan.id}`}>
                <ListItemText primary={`Bilan créé le : ${bilan.createdAt.toDate().toLocaleDateString()}`} />
              </ListItem>
            ))}
          </List>

          {/* Afficher le graphique si des bilans existent */}
          {chartData && (
            <Box mt={4}>
              <Typography variant="h6">Évolution de l'Indice de Forme</Typography>
              <Line data={chartData} />
            </Box>
          )}
        </>
      ) : (
        <Typography variant="body1">Ce client n'a pas encore fait de bilan.</Typography>
      )}
    </Container>
  );
}

export default Client;

import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs, addDoc, orderBy } from 'firebase/firestore';
import { db, storage } from '../config/firebase'; // Assurez-vous d'importer Firebase Storage
import { Container, Typography, Table, TableBody, TableCell, TableRow, Button, List, ListItem, ListItemText, Box, Grid, Dialog, DialogTitle, DialogContent, TextField, DialogActions } from '@mui/material';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, LineElement, PointElement, LinearScale, Title, Tooltip, Legend } from 'chart.js';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'; // Importer les fonctions Firebase Storage
import { getAuth } from 'firebase/auth';

ChartJS.register(LineElement, PointElement, LinearScale, Title, Tooltip, Legend);

function Client() {
  const { id } = useParams();
  const [client, setClient] = useState(null);
  const [bilans, setBilans] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]); // État pour stocker les prescriptions
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [sessionDescription, setSessionDescription] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchClientAndData = async () => {
      try {
        const clientDocRef = doc(db, 'clients', id);
        const clientDocSnap = await getDoc(clientDocRef);

        if (clientDocSnap.exists()) {
          setClient(clientDocSnap.data());

          // Envoyer l'événement au dataLayer lorsque le client est vu
          window.dataLayer.push({
            event: 'view_client',
            clientId: id,
          });

          const bilansCollection = collection(db, 'bilans');
          const bilansQuery = query(
            bilansCollection,
            where('clientId', '==', id),
            orderBy('createdAt', 'desc') // Sorting by createdAt in descending order
          );
          const bilanSnapshot = await getDocs(bilansQuery);
          const bilanList = bilanSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          }));
          setBilans(bilanList);

          // Récupérer les sessions du client
          const sessionsCollection = collection(db, 'sessions');
          const sessionQuery = query(sessionsCollection, where('clientId', '==', id));
          const sessionSnapshot = await getDocs(sessionQuery);
          const sessionList = sessionSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setSessions(sessionList);

          // Récupérer les prescriptions du client
          const prescriptionsCollection = collection(db, 'prescriptions');
          const prescriptionsQuery = query(prescriptionsCollection, where('clientId', '==', id));
          const prescriptionsSnapshot = await getDocs(prescriptionsQuery);
          const prescriptionList = prescriptionsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          }));
          setPrescriptions(prescriptionList);

        } else {
          console.error('No such client!');
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des données du client:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchClientAndData();
  }, [id]);

  const handleNewBilan = () => {
    navigate('/funnel', { state: { clientId: id, client } });
  };

  // Ouvrir le formulaire de session
  const handleOpen = () => {
    setOpen(true);
  };

  // Fermer le formulaire de session
  const handleClose = () => {
    setOpen(false);
    setSessionDescription('');
  };

  // Gérer la soumission de la session
  const handleSessionSubmit = async () => {
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');

      await addDoc(collection(db, 'sessions'), {
        description: sessionDescription,
        clientId: id,
        userId: user.uid,
        createdAt: new Date(),
      });

      // Envoyer l'événement au dataLayer lorsque le client est vu
      window.dataLayer.push({
        event: 'create_session',
        clientId: id,
        session: {
          description: sessionDescription,
        },
      });

      // Rafraîchir la liste des sessions après création
      const sessionsCollection = collection(db, 'sessions');
      const sessionQuery = query(sessionsCollection, where('clientId', '==', id));
      const sessionSnapshot = await getDocs(sessionQuery);
      const sessionList = sessionSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setSessions(sessionList);

      handleClose();
    } catch (error) {
      console.error('Erreur lors de la création de la session:', error);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const storageRef = ref(storage, `prescriptions/${id}/${file.name}`);

    try {
      // Upload du fichier PDF vers Firebase Storage
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);

      // Enregistrer les informations de la prescription dans Firestore
      await addDoc(collection(db, 'prescriptions'), {
        clientId: id,
        fileName: file.name,
        fileURL: downloadURL,
        createdAt: new Date(),
      });

      // Envoyer l'événement au dataLayer lorsque le client est vu
      window.dataLayer.push({
        event: 'create_prescription',
        clientId: id,
        prescription: {
          fileName: file.name,
          fileURL: downloadURL,
        },
      });

      // Ajouter la prescription à l'état local
      setPrescriptions([...prescriptions, { fileName: file.name, fileURL: downloadURL }]);

    } catch (error) {
      console.error('Erreur lors de l\'upload de la prescription:', error);
    }
  };

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

  if (loading) {
    return <Typography variant="h6">Chargement...</Typography>;
  }

  if (!client) {
    return <Typography variant="h6">Client introuvable</Typography>;
  }

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

      {/* Section pour afficher et créer des sessions */}
      <Box mt={4}>
        <Typography variant="h6" gutterBottom>
          Sessions
        </Typography>
        {sessions.length > 0 ? (
          <List>
            {sessions.map((session) => (
              <ListItem key={session.id} style={{ backgroundColor: '#f0f0f0', marginBottom: '10px', borderRadius: '8px' }}>
                <ListItemText
                  primary={`Session créée le : ${new Date(session.createdAt.toDate()).toLocaleDateString()}`}
                  secondary={session.description}
                />
              </ListItem>
            ))}
          </List>
        ) : (
          <Typography variant="body1">Ce client n'a pas encore de sessions.</Typography>
        )}
        <Button variant="contained" color="primary" onClick={handleOpen}>
          Ajouter une Session
        </Button>
      </Box>

      {/* Formulaire de création de session */}
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Créer une nouvelle Session</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Description"
            type="text"
            fullWidth
            value={sessionDescription}
            onChange={(e) => setSessionDescription(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="primary">
            Annuler
          </Button>
          <Button onClick={handleSessionSubmit} color="primary">
            Créer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Section des prescriptions */}
      <Box mt={4}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6" gutterBottom>
            Prescriptions
          </Typography>
          <Button variant="contained" component="label">
            Importer une prescription
            <input
              type="file"
              accept="application/pdf"
              hidden
              onChange={handleFileUpload}
            />
          </Button>
        </Box>
        {prescriptions.length > 0 ? (
          <List>
            {prescriptions.map((prescription) => (
              <ListItem
                key={prescription.id}
                button
                component="a"
                href={prescription.fileURL}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  backgroundColor: '#f9f9f9',
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
                  primary={`Prescription: ${prescription.fileName}`}
                  primaryTypographyProps={{ style: { fontWeight: 'bold' } }}
                />
              </ListItem>
            ))}
          </List>
        ) : (
          <Typography variant="body1">Ce client n'a pas encore de prescription.</Typography>
        )}
      </Box>

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

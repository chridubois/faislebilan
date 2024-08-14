// src/pages/Client.js
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Container, Typography, Table, TableBody, TableCell, TableHead, TableRow, Button, List, ListItem, ListItemText } from '@mui/material';

function Client() {
  const { id } = useParams();
  const [client, setClient] = useState(null);
  const [bilans, setBilans] = useState([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <Container>
      <Typography variant="h4" component="h1" gutterBottom>
        Informations du client
        <Button
          variant="contained"
          color="primary"
          component={Link}
          to="/funnel"
          style={{ float: 'right' }}
        >
          Nouveau bilan
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
        <List>
          {bilans.map((bilan) => (
            <ListItem key={bilan.id} button component={Link} to={`/bilan/${bilan.id}`}>
              <ListItemText primary={`Bilan créé le : ${bilan.createdAt.toDate().toLocaleDateString()}`} />
            </ListItem>
          ))}
        </List>
      ) : (
        <Typography variant="body1">Ce client n'a pas encore fait de bilan.</Typography>
      )}
    </Container>
  );
}

export default Client;

// src/pages/ListeClients.js
import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Container, Typography, List, ListItem, ListItemText } from '@mui/material';
import { Link } from 'react-router-dom';

function ListeClients() {
  const [clients, setClients] = useState([]);

  useEffect(() => {
    const fetchClients = async () => {
      const clientsCollection = collection(db, 'clients');
      const clientSnapshot = await getDocs(clientsCollection);
      const clientList = clientSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setClients(clientList);
    };

    fetchClients();
  }, []);

  return (
    <Container>
      <Typography variant="h4" component="h1" gutterBottom>
        Liste des clients
      </Typography>
      <List>
        {clients.map((client) => (
          <ListItem key={client.id} button component={Link} to={`/client/${client.id}`}>
            <ListItemText primary={client.name} secondary={`Date de naissance : ${client.dob}`} />
          </ListItem>
        ))}
      </List>
    </Container>
  );
}

export default ListeClients;

// src/pages/AdminPage.js
import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword, signInWithCustomToken } from 'firebase/auth';
import { db } from '../config/firebase';
import { Container, Typography, Button, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';

function AdminPage() {
  const [users, setUsers] = useState([]);
  const [adminToken, setAdminToken] = useState(null); // Stocker le token de l'admin pour restauration
  const navigate = useNavigate();
  const auth = getAuth();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersCollection = collection(db, 'users');
        const userSnapshot = await getDocs(usersCollection);
        const userList = userSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setUsers(userList);
      } catch (error) {
        console.error('Erreur lors de la récupération des utilisateurs:', error);
      }
    };

    fetchUsers();
  }, []);

  // Fonction pour sauvegarder le contexte de l'administrateur
  const saveAdminContext = async () => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      const token = await currentUser.getIdToken();
      setAdminToken(token); // Sauvegarder le token d'administrateur
    }
  };

  // Fonction pour se connecter en tant qu'un autre utilisateur
  const impersonateUser = async (email) => {
    try {
      await saveAdminContext(); // Sauvegarder le contexte admin avant de changer de compte

      // Ici, nous utilisons un mot de passe par défaut ou récupéré d'une autre manière
      // Note : Ce n'est pas sécurisé d'utiliser des mots de passe en dur en production.
      const password = prompt(`Entrez le mot de passe pour l'utilisateur ${email}:`);

      if (password) {
        await signInWithEmailAndPassword(auth, email, password);

        // Rediriger vers la page d'accueil après la connexion
        navigate('/');
      } else {
        console.log("Mot de passe requis pour se connecter.");
      }
    } catch (error) {
      console.error("Erreur lors de l'impersonation:", error);
    }
  };

  // Fonction pour restaurer la session de l'administrateur
  const restoreAdmin = async () => {
    try {
      if (adminToken) {
        await signInWithCustomToken(auth, adminToken);
        console.log('Session administrateur restaurée');
      }
    } catch (error) {
      console.error("Erreur lors de la restauration de l'administrateur:", error);
    }
  };

  return (
    <Container>
      <Typography variant="h4" component="h1" gutterBottom>
        Liste des utilisateurs
      </Typography>

      <Box mt={4}>
        {users.map(user => (
          <Box key={user.id} mb={2}>
            <Typography variant="h6">{user.email} ({user.role})</Typography>
            <Button variant="contained" color="primary" onClick={() => impersonateUser(user.email)}>
              Se connecter en tant que cet utilisateur
            </Button>
          </Box>
        ))}
      </Box>

      {adminToken && (
        <Box mt={4}>
          <Button variant="outlined" color="secondary" onClick={restoreAdmin}>
            Restaurer l'administrateur
          </Button>
        </Box>
      )}
    </Container>
  );
}

export default AdminPage;

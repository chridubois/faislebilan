// src/pages/Funnel.js
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Container, Typography, TextField, Button, Box } from '@mui/material';
import { calculateLegPositionIndex, calculateSouplessePostIndex, calculateHandPositionIndex, calculateSorensenIndex, calculatePlankIndex, calculateAssisDeboutIndex, calculatePushupIndex, calculateChairIndex, calculate6MinWalkIndex } from '../utils/utils';
import { fetchTests } from '../services/testService';

function Funnel() {
  const location = useLocation();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [clientExists, setClientExists] = useState(false);
  const [responses, setResponses] = useState({
    name: '',
    dob: '',
    gender: '',
    height: '',
    weight: ''
  });
  const [tests, setTests] = useState([]);

  useEffect(() => {
    if (location.state?.clientId) {
      // Si le client est déjà connu, définir les réponses par défaut et sauter aux tests
      setClientExists(true);
      setResponses(location.state.client);
      setStep(5); // Passer directement aux tests (5 est l'index après les 5 premières questions)
    }
  }, [location.state]);

  useEffect(() => {
    const fetchAllTests = async () => {
      const allTests = await fetchTests();
      setTests(Object.values(allTests)); // Conserver les valeurs pour l'accès
    };

    fetchAllTests();
  }, []);

  const initialQuestions = [
    { id: 'name', title: 'Quel est le nom-prénom du client ?', type: 'text' },
    { id: 'dob', title: 'Quelle est la date de naissance ?', type: 'date' },
    { id: 'gender', title: 'Quel est le sexe du client ?', type: 'select', options: ['Homme', 'Femme'] },
    { id: 'height', title: 'Quelle est la taille du client ? (cm)', type: 'number' },
    { id: 'weight', title: 'Quel est le poids du client ? (kg)', type: 'number' }
  ];

  const allSteps = [...initialQuestions, ...tests];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setResponses({
      ...responses,
      [name]: value
    });
  };

  const handleNext = async () => {
    if (step === 0 && !clientExists) {
      // Vérifier si l'utilisateur existe lors de la première étape (nom-prénom)
      const clientsRef = collection(db, 'clients');
      const q = query(clientsRef, where('name', '==', responses.name));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        // Si le client existe, récupérer ses données et passer aux tests
        querySnapshot.forEach((doc) => {
          setResponses(doc.data());
        });
        setClientExists(true);
        setStep(5); // Passer directement aux tests
        return;
      }
    }

    if (step < allSteps.length - 1) {
      setStep(step + 1);
    } else {
      handleSubmit();
    }
  };

  const handlePrevious = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const handleSkip = () => {
    if (step < allSteps.length - 1) {
      setStep(step + 1);
    } else {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    try {
      let clientId = location.state?.clientId;

      if (!clientId && !clientExists) {
        const newClient = {
          name: responses.name,
          dob: responses.dob,
          gender: responses.gender,
          height: responses.height,
          weight: responses.weight,
          createdAt: new Date(),
        };
        const clientDocRef = await addDoc(collection(db, 'clients'), newClient);
        clientId = clientDocRef.id;
      } else if (!clientId) {
        const clientsRef = collection(db, 'clients');
        const q = query(clientsRef, where('name', '==', responses.name));
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach((doc) => {
          clientId = doc.id;
        });
      }

      if (!clientId) {
        throw new Error("Client ID is undefined");
      }

      const age = new Date().getFullYear() - new Date(responses.dob).getFullYear();

      // Calcul des indices pour chaque test et création de l'objet tests avec le nom du test
      const testsWithNames = {};
      for (const test of tests) {
        let index = 0;

        if (test.name === 'assis debout') {
          index = calculateAssisDeboutIndex(responses.gender, age, responses[test.id]);
        } else if (test.name === 'pushup') {
          index = calculatePushupIndex(responses.gender, age, responses[test.id]);
        } else if (test.name === 'chaise') {
          index = calculateChairIndex(responses[test.id]);
        } else if (test.name === '6min marche') {  // Assurez-vous que l'ID est correct
          index = calculate6MinWalkIndex(responses.gender, age, responses[test.id]);
        } else if (test.name === 'planche') {  // Assurez-vous que l'ID est correct
          index = calculatePlankIndex(responses[test.id]);
        } else if (test.name === 'sorensen') {
          index = calculateSorensenIndex(responses.gender, age, responses[test.id]);
        } else if (test.name === 'mobilité épaule') {
          index = calculateHandPositionIndex(responses[test.id]);
        } else if (test.name === 'souplesse chaîne post') {
          index = calculateSouplessePostIndex(responses.gender, responses[test.id]);
        } else if (test.name === 'mobilité hanches') {
          index = calculateLegPositionIndex(responses[test.id])
        }

        testsWithNames[test.id] = {
          name: test.name, // Assurez-vous que 'name' existe dans chaque test
          response: responses[test.id],
          index: index
        };
      }

      const newBilan = {
        clientId: clientId,
        tests: testsWithNames, // Enregistre les réponses, indices et noms pour chaque test
        createdAt: new Date(),
      };

      const bilanDocRef = await addDoc(collection(db, "bilans"), newBilan);
      navigate(`/bilan/${bilanDocRef.id}`);
    } catch (e) {
      console.error("Erreur lors de la création du bilan :", e);
    }
  };


  return (
    <Container maxWidth="sm">
      <Box
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        minHeight="50vh"
        textAlign="center"
      >
        <Typography variant="h5" component="h1" gutterBottom>
          {allSteps[step]?.title}
        </Typography>

        {allSteps[step]?.description && (
          <Typography variant="body1" paragraph>
            {allSteps[step]?.description}
          </Typography>
        )}
        {allSteps[step]?.image && (
          <img src={allSteps[step]?.image} alt={allSteps[step]?.title} style={{ maxWidth: '80%', height: 'auto', marginBottom: '20px' }} />
        )}

        {allSteps[step]?.type === 'select' ? (
          <TextField
            select
            SelectProps={{ native: true }}
            name={allSteps[step]?.id}
            value={responses[allSteps[step]?.id] || ''} // Assurez-vous que la valeur est spécifique au test actuel
            onChange={handleInputChange}
            variant="outlined"
            fullWidth
            key={step} // Ajoutez cette clé pour forcer le re-rendu lors du changement de test
          >
            <option value="">Sélectionnez une option</option>
            {allSteps[step]?.options?.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </TextField>
        ) : (
          <TextField
            type={allSteps[step]?.type}
            name={allSteps[step]?.id}
            value={responses[allSteps[step]?.id] || ''} // Assurez-vous que la valeur est spécifique au test actuel
            onChange={handleInputChange}
            variant="outlined"
            fullWidth
            margin="normal"
            placeholder={allSteps[step]?.placeholder || ''}
          />
        )}

        <Box mt={2} display="flex" justifyContent="space-between" width="100%">
          <Button variant="contained" color="primary" onClick={handlePrevious} disabled={step === 0}>
            Précédent
          </Button>
          <Box>
            <Button variant="contained" color="primary" onClick={handleNext} style={{ marginRight: '10px' }}>
              Suivant
            </Button>
            <Button variant="text" color="secondary" onClick={handleSkip}>
              Passer
            </Button>
          </Box>
        </Box>
      </Box>
    </Container>
  );
}

export default Funnel;

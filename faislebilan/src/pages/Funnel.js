// src/pages/Funnel.js
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Container, Typography, TextField, Button, Box } from '@mui/material';
import { calculateCoordinationJambesBrasIndex, calculateHipFlexionMobilityIndex, calculate2MinWalkIndex, calculateActivityLevelCoeff, calculateLegPositionIndex, calculateSouplessePostIndex, calculateHandPositionIndex, calculateSorensenIndex, calculatePlankIndex, calculateAssisDeboutIndex, calculatePushupIndex, calculateChairIndex, calculate6MinWalkIndex, calculateRuffierIndex } from '../utils/utils';
import { fetchTests } from '../services/testService';
import { LinearProgress } from '@mui/material';
import { getAuth } from 'firebase/auth';


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
    weight: '',
    activity: '',
  });
  const [tests, setTests] = useState([]);
  const [errors, setErrors] = useState({});


  useEffect(() => {
    if (location.state?.clientId) {
      // Si le client est déjà connu, définir les réponses par défaut et sauter aux tests
      setClientExists(true);
      setResponses(location.state.client);
      setStep(6); // Passer directement aux tests (5 est l'index après les 5 premières questions)
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
    { id: 'weight', title: 'Quel est le poids du client ? (kg)', type: 'number' },
    {
      id: 'activity', title: 'Quel est le niveau d\'activité du client ?', description: (
        <ul>
          <li><strong>Sédentaire :</strong> Peu ou pas d’activité physique, mode de vie sédentaire.</li>
          <li><strong>Légèrement actif :</strong> Activité physique légère ou sports 1 à 3 jours par semaine.</li>
          <li><strong>Modéremment actif :</strong> Activité physique modérée ou sports 3 à 5 jours par semaine.</li>
          <li><strong>Très actif :</strong> Activité physique intense ou sports 6 à 7 jours par semaine.</li>
          <li><strong>Extrèmement actif :</strong> Entraînement très intense, souvent 2 fois par jour.</li>
        </ul>
      ), type: 'select', options: ['Sédentaire', 'Légèrement actif', 'Modéremment actif', 'Très actif', 'Extrèmement actif']
    }
  ];

  const allSteps = [...initialQuestions, ...tests];

  const progress = (step / (allSteps.length - 1)) * 100;

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    // Vérifier si le champ actuel appartient à un test spécifique (comme Ruffier)
    if (name.startsWith("ruffier")) {
      // Extraire l'ID du champ (par exemple, P1, P2, P3)
      const [testName, inputId] = name.split("_");

      setResponses((prevResponses) => ({
        ...prevResponses,
        [testName]: {
          ...prevResponses[testName],
          [inputId]: value,  // Mettre à jour la réponse spécifique du test
        },
      }));
    } else {
      // Pour tous les autres cas, continuer la mise à jour habituelle
      setResponses({
        ...responses,
        [name]: value
      });
    }
  };


  const handleNext = async () => {
    if (!validateStep()) {
      return;  // Empêche de passer à l'étape suivante si la validation échoue
    }

    if (step === 0 && !clientExists) {
      const auth = getAuth();
      const user = auth.currentUser; // Obtenez l'utilisateur connecté
      if (!user) {
        throw new Error("User not authenticated");
      }
      // Vérifier si l'utilisateur existe lors de la première étape (nom-prénom)
      const clientsRef = collection(db, 'clients');
      const q = query(clientsRef, where('name', '==', responses.name), where('userId', '==', user.uid));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        // Si le client existe, récupérer ses données et passer aux tests
        querySnapshot.forEach((doc) => {
          setResponses(doc.data());
        });
        setClientExists(true);
        setStep(6); // Passer directement aux tests
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

  const validateStep = () => {
    const currentStep = allSteps[step];
    const newErrors = {};

    if (currentStep.inputs) {
      for (const input of currentStep.inputs) {
        if (!responses[input.id] || responses[input.id].trim() === "") {
          newErrors[input.id] = "Ce champ est obligatoire";  // Message d'erreur
        }
      }
    } else if (currentStep.type !== 'select' && (!responses[currentStep.id] || responses[currentStep.id].trim() === "")) {
      newErrors[currentStep.id] = "Ce champ est obligatoire";  // Message d'erreur
    }

    setErrors(newErrors);  // Mettre à jour l'état des erreurs

    // Retourne true si aucun champ n'est vide, sinon false
    return Object.keys(newErrors).length === 0;
  };



  const handleSubmit = async () => {
    try {
      const auth = getAuth();
      const user = auth.currentUser; // Obtenez l'utilisateur connecté
      if (!user) {
        throw new Error("User not authenticated");
      }
      let clientId = location.state?.clientId;

      if (!clientId && !clientExists) {
        const age = new Date().getFullYear() - new Date(responses.dob).getFullYear();
        const { gender, height, weight } = responses;

        // Calcul BMR (Harris Benedict)
        const bmrHarrisBenedict =
          gender === 'Homme'
            ? 88.362 + 13.397 * weight + 4.799 * height - 5.677 * age
            : 447.593 + 9.247 * weight + 3.098 * height - 4.330 * age;

        // Calcul BMR (Mifflin St Jeor)
        const bmrMifflinStJeor =
          gender === 'Homme'
            ? 10 * weight + 6.25 * height - 5 * age + 5
            : 10 * weight + 6.25 * height - 5 * age - 161;

            console.log(responses);
        const newClient = {
          name: responses.name,
          dob: responses.dob,
          gender: responses.gender,
          height: responses.height,
          weight: responses.weight,
          activity: responses.activity,
          activityCoeff: calculateActivityLevelCoeff(responses.activity),
          bmrHarrisBenedict,
          bmrMifflinStJeor,
          bmrHarrisBenedictFinal: bmrHarrisBenedict * calculateActivityLevelCoeff(responses.activity),
          bmrMifflinStJeorFinal: bmrMifflinStJeor * calculateActivityLevelCoeff(responses.activity),
          createdAt: new Date(),
          userId: user.uid,
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

        if (test.name === 'ruffier') {
          // Gérer le test Ruffier avec plusieurs champs (P1, P2, P3)
          console.log(responses);

          const p1 = parseFloat(responses['P1']) || 0;
          const p2 = parseFloat(responses['P2']) || 0;
          const p3 = parseFloat(responses['P3']) || 0;
          if (isNaN(p1) || isNaN(p2) || isNaN(p3)) {
            throw new Error("Les valeurs P1, P2 ou P3 ne sont pas des nombres valides");
          }
          index = calculateRuffierIndex(p1, p2, p3);
          testsWithNames[test.id] = {
            name: test.name,
            response: { P1: p1, P2: p2, P3: p3 },
            index: index
          };
        } else {
          if (test.name === 'assis debout') {
            index = calculateAssisDeboutIndex(responses.gender, age, responses[test.id]);
          } else if (test.name === 'pushup') {
            index = calculatePushupIndex(responses.gender, age, responses[test.id]);
          } else if (test.name === 'chaise') {
            index = calculateChairIndex(responses[test.id]);
          } else if (test.name === '6min marche') {
            index = calculate6MinWalkIndex(responses.gender, age, responses[test.id]);
          } else if (test.name === 'planche') {
            index = calculatePlankIndex(responses[test.id]);
          } else if (test.name === 'sorensen') {
            index = calculateSorensenIndex(responses.gender, age, responses[test.id]);
          } else if (test.name === 'mobilité épaule') {
            index = calculateHandPositionIndex(responses[test.id]);
          } else if (test.name === 'souplesse chaîne post') {
            index = calculateSouplessePostIndex(responses.gender, responses[test.id]);
          } else if (test.name === 'mobilité hanches') {
            index = calculateLegPositionIndex(responses[test.id]);
          } else if (test.name === 'marche 2min') {
            index = calculate2MinWalkIndex(responses.gender, age, responses[test.id]);
          } else if (test.name === 'mobilité hanche flexion') {
            index = calculateHipFlexionMobilityIndex(responses[test.id]);
          } else if (test.name === 'coordination jambes bras') {
            index = calculateCoordinationJambesBrasIndex(responses[test.id]);
          }

          // Log the calculated index before saving it
          console.log(`Index for ${test.name}: ${index}`);

          testsWithNames[test.id] = {
            name: test.name,
            response: responses[test.id],
            index: index
          };
        }
      }

      const newBilan = {
        clientId: clientId,
        tests: testsWithNames,
        createdAt: new Date(),
        userId: user.uid,
      };

      const bilanDocRef = await addDoc(collection(db, "bilans"), newBilan);
      navigate(`/bilan/${bilanDocRef.id}`);
    } catch (e) {
      console.error("Erreur lors de la création du bilan :", e);
    }
  };

  return (
    <Container maxWidth="sm">
      {/* Barre de progression */}
      <Box width="100%" mb={2}>
        <LinearProgress variant="determinate" value={progress} />
      </Box>
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
            value={responses[allSteps[step]?.id] || ''}
            onChange={handleInputChange}
            variant="outlined"
            fullWidth
            key={step}
          >
            <option value="">Sélectionnez une option</option>
            {allSteps[step]?.options?.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </TextField>
        ) : (
          allSteps[step]?.inputs ? (
            allSteps[step].inputs.map(input => (
              <div key={input.id} style={{ width: '100%' }}>
                <TextField
                  type={input.type}
                  name={input.id}
                  value={responses[input.id] || ''}
                  onChange={handleInputChange}
                  variant="outlined"
                  fullWidth  // Maintenir la pleine largeur
                  margin="normal"
                  placeholder={input.placeholder || ''}
                  label={input.label || ''}
                  error={!!errors[input.id]}  // Afficher l'erreur si présente
                />
                {errors[input.id] && (
                  <Typography variant="body2" color="error">
                    {errors[input.id]}
                  </Typography>
                )}
              </div>
            ))
          ) : (
            <div style={{ width: '100%' }}>
              <TextField
                type={allSteps[step]?.type}
                name={allSteps[step]?.id}
                value={responses[allSteps[step]?.id] || ''}
                onChange={handleInputChange}
                variant="outlined"
                fullWidth  // Maintenir la pleine largeur
                margin="normal"
                placeholder={allSteps[step]?.placeholder || ''}
                error={!!errors[allSteps[step]?.id]}  // Afficher l'erreur si présente
              />
              {errors[allSteps[step]?.id] && (
                <Typography variant="body2" color="error">
                  {errors[allSteps[step]?.id]}
                </Typography>
              )}
            </div>
          )
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

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { collection, query, where, getDocs, addDoc, doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Container, Typography, TextField, Button, Box, LinearProgress, Stepper, Step, StepLabel } from '@mui/material';
import { calculateCoordinationJambesBrasIndex, calculateHipFlexionMobilityIndex, calculate2MinWalkIndex, calculateActivityLevelCoeff, calculateLegPositionIndex, calculateSouplessePostIndex, calculateHandPositionIndex, calculateSorensenIndex, calculatePlankIndex, calculateAssisDeboutIndex, calculatePushupIndex, calculateChairIndex, calculate6MinWalkIndex, calculateRuffierIndex } from '../utils/utils';
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
  const [bilanTemplates, setBilanTemplates] = useState([]);
  // const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState({});

  // Charger les templates de bilan depuis Firestore
  useEffect(() => {
    const fetchBilanTemplates = async () => {
      try {
        const auth = getAuth();
        const user = auth.currentUser; // Obtenez l'utilisateur connecté
        if (!user) {
          throw new Error("User not authenticated");
        }

        // Filtrer les templates par userId
        const templatesCollection = collection(db, 'bilanTemplates');
        const q = query(templatesCollection, where('userId', '==', user.uid));
        const templateSnapshot = await getDocs(q);
        const templates = templateSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Envoyer l'événement au dataLayer lorsque le client est vu
        window.dataLayer.push({
          event: 'begin_bilan',
          userId: user.uid,
        });

        setBilanTemplates(templates);

        if (templates.length === 0) {
          // Si l'utilisateur n'a aucun template, rediriger vers la page avec le message
          navigate('/no-templates');
        }
      } catch (error) {
        console.error('Erreur lors du chargement des modèles de bilans :', error);
      }
    };

    fetchBilanTemplates();
  }, [navigate]);

  // Charger les tests en fonction du template sélectionné
  useEffect(() => {
    const fetchTemplateTests = async () => {
      const selectedTemplateId = responses.template;
      if (selectedTemplateId) {
        const templateDocRef = doc(db, 'bilanTemplates', selectedTemplateId);
        const templateDocSnap = await getDoc(templateDocRef);
        if (templateDocSnap.exists()) {
          const templateData = templateDocSnap.data();
          setTests(templateData.tests || []);
        }
      }
    };

    fetchTemplateTests();
  }, [responses.template]);

  // Initialisation depuis la page client
  useEffect(() => {
    if (location.state?.clientId) {
      // Charger les informations du client dans les réponses
      setResponses(prevResponses => ({
        ...prevResponses,
        ...location.state.client,  // Charger les informations du client
      }));
      // Indiquer que le client existe déjà
      setClientExists(true);
    }
  }, [location.state]);


  const initialQuestions = [
    {
      id: 'template',
      title: 'Choisir un modèle de Bilan',
      type: 'select',
      options: bilanTemplates.map(template => ({
        value: template.id,
        label: template.name,
      })),
    },
    { id: 'name', title: 'Quel est le nom-prénom du bénéficiaire ?', type: 'text' },
    { id: 'dob', title: 'Quelle est la date de naissance ?', type: 'date' },
    {
      id: 'gender', title: 'Quel est le sexe du bénéficiaire ?', type: 'select', options: ['Homme', 'Femme'].map(option => ({
        value: option,
        label: option,
      }))
    },
    { id: 'height', title: 'Quelle est la taille du bénéficiaire ? (cm)', type: 'number' },
    { id: 'weight', title: 'Quel est le poids du bénéficiaire ? (kg)', type: 'number' },
    {
      id: 'activity',
      title: 'Quel est le niveau d\'activité du bénéficiaire ?',
      description: (
        <ul>
          <li><strong>Sédentaire :</strong> Peu ou pas d’activité physique, mode de vie sédentaire.</li>
          <li><strong>Légèrement actif :</strong> Activité physique légère ou sports 1 à 3 jours par semaine.</li>
          <li><strong>Modéremment actif :</strong> Activité physique modérée ou sports 3 à 5 jours par semaine.</li>
          <li><strong>Très actif :</strong> Activité physique intense ou sports 6 à 7 jours par semaine.</li>
          <li><strong>Extrèmement actif :</strong> Entraînement très intense, souvent 2 fois par jour.</li>
        </ul>
      ),
      type: 'select',
      options: ['Sédentaire', 'Légèrement actif', 'Modéremment actif', 'Très actif', 'Extrèmement actif'].map(option => ({
        value: option,
        label: option,
      })),
    }
  ];

  // Si le client existe déjà, ne pas inclure les initialQuestions, sinon les inclure
  const allSteps = clientExists ? [initialQuestions[0], ...tests] : [...initialQuestions, ...tests];


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
      setResponses(prevResponses => ({
        ...prevResponses,
        [name]: value,
      }));
    }
  };


  const handleNext = async () => {
    if (!validateStep()) {
      return;  // Empêche de passer à l'étape suivante si la validation échoue
    }
    if (step === 1 && !clientExists) {
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
          const clientData = doc.data();
          setResponses((prevResponses) => ({
            ...prevResponses,
            ...clientData,
          }));
        });
        setClientExists(true);
        // setStep(1 + tests.length); // Passer directement aux tests
        setStep(1);
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

        // Calcul de l'IMC
        const bmi = weight / ((height / 100) ** 2);

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
          bmi,
          createdAt: new Date(),
          userId: user.uid,
        };
        const clientDocRef = await addDoc(collection(db, 'clients'), newClient);
        window.dataLayer.push({
          event: 'create_client',
          userId: user.uid,
        });
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
        let result = {};

        if (test.name === 'ruffier') {
          const p1 = parseFloat(responses['P1']);
          const p2 = parseFloat(responses['P2']);
          const p3 = parseFloat(responses['P3']);
          if (isNaN(p1) || isNaN(p2) || isNaN(p3)) {
            continue; // Skip this test if the values are invalid
          }
          result = calculateRuffierIndex(p1, p2, p3);
          testsWithNames[test.id] = {
            name: test.name,
            response: { P1: p1, P2: p2, P3: p3 },
            index: result.indice,
            goal: result.goal,
          };
        } else {
          const response = responses[test.id];
          if (response === undefined) {
            continue; // Skip this test if the response is undefined
          }

          // Calculer l'indice et le goal basé sur le nom du test
          if (test.name === 'assis debout') {
            result = calculateAssisDeboutIndex(responses.gender, age, response);
          } else if (test.name === 'pushup') {
            result = calculatePushupIndex(responses.gender, age, response);
          } else if (test.name === 'chaise') {
            result = calculateChairIndex(response);
          } else if (test.name === '6min marche') {
            result = calculate6MinWalkIndex(responses.gender, age, response);
          } else if (test.name === 'planche') {
            result = calculatePlankIndex(response);
          } else if (test.name === 'sorensen') {
            result = calculateSorensenIndex(responses.gender, age, response);
          } else if (test.name === 'mobilité épaule') {
            result = calculateHandPositionIndex(response);
          } else if (test.name === 'souplesse chaîne post') {
            result = calculateSouplessePostIndex(responses.gender, response);
          } else if (test.name === 'mobilité hanches') {
            result = calculateLegPositionIndex(response);
          } else if (test.name === 'marche 2min') {
            result = calculate2MinWalkIndex(responses.gender, age, response);
          } else if (test.name === 'mobilité hanche flexion') {
            result = calculateHipFlexionMobilityIndex(response);
          } else if (test.name === 'coordination jambes bras') {
            result = calculateCoordinationJambesBrasIndex(response);
          }

          if (result.indice !== undefined && response !== undefined) {
            testsWithNames[test.id] = {
              name: test.name,
              response: response,
              index: result.indice,
              goal: result.goal,
            };
          }
        }
      }

      window.dataLayer.push({
        event: 'create_bilan',
        userId: user.uid,
      });

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
    <Container>
      <Typography variant="h4" component="h1" gutterBottom>
        Créer un bilan
      </Typography>
      {/* Barre de progression */}
      <Box width="100%" mb={2}>
        <LinearProgress variant="determinate" value={progress} />
      </Box>

      <Box width="100%" mb={4}>
        <Stepper activeStep={step} alternativeLabel>
          {allSteps.map((label, index) => (
            <Step key={index}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
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
              <option key={option.value} value={option.value}>
                {option.label}
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

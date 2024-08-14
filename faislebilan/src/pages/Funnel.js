import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

function Funnel() {
  const [step, setStep] = useState(0);
  const [responses, setResponses] = useState({
    name: '',
    dob: '',
    gender: '',
    height: '',
    weight: ''
  });
  const [clientExists, setClientExists] = useState(false);
  const navigate = useNavigate();

  const initialQuestions = [
    { id: 'name', title: 'Quel est le nom-prénom du client ?', type: 'text' },
    { id: 'dob', title: 'Quelle est la date de naissance ?', type: 'date' },
    { id: 'gender', title: 'Quel est le sexe du client ?', type: 'select', options: ['Homme', 'Femme'] },
    { id: 'height', title: 'Quelle est la taille du client ? (cm)', type: 'number' },
    { id: 'weight', title: 'Quel est le poids du client ? (kg)', type: 'number' }
  ];

  const tests = [
    { id: 'squat', title: 'Test des squats sur chaise', description: 'Nombre de squats réalisés en 1 minute' },
    { id: 'pushup', title: 'Test des pompes', description: 'Nombre de pompes réalisées en 1 minute' },
    // Ajoute d'autres tests ici
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
    if (step === 0) {
      // Vérifier si l'utilisateur existe lors de la première étape
      const clientsRef = collection(db, 'clients');
      const q = query(clientsRef, where('name', '==', responses.name));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        setClientExists(true);
        console.log('Client trouvé !');
        console.log(step);
        setStep(initialQuestions.length); // Passer directement aux tests
        console.log(step);
        return;
      }
    }

    if (step < allSteps.length - 1) {
      setStep(step + 1);
    } else {
      handleSubmit();
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
      let clientId;

      if (clientExists) {
        // Si l'utilisateur existe, récupérer son ID
        const clientsRef = collection(db, 'clients');
        const q = query(clientsRef, where('name', '==', responses.name));
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach((doc) => {
          clientId = doc.id;
        });
      } else {
        // Sinon, créer un nouvel utilisateur
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
      }

      // Créer un nouvel objet bilan avec les réponses du formulaire
      const newBilan = {
        clientId: clientId,
        tests: tests.reduce((acc, test) => {
          acc[test.id] = responses[test.id] || 0;
          return acc;
        }, {}),
        createdAt: new Date(),
      };

      // Ajouter ce nouvel objet à la collection "bilans" dans Firestore
      const docRef = await addDoc(collection(db, "bilans"), newBilan);

      // Naviguer vers la page du bilan avec l'ID du document nouvellement créé
      navigate(`/bilan/${docRef.id}`);
    } catch (e) {
      console.error("Erreur lors de la création du bilan :", e);
    }
  };

  // Ajout de la vérification conditionnelle pour éviter l'accès à une étape inexistante
  if (step >= allSteps.length) {
    return <div>Aucune étape disponible.</div>;
  }

  return (
    <div>
      <h1>{allSteps[step].title}</h1>
      {allSteps[step].type === 'select' ? (
        <select name={allSteps[step].id} value={responses[allSteps[step].id] || ''} onChange={handleInputChange}>
          <option value="">Sélectionnez une option</option>
          {allSteps[step].options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={allSteps[step].type}
          name={allSteps[step].id}
          value={responses[allSteps[step].id] || ''}
          onChange={handleInputChange}
        />
      )}
      <button onClick={handleNext}>Valider</button>
      <button onClick={handleSkip}>Passer</button>
    </div>
  );
}

export default Funnel;

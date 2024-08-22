import React, { useState, useEffect } from 'react';
import { Container, Typography, Button, TextField, Box } from '@mui/material';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { collection, addDoc, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useNavigate, useParams } from 'react-router-dom';
import { getAuth } from 'firebase/auth';

function CreateBilanTemplate() {
  const { id } = useParams(); // Récupérer l'ID depuis l'URL (si présent)
  const [selectedTests, setSelectedTests] = useState([]);
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [testsAvailable, setTestsAvailable] = useState([]); // État pour stocker les tests disponibles
  const navigate = useNavigate();

  useEffect(() => {
    // Fonction pour récupérer les tests disponibles depuis Firestore
    const fetchTests = async () => {
      try {
        const testsCollectionRef = collection(db, 'tests'); // Assurez-vous que la collection 'tests' existe dans Firestore
        const querySnapshot = await getDocs(testsCollectionRef);
        const tests = querySnapshot.docs.map(doc => {
          const data = doc.data();
          // Adapter les options pour qu'elles aient les propriétés value et label
          if (data.options && Array.isArray(data.options)) {
            data.options = data.options.map(option => {
              return typeof option === 'string' ? { value: option, label: option } : option;
            });
          }
          return { id: doc.id, ...data };
        });
        setTestsAvailable(tests);
      } catch (error) {
        console.error('Erreur lors de la récupération des tests:', error);
      }
    };

    fetchTests();
  }, []);

  useEffect(() => {
    if (id) {
      // Si un ID est présent dans l'URL, récupérer les données du template pour les éditer
      const fetchTemplateData = async () => {
        try {
          const templateDoc = await getDoc(doc(db, 'bilanTemplates', id));
          if (templateDoc.exists()) {
            const templateData = templateDoc.data();
            setTemplateName(templateData.name);
            setTemplateDescription(templateData.description);
            setSelectedTests(templateData.tests);
          } else {
            console.error("Le template n'existe pas.");
          }
        } catch (error) {
          console.error("Erreur lors de la récupération du template:", error);
        }
      };

      fetchTemplateData();
    }
  }, [id]);

  // Fonction pour gérer le drag-and-drop
  const onDragEnd = (result) => {
    if (!result.destination) return;

    const reorderedTests = Array.from(selectedTests);
    const [removed] = reorderedTests.splice(result.source.index, 1);
    reorderedTests.splice(result.destination.index, 0, removed);

    setSelectedTests(reorderedTests);
  };

  const handleAddTest = (test) => {
    setSelectedTests([...selectedTests, test]);
  };

  const handleRemoveTest = (index) => {
    const updatedTests = [...selectedTests];
    updatedTests.splice(index, 1);
    setSelectedTests(updatedTests);
  };

  const handleSubmit = async () => {
    if (!templateName) {
      alert('Le nom du template est requis.');
      return;
    }

    const auth = getAuth();
    const user = auth.currentUser; // Obtenez l'utilisateur connecté
    if (!user) {
      throw new Error("User not authenticated");
    }

    try {
      if (id) {
        // Si un ID est présent, mettre à jour le template existant
        await updateDoc(doc(db, 'bilanTemplates', id), {
          name: templateName,
          description: templateDescription,
          tests: selectedTests,
          updatedAt: new Date(),
        });
      } else {
        // Sinon, créer un nouveau template
        await addDoc(collection(db, 'bilanTemplates'), {
          name: templateName,
          description: templateDescription,
          tests: selectedTests,
          userId: user.uid,
          createdAt: new Date(),
        });
        // Envoyer l'événement au dataLayer lorsque le client est vu
        window.dataLayer.push({
          event: 'create_bilan_templates',
          userId: user.uid,
        });
      }

      navigate('/bilan-templates');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du template de bilan:', error);
    }
  };

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        {id ? 'Modifier le Bilan Template' : 'Créer un Bilan Template'}
      </Typography>

      <TextField
        label="Nom du Template"
        value={templateName}
        onChange={(e) => setTemplateName(e.target.value)}
        fullWidth
        margin="normal"
      />

      <TextField
        label="Description du Template"
        value={templateDescription}
        onChange={(e) => setTemplateDescription(e.target.value)}
        fullWidth
        margin="normal"
      />

      <Typography variant="h6" gutterBottom>
        Tests Disponibles
      </Typography>
      <Box display="flex" flexWrap="wrap" mb={2}>
        {testsAvailable.map((test) => (
          <Button
            key={test.id}
            variant="outlined"
            style={{ margin: '5px' }}
            onClick={() => handleAddTest(test)}
            disabled={selectedTests.find(t => t.id === test.id)}
          >
            {test.name}
          </Button>
        ))}
      </Box>

      <Typography variant="h6" gutterBottom>
        Ordre des Tests Sélectionnés
      </Typography>
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="selectedTests">
          {(provided) => (
            <Box
              ref={provided.innerRef}
              {...provided.droppableProps}
              style={{ backgroundColor: '#f0f0f0', padding: '10px', minHeight: '100px' }}
            >
              {selectedTests.map((test, index) => (
                <Draggable key={test.id} draggableId={test.id} index={index}>
                  {(provided) => (
                    <Box
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      style={{
                        ...provided.draggableProps.style,
                        padding: '10px',
                        margin: '0 0 10px 0',
                        backgroundColor: '#fff',
                        borderRadius: '4px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <Typography>{test.name}</Typography>
                      <Button
                        variant="contained"
                        color="secondary"
                        onClick={() => handleRemoveTest(index)}
                      >
                        Supprimer
                      </Button>
                    </Box>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </Box>
          )}
        </Droppable>
      </DragDropContext>

      <Button
        variant="contained"
        color="primary"
        onClick={handleSubmit}
        disabled={selectedTests.length === 0}
        style={{ marginTop: '20px' }}
      >
        {id ? 'Sauvegarder les Modifications' : 'Créer le Template'}
      </Button>
    </Container>
  );
}

export default CreateBilanTemplate;

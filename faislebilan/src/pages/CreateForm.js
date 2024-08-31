import React, { useState, useEffect } from 'react';
import { Container, TextField, Button, Box, Typography, MenuItem } from '@mui/material';
import { collection, addDoc, updateDoc, doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useNavigate, useParams } from 'react-router-dom';
import { getAuth } from 'firebase/auth';

function CreateForm() {
  const { id } = useParams();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (id) {
      // Charger les données du formulaire si un ID est présent
      const fetchForm = async () => {
        const formDocRef = doc(db, 'forms', id);
        const formDocSnap = await getDoc(formDocRef);
        if (formDocSnap.exists()) {
          const formData = formDocSnap.data();
          setTitle(formData.title);
          setDescription(formData.description);
          setQuestions(formData.questions || []);
        }
      };
      fetchForm();
    }
  }, [id]);

  const handleAddQuestion = () => {
    setQuestions([...questions, { id: Date.now(), title: '', type: 'input', options: [] }]);
  };

  const handleSaveForm = async () => {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      console.error('User not authenticated');
      return;
    }

    const form = {
      title,
      description,
      questions,
      userId: user.uid,
      createdAt: new Date(),
    };

    if (id) {
      await updateDoc(doc(db, 'forms', id), form);
    } else {
      await addDoc(collection(db, 'forms'), form);
    }

    navigate('/manage-forms');
  };

  const handleQuestionChange = (index, field, value) => {
    const newQuestions = [...questions];
    newQuestions[index][field] = value;
    setQuestions(newQuestions);
  };

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        {id ? 'Edit' : 'Create'} Form
      </Typography>
      <TextField
        label="Title"
        value={title}
        onChange={e => setTitle(e.target.value)}
        fullWidth
        margin="normal"
      />
      <TextField
        label="Description"
        value={description}
        onChange={e => setDescription(e.target.value)}
        fullWidth
        margin="normal"
      />

      <Box mt={2}>
        <Button variant="outlined" onClick={handleAddQuestion}>
          Add Question
        </Button>
        {questions.map((question, index) => (
          <Box key={question.id} mt={2}>
            <TextField
              label="Question Title"
              value={question.title}
              onChange={e => handleQuestionChange(index, 'title', e.target.value)}
              fullWidth
              margin="normal"
            />
            <TextField
              select
              label="Type"
              value={question.type}
              onChange={e => handleQuestionChange(index, 'type', e.target.value)}
              fullWidth
              margin="normal"
            >
              <MenuItem value="input">Input</MenuItem>
              <MenuItem value="select">Select</MenuItem>
              <MenuItem value="multi-select">Multi Select</MenuItem>
            </TextField>
            {(question.type === 'select' || question.type === 'multi-select') && (
              <TextField
                label="Options (comma separated)"
                value={question.options.join(', ')}
                onChange={e => handleQuestionChange(index, 'options', e.target.value.split(',').map(opt => opt.trim()))}
                fullWidth
                margin="normal"
              />
            )}
          </Box>
        ))}
      </Box>

      <Button variant="contained" color="primary" onClick={handleSaveForm} sx={{ mt: 2 }}>
        Save Form
      </Button>
    </Container>
  );
}

export default CreateForm;

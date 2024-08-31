// src/pages/FillForm.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Typography, TextField, Button, Box } from '@mui/material';
import { doc, getDoc, addDoc, collection } from 'firebase/firestore';
import { db } from '../config/firebase';

function FillForm() {
  const { formId, clientId } = useParams();
  const [form, setForm] = useState(null);
  const [responses, setResponses] = useState({});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchForm = async () => {
      try {
        const formDocRef = doc(db, 'forms', formId);
        const formDocSnap = await getDoc(formDocRef);
        if (formDocSnap.exists()) {
          setForm(formDocSnap.data());
        }
      } catch (error) {
        console.error('Error fetching form:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchForm();
  }, [formId]);

  const handleResponseChange = (questionId, value) => {
    setResponses(prevResponses => ({
      ...prevResponses,
      [questionId]: value,
    }));
  };

  const handleSubmit = async () => {
    try {
      const formattedResponses = form.questions.map((question) => ({
        questionId: question.id,
        questionTitle: question.title,
        response: responses[question.id] || '',
      }));

      const submission = {
        formId,
        clientId,
        responses: formattedResponses,
        submittedAt: new Date(),
      };

      await addDoc(collection(db, 'formSubmissions'), submission);
      alert('Form submitted successfully!');
      navigate(`/client/${clientId}`);
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('There was an error submitting the form.');
    }
  };

  if (loading) {
    return <Typography variant="h6">Loading form...</Typography>;
  }

  if (!form) {
    return <Typography variant="h6">Form not found</Typography>;
  }

  return (
    <Container>
      <Typography variant="h4" gutterBottom>{form.title}</Typography>
      <Typography variant="body1" gutterBottom>{form.description}</Typography>
      <Box mt={2}>
        {form.questions.map(question => (
          <Box key={question.id} mt={2}>
            <Typography variant="h6">{question.title}</Typography>
            {question.type === 'input' && (
              <TextField
                fullWidth
                variant="outlined"
                value={responses[question.id] || ''}
                onChange={(e) => handleResponseChange(question.id, e.target.value)}
              />
            )}
            {(question.type === 'select' || question.type === 'multi-select') && (
              <TextField
                select
                SelectProps={{ native: true }}
                fullWidth
                variant="outlined"
                value={responses[question.id] || ''}
                onChange={(e) => handleResponseChange(question.id, e.target.value)}
              >
                <option value="">Please select an option</option>
                {question.options.map((option, idx) => (
                  <option key={idx} value={option}>{option}</option>
                ))}
              </TextField>
            )}
          </Box>
        ))}
      </Box>
      <Button
        variant="contained"
        color="primary"
        onClick={handleSubmit}
        sx={{ mt: 3 }}
      >
        Submit
      </Button>
    </Container>
  );
}

export default FillForm;

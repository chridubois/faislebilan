import React, { useState, useEffect } from 'react';
import { Container, Typography, Button, List, ListItem, ListItemText } from '@mui/material';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useNavigate } from 'react-router-dom';

function FormManagement() {
  const [forms, setForms] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchForms = async () => {
      const querySnapshot = await getDocs(collection(db, 'forms'));
      setForms(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };
    fetchForms();
  }, []);

  const handleDelete = async (id) => {
    await deleteDoc(doc(db, 'forms', id));
    setForms(forms.filter(form => form.id !== id));
  };

  return (
    <Container>
      <Typography variant="h4">Manage Forms</Typography>
      <Button variant="contained" color="primary" onClick={() => navigate('/create-form')}>Create New Form</Button>
      <List>
        {forms.map(form => (
          <ListItem key={form.id}>
            <ListItemText primary={form.title} />
            <Button variant="contained" onClick={() => navigate(`/edit-form/${form.id}`)}>Edit</Button>
            <Button variant="contained" color="secondary" onClick={() => handleDelete(form.id)}>Delete</Button>
          </ListItem>
        ))}
      </List>
    </Container>
  );
}

export default FormManagement;

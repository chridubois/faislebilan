// src/services/testService.js
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';

export const fetchTests = async () => {
  try {
    const testsCollectionRef = collection(db, 'tests');
    const querySnapshot = await getDocs(testsCollectionRef);
    const tests = [];
    querySnapshot.forEach((doc) => {
      tests.push({ id: doc.id, ...doc.data() });
    });
    return tests;
  } catch (error) {
    console.error('Erreur lors de la récupération des tests:', error);
    return [];
  }
};

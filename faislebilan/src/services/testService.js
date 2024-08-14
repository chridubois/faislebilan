// src/services/testService.js

import { collection, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { calculateSorensenIndex, calculateAssisDeboutIndex, calculatePlankIndex, calculatePushupIndex, calculateChairIndex, calculate6MinWalkIndex } from '../utils/utils';

export const fetchTests = async () => {
  const testsCollection = collection(db, 'tests');
  const testsSnapshot = await getDocs(testsCollection);
  const tests = testsSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  }));

  // Trier les tests par nom avant de les retourner
  return tests.sort((a, b) => a.name.localeCompare(b.name));
};

export const calculateTestIndices = async (bilan, client) => {
  const allTests = await fetchTests();
  const age = new Date().getFullYear() - new Date(client.dob).getFullYear();

  const testsWithIndices = {};

  for (const test of allTests) {
    const testData = bilan.tests[test.id]; // Récupérer les données du bilan pour ce test

    if (testData) {
      let index = 0;

      if (test.name === 'assis debout') {
        index = calculateAssisDeboutIndex(client.gender, age, testData.response);
      } else if (test.name === 'pushup') {
        index = calculatePushupIndex(client.gender, age, testData.response);
      } else if (test.name === 'chaise') {
        index = calculateChairIndex(testData.response);
      } else if (test.name === '6min marche') {
        index = calculate6MinWalkIndex(client.gender, age, testData.response);
      } else if (test.name === 'planche') {
        index = calculatePlankIndex(testData.response);
      } else if (test.name === 'sorensen') {
        index = calculateSorensenIndex(client.gender, age, testData.response);
      }

      testsWithIndices[test.id] = {
        ...testData,
        index: index,
      };
    }
  }

  return testsWithIndices;
};

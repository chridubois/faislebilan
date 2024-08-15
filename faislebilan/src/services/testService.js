// src/services/testService.js

import { collection, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { calculateLegPositionIndex, calculateSouplessePostIndex, calculateHandPositionIndex, calculateSorensenIndex, calculateAssisDeboutIndex, calculatePlankIndex, calculatePushupIndex, calculateChairIndex, calculate6MinWalkIndex } from '../utils/utils';

// Variable pour stocker les tests en cache
let cachedTests = null;

export const fetchTests = async () => {
  if (cachedTests) {
    return cachedTests;
  }

  const testsCollection = collection(db, 'tests');
  const testsSnapshot = await getDocs(testsCollection);
  cachedTests = testsSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  }));

  // Trier les tests par nom avant de les retourner
  cachedTests = cachedTests.sort((a, b) => a.name.localeCompare(b.name));
  return cachedTests;
};

export const calculateTestIndices = async (bilan, client) => {
  const allTests = await fetchTests();
  const age = new Date().getFullYear() - new Date(client.dob).getFullYear();

  const testsWithIndices = {};

  for (const test of allTests) {
    const testData = bilan.tests[test.id]; // Récupérer les données du bilan pour ce test

    if (testData) {
      let index = 0;

      switch (test.name) {
        case 'assis debout':
          index = calculateAssisDeboutIndex(client.gender, age, testData.response);
          break;
        case 'pushup':
          index = calculatePushupIndex(client.gender, age, testData.response);
          break;
        case 'chaise':
          index = calculateChairIndex(testData.response);
          break;
        case '6min marche':
          index = calculate6MinWalkIndex(client.gender, age, testData.response);
          break;
        case 'planche':
          index = calculatePlankIndex(testData.response);
          break;
        case 'sorensen':
          index = calculateSorensenIndex(client.gender, age, testData.response);
          break;
        case 'mobilité épaule':
          index = calculateHandPositionIndex(testData.response);
          break;
        case 'souplesse chaîne post':
          index = calculateSouplessePostIndex(client.gender, testData.response);
          break;
        case 'mobilité hanches':
          index = calculateLegPositionIndex(testData.response);
          break;
        default:
          index = 0;
          break;
      }

      testsWithIndices[test.id] = {
        ...testData,
        index: index,
      };
    }
  }

  return testsWithIndices;
};

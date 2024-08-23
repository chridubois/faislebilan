// src/services/testService.js

import { collection, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { calculateCoordinationJambesBrasIndex, calculateHipFlexionMobilityIndex, calculate2MinWalkIndex, calculateLegPositionIndex, calculateSouplessePostIndex, calculateHandPositionIndex, calculateSorensenIndex, calculateAssisDeboutIndex, calculatePlankIndex, calculatePushupIndex, calculateChairIndex, calculate6MinWalkIndex } from '../utils/utils';

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
      let result = {};

      switch (test.name) {
        case 'assis debout':
          result = calculateAssisDeboutIndex(client.gender, age, testData.response);
          break;
        case 'pushup':
          result = calculatePushupIndex(client.gender, age, testData.response);
          break;
        case 'chaise':
          result = calculateChairIndex(testData.response);
          break;
        case '6min marche':
          result = calculate6MinWalkIndex(client.gender, age, testData.response);
          break;
        case 'planche':
          result = calculatePlankIndex(testData.response);
          break;
        case 'sorensen':
          result = calculateSorensenIndex(client.gender, age, testData.response);
          break;
        case 'mobilité épaule':
          result = calculateHandPositionIndex(testData.response);
          break;
        case 'souplesse chaîne post':
          result = calculateSouplessePostIndex(client.gender, testData.response);
          break;
        case 'mobilité hanches':
          result = calculateLegPositionIndex(testData.response);
          break;
        case 'marche 2min':
          result = calculate2MinWalkIndex(client.gender, age, testData.response);
          break;
        case 'mobilité hanche flexion':
          result = calculateHipFlexionMobilityIndex(testData.response)
          break;
        case 'coordination jambes bras':
          result = calculateCoordinationJambesBrasIndex(testData.response)
          break;
        default:
          result = 0;
          break;
      }

      testsWithIndices[test.id] = {
        ...testData,
        index: result.index,
        goal: result.goal,
      };
    }
  }

  return testsWithIndices;
};

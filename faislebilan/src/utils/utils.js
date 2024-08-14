// src/utils/utils.js

export const calculateSquatIndex = (age, gender, squats) => {
  if (gender === 'male') {
    if (age < 30) {
      if (squats >= 30) return 5;
      if (squats >= 20) return 4;
      if (squats >= 10) return 3;
      return 2;
    }
    // Ajouter d'autres conditions pour les âges différents
  } else {
    // Ajouter conditions pour les femmes
  }
  return 1;
};

// Ajoute d'autres fonctions de calcul pour d'autres tests ici

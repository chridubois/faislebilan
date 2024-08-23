// src/utils/utils.js

export const calculateAssisDeboutIndex = (sex, age, squats) => {
  if (sex === 'Femme') {
    if (age >= 20 && age <= 29) {
      if (squats > 35) return 5;
      if (squats >= 32 && squats <= 34) return 4;
      if (squats >= 27 && squats <= 31) return 3;
      if (squats >= 21 && squats <= 26) return 2;
      if (squats < 20) return 1;
    } else if (age >= 30 && age <= 39) {
      if (squats > 26) return 5;
      if (squats >= 21 && squats <= 25) return 4;
      if (squats >= 20 && squats <= 22) return 3;
      if (squats >= 18 && squats <= 19) return 2;
      if (squats < 17) return 1;
    } else if (age >= 40 && age <= 49) {
      if (squats > 27) return 5;
      if (squats >= 22 && squats <= 27) return 4;
      if (squats >= 19 && squats <= 21) return 3;
      if (squats >= 17 && squats <= 18) return 2;
      if (squats < 16) return 1;
    } else if (age >= 50 && age <= 59) {
      if (squats > 18) return 5;
      if (squats >= 16 && squats <= 17) return 4;
      if (squats >= 14 && squats <= 15) return 3;
      if (squats >= 12 && squats <= 13) return 2;
      if (squats < 11) return 1;
    } else if (age >= 60) {
      if (squats > 17) return 5;
      if (squats >= 15 && squats <= 16) return 4;
      if (squats >= 13 && squats <= 14) return 3;
      if (squats >= 11 && squats <= 12) return 2;
      if (squats < 10) return 1;
    }
  } else if (sex === 'Homme') {
    console.log('sex:', sex);
    if (age >= 20 && age <= 29) {
      if (squats > 33) return 5;
      if (squats >= 30 && squats <= 32) return 4;
      if (squats >= 25 && squats <= 29) return 3;
      if (squats >= 19 && squats <= 24) return 2;
      if (squats < 18) return 1;
    } else if (age >= 30 && age <= 39) {
      if (squats > 34) return 5;
      if (squats >= 33 && squats <= 33) return 4;
      if (squats >= 31 && squats <= 32) return 3;
      if (squats >= 21 && squats <= 30) return 2;
      if (squats < 20) {
        console.log('age:', age);
        console.log('squats:', squats);
        return 1;
      };
    } else if (age >= 40 && age <= 49) {
      if (squats > 25) return 5;
      if (squats >= 20 && squats <= 24) return 4;
      if (squats >= 19 && squats <= 19) return 3;
      if (squats >= 18 && squats <= 18) return 2;
      if (squats < 17) return 1;
    } else if (age >= 50 && age <= 59) {
      if (squats > 21) return 5;
      if (squats >= 18 && squats <= 20) return 4;
      if (squats >= 15 && squats <= 17) return 3;
      if (squats >= 13 && squats <= 14) return 2;
      if (squats < 12) return 1;
    } else if (age >= 60) {
      if (squats > 19) return 5;
      if (squats >= 17 && squats <= 18) return 4;
      if (squats >= 15 && squats <= 16) return 3;
      if (squats >= 13 && squats <= 14) return 2;
      if (squats < 12) return 1;
    }
  }

  return 0;
};

export const calculatePushupIndex = (sex, age, repetitions) => {
  if (sex === 'Femme') {
    if (age >= 15 && age <= 29) {
      if (repetitions > 38) return 5;
      if (repetitions >= 31 && repetitions <= 37) return 4;
      if (repetitions >= 26 && repetitions <= 30) return 3;
      if (repetitions >= 23 && repetitions <= 25) return 2;
      if (repetitions < 22) return 1;
    } else if (age >= 30 && age <= 39) {
      if (repetitions > 32) return 5;
      if (repetitions >= 29 && repetitions <= 31) return 4;
      if (repetitions >= 20 && repetitions <= 25) return 3;
      if (repetitions >= 17 && repetitions <= 19) return 2;
      if (repetitions < 16) return 1;
    } else if (age >= 40 && age <= 49) {
      if (repetitions > 27) return 5;
      if (repetitions >= 21 && repetitions <= 26) return 4;
      if (repetitions >= 17 && repetitions <= 20) return 3;
      if (repetitions >= 14 && repetitions <= 16) return 2;
      if (repetitions < 13) return 1;
    } else if (age >= 50 && age <= 59) {
      if (repetitions > 23) return 5;
      if (repetitions >= 18 && repetitions <= 22) return 4;
      if (repetitions >= 14 && repetitions <= 17) return 3;
      if (repetitions >= 11 && repetitions <= 13) return 2;
      if (repetitions < 10) return 1;
    } else if (age >= 60) {
      if (repetitions > 19) return 5;
      if (repetitions >= 15 && repetitions <= 18) return 4;
      if (repetitions >= 11 && repetitions <= 14) return 3;
      if (repetitions >= 9 && repetitions <= 10) return 2;
      if (repetitions < 8) return 1;
    }
  } else if (sex === 'Homme') {
    if (age >= 15 && age <= 29) {
      if (repetitions > 38) return 5;
      if (repetitions >= 33 && repetitions <= 37) return 4;
      if (repetitions >= 30 && repetitions <= 32) return 3;
      if (repetitions >= 27 && repetitions <= 29) return 2;
      if (repetitions < 26) return 1;
    } else if (age >= 30 && age <= 39) {
      if (repetitions > 36) return 5;
      if (repetitions >= 30 && repetitions <= 35) return 4;
      if (repetitions >= 26 && repetitions <= 29) return 3;
      if (repetitions >= 24 && repetitions <= 25) return 2;
      if (repetitions < 23) return 1;
    } else if (age >= 40 && age <= 49) {
      if (repetitions > 35) return 5;
      if (repetitions >= 29 && repetitions <= 34) return 4;
      if (repetitions >= 25 && repetitions <= 28) return 3;
      if (repetitions >= 22 && repetitions <= 24) return 2;
      if (repetitions < 21) return 1;
    } else if (age >= 50 && age <= 59) {
      if (repetitions > 32) return 5;
      if (repetitions >= 27 && repetitions <= 31) return 4;
      if (repetitions >= 24 && repetitions <= 26) return 3;
      if (repetitions >= 21 && repetitions <= 23) return 2;
      if (repetitions < 20) return 1;
    } else if (age >= 60) {
      if (repetitions > 25) return 5;
      if (repetitions >= 22 && repetitions <= 24) return 4;
      if (repetitions >= 19 && repetitions <= 21) return 3;
      if (repetitions >= 17 && repetitions <= 18) return 2;
      if (repetitions < 16) return 1;
    }
  }

  return 0;
};

export const calculateChairIndex = (timeInSeconds) => {
  if (timeInSeconds > 120) {
    return 5;
  } else if (timeInSeconds > 90) {
    return 4;
  } else if (timeInSeconds > 55) {
    return 3;
  } else if (timeInSeconds > 35) {
    return 2;
  } else {
    return 1;
  }
};

export const calculate6MinWalkIndex = (sex, age, distance) => {
  if (sex === 'Femme') {
    if (age >= 15 && age <= 29) {
      if (distance > 746) return 5;
      if (distance >= 691 && distance <= 745) return 4;
      if (distance >= 645 && distance <= 690) return 3;
      if (distance >= 589 && distance <= 644) return 2;
      if (distance < 588) return 1;
    } else if (age >= 30 && age <= 39) {
      if (distance > 713) return 5;
      if (distance >= 667 && distance <= 712) return 4;
      if (distance >= 635 && distance <= 666) return 3;
      if (distance >= 590 && distance <= 634) return 2;
      if (distance < 589) return 1;
    } else if (age >= 40 && age <= 49) {
      if (distance > 706) return 5;
      if (distance >= 659 && distance <= 705) return 4;
      if (distance >= 632 && distance <= 658) return 3;
      if (distance >= 595 && distance <= 631) return 2;
      if (distance < 594) return 1;
    } else if (age >= 50 && age <= 59) {
      if (distance > 677) return 5;
      if (distance >= 638 && distance <= 676) return 4;
      if (distance >= 606 && distance <= 637) return 3;
      if (distance >= 563 && distance <= 605) return 2;
      if (distance < 562) return 1;
    }
  } else if (sex === 'Homme') {
    if (age >= 15 && age <= 29) {
      if (distance > 853) return 5;
      if (distance >= 768 && distance <= 852) return 4;
      if (distance >= 732 && distance <= 767) return 3;
      if (distance >= 664 && distance <= 731) return 2;
      if (distance < 663) return 1;
    } else if (age >= 30 && age <= 39) {
      if (distance > 841) return 5;
      if (distance >= 765 && distance <= 840) return 4;
      if (distance >= 743 && distance <= 764) return 3;
      if (distance >= 644 && distance <= 742) return 2;
      if (distance < 643) return 1;
    } else if (age >= 40 && age <= 49) {
      if (distance > 773) return 5;
      if (distance >= 738 && distance <= 772) return 4;
      if (distance >= 701 && distance <= 737) return 3;
      if (distance >= 634 && distance <= 700) return 2;
      if (distance < 633) return 1;
    } else if (age >= 50 && age <= 59) {
      if (distance > 747) return 5;
      if (distance >= 711 && distance <= 746) return 4;
      if (distance >= 683 && distance <= 710) return 3;
      if (distance >= 632 && distance <= 682) return 2;
      if (distance < 631) return 1;
    }
  }

  return 0;
};

export const calculatePlankIndex = (timeInSeconds) => {
  if (timeInSeconds > 90) {
    return 5;
  } else if (timeInSeconds >= 70 && timeInSeconds <= 90) {
    return 4;
  } else if (timeInSeconds >= 31 && timeInSeconds <= 69) {
    return 3;
  } else if (timeInSeconds >= 20 && timeInSeconds <= 30) {
    return 2;
  } else {
    return 1;
  }
};

export const calculateSorensenIndex = (gender, age, timeInSeconds) => {
  let index = 1; // Par défaut, l'indice est 1

  if (gender === 'Homme') {
    if (age >= 15 && age <= 29) {
      if (timeInSeconds > 180) index = 5;
      else if (timeInSeconds >= 130 && timeInSeconds <= 179) index = 4;
      else if (timeInSeconds >= 122 && timeInSeconds <= 129) index = 3;
      else if (timeInSeconds >= 90 && timeInSeconds <= 121) index = 2;
      else if (timeInSeconds < 90) index = 1;
    } else if (age >= 30 && age <= 39) {
      if (timeInSeconds > 180) index = 5;
      else if (timeInSeconds >= 150 && timeInSeconds <= 179) index = 4;
      else if (timeInSeconds >= 120 && timeInSeconds <= 149) index = 3;
      else if (timeInSeconds >= 120 && timeInSeconds <= 119) index = 2;
      else if (timeInSeconds < 120) index = 1;
    } else if (age >= 40 && age <= 49) {
      if (timeInSeconds > 180) index = 5;
      else if (timeInSeconds >= 140 && timeInSeconds <= 179) index = 4;
      else if (timeInSeconds >= 120 && timeInSeconds <= 139) index = 3;
      else if (timeInSeconds >= 85 && timeInSeconds <= 119) index = 2;
      else if (timeInSeconds < 85) index = 1;
    } else if (age >= 50 && age <= 59) {
      if (timeInSeconds > 180) index = 5;
      else if (timeInSeconds >= 130 && timeInSeconds <= 179) index = 4;
      else if (timeInSeconds >= 116 && timeInSeconds <= 129) index = 3;
      else if (timeInSeconds >= 85 && timeInSeconds <= 115) index = 2;
      else if (timeInSeconds < 85) index = 1;
    } else if (age >= 60) {
      if (timeInSeconds > 180) index = 5;
      else if (timeInSeconds >= 120 && timeInSeconds <= 179) index = 4;
      else if (timeInSeconds >= 110 && timeInSeconds <= 119) index = 3;
      else if (timeInSeconds >= 70 && timeInSeconds <= 109) index = 2;
      else if (timeInSeconds < 70) index = 1;
    }
  } else if (gender === 'Femme') {
    if (age >= 15 && age <= 29) {
      if (timeInSeconds > 180) index = 5;
      else if (timeInSeconds >= 165 && timeInSeconds <= 179) index = 4;
      else if (timeInSeconds >= 140 && timeInSeconds <= 164) index = 3;
      else if (timeInSeconds >= 100 && timeInSeconds <= 139) index = 2;
      else if (timeInSeconds < 100) index = 1;
    } else if (age >= 30 && age <= 39) {
      if (timeInSeconds > 180) index = 5;
      else if (timeInSeconds >= 155 && timeInSeconds <= 179) index = 4;
      else if (timeInSeconds >= 130 && timeInSeconds <= 154) index = 3;
      else if (timeInSeconds >= 90 && timeInSeconds <= 129) index = 2;
      else if (timeInSeconds < 90) index = 1;
    } else if (age >= 40 && age <= 49) {
      if (timeInSeconds > 180) index = 5;
      else if (timeInSeconds >= 143 && timeInSeconds <= 179) index = 4;
      else if (timeInSeconds >= 120 && timeInSeconds <= 142) index = 3;
      else if (timeInSeconds >= 100 && timeInSeconds <= 119) index = 2;
      else if (timeInSeconds < 100) index = 1;
    } else if (age >= 50 && age <= 59) {
      if (timeInSeconds > 180) index = 5;
      else if (timeInSeconds >= 124 && timeInSeconds <= 179) index = 4;
      else if (timeInSeconds >= 90 && timeInSeconds <= 123) index = 3;
      else if (timeInSeconds >= 60 && timeInSeconds <= 89) index = 2;
      else if (timeInSeconds < 60) index = 1;
    } else if (age >= 60) {
      if (timeInSeconds > 180) index = 5;
      else if (timeInSeconds >= 100 && timeInSeconds <= 179) index = 4;
      else if (timeInSeconds >= 70 && timeInSeconds <= 99) index = 3;
      else if (timeInSeconds >= 60 && timeInSeconds <= 69) index = 2;
      else if (timeInSeconds < 60) index = 1;
    }
  }

  return index;
};

export const calculateHandPositionIndex = (response) => {
  switch (response) {
    case 'Les mains se touchent paume contre paume':
      return 5;
    case 'Les mains se chevauchent':
      return 4;
    case 'Les doigts se touchent':
      return 3;
    case 'Les mains sont écartées':
      return 2;
    default:
      return 0; // Retourne 0 si la réponse ne correspond à aucun des choix
  }
};

export const calculateSouplessePostIndex = (gender, response) => {
  if (gender === 'Femme') {
    switch (response) {
      case 'Le poignet touche les orteils (au-delà de +20 cm)':
        return 5;
      case 'La jonction doigts-paume touche les orteils (entre +10 et +20 cm)':
        return 4;
      case 'Les doigts touchent les orteils (entre 0 et +10 cm)':
        return 3;
      case 'Les doigts touchent le bas du tibia (entre -10 et 0 cm)':
        return 2;
      case 'Les doigts atteignent le milieu du tibia (entre -20 et -10 cm)':
        return 1;
      default:
        return 0; // Retourne 0 si la réponse ne correspond à aucun des choix
    }
  } else if (gender === 'Homme') {
    switch (response) {
      case 'La jonction doigts-paume touche les orteils (au-delà de +10 cm)':
        return 5;
      case 'Les doigts touchent les orteils (entre 0 et +10 cm)':
        return 4;
      case 'Les doigts touchent le bas du tibia (entre -10 et 0 cm)':
        return 3;
      case 'Les doigts atteignent le milieu du tibia (entre -20 et -10 cm)':
        return 2;
      case 'Les doigts atteignent le haut du tibia (au-delà de -20 cm)':
        return 1;
      default:
        return 0; // Retourne 0 si la réponse ne correspond à aucun des choix
    }
  } else {
    return 0; // Si le sexe n'est ni "Femme" ni "Homme"
  }
};

export const calculateLegPositionIndex = (response) => {
  switch (response) {
    case "Contact total cuisse-ventre, l'autre jambe est tendue au sol":
      return 5;
    case "Contact 1/2 de cuisse sur le ventre, l'autre jambe est tendue au sol":
      return 4;
    case "Contact 1/3 de cuisse sur le ventre, l'autre jambe décolle":
      return 3;
    case "Jambe fléchie mais pas de contact cuisse-ventre":
      return 2;
    case "La personne ne parvient pas à attraper l'arrière du genou":
      return 1;
    default:
      return 0; // Valeur par défaut si aucune correspondance n'est trouvée
  }
};

export const calculate2MinWalkIndex = (gender, age, performance) => {
  console.log('Calculating 2 Min Walk Index');
  console.log('Gender:', gender);
  console.log('Age:', age);
  console.log('Performance:', performance);

  if (gender === 'Femme') {
    console.log('Gender is Femme');
    if (age < 60) {
      if (performance > 114) return 5;
      if (performance >= 95 && performance <= 113) return 4;
      if (performance >= 90 && performance <= 94) return 3;
      if (performance >= 70 && performance <= 89) return 2;
      return 1;
    } else if (age >= 60 && age <= 64) {
      if (performance > 102) return 5;
      if (performance >= 90 && performance <= 101) return 4;
      if (performance >= 78 && performance <= 89) return 3;
      if (performance >= 66 && performance <= 77) return 2;
      return 1;
    } else if (age >= 65 && age <= 69) {
      if (performance > 97) return 5;
      if (performance >= 85 && performance <= 96) return 4;
      if (performance >= 73 && performance <= 84) return 3;
      if (performance >= 61 && performance <= 72) return 2;
      return 1;
    } else if (age >= 70 && age <= 74) {
      if (performance > 87) return 5;
      if (performance >= 76 && performance <= 86) return 4;
      if (performance >= 64 && performance <= 75) return 3;
      if (performance >= 53 && performance <= 63) return 2;
      return 1;
    } else if (age >= 75 && age <= 79) {
      if (performance > 89) return 5;
      if (performance >= 79 && performance <= 88) return 4;
      if (performance >= 69 && performance <= 78) return 3;
      if (performance >= 59 && performance <= 68) return 2;
      return 1;
    } else if (age >= 80 && age <= 84) {
      if (performance > 88) return 5;
      if (performance >= 72 && performance <= 87) return 4;
      if (performance >= 55 && performance <= 71) return 3;
      if (performance >= 39 && performance <= 54) return 2;
      return 1;
    } else if (age >= 85 && age <= 89) {
      if (performance > 66) return 5;
      if (performance >= 54 && performance <= 65) return 4;
      if (performance >= 41 && performance <= 53) return 3;
      if (performance >= 29 && performance <= 40) return 2;
      return 1;
    }
  } else if (gender === 'Homme') {
    console.log('Gender is Homme');
    if (age < 60) {
      if (performance > 124) return 5;
      if (performance >= 110 && performance <= 123) return 4;
      if (performance >= 90 && performance <= 109) return 3;
      if (performance >= 74 && performance <= 89) return 2;
      return 1;
    } else if (age >= 60 && age <= 64) {
      if (performance > 114) return 5;
      if (performance >= 99 && performance <= 113) return 4;
      if (performance >= 84 && performance <= 98) return 3;
      if (performance >= 70 && performance <= 83) return 2;
      return 1;
    } else if (age >= 65 && age <= 69) {
      if (performance > 107) return 5;
      if (performance >= 96 && performance <= 106) return 4;
      if (performance >= 86 && performance <= 95) return 3;
      if (performance >= 75 && performance <= 85) return 2;
      return 1;
    } else if (age >= 70 && age <= 74) {
      if (performance > 105) return 5;
      if (performance >= 93 && performance <= 104) return 4;
      if (performance >= 82 && performance <= 92) return 3;
      if (performance >= 70 && performance <= 81) return 2;
      return 1;
    } else if (age >= 75 && age <= 79) {
      if (performance > 90) return 5;
      if (performance >= 81 && performance <= 89) return 4;
      if (performance >= 71 && performance <= 80) return 3;
      if (performance >= 62 && performance <= 70) return 2;
      return 1;
    } else if (age >= 80 && age <= 84) {
      if (performance > 93) return 5;
      if (performance >= 81 && performance <= 92) return 4;
      if (performance >= 69 && performance <= 80) return 3;
      if (performance >= 57 && performance <= 68) return 2;
      return 1;
    } else if (age >= 85 && age <= 89) {
      if (performance > 72) return 5;
      if (performance >= 59 && performance <= 71) return 4;
      if (performance >= 46 && performance <= 58) return 3;
      if (performance >= 33 && performance <= 45) return 2;
      return 1;
    }
  }

  console.log('No matching conditions found, returning 0');
  return 0; // Valeur par défaut si aucune condition n'est remplie
};

export const calculateHipFlexionMobilityIndex = (position) => {
  switch (position) {
    case 'jambe tendue au-delà de la verticale':
      return 5;
    case 'jambe tendue à la verticale (90°)':
      return 4;
    case 'jambe non-tendue à la verticale (90°)':
      return 3;
    case 'jambe tendue entre 45° et 90°':
      return 2;
    case 'jambe tendue entre 0° et 45°':
      return 1;
    default:
      return 0; // Valeur par défaut pour une entrée non reconnue
  }
};

export const calculateCoordinationJambesBrasIndex = (cycles) => {
  if (cycles > 20) {
    return 5;
  } else if (cycles >= 16 && cycles <= 19) {
    return 4;
  } else if (cycles >= 11 && cycles <= 15) {
    return 3;
  } else if (cycles >= 6 && cycles <= 10) {
    return 2;
  } else if (cycles <= 5) {
    return 1;
  } else {
    throw new Error("Nombre de cycles inconnu pour le test de coordination jambes-bras.");
  }
};

export const calculateRuffierIndex = (P1, P2, P3) => {
  // Convertir les valeurs en nombres
  const p1 = parseFloat(P1);
  const p2 = parseFloat(P2);
  const p3 = parseFloat(P3);

  // Vérifier que les valeurs sont bien des nombres
  if (isNaN(p1) || isNaN(p2) || isNaN(p3)) {
    console.error('Erreur: Les valeurs P1, P2, ou P3 ne sont pas des nombres valides', { P1, P2, P3 });
    return NaN; // Retourner NaN si les valeurs sont invalides
  }

  // Calcul de l'indice de Ruffier
  const total = p1 + p2 + p3;
  const result = (total - 200) / 10;
  let index = 0;

  if (result < 0) {
    index = 5;
  } else if (result >= 0 && result <= 5) {
    index = 4;
  } else if (result > 5 && result <= 10) {
    index = 3;
  } else if (result > 10 && result <= 15) {
    index = 2;
  } else if (result > 15) {
    index = 1;
  }

  return index;
};

export const calculateActivityLevelCoeff = (activityLevel) => {
  switch (activityLevel) {
    case 'Sédentaire':
      return 1.1;
    case 'Légèrement actif':
      return 1.3;
    case 'Modéremment actif':
      return 1.5;
    case 'Très actif':
      return 1.6;
    case 'Extrèmement actif':
      return 1.8;
    default:
      throw new Error('Niveau d\'activité non reconnu');
  }
}

// Ajoute d'autres fonctions de calcul pour d'autres tests ici

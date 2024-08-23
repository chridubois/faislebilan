// src/utils/utils.js

export const calculateAssisDeboutIndex = (sex, age, squats) => {
  if (sex === 'Femme') {
    if (age >= 20 && age <= 29) {
      if (squats > 35) return { indice: 5, goal: null };
      if (squats >= 32 && squats <= 34) return { indice: 4, goal: 36 };
      if (squats >= 27 && squats <= 31) return { indice: 3, goal: 33 };
      if (squats >= 21 && squats <= 26) return { indice: 2, goal: 28 };
      if (squats < 20) return { indice: 1, goal: 22 };
    } else if (age >= 30 && age <= 39) {
      if (squats > 26) return { indice: 5, goal: null };
      if (squats >= 21 && squats <= 25) return { indice: 4, goal: 27 };
      if (squats >= 20 && squats <= 22) return { indice: 3, goal: 23 };
      if (squats >= 18 && squats <= 19) return { indice: 2, goal: 21 };
      if (squats < 17) return { indice: 1, goal: 19 };
    } else if (age >= 40 && age <= 49) {
      if (squats > 27) return { indice: 5, goal: null };
      if (squats >= 22 && squats <= 27) return { indice: 4, goal: 28 };
      if (squats >= 19 && squats <= 21) return { indice: 3, goal: 23 };
      if (squats >= 17 && squats <= 18) return { indice: 2, goal: 20 };
      if (squats < 16) return { indice: 1, goal: 18 };
    } else if (age >= 50 && age <= 59) {
      if (squats > 18) return { indice: 5, goal: null };
      if (squats >= 16 && squats <= 17) return { indice: 4, goal: 19 };
      if (squats >= 14 && squats <= 15) return { indice: 3, goal: 17 };
      if (squats >= 12 && squats <= 13) return { indice: 2, goal: 15 };
      if (squats < 11) return { indice: 1, goal: 13 };
    } else if (age >= 60) {
      if (squats > 17) return { indice: 5, goal: null };
      if (squats >= 15 && squats <= 16) return { indice: 4, goal: 18 };
      if (squats >= 13 && squats <= 14) return { indice: 3, goal: 16 };
      if (squats >= 11 && squats <= 12) return { indice: 2, goal: 14 };
      if (squats < 10) return { indice: 1, goal: 12 };
    }
  } else if (sex === 'Homme') {
    if (age >= 20 && age <= 29) {
      if (squats > 33) return { indice: 5, goal: null };
      if (squats >= 30 && squats <= 32) return { indice: 4, goal: 34 };
      if (squats >= 25 && squats <= 29) return { indice: 3, goal: 31 };
      if (squats >= 19 && squats <= 24) return { indice: 2, goal: 26 };
      if (squats < 18) return { indice: 1, goal: 20 };
    } else if (age >= 30 && age <= 39) {
      if (squats > 34) return { indice: 5, goal: null };
      if (squats >= 31 && squats <= 33) return { indice: 4, goal: 35 };
      if (squats >= 21 && squats <= 30) return { indice: 3, goal: 32 };
      if (squats >= 19 && squats <= 20) return { indice: 2, goal: 22 };
      if (squats < 18) return { indice: 1, goal: 20 };
    } else if (age >= 40 && age <= 49) {
      if (squats > 25) return { indice: 5, goal: null };
      if (squats >= 20 && squats <= 24) return { indice: 4, goal: 26 };
      if (squats >= 19) return { indice: 3, goal: 21 };
      if (squats < 18) return { indice: 2, goal: 20 };
      if (squats < 17) return { indice: 1, goal: 19 };
    } else if (age >= 50 && age <= 59) {
      if (squats > 21) return { indice: 5, goal: null };
      if (squats >= 18 && squats <= 20) return { indice: 4, goal: 22 };
      if (squats >= 15 && squats <= 17) return { indice: 3, goal: 19 };
      if (squats >= 13 && squats <= 14) return { indice: 2, goal: 16 };
      if (squats < 12) return { indice: 1, goal: 14 };
    } else if (age >= 60) {
      if (squats > 19) return { indice: 5, goal: null };
      if (squats >= 17 && squats <= 18) return { indice: 4, goal: 20 };
      if (squats >= 15 && squats <= 16) return { indice: 3, goal: 18 };
      if (squats >= 13 && squats <= 14) return { indice: 2, goal: 16 };
      if (squats < 12) return { indice: 1, goal: 14 };
    }
  }

  return { indice: 0, goal: null };
};


export const calculatePushupIndex = (sex, age, repetitions) => {
  if (sex === 'Femme') {
    if (age >= 15 && age <= 29) {
      if (repetitions > 38) return { indice: 5, goal: null };
      if (repetitions >= 31 && repetitions <= 37) return { indice: 4, goal: 39 };
      if (repetitions >= 26 && repetitions <= 30) return { indice: 3, goal: 32 };
      if (repetitions >= 23 && repetitions <= 25) return { indice: 2, goal: 27 };
      if (repetitions < 22) return { indice: 1, goal: 24 };
    } else if (age >= 30 && age <= 39) {
      if (repetitions > 32) return { indice: 5, goal: null };
      if (repetitions >= 29 && repetitions <= 31) return { indice: 4, goal: 33 };
      if (repetitions >= 20 && repetitions <= 25) return { indice: 3, goal: 30 };
      if (repetitions >= 17 && repetitions <= 19) return { indice: 2, goal: 21 };
      if (repetitions < 16) return { indice: 1, goal: 18 };
    } else if (age >= 40 && age <= 49) {
      if (repetitions > 27) return { indice: 5, goal: null };
      if (repetitions >= 21 && repetitions <= 26) return { indice: 4, goal: 28 };
      if (repetitions >= 17 && repetitions <= 20) return { indice: 3, goal: 22 };
      if (repetitions >= 14 && repetitions <= 16) return { indice: 2, goal: 18 };
      if (repetitions < 13) return { indice: 1, goal: 15 };
    } else if (age >= 50 && age <= 59) {
      if (repetitions > 23) return { indice: 5, goal: null };
      if (repetitions >= 18 && repetitions <= 22) return { indice: 4, goal: 24 };
      if (repetitions >= 14 && repetitions <= 17) return { indice: 3, goal: 19 };
      if (repetitions >= 11 && repetitions <= 13) return { indice: 2, goal: 15 };
      if (repetitions < 10) return { indice: 1, goal: 12 };
    } else if (age >= 60) {
      if (repetitions > 19) return { indice: 5, goal: null };
      if (repetitions >= 15 && repetitions <= 18) return { indice: 4, goal: 20 };
      if (repetitions >= 11 && repetitions <= 14) return { indice: 3, goal: 16 };
      if (repetitions >= 9 && repetitions <= 10) return { indice: 2, goal: 12 };
      if (repetitions < 8) return { indice: 1, goal: 10 };
    }
  } else if (sex === 'Homme') {
    if (age >= 15 && age <= 29) {
      if (repetitions > 38) return { indice: 5, goal: null };
      if (repetitions >= 33 && repetitions <= 37) return { indice: 4, goal: 39 };
      if (repetitions >= 30 && repetitions <= 32) return { indice: 3, goal: 34 };
      if (repetitions >= 27 && repetitions <= 29) return { indice: 2, goal: 31 };
      if (repetitions < 26) return { indice: 1, goal: 28 };
    } else if (age >= 30 && age <= 39) {
      if (repetitions > 36) return { indice: 5, goal: null };
      if (repetitions >= 30 && repetitions <= 35) return { indice: 4, goal: 37 };
      if (repetitions >= 26 && repetitions <= 29) return { indice: 3, goal: 31 };
      if (repetitions >= 24 && repetitions <= 25) return { indice: 2, goal: 27 };
      if (repetitions < 23) return { indice: 1, goal: 25 };
    } else if (age >= 40 && age <= 49) {
      if (repetitions > 35) return { indice: 5, goal: null };
      if (repetitions >= 29 && repetitions <= 34) return { indice: 4, goal: 36 };
      if (repetitions >= 25 && repetitions <= 28) return { indice: 3, goal: 30 };
      if (repetitions >= 22 && repetitions <= 24) return { indice: 2, goal: 26 };
      if (repetitions < 21) return { indice: 1, goal: 23 };
    } else if (age >= 50 && age <= 59) {
      if (repetitions > 32) return { indice: 5, goal: null };
      if (repetitions >= 27 && repetitions <= 31) return { indice: 4, goal: 33 };
      if (repetitions >= 24 && repetitions <= 26) return { indice: 3, goal: 28 };
      if (repetitions >= 21 && repetitions <= 23) return { indice: 2, goal: 25 };
      if (repetitions < 20) return { indice: 1, goal: 22 };
    } else if (age >= 60) {
      if (repetitions > 25) return { indice: 5, goal: null };
      if (repetitions >= 22 && repetitions <= 24) return { indice: 4, goal: 26 };
      if (repetitions >= 19 && repetitions <= 21) return { indice: 3, goal: 23 };
      if (repetitions >= 17 && repetitions <= 18) return { indice: 2, goal: 20 };
      if (repetitions < 16) return { indice: 1, goal: 18 };
    }
  }

  return { indice: 0, goal: null };
};


export const calculateChairIndex = (timeInSeconds) => {
  if (timeInSeconds > 120) {
    return { indice: 5, goal: null }; // Déjà au niveau maximum
  } else if (timeInSeconds > 90) {
    return { indice: 4, goal: 121 }; // Objectif : dépasser 120 secondes pour atteindre l'indice 5
  } else if (timeInSeconds > 55) {
    return { indice: 3, goal: 91 }; // Objectif : dépasser 90 secondes pour atteindre l'indice 4
  } else if (timeInSeconds > 35) {
    return { indice: 2, goal: 56 }; // Objectif : dépasser 55 secondes pour atteindre l'indice 3
  } else {
    return { indice: 1, goal: 36 }; // Objectif : dépasser 35 secondes pour atteindre l'indice 2
  }
};


export const calculate6MinWalkIndex = (sex, age, distance) => {
  if (sex === 'Femme') {
    if (age >= 15 && age <= 29) {
      if (distance > 746) return { indice: 5, goal: null }; // Déjà au niveau maximum
      if (distance >= 691 && distance <= 745) return { indice: 4, goal: 746 }; // Objectif : dépasser 746 pour atteindre l'indice 5
      if (distance >= 645 && distance <= 690) return { indice: 3, goal: 691 }; // Objectif : dépasser 690 pour atteindre l'indice 4
      if (distance >= 589 && distance <= 644) return { indice: 2, goal: 645 }; // Objectif : dépasser 644 pour atteindre l'indice 3
      if (distance < 588) return { indice: 1, goal: 589 }; // Objectif : dépasser 588 pour atteindre l'indice 2
    } else if (age >= 30 && age <= 39) {
      if (distance > 713) return { indice: 5, goal: null };
      if (distance >= 667 && distance <= 712) return { indice: 4, goal: 713 };
      if (distance >= 635 && distance <= 666) return { indice: 3, goal: 667 };
      if (distance >= 590 && distance <= 634) return { indice: 2, goal: 635 };
      if (distance < 589) return { indice: 1, goal: 590 };
    } else if (age >= 40 && age <= 49) {
      if (distance > 706) return { indice: 5, goal: null };
      if (distance >= 659 && distance <= 705) return { indice: 4, goal: 706 };
      if (distance >= 632 && distance <= 658) return { indice: 3, goal: 659 };
      if (distance >= 595 && distance <= 631) return { indice: 2, goal: 632 };
      if (distance < 594) return { indice: 1, goal: 595 };
    } else if (age >= 50 && age <= 59) {
      if (distance > 677) return { indice: 5, goal: null };
      if (distance >= 638 && distance <= 676) return { indice: 4, goal: 677 };
      if (distance >= 606 && distance <= 637) return { indice: 3, goal: 638 };
      if (distance >= 563 && distance <= 605) return { indice: 2, goal: 606 };
      if (distance < 562) return { indice: 1, goal: 563 };
    }
  } else if (sex === 'Homme') {
    if (age >= 15 && age <= 29) {
      if (distance > 853) return { indice: 5, goal: null };
      if (distance >= 768 && distance <= 852) return { indice: 4, goal: 853 };
      if (distance >= 732 && distance <= 767) return { indice: 3, goal: 768 };
      if (distance >= 664 && distance <= 731) return { indice: 2, goal: 732 };
      if (distance < 663) return { indice: 1, goal: 664 };
    } else if (age >= 30 && age <= 39) {
      if (distance > 841) return { indice: 5, goal: null };
      if (distance >= 765 && distance <= 840) return { indice: 4, goal: 841 };
      if (distance >= 743 && distance <= 764) return { indice: 3, goal: 765 };
      if (distance >= 644 && distance <= 742) return { indice: 2, goal: 743 };
      if (distance < 643) return { indice: 1, goal: 644 };
    } else if (age >= 40 && age <= 49) {
      if (distance > 773) return { indice: 5, goal: null };
      if (distance >= 738 && distance <= 772) return { indice: 4, goal: 773 };
      if (distance >= 701 && distance <= 737) return { indice: 3, goal: 738 };
      if (distance >= 634 && distance <= 700) return { indice: 2, goal: 701 };
      if (distance < 633) return { indice: 1, goal: 634 };
    } else if (age >= 50 && age <= 59) {
      if (distance > 747) return { indice: 5, goal: null };
      if (distance >= 711 && distance <= 746) return { indice: 4, goal: 747 };
      if (distance >= 683 && distance <= 710) return { indice: 3, goal: 711 };
      if (distance >= 632 && distance <= 682) return { indice: 2, goal: 683 };
      if (distance < 631) return { indice: 1, goal: 632 };
    }
  }

  return { indice: 0, goal: null }; // Retour par défaut si aucune condition n'est remplie
};


export const calculatePlankIndex = (timeInSeconds) => {
  if (timeInSeconds > 90) {
    return { indice: 5, goal: null }; // Déjà au niveau maximum
  } else if (timeInSeconds >= 70 && timeInSeconds <= 90) {
    return { indice: 4, goal: 91 }; // Objectif : dépasser 90 secondes pour atteindre l'indice 5
  } else if (timeInSeconds >= 31 && timeInSeconds <= 69) {
    return { indice: 3, goal: 70 }; // Objectif : dépasser 69 secondes pour atteindre l'indice 4
  } else if (timeInSeconds >= 20 && timeInSeconds <= 30) {
    return { indice: 2, goal: 31 }; // Objectif : dépasser 30 secondes pour atteindre l'indice 3
  } else {
    return { indice: 1, goal: 20 }; // Objectif : dépasser 19 secondes pour atteindre l'indice 2
  }
};


export const calculateSorensenIndex = (gender, age, timeInSeconds) => {
  let result = { indice: 1, goal: null }; // Default to index 1 and no goal

  if (gender === 'Homme') {
    if (age >= 15 && age <= 29) {
      if (timeInSeconds > 180) result = { indice: 5, goal: null };
      else if (timeInSeconds >= 130 && timeInSeconds <= 179) result = { indice: 4, goal: 181 };
      else if (timeInSeconds >= 122 && timeInSeconds <= 129) result = { indice: 3, goal: 130 };
      else if (timeInSeconds >= 90 && timeInSeconds <= 121) result = { indice: 2, goal: 123 };
      else if (timeInSeconds < 90) result = { indice: 1, goal: 91 };
    } else if (age >= 30 && age <= 39) {
      if (timeInSeconds > 180) result = { indice: 5, goal: null };
      else if (timeInSeconds >= 150 && timeInSeconds <= 179) result = { indice: 4, goal: 181 };
      else if (timeInSeconds >= 120 && timeInSeconds <= 149) result = { indice: 3, goal: 151 };
      else if (timeInSeconds >= 120 && timeInSeconds <= 119) result = { indice: 2, goal: 121 };
      else if (timeInSeconds < 120) result = { indice: 1, goal: 121 };
    } else if (age >= 40 && age <= 49) {
      if (timeInSeconds > 180) result = { indice: 5, goal: null };
      else if (timeInSeconds >= 140 && timeInSeconds <= 179) result = { indice: 4, goal: 181 };
      else if (timeInSeconds >= 120 && timeInSeconds <= 139) result = { indice: 3, goal: 141 };
      else if (timeInSeconds >= 85 && timeInSeconds <= 119) result = { indice: 2, goal: 121 };
      else if (timeInSeconds < 85) result = { indice: 1, goal: 86 };
    } else if (age >= 50 && age <= 59) {
      if (timeInSeconds > 180) result = { indice: 5, goal: null };
      else if (timeInSeconds >= 130 && timeInSeconds <= 179) result = { indice: 4, goal: 181 };
      else if (timeInSeconds >= 116 && timeInSeconds <= 129) result = { indice: 3, goal: 131 };
      else if (timeInSeconds >= 85 && timeInSeconds <= 115) result = { indice: 2, goal: 117 };
      else if (timeInSeconds < 85) result = { indice: 1, goal: 86 };
    } else if (age >= 60) {
      if (timeInSeconds > 180) result = { indice: 5, goal: null };
      else if (timeInSeconds >= 120 && timeInSeconds <= 179) result = { indice: 4, goal: 181 };
      else if (timeInSeconds >= 110 && timeInSeconds <= 119) result = { indice: 3, goal: 121 };
      else if (timeInSeconds >= 70 && timeInSeconds <= 109) result = { indice: 2, goal: 111 };
      else if (timeInSeconds < 70) result = { indice: 1, goal: 71 };
    }
  } else if (gender === 'Femme') {
    if (age >= 15 && age <= 29) {
      if (timeInSeconds > 180) result = { indice: 5, goal: null };
      else if (timeInSeconds >= 165 && timeInSeconds <= 179) result = { indice: 4, goal: 181 };
      else if (timeInSeconds >= 140 && timeInSeconds <= 164) result = { indice: 3, goal: 166 };
      else if (timeInSeconds >= 100 && timeInSeconds <= 139) result = { indice: 2, goal: 141 };
      else if (timeInSeconds < 100) result = { indice: 1, goal: 101 };
    } else if (age >= 30 && age <= 39) {
      if (timeInSeconds > 180) result = { indice: 5, goal: null };
      else if (timeInSeconds >= 155 && timeInSeconds <= 179) result = { indice: 4, goal: 181 };
      else if (timeInSeconds >= 130 && timeInSeconds <= 154) result = { indice: 3, goal: 156 };
      else if (timeInSeconds >= 90 && timeInSeconds <= 129) result = { indice: 2, goal: 131 };
      else if (timeInSeconds < 90) result = { indice: 1, goal: 91 };
    } else if (age >= 40 && age <= 49) {
      if (timeInSeconds > 180) result = { indice: 5, goal: null };
      else if (timeInSeconds >= 143 && timeInSeconds <= 179) result = { indice: 4, goal: 181 };
      else if (timeInSeconds >= 120 && timeInSeconds <= 142) result = { indice: 3, goal: 144 };
      else if (timeInSeconds >= 100 && timeInSeconds <= 119) result = { indice: 2, goal: 121 };
      else if (timeInSeconds < 100) result = { indice: 1, goal: 101 };
    } else if (age >= 50 && age <= 59) {
      if (timeInSeconds > 180) result = { indice: 5, goal: null };
      else if (timeInSeconds >= 124 && timeInSeconds <= 179) result = { indice: 4, goal: 181 };
      else if (timeInSeconds >= 90 && timeInSeconds <= 123) result = { indice: 3, goal: 125 };
      else if (timeInSeconds >= 60 && timeInSeconds <= 89) result = { indice: 2, goal: 91 };
      else if (timeInSeconds < 60) result = { indice: 1, goal: 61 };
    } else if (age >= 60) {
      if (timeInSeconds > 180) result = { indice: 5, goal: null };
      else if (timeInSeconds >= 100 && timeInSeconds <= 179) result = { indice: 4, goal: 181 };
      else if (timeInSeconds >= 70 && timeInSeconds <= 99) result = { indice: 3, goal: 101 };
      else if (timeInSeconds >= 60 && timeInSeconds <= 69) result = { indice: 2, goal: 71 };
      else if (timeInSeconds < 60) result = { indice: 1, goal: 61 };
    }
  }

  return result;
};


export const calculateHandPositionIndex = (response) => {
  switch (response) {
    case 'Les mains se touchent paume contre paume':
      return { indice: 5, goal: null }; // Déjà au niveau maximum
    case 'Les mains se chevauchent':
      return { indice: 4, goal: 'Les mains se touchent paume contre paume' }; // Objectif : dépasser 90 secondes pour atteindre l'indice 5
    case 'Les doigts se touchent':
      return { indice: 3, goal: 'Les mains se chevauchent' };
    case 'Les mains sont écartées':
      return { indice: 2, goal: 'Les doigts se touchent' };
    default:
      return { indice: 0, goal: null }; // Valeur par défaut si aucune correspondance n'est trouvée // Retourne 0 si la réponse ne correspond à aucun des choix
  }
};

export const calculateSouplessePostIndex = (gender, response) => {
  if (gender === 'Femme') {
    switch (response) {
      case 'Le poignet touche les orteils (au-delà de +20 cm)':
        return { indice: 5, goal: null }; // Déjà au niveau maximum
      case 'La jonction doigts-paume touche les orteils (entre +10 et +20 cm)':
        return { indice: 4, goal: 'Le poignet touche les orteils (au-delà de +20 cm)' };
      case 'Les doigts touchent les orteils (entre 0 et +10 cm)':
        return { indice: 3, goal: 'La jonction doigts-paume touche les orteils (entre +10 et +20 cm)' };
      case 'Les doigts touchent le bas du tibia (entre -10 et 0 cm)':
        return { indice: 2, goal: 'Les doigts touchent les orteils (entre 0 et +10 cm)' };
      case 'Les doigts atteignent le milieu du tibia (entre -20 et -10 cm)':
        return { indice: 1, goal: 'Les doigts touchent le bas du tibia (entre -10 et 0 cm)' };
      default:
        return { indice: 0, goal: null }; // Valeur par défaut si aucune correspondance n'est trouvée // Retourne 0 si la réponse ne correspond à aucun des choix
    }
  } else if (gender === 'Homme') {
    switch (response) {
      case 'La jonction doigts-paume touche les orteils (au-delà de +10 cm)':
        return { indice: 5, goal: null }; // Déjà au niveau maximum
      case 'Les doigts touchent les orteils (entre 0 et +10 cm)':
        return { indice: 4, goal: 'Le poignet touche les orteils (au-delà de +20 cm)' };
      case 'Les doigts touchent le bas du tibia (entre -10 et 0 cm)':
        return { indice: 3, goal: 'La jonction doigts-paume touche les orteils (entre +10 et +20 cm)' };
      case 'Les doigts atteignent le milieu du tibia (entre -20 et -10 cm)':
        return { indice: 2, goal: 'Les doigts touchent les orteils (entre 0 et +10 cm)' };
      case 'Les doigts atteignent le haut du tibia (au-delà de -20 cm)':
        return { indice: 1, goal: 'Les doigts touchent le bas du tibia (entre -10 et 0 cm)' };
      default:
        return { indice: 0, goal: null }; // Valeur par défaut si aucune correspondance n'est trouvée // Retourne 0 si la réponse ne correspond à aucun des choix
    }
  } else {
    return { indice: 0, goal: null }; // Valeur par défaut si aucune correspondance n'est trouvée // Si le sexe n'est ni "Femme" ni "Homme"
  }
};

export const calculateLegPositionIndex = (response) => {
  switch (response) {
    case "Contact total cuisse-ventre, l'autre jambe est tendue au sol":
      return { indice: 5, goal: null }; // Déjà au niveau maximum
    case "Contact 1/2 de cuisse sur le ventre, l'autre jambe est tendue au sol":
      return { indice: 4, goal: "Contact total cuisse-ventre, l'autre jambe est tendue au sol" };
    case "Contact 1/3 de cuisse sur le ventre, l'autre jambe décolle":
      return { indice: 3, goal: "Contact 1/2 de cuisse sur le ventre, l'autre jambe est tendue au sol" };
    case "Jambe fléchie mais pas de contact cuisse-ventre":
      return { indice: 2, goal: "Contact 1/3 de cuisse sur le ventre, l'autre jambe décolle" };
    case "La personne ne parvient pas à attraper l'arrière du genou":
      return { indice: 1, goal: "Jambe fléchie mais pas de contact cuisse-ventre" };
    default:
      return { indice: 0, goal: null }; // Valeur par défaut si aucune correspondance n'est trouvée
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
      if (performance > 114) return { indice: 5, goal: null };
      if (performance >= 95 && performance <= 113) return { indice: 4, goal: 115 };
      if (performance >= 90 && performance <= 94) return { indice: 3, goal: 96 };
      if (performance >= 70 && performance <= 89) return { indice: 2, goal: 91 };
      return { indice: 1, goal: 71 };
    } else if (age >= 60 && age <= 64) {
      if (performance > 102) return { indice: 5, goal: null };
      if (performance >= 90 && performance <= 101) return { indice: 4, goal: 103 };
      if (performance >= 78 && performance <= 89) return { indice: 3, goal: 91 };
      if (performance >= 66 && performance <= 77) return { indice: 2, goal: 79 };
      return { indice: 1, goal: 67 };
    } else if (age >= 65 && age <= 69) {
      if (performance > 97) return { indice: 5, goal: null };
      if (performance >= 85 && performance <= 96) return { indice: 4, goal: 98 };
      if (performance >= 73 && performance <= 84) return { indice: 3, goal: 86 };
      if (performance >= 61 && performance <= 72) return { indice: 2, goal: 74 };
      return { indice: 1, goal: 62 };
    } else if (age >= 70 && age <= 74) {
      if (performance > 87) return { indice: 5, goal: null };
      if (performance >= 76 && performance <= 86) return { indice: 4, goal: 88 };
      if (performance >= 64 && performance <= 75) return { indice: 3, goal: 77 };
      if (performance >= 53 && performance <= 63) return { indice: 2, goal: 65 };
      return { indice: 1, goal: 54 };
    } else if (age >= 75 && age <= 79) {
      if (performance > 89) return { indice: 5, goal: null };
      if (performance >= 79 && performance <= 88) return { indice: 4, goal: 90 };
      if (performance >= 69 && performance <= 78) return { indice: 3, goal: 80 };
      if (performance >= 59 && performance <= 68) return { indice: 2, goal: 70 };
      return { indice: 1, goal: 60 };
    } else if (age >= 80 && age <= 84) {
      if (performance > 88) return { indice: 5, goal: null };
      if (performance >= 72 && performance <= 87) return { indice: 4, goal: 89 };
      if (performance >= 55 && performance <= 71) return { indice: 3, goal: 73 };
      if (performance >= 39 && performance <= 54) return { indice: 2, goal: 56 };
      return { indice: 1, goal: 40 };
    } else if (age >= 85 && age <= 89) {
      if (performance > 66) return { indice: 5, goal: null };
      if (performance >= 54 && performance <= 65) return { indice: 4, goal: 67 };
      if (performance >= 41 && performance <= 53) return { indice: 3, goal: 55 };
      if (performance >= 29 && performance <= 40) return { indice: 2, goal: 42 };
      return { indice: 1, goal: 30 };
    }
  } else if (gender === 'Homme') {
    console.log('Gender is Homme');
    if (age < 60) {
      if (performance > 124) return { indice: 5, goal: null };
      if (performance >= 110 && performance <= 123) return { indice: 4, goal: 125 };
      if (performance >= 90 && performance <= 109) return { indice: 3, goal: 111 };
      if (performance >= 74 && performance <= 89) return { indice: 2, goal: 91 };
      return { indice: 1, goal: 75 };
    } else if (age >= 60 && age <= 64) {
      if (performance > 114) return { indice: 5, goal: null };
      if (performance >= 99 && performance <= 113) return { indice: 4, goal: 115 };
      if (performance >= 84 && performance <= 98) return { indice: 3, goal: 100 };
      if (performance >= 70 && performance <= 83) return { indice: 2, goal: 85 };
      return { indice: 1, goal: 71 };
    } else if (age >= 65 && age <= 69) {
      if (performance > 107) return { indice: 5, goal: null };
      if (performance >= 96 && performance <= 106) return { indice: 4, goal: 108 };
      if (performance >= 86 && performance <= 95) return { indice: 3, goal: 97 };
      if (performance >= 75 && performance <= 85) return { indice: 2, goal: 87 };
      return { indice: 1, goal: 76 };
    } else if (age >= 70 && age <= 74) {
      if (performance > 105) return { indice: 5, goal: null };
      if (performance >= 93 && performance <= 104) return { indice: 4, goal: 106 };
      if (performance >= 82 && performance <= 92) return { indice: 3, goal: 94 };
      if (performance >= 70 && performance <= 81) return { indice: 2, goal: 83 };
      return { indice: 1, goal: 71 };
    } else if (age >= 75 && age <= 79) {
      if (performance > 90) return { indice: 5, goal: null };
      if (performance >= 81 && performance <= 89) return { indice: 4, goal: 91 };
      if (performance >= 71 && performance <= 80) return { indice: 3, goal: 82 };
      if (performance >= 62 && performance <= 70) return { indice: 2, goal: 72 };
      return { indice: 1, goal: 63 };
    } else if (age >= 80 && age <= 84) {
      if (performance > 93) return { indice: 5, goal: null };
      if (performance >= 81 && performance <= 92) return { indice: 4, goal: 94 };
      if (performance >= 69 && performance <= 80) return { indice: 3, goal: 82 };
      if (performance >= 57 && performance <= 68) return { indice: 2, goal: 70 };
      return { indice: 1, goal: 58 };
    } else if (age >= 85 && age <= 89) {
      if (performance > 72) return { indice: 5, goal: null };
      if (performance >= 59 && performance <= 71) return { indice: 4, goal: 73 };
      if (performance >= 46 && performance <= 58) return { indice: 3, goal: 60 };
      if (performance >= 33 && performance <= 45) return { indice: 2, goal: 47 };
      return { indice: 1, goal: 34 };
    }
  }

  console.log('No matching conditions found, returning 0');
  return { indice: 0, goal: null }; // Valeur par défaut si aucune condition n'est remplie
};


export const calculateHipFlexionMobilityIndex = (position) => {
  switch (position) {
    case 'jambe tendue au-delà de la verticale':
      return { indice: 5, goal: null }; // Déjà au niveau maximum
    case 'jambe tendue à la verticale (90°)':
      return { indice: 4, goal: "jambe tendue au-delà de la verticale" };
    case 'jambe non-tendue à la verticale (90°)':
      return { indice: 3, goal: "jambe tendue à la verticale (90°)" };
    case 'jambe tendue entre 45° et 90°':
      return { indice: 2, goal: "jambe non-tendue à la verticale (90°)" };
    case 'jambe tendue entre 0° et 45°':
      return { indice: 1, goal: "jambe tendue entre 45° et 90°" };
    default:
      return { indice: 0, goal: null }; // Valeur par défaut pour une entrée non reconnue
  }
};

export const calculateCoordinationJambesBrasIndex = (cycles) => {
  let indice = 0;
  let goal = null;

  if (cycles > 20) {
    indice = 5;
    goal = null; // Déjà au niveau maximum
  } else if (cycles >= 16 && cycles <= 19) {
    indice = 4;
    goal = 21; // Objectif : atteindre plus de 20 cycles pour passer à l'indice 5
  } else if (cycles >= 11 && cycles <= 15) {
    indice = 3;
    goal = 16; // Objectif : atteindre 16 cycles pour passer à l'indice 4
  } else if (cycles >= 6 && cycles <= 10) {
    indice = 2;
    goal = 11; // Objectif : atteindre 11 cycles pour passer à l'indice 3
  } else if (cycles <= 5) {
    indice = 1;
    goal = 6; // Objectif : atteindre 6 cycles pour passer à l'indice 2
  } else {
    throw new Error("Nombre de cycles inconnu pour le test de coordination jambes-bras.");
  }

  return { indice, goal };
};


export const calculateRuffierIndex = (P1, P2, P3) => {
  // Convertir les valeurs en nombres
  const p1 = parseFloat(P1);
  const p2 = parseFloat(P2);
  const p3 = parseFloat(P3);

  // Vérifier que les valeurs sont bien des nombres
  if (isNaN(p1) || isNaN(p2) || isNaN(p3)) {
    console.error('Erreur: Les valeurs P1, P2, ou P3 ne sont pas des nombres valides', { P1, P2, P3 });
    return { indice: NaN, goal: null }; // Retourner NaN si les valeurs sont invalides
  }

  // Calcul de l'indice de Ruffier
  const total = p1 + p2 + p3;
  const result = (total - 200) / 10;
  let index = 0;
  let goal = null;

  if (result < 0) {
    index = 5;
    goal = null; // Déjà au niveau maximum
  } else if (result >= 0 && result <= 5) {
    index = 4;
    goal = 0; // Objectif : atteindre un résultat inférieur à 0 pour passer à l'indice 5
  } else if (result > 5 && result <= 10) {
    index = 3;
    goal = 5; // Objectif : atteindre un résultat inférieur à 5 pour passer à l'indice 4
  } else if (result > 10 && result <= 15) {
    index = 2;
    goal = 10; // Objectif : atteindre un résultat inférieur à 10 pour passer à l'indice 3
  } else if (result > 15) {
    index = 1;
    goal = 15; // Objectif : atteindre un résultat inférieur à 15 pour passer à l'indice 2
  }

  return { indice: index, goal: goal };
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

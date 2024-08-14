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

// Ajoute d'autres fonctions de calcul pour d'autres tests ici

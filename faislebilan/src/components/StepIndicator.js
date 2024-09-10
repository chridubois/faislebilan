import React from 'react';
import { Box, Stepper, Step, StepLabel } from '@mui/material';

function StepIndicator({ step, allSteps }) {
  // Vérifie que allSteps est bien un tableau avant d'utiliser .map()
  if (!Array.isArray(allSteps)) {
    console.error('allSteps doit être un tableau', allSteps);
    return null; // Si ce n'est pas un tableau, retourne null pour éviter l'erreur
  }
  return (
    <Box width="100%" mb={4}>
      <Stepper activeStep={step} alternativeLabel>
        {allSteps.map((label, index) => (
          <Step key={index}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>
    </Box>
  );
}

export default StepIndicator;

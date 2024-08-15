import React from 'react';
import { Container, Typography, Accordion, AccordionSummary, AccordionDetails, Box } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

const faqData = [
  {
    question: 'Comment puis-je créer un nouveau bilan ?',
    answer: 'Pour créer un nouveau bilan, cliquez sur le bouton "Lancer un bilan" sur la page d\'accueil ou allez dans la section "Créer un bilan" dans le menu principal.',
  },
  {
    question: 'Comment puis-je consulter mes bilans précédents ?',
    answer: 'Vous pouvez consulter vos bilans précédents en cliquant sur "Liste des bilans" dans le menu principal. Vous y trouverez un historique de tous vos bilans passés.',
  },
  {
    question: 'Comment calculer mon indice de forme ?',
    answer: 'Votre indice de forme est calculé automatiquement à partir des résultats des différents tests que vous effectuez lors de chaque bilan.',
  },
  {
    question: 'Comment puis-je modifier les informations de mon profil ?',
    answer: 'Pour modifier les informations de votre profil, allez dans la section "Profil" à partir du menu principal. Vous pourrez y modifier vos données personnelles.',
  },
  {
    question: 'Que signifie BMR et comment est-il calculé ?',
    answer: 'Le BMR (Basal Metabolic Rate) représente la quantité d\'énergie que votre corps utilise au repos. Il est calculé en utilisant des formules comme Harris-Benedict ou Mifflin St Jeor.',
  },
];

function FAQ() {
  return (
    <Container>
      <Typography variant="h4" component="h1" gutterBottom>
        Foire Aux Questions (FAQ)
      </Typography>
      <Box mt={4}>
        {faqData.map((item, index) => (
          <Accordion key={index}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">{item.question}</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body1">{item.answer}</Typography>
            </AccordionDetails>
          </Accordion>
        ))}
      </Box>
    </Container>
  );
}

export default FAQ;

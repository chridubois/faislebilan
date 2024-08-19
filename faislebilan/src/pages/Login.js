import React, { useState } from 'react';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, sendPasswordResetEmail } from 'firebase/auth';
import { Button, TextField, Typography, Container, Box, Link, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import GoogleIcon from '@mui/icons-material/Google';

function Login() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetMessage, setResetMessage] = useState('');
  const navigate = useNavigate();

  const auth = getAuth();
  const googleProvider = new GoogleAuthProvider();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    try {
      if (isSignUp) {
        // Inscription
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Enregistrer l'utilisateur dans Firestore avec un rôle par défaut de "user"
        const db = getFirestore();
        await setDoc(doc(db, 'users', user.uid), {
          email: user.email,
          role: 'user', // Rôle par défaut
          createdAt: new Date(),
        });
      } else {
        // Connexion
        await signInWithEmailAndPassword(auth, email, password);
      }
      // Rediriger vers la page d'accueil après connexion/inscription réussie
      navigate('/');
    } catch (error) {
      setError(error.message);
    }
  };


  const handleGoogleSignIn = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      // Vérifier si l'utilisateur existe déjà dans Firestore
      const db = getFirestore();
      const userDocRef = doc(db, 'users', user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (!userDocSnap.exists()) {
        // Si l'utilisateur n'existe pas, le créer avec un rôle par défaut de "user"
        await setDoc(userDocRef, {
          email: user.email,
          role: 'user', // Rôle par défaut
          createdAt: new Date(),
        });
      }

      // Rediriger vers la page d'accueil après connexion Google réussie
      navigate('/');
    } catch (error) {
      setError(`Erreur lors de la connexion Google: ${error.message}`);
    }
  };


  const handlePasswordReset = async () => {
    try {
      await sendPasswordResetEmail(auth, resetEmail);
      setResetMessage('Email de réinitialisation envoyé. Vérifiez votre boîte de réception.');
      setResetDialogOpen(false);
    } catch (error) {
      setResetMessage(`Erreur: ${error.message}`);
    }
  };

  return (
    <Container maxWidth="xs">
      <Box mt={8} display="flex" flexDirection="column" alignItems="center">
        <Typography variant="h5">
          {isSignUp ? 'Inscription' : 'Connexion'}
        </Typography>
        <form onSubmit={handleSubmit} style={{ width: '100%', marginTop: '16px' }}>
          <TextField
            variant="outlined"
            margin="normal"
            required
            fullWidth
            id="email"
            label="Adresse Email"
            name="email"
            autoComplete="email"
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <TextField
            variant="outlined"
            margin="normal"
            required
            fullWidth
            name="password"
            label="Mot de passe"
            type="password"
            id="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && (
            <Typography color="error" variant="body2">
              {error}
            </Typography>
          )}
          <Button
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
            style={{ marginTop: '24px' }}
          >
            {isSignUp ? "S'inscrire" : 'Se connecter'}
          </Button>
          <Button
            fullWidth
            variant="contained"
            color="secondary"
            startIcon={<GoogleIcon />}
            onClick={handleGoogleSignIn}
            style={{ marginTop: '16px' }}
          >
            {isSignUp ? "S'inscrire avec Google" : 'Se connecter avec Google'}
          </Button>
          <Box mt={2} display="flex" justifyContent="space-between" width="100%">
            <Link href="#" onClick={() => setIsSignUp(!isSignUp)} variant="body2">
              {isSignUp
                ? 'Vous avez déjà un compte ? Connectez-vous'
                : "Vous n'avez pas de compte ? Inscrivez-vous"}
            </Link>
          </Box>
          <Box mt={2} display="flex" justifyContent="space-between" width="100%">
            {!isSignUp && (
              <Link href="#" onClick={() => setResetDialogOpen(true)} variant="body2">
                Mot de passe oublié ?
              </Link>
            )}
          </Box>
        </form>
      </Box>

      {/* Dialog pour la réinitialisation du mot de passe */}
      <Dialog open={resetDialogOpen} onClose={() => setResetDialogOpen(false)}>
        <DialogTitle>Réinitialiser le mot de passe</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Entrez votre adresse email pour recevoir un lien de réinitialisation du mot de passe.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            id="resetEmail"
            label="Adresse Email"
            type="email"
            fullWidth
            value={resetEmail}
            onChange={(e) => setResetEmail(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResetDialogOpen(false)} color="primary">
            Annuler
          </Button>
          <Button onClick={handlePasswordReset} color="primary">
            Envoyer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Message de succès ou d'erreur pour la réinitialisation */}
      {resetMessage && (
        <Typography color="textSecondary" variant="body2" align="center" style={{ marginTop: '16px' }}>
          {resetMessage}
        </Typography>
      )}
    </Container>
  );
}

export default Login;

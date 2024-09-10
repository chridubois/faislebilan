import React, { useState } from 'react';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, sendPasswordResetEmail } from 'firebase/auth';
import { Button, TextField, Typography, Container, Box, Link, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, AppBar, Toolbar, IconButton, Drawer, List, ListItem, ListItemText } from '@mui/material';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import GoogleIcon from '@mui/icons-material/Google';
import logo from '../images/faislebilan.png';  // Assurez-vous d'avoir votre logo ici

function Login() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetMessage, setResetMessage] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false); // Pour le menu burger
  const navigate = useNavigate();

  const auth = getAuth();
  const googleProvider = new GoogleAuthProvider();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    try {
      if (isSignUp) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        const db = getFirestore();
        await setDoc(doc(db, 'users', user.uid), {
          email: user.email,
          role: 'user',
          createdAt: new Date(),
        });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }

      window.dataLayer.push({
        event: 'login',
        method: 'email',
        userId: auth.currentUser.uid,
      });
      navigate('/dashboard');
    } catch (error) {
      setError(error.message);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      const db = getFirestore();
      const userDocRef = doc(db, 'users', user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (!userDocSnap.exists()) {
        await setDoc(userDocRef, {
          email: user.email,
          role: 'user',
          createdAt: new Date(),
        });
      }

      window.dataLayer.push({
        event: 'login',
        method: 'google',
        userId: auth.currentUser.uid,
      });

      navigate('/dashboard');
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

  const toggleDrawer = () => {
    setDrawerOpen(!drawerOpen);
  };

  return (
    <Box sx={{ backgroundColor: '#2C3E50', minHeight: '100vh', py: 5 }}>
      {/* AppBar similaire à la Home */}
      <AppBar position="static" sx={{ backgroundColor: '#2C3E50', mb: 5 }} elevation={0}>
        <Container maxWidth="xl">
          <Toolbar sx={{ justifyContent: 'space-between' }}>
            {/* Logo */}
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <RouterLink to="/" style={{ textDecoration: 'none' }}> {/* Ajoute le lien vers la home */}
                <img src={logo} alt="faislebilan logo" style={{ height: 40 }} />
              </RouterLink>
            </Box>

            {/* Boutons pour les écrans larges */}
            <Box sx={{ display: { xs: 'none', md: 'block' } }}>
              <Button
                variant="outlined"
                sx={{
                  mr: 2,
                  color: '#FF5722',
                  borderColor: '#FF5722',
                  '&:hover': {
                    backgroundColor: '#FF5722',
                    color: '#fff',
                  },
                }}
                onClick={() => navigate('/signup')}
              >
                Créer un compte
              </Button>
              <Button
                variant="contained"
                sx={{
                  backgroundColor: '#FF5722',
                  color: '#fff',
                  '&:hover': {
                    backgroundColor: '#FF7043',
                  },
                }}
                onClick={() => navigate('/login')}
              >
                Se connecter
              </Button>
            </Box>

            {/* Menu burger pour les écrans plus petits */}
            <IconButton
              color="inherit"
              edge="end"
              onClick={toggleDrawer}
              sx={{ display: { xs: 'block', md: 'none' } }}
            >
              <MenuIcon />
            </IconButton>
          </Toolbar>
        </Container>
      </AppBar>

      {/* Drawer/Menu burger */}
      <Drawer anchor="right" open={drawerOpen} onClose={toggleDrawer}>
        <Box
          sx={{
            width: 250,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            height: '100%',
          }}
        >
          <IconButton onClick={toggleDrawer} sx={{ alignSelf: 'flex-end', m: 2 }}>
            <CloseIcon />
          </IconButton>

          <List>
            <ListItem button onClick={() => { navigate('/signup'); toggleDrawer(); }}>
              <ListItemText primary="Créer un compte" />
            </ListItem>
            <ListItem button onClick={() => { navigate('/login'); toggleDrawer(); }}>
              <ListItemText primary="Se connecter" />
            </ListItem>
          </List>
        </Box>
      </Drawer>

      <Box height={84} />  {/* Espace pour le logo et les boutons */}

      {/* Formulaire de connexion / inscription */}
      <Container maxWidth="sm" sx={{ backgroundColor: '#FFF', padding: 4, borderRadius: 2, boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)' }}>
        <Box display="flex" flexDirection="column" alignItems="center" mb={3}>
          <Typography variant="h5" fontWeight="bold" gutterBottom>
            {isSignUp ? 'Inscription' : 'Connexion'}
          </Typography>
        </Box>
        <form onSubmit={handleSubmit} style={{ width: '100%' }}>
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
            <Typography color="error" variant="body2" align="center" mt={2}>
              {error}
            </Typography>
          )}
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{
              mt: 3,
              backgroundColor: '#FF5722',
              '&:hover': { backgroundColor: '#FF7043' },
            }}
          >
            {isSignUp ? "S'inscrire" : 'Se connecter'}
          </Button>
          <Button
            fullWidth
            variant="contained"
            startIcon={<GoogleIcon />}
            onClick={handleGoogleSignIn}
            sx={{
              mt: 2,
              backgroundColor: '#4285F4',
              '&:hover': { backgroundColor: '#357AE8' },
            }}
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
          {!isSignUp && (
            <Box mt={2} display="flex" justifyContent="space-between" width="100%">
              <Link href="#" onClick={() => setResetDialogOpen(true)} variant="body2">
                Mot de passe oublié ?
              </Link>
            </Box>
          )}
        </form>

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
          <Typography color="textSecondary" variant="body2" align="center" mt={2}>
            {resetMessage}
          </Typography>
        )}
      </Container>
    </Box>
  );
}

export default Login;

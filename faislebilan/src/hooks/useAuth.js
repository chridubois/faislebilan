import { useState, useEffect, useContext, createContext } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore'; // Importer Firestore

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [role, setRole] = useState(null);  // Ajout du rôle de l'utilisateur
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getAuth();
    const db = getFirestore();

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);

      if (user) {
        try {
          // Récupérer le document utilisateur depuis Firestore
          const userDocRef = doc(db, 'users', user.uid);
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            setRole(userData.role);  // Mettre à jour le rôle de l'utilisateur
          } else {
            setRole(null);  // Aucun rôle trouvé
          }
        } catch (error) {
          console.error("Erreur lors de la récupération du rôle :", error);
          setRole(null);
        }
      } else {
        setRole(null);  // Si l'utilisateur n'est pas connecté, pas de rôle
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    role,
    isAuthenticated: !!currentUser,
    isAdmin: role === 'admin',  // Condition pour vérifier si l'utilisateur est admin
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

// src/config/firebase.js

import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDCO_XAqNHGBjj-_Q38wHI5pw3vHJKkA6I",
  authDomain: "faislebilan-6e138.firebaseapp.com",
  projectId: "faislebilan-6e138",
  storageBucket: "faislebilan-6e138.appspot.com",
  messagingSenderId: "129424566187",
  appId: "1:129424566187:web:591998c1b142ee903614ee",
  // measurementId: "G-SM1RSG1DSV"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };

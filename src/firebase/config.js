// src/firebase/config.js

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBTuOWVUj4z5jOsWk-JLRjytjKiln-nr3E",
  authDomain: "water-footprint-tracker-c7a85.firebaseapp.com",
  projectId: "water-footprint-tracker-c7a85",
  storageBucket: "water-footprint-tracker-c7a85.appspot.com",
  messagingSenderId: "456217384343",
  appId: "1:456217384343:web:d11f03c9c11b898bf760d2",
  measurementId: "G-1GC3921QB4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore and Auth
const db = getFirestore(app);
const auth = getAuth(app);

// Export for use in your app
export { db, auth };

// src/firebase/config.js

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Load .env values safely (Firebase breaks if any are undefined)
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "",
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID || "",
};

// Warn developer if ENV is missing
Object.entries(firebaseConfig).forEach(([key, value]) => {
  if (!value) {
    console.warn(`⚠️ Missing Firebase ENV variable: ${key}`);
  }
});

// Initialize Firebase once
const app = initializeApp(firebaseConfig);

// Export initialized services
export const db = getFirestore(app);
export const auth = getAuth(app);

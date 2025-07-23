// src/firebase.ts
// Initialize Firebase SDK and export auth, storage, and firestore instances

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { getFirestore } from 'firebase/firestore';

// Firebase configuration loaded from environment variables
// Ensure these are defined in frontend/.env.local with REACT_APP_ prefix
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY!,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.REACT_APP_FIREBASE_APP_ID!,
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize individual services
export const auth = getAuth(app);
export const storage = getStorage(app);
export const db = getFirestore(app);

import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
  User
} from 'firebase/auth';

// Firebase configuration from environment or demo defaults
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDummyKeyForDemoPurposes12345",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "moc-ngon-huong.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "moc-ngon-huong",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "moc-ngon-huong.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1029384756",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:1029384756:web:abcdef123456"
};

// Initialize Firebase
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
// Avoid background Auth requests with the placeholder key on an unconfigured preview.
// Configured builds continue to use the same Firebase Auth SDK and persistence.
export const auth = import.meta.env.VITE_FIREBASE_API_KEY ? getAuth(app) : null;
export const googleProvider = new GoogleAuthProvider();

export {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithPopup
};
export type { User };

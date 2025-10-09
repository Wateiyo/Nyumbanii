// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";
import { getStorage } from 'firebase/storage';


// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAfAGRoTZkQMesQP-fGN1qnIFnt52GbB3s",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "nyumbanii.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "nyumbanii",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "nyumbanii.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "848107354709",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:848107354709:web:f618d2b1bf9e5f19f3f2dc",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-J9EGRPGCCK"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Analytics (optional)
const analytics = getAnalytics(app);

// Initialize Firebase Authentication and export it
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app); 
export const googleProvider = new GoogleAuthProvider();

export default app;
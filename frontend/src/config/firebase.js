// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAfAGRoTZkQMesQP-fGN1qnIFnt52GbB3s",
  authDomain: "nyumbanii.firebaseapp.com",
  projectId: "nyumbanii",
  storageBucket: "nyumbanii.firebasestorage.app",
  messagingSenderId: "848107354709",
  appId: "1:848107354709:web:f618d2b1bf9e5f19f3f2dc",
  measurementId: "G-J9EGRPGCCK"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Analytics (optional)
const analytics = getAnalytics(app);

// Initialize Firebase Authentication and export it
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export default app;
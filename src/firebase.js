import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  FacebookAuthProvider, 
  OAuthProvider 
} from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD095Aru0PSm63Fuz8gD0pXGFrQHq8LIlo",
  authDomain: "cleo-petalert.firebaseapp.com",
  projectId: "cleo-petalert",
  storageBucket: "cleo-petalert.firebasestorage.app",
  messagingSenderId: "1009293685870",
  appId: "1:1009293685870:web:3216b2934615482098627f"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth
export const auth = getAuth(app);

// Setup Providers
export const googleProvider = new GoogleAuthProvider();
export const facebookProvider = new FacebookAuthProvider();
export const appleProvider = new OAuthProvider('apple.com');

// Optional: you can export the app if you need it elsewhere (e.g. for Firestore or Storage later)
export default app;

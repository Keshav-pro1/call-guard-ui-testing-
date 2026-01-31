import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAsHU-8ySFCDK4SlAr-Lj9TrVtrnhuhqFI",
  authDomain: "callguard-35842.firebaseapp.com",
  projectId: "callguard-35842",
  storageBucket: "callguard-35842.firebasestorage.app",
  messagingSenderId: "993952591641",
  appId: "1:993952591641:web:6d67cc9cadefbd45c1df88"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

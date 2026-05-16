import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyDEYHm3il0gUjv3m4TnpbvMVHmG-MBpdUs",
    authDomain: "catch-game-pro.firebaseapp.com",
    projectId: "catch-game-pro",
    storageBucket: "catch-game-pro.firebasestorage.app",
    messagingSenderId: "736397245695",
    appId: "1:736397245695:web:52cb9316dc33ef9f5e20ca"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const gProvider = new GoogleAuthProvider();

export { app, auth, db, gProvider };

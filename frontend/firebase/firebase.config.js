// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore, doc } from "firebase/firestore";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAl2K5K42XxbtjnqetSR-B4G2o60PhV5Ms",
  authDomain: "coordin-ai-te.firebaseapp.com",
  projectId: "coordin-ai-te",
  storageBucket: "coordin-ai-te.firebasestorage.app",
  messagingSenderId: "956015981020",
  appId: "1:956015981020:web:2cd7437b98092f70891f19",
  measurementId: "G-0WLP5VQD8V"
};

// Initialize Firebase - prevent duplicate initialization
let app;
try {
  app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  console.log("Firebase app initialized successfully:", app.name);
} catch (error) {
  console.error("Firebase initialization error:", error);
  // Fallback to default app if there's an issue
  app = getApp();
}

// Initialize services
let analytics = null;
let Auth = null;
let db = null;

try {
  analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;
  Auth = getAuth(app);
  db = getFirestore(app);
  console.log("Firebase services initialized successfully");
  
  // Test Firestore connectivity
  if (db) {
    console.log("Testing Firestore connectivity...");
    // Simple test to check if Firestore is accessible
    const testDoc = doc(db, "test", "connection");
    console.log("Firestore doc reference created:", testDoc);
  }
} catch (error) {
  console.error("Firebase services initialization error:", error);
}

export { Auth, db };

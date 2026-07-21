// Firebase Configuration using Vite Environment Variables
export const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAbF1w06HaaGiyWPpTghiwIXcho6LBinwM",
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "mecha-chameleon-minigame.firebaseapp.com",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "mecha-chameleon-minigame",
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "mecha-chameleon-minigame.firebasestorage.app",
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "881402638043",
    appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:881402638043:web:3f8a35ae7bc03b3d5166fe",
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-233YYDX9D7"
};

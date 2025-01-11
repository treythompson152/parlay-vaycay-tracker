import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js';
import { getDatabase, ref, onValue } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js';

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBkLHhHTdLWe4ezlt2pnUdptSSdprObryI",
    authDomain: "parlay-vaycay.firebaseapp.com",
    projectId: "parlay-vaycay",
    storageBucket: "parlay-vaycay.appspot.com",
    messagingSenderId: "174327136085",
    appId: "1:174327136085:web:9bebcf73a587005256b9dc",
    measurementId: "G-6TK3RBP788"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

export { database, ref, onValue }; // Export necessary methods for use in other files

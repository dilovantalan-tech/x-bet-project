// /firebase-config.js
// Complete Firebase Configuration

// Firebase SDKs (Will be loaded in HTML)
const firebaseConfig = {
    apiKey: "AIzaSyA72Yo_YGqno9PX25p3yQBvyflcaM-NqEM",
    authDomain: "x-bet-prod-jd.firebaseapp.com",
    projectId: "x-bet-prod-jd",
    storageBucket: "x-bet-prod-jd.firebasestorage.app",
    messagingSenderId: "499334334535",
    appId: "1:499334334535:web:bebc1bf817e24d9e3c4962",
    measurementId: "G-PTV4XMYQ6P"
};

// Initialize Firebase
let app, auth, db, storage;

try {
    if (!firebase.apps.length) {
        app = firebase.initializeApp(firebaseConfig);
        console.log('✅ Firebase initialized successfully');
    } else {
        app = firebase.app();
        console.log('✅ Using existing Firebase app');
    }
    
    auth = firebase.auth();
    db = firebase.firestore();
    storage = firebase.storage();
    
    // Enable offline persistence
    db.enablePersistence().catch(err => {
        console.log('Firebase persistence error:', err);
    });
    
} catch (error) {
    console.error('❌ Firebase initialization error:', error);
}

// Make available globally
window.firebaseApp = app;
window.firebaseAuth = auth;
window.firebaseDb = db;
window.firebaseStorage = storage;

import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GithubAuthProvider, signOut } from 'firebase/auth';

// PASTE YOUR CONFIG HERE:
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
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// GitHub Auth Provider
const githubProvider = new GithubAuthProvider();

// Auth Functions
export const signInWithGitHub = () => signInWithPopup(auth, githubProvider);
export const logout = () => signOut(auth);

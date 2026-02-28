import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyAz1crd9eaE5BmHKhKW4Pb4OZgJGmQf5lk",
  authDomain: "masamples-8fa7c.firebaseapp.com",
  projectId: "masamples-8fa7c",
  storageBucket: "masamples-8fa7c.firebasestorage.app",
  messagingSenderId: "1076141138643",
  appId: "1:1076141138643:web:fee89b41ee7f3ab9f62a26",
  measurementId: "G-KFNKBNTV5F",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export default app;

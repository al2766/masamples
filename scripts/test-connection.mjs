import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, addDoc } from 'firebase/firestore';
import { readFileSync } from 'fs';

const env = readFileSync(new URL('../.env', import.meta.url), 'utf8');
const envVars = Object.fromEntries(
  env.split('\n').filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => { const [k, ...v] = l.split('='); return [k.trim(), v.join('=').trim()]; })
);

const app = initializeApp({
  apiKey: envVars.VITE_FIREBASE_API_KEY,
  authDomain: envVars.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: envVars.VITE_FIREBASE_PROJECT_ID,
  storageBucket: envVars.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: envVars.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: envVars.VITE_FIREBASE_APP_ID,
});
const db = getFirestore(app);

// Test read from orders
try {
  const snap = await getDocs(collection(db, 'orders'));
  console.log('READ orders: OK -', snap.size, 'docs');
} catch (e) {
  console.log('READ orders: FAILED -', e.message);
}

// Test write to products
try {
  const ref = await addDoc(collection(db, 'products'), { _test: true });
  console.log('WRITE products: OK - doc id:', ref.id);
  // We'll clean this up manually
} catch (e) {
  console.log('WRITE products: FAILED -', e.message);
}

process.exit(0);

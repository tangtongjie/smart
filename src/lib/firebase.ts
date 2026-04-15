import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInAnonymously, updateProfile, signOut } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase configuration embedded directly for robustness
const firebaseConfig = {
  projectId: "gen-lang-client-0056106050",
  appId: "1:1032676461317:web:f5e054e042a78c6fd7856c",
  apiKey: "AIzaSyDkxhPBXx2ud_NEuYpV_LUK62ZMr7mmRjg",
  authDomain: "gen-lang-client-0056106050.firebaseapp.com",
  storageBucket: "gen-lang-client-0056106050.firebasestorage.app",
  messagingSenderId: "1032676461317",
  measurementId: ""
};

const FIRESTORE_DB_ID = "ai-studio-66cfc09a-66a4-4333-ac5b-e655f328d988";

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const db = getFirestore(app, FIRESTORE_DB_ID);
export const auth = getAuth(app);

export const loginAnonymously = async (nickname: string) => {
  const { user } = await signInAnonymously(auth);
  await updateProfile(user, { displayName: nickname });
  return user;
};

export const logout = () => signOut(auth);

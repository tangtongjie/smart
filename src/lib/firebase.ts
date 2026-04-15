import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth, signInAnonymously, updateProfile, signOut } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Debugging for Vercel
if ((import.meta as any).env?.PROD) {
  console.log("App running in production mode");
}

let app;
try {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }
} catch (error) {
  console.error("Firebase initialization failed:", error);
}

export const db = app ? getFirestore(app, firebaseConfig.firestoreDatabaseId) : null;
export const auth = app ? getAuth(app) : null;

export const loginAnonymously = async (nickname: string) => {
  if (!auth) throw new Error("Auth not initialized");
  const { user } = await signInAnonymously(auth);
  await updateProfile(user, { displayName: nickname });
  return user;
};

export const logout = () => auth && signOut(auth);

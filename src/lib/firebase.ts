import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, updateProfile, signOut } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

export const loginAnonymously = async (nickname: string) => {
  const { user } = await signInAnonymously(auth);
  await updateProfile(user, { displayName: nickname });
  return user;
};

export const logout = () => signOut(auth);

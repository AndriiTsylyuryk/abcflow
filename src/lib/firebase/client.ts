/**
 * Firebase client SDK — browser-safe.
 * Only NEXT_PUBLIC_ vars are used here.
 */

import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

function getFirebaseConfig() {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

  if (!apiKey || apiKey.length === 0) {
    throw new Error(
      "[ABCflow] NEXT_PUBLIC_FIREBASE_API_KEY is not set.\n" +
      "Create a .env.local file from .env.example and fill in your Firebase credentials.\n" +
      "See README.md → Firebase setup for instructions."
    );
  }

  return {
    apiKey,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
  };
}

// Singleton — Next.js hot reload can re-import modules
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

if (typeof window !== "undefined") {
  const config = getFirebaseConfig();
  app = getApps().length === 0 ? initializeApp(config) : getApps()[0]!;
  auth = getAuth(app);
  db = getFirestore(app);
}

export { auth, db };

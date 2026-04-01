/**
 * Firebase Admin SDK — server-side only.
 * NEVER import this in client components.
 *
 * Credentials are read from server-only env vars.
 */

import admin from "firebase-admin";
import type { App } from "firebase-admin/app";

let adminApp: App;

function getAdminApp(): App {
  if (adminApp) return adminApp;

  // Prevent re-initialisation in Next.js hot reload
  if (admin.apps.length > 0) {
    adminApp = admin.apps[0]!;
    return adminApp;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Missing Firebase Admin credentials. " +
        "Ensure FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY are set."
    );
  }

  adminApp = admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      // Replace literal \n with actual newlines (common in .env files)
      privateKey: privateKey.replace(/\\n/g, "\n"),
    }),
  });

  return adminApp;
}

export function getAdminAuth() {
  return admin.auth(getAdminApp());
}

export function getAdminFirestore() {
  return admin.firestore(getAdminApp());
}

export { admin };

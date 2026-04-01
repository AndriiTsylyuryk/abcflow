"use client";

/**
 * Firebase auth context — provides user state throughout the app.
 * Also manages the __session cookie for middleware-based route protection.
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  type User,
} from "firebase/auth";
import { auth } from "@/lib/firebase/client";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  getIdToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const googleProvider = new GoogleAuthProvider();

/** Call /api/auth/sync to ensure a Firestore user doc exists after OAuth. */
async function syncUserDoc(idToken: string): Promise<void> {
  await fetch("/api/auth/sync", {
    method: "POST",
    headers: { Authorization: `Bearer ${idToken}` },
  });
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Keep __session cookie in sync with Firebase auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        const token = await firebaseUser.getIdToken();
        // SameSite=Lax (not Strict) so the cookie is sent after returning
        // from cross-site redirects like Stripe Checkout.
        const secure = location.protocol === "https:" ? "; Secure" : "";
        document.cookie = `__session=${token}; path=/; SameSite=Lax${secure}`;
      } else {
        document.cookie =
          "__session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  }, []);

  const signUp = useCallback(
    async (email: string, password: string, displayName: string) => {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, displayName }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data?.error?.message ?? "Registration failed.");
      }

      await signInWithEmailAndPassword(auth, email, password);
    },
    []
  );

  const signInWithGoogle = useCallback(async () => {
    const result = await signInWithPopup(auth, googleProvider);
    // Ensure Firestore user doc exists (idempotent — safe for returning users too)
    const token = await result.user.getIdToken();
    await syncUserDoc(token);
  }, []);

  const signOut = useCallback(async () => {
    await firebaseSignOut(auth);
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin;
    await sendPasswordResetEmail(auth, email, {
      url: `${appUrl}/login?passwordReset=1`,
    });
  }, []);

  const getIdToken = useCallback(async () => {
    if (!user) return null;
    return user.getIdToken();
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signUp,
        signInWithGoogle,
        signOut,
        resetPassword,
        getIdToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }
  return ctx;
}

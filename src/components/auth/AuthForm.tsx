"use client";

import React, { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/auth.context";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { APP_NAME } from "@/config/constants";

type AuthMode = "login" | "register" | "forgot";

interface AuthFormProps {
  mode: AuthMode;
  redirectTo?: string;
}

// Google "G" SVG logo
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z"
      />
    </svg>
  );
}

function AuthFormInner({ mode, redirectTo = "/dashboard" }: AuthFormProps) {
  const { signIn, signUp, signInWithGoogle, resetPassword } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const passwordReset = searchParams.get("passwordReset") === "1";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      if (mode === "login") {
        await signIn(email, password);
        router.push(redirectTo);
      } else if (mode === "register") {
        if (!agreedToTerms) {
          setError("You must agree to the Terms & Conditions to create an account.");
          setLoading(false);
          return;
        }
        await signUp(email, password, displayName);
        router.push(redirectTo);
      } else {
        await resetPassword(email);
        setSuccess("Password reset email sent. Check your inbox.");
      }
    } catch (err: any) {
      const msg = mapFirebaseError(err?.code) ?? err?.message ?? "Something went wrong.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    setError(null);
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
      router.push(redirectTo);
    } catch (err: any) {
      // User closed the popup — don't show an error
      if (err?.code === "auth/popup-closed-by-user" || err?.code === "auth/cancelled-popup-request") {
        return;
      }
      const msg = mapFirebaseError(err?.code) ?? err?.message ?? "Google sign-in failed.";
      setError(msg);
    } finally {
      setGoogleLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <span className="text-2xl font-bold text-brand-600">{APP_NAME}</span>
          </Link>
          <p className="mt-2 text-gray-600 text-sm">
            {mode === "login" && "Welcome back"}
            {mode === "register" && "Create your account"}
            {mode === "forgot" && "Reset your password"}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          {mode === "login" && passwordReset && (
            <Alert variant="success" className="mb-5">
              Password updated. Sign in with your new password.
            </Alert>
          )}
          {error && (
            <Alert variant="error" className="mb-5">
              {error}
            </Alert>
          )}
          {success && (
            <Alert variant="success" className="mb-5">
              {success}
            </Alert>
          )}

          {/* Google button — shown on login and register, not forgot password */}
          {mode !== "forgot" && (
            <>
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={googleLoading || loading}
                className="w-full flex items-center justify-center gap-3 px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                {googleLoading ? (
                  <svg className="h-4 w-4 animate-spin text-gray-400" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                ) : (
                  <GoogleIcon />
                )}
                Continue with Google
              </button>

              <div className="relative my-5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-white px-3 text-gray-400">or</span>
                </div>
              </div>
            </>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <Input
                label="Full name"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Jane Smith"
                required
                autoComplete="name"
              />
            )}

            <Input
              label="Email address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoComplete={mode === "register" ? "email" : "username"}
            />

            {mode !== "forgot" && (
              <Input
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === "register" ? "At least 8 characters" : "Your password"}
                required
                autoComplete={mode === "register" ? "new-password" : "current-password"}
                hint={mode === "register" ? "Minimum 8 characters." : undefined}
              />
            )}

            {mode === "login" && (
              <div className="flex justify-end">
                <Link
                  href="/forgot-password"
                  className="text-xs text-brand-600 hover:text-brand-700"
                >
                  Forgot password?
                </Link>
              </div>
            )}

            {mode === "register" && (
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500 cursor-pointer"
                />
                <span className="text-xs text-gray-600">
                  I agree to the{" "}
                  <a
                    href="/terms"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand-600 hover:text-brand-700 underline"
                  >
                    Terms &amp; Conditions
                  </a>
                </span>
              </label>
            )}

            <Button type="submit" fullWidth loading={loading} size="lg">
              {mode === "login" && "Sign in"}
              {mode === "register" && "Create account"}
              {mode === "forgot" && "Send reset email"}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-500">
            {mode === "login" && (
              <>
                Don&apos;t have an account?{" "}
                <Link href="/register" className="text-brand-600 hover:text-brand-700 font-medium">
                  Sign up
                </Link>
              </>
            )}
            {mode === "register" && (
              <>
                Already have an account?{" "}
                <Link href="/login" className="text-brand-600 hover:text-brand-700 font-medium">
                  Sign in
                </Link>
              </>
            )}
            {mode === "forgot" && (
              <>
                Remember your password?{" "}
                <Link href="/login" className="text-brand-600 hover:text-brand-700 font-medium">
                  Sign in
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function AuthForm(props: AuthFormProps) {
  return (
    <Suspense fallback={null}>
      <AuthFormInner {...props} />
    </Suspense>
  );
}

function mapFirebaseError(code?: string): string | null {
  switch (code) {
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Invalid email or password.";
    case "auth/email-already-in-use":
      return "An account with this email already exists.";
    case "auth/weak-password":
      return "Password must be at least 6 characters.";
    case "auth/too-many-requests":
      return "Too many attempts. Please try again later.";
    case "auth/network-request-failed":
      return "Network error. Check your connection.";
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/popup-blocked":
      return "Popup was blocked by your browser. Please allow popups for this site.";
    case "auth/account-exists-with-different-credential":
      return "An account already exists with this email. Try signing in with email/password.";
    default:
      return null;
  }
}

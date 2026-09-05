"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { FirebaseError } from "firebase/app";
import { auth } from "@/firebase/client";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle } from "lucide-react";

const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: "select_account" });

export function SignInWithGoogle() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSignIn() {
    setLoading(true);
    setError(null);
    try {
      await signInWithPopup(auth, provider);
      router.push("/");
    } catch (err: unknown) {
      console.error("Sign-in failed:", err);
      if (err instanceof FirebaseError) {
        if (err.code === "auth/unauthorized-domain") {
          const currentDomain = typeof window !== "undefined" ? window.location.hostname : "your domain";
          setError(`Domain not authorized. Please add "${currentDomain}" in Firebase Console → Authentication → Settings → Authorized domains.`);
        } else if (err.code === "auth/popup-closed-by-user") {
          setError("Sign-in popup closed before completing.");
        } else if (err.code === "auth/popup-blocked") {
          setError("Popup was blocked by your browser. Please allow popups for this site.");
        } else {
          setError(err.message || "Failed to sign in with Google.");
        }
      } else {
        setError("An unexpected error occurred during sign-in.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      <Button
        onClick={handleSignIn}
        disabled={loading}
        size="lg"
        className="flex items-center gap-3 rounded-md bg-neutral-950 px-6 py-3 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-60 cursor-pointer"
        aria-label="Sign in with your Google account"
      >
        {loading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src="/g_logo.png"
            alt=""
            aria-hidden="true"
            className="h-5 w-5 object-contain"
          />
        )}
        <span>{loading ? "Signing in..." : "Sign in with Google"}</span>
      </Button>

      {error && (
        <div className="flex max-w-md items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-left text-xs text-red-500">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}

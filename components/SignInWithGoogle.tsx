"use client";

import { useRouter } from "next/navigation";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth } from "@/firebase/client";
import { Button } from "@/components/ui/button";

const provider = new GoogleAuthProvider();

export function SignInWithGoogle() {
  const router = useRouter();

  async function handleSignIn() {
    try {
      await signInWithPopup(auth, provider);
      router.push("/");
    } catch (error) {
      console.error("Sign-in failed:", error);
    }
  }

  return (
    <Button
      onClick={handleSignIn}
      size="lg"
      className="flex items-center gap-3 rounded-md bg-neutral-950 px-6 py-3 text-sm font-medium text-white hover:bg-neutral-800"
      aria-label="Sign in with your Google account"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/g_logo.png"
        alt=""
        aria-hidden="true"
        className="h-5 w-5 object-contain"
      />
      <span>Sign in with Google</span>
    </Button>
  );
}

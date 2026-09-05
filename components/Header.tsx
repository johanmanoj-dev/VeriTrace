"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/firebase/client";
import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";

export function Header() {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [signOutModalOpen, setSignOutModalOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function handleSignOut() {
    setIsSigningOut(true);
    try {
      await signOut(auth);
      setSignOutModalOpen(false);
      router.push("/login");
    } finally {
      setIsSigningOut(false);
    }
  }

  return (
    <header className="border-b border-neutral-200/80 bg-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-10">
        {/* Brand Logo & Name */}
        <Link
          href="/"
          className="flex items-center transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2"
          aria-label="VeriTrace home"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt="VeriTrace — Verify, Understand, Trace"
            className="h-8 md:h-9 w-auto object-contain"
          />
        </Link>

        {/* Center Nav Links */}
        <nav aria-label="Main navigation" className="flex items-center gap-8 text-[13.5px]">
          <Link
            href="/"
            className={`transition-colors hover:text-neutral-950 ${
              pathname === "/" ? "font-medium text-neutral-950" : "text-neutral-600"
            }`}
          >
            Analyze
          </Link>
          <Link
            href="/reports"
            className={`transition-colors hover:text-neutral-950 ${
              pathname.startsWith("/reports") || pathname.startsWith("/history")
                ? "font-medium text-neutral-950"
                : "text-neutral-600"
            }`}
          >
            Reports
          </Link>
          <Link
            href="/how-it-works"
            className={`transition-colors hover:text-neutral-950 ${
              pathname === "/how-it-works" ? "font-medium text-neutral-950" : "text-neutral-600"
            }`}
          >
            How it works
          </Link>
        </nav>

        {/* Right Nav Action */}
        <div className="flex items-center gap-3">
          {!loading && user ? (
            <div className="flex items-center gap-3">
              {user.photoURL ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.photoURL}
                  alt={`${user.displayName ?? "User"} avatar`}
                  width={30}
                  height={30}
                  className="rounded-full border border-neutral-200 object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-neutral-900 text-xs text-white">
                  {user.email?.charAt(0).toUpperCase() ?? "U"}
                </div>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSignOutModalOpen(true)}
                className="h-8 border-neutral-200 px-3 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
              >
                Sign out
              </Button>
            </div>
          ) : (
            <Link href="/login">
              <Button
                variant="outline"
                size="sm"
                className="h-8 rounded-md border-neutral-300 px-4 text-xs font-medium text-neutral-800 shadow-none hover:bg-neutral-50"
              >
                Sign in
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Sign Out Confirmation Modal */}
      {signOutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-xl border border-neutral-200 bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <h3 className="text-base font-semibold text-neutral-950">Sign out of VeriTrace?</h3>
            <p className="mt-2 text-xs leading-relaxed text-neutral-600">
              You will need to sign in again with your Google account to verify new media or access your reports workspace.
            </p>
            <div className="mt-6 flex justify-end gap-2.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSignOutModalOpen(false)}
                className="h-8 border-neutral-200 px-3.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={isSigningOut}
                onClick={handleSignOut}
                className="h-8 rounded-md bg-neutral-950 px-3.5 text-xs font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
              >
                {isSigningOut ? "Signing out..." : "Sign out"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

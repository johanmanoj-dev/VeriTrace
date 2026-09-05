"use client";

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

  async function handleSignOut() {
    await signOut(auth);
    router.push("/login");
  }

  return (
    <header className="border-b border-neutral-200/80 bg-white">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        {/* Brand Logo & Name */}
        <Link
          href="/"
          className="flex items-center gap-2.5 text-base font-semibold tracking-tight text-neutral-900 transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2"
          aria-label="VeriTrace home"
        >
          {/* Green dot icon matching reference */}
          <span className="flex h-5 w-5 items-center justify-center rounded-full border border-emerald-700/30 bg-emerald-950 text-emerald-400">
            <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
          </span>
          <span className="text-[17px] font-semibold text-neutral-950">VeriTrace</span>
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
          <a
            href="#how-it-works"
            className="text-neutral-600 transition-colors hover:text-neutral-950"
          >
            How it works
          </a>
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
                onClick={handleSignOut}
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
    </header>
  );
}

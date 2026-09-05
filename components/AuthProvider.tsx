"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "@/firebase/client";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
};

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);

      // Sync a lightweight cookie so Next.js middleware can gate routes at the edge.
      // This is NOT the full ID token — just a presence signal. The actual auth
      // check in API routes uses the Authorization header Bearer token.
      if (firebaseUser) {
        document.cookie = "__session=1; path=/; SameSite=Lax";
      } else {
        document.cookie = "__session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      }
    });
    return unsubscribe;
  }, []);

  return <AuthContext.Provider value={{ user, loading }}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}

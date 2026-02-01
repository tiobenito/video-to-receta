"use client";

import { SessionProvider, useSession, signIn } from "next-auth/react";
import { ReactNode, useEffect } from "react";

interface AuthProviderProps {
  children: ReactNode;
}

// Auto-login on localhost
function AutoDevLogin({ children }: { children: ReactNode }) {
  const { status } = useSession();

  useEffect(() => {
    // Only auto-login on localhost and when not already authenticated/loading
    if (
      typeof window !== "undefined" &&
      (window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1") &&
      status === "unauthenticated"
    ) {
      // Auto sign in with dev credentials
      signIn("dev-login", { redirect: false });
    }
  }, [status]);

  return <>{children}</>;
}

export function AuthProvider({ children }: AuthProviderProps) {
  return (
    <SessionProvider>
      <AutoDevLogin>{children}</AutoDevLogin>
    </SessionProvider>
  );
}

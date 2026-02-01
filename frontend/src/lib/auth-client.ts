"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import { DEV_USER } from "@/types/auth";

// Check if running on localhost
export function isLocalhost(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
  );
}

// Dev login - automatically signs in as dev user
export async function devLogin() {
  if (!isLocalhost()) {
    console.warn("Dev login only available on localhost");
    return;
  }
  await signIn("dev-login", { redirect: false });
}

// Google login
export async function googleLogin() {
  await signIn("google");
}

// Logout
export async function logout() {
  await signOut({ redirect: false });
}

// Hook to get current user with dev bypass
export function useAuth() {
  const { data: session, status } = useSession();

  return {
    user: session?.user ?? null,
    isLoading: status === "loading",
    isAuthenticated: status === "authenticated",
    isLocalhost: isLocalhost(),
  };
}

// Re-export for convenience
export { useSession, signIn, signOut };

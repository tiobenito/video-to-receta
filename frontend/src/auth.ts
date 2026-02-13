import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { DEV_USER } from "@/types/auth";

// Comma-separated list of allowed Google emails
const ALLOWED_EMAILS = (
  process.env.ALLOWED_EMAILS || "benbattles7@gmail.com,elewarman@gmail.com"
)
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    // Google OAuth for production
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    // Dev credentials provider - only works in development
    Credentials({
      id: "dev-login",
      name: "Dev Login",
      credentials: {},
      async authorize() {
        // Only allow in development
        if (process.env.NODE_ENV !== "development") {
          return null;
        }
        return DEV_USER;
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      // Always allow dev login
      if (account?.provider === "dev-login") return true;
      // Check email whitelist for Google OAuth
      if (!user.email) return false;
      if (ALLOWED_EMAILS.length === 0) return true; // No whitelist = allow all (dev convenience)
      return ALLOWED_EMAILS.includes(user.email.toLowerCase());
    },
    authorized({ auth }) {
      return !!auth?.user;
    },
    async session({ session, token }) {
      // Add user id to session
      if (token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  // Trust localhost in development
  trustHost: true,
});

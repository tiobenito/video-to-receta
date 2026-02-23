import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { DEV_USER } from "@/types/auth";

// Build providers list conditionally
const providers = [];

// Google OAuth — only if credentials are configured
if (process.env.GOOGLE_CLIENT_ID) {
  providers.push(
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  );
}

// Dev credentials provider — only works in development
providers.push(
  Credentials({
    id: "dev-login",
    name: "Dev Login",
    credentials: {},
    async authorize() {
      if (process.env.NODE_ENV !== "development") {
        return null;
      }
      return DEV_USER;
    },
  })
);

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers,
  callbacks: {
    async signIn({ account }) {
      // Always allow dev login
      if (account?.provider === "dev-login") return true;
      // Allow all Google users (no whitelist in demo mode)
      return true;
    },
    authorized({ auth }) {
      // Allow all access — no auth required for demo mode
      return true;
    },
    async session({ session, token }) {
      if (token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  trustHost: true,
});

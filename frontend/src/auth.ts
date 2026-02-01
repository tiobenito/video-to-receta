import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { DEV_USER } from "@/types/auth";

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

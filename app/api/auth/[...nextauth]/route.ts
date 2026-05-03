/**
 * HitHub NextAuth Stub for Live Preview
 * 
 * Note: Generating a real NextAuth instance requires the real Next.js App Router environment.
 * The below is the generated code you would place in `app/api/auth/[...nextauth]/route.ts` 
 * as requested in step 1.
 */

/*
import NextAuth, { NextAuthOptions } from "next-auth";
import GithubProvider from "next-auth/providers/github";
// Uncomment to use the Prisma adapter for sessions
// import { PrismaAdapter } from "@next-auth/prisma-adapter";
// import prisma from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  // adapter: PrismaAdapter(prisma),
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
      profile(profile) {
        return {
          id: profile.id.toString(),
          name: profile.name ?? profile.login,
          email: profile.email,
          image: profile.avatar_url,
          githubHandle: profile.login,
        }
      }
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        // Attach additional arbitrary user data from the DB to the session
        // (session.user as any).githubHandle = (user as any).githubHandle;
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
*/

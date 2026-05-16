import NextAuth from "next-auth";
import GithubProvider from "next-auth/providers/github";
import { prisma } from "@/lib/db";

const handler = NextAuth({
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID || "",
      clientSecret: process.env.GITHUB_SECRET || "",
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/",
    error: "/",
  },
  callbacks: {
    async signIn({ user, account, profile }: any) {
      try {
        const email = user.email || `${profile?.id || profile?.login}@github.com`;
        const name = user.name || profile?.name || profile?.login || "GitHub User";
        const image = user.image || profile?.avatar_url || null;
        const githubUsername = profile?.login || null;

        // Upsert user in our database
        await prisma.user.upsert({
          where: { email },
          update: {
            name,
            image,
            githubToken: account?.access_token || null,
          },
          create: {
            email,
            name,
            image,
            githubToken: account?.access_token || null,
          },
        });
        return true;
      } catch (e: any) {
        console.error("SignIn callback error:", e.message);
        return true; // still allow sign in even if DB fails
      }
    },
    async jwt({ token, account, profile }: any) {
      if (account) {
        token.accessToken = account.access_token;
        token.githubLogin = profile?.login;
      }
      return token;
    },
    async session({ session, token }: any) {
      session.accessToken = token.accessToken;
      session.githubLogin = token.githubLogin;
      return session;
    },
  },
  events: {
    async signIn({ user }: any) {
      console.log("[AUTH] User signed in:", user.email);
    },
    async signOut({ token }: any) {
      console.log("[AUTH] User signed out");
    },
  },
});

export { handler as GET, handler as POST };

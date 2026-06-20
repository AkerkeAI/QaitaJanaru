import NextAuth, { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      needsProfileCompletion?: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    needsProfileCompletion?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    needsProfileCompletion?: boolean;
  }
}
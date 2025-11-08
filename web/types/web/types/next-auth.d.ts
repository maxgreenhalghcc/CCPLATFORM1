import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    apiToken?: string;
    user: {
      id: string;
      role?: string;
      barId?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

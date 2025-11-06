import NextAuth from "next-auth";
import EmailProvider from "next-auth/providers/email";

export const authOptions = {
  providers: [
    EmailProvider({
      // Use JSON transport by default — prints the magic link in the web terminal
      server: process.env.EMAIL_SERVER
        ? JSON.parse(process.env.EMAIL_SERVER)
        : { jsonTransport: true },

      // Make sure "from" is always defined
      from: process.env.EMAIL_FROM ?? "no-reply@localhost",
      maxAge: 10 * 60, // 10 minutes
    }),
  ],
  pages: { signIn: "/login" },
  debug: process.env.NEXTAUTH_DEBUG === "1",
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };

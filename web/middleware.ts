export { default } from "next-auth/middleware";

// Only gate the app areas that require auth.
// Do NOT include /login or /api/auth in the matcher.
export const config = {
  matcher: ["/admin/:path*", "/staff/:path*"],
};


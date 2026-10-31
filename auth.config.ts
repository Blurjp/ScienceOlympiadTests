import type { NextAuthConfig } from "next-auth"

// Skip auth in local development
const isDev = process.env.NODE_ENV === "development"

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      // Bypass auth in development mode
      if (isDev) return true

      const isLoggedIn = !!auth?.user
      const isOnDashboard = nextUrl.pathname.startsWith("/dashboard")
      const isOnProfile = nextUrl.pathname.startsWith("/profile")
      const isOnGenerate = nextUrl.pathname.startsWith("/generate")

      // Protect dashboard, profile, and generate routes. /import stays a
      // public landing page (it explains PDF import and links to sign-in);
      // the URL-import action is protected server-side by
      // /api/download-pdf (and /api/generate-from-pdf), which 401 anonymous
      // callers.
      if (isOnDashboard || isOnProfile || isOnGenerate) {
        if (isLoggedIn) return true
        return false // Redirect unauthenticated users to login page
      }

      return true
    },
  },
  providers: [], // Add providers with an empty array for now
} satisfies NextAuthConfig

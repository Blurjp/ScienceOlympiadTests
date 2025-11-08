import type { NextAuthConfig } from "next-auth"

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isOnDashboard = nextUrl.pathname.startsWith("/dashboard")
      const isOnProfile = nextUrl.pathname.startsWith("/profile")
      const isOnGenerate = nextUrl.pathname.startsWith("/generate")
      const isOnImport = nextUrl.pathname.startsWith("/import")

      // Protect dashboard, profile, generate, and import routes
      if (isOnDashboard || isOnProfile || isOnGenerate || isOnImport) {
        if (isLoggedIn) return true
        return false // Redirect unauthenticated users to login page
      }

      return true
    },
  },
  providers: [], // Add providers with an empty array for now
} satisfies NextAuthConfig

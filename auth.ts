import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import { createUser, getUserByEmail, getSubscriptionStatus } from "@/lib/database"

// How often the JWT's subscription status is refreshed from the database.
// Without this, plan changes made via Stripe webhooks (upgrade, cancel,
// downgrade at period end) would not appear until the user signs in again.
const SUBSCRIPTION_REFRESH_MS = 60_000

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  trustHost: true,
  callbacks: {
    async signIn({ user, account }) {
      if (!user.email) return false

      try {
        // Check if user exists
        let existingUser = await getUserByEmail(user.email)

        if (!existingUser) {
          // Create new user
          existingUser = await createUser({
            id: user.id || crypto.randomUUID(),
            email: user.email,
            name: user.name || undefined,
            image: user.image || undefined,
            provider: account?.provider,
            providerAccountId: account?.providerAccountId,
          })
        }

        return true
      } catch (error) {
        console.error("Error during sign in:", error)
        // Still allow sign in even if DB fails - user data will be in token
        return true
      }
    },
    async jwt({ token, user, trigger }) {
      if (user) {
        // Set basic info from OAuth provider
        token.id = user.id
        token.email = user.email
        token.name = user.name
        token.picture = user.image
        token.subscriptionStatus = 'free'
        token.isPro = false
        token.subscriptionIsSeason = false

        // Try to get additional info from DB
        try {
          const dbUser = await getUserByEmail(user.email!)
          if (dbUser) {
            token.id = dbUser.id
            token.subscriptionStatus = dbUser.subscriptionStatus || 'free'
            token.isPro = dbUser.subscriptionStatus === 'active'
            // Active with no Stripe subscription object = Season Pass
            token.subscriptionIsSeason = token.isPro && !dbUser.subscriptionId
          }
        } catch (error) {
          console.error("Error fetching user from DB:", error)
          // Continue with OAuth data
        }
        token.subscriptionCheckedAt = Date.now()
      }

      // Refresh subscription status from the DB when stale (throttled), on
      // session update, or when never checked. Uses getSubscriptionStatus so
      // Season Pass expiry is applied at read time, keeping the token accurate.
      const lastCheckedAt = (token.subscriptionCheckedAt as number) || 0
      if (
        token.email &&
        (trigger === 'update' || Date.now() - lastCheckedAt > SUBSCRIPTION_REFRESH_MS)
      ) {
        try {
          const dbUser = await getUserByEmail(token.email as string)
          if (dbUser) {
            const status = await getSubscriptionStatus(dbUser.id)
            token.subscriptionStatus = status
            token.isPro = status === 'active'
            // Active with no Stripe subscription object = Season Pass
            token.subscriptionIsSeason = token.isPro && !dbUser.subscriptionId
          }
          token.subscriptionCheckedAt = Date.now()
        } catch (error) {
          console.error("Error refreshing subscription status:", error)
        }
      }

      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string || token.sub || ""
        session.user.email = token.email as string || ""
        session.user.name = token.name as string || ""
        session.user.image = token.picture as string || ""
        session.user.subscriptionStatus = (token.subscriptionStatus as 'free' | 'active' | 'canceled' | 'past_due') || 'free'
        session.user.isPro = token.isPro as boolean || false
        session.user.subscriptionIsSeason = token.subscriptionIsSeason as boolean || false
      }
      return session
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
})

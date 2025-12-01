import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import { createUser, getUserByEmail } from "@/lib/database"

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
    async jwt({ token, user }) {
      if (user) {
        // Set basic info from OAuth provider
        token.id = user.id
        token.email = user.email
        token.name = user.name
        token.picture = user.image

        // Try to get additional info from DB
        try {
          const dbUser = await getUserByEmail(user.email!)
          if (dbUser) {
            token.id = dbUser.id
          }
        } catch (error) {
          console.error("Error fetching user from DB:", error)
          // Continue with OAuth data
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

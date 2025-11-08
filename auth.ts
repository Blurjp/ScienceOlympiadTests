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
  callbacks: {
    async signIn({ user, account, profile }) {
      if (!user.email) return false

      try {
        // Check if user exists
        let existingUser = getUserByEmail(user.email)

        if (!existingUser) {
          // Create new user
          existingUser = createUser({
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
        return false
      }
    },
    async jwt({ token, user, account }) {
      if (user) {
        const dbUser = getUserByEmail(user.email!)
        if (dbUser) {
          token.id = dbUser.id
          token.email = dbUser.email
          token.name = dbUser.name
          token.picture = dbUser.image
        }
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.email = token.email as string
        session.user.name = token.name as string
        session.user.image = token.picture as string
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

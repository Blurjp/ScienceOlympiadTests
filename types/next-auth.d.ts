import NextAuth, { DefaultSession } from "next-auth"
import { SubscriptionStatus } from "@/lib/database"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      subscriptionStatus: SubscriptionStatus
      isPro: boolean
    } & DefaultSession["user"]
  }

  interface User {
    id: string
    email: string
    name?: string
    image?: string
    subscriptionStatus?: SubscriptionStatus
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    subscriptionStatus: SubscriptionStatus
    isPro: boolean
  }
}

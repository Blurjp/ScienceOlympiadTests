import { auth } from "@/auth"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { User, LogOut, Upload, Crown, Sparkles } from "lucide-react"
import { HomeNavLink, HomeLogo } from "./home-nav-link"

export default async function Header() {
  const session = await auth()

  return (
    <header className="border-b bg-white shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <HomeLogo />

            <nav className="hidden md:flex space-x-6">
              <HomeNavLink />
              {session && (
                <Link
                  href="/import"
                  className="text-gray-700 hover:text-blue-600 transition-colors flex items-center"
                >
                  <Upload className="w-4 h-4 mr-1" />
                  Import
                </Link>
              )}
              <Link
                href="/pricing"
                className="text-gray-700 hover:text-blue-600 transition-colors flex items-center"
              >
                <Sparkles className="w-4 h-4 mr-1" />
                Pricing
              </Link>
            </nav>
          </div>

          <div className="flex items-center space-x-4">
            {session?.user ? (
              <>
                <Link href="/profile">
                  <Button variant="ghost" className="flex items-center space-x-2">
                    {session.user.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={session.user.image}
                        alt={session.user.name || "User"}
                        className="w-6 h-6 rounded-full"
                      />
                    ) : (
                      <User className="w-4 h-4" />
                    )}
                    <span className="hidden sm:inline">{session.user.name || "Profile"}</span>
                    {session.user.isPro && (
                      <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs px-1.5 py-0">
                        <Crown className="w-3 h-3 mr-0.5" />
                        Pro
                      </Badge>
                    )}
                  </Button>
                </Link>
                <form action="/api/auth/signout" method="POST">
                  <Button variant="outline" size="sm" type="submit">
                    <LogOut className="w-4 h-4 mr-2" />
                    <span className="hidden sm:inline">Sign Out</span>
                  </Button>
                </form>
              </>
            ) : (
              <Link href="/login">
                <Button>
                  <User className="w-4 h-4 mr-2" />
                  Sign In
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LogOut, User, Mail, Calendar } from "lucide-react"
import { getUserById } from "@/lib/database"

export default async function ProfilePage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  const dbUser = getUserById(session.user.id)

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Profile</h1>
        <p className="text-gray-600">Manage your account settings and preferences</p>
      </div>

      <div className="grid gap-6">
        {/* User Information Card */}
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>Your personal details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-4">
              {session.user.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={session.user.image}
                  alt={session.user.name || "User"}
                  className="w-20 h-20 rounded-full"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center">
                  <User className="w-10 h-10 text-blue-600" />
                </div>
              )}
              <div>
                <h3 className="text-xl font-semibold">{session.user.name}</h3>
                <p className="text-gray-600">{session.user.email}</p>
              </div>
            </div>

            <div className="border-t pt-4 space-y-2">
              <div className="flex items-center text-sm">
                <Mail className="w-4 h-4 mr-2 text-gray-500" />
                <span className="font-medium mr-2">Email:</span>
                <span>{session.user.email}</span>
              </div>
              <div className="flex items-center text-sm">
                <User className="w-4 h-4 mr-2 text-gray-500" />
                <span className="font-medium mr-2">Provider:</span>
                <span className="capitalize">{dbUser?.provider || "Google"}</span>
              </div>
              <div className="flex items-center text-sm">
                <Calendar className="w-4 h-4 mr-2 text-gray-500" />
                <span className="font-medium mr-2">User ID:</span>
                <span className="font-mono text-xs">{session.user.id}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Statistics Card - Placeholder for future */}
        <Card>
          <CardHeader>
            <CardTitle>Your Statistics</CardTitle>
            <CardDescription>Track your progress and achievements</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">0</div>
                <div className="text-sm text-gray-600">Tests Completed</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">0%</div>
                <div className="text-sm text-gray-600">Average Score</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">0</div>
                <div className="text-sm text-gray-600">Tests Created</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Account Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <form action="/api/auth/signout" method="POST">
              <Button type="submit" variant="destructive" className="w-full">
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
